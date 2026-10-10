import { useRef } from "react";
import { AnimatedBackground } from "@/components/motion-primitives/animated-background";

const TABS = [
  { id: "wall", label: "Muur" },
  { id: "map", label: "Kaart" },
  { id: "world", label: "Wereld" },
];

export default function Header({ view, onViewChange, tripCount, countryCount }) {
  const listRef = useRef(null);

  // Arrow keys move between tabs, as a tablist should.
  function onKeyDown(e) {
    const idx = TABS.findIndex((t) => t.id === view);
    let next = null;
    if (e.key === "ArrowRight") next = TABS[(idx + 1) % TABS.length];
    if (e.key === "ArrowLeft") next = TABS[(idx - 1 + TABS.length) % TABS.length];
    if (e.key === "Home") next = TABS[0];
    if (e.key === "End") next = TABS[TABS.length - 1];
    if (!next) return;
    e.preventDefault();
    onViewChange(next.id);
    listRef.current?.querySelector(`[data-id="${next.id}"]`)?.focus();
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-[54px] flex items-center justify-between gap-3 px-4 sm:px-5 bg-wall/85 backdrop-blur-xl border-b border-line z-[900]">
      <a
        href="#"
        onClick={(e) => { e.preventDefault(); onViewChange("wall"); }}
        className="font-hand text-[23px] sm:text-[26px] leading-none text-ink -rotate-2 shrink-0 no-underline"
        aria-label="Juuls reizen, naar de muur"
      >
        Juuls reizen
      </a>

      <div ref={listRef} className="flex gap-0.5 bg-paper border border-line rounded-full p-[3px] shadow-sm" role="tablist" aria-label="Weergave" onKeyDown={onKeyDown}>
        <AnimatedBackground
          className="bg-ink rounded-full"
          value={view}
          onValueChange={onViewChange}
          transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
        >
          {TABS.map((t) => (
            <button
              key={t.id}
              data-id={t.id}
              role="tab"
              aria-selected={view === t.id}
              tabIndex={view === t.id ? 0 : -1}
              className={`isolate px-3.5 sm:px-4 py-[5px] rounded-full text-xs font-medium tracking-wide whitespace-nowrap transition-colors ${
                view === t.id ? "text-paper" : "text-ink-2 hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </AnimatedBackground>
      </div>

      <div className="text-xs text-ink-2 shrink-0 tabular-nums hidden sm:block">
        <button
          className="hover:text-ink transition-colors underline decoration-dotted decoration-line-h underline-offset-2"
          onClick={() => onViewChange("wall")}
        >
          {tripCount} reizen
        </button>
        <span aria-hidden="true"> · </span>
        <button
          className="hover:text-ink transition-colors underline decoration-dotted decoration-line-h underline-offset-2"
          onClick={() => onViewChange("world")}
        >
          {countryCount} landen
        </button>
      </div>
    </header>
  );
}
