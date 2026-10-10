import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const workflow = await readFile(
  new URL('../../.github/workflows/staging.yml', import.meta.url),
  'utf8',
);

test('staging authorizes a configured human on a protected default branch before checkout', () => {
  const authorization = workflow.indexOf('name: Authorize staging deployment');
  const resolution = workflow.indexOf('name: Resolve trusted PR');
  const checkout = workflow.indexOf('name: Check out trusted staging tooling');
  assert.ok(authorization >= 0 && authorization < resolution && resolution < checkout);

  const guard = workflow.slice(authorization, resolution);
  assert.match(guard, /GITHUB_REF_NAME.*DEFAULT_BRANCH/u);
  assert.match(guard, /REF_PROTECTED.*true/u);
  assert.match(guard, /STAGING_DEPLOYERS: \$\{\{ vars\.STAGING_DEPLOYERS \}\}/u);
  assert.match(guard, /jq -e --arg actor "\$GITHUB_ACTOR"/u);
  assert.match(guard, /type == "array" and any\(\.\[\]; type == "string" and ascii_downcase/u);
  assert.doesNotMatch(guard, /GITHUB_ACTOR.*REPOSITORY_OWNER/u);
});

test('staging accepts only an open same-repository PR and pins its head', () => {
  const resolution = workflow.slice(
    workflow.indexOf('name: Resolve trusted PR'),
    workflow.indexOf('name: Check out trusted staging tooling'),
  );
  assert.match(resolution, /PR_NUMBER.*\^\[1-9\]\[0-9\]\*/u);
  assert.match(resolution, /\.state.*== open/u);
  assert.match(resolution, /head_repo.*GITHUB_REPOSITORY/u);
  assert.match(resolution, /head_sha.*\^\[0-9a-f\]\{40\}\$/u);
  assert.match(workflow, /ref: \$\{\{ steps\.pr\.outputs\.sha \}\}/u);
  assert.match(workflow, /ref: \$\{\{ github\.sha \}\}/u);
  assert.match(workflow, /persist-credentials: false/u);
});

test('staging selects the organization COSW release and verifies its digest', () => {
  assert.match(workflow, /repos\/Codellei\/code-oss-static-web\/releases/u);
  assert.match(workflow, /select\(\.tag_name \| startswith\(\$prefix\)\)/u);
  assert.match(workflow, /\^sha256:\[0-9a-f\]\{64\}\$/u);
  assert.match(workflow, /sha256sum -c -/u);
});
