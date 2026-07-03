// app.js — Photo marker + bottom sheet edition

var ISO2_TO_NUM = {
  "AF":4,"AL":8,"DZ":12,"AD":20,"AO":24,"AG":28,"AR":32,"AM":51,
  "AU":36,"AT":40,"AZ":31,"BS":44,"BH":48,"BD":50,"BB":52,"BY":112,
  "BE":56,"BZ":84,"BJ":204,"BT":64,"BO":68,"BA":70,"BW":72,"BR":76,
  "BN":96,"BG":100,"BF":854,"BI":108,"KH":116,"CM":120,"CA":124,
  "CF":140,"TD":148,"CL":152,"CN":156,"CO":170,"CR":188,"HR":191,
  "CU":192,"CY":196,"CZ":203,"DK":208,"DJ":262,"DO":214,"EC":218,
  "EG":818,"SV":222,"GQ":226,"ER":232,"EE":233,"ET":231,"FJ":242,
  "FI":246,"FR":250,"GA":266,"GM":270,"GE":268,"DE":276,"GH":288,
  "GR":300,"GT":320,"GN":324,"GW":624,"GY":328,"HT":332,"HN":340,
  "HU":348,"IS":352,"IN":356,"ID":360,"IR":364,"IQ":368,"IE":372,
  "IL":376,"IT":380,"JM":388,"JP":392,"JO":400,"KZ":398,"KE":404,
  "KI":296,"KW":414,"KG":417,"LA":418,"LV":428,"LB":422,"LS":426,
  "LR":430,"LY":434,"LI":438,"LT":440,"LU":442,"MG":450,"MW":454,
  "MY":458,"MV":462,"ML":466,"MT":470,"MR":478,"MU":480,"MX":484,
  "MD":498,"MC":492,"MN":496,"ME":499,"MA":504,"MZ":508,"MM":104,
  "NA":516,"NP":524,"NL":528,"NZ":554,"NI":558,"NE":562,"NG":566,
  "MK":807,"NO":578,"OM":512,"PK":586,"PA":591,"PG":598,"PY":600,
  "PE":604,"PH":608,"PL":616,"PT":620,"QA":634,"RO":642,"RU":643,
  "RW":646,"SM":674,"ST":678,"SA":682,"SN":686,"RS":688,"SC":690,
  "SL":694,"SG":702,"SK":703,"SI":705,"SO":706,"ZA":710,"SS":728,
  "ES":724,"LK":144,"SD":729,"SR":740,"SZ":748,"SE":752,"CH":756,
  "SY":760,"TJ":762,"TZ":834,"TH":764,"TG":768,"TO":776,"TT":780,
  "TN":788,"TR":792,"TM":795,"UG":800,"UA":804,"AE":784,"GB":826,
  "US":840,"UY":858,"UZ":860,"VU":548,"VE":862,"VN":704,"YE":887,
  "ZM":894,"ZW":716,"XK":383,"PS":275,"CV":132,"KP":408,"KR":410
};

