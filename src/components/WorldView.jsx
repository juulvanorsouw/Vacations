import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import { ISO2_TO_NUM, LAND_NAMEN, CONTINENT_BOUNDS, CONTINENT_COUNTRIES, MAINLAND_BOUNDS } from "@/data/worldMeta";
import { visitedCountrySet } from "@/lib/helpers";
import { t, getLang, countryName } from "@/lib/i18n";

// Colours come from CSS variables (index.css) so the map follows dark mode.
const WATER = "var(--world-water)", GRID = "var(--world-grid)", VISITED = "var(--pin)", UNVISITED = "var(--world-land)", BORDER = "var(--world-border)";

const NUM_TO_ISO2 = Object.fromEntries(Object.entries(ISO2_TO_NUM).map(([iso, n]) => [n, iso]));

function getVisitedNums(vacations) {
  const iso = visitedCountrySet(vacations);
  const set = new Set();
  iso.forEach((c) => { const n = ISO2_TO_NUM[c]; if (n) set.add(n); });
  return set;
}

export default function WorldView({ vacations, active, lang }) { // eslint-disable-line no-unused-vars
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);
  const stateRef = useRef({ worldData: null, projection: null, zoom: null, svg: null });
  const [stats, setStats] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [focus, setFocus] = useState("world");

  useEffect(() => {
    if (!active || loaded) return;
    // Bundled with the site (public/data) so the view also works offline or
    // when a CDN is blocked.
    fetch(import.meta.env.BASE_URL + "data/countries-110m.json")
      .then((r) => { if (!r.ok) throw new Error(r.statusText); return r.json(); })
      .then((data) => { stateRef.current.worldData = data; drawWorldMap(data); setLoaded(true); })
      .catch((err) => { console.warn("Wereldkaart kon niet laden:", err); setError("worldMapError"); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  function drawWorldMap(world) {
    const visited = getVisitedNums(vacations);
    // The drawing takes the shape of the screen: on a portrait phone the
    // viewBox is tall, so zooming to Europe fills the screen instead of a band.
    const el = svgRef.current;
    const W = 960;
    const H = Math.max(500, Math.round(W * ((el.clientHeight || 500) / (el.clientWidth || 960))));
    const projection = d3.geoNaturalEarth1().scale(153).translate([W / 2, H / 2]);
    const pathGen = d3.geoPath().projection(projection);
    const countries = topojson.feature(world, world.objects.countries);
    const borders = topojson.mesh(world, world.objects.countries, (a, b) => a !== b);

    const svg = d3.select(svgRef.current).attr("viewBox", `0 0 ${W} ${H}`).attr("preserveAspectRatio", "xMidYMid meet");
    svg.selectAll("*").remove();

    const g = svg.append("g");
    const zoom = d3.zoom().scaleExtent([1, 8]).translateExtent([[0, 0], [W, H]]).on("zoom", (e) => g.attr("transform", e.transform));
    svg.call(zoom);
    stateRef.current = { ...stateRef.current, projection, zoom, svg, W, H };

    g.append("path").datum({ type: "Sphere" }).attr("d", pathGen).style("fill", WATER).style("stroke", BORDER).attr("stroke-width", 0.6);
    g.append("path").datum(d3.geoGraticule()()).attr("d", pathGen).style("fill", "none").style("stroke", GRID).attr("stroke-width", 0.35);

    function centroid(ring) {
      let lx = 0, ly = 0;
      ring.forEach(([x, y]) => { lx += x; ly += y; });
      return [lx / ring.length, ly / ring.length];
    }

    function addPath(geom, id, isVis) {
      // Read the name when hovering, so it follows a language switch.
      const nameOf = () => { const iso = NUM_TO_ISO2[id]; return getLang() === "en" && iso ? countryName(iso) : LAND_NAMEN[id] || ""; };
      g.append("path")
        .datum({ type: "Feature", geometry: geom })
        .attr("class", "world-country" + (isVis ? " visited" : ""))
        .attr("d", pathGen)
        .style("fill", isVis ? VISITED : UNVISITED)
        .style("stroke", "none")
        .style("transition", "opacity .12s")
        .on("mouseenter", function () { if (isVis) d3.select(this).style("opacity", 0.8); })
        .on("mousemove", (e) => {
          const name = nameOf();
          if (!name || !tooltipRef.current) return;
          tooltipRef.current.textContent = name + (isVis ? " ✓" : "");
          tooltipRef.current.style.opacity = "1";
          tooltipRef.current.style.left = e.clientX + 14 + "px";
          tooltipRef.current.style.top = e.clientY - 36 + "px";
        })
        .on("mouseleave", function () { d3.select(this).style("opacity", 1); if (tooltipRef.current) tooltipRef.current.style.opacity = "0"; });
    }

    countries.features.forEach((feat) => {
      const id = +feat.id;
      const isVis = visited.has(id);
      const bounds = MAINLAND_BOUNDS[id];
      const geom = feat.geometry;
      if (!isVis || !bounds || geom?.type !== "MultiPolygon") { addPath(geom, id, isVis); return; }
      const main = [], over = [];
      geom.coordinates.forEach((poly) => {
        const c = centroid(poly[0]);
        (c[0] >= bounds.minLon && c[0] <= bounds.maxLon && c[1] >= bounds.minLat && c[1] <= bounds.maxLat ? main : over).push(poly);
      });
      if (main.length) addPath({ type: "MultiPolygon", coordinates: main }, id, true);
      if (over.length) addPath({ type: "MultiPolygon", coordinates: over }, id, false);
    });

    g.append("path").datum(borders).attr("d", pathGen).style("fill", "none").style("stroke", BORDER).attr("stroke-width", 0.45);

    computeStats(visited);
    // 20 of the 21 countries are in Europe: on a phone, start there.
    if (el.clientWidth < 640) zoomToContinent("Europa", false);
  }

  function computeStats(visitedNums) {
    const visitedIso2 = new Set();
    Object.entries(ISO2_TO_NUM).forEach(([iso, num]) => { if (visitedNums.has(num)) visitedIso2.add(iso); });
    let totalAll = 0, visitedAll = 0;
    const contStats = {};
    Object.entries(CONTINENT_COUNTRIES).forEach(([cont, arr]) => {
      const vis = arr.filter((c) => visitedIso2.has(c)).length;
      contStats[cont] = { visited: vis, total: arr.length };
      totalAll += arr.length; visitedAll += vis;
    });
    setStats({ visitedAll, totalAll, contStats });
  }

  function zoomToContinent(cont, animate = true) {
    const { projection, zoom, svg, W, H } = stateRef.current;
    if (!projection || !zoom || !svg) return;
    setFocus(cont);
    const target = animate ? svg.transition().duration(cont === "world" ? 600 : 750) : svg;
    if (cont === "world") { target.call(zoom.transform, d3.zoomIdentity); return; }
    const bounds = CONTINENT_BOUNDS[cont];
    if (!bounds) return;
    const corners = [[bounds[0][0], bounds[0][1]], [bounds[1][0], bounds[0][1]], [bounds[1][0], bounds[1][1]], [bounds[0][0], bounds[1][1]]];
    const proj = corners.map((c) => projection(c));
    const xs = proj.map((p) => p[0]), ys = proj.map((p) => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const scale = Math.min(8, 0.88 * Math.min(W / (x1 - x0), H / (y1 - y0)));
    const tx = W / 2 - scale * (x0 + x1) / 2, ty = H / 2 - scale * (y0 + y1) / 2;
    target.call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
  }


  return (
    <div className="flex flex-col overflow-hidden wall-bg h-full">
      <div className="flex-1 min-h-0 overflow-hidden relative">
        <svg ref={svgRef} className="w-full h-full block cursor-grab active:cursor-grabbing bg-[var(--world-water)]" role="img" aria-label={t("worldMapLabel")} />
        {error && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-ink-2">{t(error)}</div>
        )}
      </div>

      {/* One bar: the total on the left, continents to zoom to on the right. */}
      <div className="flex items-center gap-x-5 gap-y-1 py-2.5 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pb-[max(.625rem,env(safe-area-inset-bottom))] border-t border-line bg-paper/80 shrink-0 min-w-0">
        {stats && (
          <>
            <p className="m-0 text-[13px] text-ink-2 tabular-nums whitespace-nowrap shrink-0">
              <strong className="text-ink font-semibold">{stats.visitedAll}</strong> {t("ofCountries", stats.totalAll)}
            </p>
            <nav className="flex gap-4 overflow-x-auto text-[13px] tabular-nums min-w-0 sm:ml-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label={t("zoomToContinent")}>
              <ContinentLink active={focus === "world"} onClick={() => zoomToContinent("world")} label={t("world")} />
              {Object.entries(stats.contStats).map(([cont, s]) => (
                <ContinentLink key={cont} active={focus === cont} onClick={() => zoomToContinent(cont)} label={t("continents")[cont] || cont} visited={s.visited} total={s.total} />
              ))}
            </nav>
          </>
        )}
      </div>

      <div
        ref={tooltipRef}
        className="fixed bg-paper border border-line rounded-md px-2.5 py-1 text-xs text-ink pointer-events-none opacity-0 transition-opacity shadow-md z-[9999] whitespace-nowrap"
      />
    </div>
  );
}

function ContinentLink({ active, onClick, label, visited, total }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`py-1 whitespace-nowrap shrink-0 underline-offset-4 decoration-2 transition-colors ${
        active ? "text-ink underline decoration-pin" : "text-ink-2 hover:text-ink hover:underline decoration-line-h"
      }`}
    >
      {label}{total ? <span className="text-pencil"> {visited}/{total}</span> : null}
    </button>
  );
}
