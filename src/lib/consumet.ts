// Direct streaming API integration
// Priority order: vidsrc.xyz → 2embed → vidsrc.to → embedder.to

export type StreamSource = {
  url: string;
  quality: string;
  isM3U8: boolean;
  isEmbed?: boolean;
  label?: string;
};

export type SubtitleTrack = { url: string; lang: string };

export type StreamResult = {
  sources: StreamSource[];
  subtitles: SubtitleTrack[];
  headers?: Record<string, string>;
};

// ── Direct embed sources (proven to work without key) ──────────────────────

function buildMovieSources(tmdbId: number): StreamSource[] {
  return [
    { url: `https://vidsrc.xyz/embed/movie?tmdb=${tmdbId}`, quality: "HD", isM3U8: false, isEmbed: true, label: "VidSrc XYZ" },
    { url: `https://vidsrc.to/embed/movie/${tmdbId}`, quality: "HD", isM3U8: false, isEmbed: true, label: "VidSrc" },
    { url: `https://2embed.cc/embed/${tmdbId}`, quality: "HD", isM3U8: false, isEmbed: true, label: "2Embed" },
    { url: `https://player.autoembed.cc/embed/movie/${tmdbId}`, quality: "HD", isM3U8: false, isEmbed: true, label: "AutoEmbed" },
    { url: `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`, quality: "HD", isM3U8: false, isEmbed: true, label: "MultiEmbed" },
    { url: `https://moviesapi.club/movie/${tmdbId}`, quality: "HD", isM3U8: false, isEmbed: true, label: "MoviesAPI" },
  ];
}

function buildTVSources(tmdbId: number, season: number, episode: number): StreamSource[] {
  return [
    { url: `https://vidsrc.xyz/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`, quality: "HD", isM3U8: false, isEmbed: true, label: "VidSrc XYZ" },
    { url: `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}`, quality: "HD", isM3U8: false, isEmbed: true, label: "VidSrc" },
    { url: `https://2embed.cc/embed/tv/${tmdbId}/${season}/${episode}`, quality: "HD", isM3U8: false, isEmbed: true, label: "2Embed" },
    { url: `https://player.autoembed.cc/embed/tv/${tmdbId}/${season}/${episode}`, quality: "HD", isM3U8: false, isEmbed: true, label: "AutoEmbed" },
    { url: `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`, quality: "HD", isM3U8: false, isEmbed: true, label: "MultiEmbed" },
    { url: `https://moviesapi.club/tv/${tmdbId}-${season}-${episode}`, quality: "HD", isM3U8: false, isEmbed: true, label: "MoviesAPI" },
  ];
}

export async function getMovieStream(tmdbId: number): Promise<StreamResult> {
  return { sources: buildMovieSources(tmdbId), subtitles: [] };
}

export async function getEpisodeStream(
  tmdbId: number,
  season: number,
  episode: number,
  _title: string
): Promise<StreamResult> {
  return { sources: buildTVSources(tmdbId, season, episode), subtitles: [] };
}
