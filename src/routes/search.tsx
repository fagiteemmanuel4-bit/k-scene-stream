import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import { searchMulti, getTrendingKDrama } from "@/lib/tmdb";
import { PosterCard, PosterSkeleton } from "@/components/PosterCard";

export const Route = createFileRoute("/search")({
  head: () => ({ meta: [{ title: "Search — K·Scene" }] }),
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
    queryKey: ["trending"],
    queryFn: getTrendingKDrama,
    enabled: !debouncedQ.trim(),
  });

  return (
    <div className="min-h-screen px-4 pt-4 pb-6 sm:px-6">
      <div className="sticky top-0 z-10 bg-background/95 py-4 backdrop-blur">
        <div className="relative mx-auto max-w-lg">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search K-dramas, actors…"
            autoFocus
            className="w-full rounded-2xl border bg-card py-4 pl-12 pr-12 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {q && (
            <button
              onClick={() => setQ("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {debouncedQ.trim().length > 1 ? (
        <div className="mx-auto max-w-5xl">
          {isLoading ? (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <PosterSkeleton key={i} />
              ))}
            </div>
          ) : results?.length ? (
            <>
              <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {results.length} results for "{debouncedQ}"
              </p>
              <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
                {results.map((t) => (
                  <PosterCard key={t.id} t={t} />
                ))}
              </div>
            </>
          ) : (
            <div className="mt-20 text-center">
              <p className="text-4xl">🔍</p>
              <p className="mt-3 font-semibold">No results for "{debouncedQ}"</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try a different spelling or keyword
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="mx-auto max-w-5xl">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Trending Now 🔥
          </p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
            {trending?.slice(0, 18).map((t) => (
              <PosterCard key={t.id} t={t} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
