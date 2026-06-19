// app.js — Film Strip edition
// Reads vacation data from window.VACATIONS (vacations.js) and renders
// the map with cinematic film-strip navigation + overlay card.

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
  548:"Vanuatu",776:"Tonga",780:"Trinidad en Tobago",
  795:"Turkmenistan",132:"Kaapverdië",120:"Kameroen",
  178:"Congo",180:"Congo (DRC)",384:"Ivoorkust",226:"Equatoriaal-Guinea"
};

var CONTINENT_BOUNDS = {
  "Europa":        [[-12, 34], [42, 72]],
  "Azië":          [[25, -12], [180, 78]],
  "Afrika":        [[-20, -36], [55, 38]],
  "Noord-Amerika": [[-170, 7],  [-52, 72]],
  "Zuid-Amerika":  [[-82, -56], [-34, 13]],
  "Oceanië":       [[110, -48], [180, 22]]
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
  250: { minLon: -6,  maxLon: 13, minLat: 41, maxLat: 52 },
  528: { minLon:  2,  maxLon:  9, minLat: 50, maxLat: 54 },
  208: { minLon:  6,  maxLon: 16, minLat: 54, maxLat: 58 },
  826: { minLon:-10,  maxLon:  3, minLat: 49, maxLat: 61 },
  724: { minLon: -9,  maxLon:  5, minLat: 35, maxLat: 44 },
};

var worldData = null;
var worldProjection = null;
var worldZoom = null;
var worldSvg = null;

const els = {
  map:             document.getElementById("map"),
  timeline:        document.getElementById("timeline"),
  viewMap:         document.getElementById("view-map"),
  viewTimeline:    document.getElementById("view-timeline"),
  viewWorld:       document.getElementById("view-world"),
  btnMap:          document.getElementById("btn-map"),
  btnTimeline:     document.getElementById("btn-timeline"),
  btnWorld:        document.getElementById("btn-world"),
  modal:           document.getElementById("modal"),
  modalTitle:      document.getElementById("modal-title"),
  modalMeta:       document.getElementById("modal-meta"),
  modalDesc:       document.getElementById("modal-desc"),
  modalGallery:    document.getElementById("modal-gallery"),
  modalClose:      document.querySelector("#modal .close"),
  modalMapBtn:     document.getElementById("modal-map-btn"),
  reizenBtn:       document.getElementById("reizen-btn"),
  landenBtn:       document.getElementById("landen-btn"),
  worldVisitedLabel: document.getElementById("world-visited-label"),
  worldTooltip:    document.getElementById("world-tooltip"),
  lightbox:        document.getElementById("lightbox"),
  lightboxImg:     document.getElementById("lightbox-img"),
  lightboxVideo:   document.getElementById("lightbox-video"),
  lbPrev:          document.getElementById("lb-prev"),
  lbNext:          document.getElementById("lb-next"),
  lbCounter:       document.getElementById("lb-counter"),
  // Film strip + overlay
  tripOverlay:     document.getElementById("trip-overlay"),
  ovPhotoWrap:     document.getElementById("ov-photo-wrap"),
  ovFlag:          document.getElementById("ov-flag"),
  ovLocation:      document.getElementById("ov-location"),
  ovTitle:         document.getElementById("ov-title"),
  ovDates:         document.getElementById("ov-dates"),
  ovDesc:          document.getElementById("ov-desc"),
  ovRoute:         document.getElementById("ov-route"),
  ovPhotoCount:    document.getElementById("ov-photo-count"),
  ovDetailBtn:     document.getElementById("ov-detail-btn"),
  filmItemsWrap:   document.getElementById("film-items-wrap"),
  filmPerfsTop:    document.getElementById("film-perfs-top"),
  filmPerfsBottom: document.getElementById("film-perfs-bottom"),
};

