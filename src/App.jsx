import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "motion/react";
import Header from "@/components/Header";
import MapView from "@/components/MapView";
import WallView from "@/components/WallView";
import TripPage from "@/components/TripPage";
import Lightbox from "@/components/Lightbox";
import { VACATIONS } from "@/data/vacations";
import { visitedCountrySet } from "@/lib/helpers";
import { setLang as setI18nLang, initialLang, saveLang, t } from "@/lib/i18n";

const VIEWS = ["wall", "map", "world"];

// The world map pulls in d3; load it the first time someone opens that tab.
const WorldView = lazy(() => import("@/components/WorldView"));

function readHash() {
  return decodeURIComponent((window.location.hash || "").slice(1));
}

export default function App() {
  // Language first: set synchronously so every child renders in it.
  const [lang, setLang] = useState(initialLang);
  setI18nLang(lang);
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = t("siteName");
    saveLang(lang);
  }, [lang]);

  const vacations = useMemo(
    () => VACATIONS.slice().sort((a, b) => (b.startDate || "").localeCompare(a.startDate || "")),
    []
  );
  const countryCount = useMemo(() => visitedCountrySet(vacations).size, [vacations]);

  // Deep links: #map / #world switch views, #<trip-id> opens that trip.
  const [view, setView] = useState(() => (VIEWS.includes(readHash()) ? readHash() : "wall"));
  const [modalTripId, setModalTripId] = useState(() => {
    const h = readHash();
    return vacations.some((v) => v.id === h) ? h : null;
  });
  const [lightbox, setLightbox] = useState(null);
  const [worldSeen, setWorldSeen] = useState(view === "world");
  useEffect(() => { if (view === "world") setWorldSeen(true); }, [view]);
  const mapRef = useRef(null);

  const modalIdx = useMemo(() => vacations.findIndex((v) => v.id === modalTripId), [vacations, modalTripId]);
  const modalTrip = modalIdx >= 0 ? vacations[modalIdx] : null;

  // A trip is a page: opening it adds a history entry, so the phone's back
  // gesture (or the browser back button) closes it. Moving to a neighbouring
  // trip replaces that entry, so back always returns to where you came from.
  function openTrip(id) {
    if (readHash() !== id) history.pushState({ trip: id }, "", "#" + id);
    setModalTripId(id);
  }
  function goToTrip(id) {
    history.replaceState({ trip: id }, "", "#" + id);
    setModalTripId(id);
  }
  function closeTrip() {
    if (history.state?.trip) history.back();
    else setModalTripId(null);
  }
  function closeLightbox() { setLightbox(null); }

  function handleViewOnMap(id) {
    // Swap the trip entry for the map, so back from the map returns to the wall.
    setModalTripId(null);
    setView("map");
    setTimeout(() => mapRef.current?.openSheetById(id), 60);
  }

  function openLightbox(srcs, alts, index) { setLightbox({ srcs, alts, index }); }
  function navigateLightbox(dir) {
    setLightbox((s) => (s ? { ...s, index: (s.index + dir + s.srcs.length) % s.srcs.length } : s));
  }

  // Keep the URL in sync so a trip or a view can be shared.
  useEffect(() => {
    const target = modalTripId ? "#" + modalTripId : view === "wall" ? "" : "#" + view;
    const current = window.location.hash;
    if (current === target || (!target && !current)) return;
    history.replaceState(null, "", target || window.location.pathname + window.location.search);
  }, [modalTripId, view]);

  useEffect(() => {
    function onHashChange() {
      const h = readHash();
      if (vacations.some((v) => v.id === h)) { setModalTripId(h); return; }
      setModalTripId(null);
      if (VIEWS.includes(h)) setView(h);
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [vacations]);

  useEffect(() => {
    function onKeyDown(e) {
      if (lightbox) {
        if (e.key === "Escape") closeLightbox();
        if (e.key === "ArrowLeft") { e.preventDefault(); navigateLightbox(-1); }
        if (e.key === "ArrowRight") { e.preventDefault(); navigateLightbox(1); }
        return;
      }
      if (modalTrip) {
        if (e.key === "Escape") closeTrip();
        if (e.key === "ArrowLeft" && vacations[modalIdx - 1]) goToTrip(vacations[modalIdx - 1].id);
        if (e.key === "ArrowRight" && vacations[modalIdx + 1]) goToTrip(vacations[modalIdx + 1].id);
        return;
      }
      if (e.key === "Escape") mapRef.current?.closeSheet();
      if (!modalTrip && view === "map" && !e.target.closest?.("[role=tablist]")) {
        if (e.key === "ArrowLeft") mapRef.current?.navigateTrip(-1);
        if (e.key === "ArrowRight") mapRef.current?.navigateTrip(1);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [lightbox, modalTrip, modalIdx, view, vacations]);

  useEffect(() => {
    if (view === "map") setTimeout(() => mapRef.current?.invalidateSize(), 50);
  }, [view]);

  return (
    <>
      <Header view={view} onViewChange={setView} tripCount={vacations.length} countryCount={countryCount} lang={lang} onLangChange={setLang} />

      <main className="fixed inset-x-0 top-[calc(54px+env(safe-area-inset-top))] bottom-0 overflow-hidden">
        <div className={`absolute inset-0 overflow-y-auto transition-opacity duration-200 ${view === "wall" ? "opacity-100 visible" : "opacity-0 invisible"}`}>
          <WallView vacations={vacations} countryCount={countryCount} onOpenModal={openTrip} />
        </div>
        <div className={`absolute inset-0 transition-opacity duration-200 ${view === "map" ? "opacity-100 visible" : "opacity-0 invisible"}`}>
          <MapView ref={mapRef} vacations={vacations} lang={lang} onOpenModal={openTrip} onOpenLightbox={openLightbox} />
        </div>
        <div className={`absolute inset-0 transition-opacity duration-200 ${view === "world" ? "opacity-100 visible" : "opacity-0 invisible"}`}>
          {worldSeen && (
            <Suspense fallback={null}>
              <WorldView vacations={vacations} active={view === "world"} lang={lang} />
            </Suspense>
          )}
        </div>
      </main>

      <AnimatePresence>
        {modalTrip && (
          <TripPage
            key="trip-page"
            trip={modalTrip}
            newer={vacations[modalIdx - 1] || null}
            older={vacations[modalIdx + 1] || null}
            onClose={closeTrip}
            onGoTo={goToTrip}
            onOpenLightbox={openLightbox}
            onViewOnMap={handleViewOnMap}
          />
        )}
      </AnimatePresence>
      <Lightbox state={lightbox} onClose={closeLightbox} onNavigate={navigateLightbox} />
    </>
  );
}
