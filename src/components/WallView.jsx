import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import FlagImg from "@/components/FlagImg";
import { joinPath, thumbPath, thumbFallback, formatMonthYear, tripDays, formatDays, isVideo, routeStops } from "@/lib/helpers";

// Deterministic tilts so the wall looks hand-pinned but never shuffles between renders.
const TILTS = [-3, 2, -1.5, 2.5, -2, 1, 3, -2.5, 1.5, -1];

export default function WallView({ vacations, countryCount, active, onOpenModal, onGoToMap }) {
  const [yearFilter, setYearFilter] = useState(null);

  const years = useMemo(() => {
    const seen = new Set();
    vacations.forEach((v) => { const y = (v.startDate || "").slice(0, 4); if (y) seen.add(y); });
    return [...seen].sort().reverse();
  }, [vacations]);

  const filtered = yearFilter ? vacations.filter((v) => (v.startDate || "").startsWith(yearFilter)) : vacations;

  // Flatten into [yearDivider, print, print, yearDivider, ...] so the grid can
  // place dividers as full-width rows.
  const items = useMemo(() => {
    const out = [];
    let lastYear = null;
    filtered.forEach((v, i) => {
      const y = (v.startDate || "?").slice(0, 4);
      if (y !== lastYear) { out.push({ type: "year", year: y }); lastYear = y; }
      out.push({ type: "trip", v, tilt: TILTS[i % TILTS.length] });
    });
    return out;
  }, [filtered]);

  const span = years.length > 1 ? `${years[years.length - 1]} – ${years[0]}` : years[0] || "";

  return (
    <div className="wall-bg min-h-full">
      <div className="max-w-[1120px] mx-auto px-5 sm:px-8 pt-7 pb-28 sm:pb-32">
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

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-5 sm:gap-x-7 gap-y-9 sm:gap-y-12 pt-3 items-start">
          {items.map((it, i) =>
            it.type === "year" ? (
              <div key={"y" + it.year} className="col-span-full flex items-center gap-4 -mb-2">
                <span className="tape font-hand text-[22px] leading-none text-ink">{it.year}</span>
                <span className="h-px flex-1 bg-line" aria-hidden="true" />
              </div>
            ) : (
              <div key={it.v.id} className={`print-in ${(it.v.pictures?.length || 0) >= 4 ? "sm:col-span-2" : ""}`} style={{ animationDelay: `${(i % 8) * 40}ms` }}>
                <Print v={it.v} tilt={it.tilt} big={(it.v.pictures?.length || 0) >= 4} onOpen={() => onOpenModal(it.v.id)} />
              </div>
            )
          )}
          {!filtered.length && (
            <div className="col-span-full bg-paper border border-dashed border-line-h rounded-xl p-8 text-center text-ink-2">
              Geen reizen gevonden.
            </div>
          )}
        </div>
      </div>

      {active && <MiniMap vacations={vacations} onClick={onGoToMap} />}
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

function Print({ v, tilt, big, onOpen }) {
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
      className="print relative cursor-pointer"
      style={{ "--tilt": `${tilt}deg`, paddingBottom: big ? 58 : undefined }}
      aria-label={`${v.title}, ${when}${days ? ", " + formatDays(days) : ""}, ${pics.length ? pics.length + " foto's" : "nog geen foto's"}`}
    >
      <div className={`${big ? "aspect-[16/10]" : "aspect-square"} bg-cream overflow-hidden`}>
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
        <span className={`font-hand text-ink leading-none truncate ${big ? "text-[26px]" : "text-[21px]"}`}>{v.title}</span>
        <span className="text-[10px] sm:text-[11px] text-ink-2 whitespace-nowrap tabular-nums">
          {when}{pics.length ? ` · ${pics.length}` : ""}
        </span>
      </div>

      {big && (
        <div className="absolute left-2.5 right-2.5 bottom-[30px] sm:bottom-[32px] text-[11px] text-ink-2 truncate">
          {days ? formatDays(days) : ""}{stops.length ? ` · ${stops.join(" → ")}` : v.location ? ` · ${v.location}` : ""}
        </div>
      )}
    </div>
  );
}

/** Small hand-drawn style map pinned in the corner of the wall; tap to open the real map. */
function MiniMap({ vacations, onClick }) {
  const svgRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    fetch(import.meta.env.BASE_URL + "data/countries-110m.json")
      .then((r) => r.json())
      .then((world) => {
        if (cancelled || !svgRef.current) return;
        const W = 260, H = 160;
        const pts = vacations.filter((v) => typeof v.lat === "number" && typeof v.lon === "number");
        const land = topojson.feature(world, world.objects.countries);
        const lons = pts.map((p) => p.lon), lats = pts.map((p) => p.lat);
        const extent = pts.length
          ? { type: "Polygon", coordinates: [[[Math.min(...lons) - 4, Math.min(...lats) - 3], [Math.max(...lons) + 4, Math.min(...lats) - 3], [Math.max(...lons) + 4, Math.max(...lats) + 3], [Math.min(...lons) - 4, Math.max(...lats) + 3], [Math.min(...lons) - 4, Math.min(...lats) - 3]]] }
          : land;
        const projection = d3.geoMercator().fitSize([W, H], extent);
        const path = d3.geoPath(projection);
        const svg = d3.select(svgRef.current).attr("viewBox", `0 0 ${W} ${H}`);
        svg.selectAll("*").remove();
        svg.append("rect").attr("width", W).attr("height", H).attr("fill", "#dfe8ea");
        svg.append("path").datum(land).attr("d", path).attr("fill", "#f6f1e6").attr("stroke", "#cfc5b5").attr("stroke-width", 0.6);
        svg.append("g").selectAll("circle").data(pts).join("circle")
          .attr("cx", (d) => projection([d.lon, d.lat])[0]).attr("cy", (d) => projection([d.lon, d.lat])[1])
          .attr("r", 3.2).attr("fill", "#e2574b").attr("stroke", "#fff").attr("stroke-width", 1.2);
      })
      .catch((err) => console.warn("Mini-kaart kon niet laden:", err));
    return () => { cancelled = true; };
  }, [vacations]);

  return (
    <button
      onClick={() => onClick()}
      aria-label="Open de kaart"
      className="fixed right-4 bottom-4 sm:right-6 sm:bottom-6 z-[800] w-[180px] h-[124px] sm:w-[260px] sm:h-[176px] bg-paper p-1.5 pb-6 shadow-[var(--shadow)] rotate-2 hover:rotate-0 transition-transform cursor-pointer text-left"
    >
      <svg ref={svgRef} className="w-full h-full block bg-cream" preserveAspectRatio="xMidYMid slice" aria-hidden="true" />
      <span className="absolute left-2.5 bottom-1 font-hand text-[18px] leading-none text-ink">Kaart ↗</span>
      <span className="absolute -top-1.5 left-1/2 -ml-[7px] w-[14px] h-[14px] rounded-full shadow" style={{ background: "radial-gradient(circle at 35% 35%, #ff8a7c, var(--pin) 60%, #a33528)" }} aria-hidden="true" />
    </button>
  );
}
