import L from "leaflet";
import { prefersReducedMotion } from "@/lib/helpers";

// Material Design icons (Apache 2.0), drawn white on the red route colour.
const ICONS = {
  car: "M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z",
  train: "M12 2c-4 0-8 .5-8 4v9.5C4 17.43 5.57 19 7.5 19L6 20.5v.5h2.23l2-2H14l2 2h2v-.5L16.5 19c1.93 0 3.5-1.57 3.5-3.5V6c0-3.5-3.58-4-8-4zM7.5 17c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm3.5-7H6V6h5v4zm2 0V6h5v4h-5zm3.5 7c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z",
  plane: "M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z",
  bus: "M4 16c0 .88.39 1.67 1 2.22V20c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h8v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1.78c.61-.55 1-1.34 1-2.22V6c0-3.5-3.58-4-8-4s-8 .5-8 4v10zm3.5 1c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm9 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm1.5-6H6V6h12v5z",
  boat: "M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.65 2.62.99 4 .99h2v-2h-2zM3.95 19H4c1.6 0 3.02-.88 4-2 .98 1.12 2.4 2 4 2s3.02-.88 4-2c.98 1.12 2.4 2 4 2h.05l1.89-6.68c.08-.26.06-.54-.06-.78s-.34-.42-.6-.5L20 10.62V6c0-1.1-.9-2-2-2h-3V1H9v3H6c-1.1 0-2 .9-2 2v4.62l-1.29.42c-.26.08-.48.26-.6.5s-.15.52-.06.78L3.95 19zM6 6h12v3.97L12 8 6 9.97V6z",
};

const PIN = "#e2574b";
const PAUSE_MS = 380; // a breath at each stop before the next leg starts

/** True when any stop says how it was reached, which turns on the animation. */
export function hasTravelModes(route) {
  return (route || []).some((p) => ICONS[p.by]);
}

const toRad = (d) => (d * Math.PI) / 180;
// Mercator y in degrees, so angles match what the map shows.
const mercY = (lat) => (Math.log(Math.tan(Math.PI / 4 + toRad(lat) / 2)) * 180) / Math.PI;
// Screen angle (degrees clockwise from north) from a to b.
function heading(a, b) {
  return (Math.atan2(b[1] - a[1], mercY(b[0]) - mercY(a[0])) * 180) / Math.PI;
}
// Rough ground distance; only used for timing and positions along a leg.
function km(a, b) {
  const dx = (b[1] - a[1]) * Math.cos(toRad((a[0] + b[0]) / 2));
  return Math.hypot(b[0] - a[0], dx) * 111.2;
}

// A flight bows out like a curve on an airline map.
function arc(a, b, n = 48) {
  const cos = Math.cos(toRad((a[0] + b[0]) / 2)) || 1;
  const dLat = b[0] - a[0], dLonKm = (b[1] - a[1]) * cos;
  // Perpendicular, pointing northwards so every flight bows the same way.
  let px = -dLonKm, py = dLat;
  if (px < 0) { px = -px; py = -py; }
  const k = 0.2;
  const ctrl = [(a[0] + b[0]) / 2 + px * k, (a[1] + b[1]) / 2 + (py * k) / cos];
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    out.push([u * u * a[0] + 2 * u * t * ctrl[0] + t * t * b[0], u * u * a[1] + 2 * u * t * ctrl[1] + t * t * b[1]]);
  }
  return out;
}

/**
 * Legs run from one named stop to the next. Unnamed points in between shape
 * the line; a "by" on any point of a leg sets how that leg was travelled, and
 * a leg without one keeps the previous leg's mode.
 */
