import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Heart, Play, Youtube, Film, ChevronDown, ChevronUp } from "lucide-react";
import { getTrendingKDrama, getPopularKDrama, img } from "@/lib/tmdb";
import type { Title } from "@/lib/tmdb";

export const Route = createFileRoute("/shorts")({
  head: () => ({ meta: [{ title: "Shorts — K·Scene" }] }),
  component: ShortsPage,
});

type Short = {
  type: "tmdb" | "youtube";
  id: string;
  title: string;
  backdrop?: string | null;
  poster?: string | null;
  overview?: string;
  vote_average?: number;
  tmdbId?: number;
  ytVideoId?: string;
  channelName?: string;
};

const YT_QUERIES = [
  "korean drama trailer 2024",
  "kdrama official trailer 2025",
  "korean drama teaser 2025",
  "kdrama best scenes 2024",
  "korean drama OST official MV",
];

async function fetchYT(query: string): Promise<Short[]> {
  try {
    const res = await fetch(
      `https://pipedapi.kavin.rocks/search?q=${encodeURIComponent(query)}&filter=videos`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) throw new Error();
    const data = await res.json();
    return (data.items || []).slice(0, 5).map((v: any) => ({
      type: "youtube" as const,
      id: `yt-${v.url?.split("v=")[1] || v.videoId || Math.random()}`,
      title: v.title || "",
      ytVideoId: v.url?.split("v=")[1] || v.videoId,
      channelName: v.uploaderName || "",
      backdrop: v.thumbnail,
      overview: v.shortDescription || "",
    }));
  } catch { return []; }
}

async function fetchTMDB(page: number): Promise<Short[]> {
  const [trending, popular] = await Promise.all([
    page === 1 ? getTrendingKDrama() : Promise.resolve([] as Title[]),
    getPopularKDrama(page),
  ]);
  const seen = new Set<number>();
  return [...trending, ...popular]
    .filter(t => { if (seen.has(t.id) || !t.backdrop_path) return false; seen.add(t.id); return true; })
    .map(t => ({
      type: "tmdb" as const,
      id: `tmdb-${t.id}`,
      title: t.name || t.title || "",
      backdrop: t.backdrop_path,
      poster: t.poster_path,
      overview: t.overview || "",
      vote_average: t.vote_average,
      tmdbId: t.id,
    }));
}

function interleave(tmdb: Short[], yt: Short[]): Short[] {
  const out: Short[] = [];
  let ti = 0, yi = 0;
  while (ti < tmdb.length || yi < yt.length) {
    if (ti < tmdb.length) out.push(tmdb[ti++]);
    if (ti < tmdb.length) out.push(tmdb[ti++]);
    if (yi < yt.length) out.push(yt[yi++]);
  }
  return out;
}

