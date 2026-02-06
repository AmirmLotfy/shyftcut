#!/usr/bin/env node
/**
 * Verifies that the Radix Slot patch was applied.
 * Run after postinstall - fails build if patch missing (e.g. on Vercel).
 */
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const slotPath = join(__dirname, '../node_modules/@radix-ui/react-slot/dist/index.mjs');

if (!existsSync(slotPath)) {
  console.error('❌ @radix-ui/react-slot not found - run npm install');
  process.exit(1);
}

const content = readFileSync(slotPath, 'utf8');
if (!content.includes('slotFn') || !content.includes('childFn')) {
  console.error('❌ Radix Slot patch NOT applied - patches/@radix-ui+react-slot+1.2.4.patch missing or failed');
  console.error('   This causes "X is not a function" in production. Ensure patches/ is committed.');
  process.exit(1);
}

console.log('✔ Radix Slot patch verified');
