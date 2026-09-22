# Genius Release Reminder

A Chrome extension to keep track of upcoming releases on [Genius](https://genius.com). Save a song or album from its page and see all your saved releases on a calendar.

![icon](icons/icon128.png)

## Features

- **Bell button on Genius pages** – on song and album pages a small bell appears under the ⚡ icon. Hover it to see the release date and whether the page is already saved; click to add or remove it.
- **Automatic release date** – the date is read from the page's own metadata. If Genius has no date, the extension asks you to pick one before saving.
- **Only upcoming releases** – the bell is hidden on pages whose release date has already passed and on `-annotated` pages (they are not songs).
- **Calendar popup** – click the extension icon to see a monthly calendar with the cover art of each saved release, the list of upcoming releases, and the releases of any day you click. Items can be opened or removed from there.
- **Toolbar badge** – the extension icon shows how many upcoming releases you have saved (like Tampermonkey does with scripts). Releases drop off the count once their day has passed.
- **Settings** – language (English by default, or Spanish) and theme (system, light or dark).

## Installation

The extension is not on the Chrome Web Store; load it unpacked:

1. Download or clone this folder.
2. Open `chrome://extensions` in Chrome (or any Chromium browser: Edge, Brave, Opera…).
3. Turn on **Developer mode** (top right).
4. Click **Load unpacked** and select this folder.
5. Pin the extension to the toolbar if you want quick access to the calendar.

After changing any file, press the reload button (↻) on the extension card and refresh the Genius tab.

Requires Chrome 111 or newer.

## Usage

1. Open a song or album page on Genius that hasn't been released yet.
2. Click the bell under the ⚡ icon (next to the title on pages without it). The bell turns yellow when the release is saved.
3. Click the extension icon to open the calendar. Use ‹ › to change month, click a day to see its releases, and the gear to open settings.

## Permissions

- `storage` – saves your releases and settings locally in the browser (`chrome.storage.local`). Nothing is sent anywhere.
- `alarms` – re-checks the badge count every hour so past releases stop being counted, and fires the daily reminder at the time you choose.
- `notifications` – shows the optional daily reminder with tomorrow's releases. Off by default.
- Content scripts run only on `https://genius.com/*`.

## Project structure

| File | Purpose |
| --- | --- |
| `manifest.json` | Extension manifest (Manifest V3). |
| `background.js` | Service worker that keeps the toolbar badge count up to date and sends the daily reminder notification. |
| `page-data.js` | Runs in the page context and reads Genius' data (`window.__PRELOADED_STATE__` or the `page_data` meta tag) to get title, artist, cover and release date. |
| `content.js` / `content.css` | Adds the bell button and its hover card to Genius pages. |
| `popup.html` / `popup.js` / `popup.css` | Calendar and settings popup. |
| `i18n.js` | English and Spanish texts, and default settings. |
| `icons/` | Logo (`logo.svg`) and PNG icons at 16, 32, 48 and 128 px. |

## Known limitations

- Genius changes its page layout from time to time; if the bell stops appearing, the selectors in `content.js` or the data paths in `page-data.js` may need updating.