var LAND_NAMEN = {
  4:"Afghanistan",8:"Albanië",12:"Algerije",20:"Andorra",24:"Angola",
  32:"Argentinië",36:"Australië",40:"Oostenrijk",50:"Bangladesh",
  56:"België",64:"Bhutan",68:"Bolivia",70:"Bosnië-Herzegovina",
  76:"Brazilië",96:"Brunei",100:"Bulgarije",116:"Cambodja",124:"Canada",
  152:"Chili",156:"China",170:"Colombia",188:"Costa Rica",191:"Kroatië",
  192:"Cuba",196:"Cyprus",203:"Tsjechië",208:"Denemarken",218:"Ecuador",
  818:"Egypte",231:"Ethiopië",246:"Finland",250:"Frankrijk",276:"Duitsland",
  288:"Ghana",300:"Griekenland",320:"Guatemala",332:"Haïti",340:"Honduras",
  348:"Hongarije",352:"IJsland",356:"India",360:"Indonesië",364:"Iran",
  368:"Irak",372:"Ierland",376:"Israël",380:"Italië",392:"Japan",
  400:"Jordanië",404:"Kenia",408:"Noord-Korea",410:"Zuid-Korea",
  414:"Koeweit",428:"Letland",422:"Libanon",434:"Libië",438:"Liechtenstein",
  440:"Litouwen",442:"Luxemburg",450:"Madagaskar",466:"Mali",470:"Malta",
  484:"Mexico",498:"Moldavië",492:"Monaco",496:"Mongolië",499:"Montenegro",
  504:"Marokko",508:"Mozambique",104:"Myanmar",516:"Namibië",524:"Nepal",
  528:"Nederland",554:"Nieuw-Zeeland",562:"Niger",566:"Nigeria",
  807:"Noord-Macedonië",578:"Noorwegen",512:"Oman",586:"Pakistan",
  591:"Panama",598:"Papoea-Nieuw-Guinea",600:"Paraguay",604:"Peru",
  608:"Filipijnen",616:"Polen",620:"Portugal",634:"Qatar",642:"Roemenië",
  643:"Rusland",682:"Saoedi-Arabië",686:"Senegal",688:"Servië",
  694:"Sierra Leone",702:"Singapore",703:"Slowakije",705:"Slovenië",
  706:"Somalië",710:"Zuid-Afrika",728:"Zuid-Soedan",724:"Spanje",
  144:"Sri Lanka",729:"Soedan",740:"Suriname",752:"Zweden",756:"Zwitserland",
  760:"Syrië",762:"Tadzjikistan",834:"Tanzania",764:"Thailand",788:"Tunesië",
  792:"Turkije",800:"Oeganda",804:"Oekraïne",784:"Ver. Arabische Emiraten",
  826:"Verenigd Koninkrijk",840:"Verenigde Staten",858:"Uruguay",
  860:"Oezbekistan",862:"Venezuela",704:"Vietnam",887:"Jemen",894:"Zambia",
  716:"Zimbabwe",383:"Kosovo",275:"Palestina",51:"Armenië",31:"Azerbeidzjan",
  112:"Belarus",204:"Benin",854:"Burkina Faso",140:"Centraal-Afrik. Rep.",
  148:"Tsjaad",262:"Djibouti",214:"Dominicaanse Rep.",222:"El Salvador",
  232:"Eritrea",233:"Estland",242:"Fiji",266:"Gabon",270:"Gambia",
  268:"Georgië",624:"Guinee-Bissau",324:"Guinee",328:"Guyana",296:"Kiribati",
  417:"Kirgizstan",418:"Laos",426:"Lesotho",430:"Liberia",454:"Malawi",
  458:"Maleisië",462:"Malediven",478:"Mauritanië",480:"Mauritius",
  646:"Rwanda",674:"San Marino",678:"São Tomé",690:"Seychellen",
  548:"Vanuatu",776:"Tonga",780:"Trinidad en Tobago",795:"Turkmenistan",
  132:"Kaapverdië",120:"Kameroen",178:"Congo",180:"Congo (DRC)",
  384:"Ivoorkust",226:"Equatoriaal-Guinea"
};

var CONTINENT_BOUNDS = {
  "Europa":        [[-12,34],[42,72]],
  "Azië":          [[25,-12],[180,78]],
  "Afrika":        [[-20,-36],[55,38]],
  "Noord-Amerika": [[-170,7],[-52,72]],
  "Zuid-Amerika":  [[-82,-56],[-34,13]],
  "Oceanië":       [[110,-48],[180,22]]
};

var CONTINENT_COUNTRIES = {
  "Europa":        ["AL","AD","AT","BY","BE","BA","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IS","IE","IT","XK","LV","LI","LT","LU","MT","MD","MC","ME","NL","MK","NO","PL","PT","RO","RU","SM","RS","SK","SI","ES","SE","CH","UA","GB"],
  "Azië":          ["AF","AM","AZ","BH","BD","BT","BN","KH","CN","GE","IN","ID","IR","IQ","IL","JP","JO","KZ","KW","KG","LA","LB","MY","MV","MN","MM","NP","KP","KR","OM","PK","PS","PH","QA","SA","SG","LK","SY","TJ","TH","TR","TM","AE","UZ","VN","YE"],
  "Afrika":        ["DZ","AO","BJ","BW","BF","BI","CM","CV","CF","TD","KM","CG","CD","CI","DJ","EG","GQ","ER","ET","GA","GM","GH","GN","GW","KE","LS","LR","LY","MG","MW","ML","MR","MU","MA","MZ","NA","NE","NG","RW","ST","SN","SC","SL","SO","ZA","SS","SD","SZ","TZ","TG","TN","UG","ZM","ZW"],
  "Noord-Amerika": ["AG","BS","BB","BZ","CA","CR","CU","DM","DO","SV","GD","GT","HT","HN","JM","MX","NI","PA","KN","LC","VC","TT","US"],
  "Zuid-Amerika":  ["AR","BO","BR","CL","CO","EC","GY","PY","PE","SR","UY","VE"],
  "Oceanië":       ["AU","FJ","KI","MH","FM","NR","NZ","PW","PG","WS","SB","TO","TV","VU"]
};

var MAINLAND_BOUNDS = {
  250:{minLon:-6,maxLon:13,minLat:41,maxLat:52},
  528:{minLon:2,maxLon:9,minLat:50,maxLat:54},
  208:{minLon:6,maxLon:16,minLat:54,maxLat:58},
  826:{minLon:-10,maxLon:3,minLat:49,maxLat:61},
  724:{minLon:-9,maxLon:5,minLat:35,maxLat:44},
};

var worldData = null, worldProjection = null, worldZoom = null, worldSvg = null;

