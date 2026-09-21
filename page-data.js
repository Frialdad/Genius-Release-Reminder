// Runs in the page's own context (MAIN world) so it can read Genius' preloaded data.
// Hands the result to content.js through a data attribute on <html>.
(() => {
  const toDate = (c) =>
    c && c.year && c.month
      ? `${c.year}-${String(c.month).padStart(2, "0")}-${String(c.day || 1).padStart(2, "0")}`
      : null;

  let info = null;
  try {
    const state = window.__PRELOADED_STATE__;
    const song = state?.songPage && state.entities?.songs?.[state.songPage.song];
    // New React album page (the old one is handled via page_data below).
    const reactAlbum = state?.albumPage && state.entities?.albums?.[state.albumPage.album];
    if (reactAlbum) {
      info = {
        type: "album",
        title: reactAlbum.name,
        artist: reactAlbum.primaryArtistNames,
        date: toDate(reactAlbum.releaseDateComponents),
        exactDay: !!reactAlbum.releaseDateComponents?.day,
        image: reactAlbum.coverArtThumbnailUrl,
        url: reactAlbum.url,
      };
    } else if (song) {
      info = {
        type: "song",
        title: song.title,
        artist: song.artistNames,
        date: toDate(song.releaseDateComponents),
        exactDay: !!song.releaseDateComponents?.day,
        image: song.songArtImageThumbnailUrl,
        url: song.url,
      };
    } else {
      const meta = document.querySelector('meta[itemprop="page_data"]');
      const album = meta && JSON.parse(meta.content).album;
      if (album) {
        info = {
          type: "album",
          title: album.name,
          artist: album.artist?.name || album.primary_artist_names,
          date: toDate(album.release_date_components),
          exactDay: !!album.release_date_components?.day,
          image: album.cover_art_thumbnail_url,
          url: album.url,
        };
      }
    }
  } catch (e) {
    console.warn("[Genius Release Reminder]", e);
  }
  document.documentElement.dataset.geniusRelease = JSON.stringify(info);
})();
