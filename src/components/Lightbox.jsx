import { useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { isVideo, srcSetFor, locationForSrc, mapsLink } from "@/lib/helpers";
import { t } from "@/lib/i18n";

export default function Lightbox({ state, onClose, onNavigate }) {
  const touchStart = useRef(null);
  if (!state) return null;
  const { srcs, alts, index } = state;
  const src = srcs[index];
  const isVid = isVideo(src);
  const total = srcs.length;
  const caption = (alts?.[index] || "").replace(/\s\(\d+\/\d+\)$/, "");
  const loc = isVid ? null : locationForSrc(src);

  // Pinch-zoom is left to the browser; a one-finger horizontal swipe goes to
  // the next photo, but not while the page is zoomed in (then it pans).
  const zoomed = () => (window.visualViewport?.scale || 1) > 1.01;

  return (
    <div
      className="fixed inset-0 bg-[#1a1714]/96 flex items-center justify-center z-[2000] px-2 sm:p-6 pt-[max(3.5rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]"
      style={{ touchAction: "pinch-zoom" }}
      role="dialog"
      aria-modal="true"
      aria-label={caption || t("photo")}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onTouchStart={(e) => {
        if (e.touches.length !== 1) { touchStart.current = null; return; }
        const t = e.changedTouches[0];
        touchStart.current = { x: t.clientX, y: t.clientY };
      }}
      onTouchEnd={(e) => {
        if (!touchStart.current || zoomed()) { touchStart.current = null; return; }
        const t = e.changedTouches[0];
        const dx = t.clientX - touchStart.current.x, dy = t.clientY - touchStart.current.y;
        touchStart.current = null;
        if (total > 1 && Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
          e.preventDefault();
          onNavigate(dx < 0 ? 1 : -1);
        } else if (dy > 90 && Math.abs(dy) > Math.abs(dx) * 1.5) {
          onClose(); // swipe down to close
        }
      }}
    >
      <button
        className="absolute right-3 sm:right-4 top-[max(.75rem,env(safe-area-inset-top))] w-11 h-11 rounded-full bg-white/10 border border-white/15 text-white text-lg hover:bg-white/20 transition"
        onClick={onClose}
        aria-label={t("close")}
      >
        ✕
      </button>
      {total > 1 && (
        <span className="absolute left-4 top-[max(1.4rem,calc(env(safe-area-inset-top)+.65rem))] text-white/70 text-sm tabular-nums">
          {index + 1} / {total}
        </span>
      )}

      {total > 1 && (
        <button
          className="hidden sm:block absolute top-1/2 -translate-y-1/2 left-4 bg-white/10 border border-white/15 text-white text-3xl leading-none px-4 py-2.5 rounded-md hover:bg-white/20 transition select-none"
          onClick={(e) => { e.stopPropagation(); onNavigate(-1); }}
          aria-label={t("prevPhoto")}
        >
          &#8249;
        </button>
      )}

      <AnimatePresence mode="wait">
        <motion.figure
          key={index}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.16 }}
          className="m-0 flex flex-col items-center gap-3 max-w-full"
        >
          {isVid ? (
            <video src={src} controls autoPlay playsInline className="max-w-[96vw] sm:max-w-[88vw] max-h-[80dvh] object-contain select-none block bg-black" />
          ) : (
            <img
              src={src}
              srcSet={srcSetFor(src)}
              sizes="(min-width: 640px) 88vw, 96vw"
              alt={caption}
              draggable={false}
              className="max-w-[96vw] sm:max-w-[88vw] max-h-[80dvh] object-contain select-none block"
            />
          )}
          {(caption || loc) && (
            <figcaption className="flex flex-col items-center gap-1 text-white/85 text-sm text-center px-4">
              {caption && <span>{caption}</span>}
              {loc && (
                <a
                  href={mapsLink(loc)}
                  target="_blank"
                  rel="noopener"
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-[13px] underline-offset-4 hover:underline py-1"
                >
                  <span aria-hidden="true">📍</span>{t("takenHere")} · {t("openInMaps")} ↗
                </a>
              )}
            </figcaption>
          )}
        </motion.figure>
      </AnimatePresence>

      {total > 1 && (
        <button
          className="hidden sm:block absolute top-1/2 -translate-y-1/2 right-4 bg-white/10 border border-white/15 text-white text-3xl leading-none px-4 py-2.5 rounded-md hover:bg-white/20 transition select-none"
          onClick={(e) => { e.stopPropagation(); onNavigate(1); }}
          aria-label={t("nextPhoto")}
        >
          &#8250;
        </button>
      )}
    </div>
  );
}
