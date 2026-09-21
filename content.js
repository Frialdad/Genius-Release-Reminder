const KEY = "releases";
let info = null;
let t = I18N.en;

const BELL = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>`;

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function init() {
  const raw = document.documentElement.dataset.geniusRelease;
  if (raw === undefined) return setTimeout(init, 200); // page-data.js not done yet
  info = JSON.parse(raw);
  if (!info) return; // not a song/album page
  if (location.pathname.endsWith("-annotated")) return; // annotated docs, not songs
  if (info.date && info.date < today()) return; // already released, nothing to remind
  ensureButton();
  // Genius' React header can re-render and drop our button; put it back.
  setInterval(ensureButton, 1000);
  chrome.storage.onChanged.addListener(render);
}

function ensureButton() {
  if (document.getElementById("gr-root")) return;
  // Under the pyong icon
  const pyong = document.querySelector('[class*="Header-desktop__PyongWrapper"]');
  const oldPyong = document.querySelector(".header_with_cover_art-pyong_button");
  const h1 = document.querySelector("h1");
  const parent = pyong || oldPyong || h1;
  if (!parent) return;

  const root = document.createElement("div");
  root.id = "gr-root";
  root.className = pyong ? "gr-under-pyong" : oldPyong ? "gr-old-pyong" : "gr-inline";
  root.innerHTML = `<button id="gr-btn" type="button">${BELL}</button><div id="gr-pop"><strong></strong><span></span></div>`;
  // Keep our clicks/hovers from reaching Genius' pyong button and its tooltip.
  for (const type of ["click", "mouseover", "mouseout"]) root.addEventListener(type, (e) => e.stopPropagation());
  root.querySelector("#gr-btn").addEventListener("click", toggle);
  parent.appendChild(root);
  render();
}

async function getReleases() {
  return (await chrome.storage.local.get(KEY))[KEY] || {};
}

function fmt(date, exactDay) {
  return new Date(date + "T00:00").toLocaleDateString(t.locale,
    exactDay ? { day: "numeric", month: "long", year: "numeric" } : { month: "long", year: "numeric" });
}

async function render() {
  const root = document.getElementById("gr-root");
  if (!root) return;
  t = I18N[(await getSettings()).lang];
  const saved = (await getReleases())[info.url];
  const date = saved?.date || info.date;
  const btn = root.querySelector("#gr-btn");
  btn.classList.toggle("gr-saved", !!saved);
  btn.setAttribute("aria-label", saved ? t.popSaved : t.popAdd);
  root.querySelector("#gr-pop strong").textContent = saved ? t.popSaved : t.popAdd;
  root.querySelector("#gr-pop span").textContent = date
    ? t.popDate.replace("{date}", fmt(date, saved ? saved.exactDay : info.exactDay)) + (saved ? ` · ${t.popRemove}` : "")
    : t.popNoDate;
}

// Keep the card visible for a moment after an action so the change is noticed.
function flash() {
  const root = document.getElementById("gr-root");
  root.classList.add("gr-open");
  clearTimeout(flash.timer);
  flash.timer = setTimeout(() => root.classList.remove("gr-open"), 1800);
}

async function save(date, exactDay) {
  const releases = await getReleases();
  releases[info.url] = { ...info, date, exactDay, addedAt: Date.now() };
  await chrome.storage.local.set({ [KEY]: releases }); // onChanged triggers render
}

async function toggle() {
  const releases = await getReleases();
  if (releases[info.url]) {
    delete releases[info.url];
    await chrome.storage.local.set({ [KEY]: releases });
  } else if (info.date) {
    await save(info.date, info.exactDay);
  } else {
    return askDate();
  }
  flash();
}

// No release date on Genius: let the user pick one before saving.
function askDate() {
  const root = document.getElementById("gr-root");
  let input = document.getElementById("gr-date");
  if (!input) {
    input = document.createElement("input");
    input.type = "date";
    input.id = "gr-date";
    input.min = today();
    input.setAttribute("aria-label", t.pickDate);
    input.addEventListener("change", async () => {
      if (!input.value || input.value < today()) return;
      await save(input.value, true);
      input.remove();
      root.classList.remove("gr-picking");
      flash();
    });
    root.querySelector("#gr-pop").append(input);
  }
  root.classList.add("gr-picking");
  input.focus();
  try { input.showPicker(); } catch {}
}

// Close the date picker card when clicking elsewhere.
document.addEventListener("click", () => {
  document.getElementById("gr-root")?.classList.remove("gr-picking");
  document.getElementById("gr-date")?.remove();
});

init();
