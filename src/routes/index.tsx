import { createFileRoute } from "@tanstack/react-router";
import { Hero } from "@/components/Hero";
import { Row } from "@/components/Row";
import {
  getTrendingKDrama,
  getPopularKDrama,
  getTopRatedKDrama,
  getRecentKDrama,
  getByGenre,
  getHistoricalKDrama,
  GENRES,
} from "@/lib/tmdb";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "K·Scene — Discover Korean Dramas" },
      { name: "description", content: "Trending, popular and top-rated K-dramas in one cinematic place." },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <div className="pb-16">
      <Hero />
      <div className="space-y-10 pt-8">
        <Row title="Trending Now" emoji="🔥" queryKey={["row", "trending"]} queryFn={getTrendingKDrama} />
        <Row title="Popular K-Dramas" queryKey={["row", "popular"]} queryFn={getPopularKDrama} />
        <Row title="Top Rated" emoji="⭐" queryKey={["row", "top"]} queryFn={getTopRatedKDrama} />
        <Row title="Recently Added" queryKey={["row", "recent"]} queryFn={getRecentKDrama} />
        <Row title="Romance" emoji="❤️" queryKey={["row", "romance"]} queryFn={() => getByGenre(GENRES.romance)} />
        <Row title="Action" emoji="🔥" queryKey={["row", "action"]} queryFn={() => getByGenre(GENRES.action)} />
        <Row title="Historical" emoji="🏯" queryKey={["row", "historical"]} queryFn={getHistoricalKDrama} />
        <Row title="Comedy" emoji="😂" queryKey={["row", "comedy"]} queryFn={() => getByGenre(GENRES.comedy)} />
      </div>
    </div>
  );
}