function buildLegs(route) {
  const pts = (route || []).filter((p) => typeof p.lat === "number" && typeof p.lon === "number");
  const legs = [];
  let cur = null, mode = null;
  for (let i = 1; i < pts.length; i++) {
    if (!cur) cur = { raw: [pts[i - 1]], mode: null };
    cur.raw.push(pts[i]);
    if (ICONS[pts[i].by]) cur.mode = pts[i].by;
    if (pts[i].name || i === pts.length - 1) { legs.push(cur); cur = null; }
  }
  return legs.map((l) => {
    if (l.mode) mode = l.mode; else l.mode = mode;
    const ll = l.raw.map((p) => [p.lat, p.lon]);
    const path = l.mode === "plane" ? arc(ll[0], ll[ll.length - 1]) : ll;
    const cum = [0];
    for (let i = 1; i < path.length; i++) cum.push(cum[i - 1] + km(path[i - 1], path[i]));
    const total = cum[cum.length - 1] || 1;
    // Long legs take longer, but not in proportion: a flight shouldn't drag.
    const ms = Math.min(2600, Math.max(900, 700 + Math.sqrt(total) * 60));
    return { mode: l.mode, path, cum, total, ms };
  });
}

/** Every point the drawn route passes through, flight arcs included. */
export function routePath(route) {
  return buildLegs(route).flatMap((l, i) => (i ? l.path.slice(1) : l.path));
}

const LONG_HAUL_KM = 2500;

/**
 * What a map should frame for this route: everything except long-haul flights,
 * so a trip to China frames China and the flights from home leave the edge.
 */
export function routeFrame(route) {
  const legs = buildLegs(route);
  const near = legs.filter((l) => !(l.mode === "plane" && l.total > LONG_HAUL_KM));
  const use = near.length ? near : legs;
  return use.flatMap((l) => l.path);
}

// Consecutive short legs (a day of driving around one area) share one camera view.
function scenes(legs) {
  const out = [];
  legs.forEach((l, i) => {
    const prev = out[out.length - 1];
    if (prev && l.total < 150 && prev.local) prev.legs.push(i);
    else out.push({ legs: [i], local: l.total < 150 });
  });
  return out;
}

// Where along a leg we are at fraction f (0..1), and which way it points.
function along(leg, f) {
  const d = f * leg.total;
  let i = 1;
  while (i < leg.cum.length - 1 && leg.cum[i] < d) i++;
  const a = leg.path[i - 1], b = leg.path[i];
  const seg = leg.cum[i] - leg.cum[i - 1] || 1;
  const t = Math.min(1, Math.max(0, (d - leg.cum[i - 1]) / seg));
  return { idx: i, pos: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], dir: heading(a, b) };
}

