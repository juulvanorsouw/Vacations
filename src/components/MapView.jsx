import { useEffect, useImperativeHandle, useRef, useState, forwardRef } from "react";
import L from "leaflet";
import { motion, AnimatePresence } from "motion/react";
import { joinPath, thumbPath, thumbFallback, flagSrc, formatDateRange, groupByPlace, tripDays, formatDays, routeStops, isVideo, visitIndex, photoCaption } from "@/lib/helpers";

const CITY_ZOOM = 12;
const TILTS = [-4, 3, -2, 4, -3, 2];

function firstImage(v) {
  const p = (v.pictures || []).find((f) => !isVideo(f));
  return p && v.folder ? { thumb: thumbPath(v.folder, p), full: joinPath(v.folder, p) } : null;
}

function makeGroupIcon(group, index, isRecent) {
  const v = group.trips[0];
  // Prefer any photo in the group over a flag, even if the newest visit has none yet.
  const img = group.trips.map(firstImage).find(Boolean) || null;
  const flag = flagSrc(v.country);
  let inner;
  if (img) {
    const fallback = flag ? `<img class="pm-flag" src="${flag}" alt="" style="display:none" />` : "";
    // thumbnail → original → flag
    inner = `<img src="${img.thumb}" alt="" onerror="if(!this.dataset.f){this.dataset.f=1;this.src='${img.full}';return}this.style.display='none';var s=this.nextElementSibling;if(s)s.style.display=''" />${fallback}`;
  } else if (flag) {
    inner = `<img class="pm-flag" src="${flag}" alt="" />`;
  } else {
    inner = "";
  }
  const count = group.trips.length > 1 ? `<span class="pm-count">${group.trips.length}</span>` : "";
  return L.divIcon({
    className: "pm-wrap",
    html: `<div class="pm${isRecent ? " pulse" : ""}" style="--tilt:${TILTS[index % TILTS.length]}deg">${inner}${count}</div>`,
    iconSize: [44, 48],
    iconAnchor: [22, 44],
    popupAnchor: [0, -40],
  });
}

