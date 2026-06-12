import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Play, Info, Star } from "lucide-react";
import { getTrendingKDrama, img } from "@/lib/tmdb";

export function Hero() {
  const { data } = useQuery({ queryKey: ["trending-kdrama"], queryFn: getTrendingKDrama, staleTime: 5 * 60_000 });
  const items = (data || []).filter((t) => t.backdrop_path).slice(0, 5);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % items.length), 7000);
    return () => clearInterval(t);
  }, [items.length]);

  if (!items.length) {
    return <div className="h-[58vh] min-h-[420px] w-full animate-pulse bg-muted sm:h-[68vh]" />;
  }

  const active = items[idx];
  const title = active.name || active.title!;

  return (
    <section className="relative h-[62vh] min-h-[440px] w-full overflow-hidden sm:h-[72vh]">
      {items.map((t, i) => (
        <div
          key={t.id}
          className="absolute inset-0 transition-opacity duration-[1200ms] ease-out"
          style={{ opacity: i === idx ? 1 : 0 }}
        >
          <img
            src={img(t.backdrop_path, "original")}
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/10" />
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/30 to-transparent" />
        </div>
      ))}

      <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-12 sm:px-8 sm:pb-20">
        <div className="max-w-2xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary backdrop-blur">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            Trending K-Drama
          </div>
          <h1 className="text-4xl font-black leading-[1.05] tracking-tight text-foreground drop-shadow-sm sm:text-6xl">
            {title}
          </h1>
          <div className="mt-3 flex items-center gap-3 text-sm text-foreground/80">
            <span className="inline-flex items-center gap-1 font-semibold">
              <Star className="h-4 w-4 fill-primary text-primary" />
              {active.vote_average.toFixed(1)}
            </span>
            <span>•</span>
            <span>{(active.first_air_date || "").slice(0, 4)}</span>
          </div>
          <p className="mt-4 line-clamp-3 max-w-xl text-sm text-foreground/75 sm:text-base">
            {active.overview}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/title/$id"
              params={{ id: String(active.id) }}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lift transition hover:scale-[1.02] hover:brightness-110"
            >
              <Play className="h-4 w-4 fill-current" /> Watch Now
            </Link>
            <Link
              to="/title/$id"
              params={{ id: String(active.id) }}
              className="inline-flex items-center gap-2 rounded-full border bg-card/80 px-6 py-3 text-sm font-semibold text-foreground backdrop-blur transition hover:bg-card"
            >
              <Info className="h-4 w-4" /> More Info
            </Link>
          </div>
          <div className="mt-6 flex gap-1.5">
            {items.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className="h-1 rounded-full transition-all"
                style={{
                  width: i === idx ? 32 : 12,
                  background: i === idx ? "var(--color-primary)" : "var(--color-border)",
                }}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
