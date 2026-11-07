import { TRIPS_EN } from "@/data/vacations.en.js";

// Dutch / English interface text. The chosen language lives in App state (and
// localStorage); App calls setLang() while rendering, and because the whole
// tree re-renders from App, every t() call and date helper below follows it.

const STRINGS = {
  nl: {
    siteName: "Juuls reizen",
    homeLabel: "Juuls reizen, naar de muur",
    views: "Weergave",
    wall: "Muur",
    map: "Kaart",
    world: "Wereld",
    language: "Taal",
    trips: (n) => (n === 1 ? "1 reis" : `${n} reizen`),
    countries: (n) => (n === 1 ? "1 land" : `${n} landen`),
    allTrips: "Alle reizen",
    jumpToYear: "Spring naar jaar",
    noPhotosYet: "nog geen foto's",
    noPhotosForTrip: "Nog geen foto's voor deze reis.",
    photos: (n) => (n === 1 ? "1 foto" : `${n} foto's`),
    days: (n) => (n === 1 ? "1 dag" : `${n} dagen`),
    months: (n) => (n === 1 ? "1 maand" : `${n} maanden`),
    back: "Terug",
    newerTrip: "Nieuwere reis",
    olderTrip: "Oudere reis",
    noNewerTrip: "Geen nieuwere reis",
    noOlderTrip: "Geen oudere reis",
    otherTrips: "Andere reizen",
    openPhoto: "Open foto",
    videoOf: (i, n) => `Video ${i} van ${n}`,
    bigMap: "Grote kaart ↗",
    viewOnBigMap: "Bekijk op de grote kaart",
    route: "Route",
    prevTrip: "Vorige reis",
    nextTrip: "Volgende reis",
    close: "Sluiten",
    sheetBigger: "Kaart groter maken",
    sheetSmaller: "Kaart kleiner maken",
    visitsHere: "Bezoeken op deze plek",
    nthVisit: (n) => `${n}e bezoek`,
    visits: (n) => `${n} bezoeken`,
    openTrip: "Open reis",
    tilesLight: "Licht",
    tilesSatellite: "Satelliet",
    osmCredit: "© OpenStreetMap-bijdragers",
    ofCountries: (n) => `van ${n} landen`,
    zoomToContinent: "Zoom naar werelddeel",
    worldMapLabel: "Wereldkaart met bezochte landen",
    worldMapError: "De wereldkaart kon niet geladen worden.",
    photo: "Foto",
    takenHere: "Hier genomen",
    darkMode: "Donkere modus",
    lightMode: "Lichte modus",
    openInMaps: "Open in Google Maps",
    photoSpots: (n) => (n === 1 ? "1 foto op de kaart" : `${n} foto's op de kaart`),
    prevPhoto: "Vorige foto",
    nextPhoto: "Volgende foto",
    continents: { Europa: "Europa", "Azië": "Azië", Afrika: "Afrika", "Noord-Amerika": "Noord-Amerika", "Zuid-Amerika": "Zuid-Amerika", "Oceanië": "Oceanië" },
  },
  en: {
    siteName: "Juul's travels",
    homeLabel: "Juul's travels, back to the wall",
    views: "View",
    wall: "Wall",
    map: "Map",
    world: "World",
    language: "Language",
    trips: (n) => (n === 1 ? "1 trip" : `${n} trips`),
    countries: (n) => (n === 1 ? "1 country" : `${n} countries`),
    allTrips: "All trips",
    jumpToYear: "Jump to year",
    noPhotosYet: "no photos yet",
    noPhotosForTrip: "No photos for this trip yet.",
    photos: (n) => (n === 1 ? "1 photo" : `${n} photos`),
    days: (n) => (n === 1 ? "1 day" : `${n} days`),
    months: (n) => (n === 1 ? "1 month" : `${n} months`),
    back: "Back",
    newerTrip: "Newer trip",
    olderTrip: "Older trip",
    noNewerTrip: "No newer trip",
    noOlderTrip: "No older trip",
    otherTrips: "Other trips",
    openPhoto: "Open photo",
    videoOf: (i, n) => `Video ${i} of ${n}`,
    bigMap: "Full map ↗",
    viewOnBigMap: "View on the full map",
    route: "Route",
    prevTrip: "Previous trip",
    nextTrip: "Next trip",
    close: "Close",
    sheetBigger: "Expand card",
    sheetSmaller: "Shrink card",
    visitsHere: "Visits to this place",
    nthVisit: (n) => `visit ${n}`,
    visits: (n) => `${n} visits`,
    openTrip: "Open trip",
    tilesLight: "Light",
    tilesSatellite: "Satellite",
    osmCredit: "© OpenStreetMap contributors",
    ofCountries: (n) => `of ${n} countries`,
    zoomToContinent: "Zoom to continent",
    worldMapLabel: "World map of visited countries",
    worldMapError: "The world map could not be loaded.",
    photo: "Photo",
    takenHere: "Taken here",
    darkMode: "Dark mode",
    lightMode: "Light mode",
    openInMaps: "Open in Google Maps",
    photoSpots: (n) => (n === 1 ? "1 photo on the map" : `${n} photos on the map`),
    prevPhoto: "Previous photo",
    nextPhoto: "Next photo",
    continents: { Europa: "Europe", "Azië": "Asia", Afrika: "Africa", "Noord-Amerika": "North America", "Zuid-Amerika": "South America", "Oceanië": "Oceania" },
  },
};

export const LANGS = ["nl", "en"];
let current = "nl";

export function setLang(lang) { current = LANGS.includes(lang) ? lang : "nl"; }
export function getLang() { return current; }
export function locale() { return current === "en" ? "en-GB" : "nl-NL"; }

/** t("key") or t("key", ...args) for the function-valued strings. */
export function t(key, ...args) {
  const v = STRINGS[current][key] ?? STRINGS.nl[key];
  return typeof v === "function" ? v(...args) : v;
}

/** First visit: the phone's language if it is Dutch, otherwise English. */
export function initialLang() {
  try {
    const saved = localStorage.getItem("lang");
    if (LANGS.includes(saved)) return saved;
  } catch { /* storage blocked: fall through */ }
  const nav = (navigator.languages?.[0] || navigator.language || "nl").toLowerCase();
  return nav.startsWith("nl") ? "nl" : "en";
}

export function saveLang(lang) {
  try { localStorage.setItem("lang", lang); } catch { /* ignore */ }
}

/** A trip's title / location / description in the current language. */
export function tripText(v) {
  const en = current === "en" ? TRIPS_EN[v.id] || {} : {};
  return {
    title: en.title || v.title,
    location: en.location || v.location,
    description: en.description || v.description,
  };
}

/** Country name for an ISO 3166 alpha-2 code, in the current language. */
export function countryName(iso2) {
  try { return new Intl.DisplayNames([locale()], { type: "region" }).of(iso2.toUpperCase()); }
  catch { return iso2; }
}
