"""
Train the continuous GFlowNet forward policies for the Distill post at
_posts/2026-04-20-gflownets-continuous.md. Exports each to ONNX so the
browser can sample from them via ONNX Runtime Web.

Adapted from the self-contained example at the end of:
  https://github.com/GFNOrg/torchgfn/blob/master/tutorials/notebooks/intro_continuous.ipynb

Run from the repo root:
    python3 scripts/train_distill_gflownets.py

Requires: torch, numpy, onnx, onnxruntime (for verification).
"""

from __future__ import annotations

import math
import random
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
import torch
import torch.nn as nn
from torch.distributions import Normal


# ---------- hyperparameters shared across all runs ----------

BATCH_SIZE = 256
HID_DIM = 64
LR_MODEL = 1e-3
LR_LOGZ = 1e-1
MIN_POLICY_STD = 0.1
MAX_POLICY_STD = 1.0
SEED = 4444

OUT_DIR = Path(__file__).resolve().parent.parent / "assets" / "models" / "gflownets"


# ---------- environment ----------


class LineEnvironment:
    def __init__(self, mus, variances, n_sd, init_value):
        self.mus = torch.tensor(mus, dtype=torch.float32)
        self.sigmas = torch.tensor([math.sqrt(v) for v in variances], dtype=torch.float32)
        self.mixture = [Normal(m, s) for m, s in zip(self.mus, self.sigmas)]
        self.n_sd = n_sd
        self.init_value = float(init_value)

    def log_reward(self, x):
        return torch.logsumexp(torch.stack([m.log_prob(x) for m in self.mixture], 0), 0)


# ---------- model ----------


def make_mlp(hid_dim=HID_DIM):
    return nn.Sequential(
        nn.Linear(2, hid_dim),
        nn.ELU(),
        nn.Linear(hid_dim, hid_dim),
        nn.ELU(),
        nn.Linear(hid_dim, 2),
    )


class PolicyWrapper(nn.Module):
    """Wraps an MLP so the exported ONNX emits (mu, sigma) with sigma
    already clipped into [min_std, max_std]. The browser can then sample
    Normal(mu, sigma * temperature) without reimplementing the transform."""

    def __init__(self, mlp, min_std=MIN_POLICY_STD, max_std=MAX_POLICY_STD):
        super().__init__()
        self.mlp = mlp
        self.min_std = min_std
        self.max_std = max_std

    def forward(self, state):
        out = self.mlp(state)
        mu = out[:, 0:1]
        raw_sigma = out[:, 1:2]
        sigma = torch.sigmoid(raw_sigma) * (self.max_std - self.min_std) + self.min_std
        return torch.cat([mu, sigma], dim=1)


# ---------- training ----------


def seed_all(seed):
    torch.manual_seed(seed)
    random.seed(seed)
    np.random.seed(seed)
    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False


def get_policy_dist(model, x):
    params = model(x)
    mu = params[:, 0]
    raw_sigma = params[:, 1]
    sigma = torch.sigmoid(raw_sigma) * (MAX_POLICY_STD - MIN_POLICY_STD) + MIN_POLICY_STD
    return Normal(mu, sigma)


def train(
    env: LineEnvironment,
    trajectory_length: int,
    n_iterations: int,
    init_exploration_noise: float = 0.0,
    buggy_pb: bool = False,
    device: torch.device | None = None,
):
    device = device or torch.device("cpu")
    seed_all(SEED)

    forward_model = make_mlp().to(device)
    backward_model = make_mlp().to(device)
    logZ = nn.Parameter(torch.tensor(0.0, device=device))

    optimizer = torch.optim.Adam(
        [
            {"params": forward_model.parameters(), "lr": LR_MODEL},
            {"params": backward_model.parameters(), "lr": LR_MODEL},
            {"params": [logZ], "lr": LR_LOGZ},
        ]
    )

    exploration_schedule = np.linspace(init_exploration_noise, 0, n_iterations)

    for it in range(n_iterations):
        optimizer.zero_grad()

        x = torch.zeros((BATCH_SIZE, 2), device=device)
        x[:, 0] = env.init_value

        trajectory = torch.zeros((BATCH_SIZE, trajectory_length + 1, 2), device=device)
        trajectory[:, 0, 0] = env.init_value
        logPF = torch.zeros(BATCH_SIZE, device=device)
        logPB = torch.zeros(BATCH_SIZE, device=device)

        for t in range(trajectory_length):
            policy_dist = get_policy_dist(forward_model, x)
            if init_exploration_noise > 0:
                expl = exploration_schedule[it]
                expl_dist = Normal(policy_dist.mean, policy_dist.stddev + expl)
                action = expl_dist.sample()
            else:
                action = policy_dist.sample()
            logPF = logPF + policy_dist.log_prob(action)

            new_x = torch.zeros_like(x)
            new_x[:, 0] = x[:, 0] + action
            new_x[:, 1] = x[:, 1] + 1
            trajectory[:, t + 1, :] = new_x
            x = new_x

        # Key pedagogical difference: buggy_pb=True iterates down to t=0,
        # double-counting the forced S_1 -> S_0 transition.
        bw_stop = 0 if buggy_pb else 1
        for t in range(trajectory_length, bw_stop, -1):
            policy_dist = get_policy_dist(backward_model, trajectory[:, t, :])
            action = trajectory[:, t, 0] - trajectory[:, t - 1, 0]
            logPB = logPB + policy_dist.log_prob(action)

        log_reward = env.log_reward(trajectory[:, -1, 0])
        loss = (logZ + logPF - logPB - log_reward).pow(2).mean()
        loss.backward()
        optimizer.step()

        if it % 500 == 0 or it == n_iterations - 1:
            print(f"  iter {it:>5d}  loss={loss.item():.3f}  logZ={logZ.item():.3f}")

    return forward_model, logZ


