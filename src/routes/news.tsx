import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bookmark,
  Share2,
  Clock,
  Flame,
  TrendingUp,
  ArrowRight,
  ExternalLink
} from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/news")({
  head: () => ({ meta: [{ title: "K-Buzz News — K·Scene" }] }),
  component: NewsPage,
});

const API = import.meta.env.VITE_MOVIEBOX_API_URL || "http://localhost:8000";

function NewsPage() {
  const [category, setCategory] = useState("BREAKING");
  const { data: news, isLoading } = useQuery({
    queryKey: ["news-feed", category],
    queryFn: async () => {
      const res = await fetch(`${API}/feeds`);
      return res.json();
    },
  });

  const categories = ["BREAKING", "ARTIST & BTS", "CELEBRITY", "CULTURE"];

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-32">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-white/70 px-6 py-6 backdrop-blur-xl border-b border-gray-50 flex items-center justify-between">
        <h1 className="text-3xl font-[1000] italic tracking-tighter text-gray-900 leading-none">K·BUZZ</h1>
        <button className="h-10 w-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
            <TrendingUp className="h-5 w-5" />
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex gap-3 overflow-x-auto px-6 py-5 scrollbar-hide">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`shrink-0 rounded-2xl px-6 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
              category === c
                ? "bg-primary text-white shadow-lift"
                : "bg-gray-100 text-gray-400 hover:bg-gray-200"
            }`}
          >
            {category === c && <Flame className="mr-2 inline-block h-3.5 w-3.5 fill-current align-middle" />}
            {c}
          </button>
        ))}
      </div>

      <div className="space-y-10 px-6 mt-4">
        {news?.map((item: any, i: number) => (
          <NewsCard key={`${item.id}-${i}`} item={item} />
        ))}
      </div>
    </div>
  );
}

function NewsCard({ item }: { item: any }) {
  return (
    <div className="group animate-in fade-in slide-in-from-bottom-10 duration-1000">
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[40px] bg-gray-100 shadow-xl border border-gray-50">
        {item.image ? (
          <img
            src={item.image}
            alt={item.title}
            className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary/5 text-primary">
            <Flame className="h-16 w-16 opacity-10" />
          </div>
        )}
        <div className="absolute top-6 left-6">
            <span className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest text-primary shadow-sm border border-white">
                {item.source}
            </span>
        </div>
      </div>

      <div className="mt-8 px-2">
        <div className="flex items-center gap-3 mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
          <Clock className="h-3.5 w-3.5" />
          <span>{item.timestamp}</span>
          <div className="h-1 w-1 rounded-full bg-gray-300" />
          <span>{item.viewers} Views</span>
        </div>

        <h3 className="text-2xl font-black italic tracking-tighter text-gray-900 leading-tight uppercase group-hover:text-primary transition-colors">
          {item.title}
        </h3>

        <p className="mt-4 text-sm font-medium leading-relaxed text-gray-500 line-clamp-2">
          {item.content}
        </p>

        <div className="mt-8 flex items-center justify-between">
          <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary group-hover:translate-x-1 transition-transform">
            Read Article <ArrowRight className="h-4 w-4" />
          </button>

          <div className="flex gap-4">
            <button className="h-10 w-10 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-primary/5 hover:text-primary transition-colors">
              <Bookmark className="h-4.5 w-4.5" />
            </button>
            <button className="h-10 w-10 rounded-full border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-primary/5 hover:text-primary transition-colors">
              <Share2 className="h-4.5 w-4.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
