// Build: copy src/ to dist/, then give CSS, JS, images and fonts content-hashed
// names (css.0b4ef038.css) and rewrite references to them. Files ship as written:
// Cloudflare compresses them, so minifying would save only ~1KB per file.
import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const SRC = "src";
const OUT = "dist";

async function rmrf(p) {
  await fs.rm(p, { recursive: true, force: true });
}

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const e of entries) {
    if (e.name.startsWith(".") && e.name !== ".well-known") continue; // .DS_Store etc.
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

// Fingerprint assets in two rounds: images and fonts first, so that when CSS
// references them the CSS content (and so its hash) changes too. Then CSS/JS.
// Favicons are left alone so their URLs stay stable.
const assetMap = new Map(); // oldRel -> newRel

async function fingerprint(exts) {
  for (const file of await walk(OUT)) {
    const ext = path.extname(file).toLowerCase();
    if (!exts.includes(ext)) continue;
    if (file.includes("favicon")) continue;

    const h = shortHash(await fs.readFile(file));
    const newPath = path.join(path.dirname(file), `${path.basename(file, ext)}.${h}${ext}`);

    await fs.rename(file, newPath);
    assetMap.set(toPosix(path.relative(OUT, file)), toPosix(path.relative(OUT, newPath)));
  }
}

// Rewrite references to fingerprinted assets inside files with the given extensions
async function rewrite(exts) {
  // Sort by path length descending to replace longer paths first
  // This prevents "css.css" from matching inside "w-css.css"
  const sortedEntries = [...assetMap.entries()].sort((a, b) => b[0].length - a[0].length);

  for (const file of await walk(OUT)) {
    if (!exts.includes(path.extname(file))) continue;

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
      // Covers "foo.css", "/foo.css" and "../foo.css"
      content = content.split(oldRel).join(newRel);
    }

    await fs.writeFile(file, content);
  }
}

await fingerprint([".webp", ".png", ".jpg", ".jpeg", ".svg", ".woff2"]);
await rewrite([".css"]);
await fingerprint([".css", ".js"]);
await rewrite([".html"]);

console.log("Built to dist/ with fingerprinted assets");