import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import { ISO2_TO_NUM, LAND_NAMEN, CONTINENT_BOUNDS, CONTINENT_COUNTRIES, MAINLAND_BOUNDS } from "@/data/worldMeta";
import { visitedCountrySet } from "@/lib/helpers";

const WATER = "#e9e3d7", GRID = "#ddd6c8", VISITED = "#e2574b", UNVISITED = "#fbf9f4", BORDER = "#cfc5b5";

function getVisitedNums(vacations) {
  const iso = visitedCountrySet(vacations);
  const set = new Set();
  iso.forEach((c) => { const n = ISO2_TO_NUM[c]; if (n) set.add(n); });
  return set;
}

export default function WorldView({ vacations, active }) {
  const svgRef = useRef(null);
  const tooltipRef = useRef(null);
  const stateRef = useRef({ worldData: null, projection: null, zoom: null, svg: null });
  const [stats, setStats] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!active || loaded) return;
    // Bundled with the site (public/data) so the view also works offline or
    // when a CDN is blocked.
    fetch(import.meta.env.BASE_URL + "data/countries-110m.json")
      .then((r) => { if (!r.ok) throw new Error(r.statusText); return r.json(); })
      .then((data) => { stateRef.current.worldData = data; drawWorldMap(data); setLoaded(true); })
      .catch((err) => { console.warn("Wereldkaart kon niet laden:", err); setError("De wereldkaart kon niet geladen worden."); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  function drawWorldMap(world) {
    const visited = getVisitedNums(vacations);
    const W = 960, H = 500;
    const projection = d3.geoNaturalEarth1().scale(153).translate([W / 2, H / 2]);
    const pathGen = d3.geoPath().projection(projection);
    const countries = topojson.feature(world, world.objects.countries);
    const borders = topojson.mesh(world, world.objects.countries, (a, b) => a !== b);

    const svg = d3.select(svgRef.current).attr("viewBox", `0 0 ${W} ${H}`).attr("preserveAspectRatio", "xMidYMid meet");
    svg.selectAll("*").remove();

    const g = svg.append("g");
    const zoom = d3.zoom().scaleExtent([1, 8]).translateExtent([[0, 0], [W, H]]).on("zoom", (e) => g.attr("transform", e.transform));
    svg.call(zoom);
    stateRef.current = { ...stateRef.current, projection, zoom, svg };

    g.append("path").datum({ type: "Sphere" }).attr("d", pathGen).attr("fill", WATER).attr("stroke", BORDER).attr("stroke-width", 0.6);
    g.append("path").datum(d3.geoGraticule()()).attr("d", pathGen).attr("fill", "none").attr("stroke", GRID).attr("stroke-width", 0.35);

    function centroid(ring) {
      let lx = 0, ly = 0;
      ring.forEach(([x, y]) => { lx += x; ly += y; });
      return [lx / ring.length, ly / ring.length];
    }

    function addPath(geom, id, isVis) {
      const name = LAND_NAMEN[id] || "";
      g.append("path")
        .datum({ type: "Feature", geometry: geom })
        .attr("class", "world-country" + (isVis ? " visited" : ""))
        .attr("d", pathGen)
        .attr("fill", isVis ? VISITED : UNVISITED)
        .attr("stroke", "none")
        .style("transition", "opacity .12s")
        .on("mouseenter", function () { if (isVis) d3.select(this).style("opacity", 0.8); })
        .on("mousemove", (e) => {
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

    g.append("path").datum(borders).attr("d", pathGen).attr("fill", "none").attr("stroke", BORDER).attr("stroke-width", 0.45);

    computeStats(visited);
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

  function zoomToContinent(cont) {
    const { projection, zoom, svg } = stateRef.current;
    if (!projection || !zoom || !svg) return;
    if (cont === "world") { svg.transition().duration(600).call(zoom.transform, d3.zoomIdentity); return; }
    const bounds = CONTINENT_BOUNDS[cont];
    if (!bounds) return;
    const W = 960, H = 500;
    const corners = [[bounds[0][0], bounds[0][1]], [bounds[1][0], bounds[0][1]], [bounds[1][0], bounds[1][1]], [bounds[0][0], bounds[1][1]]];
    const proj = corners.map((c) => projection(c));
    const xs = proj.map((p) => p[0]), ys = proj.map((p) => p[1]);
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
    const scale = Math.min(8, 0.88 * Math.min(W / (x1 - x0), H / (y1 - y0)));
    const tx = W / 2 - scale * (x0 + x1) / 2, ty = H / 2 - scale * (y0 + y1) / 2;
    svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
  }

  const pct = (v, t) => (t === 0 ? "0%" : Math.round((v / t) * 100) + "%");

  return (
    <div className="flex flex-col overflow-hidden wall-bg h-full">
      <div className="flex-1 min-h-0 overflow-hidden relative">
        <svg ref={svgRef} className="w-full h-full block cursor-grab active:cursor-grabbing" aria-label="Bezochte landen wereldkaart" />
        {error && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-ink-2">{error}</div>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 justify-center py-2.5 px-5 border-t border-line bg-paper/70 shrink-0">
        {stats && (
          <>
            <StatChip global onClick={() => zoomToContinent("world")} label="Wereld" visited={stats.visitedAll} total={stats.totalAll} pct={pct(stats.visitedAll, stats.totalAll)} />
            {Object.entries(stats.contStats).map(([cont, s]) => (
              <StatChip key={cont} onClick={() => zoomToContinent(cont)} label={cont} visited={s.visited} total={s.total} pct={pct(s.visited, s.total)} />
            ))}
          </>
        )}
      </div>

      <div className="flex items-center justify-center gap-6 py-2 px-6 border-t border-line bg-paper/70 shrink-0">
        <div className="flex items-center gap-1.5 text-xs text-ink-2">
          <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: VISITED }} />
          <span>{stats ? `${stats.visitedAll} bezocht` : "Bezocht"}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-ink-2">
          <div className="w-3 h-3 rounded-sm shrink-0 border border-line-h" style={{ background: UNVISITED }} />
          <span>Nog niet bezocht</span>
        </div>
      </div>

      <div
        ref={tooltipRef}
        className="fixed bg-paper border border-line rounded-md px-2.5 py-1 text-xs text-ink pointer-events-none opacity-0 transition-opacity shadow-md z-[9999] whitespace-nowrap"
      />
    </div>
  );
}

function StatChip({ global, onClick, label, visited, total, pct }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] tabular-nums transition-colors ${
        global ? "bg-ink border-ink text-paper" : "bg-paper border-line text-ink-2 hover:border-line-h hover:text-ink"
      }`}
    >
      <strong className={global ? "text-paper" : "text-ink"}>{label}&nbsp;{visited}/{total}</strong>
      &nbsp;{pct}
    </button>
  );
}
