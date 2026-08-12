import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import FlagImg from "@/components/FlagImg";
import { joinPath, formatDateRange } from "@/lib/helpers";

export default function TripModal({ trip, onClose, onOpenLightbox, onViewOnMap }) {
  if (!trip) return null;
  const pics = trip.pictures || [];
  const route = trip.route?.length > 1 ? trip.route.map((p) => p.name || "").filter(Boolean).join(" → ") : null;
  const srcs = pics.map((p) => joinPath(trip.folder, p));
  const alts = pics.map((p) => trip.title + " - " + p);

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-[860px] w-full max-h-[90vh] overflow-hidden flex flex-col p-0 bg-card border-border gap-0">
        <DialogTitle className="sr-only">{trip.title}</DialogTitle>

        <header className="bg-secondary border-b border-border px-[22px] py-[18px]">
          <h2 className="font-serif italic text-[22px] text-gold-l">
            <FlagImg iso={trip.country} className="w-[26px] h-[18px] mr-2" />
            {trip.title}
          </h2>
          <div className="flex items-center justify-between gap-3 mt-1.5">
            <div className="text-muted-foreground text-xs">
              {formatDateRange(trip.startDate, trip.endDate)}&nbsp;&nbsp;{trip.location}
            </div>
            <button
              className="border border-border text-muted-foreground rounded-lg px-3 py-1 text-xs font-medium hover:text-foreground hover:bg-card hover:border-border-h transition whitespace-nowrap shrink-0"
              onClick={() => onViewOnMap(trip.id)}
            >
              Kaart bekijken →
            </button>
          </div>
        </header>

        <div className="px-[22px] pt-5 pb-6 overflow-y-auto">
          <p className="mb-4.5 leading-relaxed text-[#907860] text-[14.5px]">{trip.description}</p>
          {route && (
            <div className="mb-4.5 px-3.5 py-2.5 bg-secondary border border-border rounded-lg text-[13px] text-[#907860]">
              <b className="text-foreground mr-1.5">Route:</b>{route}
            </div>
          )}

          <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
            {!pics.length && (
              <div className="col-span-full text-muted-foreground text-sm text-center py-8 border border-dashed border-border rounded-lg">
                Nog geen foto's voor deze reis.
              </div>
            )}
            {srcs.map((src, i) =>
              src.endsWith(".mp4") ? (
                <video key={src} src={src} controls className="gallery-media w-full aspect-[4/3] object-cover rounded-lg border border-border bg-secondary block" />
              ) : (
                <img
                  key={src}
                  src={src}
                  alt={alts[i]}
                  loading="lazy"
                  className="gallery-media w-full aspect-[4/3] object-cover rounded-lg border border-border bg-secondary block cursor-pointer"
                  onClick={() => onOpenLightbox(srcs, alts, i)}
                />
              )
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