const els = {
  viewMap:          document.getElementById("view-map"),
  viewTimeline:     document.getElementById("view-timeline"),
  viewWorld:        document.getElementById("view-world"),
  btnMap:           document.getElementById("btn-map"),
  btnTimeline:      document.getElementById("btn-timeline"),
  btnWorld:         document.getElementById("btn-world"),
  reizenBtn:        document.getElementById("reizen-btn"),
  landenBtn:        document.getElementById("landen-btn"),
  timeline:         document.getElementById("timeline"),
  worldVisitedLabel:document.getElementById("world-visited-label"),
  worldTooltip:     document.getElementById("world-tooltip"),
  modal:            document.getElementById("modal"),
  modalTitle:       document.getElementById("modal-title"),
  modalMeta:        document.getElementById("modal-meta"),
  modalDesc:        document.getElementById("modal-desc"),
  modalGallery:     document.getElementById("modal-gallery"),
  modalClose:       document.querySelector("#modal .close"),
  modalMapBtn:      document.getElementById("modal-map-btn"),
  lightbox:         document.getElementById("lightbox"),
  lightboxImg:      document.getElementById("lightbox-img"),
  lightboxVideo:    document.getElementById("lightbox-video"),
  lbPrev:           document.getElementById("lb-prev"),
  lbNext:           document.getElementById("lb-next"),
  lbCounter:        document.getElementById("lb-counter"),
  tripSheet:        document.getElementById("trip-sheet"),
  sheetBackdrop:    document.getElementById("sheet-backdrop"),
  sheetPhotoWrap:   document.getElementById("sheet-photo-wrap"),
  sheetFlag:        document.getElementById("sheet-flag"),
  sheetLocation:    document.getElementById("sheet-location"),
  sheetTitle:       document.getElementById("sheet-title"),
  sheetDates:       document.getElementById("sheet-dates"),
  sheetDesc:        document.getElementById("sheet-desc"),
  sheetRoute:       document.getElementById("sheet-route"),
  sheetClose:       document.getElementById("sheet-close"),
  sheetDetails:     document.getElementById("sheet-details"),
  sheetPhotoCount:  document.getElementById("sheet-photo-count"),
};

let vacations      = [];
let map            = null;
let routesLayer    = null;
let lightboxPhotos = [], lightboxAlts = [], lightboxIndex = 0;
let currentModalId = null;
let activeYearFilter = null;
let sheetVacationId  = null;
let navVacations   = [];   // vacations with coords, sorted
let navIndex       = -1;   // index of currently open trip in navVacations
const markersById  = new Map();
const CITY_ZOOM    = 12;

(function init() {
  els.btnMap.addEventListener("click",      () => setView("map"));
  els.btnTimeline.addEventListener("click", () => setView("timeline"));
  els.btnWorld.addEventListener("click",    () => setView("world"));

  els.modalClose.addEventListener("click", closeModal);
  els.modal.addEventListener("click", e => { if (e.target === els.modal) closeModal(); });
  els.modalMapBtn.addEventListener("click", () => {
    if (!currentModalId) return;
    const v = vacations.find(x => x.id === currentModalId);
    closeModal();
    setView("map");
    if (v) openSheet(v);
  });

  els.sheetClose.addEventListener("click", closeSheet);
  els.sheetBackdrop.addEventListener("click", closeSheet);
  els.sheetDetails.addEventListener("click", () => {
    if (sheetVacationId) openModal(sheetVacationId);
  });

  // Swipe on sheet: left = older trip, right = newer trip
  let sheetTouchStartX = 0, sheetTouchStartY = 0;
  els.tripSheet.addEventListener("touchstart", e => {
    sheetTouchStartX = e.changedTouches[0].clientX;
    sheetTouchStartY = e.changedTouches[0].clientY;
  }, { passive: true });
  els.tripSheet.addEventListener("touchend", e => {
    if (!els.tripSheet.classList.contains("open")) return;
    const dx = e.changedTouches[0].clientX - sheetTouchStartX;
    const dy = e.changedTouches[0].clientY - sheetTouchStartY;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      navigateTrip(dx < 0 ? 1 : -1);
    }
  }, { passive: true });

  els.lightbox.addEventListener("click", e => { if (e.target === els.lightbox) closeLightbox(); });
  els.lbPrev.addEventListener("click", e => { e.stopPropagation(); navigateLightbox(-1); });
  els.lbNext.addEventListener("click", e => { e.stopPropagation(); navigateLightbox(1); });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") { closeModal(); closeLightbox(); closeSheet(); }
    if (els.lightbox.classList.contains("open")) {
      if (e.key === "ArrowLeft")  { e.preventDefault(); navigateLightbox(-1); }
      if (e.key === "ArrowRight") { e.preventDefault(); navigateLightbox(1); }
    }
    if (!els.lightbox.classList.contains("open") && !els.modal.classList.contains("open")) {
      if (e.key === "ArrowLeft")  navigateTrip(-1);
      if (e.key === "ArrowRight") navigateTrip(1);
    }
  });

  let touchStartX = 0;
  els.lightbox.addEventListener("touchstart", e => { touchStartX = e.changedTouches[0].clientX; }, { passive: true });
  els.lightbox.addEventListener("touchend",   e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 40) navigateLightbox(dx < 0 ? 1 : -1);
  }, { passive: true });

  if (!window.VACATIONS || !Array.isArray(window.VACATIONS.vacations)) {
    showLoadError(new Error("vacations.js heeft window.VACATIONS.vacations niet gezet"));
    return;
  }

  vacations = window.VACATIONS.vacations.slice().sort(
    (a, b) => (b.startDate || "").localeCompare(a.startDate || "")
  );

  renderStats();
  renderMap();
  renderTimeline();
})();

