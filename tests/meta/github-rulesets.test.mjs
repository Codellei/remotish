import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

async function load(path) {
  return JSON.parse(await readFile(new URL(`../../${path}`, import.meta.url), 'utf8'));
}

const [all, review, renovate] = await Promise.all([
  load('.github/rulesets/master-all.json'),
  load('.github/rulesets/master-except-renovate.json'),
  load('renovate.json'),
]);

test('common ruleset keeps PR, required CI and CodeQL gates for everyone', () => {
  assert.equal(all.name, 'master-all');
  assert.equal(all.enforcement, 'active');
  assert.equal(all.target, 'branch');
  assert.deepEqual(all.conditions.ref_name, { include: ['~DEFAULT_BRANCH'], exclude: [] });
  assert.deepEqual(all.bypass_actors, []);
  assert.ok(all.rules.some((rule) => rule.type === 'deletion'));
  assert.ok(all.rules.some((rule) => rule.type === 'non_fast_forward'));

  const pr = all.rules.find((rule) => rule.type === 'pull_request').parameters;
  assert.equal(pr.required_approving_review_count, 0);
  assert.equal(pr.required_review_thread_resolution, true);
  assert.deepEqual(pr.allowed_merge_methods, ['merge', 'squash', 'rebase']);

  const checks = all.rules.find((rule) => rule.type === 'required_status_checks').parameters;
  assert.equal(checks.strict_required_status_checks_policy, true);
  assert.deepEqual(checks.required_status_checks, [
    { context: 'vscode-web', integration_id: 15368 },
    { context: 'github-public', integration_id: 15368 },
    { context: 'test (22.23.3)', integration_id: 15368 },
    { context: 'test (24.21.0)', integration_id: 15368 },
  ]);
  assert.deepEqual(
    all.rules.find((rule) => rule.type === 'code_scanning').parameters.code_scanning_tools,
    [
      {
        tool: 'CodeQL',
        security_alerts_threshold: 'medium_or_higher',
        alerts_threshold: 'errors_and_warnings',
      },
    ],
  );
});

test('Renovate bypasses only the separate human-review rule', () => {
  assert.equal(review.name, 'master-except-renovate');
  assert.equal(review.enforcement, 'active');
  assert.equal(review.target, 'branch');
  assert.deepEqual(review.conditions, all.conditions);
  assert.deepEqual(review.bypass_actors, [
    { actor_id: 2740, actor_type: 'Integration', bypass_mode: 'always' },
  ]);
  assert.deepEqual(
    review.rules.map((rule) => rule.type),
    ['pull_request'],
  );
  const pr = review.rules[0].parameters;
  assert.equal(pr.required_approving_review_count, 1);
  assert.equal(pr.dismiss_stale_reviews_on_push, true);
  assert.equal(pr.require_last_push_approval, true);
  assert.equal(pr.required_review_thread_resolution, true);
  assert.deepEqual(pr.allowed_merge_methods, ['merge', 'squash', 'rebase']);
});

test('Renovate itself merges eligible PRs after checks, not native auto-merge', () => {
  assert.equal(renovate.automerge, true);
  assert.equal(renovate.automergeType, 'pr');
  assert.equal(renovate.automergeStrategy, 'squash');
  assert.equal(renovate.platformAutomerge, false);
  const major = renovate.packageRules.find((rule) => rule.matchUpdateTypes?.includes('major'));
  assert.equal(major.automerge, false);
});
