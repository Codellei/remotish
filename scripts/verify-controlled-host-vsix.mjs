import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const archive = resolve(process.argv[2] ?? 'artifacts/remotish-controlled-host.vsix');
const source = JSON.parse(readFileSync(resolve('apps/demo-web/package.json'), 'utf8'));

function readVsixEntry(path) {
  return execFileSync(
    process.platform === 'win32' ? 'tar' : 'unzip',
    process.platform === 'win32' ? ['-xOf', archive, path] : ['-p', archive, path],
    { encoding: 'utf8' },
  );
}

const manifest = JSON.parse(readVsixEntry('extension/package.json'));
assert.equal(manifest.publisher, 'hrashton');
assert.equal(manifest.name, 'remotish');
assert.equal(manifest.version, source.version);
assert.equal(manifest.browser, './dist/extension.js');
assert.deepEqual(manifest.enabledApiProposals, [
  'scmActionButton',
  'scmHistoryProvider',
  'timeline',
]);
assert.equal(manifest.dependencies?.['@remotish/vscode-history'], 'workspace:*');

const bundle = readVsixEntry('extension/dist/extension.js');
assert.match(bundle, /historyProvider/u);
assert.match(bundle, /actionButton/u);
assert.match(bundle, /registerTimelineProvider/u);

const metadata = readVsixEntry('extension.vsixmanifest');
const prerelease =
  /<Property\s+Id="Microsoft\.VisualStudio\.Code\.PreRelease"\s+Value="true"\s*\/>/u.test(metadata);
assert.equal(prerelease, source.version.includes('-'));
console.log('Controlled Remotish VSIX packaging verified.');
