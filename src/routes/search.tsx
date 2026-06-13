import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Search, X, Flame, TrendingUp } from "lucide-react";
import { searchMulti, getTrendingKDrama } from "@/lib/tmdb";
import { PosterCard, PosterSkeleton } from "@/components/PosterCard";

export const Route = createFileRoute("/search")({
  head: () => ({ meta: [{ title: "Find K-Dramas — K·Scene" }] }),
  component: SearchPage,
  validateSearch: (s: Record<string, unknown>) => ({ q: typeof s.q === "string" ? s.q : "" }),
});

function SearchPage() {
  const { q: initialQ } = Route.useSearch();
  const [q, setQ] = useState(initialQ);
  const [debouncedQ, setDebouncedQ] = useState(initialQ);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q), 350);
    return () => clearTimeout(t);
  }, [q]);

  const { data: results, isLoading } = useQuery({
    queryKey: ["search", debouncedQ],
    queryFn: () => searchMulti(debouncedQ),
    enabled: debouncedQ.trim().length > 1,
  });

  const { data: trending } = useQuery({
    queryKey: ["trending-search"],
    queryFn: getTrendingKDrama,
    enabled: !debouncedQ.trim(),
  });

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      {/* Search Header */}
      <div className="sticky top-0 z-20 bg-white/80 px-4 py-6 backdrop-blur-xl border-b border-gray-100">
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-6 text-center text-3xl font-black italic tracking-tighter text-gray-900">
            SEARCH <span className="text-primary">K·SCENE</span>
          </h1>
          <div className="relative group">
            <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-primary" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search for K-dramas, Oppas, Unnies..."
              autoFocus
              className="w-full rounded-2xl border-none bg-gray-100 py-5 pl-14 pr-14 text-base font-medium outline-none transition-all focus:bg-white focus:ring-4 focus:ring-primary/10 shadow-sm"
            />
            {q && (
              <button
                onClick={() => setQ("")}
                className="absolute right-5 top-1/2 -translate-y-1/2 rounded-full bg-gray-200 p-1 text-gray-500 hover:bg-gray-300 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-8">
        {debouncedQ.trim().length > 1 ? (
          <div>
            {isLoading ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {Array.from({ length: 12 }).map((_, i) => (
                  <PosterSkeleton key={i} />
                ))}
              </div>
            ) : results?.length ? (
              <>
                <div className="mb-6 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">
                    Search Results for "{debouncedQ}"
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {results.map((t) => (
                    <PosterCard key={t.id} t={t} />
                  ))}
                </div>
              </>
            ) : (
              <div className="mt-32 text-center animate-in fade-in zoom-in duration-500">
                <div className="mx-auto mb-4 h-24 w-24 rounded-full bg-gray-100 flex items-center justify-center text-4xl">
                  💔
                </div>
                <h3 className="text-xl font-bold text-gray-900">No dramas found</h3>
                <p className="mt-2 text-gray-500">
                  We couldn't find anything matching your search.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="mb-6 flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <h2 className="text-sm font-black uppercase tracking-widest text-gray-400">
                Trending Right Now
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {trending?.slice(0, 18).map((t) => (
                <PosterCard key={t.id} t={t} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
