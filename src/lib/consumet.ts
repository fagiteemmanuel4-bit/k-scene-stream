// Direct streaming API integration with Xyra.stream
// Core Base Route: https://xyra.stream
// URL format: https://xyra.stream/stream?api_key=freekey&episode_id=[EPISODE_ID]

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

const BASE_URL = "https://xyra.stream";
const API_KEY = "freekey";

async function fetchStream(episodeId: string | number): Promise<StreamResult> {
  console.log(`[Streaming] Attempting to fetch data for episode_id: ${episodeId}`);
  try {
    const response = await fetch(`${BASE_URL}/stream?api_key=${API_KEY}&episode_id=${episodeId}`);
    if (!response.ok) {
      console.warn(`[Streaming] Xyra API error for ${episodeId}: ${response.status}`);
      return { sources: [], subtitles: [] };
    }
    const data = await response.json();

    const sources = (data.sources || []).map((s: { url: string; quality?: string }) => ({
      url: s.url,
      quality: s.quality || "HD",
      isM3U8: s.url.includes(".m3u8"),
      label: s.quality || "Default",
    }));

    if (sources.length === 0) {
      console.log(`[Streaming] No sources found for episode_id: ${episodeId}`);
    } else {
      console.log(`[Streaming] Successfully found ${sources.length} sources for ${episodeId}`);
    }

    return {
      sources,
      subtitles: (data.subtitles || []).map(
        (sub: { url: string; lang?: string; language?: string }) => ({
          url: sub.url,
          lang: sub.lang || sub.language || "Unknown",
        }),
      ),
      headers: data.headers,
    };
  } catch (error) {
    console.error(`[Streaming] Critical error for ${episodeId}:`, error);
    return { sources: [], subtitles: [] };
  }
}

export async function getMovieStream(tmdbId: number): Promise<StreamResult> {
  // Primary attempt
  const res = await fetchStream(tmdbId);
  if (res.sources.length > 0) return res;

  // Fallback variations if needed
  console.log(`[Streaming] Trying movie fallback for TMDB ${tmdbId}`);
  return fetchStream(`movie-${tmdbId}`);
}

export async function getEpisodeStream(
  tmdbId: number,
  season: number,
  episode: number,
  _title: string,
): Promise<StreamResult> {
  // Primary: tmdbId-season-episode
  const primaryId = `${tmdbId}-${season}-${episode}`;
  let res = await fetchStream(primaryId);
  if (res.sources.length > 0) return res;

  // Fallback 1: tv-tmdbId-season-episode
  console.log(`[Streaming] Trying TV fallback 1 for ${primaryId}`);
  res = await fetchStream(`tv-${tmdbId}-${season}-${episode}`);
  if (res.sources.length > 0) return res;

  // Fallback 2: tmdbId
  console.log(`[Streaming] Trying TV fallback 2 (ID only) for ${tmdbId}`);
  return fetchStream(tmdbId);
}
