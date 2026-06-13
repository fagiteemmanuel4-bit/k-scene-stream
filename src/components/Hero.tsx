import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Play, Sparkles } from "lucide-react";
import { getTrendingKDrama, img } from "@/lib/tmdb";

export function Hero() {
  const { data } = useQuery({
    queryKey: ["trending-kdrama-hero"],
    queryFn: getTrendingKDrama,
    staleTime: 5 * 60_000,
  });
  const items = (data || []).filter((t) => t.backdrop_path).slice(0, 3);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % items.length), 8000);
    return () => clearInterval(t);
  }, [items.length]);

  if (!items.length) {
    return (
      <div className="h-[35vh] min-h-[280px] w-full animate-pulse bg-gray-100 rounded-b-[40px]" />
    );
  }

  const active = items[idx];
  const title = active.name || active.title!;

  return (
    <section className="relative h-[40vh] min-h-[320px] w-full overflow-hidden bg-gray-900 rounded-b-[48px] shadow-2xl">
      {items.map((t, i) => (
        <div
          key={t.id}
          className="absolute inset-0 transition-opacity duration-1000"
          style={{ opacity: i === idx ? 1 : 0 }}
        >
          <img
            src={img(t.backdrop_path, "w780")}
            alt=""
            className="h-full w-full object-cover opacity-60 scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent" />
        </div>
      ))}

      <div className="relative z-10 flex h-full flex-col justify-end px-6 pb-10 sm:px-12">
        <div className="max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-white backdrop-blur-md ring-1 ring-white/20">
            <Sparkles className="h-3 w-3 text-primary animate-pulse" />
            Spotlight
          </div>
          <h1 className="text-3xl font-black italic leading-none tracking-tighter text-white drop-shadow-2xl sm:text-5xl">
            {title.toUpperCase()}
          </h1>
          <p className="mt-3 line-clamp-2 max-w-sm text-xs font-medium text-white/70 leading-relaxed">
            {active.overview}
          </p>
          <div className="mt-6 flex items-center gap-4">
            <Link
              to="/title/$id"
              params={{ id: String(active.id) }}
              className="group flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lift transition hover:scale-105 active:scale-95"
            >
              <Play className="h-4 w-4 fill-current transition-transform group-hover:scale-110" />
              Watch Now
            </Link>
            <div className="flex gap-1.5">
              {items.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  className={`h-1 rounded-full transition-all duration-500 ${
                    i === idx ? "w-6 bg-primary" : "w-2 bg-white/30"
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
