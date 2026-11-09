const TEXT = {
  zh: {
    title: "今天吃什么",
    meal: { breakfast: "现在是早餐时间", lunch: "现在是午餐时间", dinner: "现在是晚餐时间" },
    pick: "今天吃什么？",
    map: "📍 去找附近的店",
    hint: "在谷歌地图里可导航、打电话、看路况",
    again: "换一个",
    install: "加到主屏幕，下次一点就开",
    installAdd: "添加",
    close: "关闭",
    iosSteps: "点浏览器的「分享」按钮，再点「添加到主屏幕」",
    menuSteps: "点浏览器菜单，再点「添加到主屏幕」",
    privacy: "隐私政策",
    prefQ: "饮食有偏好吗？",
    halal: "清真",
    veg: "素食",
    mild: "少辣",
    any: "什么都吃",
    prefSave: "确定",
    prefOpen: "改偏好",
    halalNote: "这是按菜式筛的，店是否清真请在地图里自己确认。",
    empty: "这个时段没有合适的菜。可以改偏好，或换个时段再试。",
    emptyBtn: "改偏好"
  },
  en: {
    title: "What to Eat Today",
    meal: { breakfast: "It's breakfast time", lunch: "It's lunch time", dinner: "It's dinner time" },
    pick: "What to eat?",
    map: "📍 Find places nearby",
    hint: "Navigate, call and check traffic in Google Maps",
    again: "Try another",
    install: "Add it to your home screen",
    installAdd: "Add",
    close: "Close",
    iosSteps: "Tap Share, then “Add to Home Screen”",
    menuSteps: "Open the browser menu, then “Add to Home screen”",
    privacy: "Privacy",
    prefQ: "Any food preferences?",
    halal: "Halal",
    veg: "Vegetarian",
    mild: "Less spicy",
    any: "Eat anything",
    prefSave: "OK",
    prefOpen: "Preferences",
    halalNote: "Filtered by dish. Check in Maps if a shop is halal.",
    empty: "No match for this meal time. Change your preference, or try another time.",
    emptyBtn: "Change preference"
  },
  ms: {
    title: "Makan Apa Hari Ini",
    meal: { breakfast: "Sekarang waktu sarapan", lunch: "Sekarang waktu makan tengah hari", dinner: "Sekarang waktu makan malam" },
    pick: "Makan apa?",
    map: "📍 Cari kedai berdekatan",
    hint: "Navigasi, telefon dan semak trafik di Google Maps",
    again: "Tukar lain",
    install: "Letak di skrin utama",
    installAdd: "Tambah",
    close: "Tutup",
    iosSteps: "Tekan Kongsi, kemudian “Tambah ke Skrin Utama”",
    menuSteps: "Buka menu pelayar, kemudian “Tambah ke skrin utama”",
    privacy: "Privasi",
    prefQ: "Ada pilihan makanan?",
    halal: "Halal",
    veg: "Vegetarian",
    mild: "Kurang pedas",
    any: "Makan apa saja",
    prefSave: "Ok",
    prefOpen: "Pilihan",
    halalNote: "Ditapis ikut masakan. Sahkan sendiri di peta sama ada kedai itu halal.",
    empty: "Tiada pilihan untuk waktu ini. Tukar pilihan, atau cuba waktu lain.",
    emptyBtn: "Tukar pilihan"
  }
};

const DIET_KEY = "diet";

function loadDiet() {
  try {
    const raw = localStorage.getItem(DIET_KEY);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    if (!saved || typeof saved !== "object") return null;
    return { any: !!saved.any, halal: !!saved.halal, veg: !!saved.veg, mild: !!saved.mild };
  } catch {
    return null;
  }
}

// Chosen boxes stay on the phone. Nothing here is sent to the counter.
let diet = loadDiet();

function mealForTime(date) {
  const minutes = date.getHours() * 60 + date.getMinutes();
  if (minutes >= 5 * 60 && minutes < 10 * 60 + 30) return "breakfast";
  if (minutes >= 10 * 60 + 30 && minutes < 16 * 60) return "lunch";
  return "dinner";
}

