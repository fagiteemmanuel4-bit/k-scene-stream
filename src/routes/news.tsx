import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ExternalLink, Clock, ChevronDown, ChevronUp, RefreshCw, Play } from "lucide-react";

export const Route = createFileRoute("/news")({
  head: () => ({ meta: [{ title: "K-Drama News — K·Scene" }] }),
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
};

const SOURCES = [
  { name: "Soompi",      url: "https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.soompi.com%2Ffeed&count=20",           color: "#e8503a" },
  { name: "Koreaboo",    url: "https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.koreaboo.com%2Ffeed%2F&count=20",       color: "#7c3aed" },
  { name: "Allkpop",     url: "https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.allkpop.com%2Ffeed&count=20",           color: "#0891b2" },
  { name: "Drama Beans", url: "https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.dramabeans.com%2Ffeed%2F&count=20",     color: "#059669" },
  { name: "KDrama Stars",url: "https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fkdramastars.com%2Ffeed%2F&count=20",        color: "#d97706" },
  { name: "MyDramaList", url: "https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fmydramalist.com%2Ffeed%2Fnews&count=20",    color: "#db2777" },
];

const PAGE_SIZE = 10;

function stripHtml(h: string) {
  return h.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();
}
function extractImage(h: string): string | undefined {
  return h.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1];
}
function extractYT(h: string): string | undefined {
  const m = h.match(/(?:youtube\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : undefined;
}
function timeAgo(d: string) {
  const diff = Date.now() - new Date(d).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(d).toLocaleDateString();
}

async function fetchSource(src: (typeof SOURCES)[number]): Promise<Article[]> {
  try {
    const res = await fetch(src.url, { signal: AbortSignal.timeout(8000) });
    const data = await res.json();
    if (!data.items) return [];
    return data.items.map((item: any) => {
      const content = item.content || item.description || "";
      return {
        title: stripHtml(item.title || ""),
        link: item.link || "#",
        pubDate: item.pubDate || "",
        description: stripHtml(content).slice(0, 300),
        fullContent: stripHtml(content),
        image: item.enclosure?.link || item.thumbnail || extractImage(content),
        videoEmbed: extractYT(content),
        source: src.name,
        sourceColor: src.color,
      };
    });
  } catch { return []; }
}

function NewsPage() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    Promise.all(SOURCES.map(fetchSource)).then(results => {
      const all = results.flat().sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
      setArticles(all);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const el = loaderRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) setVisibleCount(p => p + PAGE_SIZE);
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [articles.length]);

  const filtered = activeFilter === "All" ? articles : articles.filter(a => a.source === activeFilter);
  const visible = filtered.slice(0, visibleCount);
  const toggleExpand = (link: string) => setExpanded(prev => {
    const n = new Set(prev); n.has(link) ? n.delete(link) : n.add(link); return n;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b bg-white shadow-sm">
        <div className="mx-auto max-w-2xl px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-black text-gray-900">K·News</h1>
              <p className="text-xs text-gray-400">{articles.length} articles · {SOURCES.length} sources</p>
            </div>
            {loading && <RefreshCw className="h-4 w-4 animate-spin text-gray-400" />}
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {["All", ...SOURCES.map(s => s.name)].map(name => (
              <button
                key={name}
                onClick={() => { setActiveFilter(name); setVisibleCount(PAGE_SIZE); }}
                className="shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition"
                style={{
                  backgroundColor: activeFilter === name ? (SOURCES.find(s => s.name === name)?.color || "#e8503a") : "#f3f4f6",
                  color: activeFilter === name ? "#fff" : "#6b7280",
                }}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl space-y-4 px-4 pt-5">
        {loading && visible.length === 0
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="rounded-2xl bg-white p-4 shadow-card">
                <div className="mb-3 h-40 w-full animate-pulse rounded-xl bg-gray-200" />
                <div className="mb-2 h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
              </div>
            ))
          : visible.length === 0
          ? <div className="mt-20 text-center"><p className="text-4xl">📰</p><p className="mt-3 font-semibold text-gray-700">No articles found</p></div>
          : visible.map((article, i) => (
              <ArticleCard
                key={article.link + i}
                article={article}
                featured={i === 0 && activeFilter === "All"}
                expanded={expanded.has(article.link)}
                onToggle={() => toggleExpand(article.link)}
              />
            ))
        }

        {/* Infinite scroll trigger */}
        <div ref={loaderRef} className="flex h-16 items-center justify-center">
          {visibleCount < filtered.length && (
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          )}
        </div>
      </div>
    </div>
  );
}

function ArticleCard({ article, featured, expanded, onToggle }: {
  article: Article; featured?: boolean; expanded: boolean; onToggle: () => void;
}) {
  const [videoPlaying, setVideoPlaying] = useState(false);

  return (
    <div className={`overflow-hidden rounded-2xl bg-white shadow-card ${featured ? "ring-2 ring-primary/20" : ""}`}>
      {/* Media */}
      {article.videoEmbed && videoPlaying ? (
        <div className="aspect-video w-full">
          <iframe src={`${article.videoEmbed}?autoplay=1`} className="h-full w-full border-0" allow="autoplay; fullscreen" allowFullScreen title={article.title} />
        </div>
      ) : article.image ? (
        <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
          <img src={article.image} alt={article.title} className="h-full w-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          {article.videoEmbed && (
            <button onClick={() => setVideoPlaying(true)} className="absolute inset-0 flex items-center justify-center">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-red-600/90 shadow-hero backdrop-blur">
                <Play className="ml-0.5 h-6 w-6 fill-white text-white" />
              </div>
            </button>
          )}
          {featured && <div className="absolute top-3 left-3 rounded-full bg-primary px-2.5 py-1 text-[10px] font-black text-white">TOP STORY</div>}
          <div className="absolute bottom-3 left-3"><SourceChip name={article.source} color={article.sourceColor} /></div>
        </div>
      ) : null}

      {/* Text */}
      <div className="p-4">
        {!article.image && <SourceChip name={article.source} color={article.sourceColor} />}
        <h2 className={`font-bold leading-snug text-gray-900 ${featured ? "mt-2 text-lg" : "mt-1 text-sm"}`}>{article.title}</h2>
        <p className="mt-1 flex items-center gap-1 text-[11px] text-gray-400">
          <Clock className="h-3 w-3" /> {timeAgo(article.pubDate)}
        </p>

        <div className={`mt-2 text-sm leading-relaxed text-gray-600 ${expanded ? "" : "line-clamp-3"}`}>
          {article.fullContent || article.description}
        </div>

        <div className="mt-3 flex items-center justify-between">
          <button onClick={onToggle} className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
            {expanded ? <><ChevronUp className="h-3.5 w-3.5" /> Show less</> : <><ChevronDown className="h-3.5 w-3.5" /> Read more</>}
          </button>
          <a href={article.link} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-gray-400 hover:text-primary transition">
            <ExternalLink className="h-3 w-3" /> Source
          </a>
        </div>
      </div>
    </div>
  );
}

function SourceChip({ name, color }: { name: string; color: string }) {
  return (
    <span className="inline-block rounded-full px-2.5 py-0.5 text-[10px] font-bold" style={{ backgroundColor: `${color}20`, color }}>
      {name}
    </span>
  );
}
