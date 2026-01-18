import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import * as esbuild from "esbuild";
import sharp from "sharp";

const SRC = "src";
const OUT = "dist";

async function rmrf(p) {
  await fs.rm(p, { recursive: true, force: true });
}

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const e of entries) {
    const from = path.join(src, e.name);
    const to = path.join(dest, e.name);
    if (e.isDirectory()) await copyDir(from, to);
    else await fs.copyFile(from, to);
  }
}

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

function shortHash(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex").slice(0, 8);
}

function toPosix(p) {
  return p.split(path.sep).join("/");
}

await rmrf(OUT);
await copyDir(SRC, OUT);

// Minify CSS and JS files
const cssFiles = ['css.css', 'dark.css', 'work/w-css.css'];
const jsFiles = ['js.js', 'work/w-js.js'];

for (const file of cssFiles) {
  const srcPath = path.join(SRC, file);
  const outPath = path.join(OUT, file);
  try {
    await esbuild.build({
      entryPoints: [srcPath],
      bundle: false,
      minify: true,
      outfile: outPath,
      loader: { '.css': 'css' },
    });
  } catch (e) {
    // If minification fails, just copy the file
    await fs.copyFile(srcPath, outPath);
  }
}

for (const file of jsFiles) {
  const srcPath = path.join(SRC, file);
  const outPath = path.join(OUT, file);
  try {
    await esbuild.build({
      entryPoints: [srcPath],
      bundle: false,
      minify: true,
      outfile: outPath,
    });
  } catch (e) {
    // If minification fails, just copy the file
    await fs.copyFile(srcPath, outPath);
  }
}

// Convert PNG images to WebP (excluding favicons)
const allFiles = await walk(OUT);
const pngFiles = allFiles.filter(f => f.endsWith('.png') && !f.includes('favicon'));
for (const img of pngFiles) {
  const webpPath = img.replace('.png', '.webp');
  try {
    await sharp(img).webp({ quality: 85 }).toFile(webpPath);
  } catch (e) {
    console.warn(`Failed to convert ${img} to WebP:`, e.message);
  }
}
console.log(`Converted ${pngFiles.length} PNG images to WebP`);

// 1) Fingerprint .css/.js files
const files = await walk(OUT);
const assetMap = new Map(); // oldRel -> newRel

for (const file of files) {
  if (!file.endsWith(".css") && !file.endsWith(".js")) continue;

  const buf = await fs.readFile(file);
  const h = shortHash(buf);

  const dir = path.dirname(file);
  const ext = path.extname(file);
  const base = path.basename(file, ext);

  const newName = `${base}.${h}${ext}`;
  const newPath = path.join(dir, newName);

  const oldRel = toPosix(path.relative(OUT, file));
  const newRel = toPosix(path.relative(OUT, newPath));

  await fs.rename(file, newPath);
  assetMap.set(oldRel, newRel);
}

// 2) Rewrite references inside all HTML files
const after = await walk(OUT);
for (const file of after) {
  if (!file.endsWith(".html")) continue;

  let html = await fs.readFile(file, "utf8");
  const htmlDir = toPosix(path.relative(OUT, path.dirname(file)));

  // Sort by path length descending to replace longer paths first
  // This prevents "css.css" from matching inside "w-css.css"
  const sortedEntries = [...assetMap.entries()].sort((a, b) => b[0].length - a[0].length);

  for (const [oldRel, newRel] of sortedEntries) {
    // For HTML files in subdirectories, replace relative paths first
    // e.g., if HTML is in work/ and asset is work/w-css.css, replace "w-css.css"
    if (htmlDir && oldRel.startsWith(htmlDir + "/")) {
      const relToHtml = oldRel.slice(htmlDir.length + 1);
      const newRelToHtml = newRel.slice(htmlDir.length + 1);
      html = html.split(relToHtml).join(newRelToHtml);
    }

    // Replace both "foo.css" and "/foo.css" occurrences
    html = html.split(oldRel).join(newRel);
    html = html.split("/" + oldRel).join("/" + newRel);
  }

  await fs.writeFile(file, html);
}

console.log("Built to dist/ with fingerprinted CSS/JS");