function foodOk(food) {
  if (!diet || diet.any) return true;
  if (diet.halal && !food.halal) return false;
  if (diet.veg && !food.veg) return false;
  if (diet.mild && food.spicy) return false;
  return true;
}

function mapsUrl(food) {
  // "near me" makes Google Maps rank results around the phone's current location.
  // Extra words only narrow the search. They do not mean a shop is certified.
  let query = food.mapQuery;
  if (diet && diet.halal) query += " halal";
  if (diet && diet.veg) query += " vegetarian";
  return "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(query + " near me");
}

const text = TEXT[LANG];
const mealLabel = document.getElementById("meal-label");
const themeColor = document.querySelector('meta[name="theme-color"]');
const pickButton = document.getElementById("pick");
const card = document.getElementById("result");
const nameEl = card.querySelector(".name");
const againButton = document.getElementById("again");
const mapLink = document.getElementById("map-link");
const halalNote = card.querySelector(".halal-note");
const emptyCard = document.getElementById("empty");
const prefScreen = document.getElementById("pref");
const appScreen = document.getElementById("app");
const prefSave = document.getElementById("pref-save");

let current = null;
let draft = { any: false, halal: false, veg: false, mild: false };

document.title = text.title;
pickButton.textContent = text.pick;
mapLink.textContent = text.map;
card.querySelector(".hint").textContent = text.hint;
againButton.textContent = text.again;
halalNote.textContent = text.halalNote;
document.getElementById("privacy-link").textContent = text.privacy;
document.getElementById("pref-q").textContent = text.prefQ;
prefSave.textContent = text.prefSave;
document.getElementById("pref-open").textContent = text.prefOpen;
emptyCard.querySelector(".empty-text").textContent = text.empty;
document.getElementById("empty-pref").textContent = text.emptyBtn;
for (const chip of prefScreen.querySelectorAll(".chip")) chip.textContent = text[chip.dataset.pref];

function showMeal() {
  const meal = mealForTime(new Date());
  mealLabel.textContent = text.meal[meal];
  document.body.dataset.meal = meal;
  themeColor.content = getComputedStyle(document.body).getPropertyValue("--bg").trim();
  return meal;
}

// Long names stay on one line: shrink the font by exactly the overflow ratio.
function fitName() {
  nameEl.style.fontSize = "";
  if (nameEl.scrollWidth > nameEl.clientWidth) {
    nameEl.style.fontSize = Math.floor(40 * nameEl.clientWidth / nameEl.scrollWidth) + "px";
  }
}

function showFood(food) {
  card.querySelector(".emoji").textContent = food.emoji;
  nameEl.textContent = food.name[LANG];
  card.querySelector(".desc").textContent = food.desc[LANG];
  mapLink.href = mapsUrl(food);
  halalNote.hidden = !(diet && diet.halal);
  pickButton.hidden = true;
  emptyCard.hidden = true;
  // Re-showing the card restarts its pop animation, also on "换一个".
  card.hidden = true;
  void card.offsetWidth;
  card.hidden = false;
  fitName();
  installTip.hidden = !installTipWanted();
}

function showEmpty() {
  current = null;
  pickButton.hidden = true;
  card.hidden = true;
  emptyCard.hidden = true;
  void emptyCard.offsetWidth;
  emptyCard.hidden = false;
  installTip.hidden = !installTipWanted();
}

function pick() {
  // Re-read the clock on every tap so a page left open still follows the current meal.
  const meal = showMeal();
  const all = FOODS[meal].filter(foodOk);
  if (!all.length) {
    showEmpty();
    return;
  }
  let choices = all.filter((food) => food !== current);
  if (!choices.length) choices = all;
  current = choices[Math.floor(Math.random() * choices.length)];
  showFood(current);
}

function paintPref() {
  for (const chip of prefScreen.querySelectorAll(".chip")) {
    const on = !!draft[chip.dataset.pref];
    chip.classList.toggle("on", on);
    chip.setAttribute("aria-pressed", on ? "true" : "false");
  }
  prefSave.disabled = !(draft.any || draft.halal || draft.veg || draft.mild);
}

function openPref() {
  draft = diet
    ? { any: diet.any, halal: diet.halal, veg: diet.veg, mild: diet.mild }
    : { any: false, halal: false, veg: false, mild: false };
  paintPref();
  appScreen.hidden = true;
  prefScreen.hidden = false;
}

