import { useEffect, useMemo, useRef, useState } from "react";
import FlagImg from "@/components/FlagImg";
import { t, tripText } from "@/lib/i18n";
import { joinPath, thumbPath, thumbFallback, formatMonthYear, tripDays, formatDays, isVideo, photoColor, photoRatio } from "@/lib/helpers";

// Pseudo-random but deterministic per trip id, so the wall looks hand-pinned
// (uneven tilt, nudge and size) yet never shuffles between renders.
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function scatter(id) {
  const h = hash(id);
  const r = (shift) => (((h >>> shift) & 255) / 255) * 2 - 1; // -1..1
  return {
    tilt: +(r(0) * 4).toFixed(2),
    dx: Math.round(r(8) * 8),
    dy: Math.round(r(16) * 10),
    scale: +(1 + r(24) * 0.03).toFixed(3),
  };
}

// Prints keep the photo's own shape, within 2:3 portrait and 3:2 landscape so a
// tall phone screenshot never becomes a skyscraper.
function coverRatio(v) {
  const p = (v.pictures || []).find((f) => !isVideo(f));
  const r = p ? photoRatio(v.folder, p) : null;
  return Math.min(1.5, Math.max(2 / 3, r || 1));
}

// 2 columns on phones, 3 from 640px, 4 from 768px, 5 from 1280px.
function useColumnCount() {
  const get = () => {
    const w = typeof window === "undefined" ? 1024 : window.innerWidth;
    return w >= 1280 ? 5 : w >= 768 ? 4 : w >= 640 ? 3 : 2;
  };
  const [n, setN] = useState(get);
  useEffect(() => {
    const onResize = () => setN(get());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return n;
}

/**
 * Masonry that keeps date order: each trip goes to the currently shortest
 * column, so the newest trip is top-left and reading left to right, top to
 * bottom follows time closely while prints of different shapes pack tightly.
 */
function toColumns(trips, n) {
  const cols = Array.from({ length: n }, () => ({ h: 0, items: [] }));
  trips.forEach((v) => {
    let best = 0;
    for (let i = 1; i < n; i++) if (cols[i].h < cols[best].h - 0.01) best = i;
    cols[best].items.push(v);
    cols[best].h += 1 / coverRatio(v) + 0.35; // photo height + caption, in column widths
  });
  return cols.map((c) => c.items);
}

export default function WallView({ vacations, countryCount, onOpenModal }) {
  const cols = useColumnCount();
  const rootRef = useRef(null);
  const [currentYear, setCurrentYear] = useState(null);

  const sections = useMemo(() => {
    const byYear = new Map();
    vacations.forEach((v) => {
      const y = (v.startDate || "?").slice(0, 4);
      if (!byYear.has(y)) byYear.set(y, []);
      byYear.get(y).push(v);
    });
    return [...byYear].map(([year, trips]) => ({ year, trips }));
  }, [vacations]);

  const years = sections.map((s) => s.year);
  const span = years.length > 1 ? `${years[years.length - 1]} – ${years[0]}` : years[0] || "";

  // Highlight the year whose section is at the top of the screen.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const scroller = root.parentElement;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).map((e) => e.target.dataset.year);
        if (visible.length) setCurrentYear(visible[0]);
      },
      { root: scroller, rootMargin: "0px 0px -75% 0px" }
    );
    root.querySelectorAll("section[data-year]").forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [sections]);

  function jumpTo(year) {
    rootRef.current?.querySelector(`section[data-year="${year}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  let printIndex = 0;

  return (
    <div ref={rootRef} className="wall-bg min-h-full">
      <div className="max-w-[1120px] xl:max-w-[1360px] mx-auto px-4 sm:px-8 pt-3 sm:pt-7 pb-[calc(4rem+env(safe-area-inset-bottom))] sm:pb-20">
        {/* On phones the header already names the site, so the wall opens with
            one line of stats and the year links; the first print is in view. */}
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-1.5 mb-2 sm:mb-6">
          <div className="min-w-0">
            <h1 className="hidden sm:block font-hand text-[32px] leading-none text-ink m-0">{t("allTrips")}</h1>
            <p className="text-[13px] sm:text-sm text-ink-2 sm:mt-1.5 tabular-nums m-0">
              {t("trips", vacations.length)} · {t("countries", countryCount)} · {span}
            </p>
          </div>

          <nav className="flex gap-4 text-[13px] sm:text-sm tabular-nums" aria-label={t("jumpToYear")}>
            {years.map((y) => (
              <button
                key={y}
                onClick={() => jumpTo(y)}
                aria-current={currentYear === y ? "true" : undefined}
                className={`py-1 underline-offset-4 decoration-2 transition-colors ${
                  currentYear === y ? "text-ink underline decoration-pin" : "text-ink-2 hover:text-ink hover:underline decoration-line-h"
                }`}
              >
                {y}
              </button>
            ))}
          </nav>
        </div>

        <div className="flex flex-col gap-y-6 sm:gap-y-10">
          {sections.map((s) => (
            <section key={s.year} data-year={s.year} className="flex flex-col gap-y-5 sm:gap-y-7 scroll-mt-2">
              {/* The tape sticks to the top while you scroll through its year. */}
              <div className="sticky top-2 z-20 pointer-events-none">
                <span className="tape font-hand text-[22px] leading-none text-ink">{s.year}</span>
              </div>
              <div className="flex gap-4 sm:gap-7 items-start">
                {toColumns(s.trips, cols).map((col, ci) => (
                  <div key={ci} className="flex-1 min-w-0 flex flex-col gap-6 sm:gap-9">
                    {col.map((v) => {
                      const i = printIndex++;
                      return (
                        <div key={v.id} className="print-in" style={{ animationDelay: `${(i % 8) * 40}ms` }}>
                          <Print v={v} scatter={scatter(v.id)} onOpen={() => onOpenModal(v.id)} />
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}

function Print({ v, scatter, onOpen }) {
  const pics = v.pictures || [];
  const firstImg = pics.find((p) => !isVideo(p));
  const firstVid = !firstImg && pics.find(isVideo);
  const src = firstImg ? thumbPath(v.folder, firstImg) : firstVid ? joinPath(v.folder, firstVid) : null;
  const original = firstImg ? joinPath(v.folder, firstImg) : null;
  const days = tripDays(v);
  const when = formatMonthYear(v.startDate);
  const ratio = coverRatio(v);
  const { title } = tripText(v);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } }}
      className="print relative cursor-pointer"
      style={{ "--tilt": `${scatter.tilt}deg`, "--dx": `${scatter.dx}px`, "--dy": `${scatter.dy}px`, "--s": scatter.scale }}
      aria-label={`${title}, ${when}${days ? ", " + formatDays(days) : ""}${pics.length ? "" : ", " + t("noPhotosYet")}`}
    >
      <div
        className="bg-cream overflow-hidden"
        style={{ aspectRatio: ratio, backgroundColor: firstImg ? photoColor(v.folder, firstImg) : undefined }}
      >
        {firstImg ? (
          <img src={src} onError={thumbFallback(original)} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover block" />
        ) : firstVid ? (
          <video src={src + "#t=0.5"} muted playsInline preload="metadata" className="w-full h-full object-cover block" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-pencil text-[12px]">
            <FlagImg iso={v.country} className="w-12 h-8 opacity-90" />
            <span>{t("noPhotosYet")}</span>
          </div>
        )}
      </div>

      <div className="absolute left-2.5 right-2.5 bottom-2 flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <span className="font-hand text-[22px] text-ink leading-none truncate">{title}</span>
          <FlagImg iso={v.country} className="w-[14px] h-[10px] shrink-0 shadow-[0_0_0_1px_rgba(0,0,0,.08)]" />
        </div>
        <span className="text-[12px] text-ink-2 leading-none whitespace-nowrap tabular-nums truncate">
          {when}{days ? ` · ${formatDays(days)}` : ""}
        </span>
      </div>
    </div>
  );
}
