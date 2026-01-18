import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import * as esbuild from "esbuild";
import { minify as minifyHtml } from "html-minifier-terser";

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

// 1) Fingerprint .css/.js and image files
const files = await walk(OUT);
const assetMap = new Map(); // oldRel -> newRel

const assetExts = [".css", ".js", ".webp", ".png", ".jpg", ".jpeg", ".svg"];

for (const file of files) {
  const ext = path.extname(file).toLowerCase();
  // Skip favicons and non-asset files
  if (!assetExts.includes(ext)) continue;
  if (file.includes("favicon")) continue;

  const buf = await fs.readFile(file);
  const h = shortHash(buf);

  const dir = path.dirname(file);
  const base = path.basename(file, ext);

  const newName = `${base}.${h}${ext}`;
  const newPath = path.join(dir, newName);

  const oldRel = toPosix(path.relative(OUT, file));
  const newRel = toPosix(path.relative(OUT, newPath));

  await fs.rename(file, newPath);
  assetMap.set(oldRel, newRel);
}

// 2) Rewrite references inside HTML and CSS files
const after = await walk(OUT);

// Sort by path length descending to replace longer paths first
// This prevents "css.css" from matching inside "w-css.css"
const sortedEntries = [...assetMap.entries()].sort((a, b) => b[0].length - a[0].length);

for (const file of after) {
  if (!file.endsWith(".html") && !file.endsWith(".css")) continue;

  let content = await fs.readFile(file, "utf8");
  const fileDir = toPosix(path.relative(OUT, path.dirname(file)));

  for (const [oldRel, newRel] of sortedEntries) {
    // For files in subdirectories, replace relative paths first
    // e.g., if file is in work/ and asset is work/w-css.css, replace "w-css.css"
    if (fileDir && oldRel.startsWith(fileDir + "/")) {
      const relToFile = oldRel.slice(fileDir.length + 1);
      const newRelToFile = newRel.slice(fileDir.length + 1);
      content = content.split(relToFile).join(newRelToFile);
    }

    // Replace both "foo.css" and "/foo.css" occurrences
    content = content.split(oldRel).join(newRel);
    content = content.split("/" + oldRel).join("/" + newRel);
  }

  // Minify HTML files
  if (file.endsWith(".html")) {
    content = await minifyHtml(content, {
      collapseWhitespace: true,
      removeComments: true,
      minifyCSS: true,
      minifyJS: true,
    });
  }

  await fs.writeFile(file, content);
}

console.log("Built to dist/ with fingerprinted assets");