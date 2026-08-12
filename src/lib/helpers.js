export function joinPath(folder, file) {
  const f = (folder || "").replace(/\/+$/, "");
  const g = String(file).replace(/^\/+/, "");
  return f ? f + "/" + g : g;
}

export function flagSrc(iso) {
  if (!iso || iso.length !== 2) return null;
  return "https://flagcdn.com/" + iso.toLowerCase() + ".svg";
}

export function formatDateRange(start, end) {
  if (!start && !end) return "";
  const s = start ? new Date(start) : null;
  const e = end ? new Date(end) : null;
  const opts = { year: "numeric", month: "short", day: "numeric" };
  const loc = "nl-NL";
  if (s && e) {
    if (s.getFullYear() === e.getFullYear() && s.getMonth() === e.getMonth()) {
      return `${s.getDate()}–${e.getDate()} ${s.toLocaleDateString(loc, { month: "short" })} ${s.getFullYear()}`;
    }
    return `${s.toLocaleDateString(loc, opts)} – ${e.toLocaleDateString(loc, opts)}`;
  }
  return (s || e).toLocaleDateString(loc, opts);
}

export function tripCountryCodes(v) {
  return Array.isArray(v.countries) ? v.countries : v.country ? [v.country] : [];
}

export function visitedCountrySet(vacations) {
  const set = new Set();
  vacations.forEach((v) => tripCountryCodes(v).forEach((c) => set.add(c.toUpperCase())));
  return set;
}
