import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { motion, useReducedMotion } from "motion/react";
import FlagImg from "@/components/FlagImg";
import {
  joinPath, thumbPath, thumbFallback, photoColor, photoRatio, formatDateRange, formatMonthYear,
  tripDays, formatDays, routeStops, isVideo, photoCaption, srcSetFor,
  tripPhotoSpots,
  coverMedia, videoPoster, prefersReducedMotion,
} from "@/lib/helpers";
import { t, tripText } from "@/lib/i18n";
import { drawRoute, hasTravelModes, routeFrame } from "@/lib/routeAnim";
import PHOTO_COLORS from "@/data/photoColors.json";

/** Width of the docked trip panel on desktop; App shrinks the wall by the same amount. */
export const PANEL_WIDTH = "clamp(560px, 44vw, 640px)";

/**
 * A trip as its own page: cover photo, story, a small route map, every photo
 * in its own shape, and the neighbouring trips in time. Full screen on phones
 * and tablets; `docked` (desktop) makes it a panel on the right, below the
 * header, with the wall still usable on the left.
 */
export default function TripPage({ trip, newer, older, docked, onClose, onGoTo, onOpenLightbox, onViewOnMap }) {
  const scrollRef = useRef(null);
  const touch = useRef(null);
  const reduce = useReducedMotion();
  const [pastCover, setPastCover] = useState(false);

  useEffect(() => { scrollRef.current?.scrollTo({ top: 0 }); setPastCover(false); }, [trip.id]);

  // Which gallery photo is in the middle of the screen: its pin lights up on
  // the floating mini-map while you scroll through the photos.
  const [focusIdx, setFocusIdx] = useState(null);
  const spotCount = tripPhotoSpots(trip).filter((p) => !isVideo(p.file)).length;
  const showMini = spotCount >= 2 && focusIdx !== null;
  useEffect(() => {
    setFocusIdx(null);
    const root = scrollRef.current;
    if (!root || spotCount < 2) return;
    const spotIdx = new Set(tripPhotoSpots(trip).map((p) => p.index));
    let raf = 0;
    // A reading line across the screen: in the middle while scrolling, moving
    // down to 85% over the last screenful so the bottom rows also get a turn.
    const update = () => {
      raf = 0;
      const tiles = [...root.querySelectorAll("[data-photo]")];
      if (!tiles.length) return;
      const box = root.getBoundingClientRect();
      const toEnd = root.scrollHeight - root.clientHeight - root.scrollTop;
      const f = Math.min(1, Math.max(0, 1 - toEnd / root.clientHeight));
      const line = box.top + root.clientHeight * (0.5 + 0.35 * f);
      const rects = tiles.map((el) => el.getBoundingClientRect());
      const first = rects[0].top, last = Math.max(...rects.map((r) => r.bottom));
      // Before the gallery reaches the line: nothing. Past it: the last row
      // stays lit as long as it is still on screen.
      if (line < first - 8 || last < box.top + 80) { setFocusIdx(null); return; }
      // The tile on the line (or the nearest row to it), leftmost first.
      let best = 0, bestD = Infinity;
      rects.forEach((r, i) => {
        const d = line < r.top ? r.top - line : line > r.bottom ? line - r.bottom : 0;
        if (d < bestD - 0.5) { bestD = d; best = i; }
      });
      // Of the photos on that row, prefer one that has a pin on the map.
      const row = rects.map((r, i) => i).filter((i) => Math.abs(rects[i].top - rects[best].top) < 4);
      const pinned = row.find((i) => spotIdx.has(+tiles[i].dataset.photo));
      setFocusIdx(+tiles[pinned ?? best].dataset.photo);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    // Touching or hovering a photo lights up its own pin (photos side by side in a row).
    const onPoint = (e) => { const tile = e.target.closest?.("[data-photo]"); if (tile && root.contains(tile)) setFocusIdx(+tile.dataset.photo); };
    root.addEventListener("scroll", onScroll, { passive: true });
    root.addEventListener("pointerover", onPoint);
    root.addEventListener("touchstart", onPoint, { passive: true });
    update();
    return () => {
      root.removeEventListener("scroll", onScroll);
      root.removeEventListener("pointerover", onPoint);
      root.removeEventListener("touchstart", onPoint);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [trip.id, spotCount]);

  const pics = trip.pictures || [];
  const srcs = pics.map((p) => joinPath(trip.folder, p));
  const captions = pics.map((_, i) => photoCaption(trip, i, pics.length));
  // The trip's own cover ("cover" in vacations.js), which may be a video.
  const media = coverMedia(trip);
  const cover = media ? media.file : null;
  const coverIdx = cover ? pics.indexOf(cover) : -1;
  const days = tripDays(trip);
  const stops = routeStops(trip);
  const text = tripText(trip);

  return (
    <motion.div
      className={docked
        ? "fixed right-0 bottom-0 top-[calc(54px+env(safe-area-inset-top))] z-[1000] bg-wall border-l border-line shadow-[-12px_0_32px_-12px_rgba(0,0,0,.25)]"
        : "fixed inset-0 z-[1000] bg-wall"}
      style={docked ? { width: PANEL_WIDTH } : undefined}
      initial={reduce ? { opacity: 0 } : docked ? { opacity: 0, x: 40 } : { opacity: 0, y: 28 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={reduce ? { opacity: 0 } : docked ? { opacity: 0, x: 40 } : { opacity: 0, y: 28 }}
      transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
      role="dialog"
      aria-modal={docked ? undefined : "true"}
      aria-label={text.title}
    >
      {/* Floating controls over the cover photo */}
      {spotCount >= 2 && (
        <MiniMap trip={trip} focusIdx={focusIdx} visible={showMini} onOpen={() => onViewOnMap(trip.id)} />
      )}
      {/* Floating over the cover; once the cover has scrolled away they get a bar so they never sit on text. */}
      <div className={`absolute top-0 inset-x-0 z-10 flex items-center justify-between gap-2 px-3 sm:px-5 ${docked ? "pt-3" : "pt-[max(.75rem,env(safe-area-inset-top))]"} pb-3 pointer-events-none transition-colors duration-200 ${pastCover ? "bg-wall/95 backdrop-blur-md border-b border-line" : ""}`}>
        {pastCover && <span className="absolute left-1/2 -translate-x-1/2 bottom-3.5 font-hand text-[22px] leading-none text-ink truncate max-w-[45%]">{text.title}</span>}
        <button
          onClick={onClose}
          className="pointer-events-auto h-10 pl-3 pr-4 rounded-full bg-paper/90 backdrop-blur-md shadow-md text-ink text-sm font-medium flex items-center gap-1.5 active:scale-95 transition"
          aria-label={docked ? t("close") : t("back")}
        >
          <span className="text-xl leading-none -mt-0.5" aria-hidden="true">{docked ? "×" : "‹"}</span> {docked ? t("close") : t("back")}
        </button>
        <div className="pointer-events-auto flex gap-2">
          <RoundButton disabled={!newer} onClick={() => newer && onGoTo(newer.id)} label={newer ? `${t("newerTrip")}: ${tripText(newer).title}` : t("noNewerTrip")}>‹</RoundButton>
          <RoundButton disabled={!older} onClick={() => older && onGoTo(older.id)} label={older ? `${t("olderTrip")}: ${tripText(older).title}` : t("noOlderTrip")}>›</RoundButton>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="h-full overflow-y-auto overscroll-contain"
        onScroll={(e) => {
          const past = e.currentTarget.scrollTop > e.currentTarget.clientHeight * 0.45;
          if (past !== pastCover) setPastCover(past);
        }}
        onTouchStart={(e) => { const p = e.changedTouches[0]; touch.current = { x: p.clientX, y: p.clientY }; }}
        onTouchEnd={(e) => {
          if (!touch.current) return;
          const p = e.changedTouches[0];
          const dx = p.clientX - touch.current.x, dy = p.clientY - touch.current.y;
          touch.current = null;
          if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 2) {
            const next = dx < 0 ? older : newer;
            if (next) onGoTo(next.id);
          }
        }}
      >
        {/* Cover */}
        <header className="relative">
          {cover ? (
            <button
              className={`block w-full overflow-hidden ${docked ? "h-[clamp(260px,46dvh,440px)]" : "h-[clamp(300px,58dvh,620px)]"}`}
              style={{ backgroundColor: photoColor(trip.folder, cover) || "var(--cream)" }}
              onClick={() => onOpenLightbox(srcs, captions, coverIdx)}
              aria-label={`${t("openPhoto")}: ${captions[coverIdx]}`}
            >
              {media.video ? (
                // A cover video plays muted on a loop; tap opens it with sound in the lightbox.
                <video
                  src={srcs[coverIdx]}
                  poster={videoPoster(trip.folder, cover) || undefined}
                  muted
                  playsInline
                  loop
                  autoPlay={!prefersReducedMotion()}
                  className="w-full h-full object-cover block pointer-events-none"
                />
              ) : (
                <img
                  src={srcs[coverIdx]}
                  srcSet={srcSetFor(srcs[coverIdx])}
                  sizes={docked ? PANEL_WIDTH : "100vw"}
                  alt=""
                  decoding="async"
                  fetchpriority="high"
                  className="w-full h-full object-cover block"
                />
              )}
            </button>
          ) : (
            <div className="w-full h-[clamp(220px,36dvh,360px)] bg-cream flex items-center justify-center">
              <FlagImg iso={trip.country} className="w-20 h-14" />
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black/60 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0">
            <div className="max-w-[880px] mx-auto px-4 sm:px-8 pb-4 sm:pb-6 text-white">
              <div className="flex items-center gap-2 text-[11px] tracking-widest uppercase opacity-90">
                <FlagImg iso={trip.country} className="w-5 h-3.5" />
                <span className="truncate">{text.location || text.title}</span>
              </div>
              <h1 className="font-hand text-[48px] leading-[.95] m-0 mt-1 [text-shadow:0_2px_12px_rgba(0,0,0,.35)]">{text.title}</h1>
            </div>
          </div>
        </header>

        <div className="max-w-[880px] mx-auto px-4 sm:px-8 pt-4 sm:pt-6 pb-[calc(2.5rem+env(safe-area-inset-bottom))] flex flex-col gap-6 sm:gap-8">
          <div className="flex flex-col gap-3">
            <p className="text-[13px] text-ink-2 tabular-nums m-0">
              {formatDateRange(trip.startDate, trip.endDate)}
              {days ? ` · ${formatDays(days)}` : ""}
              {pics.length ? ` · ${t("photos", pics.length)}` : ""}
            </p>
            {text.description && <p className="text-[16px] sm:text-[17px] leading-relaxed text-ink m-0 max-w-[62ch]">{text.description}</p>}
          </div>

          <RouteMap trip={trip} stops={stops} onOpen={() => onViewOnMap(trip.id)} />

          {pics.length > 0 ? (
            <Gallery trip={trip} docked={docked} pics={pics} srcs={srcs} captions={captions} focusIdx={showMini ? focusIdx : null} onOpen={(i) => onOpenLightbox(srcs, captions, i)} />
          ) : (
            <div className="text-ink-2 text-sm text-center py-10 border border-dashed border-line-h">{t("noPhotosForTrip")}</div>
          )}

          {(newer || older) && (
            <nav className="grid grid-cols-2 gap-3 pt-2 border-t border-line" aria-label={t("otherTrips")}>
              {newer ? <NeighbourLink trip={newer} dir="newer" onClick={() => onGoTo(newer.id)} /> : <span />}
              {older ? <NeighbourLink trip={older} dir="older" onClick={() => onGoTo(older.id)} /> : <span />}
            </nav>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function RoundButton({ onClick, label, disabled, children }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="w-10 h-10 rounded-full bg-paper/90 backdrop-blur-md shadow-md text-ink text-2xl leading-none flex items-center justify-center active:scale-95 transition disabled:opacity-40"
    >
      <span className="-mt-0.5" aria-hidden="true">{children}</span>
    </button>
  );
}

function NeighbourLink({ trip, dir, onClick }) {
  const older = dir === "older";
  return (
    <button
      onClick={onClick}
      className={`flex flex-col gap-0.5 py-3 min-w-0 ${older ? "items-end text-right" : "items-start text-left"} group`}
    >
      <span className="text-[11px] tracking-widest uppercase text-ink-2">{older ? `${t("olderTrip")} ›` : `‹ ${t("newerTrip")}`}</span>
      <span className="font-hand text-[22px] leading-none text-ink truncate max-w-full group-hover:underline decoration-line-h">{tripText(trip).title}</span>
      <span className="text-[12px] text-ink-2 tabular-nums">{formatMonthYear(trip.startDate)}</span>
    </button>
  );
}

/**
 * Justified rows: every item grows in proportion to its width/height ratio, so
 * each row fills the width at about the same height and photos keep their
 * shape and their order. The trailing spacer stops the last row stretching.
 */
function Gallery({ trip, docked, pics, srcs, captions, onOpen, focusIdx }) {
  const [videoRatios, setVideoRatios] = useState({});
  return (
    <div className={`flex flex-wrap gap-1 [--rh:150px] ${docked ? "[--rh:170px]" : "sm:[--rh:220px]"}`}>
      {pics.map((p, i) => {
        const vid = isVideo(p);
        // Videos get their size from scripts/thumbs.mjs too (via ffprobe); the
        // ratio read from the video itself is only the fallback without ffmpeg.
        const ratio = photoRatio(trip.folder, p) || (vid ? videoRatios[p] || 9 / 16 : 1);
        return (
          <button
            key={p}
            data-photo={i}
            onClick={() => onOpen(i)}
            className={`relative overflow-hidden active:opacity-80 transition-[opacity,box-shadow] ${focusIdx === i ? "shadow-[0_0_0_3px_var(--pin)]" : ""}`}
            style={{ flexGrow: ratio, flexBasis: `calc(var(--rh) * ${ratio})`, aspectRatio: ratio, backgroundColor: photoColor(trip.folder, p) || "var(--cream)" }}
            aria-label={vid ? t("videoOf", i + 1, pics.length) : captions[i]}
          >
            {vid ? (
              <VideoTile
                trip={trip}
                file={p}
                src={srcs[i]}
                onRatio={(r) => setVideoRatios((m) => (m[p] ? m : { ...m, [p]: r }))}
              />
            ) : (
              <img
                src={thumbPath(trip.folder, p)}
                onError={thumbFallback(srcs[i])}
                alt=""
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover block"
              />
            )}
          </button>
        );
      })}
      <span className="grow-[1000000] basis-0" aria-hidden="true" />
    </div>
  );
}

/**
 * Poster frame and sound info for a video, from scripts/thumbs.mjs: the poster
 * is thumbs/<folder>/<name>.webp, and a 4th value 1 in photoColors.json means
 * the file has no audio track. Null when no poster was made (no ffmpeg).
 */
function videoMeta(folder, file) {
  const f = (folder || "").replace(/^\/+/, "").replace(/^pictures\/?/, "");
  const meta = PHOTO_COLORS[(f ? f + "/" : "") + file];
  if (!meta) return null;
  return {
    poster: joinPath("thumbs/" + f, String(file).replace(/\.[^.]+$/, ".webp")),
    silent: meta[3] === 1,
  };
}

/**
 * A video in the gallery: its poster with a play badge. Videos without sound
 * (no audio track, or listed in the trip's `silent` array) loop muted while
 * they are on screen, like a live photo; a tap still opens the lightbox.
 * Without a poster it falls back to the video's own frame at 0.5s.
 */
function VideoTile({ trip, file, src, onRatio }) {
  const ref = useRef(null);
  const reduce = useReducedMotion();
  const meta = videoMeta(trip.folder, file);
  const silent = !!meta?.silent || trip.silent === true || (Array.isArray(trip.silent) && trip.silent.includes(file));
  const loops = silent && !reduce;
  const [onScreen, setOnScreen] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const poster = meta && !posterFailed ? meta.poster : null;

  useEffect(() => {
    if (!loops || !ref.current) return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { threshold: 0.25 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [loops]);

  return (
    <span ref={ref} className="absolute inset-0 block">
      {loops && onScreen ? (
        <video
          src={src}
          poster={poster || undefined}
          muted
          loop
          autoPlay
          playsInline
          preload="auto"
          className="w-full h-full object-cover block pointer-events-none"
        />
      ) : poster ? (
        <img src={poster} onError={() => setPosterFailed(true)} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover block" />
      ) : (
        <video
          src={src + "#t=0.5"}
          muted
          playsInline
          preload="metadata"
          onLoadedMetadata={(e) => {
            const { videoWidth: w, videoHeight: h } = e.currentTarget;
            if (w && h) onRatio(w / h);
          }}
          className="w-full h-full object-cover block pointer-events-none"
        />
      )}
      {loops ? (
        <span className="absolute right-1.5 bottom-1.5 w-6 h-6 rounded-full bg-black/45 backdrop-blur-sm text-white flex items-center justify-center text-[10px] pl-0.5" aria-hidden="true">▶</span>
      ) : (
        <span className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
          <span className="w-12 h-12 rounded-full bg-black/45 backdrop-blur-sm text-white flex items-center justify-center text-lg pl-1">▶</span>
        </span>
      )}
    </span>
  );
}

/** Small still map of the trip's route (or its point); tap opens the big map there. */
function RouteMap({ trip, stops, onOpen }) {
  const el = useRef(null);

  useEffect(() => {
    if (!el.current || typeof trip.lat !== "number") return;
    const map = L.map(el.current, {
      zoomControl: false, dragging: false, touchZoom: false, scrollWheelZoom: false,
      doubleClickZoom: false, boxZoom: false, keyboard: false, attributionControl: true,
    });
    map.attributionControl.setPrefix(false);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: t("osmCredit"), maxZoom: 19, className: "tile-paper",
    }).addTo(map);

    const animated = hasTravelModes(trip.route);
    const pts = animated
      ? routeFrame(trip.route)
      : (trip.route || []).filter((p) => typeof p.lat === "number" && typeof p.lon === "number").map((p) => [p.lat, p.lon]);
    let stopAnim = null, io = null;
    // Placed photos as small Polaroids where they were taken.
    const spots = tripPhotoSpots(trip).filter((p) => !isVideo(p.file));
    spots.forEach((p, k) => {
      L.marker([p.loc.lat, p.loc.lon], {
        icon: L.divIcon({
          className: "photo-pin-wrap",
          html: `<div class="photo-pin" style="--tilt:${[-4, 3, -2, 4, -3, 2][k % 6]}deg"><img src="${thumbPath(trip.folder, p.file)}" alt="" /></div>`,
          iconSize: [36, 40], iconAnchor: [18, 36],
        }),
        interactive: false, keyboard: false, zIndexOffset: 500,
      }).addTo(map);
    });
    const spotPts = spots.map((p) => [p.loc.lat, p.loc.lon]);
    if (pts.length > 1) {
      if (animated) {
        // Play the route once the map is mostly on screen, not while it sits below the cover.
        const layer = L.layerGroup().addTo(map);
        const home = () => map.flyToBounds(L.latLngBounds([...pts, ...spotPts]), { padding: [24, 24], duration: 0.9 });
        const play = () => {
          if (!stopAnim) stopAnim = drawRoute(layer, trip.route, { delay: 250, map, fit: { padding: [24, 24] }, onDone: home });
        };
        if ("IntersectionObserver" in window) {
          io = new IntersectionObserver((entries) => {
            if (entries.some((e) => e.isIntersecting)) { io.disconnect(); play(); }
          }, { threshold: 0.6 });
          io.observe(el.current);
        } else play();
      } else {
        L.polyline(pts, { color: "#ffffff", weight: 5, opacity: 0.9 }).addTo(map);
        L.polyline(pts, { color: "#e2574b", weight: 2.5, opacity: 0.95, dashArray: "6,7" }).addTo(map);
      }
      // Numbered stops; a round trip's return to the start is not numbered again.
      const named = trip.route.filter((p) => p.name && typeof p.lat === "number");
      const first = named[0];
      named.forEach((p, i) => {
        if (i > 0 && i === named.length - 1 && first && p.name === first.name) return;
        L.marker([p.lat, p.lon], {
          icon: L.divIcon({ className: "route-num-wrap", html: `<span class="route-num">${i + 1}</span>`, iconSize: [20, 20], iconAnchor: [10, 10] }),
          interactive: false, keyboard: false,
        }).addTo(map);
      });
      map.fitBounds(L.latLngBounds([...pts, ...spotPts]), { padding: [24, 24] });
    } else if (spotPts.length) {
      // No route: frame the photo spots (leaving room for the prints above their pins).
      map.fitBounds(L.latLngBounds(spotPts), { paddingTopLeft: [30, 46], paddingBottomRight: [30, 14], maxZoom: 15 });
    } else {
      L.circleMarker([trip.lat, trip.lon], { radius: 7, color: "#fff", weight: 2.5, fillColor: "#e2574b", fillOpacity: 1 }).addTo(map);
      map.setView([trip.lat, trip.lon], 10);
    }
    return () => { io?.disconnect(); stopAnim?.(); map.remove(); };
  }, [trip]);

  if (typeof trip.lat !== "number") return null;
  const spotCount = tripPhotoSpots(trip).filter((p) => !isVideo(p.file)).length;

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={onOpen}
        className="relative block w-full bg-paper p-1.5 pb-1.5 shadow-[var(--shadow-sm)] text-left active:scale-[.99] transition"
        aria-label={t("viewOnBigMap")}
      >
        <div ref={el} className="h-[170px] sm:h-[220px] w-full bg-[var(--map-bg)] pointer-events-none" />
        <span className="absolute right-3 top-3 z-[500] bg-paper/95 rounded-[4px] px-2.5 py-1 text-xs font-medium text-ink shadow-sm">{t("bigMap")}</span>
        {spotCount > 0 && (
          <span className="absolute left-3 bottom-3 z-[500] bg-paper/95 rounded-[4px] px-2 py-0.5 text-[11px] text-ink-2 shadow-sm">{t("photoSpots", spotCount)}</span>
        )}
      </button>
      {stops.length > 0 && (
        <ol className="flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-ink-2 leading-relaxed m-0 p-0 list-none">
          {stops.map((name, i) => {
            if (i > 0 && i === stops.length - 1 && name === stops[0]) return null;
            return (
              <li key={i} className="flex items-center gap-1.5">
                <span className="route-num route-num-sm" aria-hidden="true">{i + 1}</span>{name}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

/**
 * Small map card that floats in the corner while you scroll the gallery. It
 * shows the trip's photo spots; the photo in the middle of the screen lights
 * up and the map pans to it. Tap it to open the big map.
 */
function MiniMap({ trip, focusIdx, visible, onOpen }) {
  const el = useRef(null);
  const mapRef = useRef(null);
  const markers = useRef(new Map()); // photo index -> marker

  useEffect(() => {
    if (!el.current) return;
    const map = L.map(el.current, {
      zoomControl: false, dragging: false, touchZoom: false, scrollWheelZoom: false,
      doubleClickZoom: false, boxZoom: false, keyboard: false, attributionControl: false, zoomSnap: 0.25,
    });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, className: "tile-paper" }).addTo(map);
    const spots = tripPhotoSpots(trip).filter((p) => !isVideo(p.file));
    markers.current.clear();
    spots.forEach((p) => {
      const m = L.marker([p.loc.lat, p.loc.lon], {
        icon: L.divIcon({ className: "mini-dot-wrap", html: `<span class="mini-dot"></span>`, iconSize: [14, 14], iconAnchor: [7, 7] }),
        interactive: false, keyboard: false,
      }).addTo(map);
      markers.current.set(p.index, m);
    });
    map.fitBounds(L.latLngBounds(spots.map((p) => [p.loc.lat, p.loc.lon])), { padding: [16, 16], maxZoom: 15 });
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, [trip]);

  // Light up the focused photo's pin and keep it in view.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markers.current.forEach((m, i) => {
      const on = i === focusIdx;
      m.getElement()?.firstElementChild?.classList.toggle("is-on", on);
      m.setZIndexOffset(on ? 1000 : 0);
    });
    const active = markers.current.get(focusIdx);
    if (active && visible && !map.getBounds().pad(-0.15).contains(active.getLatLng())) map.panTo(active.getLatLng(), { animate: true, duration: 0.4 });
  }, [focusIdx, visible]);

  // Leaflet needs to measure again once the card is shown.
  useEffect(() => { if (visible) setTimeout(() => mapRef.current?.invalidateSize(), 50); }, [visible]);

  return (
    <button
      onClick={onOpen}
      aria-label={t("viewOnBigMap")}
      tabIndex={visible ? 0 : -1}
      className={`absolute z-20 right-3 sm:right-5 bottom-[calc(1rem+env(safe-area-inset-bottom))] bg-paper p-1 shadow-[var(--shadow)] transition-[opacity,transform] duration-200 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
      }`}
    >
      <div ref={el} className="w-[118px] h-[118px] sm:w-[170px] sm:h-[170px] bg-[var(--map-bg)] pointer-events-none" />
    </button>
  );
}
