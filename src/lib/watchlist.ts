import { useEffect, useState, useCallback } from "react";

const KEY = "kscene_watchlist_v1";

type Entry = { id: number; name: string; poster_path: string | null; vote_average: number };

function read(): Entry[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
}
function write(v: Entry[]) {
  localStorage.setItem(KEY, JSON.stringify(v));
  window.dispatchEvent(new Event("kscene:watchlist"));
}

export function useWatchlist() {
  const [list, setList] = useState<Entry[]>([]);
  useEffect(() => {
    setList(read());
    const h = () => setList(read());
    window.addEventListener("kscene:watchlist", h);
    return () => window.removeEventListener("kscene:watchlist", h);
  }, []);
  const has = useCallback((id: number) => list.some((e) => e.id === id), [list]);
  const toggle = useCallback((e: Entry) => {
    const cur = read();
    const next = cur.some((x) => x.id === e.id) ? cur.filter((x) => x.id !== e.id) : [e, ...cur];
    write(next);
  }, []);
  return { list, has, toggle };
}
