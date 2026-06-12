import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Play, Plus, Check, Star, Clock, Calendar } from "lucide-react";
import { getDetail, getSeason, img } from "@/lib/tmdb";
import { PosterCard, PosterSkeleton } from "@/components/PosterCard";
import { useWatchlist } from "@/lib/watchlist";

export const Route = createFileRoute("/title/$id")({
  head: ({ params }) => ({
    meta: [{ title: `Watch — K·Scene` }, { name: "description", content: `Stream K-drama #${params.id} on K·Scene.` }],
  }),
  component: TitlePage,
});

function TitlePage() {
  const { id } = Route.useParams();
  const tid = Number(id);
  const { data, isLoading } = useQuery({ queryKey: ["detail", tid], queryFn: () => getDetail(tid) });
  const [season, setSeason] = useState<number>(1);
  const { has, toggle } = useWatchlist();

  const seasonQ = useQuery({
    queryKey: ["season", tid, season],
    queryFn: () => getSeason(tid, season),
    enabled: !!data,
  });

  if (isLoading || !data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-8">
        <div className="aspect-video w-full animate-pulse rounded-2xl bg-muted" />
        <div className="mt-6 h-8 w-2/3 animate-pulse rounded bg-muted" />
        <div className="mt-3 h-4 w-1/3 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  const trailer = (data as any).videos?.results?.find((v: any) => v.site === "YouTube" && v.type === "Trailer") ||
    (data as any).videos?.results?.[0];
  const cast = (data as any).credits?.cast?.slice(0, 12) || [];
  const recs = (data as any).recommendations?.results || [];
  const title = data.name || data.title || "";
  const saved = has(tid);

  return (
    <div className="pb-20">
      {/* Backdrop hero */}
      <div className="relative h-[44vh] min-h-[300px] w-full overflow-hidden">
        {data.backdrop_path && (
          <img src={img(data.backdrop_path, "original")} alt="" className="h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/20" />
      </div>

      <div className="mx-auto -mt-32 max-w-7xl px-4 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          {/* Left: player + info */}
          <div>
            <div className="overflow-hidden rounded-2xl bg-black shadow-hero ring-1 ring-border">
              {trailer ? (
                <iframe
                  src={`https://www.youtube.com/embed/${trailer.key}?rel=0`}
                  title={title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="aspect-video w-full"
                />
              ) : (
                <div className="grid aspect-video w-full place-items-center text-sm text-white/60">
                  Trailer unavailable
                </div>
              )}
            </div>

            <div className="mt-6">
              <h1 className="text-3xl font-black tracking-tight sm:text-5xl">{title}</h1>
              {data.tagline && <p className="mt-2 italic text-muted-foreground">"{data.tagline}"</p>}
              <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  {data.vote_average.toFixed(1)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {(data.first_air_date || "").slice(0, 4)}
                </span>
                {!!data.episode_run_time?.length && (
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {data.episode_run_time[0]} min
                  </span>
                )}
                {data.number_of_episodes && <span>{data.number_of_episodes} episodes</span>}
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {data.genres.map((g) => (
                  <span key={g.id} className="rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
                    {g.name}
                  </span>
                ))}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={trailer ? `https://www.youtube.com/watch?v=${trailer.key}` : "#"}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lift transition hover:scale-[1.02] hover:brightness-110"
                >
                  <Play className="h-4 w-4 fill-current" /> Watch Now
                </a>
                <button
                  onClick={() => toggle({ id: tid, name: title, poster_path: data.poster_path, vote_average: data.vote_average })}
                  className="inline-flex items-center gap-2 rounded-full border bg-card px-6 py-3 text-sm font-semibold transition hover:border-primary hover:text-primary"
                >
                  {saved ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {saved ? "In Watchlist" : "Add to Watchlist"}
                </button>
              </div>

              <p className="mt-6 max-w-3xl text-[15px] leading-relaxed text-foreground/80">{data.overview}</p>
            </div>
          </div>

          {/* Right: poster */}
          <aside className="order-first lg:order-none">
            <div className="overflow-hidden rounded-2xl bg-muted shadow-hero" style={{ aspectRatio: "2/3" }}>
              {data.poster_path && (
                <img src={img(data.poster_path, "w780")} alt={title} className="h-full w-full object-cover" />
              )}
            </div>
          </aside>
        </div>

        {/* Cast */}
        {cast.length > 0 && (
          <section className="mt-14">
            <h2 className="text-xl font-bold">Cast</h2>
            <div className="scrollbar-hide mt-4 flex gap-5 overflow-x-auto pb-2">
              {cast.map((c: any) => (
                <div key={c.id} className="flex w-24 shrink-0 flex-col items-center text-center">
                  <div className="h-24 w-24 overflow-hidden rounded-full bg-muted ring-2 ring-border">
                    {c.profile_path ? (
                      <img src={img(c.profile_path, "w200")} alt={c.name} className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-xs text-muted-foreground">{c.name?.[0]}</div>
                    )}
                  </div>
                  <div className="mt-2 line-clamp-2 text-xs font-semibold">{c.name}</div>
                  <div className="line-clamp-1 text-[11px] text-muted-foreground">{c.character}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Episodes */}
        {!!data.seasons?.length && (
          <section className="mt-14">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Episodes</h2>
              <select
                value={season}
                onChange={(e) => setSeason(Number(e.target.value))}
                className="rounded-full border bg-card px-4 py-2 text-sm font-semibold outline-none focus:border-primary"
              >
                {data.seasons!.filter((s) => s.season_number > 0).map((s) => (
                  <option key={s.id} value={s.season_number}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {seasonQ.isLoading && Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse rounded-2xl bg-muted" style={{ aspectRatio: "16/10" }} />
              ))}
              {seasonQ.data?.episodes.map((ep) => (
                <article key={ep.id} className="group overflow-hidden rounded-2xl border bg-card shadow-card transition hover:-translate-y-1 hover:shadow-lift">
                  <div className="relative overflow-hidden bg-muted" style={{ aspectRatio: "16/9" }}>
                    {ep.still_path ? (
                      <img src={img(ep.still_path, "w500")} alt={ep.name} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
                    ) : data.backdrop_path && (
                      <img src={img(data.backdrop_path, "w500")} alt="" className="h-full w-full object-cover opacity-50" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 transition group-hover:opacity-100" />
                    <div className="absolute bottom-2 left-2 rounded-full bg-background/95 px-2 py-0.5 text-[11px] font-bold backdrop-blur">
                      EP {ep.episode_number}
                    </div>
                    {ep.runtime && (
                      <div className="absolute bottom-2 right-2 rounded-full bg-background/95 px-2 py-0.5 text-[11px] font-semibold backdrop-blur">
                        {ep.runtime}m
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="line-clamp-1 text-sm font-bold">{ep.name}</div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{ep.overview || "No description available."}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* Recommendations */}
        {recs.length > 0 && (
          <section className="mt-14">
            <h2 className="text-xl font-bold">You Might Also Like</h2>
            <div className="scrollbar-hide mt-4 flex gap-4 overflow-x-auto pb-4">
              {recs.slice(0, 18).map((t: any) => <PosterCard key={t.id} t={t} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
