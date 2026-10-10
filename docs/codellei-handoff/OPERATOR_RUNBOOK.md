# Operator runbook (human-only cutover)

This document is a control checklist. It does not grant an AI agent or collaborator authority to transfer repositories, change release trust, or deploy shared hosting. Pair with [the full runbook](../organization-migration.md).

## Before cutover — explicit go/no-go

- [ ] Verify the authorized account can transfer `HRAshton/remotish` to `Codellei`, and the organization permits creation of public repositories with the name `remotish`. A collaborator with admin permission on another Codellei repository is *not* proof.
- [ ] Nominate primary and backup operators; record independent source/destination approval and a communication window.
- [ ] Confirm both implementation PRs have passed required reviews and CI, and classify whether link changes merge before or immediately after transfer.
- [ ] **Freeze** all `v*` tag creation, manual/retried release workflows, npm/Open VSX publishing and GitHub Pages staging. A GitHub tag push triggers `release.yml` and could partially publish.
- [ ] Privately capture repository ID, default-branch HEAD, refs/tags, release assets/digests, issue/PR counts, environment policy, required checks, effective tag and branch rulesets, CODEOWNERS, Apps, webhook installations, Pages URL, vulnerability reporting, trusted publishers and operator rights.
- [ ] Secure mirror or bundle backup and release inventory consistent with local policy. Do not store credentials, webhook payloads, unpublished advisories or full protected settings dumps in public docs/PRs.
- [ ] Confirm `Codellei/remotish` is unoccupied **immediately before** transfer.

Read-only baseline:

```sh
gh repo view HRAshton/remotish --json id,nameWithOwner,defaultBranchRef,url,isPrivate
gh api repos/HRAshton/remotish/rulesets
gh api repos/HRAshton/remotish/environments
gh release list -R HRAshton/remotish
git ls-remote https://github.com/HRAshton/remotish.git refs/heads/master
```

Some API settings require privileged tokens; save evidence in the restricted change record, not a public PR comment.

## Transfer — manually in GitHub UI

1. Source repository **Settings → General → Danger Zone → Transfer ownership**. Choose `Codellei` / `remotish`. Complete GitHub confirmations/acceptance and capture the event.
2. Confirm repository ID and `master` HEAD are unchanged, all tags/releases/issues/PRs remain, and old GitHub URLs redirect.
3. Never create a replacement `HRAshton/remotish` repository; name reuse would jeopardize redirects.

**Hold point:** do not start new tag-triggered publishing or staging yet.

## After transfer — restore policy before publishing

- [ ] Review effective Codellei rulesets and code-review enforcement; preserve protected `master`, immutable release tags, required checks, backup administrator/operator and security policy.
- [ ] Confirm Actions/CodeQL/Scorecard/Codecov/REUSE/Renovate org installations, access and permitted workflow scopes.
- [ ] Confirm environments `npm`, `open-vsx`, `release`, `github-pages`, their subject/reviewer/deployment rules, Pages source and actual new origin.
- [ ] In npmjs.com, adjust `@remotish/adapter-sdk` Trusted Publisher to org `Codellei`, repo `remotish`, workflow `release.yml` and `npm` environment.
- [ ] In Open VSX, adjust **existing `hrashton` namespace** Trusted Publishing trust to `Codellei/remotish`, workflow `release.yml` and `open-vsx` environment. Do not rename installed extension IDs as part of this transfer.
- [ ] Confirm new project vulnerability report URL and access to pre-existing private reports; old advisories are sensitive.
- [ ] Confirm source-code PRs merged/rebased to canonical coordinates and passed CI in the destination.

## Qualification (requires explicit release authority)

- [ ] Verify approved operator can dispatch **same-repository only** staging PR under the new Pages origin. Check actual content, URL, permissions and fork denial.
- [ ] Prepare a **brand-new** version and protected `v*` tag only after npm/Open VSX trust is confirmed. Do not reuse `v0.1.0-beta.14` or any pre-transfer tag.
- [ ] Verify npm package version, Open VSX two extension versions, post-publish download and VSIX smoke, GitHub Release assets, SHA256SUMS, SBOM and new-identity attestations.
- [ ] Confirm backup release operator access and link evidence; explicitly unfreeze publishing/staging only after all gates pass.

## Recovery policy

- **Before transfer:** stop, keep the source where it is; repair prerequisites.
- **After transfer:** hold publication, fix Codellei protections/trust/env/Pages in place. Do **not** create a duplicate source repo or rewrite historic tags.
- **Transfer-back** is a separate owner-approved migration with external trust and Pages impacts; do not treat it as an automatic rollback.
