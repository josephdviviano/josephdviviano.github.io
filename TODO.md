# TODO

## Re-enable GitHub profile trophies

The `repo_trophies` section on the repositories page is disabled in `_config.yml`
because the hosted service at `github-profile-trophy.vercel.app` is returning
`503 DEPLOYMENT_PAUSED` (upstream issue:
https://github.com/ryo-ma/github-profile-trophy/issues/419, opened 2026-02-17).

To re-enable once upstream is back:

1. Check that a request like
   `https://github-profile-trophy.vercel.app/?username=josephdviviano`
   returns a 200 and renders an SVG.
2. Set `repo_trophies.enabled: true` in `_config.yml`.

Alternative: self-host a fork of
https://github.com/ryo-ma/github-profile-trophy on Vercel and swap the base URL
in `_includes/repository/repo_trophies.liquid` (same pattern that was tried
for github-readme-stats and later reverted).
