import { useEffect, useRef, useState } from "react";
import * as d3 from "d3";
import * as topojson from "topojson-client";
import { ISO2_TO_NUM, LAND_NAMEN, CONTINENT_BOUNDS, CONTINENT_COUNTRIES, MAINLAND_BOUNDS } from "@/data/worldMeta";
import { visitedCountrySet } from "@/lib/helpers";

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

  useEffect(() => {
    if (!active || loaded) return;
    fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
      .then((r) => r.json())
      .then((data) => { stateRef.current.worldData = data; drawWorldMap(data); setLoaded(true); })
      .catch((err) => console.warn("Wereldkaart kon niet laden:", err));
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

    g.append("path").datum({ type: "Sphere" }).attr("d", pathGen).attr("fill", "#07090f");
    g.append("path").datum(d3.geoGraticule()()).attr("d", pathGen).attr("fill", "none").attr("stroke", "#0f1520").attr("stroke-width", 0.35);

    const VISITED = "#c8a060", UNVISITED = "#1a1c24";

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
        .on("mouseenter", function () { if (isVis) d3.select(this).style("opacity", 0.75); })
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

    g.append("path").datum(borders).attr("d", pathGen).attr("fill", "none").attr("stroke", "#07090f").attr("stroke-width", 0.45);

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
    <div className="flex flex-col overflow-hidden bg-[#07090f] h-full">
      <div className="flex-1 min-h-0 overflow-hidden">
        <svg ref={svgRef} className="w-full h-full block cursor-grab active:cursor-grabbing" aria-label="Bezochte landen wereldkaart" />
      </div>

      <div className="flex flex-wrap gap-1.5 justify-center py-2.5 px-5 border-t border-border shrink-0">
        {stats && (
          <>
            <StatChip
              global
              onClick={() => zoomToContinent("world")}
              label="Wereld"
              visited={stats.visitedAll}
              total={stats.totalAll}
              pct={pct(stats.visitedAll, stats.totalAll)}
            />
            {Object.entries(stats.contStats).map(([cont, s]) => (
              <StatChip
                key={cont}
                onClick={() => zoomToContinent(cont)}
                label={cont}
                visited={s.visited}
                total={s.total}
                pct={pct(s.visited, s.total)}
              />
            ))}
          </>
        )}
      </div>

      <div className="flex items-center justify-center gap-6 py-2 px-6 border-t border-border shrink-0">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: "var(--gold)" }} />
          <span>{stats ? `${stats.visitedAll} bezocht` : "Bezocht"}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: "#1a1c24" }} />
          <span>Nog niet bezocht</span>
        </div>
      </div>

      <div
        ref={tooltipRef}
        className="fixed bg-card border border-border rounded-md px-2.5 py-1 text-xs text-foreground pointer-events-none opacity-0 transition-opacity shadow-lg z-[9999] whitespace-nowrap"
      />
    </div>
  );
}

function StatChip({ global, onClick, label, visited, total, pct }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] transition-colors ${
        global
          ? "bg-accent border-gold/35 text-gold"
          : "bg-card border-border text-muted-foreground hover:border-border-h hover:text-foreground"
      }`}
    >
      <strong className={global ? "text-gold" : "text-foreground"}>{label}&nbsp;{visited}/{total}</strong>
      &nbsp;{pct}
    </button>
  );
}
