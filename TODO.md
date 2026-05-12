# TODO

## Self-host repository-page services on Vercel

The template URLs for the repositories page are parameterized via
`external_services` in `_config.yml`.

**Stats — done.** Self-hosted on Vercel using
`josephdviviano/github-readme-stats-fast` (fork of
https://github.com/Pranesh-2005/github-readme-stats-fast, drop-in compatible
with upstream anuraghazra — same `PAT_1` env var and same `/api`, `/api/pin`
endpoints). Deployed at
`github-readme-stats-fast-joseph-1708s-projects.vercel.app`. `PAT_1` set on
the Vercel project (rotate ~Nov 2026).

**Trophies — pending.** Still using a `CHANGE-ME` placeholder; the trophies
section is disabled via `repo_trophies.enabled: false` so the placeholder is
harmless. To re-enable:

1. Self-host `ryo-ma/github-profile-trophy` on Vercel
   (https://github.com/ryo-ma/github-profile-trophy). When creating the
   project, set `PAT_1` in the env-vars section *before* the first deploy,
   and disable Vercel Authentication in Settings → Deployment Protection.
2. Verify with `<your-url>/?username=josephdviviano` (expect 200 + SVG).
3. Set `external_services.github_profile_trophy_url` in `_config.yml` to
   the new URL.
4. Set `repo_trophies.enabled: true` in `_config.yml`.

Background: the previous self-hosted Vercel account was deleted in April 2026
after a security incident; this is a fresh redeploy. The original
`anuraghazra/github-readme-stats` fork was abandoned in favor of the `-fast`
variant after the original Vercel project hit unresolvable git-connection
errors on every redeploy.
