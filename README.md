# Mode Collapse

Personal website and blog for Joseph Viviano. Built on the
[al-folio](https://github.com/alshedivat/al-folio) Jekyll theme, with custom
theming, content, and a handful of quality-of-life tweaks.

**Live:** <https://www.viviano.ca>

---

## Local development

### Prerequisites

- macOS or Linux (Windows users: use WSL — see the
  [upstream INSTALL.md](https://github.com/alshedivat/al-folio/blob/master/INSTALL.md)
  for details).
- Ruby `>=3.1` (Jekyll 4 requirement). Pinned via [rbenv](https://github.com/rbenv/rbenv).
- [Bundler](https://bundler.io/) `>=2.5`.
- ImageMagick (for the `jekyll-imagemagick` responsive-image pipeline).

```bash
brew install rbenv ruby-build imagemagick
eval "$(rbenv init - bash)"            # add to ~/.bashrc or ~/.zshrc
rbenv install 3.1.4                    # or any 3.1+
rbenv local 3.1.4                      # writes .ruby-version
gem install bundler
```

### Install gems

```bash
bundle install
```

### Serve with live reload

```bash
bundle exec jekyll serve --livereload
```

The site is served at <http://localhost:4000>. Edits to posts, includes,
SCSS, and most data files trigger a browser reload automatically. Edits to
`_config.yml` or to a Jekyll plugin require restarting the server.

### Docker alternative

If you'd rather skip the Ruby toolchain:

```bash
docker compose up
# open http://localhost:8080
```

The Dockerfile is inherited from al-folio and works as documented in the
[upstream INSTALL.md](https://github.com/alshedivat/al-folio/blob/master/INSTALL.md).

---

## Deployment

GitHub Actions handles deploys via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml):

1. A push to `master` (or manual "Run workflow") triggers the action.
2. Jekyll builds the site in CI.
3. The output is pushed to the `gh-pages` branch.
4. GitHub Pages serves `gh-pages` at <https://www.viviano.ca>.

**Heads-up:** the workflow's `paths` filter excludes `README.md`,
`INSTALL.md`, `FAQ.md`, `CUSTOMIZE.md`, and the `lighthouse_results/`
directory. Doc-only changes will not trigger a rebuild — push another file
or invoke the workflow manually if you need to force one.

---

## What's customized vs. upstream al-folio

A non-exhaustive list of changes from stock
[al-folio](https://github.com/alshedivat/al-folio):

### Theme and visuals

- Third theme: **Cobalt2**, alongside the existing light/dark.
- Typography: **Inter** (sans), **Source Serif 4** (serif), **JetBrains Mono** (code).
- `.invert-on-dark` opt-in class on `<img>` so PNG figures invert cleanly
  under the dark and cobalt2 themes.
- `figcaption` color routed through `--global-text-color-light` so captions
  follow the active theme instead of staying black.
- KaTeX math inherits color from the host theme (no more hardcoded dark).
- `d-article`, `d-math`, and `blockquote` text colors forced to the theme's
  text color (overrides distill's CDN stylesheet).
- Snake contribution graph and other widgets follow the site theme toggle
  rather than the OS `prefers-color-scheme`.

### Content and layout

- `.image-map` / `a.hot` helper for clickable overlay regions on figures
- `_includes/video.liquid` fixed: emits a proper `<video></video>` closing
  tag and adds `playsinline` so iOS Safari will autoplay inline.
- Bundled trained GFlowNet ONNX policies for the GFlowNets post's
  in-browser inference demo.

### Infrastructure

- Self-hosted [github-readme-stats](https://github.com/anuraghazra/github-readme-stats)
  on Vercel, parameterized via the `external_services` block in
  `_config.yml` (the public Vercel instance is unreliable).
- Disabled the broken github-profile-trophy widget.
- Scripts under [`scripts/`](scripts/) declare deps inline via
  [PEP 723](https://peps.python.org/pep-0723/) and use `uv` for execution.

### Removed from upstream

- The al-folio community lists, contributor table, lighthouse badges, and
  theme-marketing copy that lived in the original `README.md` are gone.
  Refer to the
  [upstream README](https://github.com/alshedivat/al-folio/blob/master/README.md)
  if you need them.

---

## Reference docs from upstream

The original al-folio docs are still in this repo for deeper customization:

- [INSTALL.md](INSTALL.md) — full install matrix (Docker, devcontainers, legacy).
- [CUSTOMIZE.md](CUSTOMIZE.md) — theme customization knobs.
- [FAQ.md](FAQ.md) — common gotchas.

## License

MIT, inherited from [al-folio](https://github.com/alshedivat/al-folio/blob/master/LICENSE).
