import { useEffect, useImperativeHandle, useRef, useState, forwardRef } from "react";
import L from "leaflet";
import { motion, AnimatePresence } from "motion/react";
import { joinPath, flagSrc, formatDateRange } from "@/lib/helpers";

const CITY_ZOOM = 12;

function makePhotoIcon(v, isRecent) {
  const hasPic = v.pictures?.length && v.folder;
  const imgSrc = hasPic ? joinPath(v.folder, v.pictures[0]) : null;
  const flag = flagSrc(v.country);

  let inner;
  if (imgSrc) {
    const fallback = flag ? `<img class="pm-flag" src="${flag}" alt="" style="display:none" />` : "";
    inner = `<img src="${imgSrc}" alt="" onerror="this.style.display='none';var s=this.nextElementSibling;if(s)s.style.display=''" />${fallback}`;
  } else if (flag) {
    inner = `<img class="pm-flag" src="${flag}" alt="" />`;
  } else {
    inner = "";
  }

  return L.divIcon({
    className: "pm-wrap",
    html: `<div class="pm${isRecent ? " pulse" : ""}">${inner}</div>`,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    popupAnchor: [0, -24],
  });
}

const MapView = forwardRef(function MapView({ vacations, onOpenModal }, ref) {
  const mapElRef = useRef(null);
  const mapRef = useRef(null);
  const routesLayerRef = useRef(null);
  const markersRef = useRef(new Map());
  const navVacationsRef = useRef([]);
  const navIndexRef = useRef(-1);

  const [sheetTrip, setSheetTrip] = useState(null);

  useImperativeHandle(ref, () => ({
    navigateTrip(dir) {
      navigateTrip(dir);
    },
    closeSheet,
    openSheetById(id) {
      const v = navVacationsRef.current.find((x) => x.id === id);
      if (v) openSheet(v);
    },
    invalidateSize() {
      mapRef.current?.invalidateSize();
    },
  }));

  function setActiveMarker(id) {
    markersRef.current.forEach((m, mid) => {
      m.getElement()?.querySelector(".pm")?.classList.toggle("active", mid === id);
    });
  }

  function clearRoute() {
    routesLayerRef.current?.clearLayers();
  }

  function showRouteFor(v) {
    clearRoute();
    if (!v.route?.length || v.route.length < 2) return;
    const latlngs = v.route
      .filter((p) => typeof p.lat === "number" && typeof p.lon === "number")
      .map((p) => [p.lat, p.lon]);
    if (latlngs.length < 2) return;

    L.polyline(latlngs, { color: "#c8a060", weight: 2.5, opacity: 0.8, dashArray: "6,8" }).addTo(routesLayerRef.current);

    v.route.forEach((pt) => {
      if (typeof pt.lat !== "number") return;
      const isStop = Boolean(pt.name);
      const marker = L.circleMarker([pt.lat, pt.lon], {
        radius: isStop ? 4 : 2,
        color: "#e8c890",
        weight: 1.5,
        fillColor: "#c8a060",
        fillOpacity: isStop ? 1 : 0.6,
      });
      if (isStop) {
        marker.bindTooltip(pt.name, { direction: "top", offset: [0, -6], className: "route-tooltip" });
      }
      marker.addTo(routesLayerRef.current);
    });
  }

  function zoomToVacation(v) {
    const map = mapRef.current;
    if (!map) return;
    const pts = [];
    v.route?.forEach((p) => { if (typeof p.lat === "number") pts.push([p.lat, p.lon]); });
    if (!pts.length && typeof v.lat === "number") pts.push([v.lat, v.lon]);
    if (pts.length === 1) map.flyTo(pts[0], CITY_ZOOM, { duration: 0.8 });
    else if (pts.length > 1) map.flyToBounds(L.latLngBounds(pts), { padding: [80, 80], duration: 0.8, maxZoom: 14 });
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
    const dark = L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: "© OpenStreetMap © CARTO", maxZoom: 19, subdomains: "abcd",
    });
    const satellite = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { attribution: "Tiles © Esri", maxZoom: 19 }
    );

    const map = L.map(mapElRef.current, { layers: [dark], worldCopyJump: true }).setView([20, 0], 2);
    L.control.layers({ Donker: dark, Satelliet: satellite }, null, { position: "topright", collapsed: true }).addTo(map);
    mapRef.current = map;
    routesLayerRef.current = L.layerGroup().addTo(map);

    const navVacations = vacations.filter((v) => typeof v.lat === "number" && typeof v.lon === "number");
    navVacationsRef.current = navVacations;
    const mostRecentId = navVacations[0]?.id;
    const bounds = [];

    navVacations.forEach((v) => {
      const isRecent = v.id === mostRecentId;
      const marker = L.marker([v.lat, v.lon], { icon: makePhotoIcon(v, isRecent) });
      const onTap = () => openSheet(v);
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
      markersRef.current.set(v.id, marker);
      bounds.push([v.lat, v.lon]);
    });

    map.on("click", (e) => {
      if (e.originalEvent?.target?.closest(".leaflet-marker-icon")) return;
      closeSheet();
      markersRef.current.forEach((m) => m.getElement()?.querySelector(".pm")?.classList.remove("active"));
    });

    if (bounds.length) map.fitBounds(bounds, { padding: [60, 60], maxZoom: 6 });

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pics = sheetTrip?.pictures || [];
  const hasPhoto = pics.length && sheetTrip?.folder;

  return (
    <div className="absolute inset-0 bg-[#07090f]">
      <div ref={mapElRef} className="absolute inset-0 bg-[#07090f]" />

      {/* sheet backdrop */}
      {sheetTrip && (
        <div className="absolute inset-0 z-[699]" onClick={closeSheet} />
      )}

      <AnimatePresence>
        {sheetTrip && (
          <TripSheetPanel
            v={sheetTrip}
            hasPhoto={hasPhoto}
            onClose={closeSheet}
            onDetails={() => onOpenModal(sheetTrip.id)}
            onSwipeNav={(dir) => navigateTrip(dir)}
          />
        )}
      </AnimatePresence>

      {/* prev/next nav */}
      <div className="hidden sm:flex absolute bottom-6 right-[18px] gap-2 z-[700]">
        <button
          className="w-11 h-11 rounded-full bg-card/90 border border-border-h text-gold text-2xl leading-none flex items-center justify-center backdrop-blur-md shadow-lg hover:bg-accent hover:border-gold hover:scale-105 active:scale-95 transition"
          onClick={() => navigateTrip(-1)}
          title="Vorige reis"
        >
          &#8249;
        </button>
        <button
          className="w-11 h-11 rounded-full bg-card/90 border border-border-h text-gold text-2xl leading-none flex items-center justify-center backdrop-blur-md shadow-lg hover:bg-accent hover:border-gold hover:scale-105 active:scale-95 transition"
          onClick={() => navigateTrip(1)}
          title="Volgende reis"
        >
          &#8250;
        </button>
      </div>
    </div>
  );
});

