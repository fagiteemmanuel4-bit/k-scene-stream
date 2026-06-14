import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Play, Star } from "lucide-react";
import { getTrendingKDrama, img } from "@/lib/tmdb";

export function Hero() {
  const { data } = useQuery({
    queryKey: ["trending-kdrama-hero"],
    queryFn: getTrendingKDrama,
    staleTime: 5 * 60_000,
  });
  const items = (data || []).filter((t) => t.backdrop_path).slice(0, 5);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (items.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % items.length), 6000);
    return () => clearInterval(t);
  }, [items.length]);

  if (!items.length) {
    return <div className="h-[42vh] min-h-[300px] w-full animate-pulse bg-gray-100" />;
  }

  const active = items[idx];
  const title = active.name || active.title || "";

  return (
    <section className="relative h-[42vh] min-h-[300px] w-full overflow-hidden bg-gray-900">
      {/* Backdrop slides */}
      {items.map((t, i) => (
        <div
          key={t.id}
          className="absolute inset-0 transition-opacity duration-1000"
          style={{ opacity: i === idx ? 1 : 0 }}
        >
          <img
            src={img(t.backdrop_path, "original")}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      ))}
      <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-900/50 to-gray-900/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-gray-950/60 to-transparent" />

      {/* Content */}
      <div className="relative z-10 flex h-full flex-col justify-end px-5 pb-8 sm:px-10">
        <div className="max-w-md">
          {/* Rating */}
          {active.vote_average > 0 && (
            <div className="mb-2 flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-bold text-white/90">
                {active.vote_average.toFixed(1)}
              </span>
              <span className="text-xs text-white/40">
                · {(active.first_air_date || "").slice(0, 4)}
              </span>
            </div>
          )}

          <h1 className="text-2xl font-black leading-tight text-white sm:text-4xl">{title}</h1>

          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-white/60">
            {active.overview}
          </p>

          <div className="mt-5 flex items-center gap-3">
            <Link
              to="/title/$id"
              params={{ id: String(active.id) }}
              className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg transition hover:brightness-110 active:scale-95"
            >
              <Play className="h-4 w-4 fill-current" />
              Watch Now
            </Link>

            {/* Slide dots */}
            <div className="flex gap-1.5">
              {items.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIdx(i)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    i === idx ? "w-5 bg-primary" : "w-1.5 bg-white/30"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
