import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Play, Plus, Check, Star, Clock, Calendar, Download, LogIn } from "lucide-react";
import { getDetail, getSeason, img } from "@/lib/tmdb";
import { PosterCard, PosterSkeleton } from "@/components/PosterCard";
import { useWatchlist } from "@/lib/watchlist";
import { VideoPlayer } from "@/components/VideoPlayer";
import { AuthModal } from "@/components/AuthModal";
import { useAuth } from "@/lib/auth";
import { getEpisodeStream } from "@/lib/consumet";
import { useWatchHistory, useDownloads, useSettings } from "@/lib/userdata";
import type { StreamResult } from "@/lib/consumet";

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
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [activeStream, setActiveStream] = useState<StreamResult | null>(null);
  const [playingEp, setPlayingEp] = useState<{ ep: number; name: string } | null>(null);
  const [streamLoading, setStreamLoading] = useState(false);
  const { addToHistory } = useWatchHistory();
  const { addDownload } = useDownloads();
  const { settings } = useSettings();

  const seasonQ = useQuery({
    queryKey: ["season", tid, season],
    queryFn: () => getSeason(tid, season),
    enabled: !!data,
  });

  const handlePlayEpisode = async (epNumber: number, epName: string) => {
    if (!user) { setShowAuth(true); return; }
    setStreamLoading(true);
    setPlayingEp({ ep: epNumber, name: epName });
    const title = data?.name || data?.title || "";
    const result = await getEpisodeStream(tid, season, epNumber, title);
    setActiveStream(result);
    setStreamLoading(false);
    // track history
    addToHistory({ id: tid, name: title, poster_path: data?.poster_path ?? null, episode: epNumber, season });
    // scroll player into view
    document.getElementById("player-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleDownload = (url: string, quality: string) => {
    if (!user) { setShowAuth(true); return; }
    const title = data?.name || data?.title || "";
    addDownload({
      id: tid, name: title, poster_path: data?.poster_path ?? null,
      episode: playingEp?.ep, season, quality, url,
    });
  };

  if (isLoading || !data) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-8">
        <div className="aspect-video w-full animate-pulse rounded-2xl bg-muted" />
        <div className="mt-6 h-8 w-2/3 animate-pulse rounded bg-muted" />
        <div className="mt-3 h-4 w-1/3 animate-pulse rounded bg-muted" />
      </div>
    );
  }

  const cast = (data as any).credits?.cast?.slice(0, 12) || [];
  const recs = (data as any).recommendations?.results || [];
  const title = data.name || data.title || "";
  const saved = has(tid);
  const preferredQ = settings.streamingQuality === "auto" ? "auto" : settings.streamingQuality;

  return (
    <div className="pb-20">
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

      {/* Backdrop */}
      <div className="relative h-[40vh] min-h-[260px] w-full overflow-hidden">
        {data.backdrop_path && (
          <img src={img(data.backdrop_path, "original")} alt="" className="h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/10" />
      </div>

      <div className="mx-auto -mt-28 max-w-7xl px-4 sm:px-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          {/* Left */}
          <div>
            {/* Player */}
            <div id="player-section" className="overflow-hidden rounded-2xl bg-black shadow-hero ring-1 ring-border">
              {streamLoading ? (
                <div className="grid aspect-video w-full place-items-center text-sm text-white/60 bg-black">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <span>Loading stream…</span>
                  </div>
                </div>
              ) : activeStream ? (
                <VideoPlayer
                  streamResult={activeStream}
                  title={playingEp ? `${title} S${season}E${playingEp.ep} – ${playingEp.name}` : title}
                  poster={img(data.backdrop_path, "w780")}
                  onDownload={handleDownload}
                  defaultQuality={preferredQ}
                />
              ) : (
                <div className="relative grid aspect-video w-full place-items-center bg-gradient-to-br from-background to-muted">
                  {data.backdrop_path && (
                    <img src={img(data.backdrop_path, "w780")} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" />
                  )}
                  <div className="relative flex flex-col items-center gap-4 text-center px-6">
                    <div className="text-4xl">🎬</div>
                    <p className="font-semibold text-white">Select an episode below to start watching</p>
                    {!user && (
                      <button
                        onClick={() => setShowAuth(true)}
                        className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground"
                      >
                        <LogIn className="h-4 w-4" /> Sign in to Watch
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="mt-6">
              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
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
                <button
                  onClick={() => seasonQ.data?.episodes?.[0] && handlePlayEpisode(seasonQ.data.episodes[0].episode_number, seasonQ.data.episodes[0].name)}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lift transition hover:scale-[1.02] hover:brightness-110"
                >
                  <Play className="h-4 w-4 fill-current" /> Play Episode 1
                </button>
                <button
                  onClick={() => toggle({ id: tid, name: title, poster_path: data.poster_path, vote_average: data.vote_average })}
                  className="inline-flex items-center gap-2 rounded-full border bg-card px-6 py-3 text-sm font-semibold transition hover:border-primary hover:text-primary"
                >
                  {saved ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {saved ? "In Watchlist" : "Watchlist"}
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
                <div key={c.id} className="flex w-20 shrink-0 flex-col items-center text-center">
                  <div className="h-20 w-20 overflow-hidden rounded-full bg-muted ring-2 ring-border">
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
                <article
                  key={ep.id}
                  onClick={() => handlePlayEpisode(ep.episode_number, ep.name)}
                  className={`group cursor-pointer overflow-hidden rounded-2xl border bg-card shadow-card transition hover:-translate-y-1 hover:shadow-lift ${
                    playingEp?.ep === ep.episode_number ? "ring-2 ring-primary" : ""
                  }`}
                >
                  <div className="relative overflow-hidden bg-muted" style={{ aspectRatio: "16/9" }}>
                    {ep.still_path ? (
                      <img src={img(ep.still_path, "w500")} alt={ep.name} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
                    ) : data.backdrop_path && (
                      <img src={img(data.backdrop_path, "w500")} alt="" className="h-full w-full object-cover opacity-50" />
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                      <div className="grid h-12 w-12 place-items-center rounded-full bg-primary text-white shadow-lg">
                        <Play className="h-5 w-5 fill-current" />
                      </div>
                    </div>
                    <div className="absolute bottom-2 left-2 rounded-full bg-background/95 px-2 py-0.5 text-[11px] font-bold backdrop-blur">
                      EP {ep.episode_number}
                    </div>
                    {ep.runtime && (
                      <div className="absolute bottom-2 right-2 rounded-full bg-background/95 px-2 py-0.5 text-[11px] font-semibold backdrop-blur">
                        {ep.runtime}m
                      </div>
                    )}
                    {playingEp?.ep === ep.episode_number && (
                      <div className="absolute top-2 right-2 rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-white">
                        Now Playing
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
