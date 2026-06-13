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
  console.log(`[Streaming] Fetching data for episode_id: ${episodeId}`);
  try {
    const response = await fetch(`${BASE_URL}/stream?api_key=${API_KEY}&episode_id=${episodeId}`);
    if (!response.ok) {
      throw new Error(`Xyra API error: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();

    // Parse the dynamic JSON payload structure
    // Expected structure: { sources: [{ url, quality }], subtitles: [{ url, lang }] }

    return {
      sources: (data.sources || []).map((s: { url: string; quality?: string }) => ({
        url: s.url,
        quality: s.quality || "HD",
        isM3U8: s.url.includes(".m3u8"),
        label: s.quality || "Default",
      })),
      subtitles: (data.subtitles || []).map(
        (sub: { url: string; lang?: string; language?: string }) => ({
          url: sub.url,
          lang: sub.lang || sub.language || "Unknown",
        }),
      ),
      headers: data.headers,
    };
  } catch (error) {
    console.error("[Streaming] Error fetching stream data:", error);
    return { sources: [], subtitles: [] };
  }
}

export async function getMovieStream(tmdbId: number): Promise<StreamResult> {
  // For movies, we use the TMDB ID as the episode_id
  return fetchStream(tmdbId);
}

export async function getEpisodeStream(
  tmdbId: number,
  season: number,
  episode: number,
  _title: string,
): Promise<StreamResult> {
  // For TV episodes, we use the format tmdbId-season-episode
  const episodeId = `${tmdbId}-${season}-${episode}`;
  return fetchStream(episodeId);
}