let vacations      = [];
let map            = null;
let lightboxPhotos = [];
let lightboxAlts   = [];
let lightboxIndex  = 0;
let routesLayer    = null;
let activeRouteId  = null;
let currentModalId = null;
let activeYearFilter = null;
let activeFilmId   = null;
const markersById  = new Map();
const CITY_ZOOM    = 12;

(function init() {
  els.btnMap.addEventListener("click",      function () { setView("map"); });
  els.btnTimeline.addEventListener("click", function () { setView("timeline"); });
  els.btnWorld.addEventListener("click",    function () { setView("world"); });

  els.modalClose.addEventListener("click", closeModal);
  els.modal.addEventListener("click", function (e) { if (e.target === els.modal) closeModal(); });

  els.modalMapBtn.addEventListener("click", function () {
    if (!currentModalId) return;
    const v = vacations.find(function (x) { return x.id === currentModalId; });
    closeModal();
    setView("map");
    if (v) selectFilmItem(v.id);
  });

  els.lightbox.addEventListener("click", function (e) { if (e.target === els.lightbox) closeLightbox(); });
  els.lbPrev.addEventListener("click", function (e) { e.stopPropagation(); navigateLightbox(-1); });
  els.lbNext.addEventListener("click", function (e) { e.stopPropagation(); navigateLightbox(1); });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { closeModal(); closeLightbox(); }
    if (els.lightbox.classList.contains("open")) {
      if (e.key === "ArrowLeft")  { e.preventDefault(); navigateLightbox(-1); }
      if (e.key === "ArrowRight") { e.preventDefault(); navigateLightbox(1); }
    }
  });

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
  renderFilmStrip();
  renderTimeline();
})();

// ── Stats ─────────────────────────────────────────────────────────────────────

function renderStats() {
  const countrySet = new Set();
  for (const v of vacations) {
    const list = Array.isArray(v.countries) ? v.countries : (v.country ? [v.country] : []);
    for (const c of list) countrySet.add(c.toUpperCase());
  }
  if (els.reizenBtn) {
    els.reizenBtn.textContent = vacations.length + " reizen";
    els.reizenBtn.addEventListener("click", function () { setView("timeline"); });
  }
  if (els.landenBtn) {
    els.landenBtn.textContent = countrySet.size + " landen";
    els.landenBtn.addEventListener("click", function () { setView("world"); });
  }
}

// ── View switching ─────────────────────────────────────────────────────────────

function setView(view) {
  const showMap      = view === "map";
  const showTimeline = view === "timeline";
  const showWorld    = view === "world";

  els.viewMap.classList.toggle("active",      showMap);
  els.viewTimeline.classList.toggle("active", showTimeline);
  els.viewWorld.classList.toggle("active",    showWorld);

  els.btnMap.classList.toggle("active",      showMap);
  els.btnTimeline.classList.toggle("active", showTimeline);
  els.btnWorld.classList.toggle("active",    showWorld);

  els.btnMap.setAttribute("aria-selected",      String(showMap));
  els.btnTimeline.setAttribute("aria-selected", String(showTimeline));
  els.btnWorld.setAttribute("aria-selected",    String(showWorld));

  if (showMap && map) setTimeout(function () { map.invalidateSize(); }, 50);
  if (showWorld) initWorldMap();
}

// ── Flags ──────────────────────────────────────────────────────────────────────

function flagUrl(iso) {
  if (!iso || typeof iso !== "string" || iso.length !== 2) return "";
  return "https://flagcdn.com/" + iso.toLowerCase() + ".svg";
}

function flagImg(iso, cssClass) {
  const url = flagUrl(iso);
  if (!url) return "";
  return '<img class="' + (cssClass || "flag") + '" src="' + url + '" alt="' + escapeAttr(iso) + '" />';
}

function makePulseIcon(iso) {
  return L.divIcon({
    className: "flag-marker",
    html: '<div class="flag-pulse-wrap"><div class="flag-marker-inner">' + flagImg(iso, "flag-img") + "</div></div>",
    iconSize: [36, 24], iconAnchor: [18, 12], popupAnchor: [0, -14],
  });
}

