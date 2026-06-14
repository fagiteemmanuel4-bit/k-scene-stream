const API_KEY = "e39d09282fd73792b1e8110c4861ee7f";
const BASE = "https://api.themoviedb.org/3";

export const img = (
  path?: string | null,
  size: "w92" | "w185" | "w200" | "w300" | "w500" | "w780" | "original" = "w500",
) => (path ? `https://image.tmdb.org/t/p/${size}${path}` : "");

export type Title = {
  id: number;
  name?: string;
  title?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  vote_average: number;
  first_air_date?: string;
  release_date?: string;
  media_type?: "tv" | "movie";
  genre_ids?: number[];
  original_language?: string;
};

async function tmdb<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set("api_key", API_KEY);
  url.searchParams.set("language", "en-US");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
  const r = await fetch(url.toString());
  if (!r.ok) throw new Error(`TMDB ${r.status}`);
  return r.json();
}

// Korean drama = TV, original language ko
const KDRAMA_DISCOVER = {
  with_original_language: "ko",
  sort_by: "popularity.desc",
  "vote_count.gte": 10,
};

export const getTrendingKDrama = () =>
  tmdb<{ results: Title[] }>("/discover/tv", {
    ...KDRAMA_DISCOVER,
    sort_by: "popularity.desc",
    page: 1,
  }).then((d) => d.results.filter((t) => t.original_language === "ko" || !t.original_language));

export const getPopularKDrama = (page = 2) =>
  tmdb<{ results: Title[] }>("/discover/tv", { ...KDRAMA_DISCOVER, page }).then((d) =>
    d.results.sort((a, b) => (b.original_language === "ko" ? 1 : 0) - (a.original_language === "ko" ? 1 : 0)),
  );

export const getTopRatedKDrama = () =>
  tmdb<{ results: Title[] }>("/discover/tv", {
    ...KDRAMA_DISCOVER,
    sort_by: "vote_average.desc",
    "vote_count.gte": 200,
  }).then((d) => d.results.filter((t) => t.original_language === "ko"));

export const getRecentKDrama = () =>
  tmdb<{ results: Title[] }>("/discover/tv", {
    ...KDRAMA_DISCOVER,
    sort_by: "first_air_date.desc",
    "first_air_date.lte": new Date().toISOString().slice(0, 10),
  }).then((d) => d.results.filter((t) => t.original_language === "ko"));

export const searchMulti = (q: string) =>
  tmdb<{ results: Title[] }>("/search/tv", { query: q }).then((d) =>
    d.results.sort((a, b) => (b.original_language === "ko" ? 1 : 0) - (a.original_language === "ko" ? 1 : 0)),
  );

export type TitleDetail = Title & {
  genres: { id: number; name: string }[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  episode_run_time?: number[];
  tagline?: string;
  status?: string;
  seasons?: {
    id: number;
    season_number: number;
    name: string;
    episode_count: number;
    poster_path: string | null;
  }[];
  videos?: { results: { key: string; site: string; type: string }[] };
};

export const getDetail = (id: number) =>
  tmdb<TitleDetail>(`/tv/${id}`, { append_to_response: "videos,credits,recommendations,images" });

export const getSeason = (id: number, season: number) =>
  tmdb<{
    episodes: {
      id: number;
      name: string;
      overview: string;
      still_path: string | null;
      episode_number: number;
      season_number: number;
      runtime: number | null;
      air_date: string;
    }[];
  }>(`/tv/${id}/season/${season}`);

export const GENRES = {
  romance: 10749,
  action: 10759,
  comedy: 35,
  mystery: 9648,
  drama: 18,
};

export const getByGenre = (genreId: number, page = 1) =>
  tmdb<{ results: Title[] }>("/discover/tv", {
    ...KDRAMA_DISCOVER,
    with_genres: genreId,
    page,
  }).then((d) => d.results.filter((t) => t.original_language === "ko"));

export const getByPage = (page: number) =>
  tmdb<{ results: Title[] }>("/discover/tv", { ...KDRAMA_DISCOVER, page }).then((d) =>
    d.results.sort((a, b) => (b.original_language === "ko" ? 1 : 0) - (a.original_language === "ko" ? 1 : 0)),
  );

export const getHistoricalKDrama = () =>
  tmdb<{ results: Title[] }>("/discover/tv", {
    ...KDRAMA_DISCOVER,
    with_genres: "36,10759", // History or Action/Adventure usually covers sageuks
    page: 1,
  }).then((d) => d.results.filter((t) => t.original_language === "ko"));
