// app.js — leest reisdata uit window.VACATIONS (geladen via vacations.js)
// en rendert de kaart, tijdlijn, modale details en lightbox.

const els = {
  map: document.getElementById("map"),
  timeline: document.getElementById("timeline"),
  viewMap: document.getElementById("view-map"),
  viewTimeline: document.getElementById("view-timeline"),
  btnMap: document.getElementById("btn-map"),
  btnTimeline: document.getElementById("btn-timeline"),
  modal: document.getElementById("modal"),
  modalTitle: document.getElementById("modal-title"),
  modalMeta: document.getElementById("modal-meta"),
  modalDesc: document.getElementById("modal-desc"),
  modalGallery: document.getElementById("modal-gallery"),
  modalClose: document.querySelector("#modal .close"),
  modalMapBtn: document.getElementById("modal-map-btn"),
  headerStats: document.getElementById("header-stats"),
  lightbox: document.getElementById("lightbox"),
  lightboxImg: document.getElementById("lightbox-img"),
  lbPrev: document.getElementById("lb-prev"),
  lbNext: document.getElementById("lb-next"),
  lbCounter: document.getElementById("lb-counter"),
};

let vacations = [];
let map = null;
let lightboxPhotos = [];
let lightboxAlts = [];
let lightboxIndex = 0;
let routesLayer = null;
let clusterGroup = null;
let activeRouteId = null;
let currentModalId = null;
let activeYearFilter = null;
const markersById = new Map();
const CITY_ZOOM = 12;

(function init() {
  els.btnMap.addEventListener("click", function () { setView("map"); });
  els.btnTimeline.addEventListener("click", function () { setView("timeline"); });
  els.modalClose.addEventListener("click", closeModal);
  els.modal.addEventListener("click", function (e) { if (e.target === els.modal) closeModal(); });
  els.modalMapBtn.addEventListener("click", function () {
    if (!currentModalId) return;
    const v = vacations.find(function (x) { return x.id === currentModalId; });
    closeModal();
    setView("map");
    if (v) {
      showRouteFor(v);
      zoomToVacation(v);
      const marker = markersById.get(v.id);
      if (marker) setTimeout(function () { marker.openPopup(); }, 800);
    }
  });
  els.lightbox.addEventListener("click", function (e) {
    if (e.target === els.lightbox) els.lightbox.classList.remove("open");
  });
  els.lbPrev.addEventListener("click", function (e) { e.stopPropagation(); navigateLightbox(-1); });
  els.lbNext.addEventListener("click", function (e) { e.stopPropagation(); navigateLightbox(1); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { closeModal(); els.lightbox.classList.remove("open"); }
    if (els.lightbox.classList.contains("open")) {
      if (e.key === "ArrowLeft")  { e.preventDefault(); navigateLightbox(-1); }
      if (e.key === "ArrowRight") { e.preventDefault(); navigateLightbox(1); }
    }
  });

  // Touch swipe for lightbox
  var touchStartX = 0;
  els.lightbox.addEventListener("touchstart", function (e) {
    touchStartX = e.changedTouches[0].clientX;
  }, { passive: true });
  els.lightbox.addEventListener("touchend", function (e) {
    var dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) navigateLightbox(dx < 0 ? 1 : -1);
  }, { passive: true });

  if (!window.VACATIONS || !Array.isArray(window.VACATIONS.vacations)) {
    showLoadError(new Error("vacations.js heeft window.VACATIONS.vacations niet gezet"));
    return;
  }

  vacations = window.VACATIONS.vacations.slice();
  vacations.sort(function (a, b) {
    return (b.startDate || "").localeCompare(a.startDate || "");
  });

  renderStats();
  renderMap();
  renderTimeline();
})();

function renderStats() {
  const countrySet = new Set();
  for (const v of vacations) {
    const list = Array.isArray(v.countries) ? v.countries : (v.country ? [v.country] : []);
    for (const c of list) countrySet.add(c.toUpperCase());
  }
  els.headerStats.textContent =
    vacations.length + " reizen · " + countrySet.size + " landen";
}

function setView(view) {
  const showMap = view === "map";
  els.viewMap.classList.toggle("active", showMap);
  els.viewTimeline.classList.toggle("active", !showMap);
  els.btnMap.classList.toggle("active", showMap);
  els.btnTimeline.classList.toggle("active", !showMap);
  els.btnMap.setAttribute("aria-selected", String(showMap));
  els.btnTimeline.setAttribute("aria-selected", String(!showMap));
  if (showMap && map) setTimeout(function () { map.invalidateSize(); }, 50);
}

