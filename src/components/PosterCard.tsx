import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { img, type Title } from "@/lib/tmdb";
import { memo } from "react";

const PosterCardComponent = ({ t }: { t: Title }) => {
  const title = t.name || t.title || "Untitled";
  return (
    <Link
      to="/title/$id"
      params={{ id: String(t.id) }}
      className="group block"
    >
      <div
        className="relative overflow-hidden rounded-xl bg-gray-100 shadow-sm transition-all duration-200 group-hover:-translate-y-1 group-hover:shadow-md"
        style={{ aspectRatio: "2/3" }}
      >
        {t.poster_path ? (
          <img
            src={img(t.poster_path, "w342")}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-200 text-2xl">🎬</div>
        )}
        {t.vote_average > 0 && (
          <div className="absolute right-1.5 top-1.5 flex items-center gap-0.5 rounded-full bg-black/70 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur">
            <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
            {t.vote_average.toFixed(1)}
          </div>
        )}
      </div>
      <div className="mt-1.5 px-0.5">
        <p className="line-clamp-1 text-[11px] font-bold leading-tight text-gray-800">{title}</p>
        <p className="text-[10px] text-gray-400">
          {(t.first_air_date || t.release_date || "").slice(0, 4) || "—"}
        </p>
      </div>
    </Link>
  );
};

export const PosterCard = memo(PosterCardComponent);

export function PosterSkeleton() {
  return (
    <div>
      <div className="animate-pulse rounded-xl bg-gray-200" style={{ aspectRatio: "2/3" }} />
      <div className="mt-2 h-3 w-3/4 animate-pulse rounded bg-gray-200" />
      <div className="mt-1 h-2 w-1/3 animate-pulse rounded bg-gray-100" />
    </div>
  );
}
