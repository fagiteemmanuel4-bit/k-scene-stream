import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Hero } from "@/components/Hero";
import { Row } from "@/components/Row";
import {
  getTrendingKDrama,
  getPopularKDrama,
  getTopRatedKDrama,
  getRecentKDrama,
  getByGenre,
  getByPage,
  getHistoricalKDrama,
  GENRES,
  type Title,
} from "@/lib/tmdb";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "K·Scene — Discover Korean Dramas" },
      {
        name: "description",
        content: "Trending, popular and top-rated K-dramas in one cinematic place.",
      },
    ],
  }),
  component: Home,
});

type Section = {
  title: string;
  emoji?: string;
  key: string;
  fn: () => Promise<Title[]>;
};

const SECTIONS: Section[] = [
  { title: "Trending Now", emoji: "🔥", key: "trending", fn: getTrendingKDrama },
  { title: "Popular K-Dramas", key: "popular", fn: getPopularKDrama },
  { title: "Top Rated", emoji: "⭐", key: "top", fn: getTopRatedKDrama },
  { title: "Recently Added", emoji: "🆕", key: "recent", fn: getRecentKDrama },
  { title: "Romance", emoji: "❤️", key: "romance", fn: () => getByGenre(GENRES.romance) },
  { title: "Action & Adventure", emoji: "⚔️", key: "action", fn: () => getByGenre(GENRES.action) },
  { title: "Historical", emoji: "🏯", key: "historical", fn: getHistoricalKDrama },
  { title: "Comedy", emoji: "😂", key: "comedy", fn: () => getByGenre(GENRES.comedy) },
  {
    title: "Mystery & Thriller",
    emoji: "🕵️",
    key: "mystery",
    fn: () => getByGenre(GENRES.mystery),
  },
  { title: "Slice of Life", emoji: "🍵", key: "drama", fn: () => getByGenre(GENRES.drama) },
  { title: "Hidden Gems", emoji: "💎", key: "gems-p3", fn: () => getByPage(3) },
  { title: "Fan Favorites", emoji: "🌟", key: "fans-p4", fn: () => getByPage(4) },
  {
    title: "Romance · Wave 2",
    emoji: "💕",
    key: "romance-p2",
    fn: () => getByGenre(GENRES.romance, 2),
  },
  { title: "Bingeworthy", emoji: "🍿", key: "binge-p5", fn: () => getByPage(5) },
  {
    title: "Comedy · Wave 2",
    emoji: "🎭",
    key: "comedy-p2",
    fn: () => getByGenre(GENRES.comedy, 2),
  },
  { title: "More to Explore", emoji: "✨", key: "more-p6", fn: () => getByPage(6) },
  {
    title: "Action · Wave 2",
    emoji: "💥",
    key: "action-p2",
    fn: () => getByGenre(GENRES.action, 2),
  },
  { title: "Deep Cuts", emoji: "🎬", key: "deep-p7", fn: () => getByPage(7) },
];

function Home() {
  const [count, setCount] = useState(4);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setCount((c) => Math.min(c + 2, SECTIONS.length));
        }
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const visible = SECTIONS.slice(0, count);
  const done = count >= SECTIONS.length;

  return (
    <div className="pb-16">
      <Hero />
      <div className="space-y-10 pt-8">
        {visible.map((s) => (
          <Row
            key={s.key}
            title={s.title}
            emoji={s.emoji}
            queryKey={["row", s.key]}
            queryFn={s.fn}
          />
        ))}
        <div ref={sentinelRef} className="h-10" />
        {done && (
          <p className="px-8 text-center text-xs text-muted-foreground">
            You've reached the end of the scene. 🐰
          </p>
        )}
      </div>
    </div>
  );
}
