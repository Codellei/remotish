# Copy-paste brief for Codex

> Work in `HRAshton/remotish` on a fresh topic branch from the current `master` (verify branch protections). First read `docs/organization-migration.md` and the complete `docs/codellei-handoff/` pack, especially `REFERENCE_MAP.md` and `WORK_ITEMS.md`.
>
> Goal: prepare **reviewable, fail-closed source changes** so Remotish can be transferred natively to `Codellei/remotish` by an authorized GitHub administrator. Do not perform the transfer or release.
>
> First, verify repo identity/default branch and inventory *all* old-owner references using `rg -n -i 'hrashton|code-oss-static-web|codellei' .` (include hidden files/workflows with an explicit `rg --hidden` search and exclude `.git` and build artifacts). Classify each result as (a) repository coordinate/URL to migrate, (b) stable extension ID/publisher or npm scope to preserve, (c) historical attribution/provenance to preserve, or (d) unclear: obtain human decision. Do **not** run a blanket rename.
>
> Produce two independent PRs:
>
> **PR 1 – pre-transfer staging security:** fix `.github/workflows/staging.yml`, replacing the `GITHUB_ACTOR == github.repository_owner` assumption with a *human/operator authorization mechanism* that will work for an organization owner and **fails closed** when unconfigured. Keep authorization before untrusted PR checkout/execution; preserve same-repository-only PR checks, protected-default-branch-only dispatch, immutable head SHA, integrity checks, least permissions. Change only the COSW release API path to `Codellei/code-oss-static-web`; add or adjust regression tests proving authorized, unauthorized and fork cases. Avoid arbitrary new deployment privileges.
>
> **PR 2 – identity and docs:** update only canonical repository coordinate references to `Codellei/remotish` where appropriate in README/badges, package repository/homepage metadata, SECURITY reporting URL, release verification docs, maintainers' docs, and related tests. Keep existing `hrashton` Open VSX extension IDs, extension dependencies, package names, historical attestation/signature claims, and copyright headers unchanged. Ensure changes are sequenced appropriately so the pre-transfer release path cannot accidentally publish with unverified trust.
>
> Do not assume that repo admins on `Codellei/code-oss-static-web` can transfer repositories into the Codellei organization. Identify settings and permission checks for a human operator, but do not change them yourself.
>
> Validation: `corepack pnpm install --frozen-lockfile`, `corepack pnpm lint:markdown`, `corepack pnpm run ci`, `corepack pnpm test:vscode-web:stable`, `corepack pnpm test:vscode-web` and `corepack pnpm test:vscode-web:vsix` as possible in the execution environment. Include test evidence with exact commands and failures; never claim browser/registry tests pass if not run. Check hard-coded repository and extension identity assertions.
>
> Before each PR, return a concise summary: changed files; classifications of every owner reference (changed/preserved); security invariants; test results; remaining operator-only prerequisites and risks. **Stop after reviewable source PRs.** Do not run `gh repo transfer` / admin settings mutations, generate version tags, invoke publishing workflows, or deploy shared Pages staging without a separate explicit user request and preflight authorization.

## Codex deliverable format

- PR(s) with narrowly scoped diffs, a statement of whether the code is **pre-transfer-safe** or **post-transfer-only**, and validation artifacts.
- A migration evidence checklist filled only with non-sensitive observations; sensitive configuration remains in private operator records.
- A clearly enumerated list of manual cutover work. No claims that the repository transfer, trusted publishing, or release happened.

## Why this separation matters

Source PRs cannot bind npm/Open VSX OIDC trust, migrate GitHub org settings, or prove environment permissions. `release.yml` publishes to npm and Open VSX before creating a GitHub release. A tag pushed prematurely could cause partial publication. The only safe state before all trust gates pass is **no new release tags**.
