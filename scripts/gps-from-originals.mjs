// Fills src/data/photoLocations.json from the GPS in your original photos.
//
// WhatsApp strips the location from photos, but the originals in your phone's
// photo library (Google Photos, iCloud, the camera roll) still carry it.
// Export the originals of a trip (or all of them) into one folder and run:
//
//   npm run gps -- "C:\path\to\originals"            (dry run: shows the matches)
//   npm run gps -- "C:\path\to\originals" --write    (saves them)
//   npm run gps -- "C:\path\to\originals" --write --force   (also replaces exact spots)
//
// The file names differ from the site's, so each original is matched to a
// site photo by what it looks like (a 64-bit difference hash of a tiny
// greyscale version). Only confident matches are used. Spots you placed by
// hand or that were suggested are replaced; spots already marked "exact" are
// kept unless you pass --force.
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import exifr from "exifr";

const args = process.argv.slice(2);
const dir = args.find((a) => !a.startsWith("--"));
const WRITE = args.includes("--write");
const FORCE = args.includes("--force");
const MAX_DISTANCE = 10; // of 64 bits; same photo re-compressed stays well under this

if (!dir) {
  console.error('Usage: npm run gps -- "<folder with original photos>" [--write] [--force]');
  process.exit(1);
}

const ROOT = path.resolve(".");
const IMAGE = /\.(jpe?g|png|webp|heic|heif|avif|tiff?|dng)$/i;
const VIDEO = /\.(mp4|webm|mov)$/i;

async function walk(d) {
  const out = [];
  for (const e of await readdir(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (IMAGE.test(e.name)) out.push(p);
  }
  return out;
}

/** 64-bit difference hash: 9×8 greyscale, compare each pixel to its right neighbour. */
async function dhash(input) {
  const px = await sharp(input).rotate().greyscale().resize(9, 8, { fit: "fill" }).raw().toBuffer();
  let bits = 0n;
  for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) bits = (bits << 1n) | (px[y * 9 + x] > px[y * 9 + x + 1] ? 1n : 0n);
  return bits;
}
const distance = (a, b) => { let x = a ^ b, n = 0; while (x) { n += Number(x & 1n); x >>= 1n; } return n; };

/** Hash of an original; HEIC can't be decoded here, so fall back to its embedded preview. */
async function hashOriginal(file) {
  try { return await dhash(file); } catch {}
  try { const thumb = await exifr.thumbnail(file); if (thumb) return await dhash(Buffer.from(thumb)); } catch {}
  return null;
}

// ── Site photos ──
const { VACATIONS } = await import(new URL("file:///" + path.join(ROOT, "src/data/vacations.js").replace(/\\/g, "/")));
const site = [];
for (const v of VACATIONS) {
  const folder = (v.folder || "").replace(/^pictures\/?/, "");
  for (const f of v.pictures || []) {
    if (VIDEO.test(f)) continue;
    const thumb = path.join(ROOT, "public/thumbs", folder, f.replace(/\.[^.]+$/, ".webp"));
    const original = path.join(ROOT, "public/pictures", folder, f);
    let hash = null;
    try { hash = await dhash(thumb); } catch { try { hash = await dhash(original); } catch {} }
    if (hash !== null) site.push({ key: folder + "/" + f, trip: v.id, hash });
  }
}

// ── Originals ──
const files = await walk(path.resolve(dir));
console.log(`${files.length} original photos in ${dir}, ${site.length} photos on the site\n`);
const found = new Map(); // key -> best { lat, lon, file, d }
let noGps = 0, noMatch = 0, unreadable = 0;
for (const file of files) {
  let gps = null;
  try { gps = await exifr.gps(file); } catch {}
  if (!gps || typeof gps.latitude !== "number" || typeof gps.longitude !== "number") { noGps++; continue; }
  const hash = await hashOriginal(file);
  if (hash === null) { unreadable++; continue; }
  let best = null;
  for (const s of site) {
    const d = distance(hash, s.hash);
    if (!best || d < best.d) best = { ...s, d };
  }
  if (!best || best.d > MAX_DISTANCE) { noMatch++; continue; }
  const prev = found.get(best.key);
  if (!prev || best.d < prev.d) found.set(best.key, { lat: +gps.latitude.toFixed(5), lon: +gps.longitude.toFixed(5), file: path.basename(file), d: best.d });
}

// ── Report and write ──
const locPath = path.join(ROOT, "src/data/photoLocations.json");
const locations = JSON.parse(await readFile(locPath, "utf8"));
let added = 0, replaced = 0, kept = 0;
const rows = [...found].sort(([a], [b]) => a.localeCompare(b));
for (const [key, m] of rows) {
  const prev = locations[key];
  let action;
  if (!prev) { action = "new"; added++; }
  else if (prev[2] !== "exact" || FORCE) { action = `replaces ${prev[2]}`; replaced++; }
  else { action = "kept (already exact)"; kept++; }
  console.log(`${key.padEnd(58)} ← ${m.file}  (${m.lat}, ${m.lon})  match ${64 - m.d}/64  ${action}`);
  if (action !== "kept (already exact)") locations[key] = [m.lat, m.lon, "exact"];
}
console.log(`\n${rows.length} matched · ${added} new · ${replaced} replaced · ${kept} kept`);
console.log(`${noGps} without GPS · ${noMatch} not on the site · ${unreadable} unreadable`);

if (WRITE && (added || replaced)) {
  const sorted = Object.fromEntries(Object.keys(locations).sort().map((k) => [k, locations[k]]));
  const body = "{\n" + Object.entries(sorted).map(([k, v]) => `  ${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(",\n") + "\n}\n";
  await writeFile(locPath, body);
  console.log(`\nSaved to src/data/photoLocations.json.`);
} else if (!WRITE && (added || replaced)) {
  console.log(`\nDry run: nothing saved. Add --write to save these.`);
}
