import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { Play, Plus, Check, Star, Clock, Calendar, ChevronLeft, Layers } from "lucide-react";
import { getDetail, getSeason, img } from "@/lib/tmdb";
import { PosterCard } from "@/components/PosterCard";
import { useWatchlist } from "@/lib/watchlist";
import { VideoPlayer } from "@/components/VideoPlayer";
import { AuthModal } from "@/components/AuthModal";
import { useAuth } from "@/lib/auth";
import { getEpisodeStream } from "@/lib/consumet";
import { useWatchHistory, useDownloads } from "@/lib/userdata";
import type { StreamResult } from "@/lib/consumet";
import { CustomSelect } from "@/components/ui/CustomSelect";

export const Route = createFileRoute("/title/$id")({
  head: () => ({ meta: [{ title: "Watch — K·Scene" }] }),
  component: TitlePage,
});

interface CastMember {
  id: number;
  name: string;
  profile_path: string | null;
}

interface Recommendation {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  vote_average: number;
}

interface TMDBDetail {
  id: number;
  name?: string;
  title?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  tagline?: string;
  vote_average: number;
  first_air_date?: string;
  episode_run_time?: number[];
  genres: { id: number; name: string }[];
  seasons?: { id: number; name: string; season_number: number }[];
  credits?: { cast: CastMember[] };
  recommendations?: { results: Recommendation[] };
}