// ── Stats ──────────────────────────────────────────────────────────────────────

function renderStats() {
  const countrySet = new Set();
  vacations.forEach(v => {
    const codes = Array.isArray(v.countries) ? v.countries : (v.country ? [v.country] : []);
    codes.forEach(c => countrySet.add(c.toUpperCase()));
  });
  els.reizenBtn.textContent = vacations.length + " reizen";
  els.reizenBtn.addEventListener("click", () => setView("timeline"));
  els.landenBtn.textContent = countrySet.size + " landen";
  els.landenBtn.addEventListener("click", () => setView("world"));
}

// ── View switching ─────────────────────────────────────────────────────────────

function setView(view) {
  ["map","timeline","world"].forEach(v => {
    const isActive = v === view;
    document.getElementById("view-" + v).classList.toggle("active", isActive);
    document.getElementById("btn-" + v).classList.toggle("active", isActive);
  });
  if (view === "map" && map) setTimeout(() => map.invalidateSize(), 50);
  if (view === "world") initWorldMap();
  if (view !== "map") closeSheet();
}

// ── Map ────────────────────────────────────────────────────────────────────────

function renderMap() {
  const dark = L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    { attribution: "© OpenStreetMap © CARTO", maxZoom: 19, subdomains: "abcd" }
  );
  const satellite = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    { attribution: "Tiles © Esri", maxZoom: 19 }
  );

  map = L.map("map", { layers: [dark], worldCopyJump: true }).setView([20, 0], 2);
  L.control.layers({ "Donker": dark, "Satelliet": satellite }, null, { position: "topright", collapsed: true }).addTo(map);

  routesLayer = L.layerGroup().addTo(map);

  navVacations = vacations.filter(v => typeof v.lat === "number" && typeof v.lon === "number");
  const mostRecentId = navVacations[0]?.id;
  const bounds = [];

  navVacations.forEach(v => {
    const isRecent = v.id === mostRecentId;
    const marker   = L.marker([v.lat, v.lon], { icon: makePhotoIcon(v, isRecent) });

    marker.on("click", () => {
      setActiveMarker(v.id);
      showRouteFor(v);
      openSheet(v);
    });

    marker.addTo(map);
    markersById.set(v.id, marker);
    bounds.push([v.lat, v.lon]);
  });

  map.on("click", e => {
    if (e.originalEvent?.target?.closest(".leaflet-marker-icon")) return;
    closeSheet();
    clearRoute();
    markersById.forEach(m => m.getElement()?.querySelector(".pm")?.classList.remove("active"));
  });

  // Prev/next nav buttons
  addMapNavControls();

  if (bounds.length) map.fitBounds(bounds, { padding: [60, 60], maxZoom: 6 });
}

function setActiveMarker(id) {
  markersById.forEach((m, mid) => {
    m.getElement()?.querySelector(".pm")?.classList.toggle("active", mid === id);
  });
}

function addMapNavControls() {
  const wrap = document.createElement("div");
  wrap.className = "map-nav-wrap";
  wrap.innerHTML =
    `<button class="map-nav-btn" id="map-nav-prev" title="Vorige reis">&#8249;</button>` +
    `<button class="map-nav-btn" id="map-nav-next" title="Volgende reis">&#8250;</button>`;
  document.getElementById("view-map").appendChild(wrap);
  document.getElementById("map-nav-prev").addEventListener("click", () => navigateTrip(-1));
  document.getElementById("map-nav-next").addEventListener("click", () => navigateTrip(1));
}

function navigateTrip(dir) {
  if (!navVacations.length) return;
  if (navIndex < 0) navIndex = 0;
  else navIndex = (navIndex + dir + navVacations.length) % navVacations.length;
  const v = navVacations[navIndex];
  setActiveMarker(v.id);
  showRouteFor(v);
  openSheet(v);
}

