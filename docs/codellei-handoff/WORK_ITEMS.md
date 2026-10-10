# Codex work items and exit criteria

Use [the parent runbook](../organization-migration.md) as the authoritative sequence. Keep independent review and CI requirements intact.

## W0 — read-only discovery (Codex; before code changes)

- [ ] Confirm branch, repository ID, working HEAD, source/destination names and recent release/version. Distinguish observed state from assumptions.
- [ ] Search GitHub-owner references in hidden files, workflows, packages, scripts, tests and docs. Build a changed/preserved/requires-decision table.
- [ ] Identify current required checks, tag/release architecture and trusted-publishing jobs. Do not read or print secrets.
- [ ] Check that tests for release contract, staging policy, provider manifest IDs, and static preview behavior exist.

**Exit:** inventory and precise plan written in PR description; no mutation to org settings.

## W1 — staging security PR (Codex; pre-transfer)

- [ ] Replace `GITHUB_ACTOR == github.repository_owner`: after transfer `github.repository_owner` is `Codellei` (an org, not the requesting human). Use explicit trusted operator identity/identities plus/or protected approval. A missing/malformed allowlist must deny the dispatch.
- [ ] Authorization must occur **before** checking out or running code from the selected PR. Dispatch must originate from the current protected default branch.
- [ ] Preserve acceptance of *open, same-repository* PRs only, resolution of exact `head.sha`, and the immutable source checkout.
- [ ] Never accept arbitrary fork code into the shared-origin Pages deployment.
- [ ] Update the COSW release API locator to `repos/Codellei/code-oss-static-web/releases`. Keep the exact version constraint and verified SHA-256 archive digest; do not relax the match on release assets.
- [ ] Make `docs/maintainers/development.md` describe the new operator requirement, the current canonical COSW release source, shared staging exposure and Pages requirements.
- [ ] Add policy/contract test coverage or static tests for authorization deny-by-default, authorized operator success, fork and stale PR rejection, default-branch dispatch restriction, and pinned COSW locator.
- [ ] Audit `issues: write` and `pull-requests: write` permissions in the deploy job; retain only permissions truly required to annotate the PR.
- [ ] Note any new `vars` / `staging` environment settings as operator requirements. Never embed a token/secret/actual operator in a public fixture.

**Exit:** PR with security review, tests passing, no live deployment triggered.

## W2 — repository-coordinate and documentation PR (Codex; sequence carefully)

- [ ] Update canonical URLs in `README.md`, `SECURITY.md`, `docs/release-security.md`, relevant adapter/extension package `repository` and `homepage` metadata, and documentation links where they identify **the current repository**.
- [ ] Update CI/Codecov/OpenSSF/Scorecard/REUSE badges to the target where they are to identify the new owner. Verify services will support the new coordinates; absence of migrated service access is an operator blocker.
- [ ] Ensure release security documents accurately distinguish **new** `Codellei/remotish` attestations from **historical** `HRAshton/remotish` attestations.
- [ ] Preserve all `hrashton.*` extension IDs/publisher fields in manifests, packaging transforms, extension dependency declarations, VSIX smoke tests and Open VSX retrieval assertions.
- [ ] Preserve `@remotish/adapter-sdk` naming, package scope, runtime API compatibility, `0BSD` license and historic attribution.
- [ ] Update repo-coordinate assertions in tests where intentional, without replacing assertions that guard compatibility IDs.
- [ ] Inspect `Codellei/code-oss-static-web` references in staging, scripts and docs for aliases that used redirects; use the canonical path.
- [ ] Consider staging this PR so it can merge immediately after transfer if pre-transfer canonical URLs would break pre-transfer checks; report which changes are safe only after transfer.

**Exit:** PR with changed/preserved mapping, passing unit/meta/CI checks, and no extension identity migration.

## W3 — human settings and authorization (operator only)

- [ ] Verify target-org acceptance/creation rights, member roles, reviewers, repository rulesets, effective tag immutability, and transfer permission.
- [ ] Freeze publishing and staging; snapshot refs, releases, environment policy, Apps, Pages, deployment identity, open issues/PRs.
- [ ] Approve the two PRs/security policy and controlled transfer procedure.

**Exit:** recorded go/no-go by designated owner and backup. See [OPERATOR_RUNBOOK.md](OPERATOR_RUNBOOK.md).

## W4 — transfer and organization restore (operator only)

- [ ] Native transfer `HRAshton/remotish` → `Codellei/remotish`, preserving repository ID and refs.
- [ ] Restore/reverify branch/tag protection and reviews; CI checks; CODEOWNERS if applicable; Renovate, CodeQL, Codecov, scorecard, security reporting, GitHub Pages, and required release environments.
- [ ] Update npm trusted publisher and Open VSX trusted publisher to new repository/workflow/environment; keep published package/extension names.
- [ ] Verify credentials, OIDC subjects and attestations only in intended workflows; no release tag until validated.

**Exit:** operator-signed settings evidence and no known publication blockers.

## W5 — qualification and resume (joint; human controls publication)

- [ ] Merge correctly sequenced source PRs; run CI and VSIX/Web smoke on Codellei SHA.
- [ ] With authorized operator and explicit approval, test same-repository staging and deployed Pages URL/identity. Verify fork/unapproved denial.
- [ ] With explicit approval, create a **new version** through protected release process (no existing tag reuse). Validate npm publication, Open VSX re-download/smoke, Release assets/digests/SBOM/provenance under `Codellei/remotish`.
- [ ] Verify backup operator and consumer documentation; only then unfreeze.

**Exit:** every required result linked in restricted migration evidence, and open exceptions tracked.