function TripSheetPanel({ v, hasPhoto, onClose, onDetails, onSwipeNav }) {
  const pics = v.pictures || [];
  const touchStart = useRef({ x: 0, y: 0 });
  const flag = flagSrc(v.country);
  const route = v.route?.length > 1 ? v.route.map((p) => p.name || "").filter(Boolean) : null;

  return (
    <motion.div
      className="absolute bottom-0 left-0 w-full sm:w-[400px] max-h-[80vh] sm:max-h-[80vh] bg-[#100c08]/96 border border-border rounded-t-[18px] shadow-2xl backdrop-blur-md z-[700] flex flex-col overflow-hidden"
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 32, stiffness: 300 }}
      onTouchStart={(e) => { touchStart.current = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY }; }}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].clientX - touchStart.current.x;
        const dy = e.changedTouches[0].clientY - touchStart.current.y;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) onSwipeNav(dx < 0 ? 1 : -1);
      }}
    >
      <div className="w-9 h-1 bg-border-h rounded-full mx-auto mt-2.5 shrink-0" />

      <div
        className="w-full h-[160px] sm:h-[160px] shrink-0 overflow-hidden relative cursor-pointer"
        onClick={onDetails}
      >
        {hasPhoto ? (
          <>
            <img src={joinPath(v.folder, pics[0])} alt={v.title} className="w-full h-full object-cover block" />
            <div className="absolute bottom-0 left-0 right-0 h-[60px] bg-gradient-to-b from-transparent to-black/96 pointer-events-none" />
          </>
        ) : flag ? (
          <div className="w-full h-full bg-secondary flex items-center justify-center">
            <img src={flag} alt="" className="w-[100px] h-auto rounded-md shadow-lg opacity-90" />
          </div>
        ) : null}
      </div>

      <div className="px-5 pt-3 pb-6 overflow-y-auto flex-1">
        <div className="flex items-center gap-1.5 mb-1">
          {flag && <img src={flag} alt="" className="w-5 h-3.5 rounded-[2px] object-cover shadow" />}
          <span className="text-[10px] text-muted-foreground tracking-widest uppercase">
            {(v.location || v.title || "").toUpperCase()}
          </span>
        </div>
        <div className="font-serif italic text-2xl text-gold-l leading-tight -tracking-tight mb-1">{v.title}</div>
        <div className="text-xs text-muted-foreground mb-2.5 tracking-wide">{formatDateRange(v.startDate, v.endDate)}</div>
        <p className="text-[13.5px] leading-relaxed text-[#907860] mb-3">{v.description}</p>

        {route && (
          <div className="text-xs text-muted-2 leading-relaxed mb-3.5 px-3 py-2 bg-secondary border border-border rounded-lg">
            <span className="text-muted-foreground font-medium mr-1">Route</span> {route.join(" → ")}
          </div>
        )}

        <div className="flex gap-2 items-center">
          <button
            className="w-9 h-9 rounded-full bg-secondary border border-border text-muted-foreground flex items-center justify-center hover:bg-border hover:text-foreground hover:border-border-h transition shrink-0"
            onClick={onClose}
          >
            ✕
          </button>
          <button
            className="flex-1 bg-accent border border-gold/30 text-gold text-sm font-medium py-2 px-4 rounded-full hover:bg-accent/70 hover:border-gold transition"
            onClick={onDetails}
          >
            Foto's &amp; details →
          </button>
        </div>
        <div className="text-[11px] text-muted-foreground text-right mt-2">
          {pics.length ? pics.length + (pics.length === 1 ? " foto" : " foto's") : ""}
        </div>
      </div>
    </motion.div>
  );
}

export default MapView;