function icon(mode, { small = false, angle = 0 } = {}) {
  const size = small ? 20 : 28;
  const rot = mode === "plane" ? ` style="transform:rotate(${angle.toFixed(1)}deg)"` : "";
  const svg = ICONS[mode] ? `<svg viewBox="0 0 24 24" aria-hidden="true"${rot}><path d="${ICONS[mode]}"/></svg>` : "";
  return L.divIcon({
    className: "rv-wrap",
    html: `<span class="rv${small ? " rv-sm" : ""}${ICONS[mode] ? "" : " rv-dot"}">${svg}</span>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/**
 * Draws a route on `layer`. With travel modes and motion allowed, the dashed
 * line grows leg by leg while a small train, car or plane rides along; with
 * `map`, the camera follows each part of the trip (out for long flights, in
 * for a day of driving) and `onDone` runs at the end. Afterwards each leg keeps
 * a small badge of how it was travelled. Without animation the full line and
 * badges appear at once. Returns a stop function.
 */
export function drawRoute(layer, route, { animate = true, delay = 0, map = null, fit = {}, onDone = null } = {}) {
  const legs = buildLegs(route);
  if (!legs.length) return () => {};
  const full = legs.flatMap((l, i) => (i ? l.path.slice(1) : l.path));
  const under = L.polyline([], { color: "#ffffff", weight: 5, opacity: 0.9, interactive: false }).addTo(layer);
  const line = L.polyline([], { color: PIN, weight: 2.5, opacity: 0.95, dashArray: "6,7", interactive: false }).addTo(layer);

  const badges = () => legs.forEach((l) => {
    if (!l.mode) return;
    const mid = along(l, 0.5);
    L.marker(mid.pos, { icon: icon(l.mode, { small: true, angle: mid.dir }), interactive: false, keyboard: false, zIndexOffset: 300 }).addTo(layer);
  });

  if (!animate || prefersReducedMotion() || !hasTravelModes(route)) {
    under.setLatLngs(full);
    line.setLatLngs(full);
    if (hasTravelModes(route)) badges();
    return () => {};
  }

  let stopped = false, raf = 0, timer = 0, vehicle = null, vehicleMode, onMoveEnd = null;
  const drawn = [];
  const wait = (ms) => new Promise((r) => { timer = setTimeout(r, ms); });

  // Fly to `pts` unless the view already shows them at a useful size.
  function frame(pts) {
    if (!map || !pts.length) return Promise.resolve();
    const target = L.latLngBounds(pts);
    const view = map.getBounds();
    const share = Math.max(
      (target.getNorth() - target.getSouth()) / (view.getNorth() - view.getSouth() || 1),
      (target.getEast() - target.getWest()) / (view.getEast() - view.getWest() || 1),
    );
    // Stay put only when the scene sits well inside the view and fills a good part of it.
    if (view.pad(-0.12).contains(target) && share > 0.45) return Promise.resolve();
    return new Promise((resolve) => {
      const done = () => { clearTimeout(timer); map.off("moveend", onMoveEnd); onMoveEnd = null; resolve(); };
      onMoveEnd = done;
      map.once("moveend", done);
      timer = setTimeout(done, 1800);
      map.flyToBounds(target, { ...fit, maxZoom: 11, duration: 0.9 });
    });
  }

  function ride(li) {
    const leg = legs[li];
    return new Promise((resolve) => {
      let begin = 0;
      const step = (now) => {
        if (stopped) return;
        if (!begin) begin = now;
        const f = ease(Math.min(1, (now - begin) / leg.ms));
        const at = along(leg, f);
        const pts = [...drawn, ...leg.path.slice(drawn.length ? 1 : 0, at.idx), at.pos];
        under.setLatLngs(pts);
        line.setLatLngs(pts);
        if (!vehicle) {
          vehicleMode = leg.mode;
          vehicle = L.marker(at.pos, { icon: icon(leg.mode, { angle: at.dir }), interactive: false, keyboard: false, zIndexOffset: 1000 }).addTo(layer);
        } else {
          if (vehicleMode !== leg.mode) { vehicleMode = leg.mode; vehicle.setIcon(icon(leg.mode, { angle: at.dir })); }
          vehicle.setLatLng(at.pos);
          const svg = leg.mode === "plane" && vehicle.getElement()?.querySelector("svg");
          if (svg) svg.style.transform = `rotate(${at.dir.toFixed(1)}deg)`;
        }
        if (f < 1) { raf = requestAnimationFrame(step); return; }
        drawn.push(...leg.path.slice(drawn.length ? 1 : 0));
        resolve();
      };
      raf = requestAnimationFrame(step);
    });
  }

  (async () => {
    await wait(delay);
    for (const sc of scenes(legs)) {
      if (stopped) return;
      await frame(sc.legs.flatMap((i) => legs[i].path));
      for (const li of sc.legs) {
        if (stopped) return;
        await ride(li);
        if (stopped) return;
        await wait(PAUSE_MS);
      }
    }
    if (stopped) return;
    under.setLatLngs(full);
    line.setLatLngs(full);
    vehicle?.getElement()?.querySelector(".rv")?.classList.add("rv-out");
    await wait(320);
    if (stopped) return;
    if (vehicle) layer.removeLayer(vehicle);
    badges();
    onDone?.();
  })();

  return () => {
    stopped = true;
    clearTimeout(timer);
    cancelAnimationFrame(raf);
    if (onMoveEnd) map?.off("moveend", onMoveEnd);
  };
}