function makePhotoIcon(v, isRecent) {
  const hasPic  = v.pictures?.length && v.folder;
  const imgSrc  = hasPic ? joinPath(v.folder, v.pictures[0]) : null;
  const flagSrc = v.country ? "https://flagcdn.com/" + v.country.toLowerCase() + ".svg" : null;

  let inner;
  if (imgSrc) {
    const fallback = flagSrc
      ? `<img class="pm-flag" src="${flagSrc}" alt="" style="display:none" />`
      : "";
    inner = `<img src="${imgSrc}" alt="" onerror="this.style.display='none';var s=this.nextElementSibling;if(s)s.style.display=''" />${fallback}`;
  } else if (flagSrc) {
    inner = `<img class="pm-flag" src="${flagSrc}" alt="" />`;
  } else {
    inner = "";
  }

  const pulseClass = isRecent ? " pulse" : "";

  return L.divIcon({
    className: "pm-wrap",
    html: `<div class="pm${pulseClass}">${inner}</div>`,
    iconSize:    [42, 42],
    iconAnchor:  [21, 21],
    popupAnchor: [0, -24],
  });
}

// ── Bottom sheet ───────────────────────────────────────────────────────────────

function openSheet(v) {
  sheetVacationId = v.id;
  navIndex = navVacations.findIndex(x => x.id === v.id);

  // Photo / flag hero
  els.sheetPhotoWrap.innerHTML = "";
  const pics = v.pictures || [];
  if (pics.length && v.folder) {
    const img = document.createElement("img");
    img.className = "sheet-photo";
    img.src = joinPath(v.folder, pics[0]);
    img.alt = v.title;
    const flagSrcFallback = v.country
      ? "https://flagcdn.com/" + v.country.toLowerCase() + ".svg" : null;
    img.addEventListener("error", () => {
      img.remove();
      if (flagSrcFallback) showSheetFlagHero(flagSrcFallback);
      else els.sheetPhotoWrap.style.display = "none";
    });
    els.sheetPhotoWrap.appendChild(img);
    const grad = document.createElement("div");
    grad.className = "sheet-photo-gradient";
    els.sheetPhotoWrap.appendChild(grad);
    els.sheetPhotoWrap.style.display = "";
  } else if (v.country) {
    showSheetFlagHero("https://flagcdn.com/" + v.country.toLowerCase() + ".svg");
  } else {
    els.sheetPhotoWrap.style.display = "none";
  }

  // Flag
  const flagSrc = v.country ? "https://flagcdn.com/" + v.country.toLowerCase() + ".svg" : "";
  els.sheetFlag.src     = flagSrc;
  els.sheetFlag.style.display = flagSrc ? "" : "none";
  els.sheetLocation.textContent = (v.location || v.title || "").toUpperCase();

  // Text
  els.sheetTitle.textContent  = v.title || "";
  els.sheetDates.textContent  = formatDateRange(v.startDate, v.endDate);
  els.sheetDesc.textContent   = v.description || "";

  // Route
  if (v.route?.length > 1) {
    const stops = v.route.map(p => p.name || "").filter(Boolean);
    els.sheetRoute.innerHTML = `<span>Route</span>  ${escapeHtml(stops.join(" → "))}`;
    els.sheetRoute.style.display = "";
  } else {
    els.sheetRoute.style.display = "none";
  }

  // Photo count
  els.sheetPhotoCount.textContent = pics.length
    ? pics.length + (pics.length === 1 ? " foto" : " foto's")
    : "";

  // Zoom map + route
  zoomToVacation(v);
  showRouteFor(v);

  els.tripSheet.classList.add("open");
  els.sheetBackdrop.classList.add("visible");
}

function showSheetFlagHero(src) {
  const wrap = els.sheetPhotoWrap;
  wrap.innerHTML = "";
  const container = document.createElement("div");
  container.className = "sheet-flag-hero";
  const img = document.createElement("img");
  img.src = src; img.alt = "";
  img.addEventListener("error", () => { wrap.style.display = "none"; });
  container.appendChild(img);
  wrap.appendChild(container);
  wrap.style.display = "";
}

function closeSheet() {
  els.tripSheet.classList.remove("open");
  els.sheetBackdrop.classList.remove("visible");
  sheetVacationId = null;
  clearRoute();
}

// ── Routes ─────────────────────────────────────────────────────────────────────

function showRouteFor(v) {
  clearRoute();
  if (!v.route?.length || v.route.length < 2) return;

  const latlngs = v.route
    .filter(p => typeof p.lat === "number" && typeof p.lon === "number")
    .map(p => [p.lat, p.lon]);
  if (latlngs.length < 2) return;

  L.polyline(latlngs, { color: "#c8a060", weight: 2.5, opacity: .8, dashArray: "6,8" }).addTo(routesLayer);

  v.route.forEach(pt => {
    if (typeof pt.lat !== "number") return;
    L.circleMarker([pt.lat, pt.lon], {
      radius: 4, color: "#e8c890", weight: 1.5, fillColor: "#c8a060", fillOpacity: 1,
    })
    .bindTooltip(escapeHtml(pt.name || ""), { direction: "top", offset: [0,-6], className: "route-tooltip" })
    .addTo(routesLayer);
  });
}