function TitlePage() {
  const { id } = Route.useParams();
  const tid = Number(id);
  const { data, isLoading } = useQuery({
    queryKey: ["detail", tid],
    queryFn: () => getDetail(tid) as Promise<TMDBDetail>,
  });
  const [season, setSeason] = useState<number>(1);
  const { has, toggle } = useWatchlist();
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [activeStream, setActiveStream] = useState<StreamResult | null>(null);
  const [playingEp, setPlayingEp] = useState<{ ep: number; name: string } | null>(null);
  const [streamLoading, setStreamLoading] = useState(false);
  const { addToHistory } = useWatchHistory();
  const { addDownload } = useDownloads();
  const [showEps, setShowEps] = useState(true);

  const seasonQ = useQuery({
    queryKey: ["season", tid, season],
    queryFn: () => getSeason(tid, season),
    enabled: !!data,
  });

  const handlePlayEpisode = useCallback(
    async (epNumber: number, epName: string) => {
      if (!user) {
        setShowAuth(true);
        return;
      }
      setStreamLoading(true);
      setPlayingEp({ ep: epNumber, name: epName });
      const title = data?.name || data?.title || "";
      const result = await getEpisodeStream(tid, season, epNumber, title);
      setActiveStream(result);
      setStreamLoading(false);
      addToHistory({
        id: tid,
        name: title,
        poster_path: data?.poster_path ?? null,
        episode: epNumber,
        season,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [user, data, tid, season, addToHistory],
  );

  const handleDownload = (url: string, quality: string) => {
    if (!user) {
      setShowAuth(true);
      return;
    }
    const title = data?.name || data?.title || "";
    addDownload({
      id: tid,
      name: title,
      poster_path: data?.poster_path ?? null,
      episode: playingEp?.ep,
      season,
      quality,
      url,
    });
  };

  if (isLoading || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const cast = data.credits?.cast?.slice(0, 12) || [];
  const recs = data.recommendations?.results || [];
  const title = data.name || data.title || "";
  const saved = has(tid);

  const seasonOptions = (data.seasons || [])
    .filter((s) => s.season_number > 0)
    .map((s) => ({ value: s.season_number, label: s.name }));

  return (
    <div className="min-h-screen bg-white">
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

      {/* ── FIXED PLAYER (sticky top) ── */}
      <div className="sticky top-0 z-30 w-full bg-black shadow-hero">
        {streamLoading ? (
          <div className="flex aspect-video w-full items-center justify-center bg-gray-950">
            <div className="flex flex-col items-center gap-3 text-white">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-sm font-black uppercase tracking-widest">Loading Stream…</span>
            </div>
          </div>
        ) : activeStream ? (
          <VideoPlayer
            streamResult={activeStream}
            title={playingEp ? `${title} S${season}E${playingEp.ep} – ${playingEp.name}` : title}
            poster={img(data.backdrop_path, "w780")}
            onDownload={handleDownload}
          />
        ) : (
          <div className="relative flex aspect-video w-full items-center justify-center bg-gray-950">
            {data.backdrop_path && (
              <img
                src={img(data.backdrop_path, "w780")}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-20"
              />
            )}
            <div className="relative flex flex-col items-center gap-3 text-center text-white px-6">
              <div className="h-16 w-16 rounded-full bg-white/10 flex items-center justify-center text-4xl animate-pulse backdrop-blur-md">
                🎬
              </div>
              <p className="text-sm font-black uppercase tracking-widest">
                Select an episode to begin
              </p>
              {!user && (
                <button
                  onClick={() => setShowAuth(true)}
                  className="mt-1 rounded-full bg-primary px-8 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lift"
                >
                  Sign in to Watch
                </button>
              )}
            </div>
          </div>
        )}

        {/* Now playing bar */}
        {playingEp && (
          <div className="flex items-center justify-between bg-primary/10 px-4 py-3 border-t border-primary/20 backdrop-blur-md">
            <span className="text-[10px] font-black uppercase tracking-widest text-primary">
              ▶ S{season} E{playingEp.ep} — {playingEp.name}
            </span>
            <Link
              to="/"
              className="text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-primary flex items-center gap-1"
            >
              <ChevronLeft className="h-3.5 w-3.5" /> Home
            </Link>
          </div>
        )}
      </div>

      {/* ── SCROLLABLE CONTENT BELOW ── */}
      <div className="overflow-y-auto">
        {/* Title info */}
        <div className="px-6 pt-8 pb-6 border-b bg-white">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
            {data.poster_path && (
              <div className="mx-auto w-40 shrink-0 sm:mx-0">
                <img
                  src={img(data.poster_path, "w500")}
                  alt={title}
                  className="aspect-[2/3] w-full rounded-[32px] object-cover shadow-2xl ring-1 ring-gray-100"
                />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-4xl font-black italic tracking-tighter text-gray-900 leading-[0.9]">
                {title.toUpperCase()}
              </h1>
              {data.tagline && (
                <p className="mt-4 text-sm font-bold italic text-primary/80 uppercase tracking-widest">
                  {data.tagline}
                </p>
              )}
              <div className="mt-6 flex flex-wrap items-center gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                <span className="flex items-center gap-1.5 text-gray-900">
                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                  {data.vote_average.toFixed(1)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {(data.first_air_date || "").slice(0, 4)}
                </span>
                {data.episode_run_time?.[0] && (
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5" />
                    {data.episode_run_time[0]} MIN
                  </span>
                )}
              </div>
              <div className="mt-6 flex flex-wrap gap-2">
                {data.genres.map((g) => (
                  <span
                    key={g.id}
                    className="rounded-full bg-gray-50 px-4 py-1.5 text-[9px] font-black uppercase tracking-widest text-gray-500 ring-1 ring-gray-100"
                  >
                    {g.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 flex gap-4">
            <button
              onClick={() =>
                seasonQ.data?.episodes?.[0] &&
                handlePlayEpisode(
                  seasonQ.data.episodes[0].episode_number,
                  seasonQ.data.episodes[0].name,
                )
              }
              className="flex flex-1 items-center justify-center gap-3 rounded-[24px] bg-primary py-4 text-xs font-black uppercase tracking-widest text-white shadow-lift transition hover:brightness-110 active:scale-95"
            >
              <Play className="h-4 w-4 fill-current" /> Play Episode 1
            </button>
            <button
              onClick={() =>
                toggle({
                  id: tid,
                  name: title,
                  poster_path: data.poster_path,
                  vote_average: data.vote_average,
                })
              }
              className={`flex items-center gap-3 rounded-[24px] border px-6 py-4 text-xs font-black uppercase tracking-widest transition-all ${saved ? "border-primary bg-primary/5 text-primary" : "border-gray-200 bg-gray-50 hover:border-primary hover:text-primary text-gray-400"}`}
            >
              {saved ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {saved ? "Saved" : "Save"}
            </button>
          </div>

          <p className="mt-8 text-sm font-medium leading-relaxed text-gray-600 line-clamp-4">
            {data.overview}
          </p>
        </div>

        {/* Episodes Section */}
        {!!data.seasons?.length && (
          <section className="bg-white border-b px-6 py-10">
            <div className="mb-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Layers className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-black italic tracking-tighter uppercase">Episodes</h2>
              </div>
              <div className="w-full sm:w-64">
                <CustomSelect
                  options={seasonOptions}
                  value={season}
                  onChange={(val) => setSeason(Number(val))}
                />
              </div>
            </div>

            <div className="space-y-4">
              {seasonQ.isLoading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-24 animate-pulse rounded-3xl bg-gray-50" />
                ))}
              {seasonQ.data?.episodes.map((ep) => (
                <div
                  key={ep.id}
                  onClick={() => handlePlayEpisode(ep.episode_number, ep.name)}
                  className={`group flex cursor-pointer gap-4 rounded-[32px] border p-4 transition-all duration-300 hover:shadow-xl ${
                    playingEp?.ep === ep.episode_number
                      ? "border-primary bg-primary/5"
                      : "border-gray-100 bg-gray-50 hover:border-primary/30"
                  }`}
                >
                  <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-2xl bg-gray-200 shadow-sm">
                    {ep.still_path ? (
                      <img
                        src={img(ep.still_path, "w300")}
                        alt={ep.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                    ) : (
                      data.backdrop_path && (
                        <img
                          src={img(data.backdrop_path, "w300")}
                          alt=""
                          className="h-full w-full object-cover opacity-50"
                        />
                      )
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100 backdrop-blur-[2px]">
                      <Play className="h-6 w-6 fill-white text-white" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 py-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black text-primary uppercase">
                        EP {ep.episode_number}
                      </span>
                      <h3 className="truncate text-sm font-black text-gray-900">{ep.name}</h3>
                    </div>
                    <p className="line-clamp-2 text-xs font-medium text-gray-500 leading-normal">
                      {ep.overview || "No description available for this episode."}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Cast */}
        {cast.length > 0 && (
          <section className="bg-white border-b px-6 py-10">
            <h2 className="mb-8 text-xl font-black italic tracking-tighter uppercase">Cast</h2>
            <div className="flex gap-6 overflow-x-auto scrollbar-hide pb-2">
              {cast.map((c) => (
                <div
                  key={c.id}
                  className="flex w-20 shrink-0 flex-col items-center text-center group"
                >
                  <div className="h-20 w-20 overflow-hidden rounded-full bg-gray-100 ring-2 ring-gray-100 ring-offset-2 transition-all group-hover:ring-primary shadow-sm">
                    {c.profile_path ? (
                      <img
                        src={img(c.profile_path, "w185")}
                        alt={c.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-lg font-black text-gray-300">
                        {c.name?.[0]}
                      </div>
                    )}
                  </div>
                  <div className="mt-3 line-clamp-2 text-[10px] font-black uppercase tracking-tight text-gray-900 leading-tight">
                    {c.name}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recommendations */}
        {recs.length > 0 && (
          <section className="bg-white px-6 py-10">
            <h2 className="mb-8 text-xl font-black italic tracking-tighter uppercase">
              You May Also Like
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {recs.slice(0, 6).map((t) => (
                <PosterCard key={t.id} t={t} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
