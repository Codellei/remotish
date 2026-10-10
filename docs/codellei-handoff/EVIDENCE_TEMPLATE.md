# Restricted migration evidence template

Copy this template **to a restricted change record** controlled by the authorized operators. Do not fill real secrets, private advisory contents, usernames with sensitive access details, unpublished settings exports, or token material into the public repository or a public Codex chat.

## Identity and authorization

- Change record ID:
- Cutover date/time and change window:
- Source repository ID:
- Baseline `master` SHA:
- Destination repository ID (must match):
- Destination `master` SHA (must match):
- Primary/backup authorized operators: **restricted record**
- Source and destination transfer approvals:
- Publication/staging frozen at:
- Explicit go/no-go and authorizer:
- Freeze lifted by/at:

## Repository preservation

| Check | Before | After | Evidence location | Result |
| --- | --- | --- | --- | --- |
| Repository ID | | | | |
| Public visibility | | | | |
| `master` head | | | | |
| Git refs and tags | | | | |
| Releases + assets | | | | |
| Issues, PRs and collaborators | | | | |
| Old Git/HTTPS redirects | | | | |
| Branch and release-tag rulesets | | | | |
| Required checks and review owners | | | | |

## Restored settings (restricted links only)

| Integration | Owner | Required validation | Evidence | Result |
| --- | --- | --- | --- | --- |
| GitHub Actions, `release` environment | | No reduced protections | | |
| `npm` Trusted Publisher | | New repo/workflow/env trust | | |
| Open VSX `hrashton` Trusted Publisher | | Same registry IDs; new repo/workflow/env trust | | |
| GitHub Pages `github-pages` | | New origin, controlled staging | | |
| Codecov/CodeQL/Scorecard/REUSE | | Successful new-identity runs | | |
| Renovate / Apps / webhooks | | New org permissions reviewed | | |
| Vulnerability reporting | | Private reporting works | | |
| Backup release operator | | Can operate/recover | | |

## Release acceptance

- New release tag and source commit:
- CI and VSIX/Web smoke:
- npm package version and publication URL:
- Open VSX host/provider version URLs:
- GitHub Release and asset/checksum URLs:
- Attestation verification command/result:
- Staging PR SHA, COSW release, Pages URL:
- Historic release provenance kept unchanged:
- Open incidents, exceptions, recovery decision:
- Final signoff and next review date:

Use **blocked** or **not checked** rather than treating missing evidence as passed. 