function clearRoute() { routesLayer?.clearLayers(); }

function zoomToVacation(v) {
  if (!map) return;
  const pts = [];
  v.route?.forEach(p => { if (typeof p.lat === "number") pts.push([p.lat, p.lon]); });
  if (!pts.length && typeof v.lat === "number") pts.push([v.lat, v.lon]);
  if (pts.length === 1)  map.flyTo(pts[0], CITY_ZOOM, { duration: 0.8 });
  else if (pts.length > 1) map.flyToBounds(L.latLngBounds(pts), { padding: [80,80], duration: 0.8, maxZoom: 14 });
}

// ── Timeline ───────────────────────────────────────────────────────────────────

function renderTimeline(yearFilter) {
  if (yearFilter !== undefined) activeYearFilter = yearFilter;

  const years = [];
  const seenY = new Set();
  vacations.forEach(v => {
    const y = (v.startDate || "").slice(0, 4);
    if (y && !seenY.has(y)) { seenY.add(y); years.push(y); }
  });

  const filtered = activeYearFilter
    ? vacations.filter(v => (v.startDate || "").startsWith(activeYearFilter))
    : vacations;

  const grouped = {};
  filtered.forEach(v => {
    const y = (v.startDate || "?").slice(0, 4);
    if (!grouped[y]) grouped[y] = [];
    grouped[y].push(v);
  });
  const groupYears = Object.keys(grouped).sort().reverse();

  const filtersDiv = document.createElement("div");
  filtersDiv.className = "tl-filters";

  const allChip = document.createElement("button");
  allChip.className = "tl-filter-chip" + (!activeYearFilter ? " active" : "");
  allChip.textContent = "Alle reizen";
  allChip.addEventListener("click", () => renderTimeline(null));
  filtersDiv.appendChild(allChip);

  years.forEach(y => {
    const chip = document.createElement("button");
    chip.className = "tl-filter-chip" + (activeYearFilter === y ? " active" : "");
    chip.textContent = y;
    chip.addEventListener("click", () => renderTimeline(y));
    filtersDiv.appendChild(chip);
  });

  const wrap = document.createElement("div");
  wrap.className = "timeline-line";
  let idx = 0;

  groupYears.forEach(y => {
    const lbl = document.createElement("div");
    lbl.className = "tl-year";
    lbl.textContent = y;
    wrap.appendChild(lbl);
    grouped[y].forEach(v => { wrap.appendChild(buildTlItem(v, idx++)); });
  });

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
  item.style.animationDelay = (idx * 0.04) + "s";

  const route = v.route?.length > 1
    ? `<div class="tl-route">Route: ${v.route.map(p => escapeHtml(p.name || "")).join(" → ")}</div>` : "";
  const cnt   = (v.pictures || []).length;
  const badge = `<span class="tl-badge${cnt ? " has-photos" : ""}">${cnt ? "📷 " + cnt : "Geen foto's"}</span>`;
  const flag  = flagImg(v.country, "tl-flag-img");

  item.innerHTML =
    `<h3>${flag} ${escapeHtml(v.title)}${badge}</h3>` +
    `<div class="tl-meta">${escapeHtml(formatDateRange(v.startDate, v.endDate))}</div>` +
    `<p>${escapeHtml(v.description || "")}</p>${route}`;

  item.addEventListener("click", () => openModal(v.id));
  item.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openModal(v.id); } });
  return item;
}

// ── Modal ──────────────────────────────────────────────────────────────────────

function openModal(id) {
  const v = vacations.find(x => x.id === id);
  if (!v) return;
  currentModalId = id;

  els.modalTitle.innerHTML = flagImg(v.country, "modal-flag-img") + " " + escapeHtml(v.title);
  els.modalMeta.textContent = formatDateRange(v.startDate, v.endDate) + "  " + (v.location || "");

  let descHtml = escapeHtml(v.description || "");
  if (v.route?.length > 1) {
    const r = v.route.map(p => escapeHtml(p.name || "")).join(" → ");
    descHtml += `<div class="modal-route"><b>Route:</b> ${r}</div>`;
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
    const srcs = pics.map(p => joinPath(v.folder, p));
    const alts = pics.map(p => v.title + " - " + p);
    srcs.forEach((src, i) => {
      if (src.endsWith(".mp4")) {
        const vid = document.createElement("video");
        vid.src = src; vid.controls = true;
        vid.addEventListener("error", () => vid.style.display = "none");
        els.modalGallery.appendChild(vid);
      } else {
        const img = document.createElement("img");
        img.src = src; img.alt = alts[i]; img.loading = "lazy";
        img.addEventListener("click", () => openLightbox(srcs, alts, i));
        img.addEventListener("error", () => img.style.display = "none");
        els.modalGallery.appendChild(img);
      }
    });
  }

  els.modal.classList.add("open");
}

