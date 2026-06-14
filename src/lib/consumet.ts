// Native HLS streaming — fetches direct .m3u8/.mp4 from CORS-enabled public APIs
// Falls back to working embed mirrors if all direct sources fail.

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
  fallbackEmbeds: { url: string; label: string }[]; // ordered list of embed mirrors
};

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

function isM3U8(url: string) { return url.includes(".m3u8"); }
function isDirect(url: string) { return url.includes(".m3u8") || url.includes(".mp4"); }

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

// ── Direct source extractors ─────────────────────────────────────────────────

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
  return { sources, subtitles, fallbackEmbeds: [] };
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
  return { sources, subtitles, fallbackEmbeds: [] };
}

async function fromSmashy(tmdbId: number, s: number, e: number): Promise<StreamResult | null> {
  const data = await tryFetch(
    `https://player.smashy.stream/api/tv?id=${tmdbId}&s=${s}&e=${e}`,
    "https://player.smashy.stream/"
  );
  if (!data?.source) return null;
  const src = typeof data.source === "string" ? data.source : data.source?.[0]?.file;
  if (!src || !isDirect(src)) return null;
  return { sources: [{ url: src, quality: "HD", isM3U8: isM3U8(src), label: "Smashy HD" }], subtitles: [], fallbackEmbeds: [] };
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
  return sources.length ? { sources, subtitles: [], fallbackEmbeds: [] } : null;
}

// ── Verified working embed fallbacks (no dead domains) ───────────────────────

function getTVEmbeds(tmdbId: number, season: number, episode: number) {
  return [
    { url: `https://vidsrc.to/embed/tv/${tmdbId}/${season}/${episode}`, label: "VidSrc" },
    { url: `https://vidsrc.me/embed/tv?tmdb=${tmdbId}&season=${season}&episode=${episode}`, label: "VidSrc Me" },
    { url: `https://2embed.cc/embedtvfull/${tmdbId}&s=${season}&e=${episode}`, label: "2Embed" },
    { url: `https://player.autoembed.cc/embed/tv/${tmdbId}/${season}/${episode}`, label: "AutoEmbed" },
    { url: `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1&s=${season}&e=${episode}`, label: "MultiEmbed" },
    { url: `https://embed.su/embed/tv/${tmdbId}/${season}/${episode}`, label: "EmbedSu" },
  ];
}

function getMovieEmbeds(tmdbId: number) {
  return [
    { url: `https://vidsrc.to/embed/movie/${tmdbId}`, label: "VidSrc" },
    { url: `https://vidsrc.me/embed/movie?tmdb=${tmdbId}`, label: "VidSrc Me" },
    { url: `https://2embed.cc/embed/${tmdbId}`, label: "2Embed" },
    { url: `https://player.autoembed.cc/embed/movie/${tmdbId}`, label: "AutoEmbed" },
    { url: `https://multiembed.mov/?video_id=${tmdbId}&tmdb=1`, label: "MultiEmbed" },
    { url: `https://embed.su/embed/movie/${tmdbId}`, label: "EmbedSu" },
  ];
}

// ── Main exports ─────────────────────────────────────────────────────────────

export async function getEpisodeStream(
  tmdbId: number, season: number, episode: number, _title: string
): Promise<StreamResult> {
  const results = await Promise.allSettled([
    fromAutoembed(tmdbId, season, episode),
    fromEmbedSu(tmdbId, season, episode),
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

  const embeds = getTVEmbeds(tmdbId, season, episode);

  if (unique.length > 0) {
    console.log(`[K·Scene] ✅ ${unique.length} direct source(s) found`);
    return { sources: unique, subtitles: allSubs, fallbackEmbeds: embeds };
  }

  console.warn("[K·Scene] ⚠️ No direct sources — using embed mirrors");
  return { sources: [], subtitles: [], fallbackEmbeds: embeds };
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

  return { sources: unique, subtitles: [], fallbackEmbeds: getMovieEmbeds(tmdbId) };
}