const MapView = forwardRef(function MapView({ vacations, onOpenModal, onOpenLightbox }, ref) {
  const mapElRef = useRef(null);
  const mapRef = useRef(null);
  const routesLayerRef = useRef(null);
  const markersRef = useRef(new Map()); // group id -> marker
  const groupsRef = useRef([]);
  const navVacationsRef = useRef([]);
  const navIndexRef = useRef(-1);

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

  function groupFor(trip) {
    return groupsRef.current.find((g) => g.trips.some((t) => t.id === trip.id)) || null;
  }

  function setActiveMarker(tripId) {
    const g = tripId ? groupsRef.current.find((grp) => grp.trips.some((t) => t.id === tripId)) : null;
    markersRef.current.forEach((m, gid) => {
      m.getElement()?.querySelector(".pm")?.classList.toggle("active", !!g && gid === g.id);
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
      if (typeof pt.lat !== "number") return;
      const isStop = Boolean(pt.name);
      if (!isStop) return;
      const marker = L.circleMarker([pt.lat, pt.lon], { radius: 5, color: "#ffffff", weight: 2, fillColor: "#e2574b", fillOpacity: 1 });
      marker.bindTooltip(pt.name, { direction: "top", offset: [0, -6], className: "route-tooltip" });
      marker.addTo(routesLayerRef.current);
    });
  }

  function zoomToVacation(v) {
    const map = mapRef.current;
    if (!map) return;
    const pts = [];
    v.route?.forEach((p) => { if (typeof p.lat === "number") pts.push([p.lat, p.lon]); });
    if (!pts.length && typeof v.lat === "number") pts.push([v.lat, v.lon]);
    const pad = window.innerWidth < 640 ? [60, 60] : [80, 80];
    if (pts.length === 1) map.flyTo(pts[0], CITY_ZOOM, { duration: 0.8 });
    else if (pts.length > 1) map.flyToBounds(L.latLngBounds(pts), { padding: pad, duration: 0.8, maxZoom: 14 });
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

  // Init map once
  useEffect(() => {
    // CARTO basemaps now answer with "API key required" tiles, so use the
    // standard OpenStreetMap tiles and mute them with a CSS filter (see .tile-paper).
    const light = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap-bijdragers", maxZoom: 19, className: "tile-paper",
    });
    const satellite = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { attribution: "Tiles © Esri", maxZoom: 19 }
    );

    const map = L.map(mapElRef.current, { layers: [light], worldCopyJump: true }).setView([20, 0], 2);
    L.control.layers({ Licht: light, Satelliet: satellite }, null, { position: "topright", collapsed: true }).addTo(map);
    mapRef.current = map;
    routesLayerRef.current = L.layerGroup().addTo(map);

    const navVacations = vacations.filter((v) => typeof v.lat === "number" && typeof v.lon === "number");
    navVacationsRef.current = navVacations;
    const groups = groupByPlace(navVacations);
    groupsRef.current = groups;
    const mostRecentId = navVacations[0]?.id;
    const bounds = [];

    groups.forEach((g, i) => {
      const newest = g.trips[0];
      const isRecent = newest.id === mostRecentId;
      const label = g.trips.length > 1 ? `${newest.title}, ${g.trips.length} bezoeken` : `${newest.title}, ${formatDateRange(newest.startDate, newest.endDate)}`;
      const marker = L.marker([g.lat, g.lon], { icon: makeGroupIcon(g, i, isRecent), title: label, alt: label, riseOnHover: true });
      const onTap = () => openSheet(newest);
      marker.on("click", onTap);
      marker.on("add", () => {
        const el = marker.getElement();
        if (!el) return;
        let moved = false;
        el.addEventListener("touchstart", () => { moved = false; }, { passive: true });
        el.addEventListener("touchmove", () => { moved = true; }, { passive: true });
        el.addEventListener("touchend", (e) => { if (!moved) { e.preventDefault(); onTap(); } });
      });
      marker.addTo(map);
      markersRef.current.set(g.id, marker);
      bounds.push([g.lat, g.lon]);
    });

    map.on("click", (e) => {
      if (e.originalEvent?.target?.closest(".leaflet-marker-icon")) return;
      closeSheet();
    });

    if (bounds.length) map.fitBounds(bounds, { padding: [60, 60], maxZoom: 6 });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="absolute inset-0 bg-[#e9e3d7]">
      <div ref={mapElRef} className="absolute inset-0" />

      {sheetTrip && <div className="absolute inset-0 z-[699]" onClick={closeSheet} />}

      <AnimatePresence>
        {sheetTrip && (
          <TripSheetPanel
            key={sheetTrip.id}
            v={sheetTrip}
            group={groupFor(sheetTrip)}
            onClose={closeSheet}
            onPick={(t) => openSheet(t)}
            onDetails={() => onOpenModal(sheetTrip.id)}
            onOpenLightbox={onOpenLightbox}
            onSwipeNav={(dir) => navigateTrip(dir)}
          />
        )}
      </AnimatePresence>

      <div className="absolute z-[700] flex gap-2 left-1/2 -translate-x-1/2 top-3 sm:left-auto sm:translate-x-0 sm:top-auto sm:bottom-6 sm:right-[18px]">
        <NavButton onClick={() => navigateTrip(-1)} label="Vorige reis">&#8249;</NavButton>
        <NavButton onClick={() => navigateTrip(1)} label="Volgende reis">&#8250;</NavButton>
      </div>
    </div>
  );
});

function NavButton({ onClick, label, children }) {
  return (
    <button
      className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-paper border border-line text-ink text-2xl leading-none flex items-center justify-center shadow-md hover:border-ink hover:scale-105 active:scale-95 transition"
      onClick={onClick}
      title={label}
      aria-label={label}
    >
      {children}
    </button>
  );
}

