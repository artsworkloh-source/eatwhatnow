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
    privacy: "隐私政策"
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
    privacy: "Privacy"
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
    privacy: "Privasi"
  }
};
function mealForTime(date) {
  const minutes = date.getHours() * 60 + date.getMinutes();
  if (minutes >= 5 * 60 && minutes < 10 * 60 + 30) return "breakfast";
  if (minutes >= 10 * 60 + 30 && minutes < 16 * 60) return "lunch";
  return "dinner";
}

function mapsUrl(food) {
  // "near me" makes Google Maps rank results around the phone's current location.
  const query = encodeURIComponent(food.mapQuery + " near me");
  return "https://www.google.com/maps/search/?api=1&query=" + query;
}

const text = TEXT[LANG];
const mealLabel = document.getElementById("meal-label");
const themeColor = document.querySelector('meta[name="theme-color"]');
const pickButton = document.getElementById("pick");
const card = document.getElementById("result");
const nameEl = card.querySelector(".name");
const againButton = document.getElementById("again");
const mapLink = document.getElementById("map-link");

let current = null;

document.title = text.title;
pickButton.textContent = text.pick;
mapLink.textContent = text.map;
card.querySelector(".hint").textContent = text.hint;
againButton.textContent = text.again;
document.getElementById("privacy-link").textContent = text.privacy;

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
  pickButton.hidden = true;
  // Re-showing the card restarts its pop animation, also on "换一个".
  card.hidden = true;
  void card.offsetWidth;
  card.hidden = false;
  fitName();
  installTip.hidden = !installTipWanted();
}

function pick() {
  // Re-read the clock on every tap so a page left open still follows the current meal.
  const meal = showMeal();
  const choices = FOODS[meal].filter((f) => f !== current);
  current = choices[Math.floor(Math.random() * choices.length)];
  showFood(current);
}

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

// Let the 0.2s press bounce finish before the button turns into the card.
pickButton.addEventListener("click", () => pickButton.classList.add("press"));
pickButton.addEventListener("animationend", (e) => {
  if (e.animationName !== "press") return;
  pickButton.classList.remove("press");
  pick();
});
againButton.addEventListener("click", pick);
showMeal();
