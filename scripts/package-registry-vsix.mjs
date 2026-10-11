import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = fileURLToPath(new URL('../', import.meta.url));

export function vscePackageArgs(version, outputPath) {
  if (typeof version !== 'string' || !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/u.test(version)) {
    throw new Error('Expected an exact release version for VSIX packaging.');
  }
  const args = ['package', '--no-dependencies', '--allow-missing-repository', '--out', outputPath];
  if (version.includes('-')) {
    args.push('--pre-release');
  }
  return args;
}

function main(extensionDirectory, outputPath) {
  if (!extensionDirectory || !outputPath) {
    throw new Error('Usage: package-registry-vsix <extension-directory> <output-path>');
  }
  const manifest = JSON.parse(
    readFileSync(resolve(repositoryRoot, extensionDirectory, 'package.json'), 'utf8'),
  );
  const args = [
    '--dir',
    extensionDirectory,
    'exec',
    'vsce',
    ...vscePackageArgs(manifest.version, outputPath),
  ];
  const result = spawnSync(process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm', args, {
    cwd: repositoryRoot,
    stdio: 'inherit',
  });
  if (result.error) {
    throw result.error;
  }
  process.exitCode = result.status ?? 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main(process.argv[2], process.argv[3]);
}
