import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { motion, useReducedMotion } from "motion/react";
import FlagImg from "@/components/FlagImg";
import {
  joinPath, thumbPath, thumbFallback, photoColor, photoRatio, formatDateRange, formatMonthYear,
  tripDays, formatDays, routeStops, isVideo, photoCaption, srcSetFor,
} from "@/lib/helpers";
import { t, tripText } from "@/lib/i18n";
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

  const pics = trip.pictures || [];
  const srcs = pics.map((p) => joinPath(trip.folder, p));
  const captions = pics.map((_, i) => photoCaption(trip, i, pics.length));
  const coverIdx = pics.findIndex((p) => !isVideo(p));
  const cover = coverIdx >= 0 ? pics[coverIdx] : null;
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
              <img
                src={srcs[coverIdx]}
                srcSet={srcSetFor(srcs[coverIdx])}
                sizes={docked ? PANEL_WIDTH : "100vw"}
                alt=""
                decoding="async"
                fetchpriority="high"
                className="w-full h-full object-cover block"
              />
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
            <Gallery trip={trip} docked={docked} pics={pics} srcs={srcs} captions={captions} onOpen={(i) => onOpenLightbox(srcs, captions, i)} />
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
function Gallery({ trip, docked, pics, srcs, captions, onOpen }) {
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
            onClick={() => onOpen(i)}
            className="relative overflow-hidden active:opacity-80 transition-opacity"
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

    const pts = (trip.route || []).filter((p) => typeof p.lat === "number" && typeof p.lon === "number").map((p) => [p.lat, p.lon]);
    if (pts.length > 1) {
      L.polyline(pts, { color: "#ffffff", weight: 5, opacity: 0.9 }).addTo(map);
      L.polyline(pts, { color: "#e2574b", weight: 2.5, opacity: 0.95, dashArray: "6,7" }).addTo(map);
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
      map.fitBounds(L.latLngBounds(pts), { padding: [18, 18] });
    } else {
      L.circleMarker([trip.lat, trip.lon], { radius: 7, color: "#fff", weight: 2.5, fillColor: "#e2574b", fillOpacity: 1 }).addTo(map);
      map.setView([trip.lat, trip.lon], 10);
    }
    return () => map.remove();
  }, [trip]);

  if (typeof trip.lat !== "number") return null;

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={onOpen}
        className="relative block w-full bg-paper p-1.5 pb-1.5 shadow-[var(--shadow-sm)] text-left active:scale-[.99] transition"
        aria-label={t("viewOnBigMap")}
      >
        <div ref={el} className="h-[170px] sm:h-[220px] w-full bg-[var(--map-bg)] pointer-events-none" />
        <span className="absolute right-3 top-3 z-[500] bg-paper/95 rounded-[4px] px-2.5 py-1 text-xs font-medium text-ink shadow-sm">{t("bigMap")}</span>
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
