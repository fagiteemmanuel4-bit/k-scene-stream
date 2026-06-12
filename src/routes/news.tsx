import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ExternalLink, Clock, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/news")({
  head: () => ({ meta: [{ title: "K-Drama News — K·Scene" }] }),
  component: NewsPage,
});

type Article = {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  image?: string;
  source: string;
};

// We use rss2json which converts RSS → JSON without CORS issues
const RSS_SOURCES = [
  {
    name: "Soompi",
    url: "https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.soompi.com%2Ffeed",
    color: "#e8503a",
  },
  {
    name: "Koreaboo",
    url: "https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.koreaboo.com%2Ffeed%2F",
    color: "#7c3aed",
  },
  {
    name: "Allkpop",
    url: "https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.allkpop.com%2Ffeed",
    color: "#0891b2",
  },
];

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim();
}

function extractImage(html: string): string | undefined {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1];
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

async function fetchFeed(url: string, sourceName: string): Promise<Article[]> {
  const res = await fetch(url);
  const data = await res.json();
  if (!data.items) return [];
  return data.items.slice(0, 15).map((item: any) => ({
    title: stripHtml(item.title || ""),
    link: item.link || item.guid || "#",
    pubDate: item.pubDate || "",
    description: stripHtml(item.description || item.content || "").slice(0, 160),
    image: item.enclosure?.link || item.thumbnail || extractImage(item.description || item.content || ""),
    source: sourceName,
  }));
}

function NewsPage() {
  const [activeSource, setActiveSource] = useState<string>("All");

  const queries = RSS_SOURCES.map(src =>
    useQuery({
      queryKey: ["news", src.name],
      queryFn: () => fetchFeed(src.url, src.name),
      staleTime: 1000 * 60 * 10, // 10 min
    })
  );

  const allArticles: Article[] = queries
    .flatMap((q, i) => q.data?.map(a => ({ ...a, source: RSS_SOURCES[i].name })) || [])
    .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

  const isLoading = queries.some(q => q.isLoading);
  const isRefetching = queries.some(q => q.isRefetching);

  const filtered = activeSource === "All" ? allArticles : allArticles.filter(a => a.source === activeSource);

  const [featured, ...rest] = filtered;

  return (
    <div className="min-h-screen pb-6">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur px-4 py-3">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-black">K·News</h1>
              <p className="text-xs text-muted-foreground">Latest K-drama & K-pop headlines</p>
            </div>
            <RefreshCw className={`h-4 w-4 text-muted-foreground ${isRefetching ? "animate-spin" : ""}`} />
          </div>

          {/* Source filter pills */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {["All", ...RSS_SOURCES.map(s => s.name)].map(name => (
              <button
                key={name}
                onClick={() => setActiveSource(name)}
                className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition ${
                  activeSource === name
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                {name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 pt-5">
        {isLoading ? (
          <div className="space-y-4">
            <div className="aspect-video w-full animate-pulse rounded-3xl bg-muted" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <div className="h-20 w-24 shrink-0 animate-pulse rounded-2xl bg-muted" />
                <div className="flex-1 space-y-2 py-1">
                  <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-full animate-pulse rounded bg-muted" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-20 text-center">
            <p className="text-4xl">📰</p>
            <p className="mt-3 font-semibold">No articles found</p>
            <p className="mt-1 text-sm text-muted-foreground">Check back later for the latest K-drama news</p>
          </div>
        ) : (
          <>
            {/* Featured article */}
            {featured && (
              <a
                href={featured.link}
                target="_blank"
                rel="noreferrer"
                className="group mb-6 block overflow-hidden rounded-3xl border bg-card shadow-card transition hover:-translate-y-1 hover:shadow-lift"
              >
                {featured.image && (
                  <div className="relative aspect-video w-full overflow-hidden bg-muted">
                    <img src={featured.image} alt="" className="h-full w-full object-cover transition group-hover:scale-105" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <SourceBadge name={featured.source} />
                      <h2 className="mt-2 text-base font-black text-white leading-snug line-clamp-3">
                        {featured.title}
                      </h2>
                      <p className="mt-1 flex items-center gap-1 text-xs text-white/60">
                        <Clock className="h-3 w-3" /> {timeAgo(featured.pubDate)}
                      </p>
                    </div>
                  </div>
                )}
                {!featured.image && (
                  <div className="p-5">
                    <SourceBadge name={featured.source} />
                    <h2 className="mt-2 text-base font-black leading-snug">{featured.title}</h2>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-3">{featured.description}</p>
                    <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" /> {timeAgo(featured.pubDate)}
                    </p>
                  </div>
                )}
              </a>
            )}

            {/* Article list */}
            <div className="space-y-3">
              {rest.map((article, i) => (
                <a
                  key={i}
                  href={article.link}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex gap-3 overflow-hidden rounded-2xl border bg-card p-3 transition hover:border-primary hover:shadow-card"
                >
                  {article.image && (
                    <div className="h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-muted">
                      <img src={article.image} alt="" loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="line-clamp-2 text-sm font-bold leading-snug group-hover:text-primary transition">
                        {article.title}
                      </h3>
                      <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition" />
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{article.description}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <SourceBadge name={article.source} small />
                      <span className="text-[10px] text-muted-foreground">{timeAgo(article.pubDate)}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>

            <p className="mt-8 text-center text-xs text-muted-foreground">
              Content sourced from Soompi, Koreaboo & Allkpop via RSS
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function SourceBadge({ name, small }: { name: string; small?: boolean }) {
  const src = RSS_SOURCES.find(s => s.name === name);
  return (
    <span
      className={`inline-block rounded-full font-bold ${small ? "px-2 py-0.5 text-[9px]" : "px-2.5 py-1 text-[11px]"}`}
      style={{ backgroundColor: `${src?.color}25`, color: src?.color }}
    >
      {name}
    </span>
  );
}