function flagUrl(iso) {
  if (!iso || typeof iso !== "string" || iso.length !== 2) return "";
  return "https://flagcdn.com/" + iso.toLowerCase() + ".svg";
}

function flagImg(iso, cssClass) {
  const url = flagUrl(iso);
  if (!url) return "";
  const cls = cssClass || "flag";
  return '<img class="' + cls + '" src="' + url + '" alt="' + escapeAttr(iso) + '" />';
}

function makePulseIcon(iso) {
  return L.divIcon({
    className: "flag-marker",
    html: '<div class="flag-pulse-wrap"><div class="flag-marker-inner">' + flagImg(iso, "flag-img") + "</div></div>",
    iconSize: [36, 24],
    iconAnchor: [18, 12],
    popupAnchor: [0, -14],
  });
}

function makeFlagIcon(iso) {
  // Rechthoekige vlag-marker (3:2). De CSS regelt de eigenlijke maatvoering.
  return L.divIcon({
    className: "flag-marker",
    html: '<div class="flag-marker-inner">' + flagImg(iso, "flag-img") + "</div>",
    iconSize: [36, 24],
    iconAnchor: [18, 12],
    popupAnchor: [0, -14],
  });
}

function renderMap() {
  const basemaps = {
    "OpenStreetMap": L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      { attribution: "&copy; OpenStreetMap", maxZoom: 19 }
    ),
    "Satelliet": L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { attribution: "Tiles &copy; Esri", maxZoom: 19 }
    ),
  };

  map = L.map("map", {
    worldCopyJump: true,
    layers: [basemaps["OpenStreetMap"]],
  }).setView([20, 0], 2);

  L.control.layers(basemaps, null, { position: "topright", collapsed: false }).addTo(map);
  routesLayer = L.layerGroup().addTo(map);

  const mostRecentId = (function () {
    for (var i = 0; i < vacations.length; i++) {
      if (typeof vacations[i].lat === "number") return vacations[i].id;
    }
    return null;
  })();

  const bounds = [];

  for (const v of vacations) {
    if (typeof v.lat !== "number" || typeof v.lon !== "number") continue;

    const marker = L.marker([v.lat, v.lon], {
      icon: v.id === mostRecentId ? makePulseIcon(v.country) : makeFlagIcon(v.country),
    });
    const popupHtml =
      "<b>" + flagImg(v.country, "popup-flag") + " " + escapeHtml(v.title) + "</b><br />" +
      "<small>" + escapeHtml(formatDateRange(v.startDate, v.endDate)) + "</small><br />" +
      '<span class="popup-link" data-id="' + escapeAttr(v.id) + '">Details bekijken &rarr;</span>';
    marker.bindPopup(popupHtml);
    marker.on("popupopen", function (e) {
      const link = e.popup.getElement().querySelector(".popup-link");
      if (link) link.addEventListener("click", function () { openModal(v.id); });
    });
    marker.on("click", function () {
      showRouteFor(v);
      zoomToVacation(v);
    });

    marker.addTo(map);
    markersById.set(v.id, marker);
    bounds.push([v.lat, v.lon]);
  }

  map.on("click", function (e) {
    if (e.originalEvent && e.originalEvent.target &&
        e.originalEvent.target.closest(".leaflet-marker-icon, .leaflet-popup")) return;
    clearRoute();
  });

  if (bounds.length) {
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 6 });
  }
}

function showRouteFor(v) {
  clearRoute();
  if (!v.route || !Array.isArray(v.route) || v.route.length < 2) return;

  const latlngs = v.route
    .filter(function (p) { return typeof p.lat === "number" && typeof p.lon === "number"; })
    .map(function (p) { return [p.lat, p.lon]; });
  if (latlngs.length < 2) return;

  L.polyline(latlngs, {
    color: "#5b9dff",
    weight: 3,
    opacity: 0.85,
    dashArray: "6, 8",
  }).addTo(routesLayer);

  v.route.forEach(function (pt) {
    if (typeof pt.lat !== "number" || typeof pt.lon !== "number") return;
    const dot = L.circleMarker([pt.lat, pt.lon], {
      radius: 5,
      color: "#fff",
      weight: 2,
      fillColor: "#5b9dff",
      fillOpacity: 1,
    }).addTo(routesLayer);
    dot.bindTooltip(escapeHtml(pt.name || ""), {
      direction: "top", offset: [0, -6], className: "route-tooltip"
    });
  });

  activeRouteId = v.id;
}