function makeFlagIcon(iso) {
  return L.divIcon({
    className: "flag-marker",
    html: '<div class="flag-marker-inner">' + flagImg(iso, "flag-img") + "</div>",
    iconSize: [36, 24], iconAnchor: [18, 12], popupAnchor: [0, -14],
  });
}

// ── Map ────────────────────────────────────────────────────────────────────────

function renderMap() {
  const dark = L.tileLayer(
    "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
    { attribution: "&copy; OpenStreetMap &copy; CARTO", maxZoom: 19, subdomains: "abcd" }
  );
  const satellite = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    { attribution: "Tiles &copy; Esri", maxZoom: 19 }
  );
  const osm = L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    { attribution: "&copy; OpenStreetMap", maxZoom: 19 }
  );

  map = L.map("map", {
    worldCopyJump: true,
    layers: [dark],
    zoomControl: true,
  }).setView([20, 0], 2);

  L.control.layers(
    { "Donker": dark, "Satelliet": satellite, "Kaart": osm },
    null,
    { position: "topright", collapsed: true }
  ).addTo(map);

  routesLayer = L.layerGroup().addTo(map);

  const bounds = [];

  for (const v of vacations) {
    if (typeof v.lat !== "number" || typeof v.lon !== "number") continue;

    const marker = L.marker([v.lat, v.lon], { icon: makeFlagIcon(v.country) });

    const popupHtml =
      "<b>" + flagImg(v.country, "popup-flag") + " " + escapeHtml(v.title) + "</b><br />" +
      "<small>" + escapeHtml(formatDateRange(v.startDate, v.endDate)) + "</small><br />" +
      '<span class="popup-link" data-id="' + escapeAttr(v.id) + '">Details bekijken &rarr;</span>';

    marker.bindPopup(popupHtml);
    marker.on("popupopen", function (e) {
      const link = e.popup.getElement().querySelector(".popup-link");
      if (link) link.addEventListener("click", function () { openModal(v.id); });
    });
    marker.on("click", function () { selectFilmItem(v.id); });

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

  // Auto-select the most recent trip with coordinates
  const first = vacations.find(function (v) { return typeof v.lat === "number"; });
  if (first) setTimeout(function () { selectFilmItem(first.id); }, 400);
}

// ── Film strip ─────────────────────────────────────────────────────────────────

function renderFilmStrip() {
  if (!els.filmItemsWrap || !els.filmPerfsTop || !els.filmPerfsBottom) return;

  // Perforations — fill both rails with enough holes
  var perfHTML = "";
  for (var i = 0; i < 60; i++) perfHTML += '<div class="film-perf"></div>';
  els.filmPerfsTop.innerHTML    = perfHTML;
  els.filmPerfsBottom.innerHTML = perfHTML;

  // Trip thumbnails
  els.filmItemsWrap.innerHTML = "";

  for (const v of vacations) {
    if (typeof v.lat !== "number" && typeof v.lon !== "number" &&
        (!v.pictures || !v.pictures.length)) continue;

    const item = document.createElement("div");
    item.className = "film-item";
    item.setAttribute("data-id", v.id);
    item.title = v.title;

    // Background: first photo or coloured placeholder
    const hasPic = v.pictures && v.pictures.length > 0 && v.folder;
    if (hasPic) {
      const img = document.createElement("img");
      img.className = "film-item-bg";
      img.src = joinPath(v.folder, v.pictures[0]);
      img.alt = v.title;
      img.addEventListener("error", function () {
        img.style.display = "none";
        item.style.background = filmFallbackColor(v.country);
      });
      item.appendChild(img);
    } else {
      item.style.background = filmFallbackColor(v.country);
    }

    const label = document.createElement("div");
    label.className = "film-item-label";
    label.textContent = v.title + (v.startDate ? "  " + v.startDate.slice(0, 4) : "");
    item.appendChild(label);

    item.addEventListener("click", function () { selectFilmItem(v.id); });
    els.filmItemsWrap.appendChild(item);
  }
}

