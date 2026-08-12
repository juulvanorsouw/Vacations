import { AnimatedBackground } from "@/components/motion-primitives/animated-background";
import { TextEffect } from "@/components/motion-primitives/text-effect";

const TABS = [
  { id: "map", label: "Kaart" },
  { id: "timeline", label: "Tijdlijn" },
  { id: "world", label: "Wereld" },
];

export default function Header({ view, onViewChange, tripCount, countryCount }) {
  return (
    <header className="fixed top-0 left-0 right-0 h-[54px] flex items-center justify-between px-5 bg-background/82 backdrop-blur-xl border-b border-border z-[900]">
      <span className="font-serif italic text-lg text-gold tracking-wide shrink-0">
        <TextEffect per="char">Juuls reizen</TextEffect>
      </span>

      <div className="flex gap-0.5 bg-card/70 border border-border rounded-full p-[3px]" role="tablist">
        <AnimatedBackground
          className="bg-accent rounded-full"
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
              className={`px-4 py-[5px] rounded-full text-xs font-medium tracking-wide whitespace-nowrap transition-colors ${
                view === t.id ? "text-gold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </AnimatedBackground>
      </div>

      <div className="text-xs text-muted-foreground shrink-0 hidden sm:block">
        <button
          className="underline decoration-dotted decoration-muted-foreground/50 underline-offset-2 hover:text-foreground transition-colors"
          onClick={() => onViewChange("timeline")}
        >
          {tripCount} reizen
        </button>
        &nbsp;·&nbsp;
        <button
          className="underline decoration-dotted decoration-muted-foreground/50 underline-offset-2 hover:text-foreground transition-colors"
          onClick={() => onViewChange("world")}
        >
          {countryCount} landen
        </button>
      </div>
    </header>
  );
}
