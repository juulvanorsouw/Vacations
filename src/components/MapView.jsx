import { useEffect, useImperativeHandle, useRef, useState, forwardRef } from "react";
import L from "leaflet";
import { motion, AnimatePresence } from "motion/react";
import FlagImg from "@/components/FlagImg";
import {
  joinPath, thumbPath, thumbFallback, photoColor, formatDateRange, formatMonthYear, groupByPlace,
  tripDays, formatDays, routeStops, isVideo, visitIndex, photoCaption,
} from "@/lib/helpers";
import { t, tripText } from "@/lib/i18n";

const CITY_ZOOM = 12;
const TILTS = [-4, 3, -2, 4, -3, 2];
const CLUSTER_PX = 52; // markers closer than this on screen merge into one stack
const SHEET_PEEK = 0.46; // phone sheet heights, as a share of the screen
const SHEET_FULL = 0.88;
const DESKTOP_PANEL = 380 + 16; // width of the side card plus its margin

const isPhone = () => window.innerWidth < 640;

function firstImage(v) {
  const p = (v.pictures || []).find((f) => !isVideo(f));
  return p && v.folder ? { thumb: thumbPath(v.folder, p), full: joinPath(v.folder, p), color: photoColor(v.folder, p) } : null;
}

function makeIcon(trips, index, { isRecent, stacked }) {
  const v = trips[0];
  // Prefer any photo over a flag, even if the newest visit has none yet.
  const img = trips.map(firstImage).find(Boolean) || null;
  const flag = `${import.meta.env.BASE_URL}flags/${(v.country || "").toLowerCase()}.svg`;
  let inner;
  if (img) {
    const fallback = v.country ? `<img class="pm-flag" src="${flag}" alt="" style="display:none" />` : "";
    // thumbnail → original → flag
    inner = `<img src="${img.thumb}" alt="" style="background:${img.color || "var(--cream)"}" onerror="if(!this.dataset.f){this.dataset.f=1;this.src='${img.full}';return}this.style.display='none';var s=this.nextElementSibling;if(s)s.style.display=''" />${fallback}`;
  } else if (v.country) {
    inner = `<img class="pm-flag" src="${flag}" alt="" />`;
  } else {
    inner = "";
  }
  const count = trips.length > 1 ? `<span class="pm-count">${trips.length}</span>` : "";
  return L.divIcon({
    className: "pm-wrap",
    html: `<div class="pm${isRecent ? " pulse" : ""}${stacked ? " pm-stack" : ""}" style="--tilt:${TILTS[index % TILTS.length]}deg">${inner}${count}</div>`,
    iconSize: [44, 48],
    iconAnchor: [22, 44],
  });
}

/** Where the sheet / side card covers the map, so the trip stays in the open part. */
function coveredPadding(expanded) {
  if (isPhone()) {
    const sheet = window.innerHeight * (expanded ? SHEET_FULL : SHEET_PEEK);
    return { topLeft: [40, 70], bottomRight: [40, sheet + 30] };
  }
  return { topLeft: [DESKTOP_PANEL + 60, 80], bottomRight: [90, 80] };
}

