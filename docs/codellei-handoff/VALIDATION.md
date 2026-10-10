# Validation, invariants and test evidence

**Never infer pass from a file existing or a badge displaying.** Record each command, branch/SHA, execution environment and observed result. Tests run locally are different from trusted publisher or Pages cutover verification.

## Pre-transfer tests (Codex)

From a clean clone with Node 22 or 24 and pinned Corepack/pnpm:

```sh
corepack pnpm install --frozen-lockfile
corepack pnpm lint:markdown
corepack pnpm run ci
corepack pnpm test:vscode-web:stable
corepack pnpm test:vscode-web
corepack pnpm test:vscode-web:vsix
corepack pnpm test:github-live
```

Browser tests require a working Chromium-compatible environment and can require downloads; `test:github-live` uses the public GitHub API. If unavailable, mark **not run**, never **passed**. The full `ci` command exercises build/lint/contract tests and SBOM logic. Do not invoke `release.yml` or push version tags during documentation validation.

### Staging-security acceptance

- [ ] No human-owner equality assumption remains.
- [ ] Unconfigured allowlist / absent approval → denied **before untrusted checkout**.
- [ ] Authorized human + protected default-branch dispatch + open same-repo PR → accepted.
- [ ] Unauthorized human, fork PR, closed PR, malformed PR number → rejected.
- [ ] PR source resolved to exact head SHA and tool checkout is from trusted default branch.
- [ ] COSW source `Codellei/code-oss-static-web`, version prefix and digest integrity checks preserved.
- [ ] No additional privilege to untrusted PR code and no bypass of shared Pages controls.

### Identity/metadata acceptance

- [ ] `HRAshton/remotish` survives **only** as explicitly historical documentation/attestation reference where intended.
- [ ] All current repository/source URLs moved to `Codellei/remotish` in the post-transfer revision.
- [ ] `hrashton.remotish` and provider IDs/dependency strings remain stable; Open VSX smoke still resolves old registry IDs.
- [ ] `@remotish/adapter-sdk` and all public SDK interfaces unchanged.
- [ ] `LICENSE`, `REUSE.toml` and historical attribution unchanged absent legal approval.
- [ ] Badges and external registries are verified by an authorized operator; no asserted success solely from new URLs.

## Post-transfer repository continuity (operator, read-only)

```sh
gh repo view Codellei/remotish --json id,nameWithOwner,defaultBranchRef,url,isPrivate
gh release list -R Codellei/remotish
gh api repos/Codellei/remotish/rulesets
gh api repos/Codellei/remotish/environments
git ls-remote https://github.com/Codellei/remotish.git refs/heads/master
```

Compare repository ID, head, protected tags and prior release inventory with the baseline. Review old-URL redirects without reusing the old name.

## Post-transfer release validation (operator after authorized new version tag)

- [ ] npm `@remotish/adapter-sdk` publishes exact intended new version under `beta` or `latest` policy.
- [ ] Open VSX `hrashton.remotish` and `hrashton.remotish-github-provider` both published, pulled back from registry, and smoke-tested.
- [ ] GitHub Release contains expected VSIXes, source archive, SBOM, notices, checksums and provenance file.
- [ ] `SHA256SUMS` passes; new attestation verifies against `Codellei/remotish`. Do not re-attest or change prior releases.
- [ ] Pages staging serves intended PR SHA, matching COSW release, and correct new origin. Shared-origin security controls remain.
- [ ] CodeQL, Scorecard and Codecov checks have actual successful post-transfer runs.

Example new-identity verification with a **newly downloaded** release artifact:

```sh
sha256sum -c SHA256SUMS
gh attestation verify remotish.vsix -R Codellei/remotish
```

Historical attestations may have `HRAshton/remotish` in their signed claims; assess their original identities separately, and preserve their original bundles.

## Evidence result format

```text
Work item:
Repository and commit:
Command/check:
Execution environment:
Observed result: pass / fail / not run / blocked
CI or run URL:
Blocker / owner:
```