// "什么都吃" clears the other boxes, and any other box clears "什么都吃".
prefScreen.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  const key = chip.dataset.pref;
  if (key === "any") {
    const on = !draft.any;
    draft.any = on;
    draft.halal = false;
    draft.veg = false;
    draft.mild = false;
  } else {
    draft[key] = !draft[key];
    if (draft[key]) draft.any = false;
  }
  paintPref();
});

const INSTALL_KEY = "installTipClosed";
const installTip = document.getElementById("install");
const installText = installTip.querySelector(".install-text");
const installAdd = installTip.querySelector(".install-add");
const installClose = installTip.querySelector(".install-close");
installText.textContent = text.install;
installAdd.textContent = text.installAdd;
installClose.setAttribute("aria-label", text.close);
let installPrompt = null;

// localStorage throws in some private-browsing modes; then the tip simply isn't remembered.
function rememberInstallTipClosed() {
  try { localStorage.setItem(INSTALL_KEY, "1"); } catch {}
}
function installTipWanted() {
  const installed = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  let closed = false;
  try { closed = localStorage.getItem(INSTALL_KEY) === "1"; } catch {}
  return !installed && !closed;
}

// Android/Chrome offers a native install dialog; keep it for our own button instead of its banner.
addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  installPrompt = e;
});
installAdd.addEventListener("click", () => {
  rememberInstallTipClosed();
  if (installPrompt) {
    installPrompt.prompt();
    installPrompt = null;
    installTip.hidden = true;
    return;
  }
  // iPhone Safari has no install dialog, so explain the Share-menu steps instead.
  const ios = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  installText.textContent = ios ? text.iosSteps : text.menuSteps;
  installAdd.hidden = true;
});
installClose.addEventListener("click", () => {
  rememberInstallTipClosed();
  installTip.hidden = true;
});

// Anonymous totals only. The name is the whole event; nothing about the person is sent.
function countEvent(name) {
  const send = () => {
    if (!window.goatcounter || !window.goatcounter.count) return false;
    window.goatcounter.count({ path: name, title: name, event: true, no_session: true });
    return true;
  };
  if (send()) return;
  const wait = setInterval(() => { if (send()) clearInterval(wait); }, 200);
  setTimeout(() => clearInterval(wait), 5000);
}

prefSave.addEventListener("click", () => {
  diet = {
    any: draft.any,
    halal: draft.any ? false : draft.halal,
    veg: draft.any ? false : draft.veg,
    mild: draft.any ? false : draft.mild
  };
  try { localStorage.setItem(DIET_KEY, JSON.stringify(diet)); } catch {}
  // Event name only. Which boxes were ticked is not part of it.
  countEvent("保存偏好");
  current = null;
  card.hidden = true;
  emptyCard.hidden = true;
  pickButton.hidden = false;
  prefScreen.hidden = true;
  appScreen.hidden = false;
  showMeal();
});
document.getElementById("pref-open").addEventListener("click", openPref);
document.getElementById("empty-pref").addEventListener("click", openPref);

// Let the 0.2s press bounce finish before the button turns into the card.
pickButton.addEventListener("click", () => {
  pickButton.classList.add("press");
  countEvent("大按钮");
});
pickButton.addEventListener("animationend", (e) => {
  if (e.animationName !== "press") return;
  pickButton.classList.remove("press");
  pick();
});
againButton.addEventListener("click", pick);

// Android Chrome fires this when the site is added to the home screen.
addEventListener("appinstalled", () => countEvent("安装到主屏幕"));

// iPhone has no install event, so an open from the home screen icon is the signal.
// sessionStorage keeps it to one count per visit; a new open starts a new session.
if (matchMedia("(display-mode: standalone)").matches || navigator.standalone === true) {
  let counted = false;
  try { counted = sessionStorage.getItem("home-open") === "1"; } catch {}
  if (!counted) {
    try { sessionStorage.setItem("home-open", "1"); } catch {}
    countEvent("主屏幕打开");
  }
}

showMeal();
if (!diet) openPref();
else appScreen.hidden = false;
