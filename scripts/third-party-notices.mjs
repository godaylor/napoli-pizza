/* global process */
import { readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const lock = JSON.parse(await readFile(path.join(root, 'package-lock.json'), 'utf8'));
const sections = ['Napoli — third-party software notices',
  'Generated from installed packages and package-lock.json. Includes non-dev, non-optional dependencies (including build-time Sass).',
  'This file does not grant rights to Napoli source code, food artwork, or remotely served fonts. See docs/ASSET-LICENSES.md.'];

for (const [directory, entry] of Object.entries(lock.packages).sort(([a], [b]) => a.localeCompare(b, 'en'))) {
  if (!directory || entry.dev || entry.optional) continue;
  const absolute = path.join(root, directory);
  const pkg = JSON.parse(await readFile(path.join(absolute, 'package.json'), 'utf8'));
  if (pkg.version !== entry.version) throw new Error(`Install differs from lockfile: ${directory}`);
  const names = (await readdir(absolute)).filter((name) => /^(licen[sc]e|copying|notice)(\.|$)/i.test(name)).sort();
  sections.push(`${pkg.name}@${pkg.version} — ${pkg.license ?? 'See license text'} (${directory})`);
  if (names.length === 0) {
    const readme = await readFile(path.join(absolute, 'README.md'), 'utf8').catch(() => '');
    const embeddedLicense = readme.match(/^## license\s*\n([\s\S]+)$/im)?.[1];
    if (!embeddedLicense?.includes('Permission is hereby granted')) {
      throw new Error(`Missing license text: ${pkg.name}`);
    }
    sections.push(embeddedLicense.trim());
  }
  for (const name of names) sections.push(await readFile(path.join(absolute, name), 'utf8'));
}

await writeFile(path.join(root, 'public', 'THIRD-PARTY-NOTICES.txt'), sections.join('\n\n--------------------\n\n') + '\n', 'utf8');
process.stdout.write('Updated public/THIRD-PARTY-NOTICES.txt from installed license texts.\n');
