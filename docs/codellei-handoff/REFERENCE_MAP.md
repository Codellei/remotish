# Owner-reference classification and repository surface map

**Rule:** the GitHub namespace (`HRAshton` → `Codellei`) and the extension publisher (`hrashton`) are **different identities**. Never global-replace across both.

## Change when safe

| Surface | Existing identity | Target | Caveat |
| --- | --- | --- | --- |
| GitHub repository address | `HRAshton/remotish` | `Codellei/remotish` | Native GitHub transfer only; historical URLs may redirect |
| SECURITY private reporting link | `github.com/HRAshton/remotish/security/advisories/new` | `github.com/Codellei/remotish/security/advisories/new` | Verify Private Vulnerability Reporting after transfer |
| Code-OSS staging release API | `repos/HRAshton/code-oss-static-web/releases` | `repos/Codellei/code-oss-static-web/releases` | Repository already hosted under Codellei |
| Package/extension source metadata | `https://github.com/HRAshton/remotish.git` | `https://github.com/Codellei/remotish.git` | Only `repository` / `homepage` metadata; not package or extension ID |
| README badges/links | `HRAshton/remotish` | `Codellei/remotish` | Verify external projects/registrations before trusting a green badge |
| New artifact attestation verifier | `-R HRAshton/remotish` | `-R Codellei/remotish` | Only for releases signed *after* transfer |
| Local Git origin | `github.com/HRAshton/remotish.git` | `github.com/Codellei/remotish.git` | Explicit operator/consumer command |

Key files: `.github/workflows/staging.yml`, `.github/workflows/release.yml`, `README.md`, `SECURITY.md`, `docs/release-security.md`, `docs/maintainers/development.md`, `packages/adapter-sdk/package.json`, `apps/demo-web/package.json`, `extensions/*/package.json` and release/meta tests.

## Preserve, do not rename in this migration

| Surface | Preserve |
| --- | --- |
| npm public contract | `@remotish/adapter-sdk` and `@remotish/*` workspace naming |
| Open VSX namespace | `hrashton` |
| Published extension IDs | `hrashton.remotish`; `hrashton.remotish-github-provider` |
| Private/demo provider IDs | `hrashton.remotish-fixture-provider`; `hrashton.remotish-browser-rpc-provider`; `hrashton.remotish-git-http-provider` |
| CI/runtime identity tests | `scripts/prepare-open-vsx-host.mjs`, `scripts/prepare-github-provider-vsix.mjs`, `tests/meta/*release*.test.mjs`, `apps/demo-web/src/test/**` |
| Git version history | branch `master`; all pre-transfer tags/releases and existing provenance |
| Licenses | `LICENSE`, `LICENSES/0BSD.txt`, `REUSE.toml` historic copyright metadata |
| Environment names | `npm`, `open-vsx`, `release`, `github-pages` (protect/reauthorize as needed) |

## Current blockers observed in source

1. `.github/workflows/staging.yml` gates shared-origin deployment on `GITHUB_ACTOR == REPOSITORY_OWNER`: after transfer a human will never match organization `Codellei`. Fix before transfer without weakening the trust boundary.
2. The same workflow fetches `HRAshton/code-oss-static-web` Releases. Switch to canonical `Codellei/code-oss-static-web` and maintain strict version and digest checks.
3. `docs/maintainers/development.md` repeats the prior personal-owner staging policy and COSW coordinates.
4. npm `@remotish/adapter-sdk` Trusted Publisher and the `hrashton` Open VSX Trusted Publisher require **external account configuration updates**, not changes to extension publisher IDs.
5. GitHub Pages site origin and Codecov/Scorecard/REUSE integrations are external migration checks, not safely inferable from GitHub redirects.

## Search recipe

Run in a local clone; exclusions stop generated files obscuring real source references:

```sh
rg --hidden -n -i 'HRAshton|Codellei|code-oss-static-web' \
  -g '!.git/**' -g '!node_modules/**' \
  -g '!artifacts/**' -g '!coverage/**' .
rg --hidden -n 'hrashton\.|\"publisher\"|extensionDependencies' \
  -g '!.git/**' -g '!node_modules/**' \
  -g '!artifacts/**' .
```

For **every match**, decide `change` / `preserve` / `historical` / `human decision`. Not every occurrence of `HRAshton` is a link that should be rewritten, and not every `hrashton` string is safe to keep without understanding its use.
