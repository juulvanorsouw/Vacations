// Generates small WebP thumbnails for every picture in public/pictures into
// public/thumbs (same folder structure, .webp extension). The wall, the map
// markers and the gallery grid load these instead of the full-size originals;
// the lightbox still opens the original. Runs automatically before `start`
// and `build`, and only re-encodes files that are missing or outdated.
import { readdir, stat, mkdir, writeFile, copyFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SRC = path.resolve("public/pictures");
const OUT = path.resolve("public/thumbs");
const WIDTH = 640;
const LARGE = [1080, 1600];
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
// Per photo ("folder/file.jpeg" -> ["#rrggbb", width, height]): the dominant
// colour is painted behind each image while it loads so a slow phone shows
// colour, not blanks; the size lets the gallery reserve the right shape.
const colors = {};
for (const src of files) {
  const rel = path.relative(SRC, src);
  const dest = path.join(OUT, rel.replace(/\.[^.]+$/, ".webp"));
  if (!(await isFresh(src, dest))) {
    await mkdir(path.dirname(dest), { recursive: true });
    try {
      await sharp(src).rotate().resize({ width: WIDTH, withoutEnlargement: true }).webp({ quality: 78 }).toFile(dest);
      made++;
    } catch (err) {
      console.warn("thumb overgeslagen:", rel, err.message);
      continue;
    }
  }
  // Larger sizes for the lightbox and the trip page cover (srcset), so a phone
  // never has to download the full WhatsApp original.
  for (const w of LARGE) {
    const big = path.join(OUT, String(w), rel.replace(/\.[^.]+$/, ".webp"));
    if (await isFresh(src, big)) continue;
    await mkdir(path.dirname(big), { recursive: true });
    try {
      await sharp(src).rotate().resize({ width: w, withoutEnlargement: true }).webp({ quality: 80 }).toFile(big);
      made++;
    } catch (err) {
      console.warn(`${w}px overgeslagen:`, rel, err.message);
    }
  }
  try {
    const img = sharp(dest);
    const [{ dominant: { r, g, b } }, { width, height }] = await Promise.all([img.stats(), img.metadata()]);
    const hex = "#" + [r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("");
    colors[rel.split(path.sep).join("/")] = [hex, width, height];
  } catch { /* no colour, the print falls back to cream */ }
}
await writeFile(path.resolve("src/data/photoColors.json"), JSON.stringify(colors, null, 0) + "\n");
console.log(`thumbs: ${files.length} foto's, ${made} nieuw gemaakt`);

// Flags for every country the trips touch, copied from the flag-icons package.
const { VACATIONS } = await import("../src/data/vacations.js");
const isos = new Set(VACATIONS.flatMap((v) => [v.country, ...(v.countries || [])]).filter(Boolean).map((c) => c.toLowerCase()));
const FLAGS = path.resolve("public/flags");
await mkdir(FLAGS, { recursive: true });
let flags = 0;
for (const iso of isos) {
  try { await copyFile(path.resolve("node_modules/flag-icons/flags/4x3", iso + ".svg"), path.join(FLAGS, iso + ".svg")); flags++; }
  catch { console.warn("vlag ontbreekt:", iso); }
}
console.log(`vlaggen: ${flags} gekopieerd`);

// ── Share preview (og:image) and app icons ─────────────────────────────────
// A 1200×630 collage of the six newest trip covers as tilted prints on the
// wall, so a shared link shows photos instead of a grey card. Rebuilt every
// run so it follows new trips.
const PIN = "#e2574b", WALL = "#f8f5ef";
const sorted = VACATIONS.slice().sort((a, b) => (b.startDate || "").localeCompare(a.startDate || ""));
const covers = [];
for (const v of sorted) {
  const p = (v.pictures || []).find((f) => !/\.(mp4|webm|mov)$/i.test(f));
  if (!p) continue;
  const rel = v.folder.replace(/^pictures\/?/, "") + "/" + p.replace(/\.[^.]+$/, ".webp");
  covers.push(path.join(OUT, rel));
  if (covers.length === 6) break;
}
const PRINT = 300, FRAME = 14, BOTTOM = 46;
const prints = [];
const tilts = [-5, 3, -2, 4, -4, 2];
for (let i = 0; i < covers.length; i++) {
  try {
    const photo = await sharp(covers[i]).resize(PRINT, PRINT, { fit: "cover" }).toBuffer();
    const frame = await sharp({ create: { width: PRINT + FRAME * 2, height: PRINT + FRAME + BOTTOM, channels: 4, background: "#ffffff" } })
      .composite([
        { input: photo, left: FRAME, top: FRAME },
        { input: Buffer.from(`<svg width="22" height="22"><circle cx="11" cy="11" r="9" fill="${PIN}"/></svg>`), left: (PRINT + FRAME * 2) / 2 - 11, top: 0 },
      ])
      .png().toBuffer();
    prints.push(await sharp(frame).rotate(tilts[i], { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer());
  } catch (err) { console.warn("og-print overgeslagen:", err.message); }
}
const slots = [[30, 20], [420, 40], [810, 15], [-60, 330], [380, 345], [790, 320]];
await sharp({ create: { width: 1200, height: 630, channels: 4, background: WALL } })
  .composite(prints.map((input, i) => ({ input, left: Math.max(0, slots[i][0]), top: slots[i][1] })).filter((c) => c.left < 1200))
  .jpeg({ quality: 82 })
  .toFile(path.resolve("public/og-image.jpg"));

// App icons for the home screen, from the Polaroid favicon.
const ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" fill="${WALL}"/><rect x="12" y="9" width="40" height="47" rx="2" fill="#fff" stroke="#d9d2c6" stroke-width="1.5"/><rect x="16" y="13" width="32" height="30" fill="#b7c9d3"/><circle cx="32" cy="11" r="4.5" fill="${PIN}"/></svg>`;
for (const [name, size] of [["icon-192.png", 192], ["icon-512.png", 512], ["apple-touch-icon.png", 180]]) {
  await sharp(Buffer.from(ICON_SVG)).resize(size, size).png().toFile(path.resolve("public", name));
}
console.log(`deelafbeelding: ${prints.length} foto's · iconen gemaakt`);
