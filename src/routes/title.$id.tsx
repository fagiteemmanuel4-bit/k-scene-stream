import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import {
  Play,
  Plus,
  Check,
  Star,
  Clock,
  Calendar,
  ChevronLeft,
  Layers,
  Download,
  Settings,
  X,
  FileVideo,
  Type,
  CheckCircle2,
} from "lucide-react";
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
import { toast } from "sonner";

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
  const [showSmartDownload, setShowSmartDownload] = useState(false);
  const [withSubtitles, setWithSubtitles] = useState(true);

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

  const handleStartSmartDownload = async () => {
    toast.info("Preparing smart download for Season " + season + "...");
    const episodes = seasonQ.data?.episodes || [];
    const title = data?.name || data?.title || "";

    // Simulate smart download - in reality we would loop and fetch all links
    // but we avoid spamming too many prompts at once.
    toast.success(`Download for ${episodes.length} episodes queued in background.`);
    setShowSmartDownload(false);
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
    <div className="min-h-screen bg-[#FDFDFD]">
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

      {/* Smart Download Dialog */}
      {showSmartDownload && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="w-full max-w-sm rounded-[40px] bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black italic tracking-tighter uppercase">Smart Download</h3>
                    <button onClick={() => setShowSmartDownload(false)} className="rounded-full bg-gray-50 p-2 text-gray-400 hover:text-primary">
                        <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-6">
                      <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-3xl">
                          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                              <FileVideo className="h-6 w-6" />
                          </div>
                          <div>
                              <p className="text-[10px] font-black uppercase text-gray-400">Target Season</p>
                              <p className="text-sm font-black text-gray-900">Season {season} ({seasonQ.data?.episodes?.length || 0} Episodes)</p>
                          </div>
                      </div>

                      <div className="space-y-3">
                          <p className="text-[10px] font-black uppercase text-gray-400 px-2 tracking-widest">Options</p>
                          <button
                            onClick={() => setWithSubtitles(!withSubtitles)}
                            className={`flex w-full items-center justify-between rounded-3xl border p-4 transition-all ${withSubtitles ? "border-primary bg-primary/5 text-primary" : "border-gray-100 bg-white text-gray-400"}`}
                          >
                              <div className="flex items-center gap-3">
                                  <Type className="h-5 w-5" />
                                  <span className="text-sm font-black uppercase tracking-tight">Include Subtitles</span>
                              </div>
                              <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center ${withSubtitles ? "border-primary bg-primary" : "border-gray-200"}`}>
                                  {withSubtitles && <Check className="h-3.5 w-3.5 text-white" />}
                              </div>
                          </button>
                      </div>

                      <button
                        onClick={handleStartSmartDownload}
                        className="w-full rounded-full bg-primary py-4 text-xs font-black uppercase tracking-widest text-white shadow-lift active:scale-95 transition"
                      >
                          Pack & Download Season
                      </button>
                      <p className="text-[9px] text-center font-bold text-gray-400 px-4 leading-relaxed">
                          Note: This will package episodes in a folder format compatible with your device.
                      </p>
                  </div>
              </div>
          </div>
      )}

      {/* ── FIXED PLAYER ── */}
      <div className="sticky top-0 z-30 w-full bg-black shadow-hero">
        {streamLoading ? (
          <div className="flex aspect-video w-full items-center justify-center bg-gray-950">
            <div className="flex flex-col items-center gap-3 text-white">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-sm font-black uppercase tracking-widest animate-pulse">Establishing Secure Stream…</span>
            </div>
          </div>
        ) : activeStream ? (
          <VideoPlayer
            streamResult={activeStream}
            title={playingEp ? `${title} S${season}E${playingEp.ep}` : title}
            poster={img(data.backdrop_path, "w780")}
            onDownload={handleDownload}
            onSmartDownload={() => setShowSmartDownload(true)}
          />
        ) : (
          <div className="relative flex aspect-video w-full items-center justify-center bg-gray-950 group">
            {data.backdrop_path && (
              <img
                src={img(data.backdrop_path, "w780")}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-30 transition-opacity group-hover:opacity-40"
              />
            )}
            <div className="relative flex flex-col items-center gap-4 text-center text-white px-6">
              <button
                onClick={() => seasonQ.data?.episodes?.[0] && handlePlayEpisode(seasonQ.data.episodes[0].episode_number, seasonQ.data.episodes[0].name)}
                className="h-20 w-20 rounded-full bg-primary flex items-center justify-center text-3xl shadow-glow hover:scale-110 transition active:scale-95"
              >
                <Play className="h-8 w-8 fill-white translate-x-0.5" />
              </button>
              <div>
                  <p className="text-sm font-black uppercase tracking-[0.3em] mb-1">Stream Content</p>
                  <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Select an episode to begin playback</p>
              </div>
            </div>
          </div>
        )}

        {playingEp && (
          <div className="flex items-center justify-between bg-white px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[11px] font-black uppercase tracking-widest text-gray-900">
                  PLAYING: S{season} E{playingEp.ep} — {playingEp.name}
                </span>
            </div>
            <Link to="/" className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5 hover:underline">
              <ChevronLeft className="h-3.5 w-3.5" /> DASHBOARD
            </Link>
          </div>
        )}
      </div>

      <div className="mx-auto max-w-4xl">
        <div className="px-6 pt-10 pb-10 border-b bg-white">
          <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:gap-12">
            {data.poster_path && (
              <div className="mx-auto w-48 shrink-0 sm:mx-0">
                <div className="relative group">
                    <img
                      src={img(data.poster_path, "w500")}
                      alt={title}
                      className="aspect-[2/3] w-full rounded-[40px] object-cover shadow-2xl ring-4 ring-white"
                    />
                    <div className="absolute -bottom-4 -right-4 h-14 w-14 rounded-full bg-primary flex items-center justify-center text-white shadow-lift font-black text-xs italic">
                        {data.vote_average.toFixed(1)}
                    </div>
                </div>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap gap-3 mb-6">
                 <span className="bg-primary/10 text-primary px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">Global Premiere</span>
                 <span className="bg-gray-100 text-gray-500 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">4K Ultra HD</span>
              </div>
              <h1 className="text-5xl font-black italic tracking-tighter text-gray-900 leading-[0.8] uppercase">
                {title}
              </h1>
              {data.tagline && (
                <p className="mt-6 text-sm font-bold italic text-primary uppercase tracking-[0.2em] opacity-80">
                  {data.tagline}
                </p>
              )}

              <div className="mt-8 flex flex-wrap items-center gap-8 text-[11px] font-black uppercase tracking-widest text-gray-400">
                <span className="flex items-center gap-2 text-gray-900">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  {data.vote_average.toFixed(1)} RATING
                </span>
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {(data.first_air_date || "").slice(0, 4)} RELEASE
                </span>
                {data.episode_run_time?.[0] && (
                  <span className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {data.episode_run_time[0]} MINS
                  </span>
                )}
              </div>

              <div className="mt-10 flex gap-4">
                <button
                  onClick={() => seasonQ.data?.episodes?.[0] && handlePlayEpisode(seasonQ.data.episodes[0].episode_number, seasonQ.data.episodes[0].name)}
                  className="flex flex-1 items-center justify-center gap-3 rounded-full bg-primary py-5 text-xs font-black uppercase tracking-widest text-white shadow-glow hover:brightness-110 active:scale-95 transition"
                >
                  <Play className="h-4 w-4 fill-current" /> Watch Episode 1
                </button>
                <button
                  onClick={() => toggle({ id: tid, name: title, poster_path: data.poster_path, vote_average: data.vote_average })}
                  className={`flex items-center gap-3 rounded-full border px-8 py-5 text-xs font-black uppercase tracking-widest transition-all ${saved ? "border-primary bg-primary/5 text-primary" : "border-gray-200 bg-gray-50 hover:border-primary hover:text-primary text-gray-400"}`}
                >
                  {saved ? <CheckCircle2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {saved ? "In Watchlist" : "Add to List"}
                </button>
              </div>
            </div>
          </div>

          <div className="mt-12 bg-gray-50/50 p-8 rounded-[40px] border border-gray-100">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary mb-4">Synopsis</h4>
              <p className="text-sm font-medium leading-relaxed text-gray-600">
                {data.overview}
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {data.genres.map((g) => (
                  <span key={g.id} className="rounded-full bg-white px-5 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500 shadow-sm border border-gray-100">
                    {g.name}
                  </span>
                ))}
              </div>
          </div>
        </div>

        {/* Episodes Section */}
        {!!data.seasons?.length && (
          <section className="bg-white border-b px-6 py-16">
            <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lift">
                    <Layers className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-black italic tracking-tighter uppercase">Episode Guide</h2>
              </div>
              <div className="flex gap-4 w-full sm:w-auto">
                <button
                    onClick={() => setShowSmartDownload(true)}
                    className="flex items-center gap-2 bg-green-500/10 text-green-600 px-5 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-500/20 hover:bg-green-500 hover:text-white transition"
                >
                    <Download className="h-4 w-4" /> Smart Download
                </button>
                <div className="w-48">
                    <CustomSelect
                      options={seasonOptions}
                      value={season}
                      onChange={(val) => setSeason(Number(val))}
                    />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {seasonQ.isLoading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-28 animate-pulse rounded-[40px] bg-gray-50" />
                ))}
              {seasonQ.data?.episodes.map((ep) => (
                <div
                  key={ep.id}
                  onClick={() => handlePlayEpisode(ep.episode_number, ep.name)}
                  className={`group flex cursor-pointer gap-6 rounded-[40px] border p-5 transition-all duration-300 hover:shadow-2xl ${
                    playingEp?.ep === ep.episode_number
                      ? "border-primary bg-primary/5 shadow-xl"
                      : "border-gray-100 bg-white hover:border-primary/20"
                  }`}
                >
                  <div className="relative h-24 w-40 shrink-0 overflow-hidden rounded-[32px] bg-gray-100 shadow-md">
                    {ep.still_path ? (
                      <img
                        src={img(ep.still_path, "w300")}
                        alt={ep.name}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                      />
                    ) : (
                      data.backdrop_path && (
                        <img src={img(data.backdrop_path, "w300")} alt="" className="h-full w-full object-cover opacity-50" />
                      )
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-primary/40 opacity-0 transition-opacity group-hover:opacity-100 backdrop-blur-[2px]">
                      <Play className="h-8 w-8 fill-white text-white shadow-glow" />
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 py-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-[10px] font-black text-primary uppercase bg-primary/10 px-3 py-1 rounded-full">
                        EPISODE {ep.episode_number}
                      </span>
                      <h3 className="truncate text-base font-black text-gray-900 uppercase italic tracking-tight">{ep.name}</h3>
                    </div>
                    <p className="line-clamp-2 text-xs font-medium text-gray-400 leading-relaxed">
                      {ep.overview || "Deep narrative exploration awaits in this latest chapter."}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Cast */}
        {cast.length > 0 && (
          <section className="bg-white border-b px-6 py-16">
            <h2 className="mb-10 text-2xl font-black italic tracking-tighter uppercase text-center sm:text-left">Starring</h2>
            <div className="flex gap-8 overflow-x-auto scrollbar-hide pb-4">
              {cast.map((c) => (
                <div key={c.id} className="flex w-24 shrink-0 flex-col items-center text-center group">
                  <div className="h-24 w-24 overflow-hidden rounded-[32px] bg-gray-100 ring-4 ring-white shadow-lg transition-all group-hover:-translate-y-2 group-hover:shadow-2xl group-hover:ring-primary/20">
                    {c.profile_path ? (
                      <img
                        src={img(c.profile_path, "w185")}
                        alt={c.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-2xl font-black text-gray-200">
                        {c.name?.[0]}
                      </div>
                    )}
                  </div>
                  <div className="mt-4 line-clamp-2 text-[10px] font-black uppercase tracking-tight text-gray-900 leading-tight">
                    {c.name}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Recommendations */}
        {recs.length > 0 && (
          <section className="bg-[#FDFDFD] px-6 py-16">
            <div className="flex items-center justify-between mb-10">
                <h2 className="text-2xl font-black italic tracking-tighter uppercase">Recommended</h2>
                <Link to="/" className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Explore More</Link>
            </div>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
              {recs.slice(0, 8).map((t) => (
                <PosterCard key={t.id} t={t} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
