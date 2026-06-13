import { createFileRoute, Link } from "@tanstack/react-router";
import { useWatchlist } from "@/lib/watchlist";
import { img } from "@/lib/tmdb";
import { Bookmark, Star, X } from "lucide-react";

export const Route = createFileRoute("/watchlist")({
  head: () => ({ meta: [{ title: "Your Watchlist — K·Scene" }] }),
  component: WatchlistPage,
});

function WatchlistPage() {
  const { list, toggle } = useWatchlist();
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-8">
      <div className="flex items-center gap-3">
        <Bookmark className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-black tracking-tight">My Watchlist</h1>
      </div>
      <p className="mt-2 text-sm text-muted-foreground">
        {list.length} title{list.length === 1 ? "" : "s"} saved
      </p>

      {list.length === 0 ? (
        <div className="mt-16 rounded-2xl border bg-card p-12 text-center">
          <p className="text-lg font-semibold">No saves yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Tap the bookmark on any title to add it here.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Browse K-Dramas
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {list.map((t) => (
            <div key={t.id} className="group relative">
              <Link to="/title/$id" params={{ id: String(t.id) }} className="block">
                <div
                  className="relative overflow-hidden rounded-xl bg-muted shadow-card transition group-hover:-translate-y-1 group-hover:shadow-lift"
                  style={{ aspectRatio: "2/3" }}
                >
                  {t.poster_path && (
                    <img
                      src={img(t.poster_path)}
                      alt={t.name}
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  )}
                  <div className="absolute right-2 top-2 flex items-center gap-1 rounded-full bg-background/90 px-2 py-0.5 text-[11px] font-semibold backdrop-blur">
                    <Star className="h-3 w-3 fill-primary text-primary" />
                    {t.vote_average.toFixed(1)}
                  </div>
                </div>
                <div className="mt-2 line-clamp-1 text-sm font-semibold">{t.name}</div>
              </Link>
              <button
                onClick={() => toggle(t)}
                className="absolute left-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-background/90 text-foreground/70 opacity-0 backdrop-blur transition hover:text-primary group-hover:opacity-100"
                aria-label="Remove"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
