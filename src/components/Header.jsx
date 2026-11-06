import { useRef } from "react";
import { t, LANGS } from "@/lib/i18n";

const TABS = ["wall", "map", "world"];

export default function Header({ view, onViewChange, tripCount, countryCount, lang, onLangChange }) {
  const listRef = useRef(null);

  // Arrow keys move between tabs, as a tablist should.
  function onKeyDown(e) {
    const idx = TABS.indexOf(view);
    let next = null;
    if (e.key === "ArrowRight") next = TABS[(idx + 1) % TABS.length];
    if (e.key === "ArrowLeft") next = TABS[(idx - 1 + TABS.length) % TABS.length];
    if (e.key === "Home") next = TABS[0];
    if (e.key === "End") next = TABS[TABS.length - 1];
    if (!next) return;
    e.preventDefault();
    onViewChange(next);
    listRef.current?.querySelector(`[data-id="${next}"]`)?.focus();
  }

  return (
    <header className="fixed top-0 inset-x-0 z-[900] bg-wall/90 backdrop-blur-xl border-b border-line pt-[env(safe-area-inset-top)]">
      <div className="h-[54px] flex items-center justify-between gap-3 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] sm:px-5">
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); onViewChange("wall"); }}
          className="font-hand text-[22px] sm:text-[26px] leading-none text-ink -rotate-2 shrink-0 no-underline"
          aria-label={t("homeLabel")}
        >
          {t("siteName")}
        </a>

        {/* Text tabs with a red underline: the one pill on a screen is kept for its main action. */}
        <div ref={listRef} className="flex gap-4 sm:gap-6 h-full" role="tablist" aria-label={t("views")} onKeyDown={onKeyDown}>
          {TABS.map((id) => (
            <button
              key={id}
              data-id={id}
              role="tab"
              aria-selected={view === id}
              tabIndex={view === id ? 0 : -1}
              onClick={() => onViewChange(id)}
              className={`relative h-full text-[13px] sm:text-sm font-medium transition-colors ${view === id ? "text-ink" : "text-ink-2 hover:text-ink"}`}
            >
              {t(id)}
              <span
                aria-hidden="true"
                className={`absolute left-0 right-0 -bottom-px h-[2px] rounded-full bg-pin transition-transform duration-200 origin-center ${view === id ? "scale-x-100" : "scale-x-0"}`}
              />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 shrink-0 text-xs text-ink-2 tabular-nums">
          <span className="hidden md:inline">
            <button className="hover:text-ink transition-colors" onClick={() => onViewChange("wall")}>{t("trips", tripCount)}</button>
            <span aria-hidden="true"> · </span>
            <button className="hover:text-ink transition-colors" onClick={() => onViewChange("world")}>{t("countries", countryCount)}</button>
          </span>
          <div className="flex items-center gap-1.5" role="group" aria-label={t("language")}>
            {LANGS.map((l, i) => (
              <span key={l} className="flex items-center gap-1.5">
                {i > 0 && <span aria-hidden="true" className="text-line-h">/</span>}
                <button
                  onClick={() => onLangChange(l)}
                  aria-pressed={lang === l}
                  lang={l}
                  className={`uppercase py-1 transition-colors ${lang === l ? "text-ink font-semibold" : "hover:text-ink"}`}
                >
                  {l}
                </button>
              </span>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
