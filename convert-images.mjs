#!/usr/bin/env node
// Turns the originals in img-originals/ into web-sized WebP files in src/img/.
//
//   npm run convert-images
//
// Each original becomes <name>-1280.webp and <name>-2560.webp (only sizes
// smaller than the original are made). Each file is saved lossy or lossless,
// whichever is smaller: flat UI screenshots usually win with lossless.
// The script prints an <img> tag with width/height to paste into the HTML.
import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const SRC_DIR = "img-originals";
const OUT_DIR = "src/img";
const WIDTHS = [1280, 2560];
// Images shown small get their own sizes (2x the displayed size)
const CUSTOM_WIDTHS = { fapfp: [80] };

async function smallestWebp(input, width) {
  const resized = () => sharp(input).resize({ width, withoutEnlargement: true });
  const [lossy, lossless] = await Promise.all([
    resized().webp({ quality: 80 }).toBuffer({ resolveWithObject: true }),
    resized().webp({ lossless: true }).toBuffer({ resolveWithObject: true }),
  ]);
  return lossy.data.length <= lossless.data.length ? lossy : lossless;
}

const files = (await fs.readdir(SRC_DIR)).filter((f) => /\.(png|jpe?g|webp)$/i.test(f));

for (const file of files) {
  const input = path.join(SRC_DIR, file);
  const name = path.parse(file).name;
  const { width } = await sharp(input).metadata();

  let widths = CUSTOM_WIDTHS[name] || WIDTHS.filter((w) => w <= width);
  // Originals barely bigger than the smallest size stay at their own width:
  // resampling them costs sharpness and often makes the file bigger
  if (!CUSTOM_WIDTHS[name] && width < WIDTHS[0] * 1.25) widths = [width];

  const made = [];
  for (const w of widths) {
    const out = path.join(OUT_DIR, `${name}-${w}.webp`);
    const [srcStat, outStat] = await Promise.all([fs.stat(input), fs.stat(out).catch(() => null)]);
    if (!outStat || outStat.mtime < srcStat.mtime) {
      const { data } = await smallestWebp(input, w);
      await fs.writeFile(out, data);
      console.log(`${out}  ${Math.round(data.length / 1024)}KB`);
    }
    const meta = await sharp(out).metadata();
    made.push({ w, h: meta.height, file: `img/${name}-${w}.webp` });
  }

  const first = made[0];
  const srcset = made.length > 1 ? ` srcset="${made.map((m) => `${m.file} ${m.w}w`).join(", ")}"` : "";
  console.log(`  <img src="${first.file}"${srcset} width="${first.w}" height="${first.h}" alt="">\n`);
}
