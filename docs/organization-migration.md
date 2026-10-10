# Migration: HRAshton/remotish → Codellei/remotish

Status: **proposed; transfer NOT yet authorized or performed**.

## Objective and method

Move the existing public `HRAshton/remotish` repository into the existing `Codellei` organization **by native GitHub repository transfer**, retaining repository continuity, `master`, full Git history, existing issues/PRs, releases/tags, and links via GitHub redirects. Do **not** fork, copy files, initialize `Codellei/remotish`, rewrite history, or republish prior release tags.

- Source: https://github.com/HRAshton/remotish
- Destination: https://github.com/Codellei/remotish (expected only *after* transfer)
- Target organization: https://github.com/Codellei
- Related upstream host: https://github.com/Codellei/code-oss-static-web
- GitHub transfer rules: https://docs.github.com/en/repositories/creating-and-managing-repositories/transferring-a-repository

The destination name was unoccupied when this plan was prepared. Source-repository administration was available, but target-organization **repository creation / transfer eligibility must still be demonstrated by the human operator** before cutover. Do not treat repository-admin access on another Codellei repository as proof that the actor can initiate this transfer.

## Decisions: preserve names that are public interfaces

1. Preserve the default branch name `master` and existing version tags.
2. Preserve the npm package name `@remotish/adapter-sdk` and its package consumer contract. Changing the GitHub owner is *not* a change to the npm scope.
3. Preserve Open VSX namespace and extension IDs `hrashton.remotish` and `hrashton.remotish-github-provider` for this transfer. Their publisher fields, dependency declarations, registry smoke assertions, and published consumers depend on those IDs. A potential future namespace change needs a separate compatibility plan.
4. Preserve historical author and copyright notices; update only *current source/repository links* to Codellei, not ownership claims or historic release provenance.
5. Keep the GitHub Pages staging deployment **disabled/frozen** until the new target's origin, authorization, and environment settings have been checked. GitHub repository redirects do not redirect the old GitHub Pages site.

## Gate A — baseline and publication freeze (before transfer)

- [ ] Name a primary operator and a separate backup operator; verify target organization membership, creation rights, org transfer policy, repository admins, and release authority.
- [ ] Snapshot `master` head SHA, all protected refs, tag list, open issues/PRs, latest release tag/asset checksums, and repository visibility. Record them in a migration change record.
- [ ] Capture effective branch protection/rulesets, protected release-tag policy, required CI checks, CODEOWNERS if applicable, Actions policy/permissions, environments (`npm`, `open-vsx`, `release`, `github-pages`), Pages configuration, security/advisory settings, webhooks, deploy keys, installation access, and existing Pages address. Keep sensitive evidence **outside the public repository**.
- [ ] Preserve an independently accessible `git bundle --all` / mirror backup and release-asset inventory if the operator's recovery policy requires one. Never upload secrets or private advisory data into this document.
- [ ] Freeze publishing new `v*` tags, registry packages, GitHub Releases, and shared staging deployments during cutover. Leave historical tags and artifacts untouched.
- [ ] Confirm `Codellei/remotish` does not exist and no conflicting fork is present. Confirm Codellei plans/policies support required public-repo features.

Example inventory commands (read-only; adjust access/visibility):

```sh
gh repo view HRAshton/remotish --json nameWithOwner,defaultBranchRef,isPrivate,url
gh release list -R HRAshton/remotish
gh api repos/HRAshton/remotish/rulesets
gh api repos/HRAshton/remotish/environments
gh api repos/HRAshton/remotish/pages
git clone --mirror https://github.com/HRAshton/remotish.git
```

## Gate B — pre-transfer fixes and approvals

Open and review separate implementation PRs for the following. Keep production publication frozen even if the new documentation PR itself merges.