function closeModal() { els.modal.classList.remove("open"); }

// ── Lightbox ───────────────────────────────────────────────────────────────────

function openLightbox(srcs, alts, index) {
  lightboxPhotos = srcs; lightboxAlts = alts; lightboxIndex = index;
  showLightboxFrame();
  els.lightbox.classList.add("open");
}

function navigateLightbox(dir) {
  if (!lightboxPhotos.length) return;
  lightboxIndex = (lightboxIndex + dir + lightboxPhotos.length) % lightboxPhotos.length;
  showLightboxFrame();
}

function showLightboxFrame() {
  const src   = lightboxPhotos[lightboxIndex];
  const isVid = src.endsWith(".mp4");
  if (isVid) {
    els.lightboxImg.style.display = "none";
    els.lightboxVideo.style.display = ""; els.lightboxVideo.src = src;
  } else {
    els.lightboxVideo.pause(); els.lightboxVideo.style.display = "none";
    els.lightboxImg.style.display = ""; els.lightboxImg.src = src;
    els.lightboxImg.alt = lightboxAlts[lightboxIndex] || "";
  }
  const total = lightboxPhotos.length;
  els.lbCounter.textContent = total > 1 ? (lightboxIndex + 1) + " / " + total : "";
  els.lbPrev.classList.toggle("hidden", total <= 1);
  els.lbNext.classList.toggle("hidden", total <= 1);
}

function closeLightbox() { els.lightbox.classList.remove("open"); els.lightboxVideo.pause(); }

// ── World map ──────────────────────────────────────────────────────────────────

function getVisitedNums() {
  const set = new Set();
  vacations.forEach(v => {
    const codes = Array.isArray(v.countries) ? v.countries : (v.country ? [v.country] : []);
    codes.forEach(c => { const n = ISO2_TO_NUM[c.toUpperCase()]; if (n) set.add(n); });
  });
  return set;
}

function initWorldMap() {
  if (worldData) { drawWorldMap(worldData); return; }
  fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
    .then(r => r.json())
    .then(data => { worldData = data; drawWorldMap(data); })
    .catch(err => console.warn("Wereldkaart kon niet laden:", err));
}

function drawWorldMap(world) {
  const visited = getVisitedNums();
  if (els.worldVisitedLabel) els.worldVisitedLabel.textContent = visited.size + " bezocht";

  const W = 960, H = 500;
  const projection = d3.geoNaturalEarth1().scale(153).translate([W/2, H/2]);
  const pathGen    = d3.geoPath().projection(projection);
  const countries  = topojson.feature(world, world.objects.countries);
  const borders    = topojson.mesh(world, world.objects.countries, (a,b) => a !== b);

  const svg = d3.select("#world-svg")
    .attr("viewBox", `0 0 ${W} ${H}`)
    .attr("preserveAspectRatio", "xMidYMid meet");
  svg.selectAll("*").remove();

  const g = svg.append("g");
  worldSvg = svg; worldProjection = projection;
  worldZoom = d3.zoom().scaleExtent([1,8]).translateExtent([[0,0],[W,H]])
    .on("zoom", e => g.attr("transform", e.transform));
  svg.call(worldZoom);

  g.append("path").datum({type:"Sphere"}).attr("d", pathGen).attr("fill","#07090f");
  g.append("path").datum(d3.geoGraticule()()).attr("d", pathGen)
    .attr("fill","none").attr("stroke","#0f1520").attr("stroke-width",.35);

  const VISITED   = "#c8a060";
  const UNVISITED = "#1a1c24";

  function centroid(ring) {
    let lx=0,ly=0; ring.forEach(([x,y])=>{lx+=x;ly+=y;});
    return [lx/ring.length, ly/ring.length];
  }

  function addPath(geom, id, isVis) {
    const name = LAND_NAMEN[id] || "";
    g.append("path")
      .datum({type:"Feature", geometry:geom})
      .attr("class", "world-country" + (isVis ? " visited" : ""))
      .attr("d", pathGen)
      .attr("fill", isVis ? VISITED : UNVISITED)
      .attr("stroke","none")
      .on("mousemove", e => {
        if (!name || !els.worldTooltip) return;
        els.worldTooltip.textContent = name + (isVis ? " ✓" : "");
        els.worldTooltip.style.opacity = "1";
        els.worldTooltip.style.left   = (e.clientX + 14) + "px";
        els.worldTooltip.style.top    = (e.clientY - 36) + "px";
      })
      .on("mouseleave", () => { if (els.worldTooltip) els.worldTooltip.style.opacity = "0"; });
  }

  countries.features.forEach(feat => {
    const id     = +feat.id;
    const isVis  = visited.has(id);
    const bounds = MAINLAND_BOUNDS[id];
    const geom   = feat.geometry;
    if (!isVis || !bounds || geom?.type !== "MultiPolygon") { addPath(geom, id, isVis); return; }
    const main=[], over=[];
    geom.coordinates.forEach(poly => {
      const c = centroid(poly[0]);
      (c[0]>=bounds.minLon&&c[0]<=bounds.maxLon&&c[1]>=bounds.minLat&&c[1]<=bounds.maxLat ? main : over).push(poly);
    });
    if (main.length) addPath({type:"MultiPolygon",coordinates:main}, id, true);
    if (over.length) addPath({type:"MultiPolygon",coordinates:over}, id, false);
  });

  g.append("path").datum(borders).attr("d",pathGen)
    .attr("fill","none").attr("stroke","#07090f").attr("stroke-width",.45);

  renderWorldStats(visited);
}