def export_forward(forward_model: nn.Module, out_path: Path):
    wrapper = PolicyWrapper(forward_model).eval()
    dummy = torch.tensor([[0.0, 0.0]], dtype=torch.float32)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    torch.onnx.export(
        wrapper,
        dummy,
        out_path.as_posix(),
        input_names=["state"],
        output_names=["policy"],
        dynamic_axes={"state": {0: "batch"}, "policy": {0: "batch"}},
        opset_version=17,
    )
    print(f"  -> {out_path.relative_to(Path.cwd())} ({out_path.stat().st_size:,} bytes)")


# ---------- configs ----------


@dataclass
class RunConfig:
    name: str
    env: dict
    trajectory_length: int = 5
    n_iterations: int = 5000
    init_exploration_noise: float = 0.0
    buggy_pb: bool = False
    description: str = ""


EASY_ENV = dict(mus=[-1.0, 1.0], variances=[0.2, 0.2], n_sd=4.5, init_value=0.0)
HARD_ENV = dict(mus=[-3.0, 3.0], variances=[0.2, 0.2], n_sd=4.5, init_value=0.0)
FOUR_MODE_ENV = dict(
    mus=[-3.0, 4.0, 6.0, 10.0], variances=[0.2, 0.4, 1.0, 0.2], n_sd=4.5, init_value=0.0
)


RUNS: list[RunConfig] = [
    RunConfig(
        name="easy_correct",
        env=EASY_ENV,
        n_iterations=5000,
        description="Two close modes, correct logPB. Baseline happy case.",
    ),
    RunConfig(
        name="easy_buggy",
        env=EASY_ENV,
        n_iterations=5000,
        buggy_pb=True,
        description="Same env with the logPB-loop bug: backward loop iterates to t=0.",
    ),
    RunConfig(
        name="hard_on_policy",
        env=HARD_ENV,
        n_iterations=5000,
        init_exploration_noise=0.0,
        description="Modes far from S_0, pure on-policy training. Demonstrates mode collapse.",
    ),
    RunConfig(
        name="hard_off_policy",
        env=HARD_ENV,
        n_iterations=5000,
        init_exploration_noise=2.0,
        description="Same env with off-policy exploration noise (decay 2 -> 0).",
    ),
    RunConfig(
        name="four_mode",
        env=FOUR_MODE_ENV,
        n_iterations=10000,
        init_exploration_noise=2.0,
        description="Four modes with varying scales. Harder case; may not fully converge.",
    ),
]


def main():
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"device: {device}")
    print(f"out dir: {OUT_DIR}")

    for cfg in RUNS:
        print(f"\n=== {cfg.name} ===")
        print(f"  {cfg.description}")
        env = LineEnvironment(**cfg.env)
        forward_model, _ = train(
            env=env,
            trajectory_length=cfg.trajectory_length,
            n_iterations=cfg.n_iterations,
            init_exploration_noise=cfg.init_exploration_noise,
            buggy_pb=cfg.buggy_pb,
            device=device,
        )
        export_forward(forward_model, OUT_DIR / f"{cfg.name}.onnx")

    print("\ndone.")


if __name__ == "__main__":
    main()