- [ ] **Staging security: `.github/workflows/staging.yml`.** The current gate requires `GITHUB_ACTOR == github.repository_owner`. After transfer, the owner is the organization `Codellei`, so no human actor can satisfy it. Replace with **explicitly authorized human operator identities** and/or a protected approval environment *before checkout or executing PR-controlled code*. Preserve `workflow_dispatch` from the protected default branch, same-repository PR validation, immutable selected PR SHA, trusted tooling checkout, and least-privilege permissions. Do not simply remove the actor check or accept every org member.
- [ ] **Staging host dependency: `.github/workflows/staging.yml`.** Replace the hard-coded `repos/HRAshton/code-oss-static-web/releases` API request with the canonical `repos/Codellei/code-oss-static-web/releases` path; assert the intended release archive and SHA-256 digest checks still pass.
- [ ] Audit current GitHub-owner coupling in `README.md`, `SECURITY.md`, `docs/release-security.md`, `docs/maintainers/development.md`, `packages/adapter-sdk/package.json`, `apps/demo-web/package.json`, and extension package manifests. Stage canonical `Codellei/remotish` links as appropriate; distinguish repository links from `hrashton` extension IDs and copyright attribution.
- [ ] Audit repo-coordinate assumptions in CI, release-contract tests, staging scripts, badge generation, code coverage links, GitHub public-provider integration tests, and Code-OSS host consumption; avoid blanket find/replace of `HRAshton` or `hrashton`.
- [ ] Review pre-transfer branch/tag protections, visibility, dependency apps, webhooks, and required-check settings with the intended Codellei owners. Ensure review authority survives the transfer, not merely the code.
- [ ] Record an explicit go/no-go approval from source and destination operators after the above review.

## Gate C — native transfer (short controlled cutover)

The authorized source administrator uses **Settings → General → Danger Zone → Transfer**, specifies organization `Codellei` and repository name `remotish`, and completes GitHub's confirmation flow. The operator must have permission to create repositories in `Codellei`; follow any organization policy/acceptance prompts.

- [ ] Reconfirm frozen publication, permissions, destination-name availability, and recorded source HEAD just before submission.
- [ ] Transfer **the existing repository**, not a clone. Do not create an empty destination repository first.
- [ ] Confirm new identity `Codellei/remotish` and the *same repository ID*, `master` HEAD, tags, Releases, issue/PR records, visibility, and collaborators where expected. GitHub can clear issue assignees not belonging to the destination organization; audit assignments.
- [ ] Verify old web/Git URLs redirect. **Never recreate `HRAshton/remotish`**: reusing the old name can disable redirect continuity.
- [ ] Document the transfer event and owner/operators in the restricted migration record.

The transfer cannot be performed by a source-code PR; it is an account/repository administration operation.

## Gate D — re-establish organization settings and trusted identities

Perform these checks **before** resuming any new tag/release or staging deployment.

### Repository and security

- [ ] Verify Codellei collaborator/team permissions, organization defaults, backup operator, protected `master` branch, required checks, reviews, signed/locked release tags, rulesets and their effective bypass subjects. Do not silently relax protections during transfer.
- [ ] Verify Actions is enabled with the intended permissions, fork policy, CodeQL, OpenSSF Scorecard, Dependabot/Renovate, Codecov project authorization, security alerts, and Private Vulnerability Reporting. Check installations and OAuth connections explicitly; their org access may need reauthorization.
- [ ] Verify `npm`, `open-vsx`, `release`, and `github-pages` environment restrictions, publication permissions, and any approvals. Do not copy secrets into issues, docs, or workflow logs.
- [ ] Reconfigure GitHub Pages for the new repository/organization origin, Pages environment and any custom domain. Verify the exact staging URL from an actual deployment. Old GitHub Pages URLs are **not** automatically redirected.
- [ ] Confirm the staging authorization guard still fails closed for unauthorized operators or fork PRs and accepts only a designated human operator with an approved same-repository PR.

### External release trust (hard release blockers)