function renderWorldStats(visitedNums) {
  const bar = document.getElementById("world-stats-bar");
  if (!bar) return;

  const visitedIso2 = new Set();
  Object.entries(ISO2_TO_NUM).forEach(([iso,num]) => { if (visitedNums.has(num)) visitedIso2.add(iso); });

  const pct = (v,t) => t===0 ? "0%" : Math.round(v/t*100)+"%";
  let totalAll=0, visitedAll=0;
  const contStats = {};

  Object.entries(CONTINENT_COUNTRIES).forEach(([cont, arr]) => {
    const vis = arr.filter(c => visitedIso2.has(c)).length;
    contStats[cont] = {visited:vis, total:arr.length};
    totalAll += arr.length; visitedAll += vis;
  });

  let html = `<div class="world-stat-item global" data-cont="world"><strong>Wereld&nbsp;${visitedAll}/${totalAll}</strong>&nbsp;${pct(visitedAll,totalAll)}</div>`;
  Object.entries(contStats).forEach(([c,s]) => {
    html += `<div class="world-stat-item" data-cont="${c}"><span class="stat-cont">${c}</span><strong>${s.visited}/${s.total}</strong>&nbsp;${pct(s.visited,s.total)}</div>`;
  });
  bar.innerHTML = html;

  bar.addEventListener("click", e => {
    const item = e.target.closest(".world-stat-item");
    if (!item) return;
    const cont = item.dataset.cont;
    if (cont === "world") worldSvg?.transition().duration(600).call(worldZoom.transform, d3.zoomIdentity);
    else zoomToContinent(cont);
  });
}

function zoomToContinent(cont) {
  if (!worldProjection || !worldZoom || !worldSvg) return;
  const bounds = CONTINENT_BOUNDS[cont];
  if (!bounds) return;
  const W=960, H=500;
  const corners = [[bounds[0][0],bounds[0][1]],[bounds[1][0],bounds[0][1]],[bounds[1][0],bounds[1][1]],[bounds[0][0],bounds[1][1]]];
  const proj    = corners.map(c => worldProjection(c));
  const xs = proj.map(p=>p[0]), ys = proj.map(p=>p[1]);
  const x0=Math.min(...xs), x1=Math.max(...xs), y0=Math.min(...ys), y1=Math.max(...ys);
  const scale = Math.min(8, .88*Math.min(W/(x1-x0), H/(y1-y0)));
  const tx = W/2 - scale*(x0+x1)/2, ty = H/2 - scale*(y0+y1)/2;
  worldSvg.transition().duration(750).call(worldZoom.transform, d3.zoomIdentity.translate(tx,ty).scale(scale));
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function flagImg(iso, cls) {
  if (!iso || iso.length !== 2) return "";
  return `<img class="${cls||"flag"}" src="https://flagcdn.com/${iso.toLowerCase()}.svg" alt="${escapeAttr(iso)}" />`;
}

function joinPath(folder, file) {
  const f = (folder || "").replace(/\/+$/, "");
  const g = String(file).replace(/^\/+/, "");
  return f ? f + "/" + g : g;
}

function formatDateRange(start, end) {
  if (!start && !end) return "";
  const s = start ? new Date(start) : null;
  const e = end   ? new Date(end)   : null;
  const opts = {year:"numeric", month:"short", day:"numeric"};
  const loc  = "nl-NL";
  if (s && e) {
    if (s.getFullYear()===e.getFullYear() && s.getMonth()===e.getMonth()) {
      return `${s.getDate()}–${e.getDate()} ${s.toLocaleDateString(loc,{month:"short"})} ${s.getFullYear()}`;
    }
    return `${s.toLocaleDateString(loc,opts)} – ${e.toLocaleDateString(loc,opts)}`;
  }
  return (s||e).toLocaleDateString(loc, opts);
}

function escapeHtml(str) {
  return str==null ? "" : String(str)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}
function escapeAttr(str) { return escapeHtml(str); }

function showLoadError(err) {
  document.querySelector("main").innerHTML =
    `<div class="notice"><h2>Reisdata kon niet geladen worden</h2><p>${escapeHtml(err?.message||String(err))}</p></div>`;
}
