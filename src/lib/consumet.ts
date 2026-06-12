// Consumet API - keyless public streaming sources
// Multiple mirrors for reliability
const CONSUMET_MIRRORS = [
  "https://api.consumet.org",
  "https://consumet-api.onrender.com",
];

export type StreamSource = {
  url: string;
  quality: string;
  isM3U8: boolean;
};

export type SubtitleTrack = {
  url: string;
  lang: string;
};

export type StreamResult = {
  sources: StreamSource[];
  subtitles: SubtitleTrack[];
  headers?: Record<string, string>;
};

async function fetchFromMirror(path: string): Promise<StreamResult | null> {
  for (const base of CONSUMET_MIRRORS) {
    try {
      const res = await fetch(`${base}${path}`, {
        headers: { "Accept": "application/json" },
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) continue;
      const data = await res.json();
      if (data?.sources?.length) {
        return {
          sources: data.sources.map((s: any) => ({
            url: s.url,
            quality: s.quality || "auto",
            isM3U8: s.url?.includes(".m3u8") || s.isM3U8 || false,
          })),
          subtitles: (data.subtitles || []).map((s: any) => ({ url: s.url, lang: s.lang || "Unknown" })),
          headers: data.headers,
        };
      }
    } catch {
      // try next mirror
    }
  }
  return null;
}

// For TV shows - use gogoanime provider which supports Korean content
export async function getEpisodeStream(
  tmdbId: number,
  season: number,
  episode: number,
  title: string
): Promise<StreamResult | null> {
  // Try vidsrc embed approach first (most reliable for Korean content)
  // Then fall back to consumet gogoanime
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "");

  // Try multiple consumet providers
  const paths = [
    `/meta/tmdb/watch/${tmdbId}?season=${season}&episode=${episode}`,
    `/movies/gogoanime/watch/${slug}-episode-${episode}`,
    `/anime/gogoanime/${slug}-episode-${episode}`,
  ];

  for (const path of paths) {
    const result = await fetchFromMirror(path);
    if (result) return result;
  }

  // Return vidsrc as fallback embed (not direct stream but displayable in iframe)
  return {
    sources: [
      {
        url: `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}`,
        quality: "auto",
        isM3U8: false,
      },
      {
        url: `https://2embed.cc/embed/tv/${tmdbId}/${season}/${episode}`,
        quality: "auto",
        isM3U8: false,
      },
    ],
    subtitles: [],
  };
}

export async function getMovieStream(tmdbId: number): Promise<StreamResult | null> {
  const paths = [
    `/meta/tmdb/watch/${tmdbId}`,
    `/movies/flixhq/watch-movie/watch-${tmdbId}`,
  ];

  for (const path of paths) {
    const result = await fetchFromMirror(path);
    if (result) return result;
  }

  return {
    sources: [
      { url: `https://vidsrc.to/embed/movie/${tmdbId}`, quality: "auto", isM3U8: false },
    ],
    subtitles: [],
  };
}