function ShortsPage() {
  const [all, setAll] = useState<Short[]>([]);
  const [page, setPage] = useState(1);
  const [activeIdx, setActiveIdx] = useState(0);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [tmdb, yt] = await Promise.all([fetchTMDB(1), fetchYT(YT_QUERIES[0])]);
      setAll(interleave(tmdb, yt));
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (activeIdx >= all.length - 5 && !loading && all.length > 0) {
      setLoading(true);
      const np = page + 1;
      Promise.all([fetchTMDB(np), fetchYT(YT_QUERIES[np % YT_QUERIES.length] || YT_QUERIES[0])]).then(([tmdb, yt]) => {
        const merged = interleave(tmdb, yt);
        setAll(prev => {
          const seen = new Set(prev.map(s => s.id));
          return [...prev, ...merged.filter(s => !seen.has(s.id))];
        });
        setPage(np);
        setLoading(false);
      });
    }
  }, [activeIdx, all.length, loading, page]);

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => {
        for (const e of entries) {
          if (e.isIntersecting) {
            const idx = cardRefs.current.findIndex(r => r === e.target);
            if (idx !== -1) setActiveIdx(idx);
          }
        }
      },
      { threshold: 0.65 }
    );
    cardRefs.current.forEach(r => r && obs.observe(r));
    return () => obs.disconnect();
  }, [all.length]);

  const toggleLike = (id: string) => setLiked(prev => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  if (loading && all.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-3 text-white">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm">Loading Shorts…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-black">
      <div className="h-full overflow-y-scroll scrollbar-hide" style={{ scrollSnapType: "y mandatory" }}>
        {all.map((short, i) => (
          <div
            key={short.id}
            ref={el => { cardRefs.current[i] = el; }}
            className="relative flex h-[100dvh] w-full flex-col overflow-hidden"
            style={{ scrollSnapAlign: "start", scrollSnapStop: "always" }}
          >
            {short.type === "youtube"
              ? <YTCard short={short} active={i === activeIdx} liked={liked.has(short.id)} onLike={() => toggleLike(short.id)} />
              : <TMDBCard short={short} active={i === activeIdx} liked={liked.has(short.id)} onLike={() => toggleLike(short.id)} />
            }
          </div>
        ))}
        {loading && all.length > 0 && (
          <div className="flex h-24 items-center justify-center bg-black">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
      </div>

      {/* Top label */}
      <div className="pointer-events-none absolute top-4 left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1.5 backdrop-blur">
          {all[activeIdx]?.type === "youtube"
            ? <Youtube className="h-3.5 w-3.5 text-red-500" />
            : <Film className="h-3.5 w-3.5 text-primary" />}
          <span className="text-[10px] font-bold text-white">K·Scene Shorts</span>
        </div>
      </div>

      {/* Desktop nav arrows */}
      <div className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 flex-col gap-2 sm:flex">
        <button
          onClick={() => cardRefs.current[Math.max(0, activeIdx - 1)]?.scrollIntoView({ behavior: "smooth" })}
          className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/25 transition disabled:opacity-30"
          disabled={activeIdx === 0}
        >
          <ChevronUp className="h-5 w-5" />
        </button>
        <button
          onClick={() => cardRefs.current[Math.min(all.length - 1, activeIdx + 1)]?.scrollIntoView({ behavior: "smooth" })}
          className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/25 transition"
        >
          <ChevronDown className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

function TMDBCard({ short, active, liked, onLike }: { short: Short; active: boolean; liked: boolean; onLike: () => void }) {
  return (
    <div className="relative h-full w-full bg-black">
      {short.backdrop && (
        <img
          src={img(short.backdrop, "original")}
          alt={short.title}
          className="absolute inset-0 h-full w-full object-cover"
          loading={active ? "eager" : "lazy"}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/10" />

      {/* Content */}
      <div className="absolute bottom-24 left-0 right-16 px-5">
        <div className="mb-2 flex items-center gap-2">
          {short.poster && <img src={img(short.poster, "w92")} alt="" className="h-9 w-6 rounded object-cover ring-1 ring-white/20" />}
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">K·Drama</span>
        </div>
        <h2 className="text-xl font-black text-white leading-snug line-clamp-2">{short.title}</h2>
        {short.overview && <p className="mt-2 text-sm text-white/70 line-clamp-3">{short.overview}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          {short.vote_average && (
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white backdrop-blur">⭐ {short.vote_average.toFixed(1)}</span>
          )}
          {short.tmdbId && (
            <Link to="/title/$id" params={{ id: String(short.tmdbId) }}
              className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-sm font-bold text-white shadow-lg">
              <Play className="h-3.5 w-3.5 fill-current" /> Watch Now
            </Link>
          )}
        </div>
      </div>

      {/* Action rail */}
      <div className="absolute bottom-28 right-4 flex flex-col items-center gap-5">
        <ActionBtn icon={<Heart className={`h-5 w-5 ${liked ? "fill-current" : ""}`} />} label={liked ? "Liked" : "Like"} active={liked} onClick={onLike} />
        {short.tmdbId && (
          <Link to="/title/$id" params={{ id: String(short.tmdbId) }} className="flex flex-col items-center gap-1">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-primary/60 transition">
              <Play className="h-5 w-5" />
            </div>
            <span className="text-[10px] font-semibold text-white">Watch</span>
          </Link>
        )}
      </div>
    </div>
  );
}

function YTCard({ short, active, liked, onLike }: { short: Short; active: boolean; liked: boolean; onLike: () => void }) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="relative h-full w-full bg-black">
      {!playing ? (
        <>
          {short.backdrop && <img src={short.backdrop} alt={short.title} className="absolute inset-0 h-full w-full object-cover opacity-80" />}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/20" />
          <button onClick={() => setPlaying(true)} className="absolute inset-0 flex items-center justify-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-red-600 shadow-hero">
              <Play className="h-7 w-7 fill-white text-white ml-1" />
            </div>
          </button>
          <div className="absolute bottom-24 left-0 right-16 px-5">
            <div className="mb-2 flex items-center gap-2">
              <Youtube className="h-4 w-4 text-red-500" />
              <span className="text-xs font-semibold text-red-400">{short.channelName}</span>
            </div>
            <h2 className="text-lg font-black text-white leading-snug line-clamp-3">{short.title}</h2>
          </div>
          <div className="absolute bottom-28 right-4 flex flex-col items-center gap-5">
            <ActionBtn icon={<Heart className={`h-5 w-5 ${liked ? "fill-current" : ""}`} />} label={liked ? "Liked" : "Like"} active={liked} onClick={onLike} />
            <a href={`https://www.youtube.com/watch?v=${short.ytVideoId}`} target="_blank" rel="noreferrer" className="flex flex-col items-center gap-1">
              <div className="grid h-12 w-12 place-items-center rounded-full bg-white/15 text-white backdrop-blur">
                <Youtube className="h-5 w-5" />
              </div>
              <span className="text-[10px] font-semibold text-white">YouTube</span>
            </a>
          </div>
        </>
      ) : (
        <iframe
          src={`https://www.youtube.com/embed/${short.ytVideoId}?autoplay=1&rel=0&modestbranding=1`}
          className="absolute inset-0 h-full w-full border-0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen title={short.title}
        />
      )}
    </div>
  );
}

function ActionBtn({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1">
      <div className={`grid h-12 w-12 place-items-center rounded-full backdrop-blur-md transition ${active ? "bg-red-500 text-white scale-110" : "bg-white/15 text-white hover:bg-white/25"}`}>
        {icon}
      </div>
      <span className="text-[10px] font-semibold text-white">{label}</span>
    </button>
  );
}
