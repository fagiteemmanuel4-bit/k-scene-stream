// Native HLS streaming — fetches direct .m3u8 / .mp4 from CORS-enabled public APIs
// No iframe needed. Sources fed directly into hls.js native player.

export type StreamSource = {
  url: string;
  quality: string;
  isM3U8: boolean;
  label: string;
};

export type SubtitleTrack = { url: string; lang: string };

export type StreamResult = {
  sources: StreamSource[];
  subtitles: SubtitleTrack[];
  fallbackEmbed?: string;
};

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

function isM3U8(url: string) { return url.includes(".m3u8"); }
function isMp4(url: string) { return url.includes(".mp4"); }
function isDirect(url: string) { return isM3U8(url) || isMp4(url); }

async function tryFetch(url: string, referer: string): Promise<any | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": UA, Referer: referer, Origin: new URL(referer).origin },
      signal: AbortSignal.timeout(7000),
    });
    if (!res.ok) return null;
    const text = await res.text();
    if (!text.trim()) return null;
    try { return JSON.parse(text); } catch { return null; }
  } catch { return null; }
}

async function fromAutoembed(tmdbId: number, s: number, e: number): Promise<StreamResult | null> {
  const data = await tryFetch(
    `https://player.autoembed.cc/api/source/tv/${tmdbId}/${s}/${e}`,
    "https://player.autoembed.cc/"
  );
  if (!data?.sources?.length) return null;
  const sources: StreamSource[] = data.sources
    .filter((x: any) => x.file && isDirect(x.file))
    .map((x: any) => ({ url: x.file, quality: x.label || "HD", isM3U8: isM3U8(x.file), label: x.label || "AutoEmbed" }));
  if (!sources.length) return null;
  const subtitles: SubtitleTrack[] = (data.tracks || [])
    .filter((t: any) => t.kind === "captions" && t.file)
    .map((t: any) => ({ url: t.file, lang: t.label || "English" }));
  return { sources, subtitles };
}

async function fromEmbedSu(tmdbId: number, s: number, e: number): Promise<StreamResult | null> {
  const data = await tryFetch(
    `https://embed.su/api/source/tv/${tmdbId}/${s}/${e}`,
    "https://embed.su/"
  );
  if (!data?.sources?.length) return null;
  const sources: StreamSource[] = data.sources
    .filter((x: any) => x.file && isDirect(x.file))
    .map((x: any) => ({ url: x.file, quality: x.label || "HD", isM3U8: isM3U8(x.file), label: "EmbedSu" }));
  if (!sources.length) return null;
  const subtitles: SubtitleTrack[] = (data.tracks || [])
    .filter((t: any) => t.kind === "captions" && t.file)
    .map((t: any) => ({ url: t.file, lang: t.label || "English" }));
  return { sources, subtitles };
}

async function fromVidSrcXyz(tmdbId: number, s: number, e: number): Promise<StreamResult | null> {
  const data = await tryFetch(
    `https://vidsrc.xyz/api/source?i=${tmdbId}&s=${s}&e=${e}`,
    "https://vidsrc.xyz/"
  );
  if (!data?.source?.length) return null;
  const sources: StreamSource[] = data.source
    .filter((x: any) => x.file && isDirect(x.file))
    .map((x: any) => ({ url: x.file, quality: x.label || "HD", isM3U8: isM3U8(x.file), label: `VidSrc ${x.label || "HD"}` }));
  return sources.length ? { sources, subtitles: [] } : null;
}

async function fromSmashy(tmdbId: number, s: number, e: number): Promise<StreamResult | null> {
  const data = await tryFetch(
    `https://player.smashy.stream/api/tv?id=${tmdbId}&s=${s}&e=${e}`,
    "https://player.smashy.stream/"
  );
  if (!data?.source) return null;
  const src = typeof data.source === "string" ? data.source : data.source?.[0]?.file;
  if (!src || !isDirect(src)) return null;
  return { sources: [{ url: src, quality: "HD", isM3U8: isM3U8(src), label: "Smashy HD" }], subtitles: [] };
}

async function from2Embed(tmdbId: number, s: number, e: number): Promise<StreamResult | null> {
  const data = await tryFetch(
    `https://www.2embed.cc/api/source/tv?id=${tmdbId}&s=${s}&e=${e}`,
    "https://www.2embed.cc/"
  );
  if (!data?.data?.length) return null;
  const sources: StreamSource[] = data.data
    .filter((x: any) => x.file && isDirect(x.file))
    .map((x: any) => ({ url: x.file, quality: x.label || "HD", isM3U8: isM3U8(x.file), label: `2Embed ${x.label || ""}`.trim() }));
  return sources.length ? { sources, subtitles: [] } : null;
}

export async function getEpisodeStream(
  tmdbId: number, season: number, episode: number, _title: string
): Promise<StreamResult> {
  const results = await Promise.allSettled([
    fromAutoembed(tmdbId, season, episode),
    fromEmbedSu(tmdbId, season, episode),
    fromVidSrcXyz(tmdbId, season, episode),
    fromSmashy(tmdbId, season, episode),
    from2Embed(tmdbId, season, episode),
  ]);

  const allSources: StreamSource[] = [];
  const allSubs: SubtitleTrack[] = [];
  for (const r of results) {
    if (r.status === "fulfilled" && r.value) {
      allSources.push(...r.value.sources);
      allSubs.push(...r.value.subtitles);
    }
  }

  const seen = new Set<string>();
  const unique = allSources.filter(s => { if (seen.has(s.url)) return false; seen.add(s.url); return true; });

  if (unique.length > 0) {
    console.log(`[K·Scene] ✅ Got ${unique.length} direct stream source(s)`);
    return { sources: unique, subtitles: allSubs };
  }

  console.warn("[K·Scene] ⚠️ No direct sources — embed fallback");
  return {
    sources: [],
    subtitles: [],
    fallbackEmbed: `https://vidsrc.xyz/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`,
  };
}

export async function getMovieStream(tmdbId: number): Promise<StreamResult> {
  const results = await Promise.allSettled([
    tryFetch(`https://player.autoembed.cc/api/source/movie/${tmdbId}`, "https://player.autoembed.cc/").then(d =>
      d?.sources?.filter((s: any) => isDirect(s.file)).map((s: any) => ({
        url: s.file, quality: s.label || "HD", isM3U8: isM3U8(s.file), label: s.label || "AutoEmbed",
      })) as StreamSource[] | undefined
    ),
    tryFetch(`https://embed.su/api/source/movie/${tmdbId}`, "https://embed.su/").then(d =>
      d?.sources?.filter((s: any) => isDirect(s.file)).map((s: any) => ({
        url: s.file, quality: s.label || "HD", isM3U8: isM3U8(s.file), label: "EmbedSu",
      })) as StreamSource[] | undefined
    ),
  ]);

  const sources: StreamSource[] = [];
  for (const r of results) {
    if (r.status === "fulfilled" && Array.isArray(r.value)) sources.push(...r.value);
  }

  const seen = new Set<string>();
  const unique = sources.filter(s => { if (seen.has(s.url)) return false; seen.add(s.url); return true; });

  return unique.length
    ? { sources: unique, subtitles: [] }
    : { sources: [], subtitles: [], fallbackEmbed: `https://vidsrc.xyz/embed/movie?tmdb=${tmdbId}` };
}
