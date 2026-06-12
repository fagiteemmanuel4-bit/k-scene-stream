import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState, useCallback } from "react";
import { Heart, Play, Volume2, VolumeX, ExternalLink, ChevronUp, ChevronDown } from "lucide-react";
import { getTrendingKDrama, getPopularKDrama, img } from "@/lib/tmdb";
import type { Title } from "@/lib/tmdb";

export const Route = createFileRoute("/shorts")({
  head: () => ({ meta: [{ title: "Shorts — K·Scene" }] }),
  component: ShortsPage,
});

type Short = {
  id: number;
  title: string;
  backdrop: string | null;
  poster: string | null;
  overview: string;
  vote_average: number;
  trailerKey?: string;
  tmdbId: number;
};

async function fetchShorts(page: number): Promise<Short[]> {
  const [trending, popular] = await Promise.all([
    page === 1 ? getTrendingKDrama() : Promise.resolve([]),
    getPopularKDrama(page),
  ]);
  const combined = [...trending, ...popular];
  // dedupe
  const seen = new Set<number>();
  return combined
    .filter(t => { if (seen.has(t.id)) return false; seen.add(t.id); return true; })
    .filter(t => t.backdrop_path)
    .map(t => ({
      id: t.id,
      title: t.name || t.title || "",
      backdrop: t.backdrop_path,
      poster: t.poster_path,
      overview: t.overview || "",
      vote_average: t.vote_average,
      tmdbId: t.id,
    }));
}

