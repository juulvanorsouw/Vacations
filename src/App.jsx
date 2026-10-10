import { useEffect, useMemo, useRef, useState } from "react";
import Header from "@/components/Header";
import MapView from "@/components/MapView";
import WallView from "@/components/WallView";
import WorldView from "@/components/WorldView";
import TripModal from "@/components/TripModal";
import Lightbox from "@/components/Lightbox";
import { VACATIONS } from "@/data/vacations";
import { visitedCountrySet } from "@/lib/helpers";

const VIEWS = ["wall", "map", "world"];

function readHash() {
  return decodeURIComponent((window.location.hash || "").slice(1));
}

export default function App() {
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
  const mapRef = useRef(null);

  const modalTrip = useMemo(() => vacations.find((v) => v.id === modalTripId) || null, [vacations, modalTripId]);

  function closeModal() { setModalTripId(null); }
  function closeLightbox() { setLightbox(null); }

  function handleViewOnMap(id) {
    closeModal();
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
      if (VIEWS.includes(h)) { setView(h); return; }
      if (vacations.some((v) => v.id === h)) setModalTripId(h);
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [vacations]);

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") { closeModal(); closeLightbox(); mapRef.current?.closeSheet(); }
      if (lightbox) {
        if (e.key === "ArrowLeft") { e.preventDefault(); navigateLightbox(-1); }
        if (e.key === "ArrowRight") { e.preventDefault(); navigateLightbox(1); }
        return;
      }
      if (!modalTrip && view === "map" && !e.target.closest?.("[role=tablist]")) {
        if (e.key === "ArrowLeft") mapRef.current?.navigateTrip(-1);
        if (e.key === "ArrowRight") mapRef.current?.navigateTrip(1);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [lightbox, modalTrip, view]);

  useEffect(() => {
    if (view === "map") setTimeout(() => mapRef.current?.invalidateSize(), 50);
  }, [view]);

  return (
    <>
      <Header view={view} onViewChange={setView} tripCount={vacations.length} countryCount={countryCount} />

      <main className="fixed inset-x-0 top-[54px] bottom-0 overflow-hidden">
        <div className={`absolute inset-0 overflow-y-auto transition-opacity duration-200 ${view === "wall" ? "opacity-100 visible" : "opacity-0 invisible"}`}>
          <WallView vacations={vacations} countryCount={countryCount} active={view === "wall"} onOpenModal={setModalTripId} onGoToMap={() => setView("map")} />
        </div>
        <div className={`absolute inset-0 transition-opacity duration-200 ${view === "map" ? "opacity-100 visible" : "opacity-0 invisible"}`}>
          <MapView ref={mapRef} vacations={vacations} onOpenModal={setModalTripId} onOpenLightbox={openLightbox} />
        </div>
        <div className={`absolute inset-0 transition-opacity duration-200 ${view === "world" ? "opacity-100 visible" : "opacity-0 invisible"}`}>
          <WorldView vacations={vacations} active={view === "world"} />
        </div>
      </main>

      <TripModal trip={modalTrip} onClose={closeModal} onOpenLightbox={openLightbox} onViewOnMap={handleViewOnMap} />
      <Lightbox state={lightbox} onClose={closeLightbox} onNavigate={navigateLightbox} />
    </>
  );
}
