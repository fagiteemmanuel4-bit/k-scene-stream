import { useEffect, useState, useCallback } from "react";

export type WatchedEntry = {
  id: number;
  name: string;
  poster_path: string | null;
  episode?: number;
  season?: number;
  watchedAt: number; // timestamp
};

export type DownloadEntry = {
  id: number;
  name: string;
  poster_path: string | null;
  episode?: number;
  season?: number;
  quality: string;
  url: string;
  downloadedAt: number;
};

const HISTORY_KEY = "kscene_history_v1";
const DOWNLOADS_KEY = "kscene_downloads_v1";

function read<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}
function write<T>(key: string, v: T[], eventName: string) {
  localStorage.setItem(key, JSON.stringify(v));
  window.dispatchEvent(new Event(eventName));
}

export function useWatchHistory() {
  const [list, setList] = useState<WatchedEntry[]>([]);
  useEffect(() => {
    setList(read<WatchedEntry>(HISTORY_KEY));
    const h = () => setList(read<WatchedEntry>(HISTORY_KEY));
    window.addEventListener("kscene:history", h);
    return () => window.removeEventListener("kscene:history", h);
  }, []);

  const addToHistory = useCallback((e: Omit<WatchedEntry, "watchedAt">) => {
    const cur = read<WatchedEntry>(HISTORY_KEY).filter(
      (x) => !(x.id === e.id && x.episode === e.episode),
    );
    write<WatchedEntry>(
      HISTORY_KEY,
      [{ ...e, watchedAt: Date.now() }, ...cur].slice(0, 50),
      "kscene:history",
    );
  }, []);

  const clearHistory = useCallback(() => {
    write<WatchedEntry>(HISTORY_KEY, [], "kscene:history");
  }, []);

  return { list, addToHistory, clearHistory };
}

export function useDownloads() {
  const [list, setList] = useState<DownloadEntry[]>([]);
  useEffect(() => {
    setList(read<DownloadEntry>(DOWNLOADS_KEY));
    const h = () => setList(read<DownloadEntry>(DOWNLOADS_KEY));
    window.addEventListener("kscene:downloads", h);
    return () => window.removeEventListener("kscene:downloads", h);
  }, []);

  const addDownload = useCallback((e: Omit<DownloadEntry, "downloadedAt">) => {
    const cur = read<DownloadEntry>(DOWNLOADS_KEY);
    write<DownloadEntry>(
      DOWNLOADS_KEY,
      [{ ...e, downloadedAt: Date.now() }, ...cur].slice(0, 100),
      "kscene:downloads",
    );
  }, []);

  const removeDownload = useCallback((url: string) => {
    const cur = read<DownloadEntry>(DOWNLOADS_KEY).filter((x) => x.url !== url);
    write<DownloadEntry>(DOWNLOADS_KEY, cur, "kscene:downloads");
  }, []);

  return { list, addDownload, removeDownload };
}

// Settings
export type Settings = {
  country: string;
  streamingQuality: "auto" | "360p" | "720p" | "1080p";
  dataSaver: boolean;
};

const DEFAULTS: Settings = { country: "Nigeria", streamingQuality: "auto", dataSaver: false };
const SETTINGS_KEY = "kscene_settings_v1";

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(() => {
    if (typeof window === "undefined") return DEFAULTS;
    try {
      return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}") };
    } catch {
      return DEFAULTS;
    }
  });

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { settings, update };
}

// User Profile Customization
export type UserProfile = {
  emoji: string;
  avatarSeed: string;
  streakCount: number;
  lastVisit: string; // YYYY-MM-DD
};

const PROFILE_KEY = "kscene_profile_v1";
const PROFILE_DEFAULTS: UserProfile = {
  emoji: "🔥",
  avatarSeed: "default",
  streakCount: 0,
  lastVisit: "",
};

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile>(() => {
    if (typeof window === "undefined") return PROFILE_DEFAULTS;
    try {
      const data = JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}");
      return { ...PROFILE_DEFAULTS, ...data };
    } catch {
      return PROFILE_DEFAULTS;
    }
  });

  const updateProfile = useCallback((patch: Partial<UserProfile>) => {
    setProfile((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
      window.dispatchEvent(new Event("kscene:profile"));
      return next;
    });
  }, []);

  const checkStreak = useCallback(() => {
    const today = new Date().toISOString().slice(0, 10);
    if (profile.lastVisit === today) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    let newStreak = 1;
    if (profile.lastVisit === yesterdayStr) {
      newStreak = profile.streakCount + 1;
    }

    updateProfile({ streakCount: newStreak, lastVisit: today });
  }, [profile.lastVisit, profile.streakCount, updateProfile]);

  useEffect(() => {
    checkStreak();
    const h = () => {
      const data = JSON.parse(localStorage.getItem(PROFILE_KEY) || "{}");
      setProfile((prev) => ({ ...prev, ...data }));
    };
    window.addEventListener("kscene:profile", h);
    return () => window.removeEventListener("kscene:profile", h);
  }, []);

  return { profile, updateProfile };
}