const MapView = forwardRef(function MapView({ vacations, lang, onOpenModal, onOpenLightbox }, ref) {
  const mapElRef = useRef(null);
  const mapRef = useRef(null);
  const routesLayerRef = useRef(null);
  const markersLayerRef = useRef(null);
  const placeMarkerRef = useRef(new Map()); // place id -> marker currently showing it
  const placesRef = useRef([]);
  const navVacationsRef = useRef([]);
  const navIndexRef = useRef(-1);
  const activePlaceRef = useRef(null);

  const [sheetTrip, setSheetTrip] = useState(null);

  useImperativeHandle(ref, () => ({
    navigateTrip(dir) { navigateTrip(dir); },
    closeSheet,
    openSheetById(id) {
      const v = navVacationsRef.current.find((x) => x.id === id);
      if (v) openSheet(v);
    },
    invalidateSize() { mapRef.current?.invalidateSize(); },
  }));

  function placeFor(trip) {
    return placesRef.current.find((g) => g.trips.some((t) => t.id === trip.id)) || null;
  }

  function setActiveMarker(tripId) {
    const place = tripId ? placesRef.current.find((g) => g.trips.some((t) => t.id === tripId)) : null;
    activePlaceRef.current = place?.id || null;
    const activeMarker = place ? placeMarkerRef.current.get(place.id) : null;
    markersLayerRef.current?.eachLayer((m) => {
      m.getElement()?.querySelector(".pm")?.classList.toggle("active", m === activeMarker);
    });
  }

  function clearRoute() { routesLayerRef.current?.clearLayers(); }

  function showRouteFor(v) {
    clearRoute();
    if (!v.route?.length || v.route.length < 2) return;
    const latlngs = v.route
      .filter((p) => typeof p.lat === "number" && typeof p.lon === "number")
      .map((p) => [p.lat, p.lon]);
    if (latlngs.length < 2) return;

    L.polyline(latlngs, { color: "#ffffff", weight: 5, opacity: 0.9 }).addTo(routesLayerRef.current);
    L.polyline(latlngs, { color: "#e2574b", weight: 2.5, opacity: 0.95, dashArray: "6,7" }).addTo(routesLayerRef.current);

    v.route.forEach((pt) => {
      if (typeof pt.lat !== "number" || !pt.name) return;
      const marker = L.circleMarker([pt.lat, pt.lon], { radius: 5, color: "#ffffff", weight: 2, fillColor: "#e2574b", fillOpacity: 1 });
      marker.bindTooltip(pt.name, { direction: "top", offset: [0, -6], className: "route-tooltip" });
      marker.addTo(routesLayerRef.current);
    });
  }

  // Fly to the trip, keeping it in the part of the map the sheet doesn't cover.
  function zoomToVacation(v, expanded = false) {
    const map = mapRef.current;
    if (!map) return;
    const pts = [];
    v.route?.forEach((p) => { if (typeof p.lat === "number") pts.push([p.lat, p.lon]); });
    if (!pts.length && typeof v.lat === "number") pts.push([v.lat, v.lon]);
    if (!pts.length) return;
    const pad = coveredPadding(expanded);
    if (pts.length === 1) {
      const size = map.getSize();
      const [l, t] = pad.topLeft, [r, b] = pad.bottomRight;
      // Shift the centre so the point lands in the middle of the uncovered area.
      const offset = L.point((l - r) / 2, (t - b) / 2);
      const target = map.unproject(map.project(pts[0], CITY_ZOOM).subtract(offset), CITY_ZOOM);
      if (size.x && size.y) map.flyTo(target, CITY_ZOOM, { duration: 0.8 });
    } else {
      map.flyToBounds(L.latLngBounds(pts), { paddingTopLeft: pad.topLeft, paddingBottomRight: pad.bottomRight, duration: 0.8, maxZoom: 14 });
    }
  }

  function openSheet(v) {
    setSheetTrip(v);
    navIndexRef.current = navVacationsRef.current.findIndex((x) => x.id === v.id);
    setActiveMarker(v.id);
    zoomToVacation(v);
    showRouteFor(v);
  }

  function closeSheet() {
    setSheetTrip(null);
    setActiveMarker(null);
    clearRoute();
  }

  function navigateTrip(dir) {
    const list = navVacationsRef.current;
    if (!list.length) return;
    if (navIndexRef.current < 0) navIndexRef.current = 0;
    else navIndexRef.current = (navIndexRef.current + dir + list.length) % list.length;
    openSheet(list[navIndexRef.current]);
  }

  /**
   * Markers merge by distance on screen, not on the ground: at Europe zoom
   * Luxembourg, the Alsace trips, Ochtrup and Nideggen become one stack with a
   * count, and they split apart as you zoom in. Tapping a stack zooms to it.
   */
  function renderMarkers() {
    const map = mapRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;
    layer.clearLayers();
    placeMarkerRef.current.clear();
    const zoom = map.getZoom();
    const mostRecentId = navVacationsRef.current[0]?.id;

    const clusters = [];
    placesRef.current.forEach((place) => {
      const pt = map.project([place.lat, place.lon], zoom);
      const c = clusters.find((cl) => cl.pt.distanceTo(pt) < CLUSTER_PX);
      if (c) c.places.push(place);
      else clusters.push({ pt, places: [place] });
    });

    clusters.forEach((c, i) => {
      const lead = c.places[0];
      const trips = c.places.flatMap((p) => p.trips);
      const stacked = c.places.length > 1;
      const newest = lead.trips[0];
      const name = tripText(newest).title;
      const label = stacked
        ? `${c.places.map((p) => tripText(p.trips[0]).title).join(", ")}: ${t("trips", trips.length)}`
        : trips.length > 1 ? `${name}, ${t("visits", trips.length)}` : `${name}, ${formatDateRange(newest.startDate, newest.endDate)}`;
      const marker = L.marker([lead.lat, lead.lon], {
        icon: makeIcon(trips, i, { isRecent: trips.some((t) => t.id === mostRecentId), stacked }),
        title: label, alt: label, riseOnHover: true,
      });
      const onTap = () => {
        if (!stacked) { openSheet(newest); return; }
        const b = L.latLngBounds(c.places.map((p) => [p.lat, p.lon]));
        map.flyToBounds(b, { padding: [80, 80], maxZoom: Math.max(zoom + 2, map.getBoundsZoom(b) - 0.5), duration: 0.6 });
      };
      marker.on("click", onTap);
      marker.on("add", () => {
        const el = marker.getElement();
        if (!el) return;
        let moved = false;
        el.addEventListener("touchstart", () => { moved = false; }, { passive: true });
        el.addEventListener("touchmove", () => { moved = true; }, { passive: true });
        el.addEventListener("touchend", (e) => { if (!moved) { e.preventDefault(); onTap(); } });
        const active = c.places.some((p) => p.id === activePlaceRef.current);
        el.querySelector(".pm")?.classList.toggle("active", active);
      });
      marker.addTo(layer);
      c.places.forEach((p) => placeMarkerRef.current.set(p.id, marker));
    });
  }

  // Init map once
  useEffect(() => {
    // CARTO basemaps now answer with "API key required" tiles, so use the
    // standard OpenStreetMap tiles and mute them with a CSS filter (see .tile-paper).
    const light = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: t("osmCredit"), maxZoom: 19, className: "tile-paper",
    });
    const satellite = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { attribution: "Tiles © Esri", maxZoom: 19 }
    );

    // zoomSnap .25 lets the first frame hug the trips instead of snapping a
    // whole zoom level out (which put Iceland in the middle).
    const map = L.map(mapElRef.current, { layers: [light], worldCopyJump: true, zoomSnap: 0.25 }).setView([50, 10], 4);
    L.control.layers({ [t("tilesLight")]: light, [t("tilesSatellite")]: satellite }, null, { position: "topright", collapsed: true }).addTo(map);
    mapRef.current = map;
    routesLayerRef.current = L.layerGroup().addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);

    const navVacations = vacations.filter((v) => typeof v.lat === "number" && typeof v.lon === "number");
    navVacationsRef.current = navVacations;
    placesRef.current = groupByPlace(navVacations);

    map.on("click", (e) => {
      if (e.originalEvent?.target?.closest(".leaflet-marker-icon")) return;
      closeSheet();
    });
    map.on("zoomend", renderMarkers);

    const pts = placesRef.current.map((p) => [p.lat, p.lon]);
    if (pts.length) {
      const pad = isPhone() ? { paddingTopLeft: [28, 70], paddingBottomRight: [28, 40] } : { paddingTopLeft: [70, 70], paddingBottomRight: [90, 70] };
      map.fitBounds(pts, { ...pad, maxZoom: 6 });
    }
    renderMarkers();

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Marker labels are built in the current language: rebuild them when it changes.
  useEffect(() => { renderMarkers(); /* eslint-disable-line react-hooks/exhaustive-deps */ }, [lang]);

  return (
    <div className="absolute inset-0 bg-[var(--map-bg)]">
      <div ref={mapElRef} className="absolute inset-0" />

      {sheetTrip && <div className="absolute inset-0 z-[699] sm:hidden" onClick={closeSheet} />}

      <AnimatePresence>
        {sheetTrip && (
          <TripSheetPanel
            key="sheet"
            v={sheetTrip}
            place={placeFor(sheetTrip)}
            onClose={closeSheet}
            onPick={(t) => openSheet(t)}
            onNav={(dir) => navigateTrip(dir)}
            onExpand={(expanded) => zoomToVacation(sheetTrip, expanded)}
            onDetails={() => onOpenModal(sheetTrip.id)}
            onOpenLightbox={onOpenLightbox}
          />
        )}
      </AnimatePresence>

      <div className={`absolute z-[700] flex gap-2 left-1/2 -translate-x-1/2 top-3 sm:left-auto sm:translate-x-0 sm:top-auto sm:bottom-6 sm:right-[18px] ${sheetTrip ? "max-sm:hidden" : ""}`}>
        <NavButton onClick={() => navigateTrip(-1)} label={t("prevTrip")}>&#8249;</NavButton>
        <NavButton onClick={() => navigateTrip(1)} label={t("nextTrip")}>&#8250;</NavButton>
      </div>
    </div>
  );
});

