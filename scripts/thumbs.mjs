// Generates small WebP thumbnails for every picture in public/pictures into
// public/thumbs (same folder structure, .webp extension). The wall, the map
// markers and the gallery grid load these instead of the full-size originals;
// the lightbox still opens the original. Runs automatically before `start`
// and `build`, and only re-encodes files that are missing or outdated.
import { readdir, stat, mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SRC = path.resolve("public/pictures");
const OUT = path.resolve("public/thumbs");
const WIDTH = 640;
const IMAGE = /\.(jpe?g|png|webp|gif|heic|avif)$/i;

async function walk(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(p)));
    else if (IMAGE.test(entry.name)) out.push(p);
  }
  return out;
}

async function isFresh(src, dest) {
  try {
    const [a, b] = await Promise.all([stat(src), stat(dest)]);
    return b.mtimeMs >= a.mtimeMs;
  } catch {
    return false;
  }
}

const files = await walk(SRC).catch(() => []);
let made = 0;
for (const src of files) {
  const rel = path.relative(SRC, src);
  const dest = path.join(OUT, rel.replace(/\.[^.]+$/, ".webp"));
  if (await isFresh(src, dest)) continue;
  await mkdir(path.dirname(dest), { recursive: true });
  try {
    await sharp(src).rotate().resize({ width: WIDTH, withoutEnlargement: true }).webp({ quality: 78 }).toFile(dest);
    made++;
  } catch (err) {
    console.warn("thumb overgeslagen:", rel, err.message);
  }
}
console.log(`thumbs: ${files.length} foto's, ${made} nieuw gemaakt`);
