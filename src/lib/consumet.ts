// Bridge to the Python Moviebox Server
const MOVIEBOX_API = import.meta.env.VITE_MOVIEBOX_API_URL || "http://localhost:8000";

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

export async function searchMoviebox(query: string) {
  const res = await fetch(`${MOVIEBOX_API}/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) return null;
  return res.json();
}

export async function getMovieboxDetails(subjectId: string) {
  const res = await fetch(`${MOVIEBOX_API}/details/${subjectId}`);
  if (!res.ok) return null;
  return res.json();
}

export async function getMovieboxStream(subjectId: string, season: number = 0, episode: number = 0): Promise<StreamResult> {
  try {
    const res = await fetch(`${MOVIEBOX_API}/play?subject_id=${subjectId}&season=${season}&episode=${episode}`);
    if (!res.ok) return { sources: [], subtitles: [] };
    const data = await res.json();

    const sources: StreamSource[] = [];
    if (data.play_url) {
        sources.push({
            url: data.play_url,
            quality: "Auto",
            isM3U8: data.play_url.includes(".m3u8") || data.play_url.includes(".mpd"),
            label: "Main Stream"
        });
    }

    // Attempt to get subtitles if resourceId is available
    let subtitles: SubtitleTrack[] = [];
    if (data.resourceId) {
        try {
            const subRes = await fetch(`${MOVIEBOX_API}/subtitles?subject_id=${subjectId}&resource_id=${data.resourceId}`);
            if (subRes.ok) {
                const subData = await subRes.json();
                subtitles = (subData.subtitles || []).map((s: any) => ({
                    url: s.url,
                    lang: s.lang
                }));
            }
        } catch(e) {}
    }

    return { sources, subtitles };
  } catch (error) {
    console.error("[Moviebox] Stream fetch failed", error);
    return { sources: [], subtitles: [] };
  }
}

// Legacy fallback for Consumet-style API
export async function getEpisodeStream(
  tmdbId: number,
  season: number,
  episode: number,
  title: string
): Promise<StreamResult> {
  // First, try searching Moviebox for the title
  const searchResults = await searchMoviebox(title);
  if (searchResults && searchResults.items && searchResults.items.length > 0) {
    const bestMatch = searchResults.items[0]; // Simplified matching
    return getMovieboxStream(bestMatch.subject_id, season, episode);
  }

  // Fallback to Xyra if Moviebox fails
  const XYRA_URL = "https://xyra.stream";
  const primaryId = `${tmdbId}-${season}-${episode}`;
  try {
    const res = await fetch(`${XYRA_URL}/stream?api_key=freekey&episode_id=${primaryId}`);
    if (res.ok) {
        const data = await res.json();
        return {
            sources: (data.sources || []).map((s: any) => ({
                url: s.url,
                quality: s.quality || "HD",
                isM3U8: s.url.includes(".m3u8"),
                label: s.quality
            })),
            subtitles: (data.subtitles || []).map((sub: any) => ({
                url: sub.url,
                lang: sub.lang || sub.language
            }))
        };
    }
  } catch(e) {}

  return { sources: [], subtitles: [] };
}
