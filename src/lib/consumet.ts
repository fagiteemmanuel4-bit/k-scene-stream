// Bridge to the Python Moviebox Server
const MOVIEBOX_API = import.meta.env.VITE_MOVIEBOX_API_URL || "";

export type StreamSource = {
  url: string;
  quality: string;
  isM3U8: boolean;
  label?: string;
};

export type SubtitleTrack = { url: string; lang: string };

export type StreamResult = {
  sources: StreamSource[];
  subtitles: SubtitleTrack[];
};

export interface MovieboxSearchResult {
  items: Array<{
    subject_id: string;
    title: string;
    cover?: { url: string };
  }>;
  pager: {
    has_more: boolean;
  };
}

export async function searchMoviebox(query: string) {
  const res = await fetch(`${MOVIEBOX_API}/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) return null;
  const data: MovieboxSearchResult = await res.json();
  return data;
}

export async function getMovieboxDetails(subjectId: string) {
  const res = await fetch(`${MOVIEBOX_API}/details/${subjectId}`);
  if (!res.ok) return null;
  return res.json();
}

export async function getMovieboxStream(
  subjectId: string,
  season: number = 0,
  episode: number = 0,
): Promise<StreamResult> {
  try {
    const res = await fetch(
      `${MOVIEBOX_API}/play?subject_id=${subjectId}&season=${season}&episode=${episode}`,
    );
    if (!res.ok) return { sources: [], subtitles: [] };
    const data = await res.json();

    const sources: StreamSource[] = [];
    if (data.play_url) {
      sources.push({
        url: data.play_url,
        quality: "Auto",
        isM3U8: data.play_url.includes(".m3u8") || data.play_url.includes(".mpd"),
        label: "Main Stream",
      });
    }

    // Attempt to get subtitles if resourceId is available
    let subtitles: SubtitleTrack[] = [];
    if (data.resourceId) {
      try {
        const subRes = await fetch(
          `${MOVIEBOX_API}/subtitles?subject_id=${subjectId}&resource_id=${data.resourceId}`,
        );
        if (subRes.ok) {
          const subData = await subRes.json();
          subtitles = (subData.subtitles || []).map((s: { url: string; lang: string }) => ({
            url: s.url,
            lang: s.lang,
          }));
        }
      } catch (err) {
        console.error("[Moviebox] Subtitle fetch failed", err);
      }
    }

    return { sources, subtitles };
  } catch (error) {
    console.error("[Moviebox] Stream fetch failed", error);
    return { sources: [], subtitles: [] };
  }
}

// Legacy fallback for Consumet-style API
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export interface VidSrcResult {
  url: string;
  quality?: string;
  provider?: string;
}

export async function getVidSrcStream(
  tmdbId: number,
  isTv: boolean = false,
  s: number = 1,
  e: number = 1,
): Promise<StreamResult> {
  try {
    const res = await fetch(`${MOVIEBOX_API}/vidsrc?tmdb_id=${tmdbId}&is_tv=${isTv}&s=${s}&e=${e}`);
    if (res.ok) {
      const data: VidSrcResult = await res.json();
      return {
        sources: [
          {
            url: data.url,
            quality: data.quality || "HD",
            isM3U8: data.url.includes(".m3u8"),
            label: data.provider || "VidSrc",
          },
        ],
        subtitles: [],
      };
    }
  } catch (err) {
    console.error("[VidSrc] Extraction fetch failed", err);
  }
  return { sources: [], subtitles: [] };
}

export async function getEpisodeStream(
  tmdbId: number,
  season: number,
  episode: number,
  title: string,
): Promise<StreamResult> {
  console.log(`[Stream] Fetching for ${title} S${season}E${episode}...`);

  try {
    // First, try searching Moviebox for the title
    const searchResults = await searchMoviebox(title);
    if (searchResults && searchResults.items && searchResults.items.length > 0) {
      const bestMatch = searchResults.items[0]; // Simplified matching
      console.log(`[Stream] Moviebox match found: ${bestMatch.subject_id}`);
      const stream = await getMovieboxStream(bestMatch.subject_id, season, episode);
      if (stream.sources.length > 0) return stream;
    }
  } catch (e) {
    console.warn("[Stream] Moviebox fetch failed, falling back to Xyra", e);
  }

  // Try VidSrc Extraction first for high quality ad-free stream
  try {
    const vidsrc = await getVidSrcStream(tmdbId, true, season, episode);
    if (vidsrc.sources.length > 0) return vidsrc;
  } catch (err) {
    console.error("[Stream] VidSrc extraction failed", err);
  }

  // Fallback to Xyra if Moviebox fails
  const XYRA_URL = "https://xyra.stream";
  const primaryId = `${tmdbId}-${season}-${episode}`;
  try {
    console.log(`[Stream] Falling back to Xyra for ${primaryId}`);
    const res = await fetchWithTimeout(
      `${XYRA_URL}/stream?api_key=freekey&episode_id=${primaryId}`,
    );
    if (res.ok) {
      const data = await res.json();
      return {
        sources: (data.sources || []).map((s: { url: string; quality?: string }) => ({
          url: s.url,
          quality: s.quality || "HD",
          isM3U8: s.url.includes(".m3u8"),
          label: s.quality,
        })),
        subtitles: (data.subtitles || []).map(
          (sub: { url: string; lang?: string; language?: string }) => ({
            url: sub.url,
            lang: sub.lang || sub.language || "Unknown",
          }),
        ),
      };
    }
  } catch (e) {
    console.error("[Stream] Xyra fallback failed", e);
  }

  return { sources: [], subtitles: [] };
}
