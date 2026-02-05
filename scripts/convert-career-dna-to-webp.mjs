#!/usr/bin/env node
/**
 * Convert Career DNA PNG avatars to WebP (smaller, faster loading).
 * Run: node scripts/convert-career-dna-to-webp.mjs
 */
import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SRC_DIR = join(__dirname, '..', 'public', 'images', 'career-dna');

async function convert() {
  const files = await readdir(SRC_DIR);
  const pngs = files.filter((f) => f.endsWith('.png'));
  for (const f of pngs) {
    const input = join(SRC_DIR, f);
    const output = join(SRC_DIR, f.replace(/\.png$/i, '.webp'));
    const s = await stat(input);
    await sharp(input)
      .resize(400, 400, { fit: 'cover' })
      .webp({ quality: 85 })
      .toFile(output);
    const outStat = await stat(output);
    console.log(`${f} ${(s.size / 1024).toFixed(1)}KB → ${f.replace('.png', '.webp')} ${(outStat.size / 1024).toFixed(1)}KB`);
  }
  console.log('Done.');
}

convert().catch((e) => {
  console.error(e);
  process.exit(1);
});
