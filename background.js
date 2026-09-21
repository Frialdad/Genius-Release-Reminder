// Shows the number of upcoming saved releases on the toolbar icon.
async function updateBadge() {
  const d = new Date();
  const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const { releases = {} } = await chrome.storage.local.get("releases");
  const count = Object.values(releases).filter((r) => r.date >= today).length;
  await chrome.action.setBadgeText({ text: count ? String(count) : "" });
}

chrome.action.setBadgeBackgroundColor({ color: "#e0245e" });
chrome.action.setBadgeTextColor?.({ color: "#fff" });

chrome.storage.onChanged.addListener(updateBadge);
chrome.runtime.onStartup.addListener(updateBadge);
chrome.runtime.onInstalled.addListener(() => {
  // Re-check hourly so releases drop off the count once their day has passed.
  chrome.alarms.create("badge", { periodInMinutes: 60 });
  updateBadge();
});
chrome.alarms.onAlarm.addListener(updateBadge);
