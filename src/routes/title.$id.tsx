import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import { Play, Plus, Check, Star, Clock, Calendar, ChevronLeft, Layers, Loader2 } from "lucide-react";
import { getDetail, getSeason, img } from "@/lib/tmdb";
import { PosterCard } from "@/components/PosterCard";
import { useWatchlist } from "@/lib/watchlist";
import { VideoPlayer } from "@/components/VideoPlayer";
import { AuthModal } from "@/components/AuthModal";
import { useAuth } from "@/lib/auth";
import { getEpisodeStream } from "@/lib/consumet";
import { useWatchHistory, useDownloads } from "@/lib/userdata";
import type { StreamResult } from "@/lib/consumet";

export const Route = createFileRoute("/title/$id")({
  component: TitlePage,
});

function TitlePage() {
  const { id } = Route.useParams();
  const tid = Number(id);
  const { data, isLoading } = useQuery({ queryKey: ["detail", tid], queryFn: () => getDetail(tid) });
  const [season, setSeason] = useState(1);
  const { has, toggle } = useWatchlist();
  const { user } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [activeStream, setActiveStream] = useState<StreamResult | null>(null);
  const [playingEp, setPlayingEp] = useState<{ ep: number; name: string } | null>(null);
  const [streamLoading, setStreamLoading] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const { addToHistory } = useWatchHistory();
  const { addDownload } = useDownloads();

  const seasonQ = useQuery({
    queryKey: ["season", tid, season],
    queryFn: () => getSeason(tid, season),
    enabled: !!data,
  });

  const handlePlay = useCallback(async (epNumber: number, epName: string) => {
    if (!user) { setShowAuth(true); return; }
    setStreamError(null);
    setStreamLoading(true);
    setPlayingEp({ ep: epNumber, name: epName });
    window.scrollTo({ top: 0, behavior: "smooth" });
    const title = data?.name || data?.title || "";
    try {
      const result = await getEpisodeStream(tid, season, epNumber, title);
      setActiveStream(result);
    } catch {
      setStreamError("Could not load stream. Try another episode.");
    } finally {
      setStreamLoading(false);
    }
    addToHistory({ id: tid, name: title, poster_path: data?.poster_path ?? null, episode: epNumber, season });
  }, [user, data, tid, season, addToHistory]);

  const handleDownload = (url: string, quality: string) => {
    if (!user) { setShowAuth(true); return; }
    addDownload({ id: tid, name: data?.name || data?.title || "", poster_path: data?.poster_path ?? null, episode: playingEp?.ep, season, quality, url });
  };

  if (isLoading || !data) {
    return <div className="flex min-h-screen items-center justify-center bg-white"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;
  }

  const cast = (data as any).credits?.cast?.slice(0, 12) || [];
  const recs = (data as any).recommendations?.results?.slice(0, 8) || [];
  const title = data.name || data.title || "";
  const saved = has(tid);
  const seasons = (data.seasons || []).filter((s: any) => s.season_number > 0);

  return (
    <div className="min-h-screen bg-white">
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

      {/* FIXED PLAYER */}
      <div className="sticky top-0 z-30 w-full bg-black">
        {streamLoading ? (
          <div className="flex aspect-video w-full items-center justify-center bg-gray-950">
            <div className="flex flex-col items-center gap-3 text-white">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/40">Fetching direct stream…</p>
            </div>
          </div>
        ) : streamError ? (
          <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 bg-gray-950 text-white">
            <p className="text-sm font-semibold text-red-400">{streamError}</p>
            <button onClick={() => setStreamError(null)} className="rounded-full bg-primary px-4 py-2 text-sm font-bold">Dismiss</button>
          </div>
        ) : activeStream ? (
          <VideoPlayer
            streamResult={activeStream}
            title={playingEp ? `${title} S${season}E${playingEp.ep} – ${playingEp.name}` : title}
            poster={img(data.backdrop_path, "w780")}
            onDownload={handleDownload}
          />
        ) : (
          <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden bg-gray-950">
            {data.backdrop_path && <img src={img(data.backdrop_path, "w780")} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20" />}
            <div className="relative z-10 flex flex-col items-center gap-4 text-center px-6">
              <button
                onClick={() => seasonQ.data?.episodes?.[0] && handlePlay(seasonQ.data.episodes[0].episode_number, seasonQ.data.episodes[0].name)}
                className="grid h-20 w-20 place-items-center rounded-full bg-primary shadow-xl transition hover:scale-105 active:scale-95"
              >
                <Play className="h-8 w-8 translate-x-0.5 fill-white text-white" />
              </button>
              <p className="text-sm font-bold text-white">Play Episode 1</p>
              <p className="text-[11px] text-white/40">{user ? "Native HLS · Ad-free · Custom controls" : "Sign in to watch"}</p>
              {!user && (
                <button onClick={() => setShowAuth(true)} className="rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-bold text-white backdrop-blur hover:bg-primary transition">
                  Sign In
                </button>
              )}
            </div>
          </div>
        )}

        {/* Now playing bar */}
        {playingEp && !streamLoading && (
          <div className="flex items-center justify-between border-t border-white/5 bg-gray-950 px-4 py-2">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
              <span className="text-[11px] font-bold text-white/50">S{season} E{playingEp.ep} — {playingEp.name}</span>
              {activeStream && (
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-black ${activeStream.sources.length > 0 ? "bg-green-500/20 text-green-400" : "bg-orange-500/20 text-orange-400"}`}>
                  {activeStream.sources.length > 0 ? "NATIVE HLS" : "EMBED"}
                </span>
              )}
            </div>
            <Link to="/" className="flex items-center gap-1 text-[10px] font-bold text-white/30 hover:text-primary transition">
              <ChevronLeft className="h-3 w-3" /> Home
            </Link>
          </div>
        )}
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="mx-auto max-w-3xl">
        <div className="border-b px-4 pt-5 pb-5">
          <div className="flex gap-4">
            {data.poster_path && (
              <img src={img(data.poster_path, "w185")} alt={title} className="h-24 w-16 shrink-0 rounded-2xl object-cover shadow-lg" />
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-black leading-tight text-gray-900">{title}</h1>
              {data.tagline && <p className="mt-0.5 line-clamp-1 text-xs italic text-gray-400">"{data.tagline}"</p>}
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1 font-bold text-gray-900">
                  <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />{data.vote_average.toFixed(1)}
                </span>
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{(data.first_air_date || "").slice(0, 4)}</span>
                {data.episode_run_time?.[0] && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{data.episode_run_time[0]}m</span>}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {data.genres?.slice(0, 3).map((g: any) => (
                  <span key={g.id} className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-semibold text-gray-500">{g.name}</span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => seasonQ.data?.episodes?.[0] && handlePlay(seasonQ.data.episodes[0].episode_number, seasonQ.data.episodes[0].name)}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-white shadow-lg transition hover:brightness-110 active:scale-95"
            >
              <Play className="h-4 w-4 fill-current" /> Play EP 1
            </button>
            <button
              onClick={() => toggle({ id: tid, name: title, poster_path: data.poster_path, vote_average: data.vote_average })}
              className={`flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-bold transition ${saved ? "border-primary bg-primary/5 text-primary" : "border-gray-200 text-gray-600 hover:border-primary hover:text-primary"}`}
            >
              {saved ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {saved ? "Saved" : "Save"}
            </button>
          </div>
          <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-gray-500">{data.overview}</p>
        </div>

        {/* Episodes */}
        {seasons.length > 0 && (
          <section className="border-b">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                <h2 className="font-bold text-gray-900">Episodes</h2>
              </div>
              {seasons.length > 1 && (
                <select value={season} onChange={e => setSeason(Number(e.target.value))}
                  className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-bold outline-none focus:border-primary">
                  {seasons.map((s: any) => <option key={s.id} value={s.season_number}>{s.name}</option>)}
                </select>
              )}
            </div>
            <div className="space-y-2 px-4 pb-4">
              {seasonQ.isLoading && Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-100" />
              ))}
              {seasonQ.data?.episodes.map(ep => (
                <div key={ep.id} onClick={() => handlePlay(ep.episode_number, ep.name)}
                  className={`group flex cursor-pointer gap-3 rounded-2xl border p-3 transition hover:border-primary hover:shadow-sm ${playingEp?.ep === ep.episode_number ? "border-primary bg-primary/5" : "border-gray-100 bg-gray-50"}`}
                >
                  <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-xl bg-gray-200">
                    {ep.still_path
                      ? <img src={img(ep.still_path, "w300")} alt={ep.name} className="h-full w-full object-cover transition group-hover:scale-105" loading="lazy" />
                      : data.backdrop_path && <img src={img(data.backdrop_path, "w300")} alt="" className="h-full w-full object-cover opacity-40" />
                    }
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition group-hover:opacity-100">
                      <Play className="h-6 w-6 fill-white text-white" />
                    </div>
                    {playingEp?.ep === ep.episode_number && (
                      <div className="absolute inset-0 flex items-center justify-center bg-primary/30">
                        <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 py-0.5">
                    <div className="flex items-baseline gap-1.5">
                      <span className="shrink-0 text-[10px] font-black text-primary">E{ep.episode_number}</span>
                      <span className="line-clamp-1 text-sm font-bold text-gray-900">{ep.name}</span>
                    </div>
                    <p className="mt-0.5 line-clamp-2 text-xs text-gray-400">{ep.overview || "No description available."}</p>
                    {ep.runtime && <span className="mt-1 inline-block text-[10px] text-gray-300">{ep.runtime}m</span>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {cast.length > 0 && (
          <section className="border-b px-4 py-4">
            <h2 className="mb-3 font-bold text-gray-900">Cast</h2>
            <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-1">
              {cast.map((c: any) => (
                <div key={c.id} className="flex w-16 shrink-0 flex-col items-center text-center">
                  <div className="h-16 w-16 overflow-hidden rounded-2xl bg-gray-100">
                    {c.profile_path
                      ? <img src={img(c.profile_path, "w185")} alt={c.name} className="h-full w-full object-cover" loading="lazy" />
                      : <div className="grid h-full w-full place-items-center text-lg font-black text-gray-300">{c.name?.[0]}</div>
                    }
                  </div>
                  <p className="mt-1 line-clamp-2 text-[10px] font-semibold leading-tight text-gray-700">{c.name}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {recs.length > 0 && (
          <section className="px-4 py-4">
            <h2 className="mb-3 font-bold text-gray-900">You May Also Like</h2>
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {recs.map((t: any) => <PosterCard key={t.id} t={t} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