- [ ] **npm trusted publishing:** update the `@remotish/adapter-sdk` publisher trust from `HRAshton/remotish` to `Codellei/remotish`, with the exact `.github/workflows/release.yml` workflow and `npm` environment. Preserve the npm package name and `beta` distribution-tag semantics.
- [ ] **Open VSX trusted publishing:** update trust for the existing `hrashton` namespace to accept `Codellei/remotish`, `.github/workflows/release.yml`, and the `open-vsx` environment. Preserve `hrashton.remotish` and `hrashton.remotish-github-provider` identities and existing downstream dependency links.
- [ ] **GitHub provenance:** confirm newly issued OIDC/Sigstore/Actions attestations identify the **new** repository/workflow and verify against `-R Codellei/remotish`. Historical release signatures were issued by the old identity; retain original release bundles and document historical verification separately. Do not move or rewrite historical tags.
- [ ] **Codecov / Scorecard / REUSE / OpenSSF:** update repository registration/trust as required and canonical README badges/links; confirm the coverage OIDC upload and security scans actually succeed with the new identity.
- [ ] Revalidate release-environment permissions and the `release.yml` sequence: package + tests → npm publish → Open VSX publish + download/smoke → GitHub Release. Do not create a new `v*` tag until both external trusted publisher changes and all guards are verified.

## Gate E — verification and publication resume

- [ ] Merge/review canonical link changes, `SECURITY.md` reporting address, npm package homepage/repository metadata, extension repository metadata (but **not** publisher ID), contributor docs, release-security examples, and staging-run instructions.
- [ ] Run the complete CI matrix (Node 22/24), VS Code Web tests, VSIX/registry smoke, public-GitHub adapter tests, CodeQL/Scorecard, and Codecov upload on a **new Codellei commit**.
- [ ] Under approved human authorization, stage a same-repo test PR and verify that deployed preview content and URLs are correct under the new Pages origin. Keep untrusted PRs unable to trigger trusted shared-origin deployments.
- [ ] Only after all publication gates are green, create **a new, never-before-published version tag** through the protected release path. Verify npm `@remotish/adapter-sdk`, both Open VSX extension versions/IDs, GitHub Release assets, SHA256SUMS, SBOM, and new-repository provenance. Never rerun publication of an old release just to test the migration.
- [ ] Update any external consumers such as Code-OSS integration, documentation, pinned repository URLs, installed app permissions, local remotes, registry links, and status badges. Existing clones should switch explicitly: `git remote set-url origin https://github.com/Codellei/remotish.git`.
- [ ] Lift the freeze only after a clean post-transfer release, successful trusted deployment, and backup operator acceptance. Record links to CI, release, publication evidence, and outstanding exceptions.

Release acceptance should include (for a **new** version):

```sh
gh repo view Codellei/remotish --json nameWithOwner,defaultBranchRef,url
gh release list -R Codellei/remotish
git ls-remote https://github.com/Codellei/remotish.git refs/heads/master
# On downloaded, checksum-validated release assets:
gh attestation verify remotish.vsix -R Codellei/remotish
```

## Hold / recovery

- **Before transfer:** stop, retain the original repository and publishing freeze until prerequisites are met.
- **After transfer, before release:** keep releases/staging frozen and repair Codellei rights, trust bindings, Pages, or failing workflows in place. Native GitHub transfer preserves original history; do not fabricate a fresh `HRAshton/remotish` repository because redirects would break.
- **If transferring back is genuinely necessary:** require coordinated approval and a new settings/external-trust/Pages cutover. Reversal is not a zero-cost rollback and must not reuse tags or publish altered historical artifacts.
- **Do not claim completion** merely because the GitHub repository URL redirects. Completion requires verified CI, security, registry publication, Pages staging, maintainership, and continuity.

## Definition of done

`Codellei/remotish` is the authoritative public repository with original repository ID/history/tags/releases and protected `master`; old Git links redirect; authorized people can review and deploy; Codecov/CodeQL/Scorecard and both trusted registries work; a **new** release has valid assets and new-identity attestation; the Pages origin and private reporting address are correct; the migration evidence and backup owner are recorded.