function clearRoute() {
  if (routesLayer) routesLayer.clearLayers();
  activeRouteId = null;
}

function zoomToVacation(v) {
  // Collect all meaningful coordinates: route points first, fall back to the pin.
  const pts = [];
  if (v.route && Array.isArray(v.route)) {
    for (const p of v.route) {
      if (typeof p.lat === "number" && typeof p.lon === "number") {
        pts.push([p.lat, p.lon]);
      }
    }
  }
  if (!pts.length && typeof v.lat === "number" && typeof v.lon === "number") {
    pts.push([v.lat, v.lon]);
  }

  if (pts.length === 1) {
    map.flyTo(pts[0], CITY_ZOOM, { duration: 0.7 });
  } else if (pts.length > 1) {
    map.flyToBounds(L.latLngBounds(pts), { padding: [60, 60], duration: 0.7, maxZoom: 14 });
  }
}

function renderTimeline(yearFilter) {
  if (yearFilter !== undefined) activeYearFilter = yearFilter;

  const years = [];
  const seenY = new Set();
  for (const v of vacations) {
    const y = (v.startDate || "").slice(0, 4);
    if (y && !seenY.has(y)) { seenY.add(y); years.push(y); }
  }

  const filtered = activeYearFilter
    ? vacations.filter(function (v) { return (v.startDate || "").startsWith(activeYearFilter); })
    : vacations;

  const grouped = {};
  for (const v of filtered) {
    const y = (v.startDate || "?").slice(0, 4);
    if (!grouped[y]) grouped[y] = [];
    grouped[y].push(v);
  }
  const groupYears = Object.keys(grouped).sort().reverse();

  const filtersDiv = document.createElement("div");
  filtersDiv.className = "tl-filters";

  const allChip = document.createElement("button");
  allChip.className = "tl-filter-chip" + (!activeYearFilter ? " active" : "");
  allChip.textContent = "Alle reizen";
  allChip.addEventListener("click", function () { renderTimeline(null); });
  filtersDiv.appendChild(allChip);

  for (const y of years) {
    const chip = document.createElement("button");
    chip.className = "tl-filter-chip" + (activeYearFilter === y ? " active" : "");
    chip.textContent = y;
    chip.addEventListener("click", function () { renderTimeline(y); });
    filtersDiv.appendChild(chip);
  }

  const wrap = document.createElement("div");
  wrap.className = "timeline-line";

  let idx = 0;
  for (const y of groupYears) {
    const yearLabel = document.createElement("div");
    yearLabel.className = "tl-year";
    yearLabel.textContent = y;
    wrap.appendChild(yearLabel);
    for (const v of grouped[y]) {
      wrap.appendChild(buildTlItem(v, idx));
      idx++;
    }
  }

  if (!filtered.length) {
    const msg = document.createElement("div");
    msg.className = "notice";
    msg.style.marginTop = "24px";
    msg.textContent = "Geen reizen gevonden.";
    wrap.appendChild(msg);
  }

  els.timeline.innerHTML = "";
  els.timeline.appendChild(filtersDiv);
  els.timeline.appendChild(wrap);
}

function buildTlItem(v, idx) {
  const item = document.createElement("div");
  item.className = "tl-item";
  item.tabIndex = 0;
  item.setAttribute("role", "button");
  item.style.animationDelay = (idx * 0.05) + "s";

  const routeHtml = (v.route && v.route.length > 1)
    ? '<div class="tl-route">Route: ' +
        v.route.map(function (p) { return escapeHtml(p.name || ""); }).join(" → ") +
      "</div>"
    : "";

  const photoCount = (v.pictures || []).length;
  const badgeHtml = '<span class="tl-badge' + (photoCount > 0 ? " has-photos" : "") + '">' +
    (photoCount > 0 ? "📷 " + photoCount : "Geen foto's") + "</span>";

  item.innerHTML =
    "<h3>" + flagImg(v.country, "tl-flag-img") + " " + escapeHtml(v.title) + badgeHtml + "</h3>" +
    '<div class="tl-meta">' + escapeHtml(formatDateRange(v.startDate, v.endDate)) + "</div>" +
    "<p>" + escapeHtml(v.description || "") + "</p>" +
    routeHtml;

  item.addEventListener("click", function () { openModal(v.id); });
  item.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openModal(v.id); }
  });

  return item;
}

