import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, useCallback } from "react";
import { ExternalLink, Clock, RefreshCw, Star, Zap, Users } from "lucide-react";

export const Route = createFileRoute("/news")({
  head: () => ({ meta: [{ title: "K·News — BTS, Artist & K-Drama News" }] }),
  component: NewsPage,
});

type Article = {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  fullContent?: string;
  image?: string;
  videoEmbed?: string;
  source: string;
  sourceColor: string;
  category: "all" | "artist" | "upcoming";
};

const SOURCES = [
  {
    name: "Soompi",
    url: "https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.soompi.com%2Ffeed&count=25",
    color: "#e8503a",
    cat: "all",
  },
  {
    name: "Koreaboo",
    url: "https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.koreaboo.com%2Ffeed%2F&count=25",
    color: "#7c3aed",
    cat: "artist",
  },
  {
    name: "Allkpop",
    url: "https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.allkpop.com%2Ffeed&count=25",
    color: "#0891b2",
    cat: "artist",
  },
  {
    name: "KDrama Stars",
    url: "https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fkdramastars.com%2Ffeed%2F&count=20",
    color: "#d97706",
    cat: "upcoming",
  },
];

function stripHtml(html: string) {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function extractImage(html: string): string | undefined {
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m?.[1];
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

type RSSItem = {
  title?: string;
  link?: string;
  pubDate?: string;
  content?: string;
  description?: string;
  enclosure?: { link?: string };
  thumbnail?: string;
};

async function fetchSource(src: (typeof SOURCES)[number]): Promise<Article[]> {
  try {
    const res = await fetch(src.url, { signal: AbortSignal.timeout(10000) });
    const data = await res.json();
    if (!data.items) return [];
    return (data.items as RSSItem[]).map((item) => {
      const content = item.content || item.description || "";
      return {
        title: stripHtml(item.title || ""),
        link: item.link || "#",
        pubDate: item.pubDate || "",
        description: stripHtml(content).slice(0, 250),
        image: item.enclosure?.link || item.thumbnail || extractImage(content),
        source: src.name,
        sourceColor: src.color,
        category: src.cat as "all" | "artist" | "upcoming",
      };
    });
  } catch {
    return [];
  }
}

function NewsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "artist" | "upcoming">("all");
  const [visibleCount, setVisibleCount] = useState(10);
  const loaderRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all(SOURCES.map(fetchSource)).then((results) => {
      const all = results
        .flat()
        .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
      setArticles(all);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => prev + 10);
        }
      },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const filtered =
    activeTab === "all" ? articles : articles.filter((a) => a.category === activeTab);

  const visible = filtered.slice(0, visibleCount);

  return (
    <div className="min-h-screen bg-white pb-24">
      {/* Dynamic News Header */}
      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-gray-100">
        <div className="mx-auto max-w-2xl px-4 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-black italic tracking-tighter text-gray-900">
              K·<span className="text-primary">BUZZ</span>
            </h1>
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <RefreshCw className={`h-5 w-5 text-gray-400 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>

          <div className="mt-6 flex gap-2 overflow-x-auto scrollbar-hide">
            {(
              [
                { id: "all", label: "Breaking", icon: Zap },
                { id: "artist", label: "Artist & BTS", icon: Users },
                { id: "upcoming", label: "Coming Soon", icon: Star },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setVisibleCount(10);
                }}
                className={`flex items-center gap-2 shrink-0 rounded-full px-5 py-2.5 text-xs font-black uppercase tracking-widest transition-all ${
                  activeTab === tab.id
                    ? "bg-primary text-white shadow-lift"
                    : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                }`}
              >
                <tab.icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 pt-8 space-y-8">
        {loading && visible.length === 0
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse space-y-4">
                <div className="h-64 w-full rounded-3xl bg-gray-100" />
                <div className="h-4 w-3/4 rounded bg-gray-100" />
                <div className="h-4 w-full rounded bg-gray-100" />
              </div>
            ))
          : visible.map((article, i) => (
              <article
                key={article.link + i}
                className="group animate-in fade-in slide-in-from-bottom-6 duration-700"
              >
                <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-gray-100 shadow-sm group-hover:shadow-xl transition-all duration-300">
                  {article.image && (
                    <div className="aspect-[16/10] w-full overflow-hidden bg-gray-200">
                      <img
                        src={article.image}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <span
                        className="rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white shadow-sm"
                        style={{ backgroundColor: article.sourceColor }}
                      >
                        {article.source}
                      </span>
                      <span className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400">
                        <Clock className="h-3 w-3" /> {timeAgo(article.pubDate)}
                      </span>
                    </div>
                    <h2 className="text-xl font-black leading-tight text-gray-900 group-hover:text-primary transition-colors">
                      {article.title}
                    </h2>
                    <p className="mt-3 text-sm text-gray-600 leading-relaxed line-clamp-3">
                      {article.description}
                    </p>
                    <a
                      href={article.link}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-6 inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary hover:gap-3 transition-all"
                    >
                      Read Full Story <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </article>
            ))}

        <div ref={loaderRef} className="py-10 flex justify-center">
          {visibleCount < filtered.length && (
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          )}
        </div>
      </div>
    </div>
  );
}
