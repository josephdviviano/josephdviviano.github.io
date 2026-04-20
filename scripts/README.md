# scripts/

Offline tooling for the site. Each script is self-contained and declares
its Python dependencies inline via [PEP 723](https://peps.python.org/pep-0723/)
metadata, so [`uv`](https://docs.astral.sh/uv/) can run it without a
separate `pyproject.toml` / `requirements.txt`.

## Prerequisites

Install `uv` once:

```bash
brew install uv              # macOS
# or
curl -LsSf https://astral.sh/uv/install.sh | sh
```

## Scripts

### `train_distill_gflownets.py`

Trains five tiny continuous-GFlowNet forward policies and exports each
to ONNX under `assets/models/gflownets/`. The browser-side demos on
`_posts/2026-04-20-gflownets-continuous.md` load these via ONNX Runtime
Web and sample trajectories at inference time.

```bash
uv run scripts/train_distill_gflownets.py
```

First run installs `torch`, `numpy`, `onnx`, `onnxscript` into a
cached environment under `~/.cache/uv/`. Subsequent runs reuse the
cache and start in ~1 second. Total training runtime is ~3-5 minutes
on CPU; the resulting ONNX files are ~20 KB each.

Commit the `assets/models/gflownets/*.onnx` files afterwards — they
ship with the site.
