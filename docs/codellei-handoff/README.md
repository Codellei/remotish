# Codex handoff: Remotish → Codellei

**Status: planning only.** This directory is an execution pack for a coding agent and human operators. No repository transfer or release is authorized by these documents.

## Start here

1. Read [the migration runbook](../organization-migration.md) and this handoff README.
2. Paste [CODEX_PROMPT.md](CODEX_PROMPT.md) into Codex as the initial task. Base work on this repository's current `master` (verify effective protection), not an unrelated checkout.
3. Use [WORK_ITEMS.md](WORK_ITEMS.md) for separate implementation PRs and required acceptance checks.
4. Check [REFERENCE_MAP.md](REFERENCE_MAP.md) before changing references or extension identities.
5. Use [VALIDATION.md](VALIDATION.md) to record test evidence.
6. Hand [OPERATOR_RUNBOOK.md](OPERATOR_RUNBOOK.md) and [EVIDENCE_TEMPLATE.md](EVIDENCE_TEMPLATE.md) to the human source/destination administrator. **Do not submit completed evidence publicly.**

## Target

`HRAshton/remotish` → `Codellei/remotish` by **native GitHub transfer**. Related host: `Codellei/code-oss-static-web`.

**Never** do a Git mirror push or create an empty replacement repository. Preserve repo identity, history, refs, existing GitHub records, and legacy public interfaces.

## Working contract

- Codex may inspect and propose source changes in **reviewable PRs**. Prefer two PRs: (1) staging authorization + COSW source, (2) canonical repository links/metadata + docs/tests.
- Codex may run local read-only inventory and tests. It must not transfer the repository, change live admin settings, rotate trusted publishing, tag versions, publish packages/extensions, deploy shared staging, or expose sensitive org configuration. Those steps require explicit human authorization.
- Preserve `master`, `@remotish/adapter-sdk`, and `hrashton.*` extension publisher IDs. Package/extension renaming is outside scope.
- Treat secrets, live app installations, protection policy, and release environments as unverified until an authorized operator checks them.
- Stop at each [gate](../organization-migration.md). Distinguish **implemented**, **locally tested**, and **operator verified**.
- After the native transfer, Codex can prepare and validate post-transfer source changes, but not execute the release cutover without an approved operator.

## Snapshot (2026-10-10)

At preparation: public `HRAshton/remotish`, repository ID `1378113900`, default `master`, branch HEAD recorded as `4f9abe068284f1f850eeb5db276f1307b5510c7d`; root package version `0.1.0-beta.15`; latest observed published GitHub Release `v0.1.0-beta.14`. `Codellei/code-oss-static-web` exists. These are **baseline observations, not live cutover guarantees**. Recheck before any action.

## Scope and evidence

The migration is complete only when settings, protections, CI, staging, npm/Open VSX trusted publishing, provenance, external integrations, owners, and a **new** release are independently validated. GitHub URL redirection alone is insufficient.