function ShortsPage() {
  const [page, setPage] = useState(1);
  const [allShorts, setAllShorts] = useState<Short[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [liked, setLiked] = useState<Set<number>>(new Set());
  const [muted, setMuted] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Initial load
  useEffect(() => {
    setIsLoading(true);
    fetchShorts(1).then(shorts => {
      setAllShorts(shorts);
      setIsLoading(false);
    });
  }, []);

  // Load more when near end
  useEffect(() => {
    if (activeIndex >= allShorts.length - 4 && !isLoading) {
      setIsLoading(true);
      fetchShorts(page + 1).then(more => {
        setAllShorts(prev => {
          const seen = new Set(prev.map(s => s.id));
          const fresh = more.filter(s => !seen.has(s.id));
          return [...prev, ...fresh];
        });
        setPage(p => p + 1);
        setIsLoading(false);
      });
    }
  }, [activeIndex, allShorts.length, isLoading, page]);

  // Scroll snap via IntersectionObserver
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = cardRefs.current.findIndex(r => r === entry.target);
            if (idx !== -1) setActiveIndex(idx);
          }
        }
      },
      { threshold: 0.65 }
    );
    cardRefs.current.forEach(r => r && obs.observe(r));
    return () => obs.disconnect();
  }, [allShorts.length]);

  const scrollTo = (idx: number) => {
    cardRefs.current[idx]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const toggleLike = (id: number) => {
    setLiked(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (isLoading && allShorts.length === 0) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading Shorts…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-black">
      {/* Scroll container */}
      <div
        ref={containerRef}
        className="h-full overflow-y-scroll scrollbar-hide snap-y snap-mandatory"
        style={{ scrollSnapType: "y mandatory" }}
      >
        {allShorts.map((short, i) => (
          <div
            key={short.id}
            ref={el => { cardRefs.current[i] = el; }}
            className="relative flex h-[100dvh] w-full shrink-0 snap-start snap-always flex-col items-center justify-center overflow-hidden"
            style={{ scrollSnapAlign: "start" }}
          >
            {/* Background image */}
            {short.backdrop && (
              <>
                <img
                  src={img(short.backdrop, "original")}
                  alt={short.title}
                  className="absolute inset-0 h-full w-full object-cover"
                  loading={i < 3 ? "eager" : "lazy"}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/20" />
              </>
            )}

            {/* Content overlay */}
            <div className="absolute bottom-24 left-0 right-16 px-5">
              <div className="flex items-center gap-2 mb-3">
                {short.poster && (
                  <img src={img(short.poster, "w92")} alt="" className="h-10 w-7 rounded-lg object-cover ring-1 ring-white/20" />
                )}
                <div>
                  <p className="text-xs font-semibold text-white/60 uppercase tracking-widest">K·Drama Spotlight</p>
                  <h2 className="text-xl font-black text-white leading-tight line-clamp-2">{short.title}</h2>
                </div>
              </div>
              <p className="text-sm text-white/75 leading-relaxed line-clamp-3">{short.overview}</p>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1 rounded-full bg-white/10 px-3 py-1.5 text-sm font-bold text-white backdrop-blur-sm">
                  ⭐ {short.vote_average.toFixed(1)}
                </div>
                <Link
                  to="/title/$id"
                  params={{ id: String(short.tmdbId) }}
                  className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-sm font-bold text-white shadow-lg transition hover:brightness-110"
                >
                  <Play className="h-3.5 w-3.5 fill-current" /> Watch Now
                </Link>
              </div>
            </div>

            {/* Right action rail */}
            <div className="absolute bottom-28 right-4 flex flex-col items-center gap-5">
              {/* Like */}
              <button
                onClick={() => toggleLike(short.id)}
                className="flex flex-col items-center gap-1"
              >
                <div className={`grid h-12 w-12 place-items-center rounded-full backdrop-blur-md transition ${
                  liked.has(short.id) ? "bg-red-500 text-white scale-110" : "bg-white/15 text-white hover:bg-white/25"
                }`}>
                  <Heart className={`h-5 w-5 ${liked.has(short.id) ? "fill-current" : ""}`} />
                </div>
                <span className="text-[10px] font-semibold text-white">
                  {liked.has(short.id) ? "Liked" : "Like"}
                </span>
              </button>

              {/* Watch */}
              <Link to="/title/$id" params={{ id: String(short.tmdbId) }} className="flex flex-col items-center gap-1">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-white/15 text-white backdrop-blur-md hover:bg-primary/70 transition">
                  <ExternalLink className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-semibold text-white">Open</span>
              </Link>

              {/* Mute */}
              <button onClick={() => setMuted(m => !m)} className="flex flex-col items-center gap-1">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-white/15 text-white backdrop-blur-md hover:bg-white/25 transition">
                  {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </div>
                <span className="text-[10px] font-semibold text-white">{muted ? "Unmute" : "Mute"}</span>
              </button>
            </div>

            {/* Progress dots */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1">
              {allShorts.slice(Math.max(0, i - 2), i + 3).map((_, dotI) => {
                const absI = Math.max(0, i - 2) + dotI;
                return (
                  <div
                    key={absI}
                    className={`rounded-full transition-all ${absI === i ? "h-4 w-1 bg-white" : "h-1 w-1 bg-white/40"}`}
                  />
                );
              })}
            </div>

            {/* Active indicator */}
            {i === activeIndex && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2">
                <div className="flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1.5 backdrop-blur">
                  <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  <span className="text-[10px] font-semibold text-white">K·Scene Shorts</span>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Infinite load indicator */}
        {isLoading && allShorts.length > 0 && (
          <div className="flex h-32 items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
      </div>

      {/* Nav arrows desktop */}
      <div className="pointer-events-none absolute right-4 top-1/2 hidden -translate-y-1/2 flex-col gap-2 sm:flex">
        <button
          onClick={() => scrollTo(Math.max(0, activeIndex - 1))}
          className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/25 transition disabled:opacity-30"
          disabled={activeIndex === 0}
        >
          <ChevronUp className="h-5 w-5" />
        </button>
        <button
          onClick={() => scrollTo(Math.min(allShorts.length - 1, activeIndex + 1))}
          className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur hover:bg-white/25 transition"
        >
          <ChevronDown className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
