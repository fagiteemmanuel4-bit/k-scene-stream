import { useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PosterCard, PosterSkeleton } from "./PosterCard";
import type { Title } from "@/lib/tmdb";

export function Row({
  title,
  emoji,
  queryKey,
  queryFn,
}: {
  title: string;
  emoji?: string;
  queryKey: string[];
  queryFn: () => Promise<Title[]>;
}) {
  const { data, isLoading } = useQuery({ queryKey, queryFn, staleTime: 5 * 60_000 });
  const ref = useRef<HTMLDivElement>(null);

  const scroll = (dir: 1 | -1) => {
    const el = ref.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <section className="group/row relative">
      <div className="mb-3 flex items-center justify-between px-4 sm:px-8">
        <h2 className="text-lg font-bold tracking-tight sm:text-xl">
          {emoji && <span className="mr-2">{emoji}</span>}
          {title}
        </h2>
        <div className="hidden gap-1 sm:flex">
          <button
            onClick={() => scroll(-1)}
            className="grid h-9 w-9 place-items-center rounded-full border bg-card text-foreground/70 transition hover:bg-primary hover:text-primary-foreground hover:border-primary"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scroll(1)}
            className="grid h-9 w-9 place-items-center rounded-full border bg-card text-foreground/70 transition hover:bg-primary hover:text-primary-foreground hover:border-primary"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div
        ref={ref}
        className="scrollbar-hide flex gap-4 overflow-x-auto scroll-smooth px-4 pb-4 sm:px-8"
      >
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <PosterSkeleton key={i} />)
          : data?.slice(0, 18).map((t) => <PosterCard key={t.id} t={t} />)}
      </div>
    </section>
  );
}
