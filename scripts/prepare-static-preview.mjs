import { cp, mkdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = new URL('../', import.meta.url);

const CONTROLLED_HOST_ID = 'hrashton.remotish';
const CONTROLLED_PROPOSALS = ['scmActionButton', 'scmHistoryProvider', 'timeline'];

const providerPaths = {
  'fixture-provider': 'extensions/fixture-provider/',
  'browser-rpc-provider': 'extensions/browser-rpc-provider/',
  'github-provider': 'extensions/github-provider/',
  'git-http-provider': 'extensions/git-http-provider/',
};

export function previewExtensionPaths(sourceRoot, providers = Object.keys(providerPaths)) {
  const unknown = providers.filter((provider) => !(provider in providerPaths));
  if (unknown.length > 0) {
    throw new Error(`Unknown preview provider(s): ${unknown.join(', ')}.`);
  }

  return [
    new URL('apps/demo-web/', sourceRoot),
    ...providers.map((provider) => new URL(providerPaths[provider], sourceRoot)),
  ];
}

export async function prepareStaticPreview({
  dist,
  extensionPaths = previewExtensionPaths(root),
  connectOrigins = ['https://api.github.com'],
}) {
  const distPath = resolve(dist);
  await requireFile(resolve(distPath, 'index.html'), 'Code-OSS static index');
  await requireFile(resolve(distPath, 'additional-extensions.json'), 'additional extension index');
  await requireFile(resolve(distPath, 'extensions.json'), 'extension index');

  const extensions = [];
  for (const source of extensionPaths) {
    extensions.push(await installExtension(distPath, source));
  }

  await updateAdditionalExtensionIndex(distPath, extensions);
  await updateExtensionIndex(distPath, extensions);
  await updateScopedProposalGrants(distPath, extensions);
  await updateConnectSources(distPath, connectOrigins);
  await writeFile(resolve(distPath, 'robots.txt'), 'User-agent: *\nDisallow: /\n');

  return extensions;
}

async function installExtension(distPath, source) {
  const sourcePath = resolve(fileURLToPath(source));
  const manifestPath = resolve(sourcePath, 'package.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  if (typeof manifest.publisher !== 'string' || typeof manifest.name !== 'string') {
    throw new Error(`Invalid extension identity in ${manifestPath}.`);
  }
  if (typeof manifest.browser !== 'string' || !manifest.browser) {
    throw new Error(`${manifest.publisher}.${manifest.name} is not browser-compatible.`);
  }

  await requireFile(
    resolve(sourcePath, manifest.browser),
    `${manifest.publisher}.${manifest.name} browser entry`,
  );

  const id = `${manifest.publisher}.${manifest.name}`;
  const target = resolve(distPath, 'extensions', id);
  await rm(target, { recursive: true, force: true });
  await mkdir(target, { recursive: true });
  await cp(manifestPath, resolve(target, 'package.json'));
  await cp(resolve(sourcePath, 'dist'), resolve(target, 'dist'), { recursive: true });

  return {
    id,
    version: manifest.version ?? null,
    path: `extensions/${id}/`,
    browserCompatible: true,
    license: manifest.license ?? null,
  };
}

/**
 * Grants only the proposals reviewed for the Remotish controlled host.
 * The canonical COSW release and other extensions remain unmodified.
 */
export function withScopedProposalGrants(bootstrap, manifest) {
  if (manifest.publisher !== 'hrashton' || manifest.name !== 'remotish') {
    throw new Error('Only the Remotish host can receive staging API proposal grants.');
  }

  const declared = manifest.enabledApiProposals;
  if (
    !Array.isArray(declared) ||
    declared.length !== CONTROLLED_PROPOSALS.length ||
    !CONTROLLED_PROPOSALS.every((proposal) => declared.includes(proposal))
  ) {
    throw new Error('Remotish staging host must declare exactly the approved API proposals.');
  }

  const marker = '  productConfiguration: {\n';
  if (bootstrap.split(marker).length !== 2 || bootstrap.includes('extensionEnabledApiProposals')) {
    throw new Error('Unexpected COSW product configuration: refusing to inject API grants.');
  }

  const grants = JSON.stringify({ [CONTROLLED_HOST_ID]: CONTROLLED_PROPOSALS });
  return bootstrap.replace(marker, `${marker}    extensionEnabledApiProposals: ${grants},\n`);
}

async function updateScopedProposalGrants(distPath, installed) {
  if (installed.filter((extension) => extension.id === CONTROLLED_HOST_ID).length !== 1) {
    throw new Error('Staging requires exactly one Remotish controlled host.');
  }
  const manifest = JSON.parse(
    await readFile(resolve(distPath, 'extensions', CONTROLLED_HOST_ID, 'package.json'), 'utf8'),
  );
  const path = resolve(distPath, 'static-bootstrap.mjs');
  const bootstrap = await readFile(path, 'utf8');
  await writeFile(path, withScopedProposalGrants(bootstrap, manifest));
}

async function updateAdditionalExtensionIndex(distPath, installed) {
  const path = resolve(distPath, 'additional-extensions.json');
  const index = JSON.parse(await readFile(path, 'utf8'));
  const ids = new Set(installed.map((extension) => extension.id));
  const existing = Array.isArray(index.extensions) ? index.extensions : [];
  index.schemaVersion ??= 1;
  index.extensions = [
    ...existing.filter((extension) => !ids.has(extension.id)),
    ...installed.map(({ id, path: extensionPath }) => ({ id, path: extensionPath })),
  ].sort((left, right) => left.id.localeCompare(right.id));
  await writeJson(path, index);
}

async function updateExtensionIndex(distPath, installed) {
  const path = resolve(distPath, 'extensions.json');
  const index = JSON.parse(await readFile(path, 'utf8'));
  const ids = new Set(installed.map((extension) => extension.id));
  const existing = Array.isArray(index.extensions) ? index.extensions : [];
  index.schemaVersion ??= 1;
  index.extensions = [...existing.filter((extension) => !ids.has(extension.id)), ...installed].sort(
    (left, right) => left.id.localeCompare(right.id),
  );
  await writeJson(path, index);
}

async function updateConnectSources(distPath, connectOrigins) {
  if (connectOrigins.length === 0) {
    return;
  }
  for (const origin of connectOrigins) {
    const url = new URL(origin);
    if (url.protocol !== 'https:' || url.origin !== origin) {
      throw new Error(`Preview connect origin must be an HTTPS origin: ${origin}`);
    }
  }

  const path = resolve(distPath, 'index.html');
  let html = await readFile(path, 'utf8');
  const source = "connect-src 'self';";
  const target = `connect-src 'self' ${connectOrigins.join(' ')};`;
  if (!html.includes(target)) {
    const matches = html.split(source).length - 1;
    if (matches !== 1) {
      throw new Error(`Expected one self-only connect-src directive, found ${matches}.`);
    }
    html = html.replace(source, target);
    await writeFile(path, html);
  }
}

async function requireFile(path, label) {
  try {
    if ((await stat(path)).isFile()) {
      return;
    }
  } catch {
    // Report one stable error below.
  }
  throw new Error(`Missing ${label}: ${path}`);
}

async function writeJson(path, value) {
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  const dist = process.argv[2];
  const sourceRoot = process.argv[3];
  const providers = process.argv.slice(4);
  if (!dist || !sourceRoot) {
    throw new Error(
      'Usage: node scripts/prepare-static-preview.mjs <dist> <source-root> [provider ...]',
    );
  }
  const extensionPaths = previewExtensionPaths(pathToFileURL(`${resolve(sourceRoot)}/`), providers);
  const installed = await prepareStaticPreview({ dist, extensionPaths });
  console.log(
    `Installed ${installed.map((extension) => extension.id).join(', ')} into ${resolve(dist)}.`,
  );
}