function NavButton({ onClick, label, children, small }) {
  return (
    <button
      className={`${small ? "w-9 h-9 text-xl" : "w-10 h-10 sm:w-11 sm:h-11 text-2xl"} rounded-full bg-paper border border-line text-ink leading-none flex items-center justify-center shadow-sm hover:border-ink active:scale-95 transition shrink-0`}
      onClick={onClick}
      title={label}
      aria-label={label}
    >
      <span className="-mt-0.5" aria-hidden="true">{children}</span>
    </button>
  );
}

/**
 * Trip card on the map. On phones it is a bottom sheet with two heights: a
 * peek that leaves the trip visible on the map, and full; drag the handle or
 * tap it to switch. On wider screens it is a card at the bottom left.
 */
function TripSheetPanel({ v, place, onClose, onPick, onNav, onExpand, onDetails, onOpenLightbox }) {
  const [expanded, setExpanded] = useState(false);
  const pics = v.pictures || [];
  const touch = useRef(null);
  const stops = routeStops(v);
  const days = tripDays(v);
  const visit = visitIndex(v, place);
  const srcs = pics.map((p) => joinPath(v.folder, p));
  const captions = pics.map((_, i) => photoCaption(v, i, pics.length));
  const imgIdx = pics.map((p, i) => (isVideo(p) ? -1 : i)).filter((i) => i >= 0).slice(0, 6);
  const text = tripText(v);

  function setSheet(next) {
    if (next === expanded) return;
    setExpanded(next);
    onExpand(next);
  }

  return (
    <motion.div
      className={`absolute bottom-0 left-0 w-full sm:left-4 sm:bottom-4 sm:w-[380px] bg-paper border border-line rounded-t-xl sm:rounded-md shadow-[var(--shadow)] z-[810] flex flex-col overflow-hidden transition-[height] duration-300 ease-out ${
        expanded ? "h-[88dvh]" : "h-[46dvh]"
      } sm:h-auto sm:max-h-[78vh]`}
      initial={{ y: "110%" }}
      animate={{ y: 0 }}
      exit={{ y: "110%" }}
      transition={{ type: "spring", damping: 32, stiffness: 300 }}
      onTouchStart={(e) => { const t = e.changedTouches[0]; touch.current = { x: t.clientX, y: t.clientY, onHandle: !!e.target.closest?.("[data-sheet-handle]") }; }}
      onTouchEnd={(e) => {
        if (!touch.current) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - touch.current.x, dy = t.clientY - touch.current.y;
        const onHandle = touch.current.onHandle;
        touch.current = null;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) { onNav(dx < 0 ? 1 : -1); return; }
        if (onHandle && Math.abs(dy) > 30) {
          if (dy < 0) setSheet(true);
          else if (expanded) setSheet(false);
          else onClose();
        }
      }}
    >
      <button
        data-sheet-handle
        className="sm:hidden shrink-0 w-full pt-2.5 pb-1.5 flex justify-center touch-none"
        onClick={() => setSheet(!expanded)}
        aria-label={expanded ? t("sheetSmaller") : t("sheetBigger")}
      >
        <span className="block w-10 h-1 bg-line-h rounded-full" />
      </button>

      <div className="px-4 sm:px-5 pt-1 sm:pt-4 pb-3 overflow-y-auto flex-1 min-h-0 overscroll-contain">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0" data-sheet-handle>
            <div className="flex items-center gap-1.5 mb-1">
              <FlagImg iso={v.country} className="w-5 h-3.5" />
              <span className="text-[11px] text-ink-2 tracking-widest uppercase truncate">{text.location || text.title}</span>
            </div>
            <div className="font-hand text-[32px] text-ink leading-none mb-1 truncate">{text.title}</div>
            <div className="text-[13px] text-ink-2 tabular-nums">
              {formatDateRange(v.startDate, v.endDate)}
              {days ? ` · ${formatDays(days)}` : ""}
              {visit ? ` · ${t("nthVisit", visit.n)}` : ""}
            </div>
          </div>
          <div className="flex gap-1.5 shrink-0">
            <NavButton small onClick={() => onNav(-1)} label={t("prevTrip")}>&#8249;</NavButton>
            <NavButton small onClick={() => onNav(1)} label={t("nextTrip")}>&#8250;</NavButton>
            <button
              className="w-9 h-9 rounded-full bg-cream text-ink-2 flex items-center justify-center hover:text-ink transition"
              onClick={onClose}
              aria-label={t("close")}
            >
              ✕
            </button>
          </div>
        </div>

        {place && place.trips.length > 1 && (
          <div className="flex flex-wrap gap-x-3.5 gap-y-1 mt-2.5 text-[13px] tabular-nums" role="group" aria-label={t("visitsHere")}>
            {place.trips.map((t) => (
              <button
                key={t.id}
                onClick={() => onPick(t)}
                aria-pressed={t.id === v.id}
                title={formatDateRange(t.startDate, t.endDate)}
                className={`py-0.5 underline-offset-4 decoration-2 transition-colors ${
                  t.id === v.id ? "text-ink underline decoration-pin" : "text-ink-2 hover:text-ink hover:underline decoration-line-h"
                }`}
              >
                {formatMonthYear(t.startDate)}
              </button>
            ))}
          </div>
        )}

        {imgIdx.length > 0 && (
          <div className="flex gap-1.5 mt-3 -mx-4 px-4 sm:-mx-1 sm:px-1 overflow-x-auto [scrollbar-width:none]">
            {imgIdx.map((i) => (
              <button
                key={srcs[i]}
                onClick={() => onOpenLightbox(srcs, captions, i)}
                className="shrink-0 w-[84px] h-[84px] overflow-hidden active:opacity-80 transition"
                style={{ backgroundColor: photoColor(v.folder, pics[i]) || "var(--cream)" }}
                aria-label={captions[i]}
              >
                <img src={thumbPath(v.folder, pics[i])} onError={thumbFallback(srcs[i])} alt="" loading="lazy" className="w-full h-full object-cover block" />
              </button>
            ))}
          </div>
        )}

        <p className="text-[14px] leading-relaxed text-ink-2 mt-3 mb-0">{text.description}</p>

        {stops.length > 0 && (
          <p className="text-[13px] text-ink-2 leading-relaxed mt-2.5 mb-0">
            <span className="text-ink font-medium">{t("route")}</span> · {stops.join(" → ")}
          </p>
        )}
      </div>

      <div className="shrink-0 px-4 sm:px-5 pt-2 pb-[max(.75rem,env(safe-area-inset-bottom))] sm:pb-4 border-t border-line bg-paper">
        <button
          className="w-full bg-ink text-paper text-sm font-medium py-2.5 px-4 rounded-full hover:bg-ink/85 active:scale-[.99] transition"
          onClick={onDetails}
        >
          {pics.length ? `${t("openTrip")} · ${t("photos", pics.length)}` : t("openTrip")}
        </button>
      </div>
    </motion.div>
  );
}

export default MapView;