function TripSheetPanel({ v, group, onClose, onPick, onDetails, onOpenLightbox, onSwipeNav }) {
  const pics = v.pictures || [];
  const touchStart = useRef({ x: 0, y: 0 });
  const flag = flagSrc(v.country);
  const stops = routeStops(v);
  const days = tripDays(v);
  const visit = visitIndex(v, group);
  const srcs = pics.map((p) => joinPath(v.folder, p));
  const thumbs = pics.map((p) => thumbPath(v.folder, p));
  const captions = pics.map((_, i) => photoCaption(v, i, pics.length));
  const imgIdx = pics.map((p, i) => (isVideo(p) ? -1 : i)).filter((i) => i >= 0).slice(0, 6);

  return (
    <motion.div
      className="absolute bottom-0 left-0 w-full sm:left-4 sm:bottom-4 sm:w-[380px] max-h-[78vh] bg-paper border border-line rounded-t-2xl sm:rounded-2xl shadow-[var(--shadow)] z-[700] flex flex-col overflow-hidden touch-pan-y"
      initial={{ y: "110%" }}
      animate={{ y: 0 }}
      exit={{ y: "110%" }}
      transition={{ type: "spring", damping: 32, stiffness: 300 }}
      onTouchStart={(e) => { touchStart.current = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY }; }}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].clientX - touchStart.current.x;
        const dy = e.changedTouches[0].clientY - touchStart.current.y;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
          e.preventDefault();
          onSwipeNav(dx < 0 ? 1 : -1);
        }
      }}
    >
      <div className="w-9 h-1 bg-line-h rounded-full mx-auto mt-2.5 shrink-0 sm:hidden" />

      <div className="px-5 pt-3 sm:pt-4 pb-5 overflow-y-auto flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              {flag && <img src={flag} alt="" className="w-5 h-3.5 rounded-[2px] object-cover shadow-sm" />}
              <span className="text-[10px] text-ink-2 tracking-widest uppercase truncate">{v.location || v.title}</span>
            </div>
            <div className="font-hand text-[32px] text-ink leading-none mb-1 truncate">{v.title}</div>
            <div className="text-xs text-ink-2 tabular-nums">
              {formatDateRange(v.startDate, v.endDate)}
              {days ? ` · ${formatDays(days)}` : ""}
              {visit ? ` · ${visit.n}e bezoek` : ""}
            </div>
          </div>
          <button
            className="w-8 h-8 rounded-full bg-cream border border-line text-ink-2 flex items-center justify-center hover:text-ink hover:border-line-h transition shrink-0"
            onClick={onClose}
            aria-label="Sluiten"
          >
            ✕
          </button>
        </div>

        {group && group.trips.length > 1 && (
          <div className="flex flex-wrap gap-1.5 mt-3" role="group" aria-label="Bezoeken op deze plek">
            {group.trips.map((t) => (
              <button
                key={t.id}
                onClick={() => onPick(t)}
                aria-pressed={t.id === v.id}
                className={`rounded-full border px-2.5 py-1 text-[11px] tabular-nums transition-colors ${
                  t.id === v.id ? "bg-ink text-paper border-ink" : "bg-paper border-line text-ink-2 hover:border-line-h hover:text-ink"
                }`}
              >
                {formatDateRange(t.startDate, t.endDate)}
              </button>
            ))}
          </div>
        )}

        {imgIdx.length > 0 && (
          <div className="flex gap-1.5 mt-3.5 -mx-1 px-1 overflow-x-auto">
            {imgIdx.map((i) => (
              <button
                key={srcs[i]}
                onClick={() => onOpenLightbox(srcs, captions, i)}
                className="shrink-0 w-[72px] h-[72px] bg-paper p-1 pb-2.5 shadow-sm hover:-translate-y-0.5 transition"
                aria-label={captions[i]}
              >
                <img src={thumbs[i]} onError={thumbFallback(srcs[i])} alt="" loading="lazy" className="w-full h-full object-cover block bg-cream" />
              </button>
            ))}
          </div>
        )}

        <p className="text-[13.5px] leading-relaxed text-ink-2 mt-3 mb-3">{v.description}</p>

        {stops.length > 0 && (
          <div className="text-xs text-ink-2 leading-relaxed mb-3.5 px-3 py-2 bg-cream border border-line rounded-lg">
            <span className="text-ink font-medium mr-1">Route</span> {stops.join(" → ")}
          </div>
        )}

        <button
          className="w-full bg-ink text-paper text-sm font-medium py-2.5 px-4 rounded-full hover:bg-ink/85 transition"
          onClick={onDetails}
        >
          {pics.length ? `Alle ${pics.length} foto's & details →` : "Details →"}
        </button>
      </div>
    </motion.div>
  );
}

export default MapView;