// Warm-tinted fallback colours keyed to rough geography
function filmFallbackColor(iso) {
  var hues = {
    "NO":210,"SE":210,"DK":210,"FI":210,        // Scandinavia — blue
    "IE":150,"GB":200,"NL":200,"BE":200,         // NW Europe — cool
    "DE":220,"AT":220,"CH":220,"LU":220,
    "FR":200,"PT":190,"ES":190,                  // Atlantic — cool blue
    "IT":170,"GR":180,"HR":180,"ME":180,         // Med — teal
    "HU":170,"SK":170,"CZ":170,"PL":200,
    "AL":160,"BA":170,"RS":170,"MK":170,
    "JP":350,"CN":340,"KR":340,"TH":320,         // Asia — warm pink/red
    "IN":30, "ID":30,
    "MA":30, "EG":35, "TN":35,                  // North Africa — amber
    "ZA":20, "KE":20, "TZ":20,                  // Sub-Saharan — warm
    "US":240,"CA":240,"MX":30,                  // Americas
    "BR":120,"AR":200,"CL":200,
    "AU":40, "NZ":200,
  };
  var hue = (iso && hues[iso.toUpperCase()]) || 28;
  return "hsl(" + hue + ", 22%, 16%)";
}

// ── Film item selection + overlay card ────────────────────────────────────────

function selectFilmItem(id) {
  const v = vacations.find(function (x) { return x.id === id; });
  if (!v) return;

  activeFilmId = id;

  // Update film strip active state
  const items = els.filmItemsWrap ? els.filmItemsWrap.querySelectorAll(".film-item") : [];
  items.forEach(function (el) {
    el.classList.toggle("active", el.getAttribute("data-id") === id);
  });

  // Scroll film item into view
  const activeEl = els.filmItemsWrap
    ? els.filmItemsWrap.querySelector(".film-item.active")
    : null;
  if (activeEl) {
    activeEl.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }

  // Update overlay card
  updateOverlay(v);

  // Zoom map and show route
  showRouteFor(v);
  zoomToVacation(v);
}

function updateOverlay(v) {
  if (!els.tripOverlay) return;

  // Photo
  els.ovPhotoWrap.innerHTML = "";
  const pics = v.pictures || [];
  if (pics.length && v.folder) {
    const img = document.createElement("img");
    img.className = "ov-photo";
    img.src = joinPath(v.folder, pics[0]);
    img.alt = v.title;
    img.addEventListener("error", function () {
      img.style.display = "none";
    });
    els.ovPhotoWrap.appendChild(img);
  }

  // Flag
  const flagSrc = flagUrl(v.country);
  if (flagSrc) {
    els.ovFlag.src = flagSrc;
    els.ovFlag.alt = v.country || "";
    els.ovFlag.style.display = "";
  } else {
    els.ovFlag.style.display = "none";
  }

  // Location + title
  els.ovLocation.textContent = (v.location || v.title || "").toUpperCase();
  els.ovTitle.textContent    = v.title || "";

  // Dates
  els.ovDates.textContent = formatDateRange(v.startDate, v.endDate);

  // Description
  els.ovDesc.textContent = v.description || "";

  // Route
  if (v.route && v.route.length > 1) {
    const stops = v.route.map(function (p) { return p.name || ""; }).filter(Boolean);
    els.ovRoute.innerHTML = '<span>Route</span>  ' + escapeHtml(stops.join(" → "));
    els.ovRoute.style.display = "";
  } else {
    els.ovRoute.style.display = "none";
  }

  // Photo count
  els.ovPhotoCount.textContent = pics.length
    ? pics.length + (pics.length === 1 ? " foto" : " foto's")
    : "Geen foto's";

  // Detail button
  els.ovDetailBtn.onclick = function () { openModal(v.id); };

  // Show card
  els.tripOverlay.classList.remove("hidden");
}

