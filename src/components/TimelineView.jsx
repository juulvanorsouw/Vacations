import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollFade } from "@/components/ui/scroll-fade";
import { InView } from "@/components/motion-primitives/in-view";
import FlagImg from "@/components/FlagImg";
import { formatDateRange } from "@/lib/helpers";

export default function TimelineView({ vacations, onOpenModal }) {
  const [yearFilter, setYearFilter] = useState(null);

  const years = useMemo(() => {
    const seen = new Set();
    const list = [];
    vacations.forEach((v) => {
      const y = (v.startDate || "").slice(0, 4);
      if (y && !seen.has(y)) { seen.add(y); list.push(y); }
    });
    return list;
  }, [vacations]);

  const filtered = yearFilter ? vacations.filter((v) => (v.startDate || "").startsWith(yearFilter)) : vacations;

  const grouped = useMemo(() => {
    const g = {};
    filtered.forEach((v) => {
      const y = (v.startDate || "?").slice(0, 4);
      (g[y] ||= []).push(v);
    });
    return g;
  }, [filtered]);
  const groupYears = Object.keys(grouped).sort().reverse();

  return (
    <div className="max-w-[860px] mx-auto px-7 pt-8 pb-20">
      <ScrollFade axis="horizontal" className="mb-7">
        <div className="flex gap-1.5">
          <FilterChip active={!yearFilter} onClick={() => setYearFilter(null)}>Alle reizen</FilterChip>
          {years.map((y) => (
            <FilterChip key={y} active={yearFilter === y} onClick={() => setYearFilter(y)}>{y}</FilterChip>
          ))}
        </div>
      </ScrollFade>

      <div className="relative pl-[30px] before:content-[''] before:absolute before:left-[7px] before:top-2 before:bottom-2 before:w-px before:bg-gradient-to-b before:from-gold before:to-transparent before:opacity-30">
        {groupYears.map((y) => (
          <div key={y}>
            <div className="text-[10px] font-semibold tracking-[.14em] uppercase text-muted-foreground pt-2 pb-3 mt-2">{y}</div>
            {grouped[y].map((v, i) => (
              <InView key={v.id} transition={{ duration: 0.3, delay: (i % 8) * 0.04 }}>
                <TlItem v={v} onOpen={() => onOpenModal(v.id)} />
              </InView>
            ))}
          </div>
        ))}

        {!filtered.length && (
          <div className="mt-6 bg-card border border-border rounded-2xl p-8 text-center text-muted-foreground">
            Geen reizen gevonden.
          </div>
        )}
      </div>
    </div>
  );
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-accent text-gold border-gold/30"
          : "bg-card border-border text-muted-foreground hover:border-border-h hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function TlItem({ v, onOpen }) {
  const route = v.route?.length > 1 ? v.route.map((p) => p.name || "").filter(Boolean).join(" → ") : null;
  const cnt = (v.pictures || []).length;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } }}
      className="relative mb-2.5 bg-card border border-border rounded-2xl px-[18px] py-4 cursor-pointer transition-all hover:-translate-y-0.5 hover:border-border-h hover:shadow-lg
                 before:content-[''] before:absolute before:-left-[27px] before:top-5 before:w-2.5 before:h-2.5 before:rounded-full before:bg-gold
                 before:shadow-[0_0_0_3px_var(--bg),0_0_0_5px_rgba(200,160,96,.2)]"
    >
      <h3 className="mb-1 text-[15px] font-medium flex items-center justify-between gap-2 -tracking-wide">
        <span className="flex items-center">
          <FlagImg iso={v.country} className="w-[22px] h-[15px] mr-1.5" />
          {v.title}
        </span>
        <Badge variant={cnt ? "default" : "secondary"} className={cnt ? "bg-accent text-gold border-gold/30" : "bg-secondary text-muted-foreground border-border"}>
          {cnt ? `📷 ${cnt}` : "Geen foto's"}
        </Badge>
      </h3>
      <div className="text-muted-foreground text-xs mb-1.5">{formatDateRange(v.startDate, v.endDate)}</div>
      <p className="text-[#907860] text-[13px] leading-relaxed">{v.description}</p>
      {route && <div className="mt-2 text-[11px] text-muted-2">Route: {route}</div>}
    </div>
  );
}
