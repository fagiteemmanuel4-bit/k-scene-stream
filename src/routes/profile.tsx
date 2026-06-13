import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  LogOut,
  Settings,
  Bookmark,
  Clock,
  Download,
  Globe,
  Wifi,
  LogIn,
  Trash2,
  Play,
  Star,
  Flame,
  Trophy,
  Zap,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { AuthModal } from "@/components/AuthModal";
import { useWatchlist } from "@/lib/watchlist";
import { useWatchHistory, useDownloads, useSettings } from "@/lib/userdata";
import { getStreakData } from "@/components/StreakOverlay";
import { img } from "@/lib/tmdb";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — K·Scene" }] }),
  component: ProfilePage,
});

const COUNTRIES = [
  "Nigeria",
  "South Korea",
  "United States",
  "United Kingdom",
  "Canada",
  "Ghana",
  "Kenya",
  "South Africa",
  "India",
  "Australia",
  "Brazil",
  "Japan",
  "Philippines",
];
const QUALITIES = [
  { value: "auto", label: "Auto (Recommended)" },
  { value: "360p", label: "360p — Data Saver" },
  { value: "720p", label: "720p — HD" },
  { value: "1080p", label: "1080p — Full HD" },
];

type Tab = "watchlist" | "history" | "downloads" | "settings";

