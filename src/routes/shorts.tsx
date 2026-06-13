import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Heart,
  MessageCircle,
  Share2,
  Play,
  UserCircle,
  MoreHorizontal,
  Repeat2,
} from "lucide-react";
import { getTrendingKDrama, getDetail, img } from "@/lib/tmdb";
import { useState } from "react";

export const Route = createFileRoute("/shorts")({
  head: () => ({ meta: [{ title: "K-Drama Shorts — K·Scene" }] }),
  component: ShortsPage,
});

function ShortsPage() {
  const { data: trending, isLoading } = useQuery({
    queryKey: ["shorts-trending"],
    queryFn: getTrendingKDrama,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Feed Header */}
      <div className="sticky top-0 z-20 bg-white/80 px-4 py-4 backdrop-blur-md border-b border-gray-100 flex items-center justify-between">
        <h1 className="text-xl font-black italic tracking-tighter">FOR YOU</h1>
        <div className="flex gap-4 text-sm font-bold text-gray-400">
          <span className="text-primary border-b-2 border-primary">Trending</span>
          <span>Latest</span>
        </div>
      </div>

      <div className="mx-auto max-w-xl space-y-2">
        {trending?.slice(0, 10).map((t) => (
          <ShortFeedItem key={t.id} t={t} />
        ))}
      </div>
    </div>
  );
}

interface TrendingItem {
  id: number;
  name: string;
  poster_path: string;
  backdrop_path: string;
}

function ShortFeedItem({ t }: { t: TrendingItem }) {
  const { data: detail } = useQuery({
    queryKey: ["short-detail", t.id],
    queryFn: () => getDetail(t.id),
  });

  const trailer = detail?.videos?.results?.find(
    (v) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser"),
  );

  const [liked, setLiked] = useState(false);
  const [retweeted, setRetweeted] = useState(false);

  return (
    <div className="bg-white p-4 border-b border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-primary/10 flex items-center justify-center">
          {t.poster_path ? (
            <img src={img(t.poster_path, "w92")} className="h-full w-full object-cover" alt="" />
          ) : (
            <UserCircle className="h-8 w-8 text-primary" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          {/* Top Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="truncate font-black text-gray-900">{t.name}</span>
              <span className="shrink-0 text-xs text-gray-400">@KSceneOfficial · 2h</span>
            </div>
            <MoreHorizontal className="h-5 w-5 text-gray-400" />
          </div>

          {/* Text content */}
          <p className="mt-1 text-sm text-gray-800 leading-normal">
            New trailer for{" "}
            <span className="font-bold text-primary">#{t.name.replace(/\s+/g, "")}</span> is finally
            here! Are we ready for the vibes? 🔥🍿
          </p>

          {/* Media Content - YouTube Embed */}
          <div className="mt-3 relative aspect-video w-full overflow-hidden rounded-2xl bg-black shadow-sm group">
            {trailer ? (
              <iframe
                src={`https://www.youtube.com/embed/${trailer.key}?controls=0&rel=0&modestbranding=1&showinfo=0&iv_load_policy=3&disablekb=1`}
                className="h-full w-full border-0"
                title={t.name}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="relative h-full w-full">
                <img
                  src={img(t.backdrop_path, "w780")}
                  className="h-full w-full object-cover opacity-60"
                  alt=""
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="rounded-full bg-white/20 p-4 backdrop-blur-md">
                    <Play className="h-8 w-8 fill-white text-white" />
                  </div>
                </div>
              </div>
            )}

            {/* Overlay link to detail page */}
            <Link
              to="/title/$id"
              params={{ id: String(t.id) }}
              className="absolute bottom-4 right-4 rounded-full bg-primary/90 px-4 py-2 text-[10px] font-black uppercase text-white backdrop-blur shadow-lift opacity-0 group-hover:opacity-100 transition-opacity"
            >
              Watch Full Title
            </Link>
          </div>

          {/* Actions - Twitter Style */}
          <div className="mt-4 flex items-center justify-between max-w-sm text-gray-500">
            <button className="flex items-center gap-1.5 hover:text-blue-500 transition-colors">
              <MessageCircle className="h-4 w-4" />
              <span className="text-xs">48</span>
            </button>
            <button
              onClick={() => setRetweeted(!retweeted)}
              className={`flex items-center gap-1.5 transition-colors ${retweeted ? "text-green-500" : "hover:text-green-500"}`}
            >
              <Repeat2 className="h-4 w-4" />
              <span className="text-xs">124</span>
            </button>
            <button
              onClick={() => setLiked(!liked)}
              className={`flex items-center gap-1.5 transition-colors ${liked ? "text-pink-500" : "hover:text-pink-500"}`}
            >
              <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
              <span className="text-xs">{liked ? "2.1K" : "2.0K"}</span>
            </button>
            <button className="flex items-center gap-1.5 hover:text-blue-400 transition-colors">
              <Share2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