function openModal(id) {
  const v = vacations.find(function (x) { return x.id === id; });
  if (!v) return;
  currentModalId = id;

  els.modalTitle.innerHTML = flagImg(v.country, "modal-flag-img") + " " + escapeHtml(v.title);
  els.modalMeta.textContent = formatDateRange(v.startDate, v.endDate) + " " + (v.location || "");

  let descHtml = escapeHtml(v.description || "");
  if (v.route && v.route.length > 1) {
    const r = v.route.map(function (p) { return escapeHtml(p.name || ""); }).join(" → ");
    descHtml += '<div class="modal-route"><b>Route:</b> ' + r + "</div>";
  }
  els.modalDesc.innerHTML = descHtml;

  els.modalGallery.innerHTML = "";
  const pics = v.pictures || [];
  if (!pics.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "Nog geen foto's voor deze reis.";
    els.modalGallery.appendChild(empty);
  } else {
    const srcs = pics.map(function (p) { return joinPath(v.folder, p); });
    const alts = pics.map(function (p) { return v.title + " - " + p; });
    for (let i = 0; i < pics.length; i++) {
      const img = document.createElement("img");
      img.src = srcs[i];
      img.alt = alts[i];
      img.loading = "lazy";
      (function (idx) {
        img.addEventListener("click", function () { openLightbox(srcs, alts, idx); });
      })(i);
      img.addEventListener("error", function () { img.style.display = "none"; });
      els.modalGallery.appendChild(img);
    }
  }

  els.modal.classList.add("open");
}

function closeModal() { els.modal.classList.remove("open"); }

function openLightbox(srcs, alts, index) {
  lightboxPhotos = srcs;
  lightboxAlts   = alts;
  lightboxIndex  = index;
  showLightboxFrame();
  els.lightbox.classList.add("open");
}

function navigateLightbox(dir) {
  if (!lightboxPhotos.length) return;
  lightboxIndex = (lightboxIndex + dir + lightboxPhotos.length) % lightboxPhotos.length;
  showLightboxFrame();
}

function showLightboxFrame() {
  els.lightboxImg.src = lightboxPhotos[lightboxIndex];
  els.lightboxImg.alt = lightboxAlts[lightboxIndex] || "";
  const total = lightboxPhotos.length;
  els.lbCounter.textContent = total > 1 ? (lightboxIndex + 1) + " / " + total : "";
  els.lbPrev.classList.toggle("hidden", total <= 1);
  els.lbNext.classList.toggle("hidden", total <= 1);
}

function joinPath(folder, file) {
  if (!folder) return file;
  let f = folder;
  while (f.endsWith("/")) f = f.slice(0, -1);
  let g = String(file);
  while (g.startsWith("/")) g = g.slice(1);
  return f + "/" + g;
}

function formatDateRange(start, end) {
  if (!start && !end) return "";
  const s = start ? new Date(start) : null;
  const e = end ? new Date(end) : null;
  const opts = { year: "numeric", month: "short", day: "numeric" };
  const locale = "nl-NL";
  if (s && e) {
    if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) {
      const month = s.toLocaleDateString(locale, { month: "short" });
      return s.getDate() + "-" + e.getDate() + " " + month + " " + s.getFullYear();
    }
    return s.toLocaleDateString(locale, opts) + " - " + e.toLocaleDateString(locale, opts);
  }
  return (s || e).toLocaleDateString(locale, opts);
}

function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .split("&").join("&amp;")
    .split("<").join("&lt;")
    .split(">").join("&gt;")
    .split('"').join("&quot;")
    .split("'").join("&#039;");
}

function escapeAttr(str) { return escapeHtml(str); }

function showLoadError(err) {
  const main = document.querySelector("main");
  const msg = (err && err.message) ? err.message : String(err);
  main.innerHTML =
    [
      '<div class="notice">',
        "<h2>Reisdata kon niet geladen worden</h2>",
        "<p>Foutmelding: " + escapeHtml(msg) + "</p>",
      "</div>"
    ].join("");
}
