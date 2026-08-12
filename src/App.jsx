import { useEffect, useMemo, useRef, useState } from "react";
import Header from "@/components/Header";
import MapView from "@/components/MapView";
import TimelineView from "@/components/TimelineView";
import WorldView from "@/components/WorldView";
import TripModal from "@/components/TripModal";
import Lightbox from "@/components/Lightbox";
import { VACATIONS } from "@/data/vacations";
import { visitedCountrySet } from "@/lib/helpers";

export default function App() {
  const [view, setView] = useState("map");
  const [modalTripId, setModalTripId] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const mapRef = useRef(null);

  const vacations = useMemo(
    () => VACATIONS.slice().sort((a, b) => (b.startDate || "").localeCompare(a.startDate || "")),
    []
  );
  const countryCount = useMemo(() => visitedCountrySet(vacations).size, [vacations]);
  const modalTrip = useMemo(() => vacations.find((v) => v.id === modalTripId) || null, [vacations, modalTripId]);

  function closeModal() { setModalTripId(null); }
  function closeLightbox() { setLightbox(null); }

  function handleViewOnMap(id) {
    closeModal();
    setView("map");
    mapRef.current?.openSheetById(id);
  }

  function openLightbox(srcs, alts, index) { setLightbox({ srcs, alts, index }); }
  function navigateLightbox(dir) {
    setLightbox((s) => (s ? { ...s, index: (s.index + dir + s.srcs.length) % s.srcs.length } : s));
  }

  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") { closeModal(); closeLightbox(); mapRef.current?.closeSheet(); }
      if (lightbox) {
        if (e.key === "ArrowLeft") { e.preventDefault(); navigateLightbox(-1); }
        if (e.key === "ArrowRight") { e.preventDefault(); navigateLightbox(1); }
        return;
      }
      if (!modalTrip) {
        if (e.key === "ArrowLeft") mapRef.current?.navigateTrip(-1);
        if (e.key === "ArrowRight") mapRef.current?.navigateTrip(1);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [lightbox, modalTrip]);

  useEffect(() => {
    if (view === "map") setTimeout(() => mapRef.current?.invalidateSize(), 50);
  }, [view]);

  return (
    <>
      <Header view={view} onViewChange={setView} tripCount={vacations.length} countryCount={countryCount} />

      <main className="fixed inset-x-0 top-[54px] bottom-0 overflow-hidden">
        <div className={`absolute inset-0 transition-opacity duration-200 ${view === "map" ? "opacity-100 visible" : "opacity-0 invisible"}`}>
          <MapView ref={mapRef} vacations={vacations} onOpenModal={setModalTripId} />
        </div>
        <div className={`absolute inset-0 overflow-y-auto bg-background transition-opacity duration-200 ${view === "timeline" ? "opacity-100 visible" : "opacity-0 invisible"}`}>
          <TimelineView vacations={vacations} onOpenModal={setModalTripId} />
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
