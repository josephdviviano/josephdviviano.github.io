// Interactive continuous-GFlowNet sampling demo for the Distill post at
// _posts/2026-04-20-gflownets-continuous.md. Loads a small ONNX policy
// (PyTorch MLP: state [x, step] -> [mu, sigma]) via ONNX Runtime Web,
// samples N trajectories under Normal(mu, sigma * temperature), and
// renders reward landscape + final-state histogram + trajectory lines
// to canvas. If modelUrl is missing or fails to load, falls back to a
// DummyPolicy so the UI is testable before real ONNX files exist.

(function () {
  const ORT_VERSION = "1.18.0";
  const ORT_CDN = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist/ort.min.js`;
  const ORT_WASM = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist/`;

  let ortLoadPromise = null;

  function loadORT() {
    if (ortLoadPromise) return ortLoadPromise;
    ortLoadPromise = new Promise((resolve, reject) => {
      if (window.ort) return resolve(window.ort);
      const s = document.createElement("script");
      s.src = ORT_CDN;
      s.onload = () => {
        try {
          window.ort.env.wasm.wasmPaths = ORT_WASM;
        } catch (_) {}
        resolve(window.ort);
      };
      s.onerror = reject;
      document.head.appendChild(s);
    });
    return ortLoadPromise;
  }

  // Standard normal sample via Box-Muller.
  function randn() {
    const u1 = Math.max(Math.random(), 1e-12);
    const u2 = Math.random();
    return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  }

  class DummyPolicy {
    async run(state) {
      // Returns (mu=0, sigma=0.3) for every batch element.
      const batch = state.length / 2;
      const out = new Float32Array(batch * 2);
      for (let i = 0; i < batch; i++) {
        out[i * 2] = 0.0;
        out[i * 2 + 1] = 0.3;
      }
      return out;
    }
  }

  class OnnxPolicy {
    constructor(session) { this.session = session; }
    async run(state) {
      const batch = state.length / 2;
      const tensor = new window.ort.Tensor("float32", state, [batch, 2]);
      const out = await this.session.run({ state: tensor });
      return out.policy.data;
    }
    static async load(url) {
      const ort = await loadORT();
      const session = await ort.InferenceSession.create(url, {
        executionProviders: ["wasm"],
      });
      return new OnnxPolicy(session);
    }
  }

  async function sampleTrajectories(policy, env, nTraj, trajLen, temperature) {
    // state shape: [nTraj, 2] flattened row-major.
    const state = new Float32Array(nTraj * 2);
    for (let i = 0; i < nTraj; i++) {
      state[i * 2] = env.initValue;
      state[i * 2 + 1] = 0;
    }

    // trajectory shape: [nTraj, trajLen+1, 2] flattened.
    const T1 = trajLen + 1;
    const traj = new Float32Array(nTraj * T1 * 2);
    for (let i = 0; i < nTraj; i++) {
      traj[i * T1 * 2] = env.initValue;
      traj[i * T1 * 2 + 1] = 0;
    }

    for (let t = 0; t < trajLen; t++) {
      const pol = await policy.run(state);
      for (let i = 0; i < nTraj; i++) {
        const mu = pol[i * 2];
        const sigma = pol[i * 2 + 1];
        const action = mu + sigma * temperature * randn();
        state[i * 2] += action;
        state[i * 2 + 1] += 1;
        traj[(i * T1 + t + 1) * 2] = state[i * 2];
        traj[(i * T1 + t + 1) * 2 + 1] = state[i * 2 + 1];
      }
    }
    return traj;
  }

  function cssVar(name, fallback) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
    return v || fallback;
  }

  function envBounds(env) {
    const sigmas = env.variances.map(v => Math.sqrt(v));
    const maxSigma = Math.max(...sigmas);
    const lb = Math.min(...env.mus) - 4.5 * maxSigma;
    const ub = Math.max(...env.mus) + 4.5 * maxSigma;
    return [lb, ub];
  }

  function rewardAt(env, x) {
    let r = 0;
    for (let k = 0; k < env.mus.length; k++) {
      const mu = env.mus[k];
      const sigma = Math.sqrt(env.variances[k]);
      const coef = 1 / (sigma * Math.sqrt(2 * Math.PI));
      r += coef * Math.exp(-0.5 * Math.pow((x - mu) / sigma, 2));
    }
    return r;
  }

  class GFNDemo {
    constructor(opts) {
      this.mount = typeof opts.mount === "string" ? document.querySelector(opts.mount) : opts.mount;
      this.env = opts.env;
      this.trajLen = opts.trajectoryLength || 5;
      this.nTraj = opts.nTrajectories || 2000;
      this.temperature = opts.defaultTemperature != null ? opts.defaultTemperature : 1.0;
      this.modelUrl = opts.modelUrl;
      this.autoSample = opts.autoSample !== false;

      this.policy = null;
      this._lastTraj = null;
      this._debounce = null;

      this._buildUI();
      this._resizeCanvases();
      this._drawBackground();
      this._loadPolicy().then(() => {
        if (this.autoSample) this.sample();
      });

      window.addEventListener("resize", () => {
        this._resizeCanvases();
        this._redraw();
      });
    }

    _buildUI() {
      this.mount.classList.add("gfn-demo");
      this.mount.innerHTML = `
        <canvas class="gfn-top"></canvas>
        <canvas class="gfn-bottom"></canvas>
        <div class="gfn-controls">
          <label class="gfn-temp-label">
            temperature
            <input type="range" min="0.05" max="3" step="0.01" value="${this.temperature}" class="gfn-temp-slider">
            <span class="gfn-temp-val">${this.temperature.toFixed(2)}</span>
          </label>
          <button class="gfn-sample-btn" type="button">resample</button>
          <span class="gfn-status">loading...</span>
        </div>
      `;
      this.topCanvas = this.mount.querySelector(".gfn-top");
      this.bottomCanvas = this.mount.querySelector(".gfn-bottom");
      this.tempSlider = this.mount.querySelector(".gfn-temp-slider");
      this.tempVal = this.mount.querySelector(".gfn-temp-val");
      this.sampleBtn = this.mount.querySelector(".gfn-sample-btn");
      this.status = this.mount.querySelector(".gfn-status");

      this.tempSlider.addEventListener("input", () => {
        this.temperature = parseFloat(this.tempSlider.value);
        this.tempVal.textContent = this.temperature.toFixed(2);
        if (this.autoSample) {
          clearTimeout(this._debounce);
          this._debounce = setTimeout(() => this.sample(), 120);
        }
      });

      this.sampleBtn.addEventListener("click", () => this.sample());
      this.sampleBtn.disabled = true;
    }

    _resizeCanvases() {
      const dpr = window.devicePixelRatio || 1;
      const W = Math.max(320, this.mount.clientWidth);
      const topH = 180;
      const botH = 140;
      for (const [c, h] of [[this.topCanvas, topH], [this.bottomCanvas, botH]]) {
        c.style.width = W + "px";
        c.style.height = h + "px";
        c.width = W * dpr;
        c.height = h * dpr;
        const ctx = c.getContext("2d");
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      }
      this._W = W;
      this._topH = topH;
      this._botH = botH;
    }

    async _loadPolicy() {
      if (!this.modelUrl || this.modelUrl === "dummy") {
        this.policy = new DummyPolicy();
        this.status.textContent = "dummy policy (μ=0, σ=0.3)";
      } else {
        this.status.textContent = "loading model...";
        try {
          this.policy = await OnnxPolicy.load(this.modelUrl);
          this.status.textContent = "ready";
        } catch (e) {
          console.warn("ONNX load failed, using dummy policy:", e);
          this.policy = new DummyPolicy();
          this.status.textContent = "model missing → dummy policy";
        }
      }
      this.sampleBtn.disabled = false;
    }

    _drawBackground() {
      const ctx = this.topCanvas.getContext("2d");
      const W = this._W;
      const H = this._topH;
      ctx.clearRect(0, 0, W, H);

      const [lb, ub] = envBounds(this.env);
      this._bounds = [lb, ub];

      const nX = 400;
      const rewards = new Float32Array(nX);
      let maxR = 0;
      for (let i = 0; i < nX; i++) {
        const x = lb + (ub - lb) * i / (nX - 1);
        const r = rewardAt(this.env, x);
        rewards[i] = r;
        if (r > maxR) maxR = r;
      }
      this._maxReward = maxR;

      const textColor = cssVar("--global-text-color", "#000");
      const textColorLight = cssVar("--global-text-color-light", "#888");
      const themeColor = cssVar("--global-theme-color", "#b509ac");

      const xPx = x => (x - lb) / (ub - lb) * W;
      const yPx = r => H - (r / maxR) * (H - 24) - 6;

      // mode vertical guides
      ctx.save();
      ctx.strokeStyle = textColorLight;
      ctx.setLineDash([3, 5]);
      ctx.lineWidth = 1;
      for (const mu of this.env.mus) {
        ctx.beginPath();
        ctx.moveTo(xPx(mu), 0);
        ctx.lineTo(xPx(mu), H);
        ctx.stroke();
      }
      ctx.restore();

      // reward curve
      ctx.strokeStyle = textColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < nX; i++) {
        const x = lb + (ub - lb) * i / (nX - 1);
        if (i === 0) ctx.moveTo(xPx(x), yPx(rewards[i]));
        else ctx.lineTo(xPx(x), yPx(rewards[i]));
      }
      ctx.stroke();

      // S_0 marker
      ctx.fillStyle = themeColor;
      ctx.beginPath();
      ctx.arc(xPx(this.env.initValue), H - 4, 4, 0, 2 * Math.PI);
      ctx.fill();
      ctx.font = "11px 'JetBrains Mono', monospace";
      ctx.fillText("S₀", xPx(this.env.initValue) + 6, H - 2);

      // x-axis ticks
      ctx.fillStyle = textColor;
      ctx.globalAlpha = 0.5;
      ctx.font = "10px 'JetBrains Mono', monospace";
      for (const mu of this.env.mus) {
        ctx.fillText(mu.toFixed(0), xPx(mu) - 4, 12);
      }
      ctx.globalAlpha = 1;
    }

    _drawHistogram(traj) {
      const ctx = this.topCanvas.getContext("2d");
      const W = this._W;
      const H = this._topH;
      const [lb, ub] = this._bounds;
      const T1 = this.trajLen + 1;

      const nBins = 60;
      const binW = (ub - lb) / nBins;
      const counts = new Array(nBins).fill(0);
      for (let i = 0; i < this.nTraj; i++) {
        const x = traj[(i * T1 + this.trajLen) * 2];
        const b = Math.floor((x - lb) / binW);
        if (b >= 0 && b < nBins) counts[b]++;
      }
      const maxC = Math.max(...counts, 1);

      const themeColor = cssVar("--global-theme-color", "#b509ac");
      const xPx = x => (x - lb) / (ub - lb) * W;

      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = themeColor;
      for (let i = 0; i < nBins; i++) {
        const h = (counts[i] / maxC) * (H - 24);
        const x0 = xPx(lb + i * binW);
        const x1 = xPx(lb + (i + 1) * binW);
        ctx.fillRect(x0, H - h - 6, Math.max(1, x1 - x0 - 0.5), h);
      }
      ctx.restore();
    }

    _drawTrajectories(traj) {
      const ctx = this.bottomCanvas.getContext("2d");
      const W = this._W;
      const H = this._botH;
      const [lb, ub] = this._bounds;
      const T1 = this.trajLen + 1;

      ctx.clearRect(0, 0, W, H);

      const textColor = cssVar("--global-text-color", "#000");
      const xPx = x => (x - lb) / (ub - lb) * W;
      const yPx = step => 16 + (step / this.trajLen) * (H - 28);

      ctx.strokeStyle = textColor;
      ctx.globalAlpha = 0.06;
      ctx.lineWidth = 0.6;

      const maxDraw = 600;
      const stride = Math.max(1, Math.floor(this.nTraj / maxDraw));

      for (let i = 0; i < this.nTraj; i += stride) {
        ctx.beginPath();
        for (let t = 0; t <= this.trajLen; t++) {
          const x = traj[(i * T1 + t) * 2];
          if (t === 0) ctx.moveTo(xPx(x), yPx(t));
          else ctx.lineTo(xPx(x), yPx(t));
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      ctx.fillStyle = textColor;
      ctx.globalAlpha = 0.6;
      ctx.font = "10px 'JetBrains Mono', monospace";
      ctx.fillText("t = 0", 4, 12);
      ctx.fillText("t = " + this.trajLen, 4, H - 4);
      ctx.globalAlpha = 1;
    }

    async sample() {
      if (!this.policy) return;
      this.sampleBtn.disabled = true;
      this.status.textContent = "sampling...";
      const start = performance.now();

      const traj = await sampleTrajectories(
        this.policy, this.env, this.nTraj, this.trajLen, this.temperature,
      );
      this._lastTraj = traj;
      this._redraw();

      const dt = performance.now() - start;
      this.status.textContent = `${this.nTraj} trajectories in ${dt.toFixed(0)}ms`;
      this.sampleBtn.disabled = false;
    }

    _redraw() {
      this._drawBackground();
      if (this._lastTraj) {
        this._drawHistogram(this._lastTraj);
        this._drawTrajectories(this._lastTraj);
      }
    }
  }

  function parseNumberList(s) {
    return (s || "").split(",").map(x => parseFloat(x.trim())).filter(n => !Number.isNaN(n));
  }

  function autoMount() {
    document.querySelectorAll(".gfn-demo-mount").forEach(el => {
      if (el.dataset._mounted) return;
      el.dataset._mounted = "1";
      new GFNDemo({
        mount: el,
        modelUrl: el.dataset.modelUrl || null,
        env: {
          mus: parseNumberList(el.dataset.envMus),
          variances: parseNumberList(el.dataset.envVariances),
          initValue: parseFloat(el.dataset.envInit || "0"),
        },
        trajectoryLength: parseInt(el.dataset.trajectoryLength || "5"),
        nTrajectories: parseInt(el.dataset.nTrajectories || "2000"),
        defaultTemperature: parseFloat(el.dataset.defaultTemperature || "1.0"),
      });
    });
  }

  // Re-theme canvases whenever the site theme changes (cheap — just
  // re-samples background colors from CSS vars).
  const observer = new MutationObserver(() => {
    document.querySelectorAll(".gfn-demo-mount").forEach(el => {
      if (el._gfnDemo) el._gfnDemo._redraw();
    });
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  window.GFNDemo = GFNDemo;
  window.mountGFNDemos = autoMount;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autoMount);
  } else {
    autoMount();
  }
})();
