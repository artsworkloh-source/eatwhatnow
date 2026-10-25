// Shared by index.html and privacy.html so both pages follow the phone language the same way.
function pickLang() {
  const first = ((navigator.languages && navigator.languages[0]) || navigator.language || "").toLowerCase();
  if (first.startsWith("zh")) return "zh";
  if (first.startsWith("ms") || first.startsWith("id")) return "ms";
  return "en";
}
const LANG = pickLang();
document.documentElement.lang = { zh: "zh-CN", en: "en", ms: "ms" }[LANG];
