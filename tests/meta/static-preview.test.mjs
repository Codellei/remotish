import assert from 'node:assert/strict';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';
import {
  prepareStaticPreview,
  withScopedProposalGrants,
} from '../../scripts/prepare-static-preview.mjs';

test('prepares a Code-OSS distribution with browser extensions', async () => {
  const root = await mkdtemp(resolve(tmpdir(), 'remotish-preview-'));
  try {
    const dist = resolve(root, 'dist');
    const extension = resolve(root, 'extension');
    await mkdir(resolve(dist, 'extensions'), { recursive: true });
    await mkdir(resolve(extension, 'dist'), { recursive: true });
    await writeFile(
      resolve(dist, 'index.html'),
      '<meta http-equiv="Content-Security-Policy" content="connect-src \'self\';">',
    );
    await writeFile(
      resolve(dist, 'static-bootstrap.mjs'),
      'const config = {\n  productConfiguration: {\n    enableTelemetry: false\n  }\n};\n',
    );
    await writeFile(
      resolve(dist, 'additional-extensions.json'),
      `${JSON.stringify({
        schemaVersion: 1,
        extensions: [{ id: 'upstream.keep', path: 'extensions/upstream.keep/' }],
      })}\n`,
    );
    await writeFile(
      resolve(dist, 'extensions.json'),
      `${JSON.stringify({
        schemaVersion: 1,
        extensions: [{ id: 'upstream.keep', path: 'extensions/upstream.keep/' }],
      })}\n`,
    );
    await writeFile(
      resolve(extension, 'package.json'),
      `${JSON.stringify({
        publisher: 'hrashton',
        name: 'remotish',
        version: '1.0.0',
        browser: './dist/extension.js',
        license: '0BSD',
        enabledApiProposals: ['scmActionButton', 'scmHistoryProvider', 'timeline'],
      })}\n`,
    );
    await writeFile(resolve(extension, 'dist/extension.js'), 'export {};\n');

    await prepareStaticPreview({
      dist,
      extensionPaths: [pathToFileURL(`${extension}/`)],
    });

    const additional = JSON.parse(
      await readFile(resolve(dist, 'additional-extensions.json'), 'utf8'),
    );
    assert.deepEqual(additional.extensions, [
      { id: 'hrashton.remotish', path: 'extensions/hrashton.remotish/' },
      { id: 'upstream.keep', path: 'extensions/upstream.keep/' },
    ]);

    const index = JSON.parse(await readFile(resolve(dist, 'extensions.json'), 'utf8'));
    const installed = index.extensions.find((item) => item.id === 'hrashton.remotish');
    assert.equal(installed.version, '1.0.0');
    assert.equal(
      await readFile(resolve(dist, 'extensions/hrashton.remotish/dist/extension.js'), 'utf8'),
      'export {};\n',
    );
    const bootstrap = await readFile(resolve(dist, 'static-bootstrap.mjs'), 'utf8');
    assert.ok(
      bootstrap.includes(
        'extensionEnabledApiProposals: {"hrashton.remotish":["scmActionButton","scmHistoryProvider","timeline"]},',
      ),
    );
    assert.equal(bootstrap.split('extensionEnabledApiProposals').length, 2);
    assert.match(
      await readFile(resolve(dist, 'index.html'), 'utf8'),
      /connect-src 'self' https:\/\/api\.github\.com;/u,
    );
    assert.equal(
      await readFile(resolve(dist, 'robots.txt'), 'utf8'),
      'User-agent: *\nDisallow: /\n',
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('scoped API grants fail closed when host or COSW bootstrap differs', () => {
  const bootstrap = 'const config = {\n  productConfiguration: {\n  }\n};\n';
  const host = {
    publisher: 'hrashton',
    name: 'remotish',
    enabledApiProposals: ['scmActionButton', 'scmHistoryProvider', 'timeline'],
  };

  const derived = withScopedProposalGrants(bootstrap, host);
  assert.match(derived, /extensionEnabledApiProposals/u);
  assert.ok(derived.includes('"hrashton.remotish"'));
  assert.equal(derived.split('extensionEnabledApiProposals').length, 2);

  for (const enabledApiProposals of [
    [],
    ['scmHistoryProvider', 'timeline'],
    ['scmActionButton', 'scmHistoryProvider', 'unexpected'],
    ['scmActionButton', 'scmActionButton', 'timeline'],
  ]) {
    assert.throws(
      () => withScopedProposalGrants(bootstrap, { ...host, enabledApiProposals }),
      /exactly the approved API proposals/u,
    );
  }
  assert.throws(
    () => withScopedProposalGrants(bootstrap, { ...host, name: 'other-extension' }),
    /Only the Remotish host/u,
  );
  assert.throws(
    () => withScopedProposalGrants(derived, host),
    /Unexpected COSW product configuration/u,
  );
  assert.throws(
    () => withScopedProposalGrants('const config = {};', host),
    /Unexpected COSW product configuration/u,
  );
});
