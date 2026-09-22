importScripts("i18n.js");

const pad = (n) => String(n).padStart(2, "0");
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// Shows the number of upcoming saved releases on the toolbar icon.
async function updateBadge() {
  const today = ymd(new Date());
  const { releases = {} } = await chrome.storage.local.get("releases");
  const count = Object.values(releases).filter((r) => r.date >= today).length;
  await chrome.action.setBadgeText({ text: count ? String(count) : "" });
}

// Schedules the daily "tomorrow's releases" alarm at the user's chosen time.
async function scheduleNotify() {
  await chrome.alarms.clear("notify");
  const { notify, notifyTime } = await getSettings();
  if (!notify || !notifyTime) return;
  const [h, m] = notifyTime.split(":").map(Number);
  const next = new Date();
  next.setHours(h, m, 0, 0);
  if (next <= Date.now()) next.setDate(next.getDate() + 1);
  chrome.alarms.create("notify", { when: next.getTime() });
}

async function notifyTomorrow() {
  const settings = await getSettings();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const date = ymd(tomorrow);
  const { releases = {} } = await chrome.storage.local.get("releases");
  const list = Object.values(releases).filter((r) => r.date === date && r.exactDay);
  if (list.length && settings.notify && settings.notifyTime)
    chrome.notifications.create(`releases-${date}`, {
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: I18N[settings.lang].notifyTitle,
      message: list.map((r) => `${r.artist} – ${r.title}`).join("\n"),
    });
}

chrome.action.setBadgeBackgroundColor({ color: "#e0245e" });
chrome.action.setBadgeTextColor?.({ color: "#fff" });

chrome.storage.onChanged.addListener((changes) => {
  updateBadge();
  if (changes.settings) scheduleNotify();
});
chrome.runtime.onStartup.addListener(updateBadge);
chrome.runtime.onInstalled.addListener(() => {
  // Re-check hourly so releases drop off the count once their day has passed.
  chrome.alarms.create("badge", { periodInMinutes: 60 });
  updateBadge();
  scheduleNotify();
});
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== "notify") return updateBadge();
  await notifyTomorrow();
  scheduleNotify();
});