// ── Routes ─────────────────────────────────────────────────────────────────────

function showRouteFor(v) {
  clearRoute();
  if (!v.route || !Array.isArray(v.route) || v.route.length < 2) return;

  const latlngs = v.route
    .filter(function (p) { return typeof p.lat === "number" && typeof p.lon === "number"; })
    .map(function (p) { return [p.lat, p.lon]; });
  if (latlngs.length < 2) return;

  L.polyline(latlngs, {
    color: "#c8a060",
    weight: 2.5,
    opacity: 0.75,
    dashArray: "6, 8",
  }).addTo(routesLayer);

  v.route.forEach(function (pt) {
    if (typeof pt.lat !== "number" || typeof pt.lon !== "number") return;
    const dot = L.circleMarker([pt.lat, pt.lon], {
      radius: 4,
      color: "#e8c890",
      weight: 1.5,
      fillColor: "#c8a060",
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
  if (!map) return;
  const pts = [];
  if (v.route && Array.isArray(v.route)) {
    for (const p of v.route) {
      if (typeof p.lat === "number" && typeof p.lon === "number") pts.push([p.lat, p.lon]);
    }
  }
  if (!pts.length && typeof v.lat === "number" && typeof v.lon === "number") {
    pts.push([v.lat, v.lon]);
  }
  if (pts.length === 1) {
    map.flyTo(pts[0], CITY_ZOOM, { duration: 0.7 });
  } else if (pts.length > 1) {
    map.flyToBounds(L.latLngBounds(pts), { padding: [80, 80], duration: 0.7, maxZoom: 14 });
  }
}

// ── Timeline ───────────────────────────────────────────────────────────────────

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
  item.style.animationDelay = (idx * 0.04) + "s";

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

// ── Modal ──────────────────────────────────────────────────────────────────────

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
      const isVid = srcs[i].endsWith(".mp4");
      if (isVid) {
        const vid = document.createElement("video");
        vid.src = srcs[i];
        vid.controls = true;
        vid.addEventListener("error", function () { vid.style.display = "none"; });
        els.modalGallery.appendChild(vid);
      } else {
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
  }

  els.modal.classList.add("open");
}

function closeModal() { els.modal.classList.remove("open"); }

// ── Lightbox ───────────────────────────────────────────────────────────────────

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
  const src = lightboxPhotos[lightboxIndex];
  const isVid = src.endsWith(".mp4");
  if (isVid) {
    els.lightboxImg.style.display = "none";
    els.lightboxVideo.style.display = "";
    els.lightboxVideo.src = src;
  } else {
    els.lightboxVideo.pause();
    els.lightboxVideo.style.display = "none";
    els.lightboxImg.style.display = "";
    els.lightboxImg.src = src;
    els.lightboxImg.alt = lightboxAlts[lightboxIndex] || "";
  }
  const total = lightboxPhotos.length;
  els.lbCounter.textContent = total > 1 ? (lightboxIndex + 1) + " / " + total : "";
  els.lbPrev.classList.toggle("hidden", total <= 1);
  els.lbNext.classList.toggle("hidden", total <= 1);
}

function closeLightbox() {
  els.lightbox.classList.remove("open");
  els.lightboxVideo.pause();
}

// ── World map ──────────────────────────────────────────────────────────────────

function getVisitedNums() {
  var set = new Set();
  for (var i = 0; i < vacations.length; i++) {
    var v = vacations[i];
    var codes = Array.isArray(v.countries) ? v.countries : (v.country ? [v.country] : []);
    for (var j = 0; j < codes.length; j++) {
      var num = ISO2_TO_NUM[codes[j].toUpperCase()];
      if (num) set.add(num);
    }
  }
  return set;
}

function initWorldMap() {
  var wrap = document.getElementById("world-svg-wrap");
  if (!wrap) return;
  if (worldData) { drawWorldMap(worldData); return; }
  fetch("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json")
    .then(function (r) { return r.json(); })
    .then(function (data) { worldData = data; drawWorldMap(data); })
    .catch(function (err) { console.warn("Wereldkaart kon niet laden:", err); });
}

function drawWorldMap(world) {
  var wrap = document.getElementById("world-svg-wrap");
  if (!wrap) return;

  var visited = getVisitedNums();
  if (els.worldVisitedLabel) els.worldVisitedLabel.textContent = visited.size + " bezocht";

  var W = 960, H = 500;
  var projection = d3.geoNaturalEarth1().scale(153).translate([W / 2, H / 2]);
  var pathGen    = d3.geoPath().projection(projection);
  var countries  = topojson.feature(world, world.objects.countries);
  var borders    = topojson.mesh(world, world.objects.countries, function (a, b) { return a !== b; });

  var svg = d3.select("#world-svg")
    .attr("viewBox", "0 0 " + W + " " + H)
    .attr("preserveAspectRatio", "xMidYMid meet");

  svg.selectAll("*").remove();

  var g = svg.append("g");
  worldSvg = svg;
  worldProjection = projection;
  worldZoom = d3.zoom()
    .scaleExtent([1, 8])
    .translateExtent([[0, 0], [W, H]])
    .on("zoom", function (event) { g.attr("transform", event.transform); });
  svg.call(worldZoom);

  g.append("path")
    .datum({ type: "Sphere" })
    .attr("d", pathGen)
    .attr("fill", "#07090f");

  g.append("path")
    .datum(d3.geoGraticule()())
    .attr("d", pathGen)
    .attr("fill", "none")
    .attr("stroke", "#0f1520")
    .attr("stroke-width", 0.35);

  var VISITED_COLOR   = "#c8a060";
  var UNVISITED_COLOR = "#1a1c24";

  function polycentroid(ring) {
    var n = ring.length, lx = 0, ly = 0;
    for (var k = 0; k < n; k++) { lx += ring[k][0]; ly += ring[k][1]; }
    return [lx / n, ly / n];
  }

  function addCountryPath(geom, id, isVis) {
    var name = LAND_NAMEN[id] || "";
    g.append("path")
      .datum({ type: "Feature", geometry: geom })
      .attr("class", "world-country" + (isVis ? " visited" : ""))
      .attr("d", pathGen)
      .attr("fill", isVis ? VISITED_COLOR : UNVISITED_COLOR)
      .attr("stroke", "none")
      .on("mousemove", function (event) {
        if (!name || !els.worldTooltip) return;
        els.worldTooltip.textContent = name + (isVis ? " ✓" : "");
        els.worldTooltip.style.opacity = "1";
        els.worldTooltip.style.left = (event.clientX + 14) + "px";
        els.worldTooltip.style.top  = (event.clientY - 36) + "px";
      })
      .on("mouseleave", function () {
        if (els.worldTooltip) els.worldTooltip.style.opacity = "0";
      });
  }

  countries.features.forEach(function (feature) {
    var id     = +feature.id;
    var isVis  = visited.has(id);
    var bounds = MAINLAND_BOUNDS[id];
    var geom   = feature.geometry;

    if (!isVis || !bounds || !geom || geom.type !== "MultiPolygon") {
      addCountryPath(geom, id, isVis);
      return;
    }

    var mainland = [], overseas = [];
    geom.coordinates.forEach(function (poly) {
      var c = polycentroid(poly[0]);
      var inMain = c[0] >= bounds.minLon && c[0] <= bounds.maxLon &&
                   c[1] >= bounds.minLat && c[1] <= bounds.maxLat;
      (inMain ? mainland : overseas).push(poly);
    });

    if (mainland.length) addCountryPath({ type: "MultiPolygon", coordinates: mainland }, id, true);
    if (overseas.length) addCountryPath({ type: "MultiPolygon", coordinates: overseas }, id, false);
  });

  g.append("path")
    .datum(borders)
    .attr("d", pathGen)
    .attr("fill", "none")
    .attr("stroke", "#07090f")
    .attr("stroke-width", 0.45);

  renderWorldStats(visited);
}

function renderWorldStats(visitedNums) {
  var bar = document.getElementById("world-stats-bar");
  if (!bar) return;

  var visitedIso2 = new Set();
  for (var iso2 in ISO2_TO_NUM) {
    if (visitedNums.has(ISO2_TO_NUM[iso2])) visitedIso2.add(iso2);
  }

  function pct(v, t) { return t === 0 ? "0%" : Math.round(v / t * 100) + "%"; }

  var totalAll = 0, visitedAll = 0;
  var contStats = {};
  for (var cont in CONTINENT_COUNTRIES) {
    var arr = CONTINENT_COUNTRIES[cont];
    var vis = arr.filter(function (c) { return visitedIso2.has(c); }).length;
    contStats[cont] = { visited: vis, total: arr.length };
    totalAll  += arr.length;
    visitedAll += vis;
  }

  var html = '<div class="world-stat-item global" data-cont="world"><strong>Wereld&nbsp;' +
    visitedAll + "/" + totalAll + "</strong>&nbsp;" + pct(visitedAll, totalAll) + "</div>";
  for (var c in contStats) {
    var s = contStats[c];
    html += '<div class="world-stat-item" data-cont="' + c + '"><span class="stat-cont">' +
      c + "</span><strong>" + s.visited + "/" + s.total + "</strong>&nbsp;" + pct(s.visited, s.total) + "</div>";
  }
  bar.innerHTML = html;

  bar.addEventListener("click", function (e) {
    var item = e.target.closest(".world-stat-item");
    if (!item) return;
    var cont = item.getAttribute("data-cont");
    if (cont === "world") {
      if (worldSvg && worldZoom) {
        worldSvg.transition().duration(600).call(worldZoom.transform, d3.zoomIdentity);
      }
    } else {
      zoomToContinent(cont);
    }
  });
}

function zoomToContinent(cont) {
  if (!worldProjection || !worldZoom || !worldSvg) return;
  var bounds = CONTINENT_BOUNDS[cont];
  if (!bounds) return;

  var W = 960, H = 500;
  var corners = [
    [bounds[0][0], bounds[0][1]], [bounds[1][0], bounds[0][1]],
    [bounds[1][0], bounds[1][1]], [bounds[0][0], bounds[1][1]]
  ];
  var projected = corners.map(function (c) { return worldProjection(c); });
  var xs = projected.map(function (p) { return p[0]; });
  var ys = projected.map(function (p) { return p[1]; });
  var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs);
  var y0 = Math.min.apply(null, ys), y1 = Math.max.apply(null, ys);

  var scale = Math.min(8, 0.88 * Math.min(W / (x1 - x0), H / (y1 - y0)));
  var tx = W / 2 - scale * (x0 + x1) / 2;
  var ty = H / 2 - scale * (y0 + y1) / 2;

  worldSvg.transition().duration(750).call(
    worldZoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale)
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

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
  const e = end   ? new Date(end)   : null;
  const opts = { year: "numeric", month: "short", day: "numeric" };
  const locale = "nl-NL";
  if (s && e) {
    if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) {
      const month = s.toLocaleDateString(locale, { month: "short" });
      return s.getDate() + "–" + e.getDate() + " " + month + " " + s.getFullYear();
    }
    return s.toLocaleDateString(locale, opts) + " – " + e.toLocaleDateString(locale, opts);
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
    '<div class="notice"><h2>Reisdata kon niet geladen worden</h2>' +
    "<p>Foutmelding: " + escapeHtml(msg) + "</p></div>";
}
