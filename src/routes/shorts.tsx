import { createFileRoute, Link } from "@tanstack/react-router";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  Heart,
  MessageCircle,
  Share2,
  Play,
  UserCircle,
  MoreHorizontal,
  Repeat2,
  Zap,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useInView } from "react-intersection-observer";

export const Route = createFileRoute("/shorts")({
  head: () => ({ meta: [{ title: "K-Shorts — K·Scene" }] }),
  component: ShortsPage,
});

const API = import.meta.env.VITE_MOVIEBOX_API_URL || "";

function ShortsPage() {
  const { data, fetchNextPage, hasNextPage, isLoading, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["shorts-feed"],
    queryFn: async ({ pageParam = 1 }) => {
      const res = await fetch(`${API}/shorts?page=${pageParam}`);
      return res.json();
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => allPages.length + 1,
  });

  const { ref, inView } = useInView();

  useEffect(() => {
    if (inView && hasNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const allShorts = data?.pages.flat() || [];

  return (
    <div className="min-h-screen bg-white pb-32">
      <div className="sticky top-0 z-20 bg-white/70 px-6 py-6 backdrop-blur-xl border-b border-gray-50 flex items-center justify-between">
        <h1 className="text-2xl font-black italic tracking-tighter uppercase">Shorts</h1>
        <div className="flex gap-6 text-[10px] font-black uppercase tracking-widest text-gray-400">
          <span className="text-primary border-b-2 border-primary pb-1">Non-Stop</span>
          <span>Following</span>
        </div>
      </div>

      <div className="mx-auto max-w-lg">
        {allShorts.map((t, i) => (
          <ShortFeedItem key={`${t.id}-${i}`} t={t} />
        ))}

        <div ref={ref} className="h-20 flex items-center justify-center">
            {(hasNextPage || isFetchingNextPage) && (
                 <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            )}
        </div>
      </div>
    </div>
  );
}

function ShortFeedItem({ t }: { t: any }) {
  const [liked, setLiked] = useState(false);
  const [retweeted, setRetweeted] = useState(false);

  const likes = t.likes || 0;
  const shares = t.shares || 0;

  return (
    <div className="bg-white p-6 border-b border-gray-50 animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="flex gap-4">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-[20px] bg-primary/5 flex items-center justify-center ring-1 ring-gray-100 shadow-sm">
          {t.poster_path ? (
            <img src={t.poster_path} className="h-full w-full object-cover" alt="" />
          ) : (
            <UserCircle className="h-10 w-10 text-primary/30" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="truncate font-black text-gray-900 text-sm uppercase italic tracking-tight">{t.name}</span>
              <div className="h-1 w-1 rounded-full bg-gray-200 shrink-0" />
              <span className="shrink-0 text-[10px] font-bold text-gray-400">Verified · 5m</span>
            </div>
            <MoreHorizontal className="h-5 w-5 text-gray-300" />
          </div>

          <p className="mt-2 text-sm text-gray-600 leading-relaxed font-medium">
            {t.content} <span className="text-primary font-black">#KPop #Trending</span>
          </p>

          <div className="mt-4 relative aspect-[9/16] max-h-[500px] w-full overflow-hidden rounded-[32px] bg-black shadow-2xl group">
              {t.backdrop_path && (
                  <img
                    src={t.backdrop_path}
                    className="h-full w-full object-cover opacity-80"
                    alt=""
                  />
              )}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="rounded-full bg-white/10 p-5 backdrop-blur-xl border border-white/20 shadow-glow">
                  <Play className="h-10 w-10 fill-white text-white translate-x-1" />
                </div>
              </div>

              <div className="absolute top-4 left-4">
                  <span className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black text-white border border-white/10">
                      <Zap className="h-3 w-3 fill-primary text-primary" /> LIVE FEED
                  </span>
              </div>

            <Link
              to="/title/$id"
              params={{ id: String(t.id) }}
              className="absolute bottom-6 left-6 right-6 rounded-3xl bg-white px-6 py-4 text-[10px] font-black uppercase text-gray-900 backdrop-blur shadow-lift text-center hover:bg-primary hover:text-white transition-all"
            >
              Watch Full Title
            </Link>
          </div>

          <div className="mt-6 flex items-center justify-between max-w-sm text-gray-400 font-black">
            <button className="flex items-center gap-2 hover:text-primary transition-colors">
              <MessageCircle className="h-4.5 w-4.5" />
              <span className="text-[10px]">{Math.floor(likes / 100)}</span>
            </button>
            <button
              onClick={() => setRetweeted(!retweeted)}
              className={`flex items-center gap-2 transition-colors ${retweeted ? "text-green-500" : "hover:text-green-500"}`}
            >
              <Repeat2 className="h-4.5 w-4.5" />
              <span className="text-[10px]">{shares}</span>
            </button>
            <button
              onClick={() => setLiked(!liked)}
              className={`flex items-center gap-2 transition-colors ${liked ? "text-pink-500" : "hover:text-pink-500"}`}
            >
              <Heart className={`h-4.5 w-4.5 ${liked ? "fill-current" : ""}`} />
              <span className="text-[10px]">{liked ? (likes + 1).toLocaleString() : likes.toLocaleString()}</span>
            </button>
            <button className="flex items-center gap-2 hover:text-primary transition-colors">
              <Share2 className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
