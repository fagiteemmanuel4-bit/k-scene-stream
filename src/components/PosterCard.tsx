import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import { img, type Title } from "@/lib/tmdb";
import { memo } from "react";

const PosterCardComponent = ({ t, width = 140 }: { t: Title; width?: number }) => {
  const title = t.name || t.title || "Untitled";
  return (
    <Link
      to="/title/$id"
      params={{ id: String(t.id) }}
      className="group block shrink-0"
      style={{ width }}
    >
      <div
        className="relative overflow-hidden rounded-lg bg-muted shadow-card transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lift"
        style={{ aspectRatio: "2 / 3" }}
      >
        {t.poster_path ? (
          <img
            src={img(t.poster_path, "w342")}
            alt={title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[10px] text-muted-foreground">
            No image
          </div>
        )}
        {t.vote_average > 0 && (
          <div className="absolute right-1.5 top-1.5 flex items-center gap-1 rounded-full bg-background/90 px-1.5 py-0.5 text-[9px] font-bold backdrop-blur">
            <Star className="h-2.5 w-2.5 fill-primary text-primary" />
            {t.vote_average.toFixed(1)}
          </div>
        )}
      </div>
      <div className="mt-1.5 px-0.5">
        <div className="line-clamp-1 text-[11px] font-bold text-foreground leading-tight">{title}</div>
        <div className="text-[10px] text-muted-foreground">
          {(t.first_air_date || t.release_date || "").slice(0, 4) || "—"}
        </div>
      </div>
    </Link>
  );
};

export const PosterCard = memo(PosterCardComponent);

export function PosterSkeleton({ width = 168 }: { width?: number }) {
  return (
    <div className="shrink-0" style={{ width }}>
      <div className="animate-pulse rounded-xl bg-muted" style={{ aspectRatio: "2/3" }} />
      <div className="mt-2 h-3 w-3/4 animate-pulse rounded bg-muted" />
      <div className="mt-1 h-2 w-1/3 animate-pulse rounded bg-muted" />
    </div>
  );
}
