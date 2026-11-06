import { useMemo, useState } from "react";
import FlagImg from "@/components/FlagImg";
import { joinPath, thumbPath, thumbFallback, formatMonthYear, tripDays, formatDays, isVideo, routeStops } from "@/lib/helpers";

// Pseudo-random but deterministic per trip id, so the wall looks hand-pinned
// (uneven tilt, nudge and size) yet never shuffles between renders.
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function scatter(id, big) {
  const h = hash(id);
  const r = (shift) => (((h >>> shift) & 255) / 255) * 2 - 1; // -1..1
  const k = big ? 0.5 : 1; // big prints move less so they never crowd their neighbours
  return {
    tilt: +(r(0) * (big ? 3 : 6)).toFixed(2), // small -6..6 deg, big -3..3
    dx: Math.round(r(8) * 16 * k),
    dy: Math.round(r(16) * 22 * k),
    scale: +(1 + r(24) * 0.04 * k).toFixed(3),
  };
}

// Big print as the 1st of its group sits at the left; as the 2nd it sits in
// columns 2–3 next to the 1st. Both keep strict date order (reading left to
// right, top to bottom) at 2, 3 and 4 columns.
const BIG_CLASS = {
  left: "sm:col-span-2 sm:row-span-2 sm:col-start-1",
  center: "sm:col-span-2 sm:row-span-2 sm:col-start-2",
};

export default function WallView({ vacations, countryCount, onOpenModal }) {
  const [yearFilter, setYearFilter] = useState(null);

  const years = useMemo(() => {
    const seen = new Set();
    vacations.forEach((v) => { const y = (v.startDate || "").slice(0, 4); if (y) seen.add(y); });
    return [...seen].sort().reverse();
  }, [vacations]);

  const filtered = yearFilter ? vacations.filter((v) => (v.startDate || "").startsWith(yearFilter)) : vacations;

  // Build the wall: one section per year, trips strictly newest first. Trips
  // go in groups of five; in every full group the 1st or 2nd trip (whichever
  // has more photos) becomes a big 2×2 print, which keeps the date order
  // intact. Each year gets its own grid so a print can never end up under
  // the previous year's header.
  const sections = useMemo(() => {
    const out = [];
    const byYear = {};
    const order = [];
    filtered.forEach((v) => {
      const y = (v.startDate || "?").slice(0, 4);
      if (!byYear[y]) { byYear[y] = []; order.push(y); }
      byYear[y].push(v);
    });
    order.forEach((y) => {
      const items = [];
      out.push({ year: y, items });
      const trips = byYear[y];
      for (let i = 0; i < trips.length; i += 5) {
        const group = trips.slice(i, i + 5);
        let bigIdx = -1;
        if (group.length === 5) {
          const photos = (v) => (v.pictures || []).filter((f) => !isVideo(f)).length;
          bigIdx = photos(group[1]) > photos(group[0]) ? 1 : 0;
        }
        group.forEach((v, k) => {
          const big = k === bigIdx;
          items.push({ v, big: big ? (k === 0 ? "left" : "center") : null, scatter: scatter(v.id, big) });
        });
      }
    });
    return out;
  }, [filtered]);

  const span = years.length > 1 ? `${years[years.length - 1]} – ${years[0]}` : years[0] || "";

  return (
    <div className="wall-bg min-h-full">
      <div className="max-w-[1120px] mx-auto px-5 sm:px-8 pt-7 pb-16 sm:pb-20">
        <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 mb-6">
          <div>
            <h1 className="font-hand text-[40px] sm:text-[48px] leading-none text-ink -rotate-1 origin-left m-0">
              {yearFilter ? `Reizen in ${yearFilter}` : "Alle reizen"}
            </h1>
            <p className="text-sm text-ink-2 mt-2 tabular-nums m-0">
              {filtered.length} {filtered.length === 1 ? "reis" : "reizen"} · {countryCount} landen · {span}
            </p>
          </div>

          <div className="flex gap-1.5 flex-wrap" role="group" aria-label="Filter op jaar">
            <FilterChip active={!yearFilter} onClick={() => setYearFilter(null)}>Alles</FilterChip>
            {years.map((y) => (
              <FilterChip key={y} active={yearFilter === y} onClick={() => setYearFilter(y)}>{y}</FilterChip>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-y-10 sm:gap-y-14 pt-4">
          {sections.map((s) => (
            <section key={s.year} className="flex flex-col gap-y-8 sm:gap-y-12">
              <div className="flex items-center gap-4">
                <span className="tape font-hand text-[22px] leading-none text-ink">{s.year}</span>
                <span className="h-px flex-1 bg-line" aria-hidden="true" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-x-5 sm:gap-x-8 gap-y-10 sm:gap-y-14 items-start">
                {s.items.map((it, i) => (
                  <div key={it.v.id} className={`print-in ${it.big ? BIG_CLASS[it.big] : ""}`} style={{ animationDelay: `${(i % 8) * 40}ms` }}>
                    <Print v={it.v} scatter={it.scatter} big={!!it.big} onOpen={() => onOpenModal(it.v.id)} />
                  </div>
                ))}
              </div>
            </section>
          ))}
          {!filtered.length && (
            <div className="bg-paper border border-dashed border-line-h rounded-xl p-8 text-center text-ink-2">
              Geen reizen gevonden.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
        active ? "bg-ink text-paper border-ink" : "bg-paper border-line text-ink-2 hover:border-line-h hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function Print({ v, scatter, big, onOpen }) {
  const pics = v.pictures || [];
  const firstImg = pics.find((p) => !isVideo(p));
  const firstVid = !firstImg && pics.find(isVideo);
  const src = firstImg ? thumbPath(v.folder, firstImg) : firstVid ? joinPath(v.folder, firstVid) : null;
  const original = firstImg ? joinPath(v.folder, firstImg) : null;
  const days = tripDays(v);
  const stops = routeStops(v);
  const when = formatMonthYear(v.startDate);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } }}
      className={`print relative cursor-pointer ${big ? "print-big" : ""}`}
      style={{ "--tilt": `${scatter.tilt}deg`, "--dx": `${scatter.dx}px`, "--dy": `${scatter.dy}px`, "--s": scatter.scale }}
      aria-label={`${v.title}, ${when}${days ? ", " + formatDays(days) : ""}, ${pics.length ? pics.length + " foto's" : "nog geen foto's"}`}
    >
      <div className="aspect-square bg-cream overflow-hidden">
        {firstImg ? (
          <img src={src} onError={thumbFallback(original)} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover block" />
        ) : firstVid ? (
          <video src={src} muted playsInline preload="metadata" className="w-full h-full object-cover block" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 border border-dashed border-line-h m-0 text-pencil text-[11px]">
            <FlagImg iso={v.country} className="w-12 h-8 opacity-90" />
            <span>nog geen foto's</span>
          </div>
        )}
      </div>

      <div className="absolute left-2.5 right-2.5 bottom-2 flex items-baseline justify-between gap-2">
        <span className={`font-hand text-ink leading-none truncate ${big ? "text-[21px] sm:text-[30px]" : "text-[21px]"}`}>{v.title}</span>
        <span className="text-[10px] sm:text-[11px] text-ink-2 whitespace-nowrap tabular-nums">
          {when}{pics.length ? ` · ${pics.length}` : ""}
        </span>
      </div>

    </div>
  );
}
