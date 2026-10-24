# GitHub default-branch rulesets

The JSON files in [`.github/rulesets/`](../../.github/rulesets/) are **proposed GitHub REST API inputs**, not automatically enforced from git. An administrator must apply the rulesets to GitHub after merging the PR. Until then, the existing live `master` ruleset still governs merges.

This follows the two-layer pattern from [HRAshton/allure-static-only](https://github.com/HRAshton/allure-static-only/rules), adapted to Remotish's current required CI checks and permitted merge methods.

## Intended policy

| Ruleset | Applies to | Requirements |
| --- | --- | --- |
| [`master-all`](../../.github/rulesets/master-all.json) | Everyone, including Renovate | PR required (0 approvals), no deletion/force push, resolved review threads, up-to-date `vscode-web`, `github-public`, `test (22.23.3)`, `test (24.21.0)` checks, and CodeQL |
| [`master-except-renovate`](../../.github/rulesets/master-except-renovate.json) | Everyone except Renovate GitHub App | 1 approval, stale approvals dismissed, last-push approval from someone else, resolved review threads |

The review-only ruleset gives the Renovate GitHub App (integration ID `2740`) an `always` bypass. This bypass does **not** waive the separate `master-all` checks, CodeQL, PR requirement, or branch protections. It is an *app-level ruleset bypass*, not a file-path-specific exception; confirm the trusted Renovate installation before enabling it.

The existing merge methods (`merge`, `squash`, `rebase`) remain available. Renovate uses `automergeType: "pr"`, `automergeStrategy: "squash"`, and `platformAutomerge: false`: it must observe successful checks and execute the merge. Major dependency updates remain review-only; npm updates retain the three-day release-age rule. Dependabot and human-authored PRs are **not** exempt from human review.

## One-time administrator application

1. Ensure this PR is merged and you have repository administration permission. Inspect the live rules before making changes:

   ```sh
   gh api repos/Codellei/remotish/rulesets --jq '.[] | [.id, .name, .enforcement] | @tsv'
   ```

2. Keep the existing `master` ruleset enabled while creating both new active rulesets:

   ```sh
   gh api --method POST repos/Codellei/remotish/rulesets --input .github/rulesets/master-all.json
   gh api --method POST repos/Codellei/remotish/rulesets --input .github/rulesets/master-except-renovate.json
   ```

3. Read back both new rulesets and verify their exact required checks, CodeQL, branch target and Renovate integration bypass. Only then remove the **previous** `master` ruleset by its verified current ID. As of 2026-10-24, it was `23726601`; do not assume that ID is still current.

   ```sh
   gh api repos/Codellei/remotish/rulesets --jq '.[] | [.id, .name, .enforcement] | @tsv'
   # Once verified, replace OLD_MASTER_RULESET_ID with its actual numeric ID:
   gh api --method DELETE repos/Codellei/remotish/rulesets/OLD_MASTER_RULESET_ID
   ```

4. Confirm a non-Renovate PR still requires human approval, and an eligible Renovate PR can merge **only after** the four required checks and CodeQL pass. Investigate check failures or the Renovate App's permissions rather than loosening the shared ruleset.

GitHub will not update these live settings when `master` changes. Subsequent edits to these files also require a deliberate administrator update (PATCH the live ruleset, do not POST duplicate rulesets). The ruleset JSON files are intended as reviewable, reproducible desired-state records.
