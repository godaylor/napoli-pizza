/* global fetch, Buffer, console, AbortSignal, URL, URLSearchParams */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifest = JSON.parse(await readFile(path.join(root, 'src/assets/menu/sources.json'), 'utf8'));
const staged = [];
// Fetch and validate everything before replacing any checked-in image.
// This maintenance command is deliberately NOT part of build or deploy.
for (const asset of manifest.assets) {
  if (!/^[a-z-]+$/.test(asset.key)) throw new Error('Invalid asset key');
  for (const [size, format, quality] of [[960, 'png', 100], ...[480, 960].flatMap(size => [[size, 'jpg', 82], [size, 'webp', 78], [size, 'avif', 60]])]) {
    const url = new URL(asset.download);
    if (url.hostname !== 'images.pexels.com') throw new Error('Unexpected asset host');
    url.search = new URLSearchParams({ fit: 'crop', crop: 'center', w: String(size), h: String(size), fm: format, q: String(quality) }).toString();
    const response = await fetch(url, { signal: AbortSignal.timeout(60000) });
    const type = format === 'jpg' ? 'jpeg' : format;
    if (!response.ok || !response.headers.get('content-type')?.startsWith('image/' + type)) throw new Error('Invalid image response: ' + url);
    const bytes = Buffer.from(await response.arrayBuffer());
    const file = format === 'png' ? 'src/assets/menu/masters/' + asset.key + '.png' : 'public/menu/' + asset.key + '-' + size + '.' + format;
    staged.push({ file, bytes, url: url.href, sha256: createHash('sha256').update(bytes).digest('hex') });
  }
  console.log('Fetched licensed images:', asset.key);
}
for (const entry of staged) {
  const target = path.join(root, entry.file);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, entry.bytes);
}
await writeFile(path.join(root, 'src/assets/menu/checksums.json'), JSON.stringify(staged.map(({ file, url, sha256, bytes }) => ({ file, url, sha256, bytes: bytes.length })), null, 2) + '\n');
console.log('Installed', staged.length, 'licensed images; see sources.json and checksums.json.');
