import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import FlagImg from "@/components/FlagImg";
import { joinPath, thumbPath, thumbFallback, formatDateRange, tripDays, formatDays, routeStops, isVideo, photoCaption } from "@/lib/helpers";

// The vendored Dialog wraps a Radix Portal directly in AnimatePresence, which
// can't detect the portal's exit-animation completion — it never actually
// unmounts on close, leaving an invisible node with pointer-events: auto
// sitting over the page. Hard-unmount ourselves after the exit transition
// window instead of trusting that removal.
const CLOSE_ANIM_MS = 350;

export default function TripModal({ trip, onClose, onOpenLightbox, onViewOnMap }) {
  const [mounted, setMounted] = useState(false);
  const lastTrip = useRef(trip);
  if (trip) lastTrip.current = trip;

  useEffect(() => {
    if (trip) { setMounted(true); return; }
    if (!mounted) return;
    const t = setTimeout(() => setMounted(false), CLOSE_ANIM_MS);
    return () => clearTimeout(t);
  }, [trip, mounted]);

  if (!mounted) return null;
  const shown = lastTrip.current;
  const pics = shown.pictures || [];
  const stops = routeStops(shown);
  const days = tripDays(shown);
  const srcs = pics.map((p) => joinPath(shown.folder, p));
  const thumbs = pics.map((p) => thumbPath(shown.folder, p));
  const captions = pics.map((_, i) => photoCaption(shown, i, pics.length));

  return (
    <Dialog open={!!trip} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-[880px] w-full max-h-[90vh] overflow-hidden flex flex-col p-0 bg-paper border-line gap-0 rounded-2xl">
        <DialogTitle className="sr-only">{shown.title}</DialogTitle>

        <header className="px-5 sm:px-7 pt-5 pb-4 border-b border-line">
          <div className="flex items-center gap-2 text-[10px] text-ink-2 tracking-widest uppercase mb-1">
            <FlagImg iso={shown.country} className="w-5 h-3.5" />
            {shown.location || shown.title}
          </div>
          <h2 className="font-hand text-[40px] leading-none text-ink m-0 -rotate-1 origin-left">{shown.title}</h2>
          <div className="flex items-center justify-between gap-3 mt-2 flex-wrap">
            <div className="text-xs text-ink-2 tabular-nums">
              {formatDateRange(shown.startDate, shown.endDate)}
              {days ? ` · ${formatDays(days)}` : ""}
              {pics.length ? ` · ${pics.length} foto's` : ""}
            </div>
            <button
              className="border border-line text-ink rounded-full px-3.5 py-1 text-xs font-medium hover:bg-cream hover:border-line-h transition whitespace-nowrap shrink-0"
              onClick={() => onViewOnMap(shown.id)}
            >
              Kaart bekijken →
            </button>
          </div>
        </header>

        <div className="px-5 sm:px-7 pt-5 pb-7 overflow-y-auto">
          <p className="mb-4 leading-relaxed text-ink-2 text-[14.5px] max-w-[65ch]">{shown.description}</p>
          {stops.length > 0 && (
            <div className="mb-5 px-3.5 py-2.5 bg-cream border border-line rounded-lg text-[13px] text-ink-2">
              <b className="text-ink mr-1.5 font-medium">Route:</b>{stops.join(" → ")}
            </div>
          )}

          <div className="grid gap-5 sm:gap-6 pt-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
            {!pics.length && (
              <div className="col-span-full text-ink-2 text-sm text-center py-8 border border-dashed border-line-h rounded-lg">
                Nog geen foto's voor deze reis.
              </div>
            )}
            {srcs.map((src, i) =>
              isVideo(src) ? (
                <div key={src} className="bg-paper p-2 pb-7 shadow-[var(--shadow-sm)] relative">
                  <video src={src} controls className="w-full aspect-square object-cover bg-cream block" />
                  <span className="absolute left-2.5 bottom-1.5 font-hand text-[17px] text-ink leading-none">video</span>
                </div>
              ) : (
                <button
                  key={src}
                  className="gallery-media bg-paper p-2 pb-7 shadow-[var(--shadow-sm)] relative text-left cursor-pointer"
                  onClick={() => onOpenLightbox(srcs, captions, i)}
                  aria-label={captions[i]}
                >
                  <img src={thumbs[i]} onError={thumbFallback(src)} alt="" loading="lazy" decoding="async" className="w-full aspect-square object-cover bg-cream block" />
                  <span className="absolute left-2.5 bottom-1.5 font-hand text-[17px] text-ink leading-none tabular-nums">{i + 1} / {pics.length}</span>
                </button>
              )
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
