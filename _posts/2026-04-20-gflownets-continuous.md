---
layout: distill
title: Continuous GFlowNets, in your browser
description: An interactive tour of sampling a continuous mixture distribution with Trajectory Balance — the pedagogical bug, mode collapse, and the off-policy fix.
date: 2026-04-20
published: true
authors:
  - name: Joseph Viviano
    url: https://viviano.ca
    affiliations:
      name: Independent
bibliography: 2026-04-20-gflownets-continuous.bib
toc:
  - name: The setup
  - name: A happy case
  - name: The pedagogical bug
  - name: Mode collapse
  - name: Off-policy exploration
  - name: A harder case
  - name: On temperature
_styles: >
---

<script defer src="{{ '/assets/js/gflownet-demo.js' | relative_url }}"></script>

Most introductions to GFlowNets target the discrete case. This post walks through the continuous version — sampling real numbers proportional to a reward — using a tiny pretrained policy that runs entirely in your browser. Every plot below is live: drag the temperature slider to rescale the action noise at sampling time, hit **resample** to draw a new batch.

The example is adapted from the [continuous intro notebook](https://github.com/GFNOrg/torchgfn/blob/master/tutorials/notebooks/intro_continuous.ipynb) in `torchgfn`. The training script that produced the models on this page lives at [`scripts/train_distill_gflownets.py`](https://github.com/josephdviviano/josephdviviano.github.io/blob/master/scripts/train_distill_gflownets.py) — run it yourself to regenerate them.

## The setup

The target is a mixture of two Gaussians on the real line. We start from $S_0 = 0$ and take $N = 5$ steps, each adding a scalar action $\Delta x \sim \mathcal{N}(\mu(s), \sigma(s))$ whose parameters come from a small MLP. The state is $(x, t)$ — we carry the step counter so the space stays acyclic.

The model is a 2-layer MLP (hidden dim 64), about 4.4K parameters. It emits two numbers per state: a mean and a pre-sigmoid standard deviation that we squash into $[0.1, 1.0]$. Nothing exotic.

Here is the reward landscape. Dashed lines mark the modes; the yellow dot is $S_0$:

<d-figure>
<div class="gfn-demo-mount"
     data-model-url=""
     data-env-mus="-1,1"
     data-env-variances="0.2,0.2"
     data-env-init="0"
     data-trajectory-length="5"
     data-n-trajectories="2000"
     data-default-temperature="1"></div>
</d-figure>

Before the real models load you will see samples drawn from a placeholder policy with $\mu = 0, \sigma = 0.3$. Once the ONNX files are deployed, the histogram should concentrate around the two modes.

## A happy case

The first model was trained with Trajectory Balance <d-cite key="malkin2022trajectory"></d-cite> on this easy environment, with the *correct* backward-probability loop (we will get to the bug in a moment). At temperature 1, the histogram of final states should track the reward curve pretty closely.

<d-figure>
<div class="gfn-demo-mount"
     data-model-url="{{ '/assets/models/gflownets/easy_correct.onnx' | relative_url }}"
     data-env-mus="-1,1"
     data-env-variances="0.2,0.2"
     data-env-init="0"
     data-trajectory-length="5"
     data-default-temperature="1"></div>
</d-figure>

Slide the temperature down toward 0 and the samples concentrate on the highest-reward regions (this is the GFlowNet-as-argmax limit). Push it past 1 and the distribution flattens — you are effectively doing a noisier version of the learned policy.

## The pedagogical bug

The Trajectory Balance loss requires matching the forward-trajectory log-probability $\log P_F(\tau)$ with the backward $\log P_B(\tau)$:

$$
\mathcal{L}(\tau) = \left( \log Z_\theta + \sum_t \log P_F(s_{t+1} \mid s_t) - \log R(x) - \sum_t \log P_B(s_t \mid s_{t+1}) \right)^2.
$$

In our setup the very last backward transition, $S_1 \to S_0$, is **forced** — all trajectories start at the same $S_0$, so under any backward policy that reaches $S_1$, the probability of stepping to $S_0$ is 1, i.e.\ log-probability 0. If you accidentally include that transition in the $\log P_B$ sum, you end up training a backward network to concentrate mass on a specific, arbitrary Δ, which distorts the gradient. The symptom: samples look *almost right* but skewed.

Below is the same environment with a model trained with that bug in the backward loop:

<d-figure>
<div class="gfn-demo-mount"
     data-model-url="{{ '/assets/models/gflownets/easy_buggy.onnx' | relative_url }}"
     data-env-mus="-1,1"
     data-env-variances="0.2,0.2"
     data-env-init="0"
     data-trajectory-length="5"
     data-default-temperature="1"></div>
</d-figure>

The fix in the training loop is a one-character change: iterate the backward loop over `range(N, 1, -1)` instead of `range(N, 0, -1)`. The last (forced) transition then correctly contributes 0 to $\log P_B$ without being sampled.

## Mode collapse

Things get harder when the modes are far from $S_0$. Below, the modes are at $\pm 3$, still with trajectory length 5. On-policy training — sampling actions only from the *current* learned policy — gets stuck early on whichever mode the initial exploration happens to stumble into:

<d-figure>
<div class="gfn-demo-mount"
     data-model-url="{{ '/assets/models/gflownets/hard_on_policy.onnx' | relative_url }}"
     data-env-mus="-3,3"
     data-env-variances="0.2,0.2"
     data-env-init="0"
     data-trajectory-length="5"
     data-default-temperature="1"></div>
</d-figure>

The histogram at $T = 1$ should sit almost entirely on one side. Cranking the temperature up diffuses the samples, but it does not rescue the other mode — the policy simply never learned it.

## Off-policy exploration

The fix is to sample *training* actions from a noisier distribution than the current policy. Concretely: keep the same learned $(\mu, \sigma)$, but inflate $\sigma$ by a schedule that starts at 2 and linearly decays to 0 over training. The forward log-probability is still evaluated under the learned policy (not the exploration policy — that would bias the gradient), but the sampled trajectories now cover both modes:

<d-figure>
<div class="gfn-demo-mount"
     data-model-url="{{ '/assets/models/gflownets/hard_off_policy.onnx' | relative_url }}"
     data-env-mus="-3,3"
     data-env-variances="0.2,0.2"
     data-env-init="0"
     data-trajectory-length="5"
     data-default-temperature="1"></div>
</d-figure>

Same architecture, same number of iterations, just a different sampling distribution during rollout.

## A harder case

Four modes with varying scales, $S_0$ closest to the first mode, 10K iterations. This one is deliberately at the edge of what the default hyperparameters can solve — the tallest modes get learned first, and the small, far-away mode often remains undersampled:

<d-figure>
<div class="gfn-demo-mount"
     data-model-url="{{ '/assets/models/gflownets/four_mode.onnx' | relative_url }}"
     data-env-mus="-3,4,6,10"
     data-env-variances="0.2,0.4,1,0.2"
     data-env-init="0"
     data-trajectory-length="5"
     data-default-temperature="1"></div>
</d-figure>

Longer trajectories, more iterations, or a non-constant exploration schedule would all help here. The takeaway is that continuous GFlowNets scale with trajectory length, not with the number of modes directly.

## On temperature

The slider on each demo multiplies the per-step $\sigma$ at sampling time — it has no effect on what was learned, only on how we draw from it. A few things to notice:

- At $T = 1$ you get the distribution the policy was trained to represent (ideally, proportional to the reward).
- At $T \to 0$ the policy becomes deterministic and you see the $\mu(s)$ trajectory repeatedly — effectively a greedy sample of the highest-probability path.
- At $T > 1$ the per-step variance grows, which compounds across steps: for a trajectory of length $N$, final-state variance scales roughly with $N T^2$ (for a trained policy with similar per-step $\sigma$).
- For the mode-collapsed model, no temperature can recover the missing mode. Exploration at *training* time is a separate concern from exploration at sampling time.

Temperature-tempering of a trained GFlowNet is the continuous analogue of the standard tempered-sampling trick. It is cheap, deterministic, and often enough to push a well-trained policy toward whichever end of the exploration-exploitation axis you need at inference.
