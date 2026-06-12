import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { z } from "zod";
import { searchMulti } from "@/lib/tmdb";
import { PosterCard, PosterSkeleton } from "@/components/PosterCard";

const searchSchema = z.object({ q: z.string().optional().default("") });

export const Route = createFileRoute("/search")({
  validateSearch: searchSchema,
  head: () => ({ meta: [{ title: "Search — K·Scene" }] }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const [term, setTerm] = useState(q);

  useEffect(() => {
    const t = setTimeout(() => setTerm(q), 250);
    return () => clearTimeout(t);
  }, [q]);

  const { data, isLoading } = useQuery({
    queryKey: ["search", term],
    queryFn: () => searchMulti(term),
    enabled: term.trim().length > 1,
    staleTime: 60_000,
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-8">
      <h1 className="text-3xl font-black tracking-tight">
        {term ? <>Results for <span className="text-primary">"{term}"</span></> : "Search K-Dramas"}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">Find your next obsession.</p>

      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {isLoading && Array.from({ length: 12 }).map((_, i) => <PosterSkeleton key={i} width={undefined as any} />)}
        {!isLoading && data?.length === 0 && (
          <div className="col-span-full py-16 text-center text-muted-foreground">No results found.</div>
        )}
        {data?.map((t) => (
          <div key={t.id} className="w-full">
            <PosterCard t={t} width={undefined as any} />
          </div>
        ))}
      </div>
    </div>
  );
}
