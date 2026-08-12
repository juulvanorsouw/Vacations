import { useRef } from "react";
import { AnimatePresence, motion } from "motion/react";

export default function Lightbox({ state, onClose, onNavigate }) {
  const touchStartX = useRef(0);
  if (!state) return null;
  const { srcs, alts, index } = state;
  const src = srcs[index];
  const isVid = src.endsWith(".mp4");
  const total = srcs.length;

  return (
    <div
      className="fixed inset-0 bg-black/96 flex items-center justify-center z-[2000] p-6"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      onTouchStart={(e) => { touchStartX.current = e.changedTouches[0].clientX; }}
      onTouchEnd={(e) => {
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(dx) > 40) onNavigate(dx < 0 ? 1 : -1);
      }}
    >
      {total > 1 && (
        <button
          className="absolute top-1/2 -translate-y-1/2 left-4 bg-white/6 border border-white/10 text-white text-3xl leading-none px-4 py-2.5 rounded-lg hover:bg-white/15 transition select-none"
          onClick={(e) => { e.stopPropagation(); onNavigate(-1); }}
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
        >
          {isVid ? (
            <video src={src} controls autoPlay className="max-w-[90vw] max-h-[90vh] object-contain rounded select-none" />
          ) : (
            <img src={src} alt={alts[index] || ""} className="max-w-[90vw] max-h-[90vh] object-contain rounded select-none" />
          )}
        </motion.div>
      </AnimatePresence>

      {total > 1 && (
        <button
          className="absolute top-1/2 -translate-y-1/2 right-4 bg-white/6 border border-white/10 text-white text-3xl leading-none px-4 py-2.5 rounded-lg hover:bg-white/15 transition select-none"
          onClick={(e) => { e.stopPropagation(); onNavigate(1); }}
        >
          &#8250;
        </button>
      )}

      {total > 1 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white/50 text-xs font-medium bg-black/40 px-3.5 py-1 rounded-full pointer-events-none">
          {index + 1} / {total}
        </div>
      )}
    </div>
  );
}
