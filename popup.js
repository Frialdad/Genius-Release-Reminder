const KEY = "releases";
const pad = (n) => String(n).padStart(2, "0");
const now = new Date();
const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

let releases = {};
let settings = DEFAULT_SETTINGS;
let t = I18N[settings.lang];
let year = now.getFullYear();
let month = now.getMonth(); // 0-based
let selected = null; // "YYYY-MM-DD" or null (= upcoming)

const $ = (id) => document.getElementById(id);
const fmt = (d, opts) => new Date(d + "T00:00").toLocaleDateString(t.locale, opts);

async function load() {
  releases = (await chrome.storage.local.get(KEY))[KEY] || {};
  settings = await getSettings();
  t = I18N[settings.lang];
  applySettings();
  render();
}

function applySettings() {
  document.documentElement.lang = settings.lang;
  if (settings.theme === "system") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = settings.theme;
  document.querySelectorAll("[data-i18n]").forEach((el) => (el.textContent = t[el.dataset.i18n]));
  document.querySelectorAll("[data-i18n-label]").forEach((el) => {
    el.title = t[el.dataset.i18nLabel];
    el.setAttribute("aria-label", t[el.dataset.i18nLabel]);
  });
  for (const name of ["lang", "theme"])
    document.querySelector(`input[name=${name}][value=${settings[name]}]`).checked = true;
  $("weekdays").replaceChildren(...t.weekdays.map((d) => Object.assign(document.createElement("span"), { textContent: d })));
}

function byDate() {
  const map = {};
  for (const r of Object.values(releases)) (map[r.date] ||= []).push(r);
  return map;
}

function render() {
  const map = byDate();
  $("month").textContent = fmt(`${year}-${pad(month + 1)}-01`, { month: "long", year: "numeric" });

  const grid = $("grid");
  grid.replaceChildren();
  const offset = (new Date(year, month, 1).getDay() + 6) % 7; // Monday first
  const days = new Date(year, month + 1, 0).getDate();
  for (let i = 0; i < offset; i++) grid.append(document.createElement("span"));
  for (let d = 1; d <= days; d++) {
    const date = `${year}-${pad(month + 1)}-${pad(d)}`;
    const items = map[date] || [];
    const cell = document.createElement("button");
    cell.className = "day";
    cell.classList.toggle("today", date === today);
    cell.classList.toggle("selected", date === selected);
    cell.classList.toggle("has", items.length > 0);
    cell.textContent = d;
    if (items.length) {
      cell.style.backgroundImage = `url("${items[0].image}")`;
      cell.title = items.map((r) => `${r.artist} – ${r.title}`).join("\n");
      if (items.length > 1) cell.dataset.count = items.length;
    }
    cell.addEventListener("click", () => {
      selected = selected === date ? null : date;
      render();
    });
    grid.append(cell);
  }

  const list = selected
    ? map[selected] || []
    : Object.values(releases).filter((r) => r.date >= today).sort((a, b) => a.date.localeCompare(b.date));
  $("list-title").textContent = selected
    ? fmt(selected, { weekday: "long", day: "numeric", month: "long" })
    : t.upcoming;

  const ul = $("list");
  ul.replaceChildren();
  if (!list.length) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = selected ? t.emptyDay : t.emptyAll;
    ul.append(li);
  }
  for (const r of list) ul.append(item(r));
}

function item(r) {
  const li = document.createElement("li");
  const a = document.createElement("a");
  a.href = r.url;
  a.target = "_blank";
  const img = document.createElement("img");
  img.src = r.image;
  img.alt = "";
  const text = document.createElement("div");
  const title = document.createElement("strong");
  title.textContent = r.title;
  const meta = document.createElement("span");
  const when = r.exactDay ? fmt(r.date, { day: "numeric", month: "short", year: "numeric" })
                          : fmt(r.date, { month: "long", year: "numeric" });
  meta.textContent = `${r.artist} · ${r.type === "album" ? t.album : t.song} · ${when}`;
  text.append(title, meta);
  a.append(img, text);

  const del = document.createElement("button");
  del.className = "del";
  del.textContent = "×";
  del.title = t.remove;
  del.addEventListener("click", async () => {
    delete releases[r.url];
    await chrome.storage.local.set({ [KEY]: releases });
  });
  li.append(a, del);
  return li;
}

function shift(delta) {
  month += delta;
  if (month < 0) { month = 11; year--; }
  if (month > 11) { month = 0; year++; }
  selected = null;
  render();
}

function showSettings(open) {
  $("settings").hidden = !open;
  $("calendar").hidden = open;
}

$("prev").addEventListener("click", () => shift(-1));
$("next").addEventListener("click", () => shift(1));
$("open-settings").addEventListener("click", () => showSettings(true));
$("close-settings").addEventListener("click", () => showSettings(false));
$("settings").addEventListener("change", (e) =>
  chrome.storage.local.set({ settings: { ...settings, [e.target.name]: e.target.value } }));
chrome.storage.onChanged.addListener(load);
load();