function ProfilePage() {
  const { user, signOut } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "signup">("login");
  const [activeTab, setActiveTab] = useState<Tab>("watchlist");
  const { list: watchlist } = useWatchlist();
  const { list: history, clearHistory } = useWatchHistory();
  const { list: downloads, removeDownload } = useDownloads();
  const { settings, update } = useSettings();
  const streak = getStreakData();

  if (!user) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center bg-white px-6 text-center">
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} defaultTab={authTab} />}
        <div className="text-6xl mb-2">🎬</div>
        <h2 className="mt-2 text-2xl font-black text-gray-900">Your K·Scene</h2>
        <p className="mt-2 text-sm text-gray-500 max-w-xs">
          Sign in to save your watchlist, track episodes, manage downloads and set preferences.
        </p>
        <div className="mt-8 flex gap-3">
          <button
            onClick={() => {
              setAuthTab("login");
              setShowAuth(true);
            }}
            className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white shadow-lift"
          >
            <LogIn className="h-4 w-4" /> Log In
          </button>
          <button
            onClick={() => {
              setAuthTab("signup");
              setShowAuth(true);
            }}
            className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700"
          >
            Sign Up
          </button>
        </div>
      </div>
    );
  }

  const displayName = user.displayName || user.email?.split("@")[0] || "K·Scene Fan";
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const streakCount = streak?.count || 0;

  const TABS: { key: Tab; label: string; icon: typeof Settings; count?: number }[] = [
    {
      key: "watchlist",
      label: "Watchlist",
      icon: Bookmark as typeof Settings,
      count: watchlist.length,
    },
    { key: "history", label: "Recent", icon: Clock as typeof Settings, count: history.length },
    {
      key: "downloads",
      label: "Downloads",
      icon: Download as typeof Settings,
      count: downloads.length,
    },
    { key: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-6">
      {/* Header */}
      <div className="bg-white px-4 pt-10 pb-5 shadow-sm">
        <div className="mx-auto max-w-xl">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-orange-400 text-xl font-black text-white shadow-lift">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-black text-gray-900">{displayName}</h1>
              <p className="truncate text-xs text-gray-500">{user.email}</p>
              <p className="mt-0.5 text-xs text-gray-400">{settings.country}</p>
            </div>
            <button
              onClick={signOut}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-500 hover:text-red-500 transition"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Streak card */}
          {streakCount > 0 && (
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-gradient-to-r from-primary to-orange-400 p-4 text-white">
              <div className="flex items-center gap-1.5">
                <Flame className="h-6 w-6 fill-white" />
                <span className="text-3xl font-black">{streakCount}</span>
              </div>
              <div className="flex-1">
                <p className="font-bold">Day Streak</p>
                <p className="text-xs opacity-80">
                  {streakCount >= 30
                    ? "Legendary 🏆"
                    : streakCount >= 14
                      ? "Dedicated fan 🔥"
                      : streakCount >= 7
                        ? "K-drama addict 💜"
                        : "Keep it going!"}
                </p>
              </div>
              <div className="text-right">
                <Trophy className="h-8 w-8 opacity-30" />
              </div>
            </div>
          )}

          {/* Stats row */}
          <div className="mt-4 grid grid-cols-3 gap-3">
            {[
              { label: "Watchlist", value: watchlist.length, icon: Bookmark },
              { label: "Watched", value: history.length, icon: Clock },
              { label: "Downloads", value: downloads.length, icon: Download },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-gray-100 bg-white p-3 text-center shadow-sm"
              >
                <p className="text-2xl font-black text-primary">{stat.value}</p>
                <p className="text-[11px] text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-10 bg-white border-b shadow-sm">
        <div className="mx-auto flex max-w-xl gap-0 px-2 py-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl py-2 text-[10px] font-bold transition ${
                activeTab === t.key
                  ? "bg-primary/10 text-primary"
                  : "text-gray-400 hover:text-gray-700"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[9px] font-black ${activeTab === t.key ? "bg-primary text-white" : "bg-gray-100 text-gray-500"}`}
                >
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-xl px-4 pt-5">
        {/* Watchlist */}
        {activeTab === "watchlist" &&
          (watchlist.length === 0 ? (
            <EmptyState
              emoji="🔖"
              title="Nothing saved yet"
              sub="Tap + on any drama to save it here."
            />
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {watchlist.map((item) => (
                <Link
                  key={item.id}
                  to="/title/$id"
                  params={{ id: String(item.id) }}
                  className="group relative overflow-hidden rounded-xl bg-gray-100"
                >
                  <div style={{ aspectRatio: "2/3" }}>
                    {item.poster_path ? (
                      <img
                        src={img(item.poster_path, "w300")}
                        alt={item.name}
                        className="h-full w-full object-cover transition group-hover:scale-105"
                      />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-2xl bg-gray-200">
                        🎬
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <p className="line-clamp-2 text-[10px] font-bold text-white leading-tight">
                      {item.name}
                    </p>
                    <div className="flex items-center gap-0.5 mt-0.5">
                      <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                      <span className="text-[9px] text-white/80">
                        {item.vote_average.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ))}

        {/* History */}
        {activeTab === "history" && (
          <div>
            {history.length > 0 && (
              <div className="mb-4 flex justify-end">
                <button
                  onClick={clearHistory}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Clear history
                </button>
              </div>
            )}
            {history.length === 0 ? (
              <EmptyState
                emoji="⏱️"
                title="No watch history"
                sub="Episodes you play will appear here."
              />
            ) : (
              <div className="space-y-3">
                {history.map((item, i) => (
                  <Link
                    key={i}
                    to="/title/$id"
                    params={{ id: String(item.id) }}
                    className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm transition hover:border-primary"
                  >
                    <div className="h-14 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-200">
                      {item.poster_path && (
                        <img
                          src={img(item.poster_path, "w200")}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-gray-900">{item.name}</p>
                      {item.season && item.episode && (
                        <p className="text-xs text-gray-500">
                          S{item.season} · E{item.episode}
                        </p>
                      )}
                      <p className="text-[10px] text-gray-400">
                        {new Date(item.watchedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <Play className="h-4 w-4 shrink-0 text-primary" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Downloads */}
        {activeTab === "downloads" &&
          (downloads.length === 0 ? (
            <EmptyState
              emoji="⬇️"
              title="No downloads"
              sub="Use the Download button inside the player."
            />
          ) : (
            <div className="space-y-3">
              {downloads.map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 shadow-sm"
                >
                  <div className="h-14 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-200">
                    {item.poster_path && (
                      <img
                        src={img(item.poster_path, "w200")}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-gray-900">{item.name}</p>
                    {item.season && item.episode && (
                      <p className="text-xs text-gray-500">
                        S{item.season} · E{item.episode} · {item.quality}
                      </p>
                    )}
                    <p className="text-[10px] text-gray-400">
                      {new Date(item.downloadedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <a
                      href={item.url}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition"
                    >
                      <Download className="h-4 w-4" />
                    </a>
                    <button
                      onClick={() => removeDownload(item.url)}
                      className="grid h-8 w-8 place-items-center rounded-full text-gray-300 hover:text-red-500 transition"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}

        {/* Settings */}
        {activeTab === "settings" && (
          <div className="space-y-4">
            <SettingsCard
              title="Country / Region"
              icon={<Globe className="h-4 w-4 text-primary" />}
            >
              <select
                value={settings.country}
                onChange={(e) => update({ country: e.target.value })}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-primary"
              >
                {COUNTRIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </SettingsCard>

            <SettingsCard
              title="Streaming Quality"
              icon={<Wifi className="h-4 w-4 text-primary" />}
            >
              {QUALITIES.map((q) => (
                <label key={q.value} className="flex cursor-pointer items-center gap-3 py-1">
                  <div
                    className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${settings.streamingQuality === q.value ? "border-primary" : "border-gray-300"}`}
                  >
                    {settings.streamingQuality === q.value && (
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <input
                    type="radio"
                    className="sr-only"
                    checked={settings.streamingQuality === q.value}
                    onChange={() =>
                      update({ streamingQuality: q.value as "auto" | "360p" | "720p" | "1080p" })
                    }
                  />
                  <span className="text-sm text-gray-700">{q.label}</span>
                </label>
              ))}
            </SettingsCard>

            <SettingsCard title="Data Saver" icon={<Zap className="h-4 w-4 text-primary" />}>
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">Force 360p · reduce image quality</p>
                <button
                  onClick={() => update({ dataSaver: !settings.dataSaver })}
                  className={`relative h-6 w-11 rounded-full transition-colors ${settings.dataSaver ? "bg-primary" : "bg-gray-200"}`}
                >
                  <div
                    className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${settings.dataSaver ? "translate-x-5" : "translate-x-0.5"}`}
                  />
                </button>
              </div>
            </SettingsCard>

            <SettingsCard title="Account" icon={<LogOut className="h-4 w-4 text-primary" />}>
              <p className="text-sm text-gray-500 mb-3">{user.email}</p>
              <button
                onClick={signOut}
                className="w-full rounded-xl bg-red-50 py-3 text-sm font-bold text-red-500 transition hover:bg-red-100"
              >
                Sign Out
              </button>
            </SettingsCard>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ emoji, title, sub }: { emoji: string; title: string; sub: string }) {
  return (
    <div className="mt-16 text-center">
      <p className="text-5xl">{emoji}</p>
      <p className="mt-4 font-bold text-gray-800">{title}</p>
      <p className="mt-1 text-sm text-gray-400">{sub}</p>
    </div>
  );
}

function SettingsCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <h3 className="font-bold text-gray-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}
