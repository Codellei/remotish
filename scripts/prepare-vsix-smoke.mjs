import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';

const hostVsix = resolve(process.argv[2] ?? 'artifacts/remotish.vsix');
const providerVsixes = (
  process.argv.length > 3
    ? process.argv.slice(3)
    : [
        'artifacts/remotish-fixture-provider.vsix',
        'artifacts/remotish-browser-rpc-provider.vsix',
        'artifacts/remotish-github-provider.vsix',
        'artifacts/remotish-git-http-provider.vsix',
      ]
).map((vsix) => resolve(vsix));
const smokeRoot = resolve('artifacts/vsix-smoke');
const extensionRoot = resolve(smokeRoot, 'extension');
const providersRoot = resolve(smokeRoot, 'providers');
const testBundle = resolve('apps/demo-web/dist/test/suite/vsix.js');
const bootstrapTestBundle = resolve('apps/demo-web/dist/test/suite/bootstrap.js');
const githubBootstrapTestBundle = resolve('apps/demo-web/dist/test/suite/github-bootstrap.js');

function extractVsix(archive, destination) {
  const windows = process.platform === 'win32';
  execFileSync(
    windows ? 'tar' : 'unzip',
    windows ? ['-xf', archive, '-C', destination] : ['-q', archive, '-d', destination],
    { stdio: 'inherit' },
  );
}

function verifyRegistryReleaseChannel(vsix, unpackedRoot) {
  const manifest = JSON.parse(
    readFileSync(resolve(unpackedRoot, 'extension/package.json'), 'utf8'),
  );
  const vsixManifest = readFileSync(resolve(unpackedRoot, 'extension.vsixmanifest'), 'utf8');
  const hasPrereleaseFlag =
    /<Property\s+Id="Microsoft\.VisualStudio\.Code\.PreRelease"\s+Value="true"\s*\/>/u.test(
      vsixManifest,
    );
  const expectedPrerelease = /^\d+\.\d+\.\d+-[0-9A-Za-z.-]+$/u.test(manifest.version);
  if (hasPrereleaseFlag !== expectedPrerelease) {
    throw new Error(
      `${basename(vsix)}: prerelease metadata does not match version ${manifest.version}.`,
    );
  }
}

function unpackProviderVsix(vsix, destination) {
  const archiveRoot = resolve(smokeRoot, `.unpack-${basename(vsix, '.vsix')}`);
  mkdirSync(archiveRoot, { recursive: true });
  extractVsix(vsix, archiveRoot);
  if (basename(vsix) === 'remotish-github-provider.vsix') {
    verifyRegistryReleaseChannel(vsix, archiveRoot);
  }
  cpSync(resolve(archiveRoot, 'extension'), destination, { recursive: true });
  rmSync(archiveRoot, { recursive: true, force: true });
}

rmSync(smokeRoot, { recursive: true, force: true });
mkdirSync(smokeRoot, { recursive: true });
extractVsix(hostVsix, smokeRoot);
verifyRegistryReleaseChannel(hostVsix, smokeRoot);
mkdirSync(dirname(resolve(extensionRoot, 'dist/test/suite/vsix.js')), { recursive: true });
cpSync(testBundle, resolve(extensionRoot, 'dist/test/suite/vsix.js'));
cpSync(bootstrapTestBundle, resolve(extensionRoot, 'dist/test/suite/bootstrap.js'));
cpSync(githubBootstrapTestBundle, resolve(extensionRoot, 'dist/test/suite/github-bootstrap.js'));

mkdirSync(providersRoot, { recursive: true });
for (const providerVsix of providerVsixes) {
  unpackProviderVsix(providerVsix, resolve(providersRoot, basename(providerVsix, '.vsix')));
}

console.log(`Prepared packaged host extension at ${extensionRoot}.`);
console.log(`Prepared ${providerVsixes.length} packaged provider extensions at ${providersRoot}.`);
