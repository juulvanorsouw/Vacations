import { useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { isVideo } from "@/lib/helpers";

export default function Lightbox({ state, onClose, onNavigate }) {
  const touchStartX = useRef(0);
  if (!state) return null;
  const { srcs, alts, index } = state;
  const src = srcs[index];
  const isVid = isVideo(src);
  const total = srcs.length;
  const caption = alts?.[index] || "";

  return (
    <div
      className="fixed inset-0 bg-[#1a1714]/96 flex items-center justify-center z-[2000] p-6 touch-none"
      role="dialog"
      aria-modal="true"
      aria-label={caption || "Foto"}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onTouchStart={(e) => { touchStartX.current = e.changedTouches[0].clientX; }}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(dx) > 40) {
          e.preventDefault();
          onNavigate(dx < 0 ? 1 : -1);
        }
      }}
    >
      <button
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 border border-white/15 text-white text-lg hover:bg-white/20 transition"
        onClick={onClose}
        aria-label="Sluiten"
      >
        ✕
      </button>

      {total > 1 && (
        <button
          className="absolute top-1/2 -translate-y-1/2 left-4 bg-white/10 border border-white/15 text-white text-3xl leading-none px-4 py-2.5 rounded-lg hover:bg-white/20 transition select-none"
          onClick={(e) => { e.stopPropagation(); onNavigate(-1); }}
          aria-label="Vorige foto"
        >
          &#8249;
        </button>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          transition={{ duration: 0.18 }}
          className="bg-paper p-3 pb-10 shadow-2xl relative max-w-[92vw]"
        >
          {isVid ? (
            <video src={src} controls autoPlay className="max-w-[88vw] max-h-[78vh] object-contain select-none block" />
          ) : (
            <img src={src} alt={caption} draggable={false} className="max-w-[88vw] max-h-[78vh] object-contain select-none block" />
          )}
          <div className="absolute left-3 right-3 bottom-2 flex items-baseline justify-between gap-3">
            <span className="font-hand text-[22px] leading-none text-ink truncate">{caption.replace(/\s\(\d+\/\d+\)$/, "")}</span>
            {total > 1 && <span className="text-xs text-ink-2 tabular-nums shrink-0">{index + 1} / {total}</span>}
          </div>
        </motion.div>
      </AnimatePresence>

      {total > 1 && (
        <button
          className="absolute top-1/2 -translate-y-1/2 right-4 bg-white/10 border border-white/15 text-white text-3xl leading-none px-4 py-2.5 rounded-lg hover:bg-white/20 transition select-none"
          onClick={(e) => { e.stopPropagation(); onNavigate(1); }}
          aria-label="Volgende foto"
        >
          &#8250;
        </button>
      )}
    </div>
  );
}
