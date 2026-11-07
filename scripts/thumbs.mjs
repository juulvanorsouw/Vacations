// Generates small WebP thumbnails for every picture in public/pictures into
// public/thumbs (same folder structure, .webp extension). The wall, the map
// markers and the gallery grid load these instead of the full-size originals;
// the lightbox still opens the original. Runs automatically before `start`
// and `build`, and only re-encodes files that are missing or outdated.
import { readdir, stat, mkdir, readFile, writeFile, copyFile, rm } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import path from "node:path";
import sharp from "sharp";

const run = promisify(execFile);

const SRC = path.resolve("public/pictures");
const OUT = path.resolve("public/thumbs");
const WIDTH = 640;
const LARGE = [1080, 1600];
const IMAGE = /\.(jpe?g|png|webp|gif|heic|avif)$/i;
const VIDEO = /\.(mp4|webm|mov)$/i;
const SITE = "https://juulvanorsouw.github.io/Vacations/";

async function walk(dir, re = IMAGE) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await walk(p, re)));
    else if (re.test(entry.name)) out.push(p);
  }
  return out;
}

// ffmpeg / ffprobe are optional: the GitHub runner has them, a laptop may not.
async function has(cmd) {
  try { await run(cmd, ["-version"]); return true; } catch { return false; }
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
// ── Video posters ──────────────────────────────────────────────────────────
// A still frame (~1s in) per video, written next to the photo thumbnails as
// thumbs/<folder>/<name>.webp, so the gallery and the wall show a picture
// instead of loading the video. Its entry in photoColors.json gets the video's
// own size, plus a 4th value 1 when the file has no audio track (those loop
// muted inline). Without ffmpeg no new posters are made (quietly); posters
// already on disk keep their entry from the previous run.
const videos = await walk(SRC, VIDEO).catch(() => []);
const previous = JSON.parse(await readFile(path.resolve("src/data/photoColors.json"), "utf8").catch(() => "{}"));
let posters = 0;
if (videos.length) {
  const ffmpeg = await has("ffmpeg");
  const probe = ffmpeg && (await has("ffprobe"));
  for (const src of videos) {
    const rel = path.relative(SRC, src);
    const key = rel.split(path.sep).join("/");
    const dest = path.join(OUT, rel.replace(/\.[^.]+$/, ".webp"));
    const fresh = await isFresh(src, dest);
    if (!fresh && !ffmpeg) continue;
    if (!fresh) {
      await mkdir(path.dirname(dest), { recursive: true });
      const tmp = dest + ".poster.png";
      try {
        // -ss before -i seeks fast; a clip shorter than 1s falls back to its first frame.
        for (const at of ["1", "0"]) {
          await run("ffmpeg", ["-y", "-loglevel", "error", "-ss", at, "-i", src, "-frames:v", "1", tmp]);
          if (await stat(tmp).then((s) => s.size > 0, () => false)) break;
        }
        await sharp(tmp).resize({ width: WIDTH, withoutEnlargement: true }).webp({ quality: 78 }).toFile(dest);
        posters++;
      } catch (err) {
        console.warn("poster overgeslagen:", rel, err.message);
        continue;
      } finally {
        await rm(tmp, { force: true });
      }
    }
    try {
      const img = sharp(dest);
      const [{ dominant: { r, g, b } }, meta] = await Promise.all([img.stats(), img.metadata()]);
      const hex = "#" + [r, g, b].map((n) => n.toString(16).padStart(2, "0")).join("");
      let width = meta.width, height = meta.height, silent = 0;
      if (!probe && previous[key]) [, width, height, silent = 0] = previous[key];
      else if (probe) {
        // The real (rotation-aware) frame size and whether there is any audio.
        const { stdout } = await run("ffprobe", ["-v", "error", "-show_streams", "-of", "json", src]);
        const streams = JSON.parse(stdout).streams || [];
        const v = streams.find((s) => s.codec_type === "video");
        if (v?.width && v?.height) {
          const rot = Math.abs(Number(v.tags?.rotate || v.side_data_list?.find((d) => d.rotation != null)?.rotation || 0)) % 180;
          [width, height] = rot === 90 ? [v.height, v.width] : [v.width, v.height];
        }
        silent = streams.some((s) => s.codec_type === "audio") ? 0 : 1;
      }
      colors[key] = silent ? [hex, width, height, 1] : [hex, width, height];
    } catch { /* no poster colour; the tile falls back to cream */ }
  }
  console.log(`posters: ${videos.length} video's, ${posters} nieuw gemaakt${ffmpeg ? "" : " (geen ffmpeg)"}`);
}

await writeFile(path.resolve("src/data/photoColors.json"), JSON.stringify(colors, null, 0) + "\n");
console.log(`thumbs: ${files.length} foto's, ${made} nieuw gemaakt`);

// Flags for every country the trips touch, copied from the flag-icons package.
const { VACATIONS } = await import("../src/data/vacations.js");
const { TRIPS_EN } = await import("../src/data/vacations.en.js");
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

// ── Per-trip share previews ────────────────────────────────────────────────
// GitHub Pages serves only static files, so a crawler never sees #<id>. Each
// trip gets a tiny page at trip/<id>/ with its own og: tags (title, story and
// cover) that sends visitors straight on to ../../#<id>. Share that URL.
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const TRIPS = path.resolve("public/trip");
await rm(TRIPS, { recursive: true, force: true });
let stubs = 0;
for (const v of VACATIONS) {
  if (!v.id || !/^[\w-]+$/.test(v.id)) continue;
  const folder = (v.folder || "").replace(/^\/+/, "").replace(/^pictures\/?/, "");
  const pics = v.pictures || [];
  // Same cover as the trip page: "cover" when set, else the first photo.
  const photo = v.cover && pics.includes(v.cover) && !VIDEO.test(v.cover) ? v.cover : pics.find((f) => !VIDEO.test(f));
  const enc = (rel) => rel.split("/").map(encodeURIComponent).join("/");
  let image = SITE + "og-image.jpg";
  if (photo) image = SITE + "thumbs/1080/" + enc(folder + "/" + photo.replace(/\.[^.]+$/, ".webp"));
  else if (pics[0] && colors[folder + "/" + pics[0]]) image = SITE + "thumbs/" + enc(folder + "/" + pics[0].replace(/\.[^.]+$/, ".webp"));
  // One page per language: trip/<id>/ in Dutch and trip/<id>/en/ in English.
  // Each sets the site language before sending the visitor on, so the link
  // you share opens the trip in the language it was shared in.
  const en = TRIPS_EN[v.id] || {};
  for (const lang of ["nl", "en"]) {
    const isEn = lang === "en";
    const title = (isEn && en.title) || v.title || v.id;
    const desc = ((isEn && en.description) || v.description || (isEn && en.location) || v.location || "").replace(/\s+/g, " ").trim().slice(0, 200);
    const site = isEn ? "Juul's travels" : "Juuls reizen";
    const target = (isEn ? "../../../#" : "../../#") + v.id;
    const url = SITE + "trip/" + v.id + "/" + (isEn ? "en/" : "");
    const html = `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} · ${esc(site)}</title>
<meta name="description" content="${esc(desc)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="${esc(site)}">
<meta property="og:locale" content="${isEn ? "en_GB" : "nl_NL"}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(image)}">
<meta property="og:url" content="${esc(url)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="canonical" href="${esc(SITE + "#" + v.id)}">
<link rel="alternate" hreflang="nl" href="${esc(SITE + "trip/" + v.id + "/")}">
<link rel="alternate" hreflang="en" href="${esc(SITE + "trip/" + v.id + "/en/")}">
<meta http-equiv="refresh" content="0; url=${esc(target)}">
<script>try { localStorage.setItem("lang", ${JSON.stringify(lang)}); } catch (e) {} location.replace(${JSON.stringify(target)});</script>
</head>
<body><a href="${esc(target)}">${esc(title)}</a></body>
</html>
`;
    const dir = isEn ? path.join(TRIPS, v.id, "en") : path.join(TRIPS, v.id);
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, "index.html"), html);
  }
  stubs++;
}
console.log(`deelpagina's: ${stubs} reizen (nl + en)`);
