#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const IMG_DIR = "src/img";

async function walk(dir) {
  const out = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

const allFiles = await walk(IMG_DIR);
const pngFiles = allFiles.filter(f => f.endsWith('.png') && !f.includes('favicon'));

let converted = 0;
let skipped = 0;

for (const img of pngFiles) {
  const webpPath = img.replace('.png', '.webp');

  // Check if WebP already exists and is newer than PNG
  try {
    const [pngStat, webpStat] = await Promise.all([
      fs.stat(img),
      fs.stat(webpPath).catch(() => null)
    ]);

    if (webpStat && webpStat.mtime >= pngStat.mtime) {
      skipped++;
      continue;
    }
  } catch (e) {
    // Continue with conversion if stat fails
  }

  try {
    await sharp(img).webp({ quality: 85 }).toFile(webpPath);
    console.log(`Converted: ${img} -> ${webpPath}`);
    converted++;
  } catch (e) {
    console.warn(`Failed to convert ${img}:`, e.message);
  }
}

console.log(`\nDone! Converted: ${converted}, Skipped (up-to-date): ${skipped}`);
