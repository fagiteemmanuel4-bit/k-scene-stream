import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  User, LogOut, Settings, Bookmark, Clock, Download, Globe,
  Wifi, ChevronRight, LogIn, Trash2, Play, Star
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { AuthModal } from "@/components/AuthModal";
import { useWatchlist } from "@/lib/watchlist";
import { useWatchHistory, useDownloads, useSettings } from "@/lib/userdata";
import { img } from "@/lib/tmdb";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — K·Scene" }] }),
  component: ProfilePage,
});

const COUNTRIES = ["Nigeria", "South Korea", "United States", "United Kingdom", "Canada", "Ghana", "Kenya", "South Africa", "India", "Australia"];
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
  const { list: watchlist, toggle } = useWatchlist();
  const { list: history, clearHistory } = useWatchHistory();
  const { list: downloads, removeDownload } = useDownloads();
  const { settings, update } = useSettings();

  if (!user) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center px-6 text-center">
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} defaultTab={authTab} />}
        <div className="text-5xl">🐰</div>
        <h2 className="mt-4 text-2xl font-black">Your K·Scene Profile</h2>
        <p className="mt-2 text-sm text-muted-foreground max-w-xs">
          Sign in to save your watchlist, track episodes, manage downloads and set preferences.
        </p>
        <div className="mt-8 flex gap-3">
          <button
            onClick={() => { setAuthTab("login"); setShowAuth(true); }}
            className="flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lift"
          >
            <LogIn className="h-4 w-4" /> Log In
          </button>
          <button
            onClick={() => { setAuthTab("signup"); setShowAuth(true); }}
            className="flex items-center gap-2 rounded-full border bg-card px-6 py-3 text-sm font-semibold"
          >
            Create Account
          </button>
        </div>
      </div>
    );
  }

  const displayName = user.user_metadata?.full_name || user.email?.split("@")[0] || "K·Scene Fan";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();

  const TABS: { key: Tab; label: string; icon: any; count?: number }[] = [
    { key: "watchlist", label: "Watchlist", icon: Bookmark, count: watchlist.length },
    { key: "history", label: "Recent", icon: Clock, count: history.length },
    { key: "downloads", label: "Downloads", icon: Download, count: downloads.length },
    { key: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen pb-6">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/20 to-background px-6 pt-12 pb-6">
        <div className="mx-auto max-w-xl">
          <div className="flex items-center gap-4">
            <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-primary/60 text-xl font-black text-white shadow-lift">
              {initials}
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-black">{displayName}</h1>
              <p className="truncate text-sm text-muted-foreground">{user.email}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{settings.country} · {settings.streamingQuality === "auto" ? "Auto Quality" : settings.streamingQuality}</p>
            </div>
            <button
              onClick={signOut}
              className="ml-auto flex shrink-0 items-center gap-1.5 rounded-full border bg-card px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-destructive transition"
            >
              <LogOut className="h-3.5 w-3.5" /> Sign Out
            </button>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-3 gap-3">
            {[
              { label: "Watchlist", value: watchlist.length },
              { label: "Watched", value: history.length },
              { label: "Downloads", value: downloads.length },
            ].map(stat => (
              <div key={stat.label} className="rounded-2xl border bg-card p-3 text-center">
                <p className="text-2xl font-black text-primary">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-xl gap-1 px-4 py-2">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[10px] font-semibold transition ${
                activeTab === t.key ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${activeTab === t.key ? "bg-primary text-white" : "bg-secondary"}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-xl px-4 pt-6">
        {/* Watchlist Tab */}
        {activeTab === "watchlist" && (
          <div>
            {watchlist.length === 0 ? (
              <EmptyState emoji="🔖" title="No saved dramas yet" sub="Tap the + button on any drama to save it here." />
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {watchlist.map(item => (
                  <Link key={item.id} to="/title/$id" params={{ id: String(item.id) }} className="group relative overflow-hidden rounded-xl bg-muted">
                    <div style={{ aspectRatio: "2/3" }}>
                      {item.poster_path ? (
                        <img src={img(item.poster_path, "w300")} alt={item.name} className="h-full w-full object-cover transition group-hover:scale-105" />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-2xl">🎬</div>
                      )}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                      <p className="line-clamp-2 text-[10px] font-semibold text-white">{item.name}</p>
                      <div className="flex items-center gap-0.5 mt-0.5">
                        <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
                        <span className="text-[9px] text-white/80">{item.vote_average.toFixed(1)}</span>
                      </div>
                    </div>
                    <button
                      onClick={e => { e.preventDefault(); toggle(item); }}
                      className="absolute top-1.5 right-1.5 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
                    >
                      <Bookmark className="h-3 w-3 fill-current" />
                    </button>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div>
            {history.length > 0 && (
              <div className="mb-4 flex justify-end">
                <button onClick={clearHistory} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition">
                  <Trash2 className="h-3.5 w-3.5" /> Clear history
                </button>
              </div>
            )}
            {history.length === 0 ? (
              <EmptyState emoji="⏱️" title="No watch history" sub="Episodes you play will appear here." />
            ) : (
              <div className="space-y-3">
                {history.map((item, i) => (
                  <Link key={i} to="/title/$id" params={{ id: String(item.id) }}
                    className="flex items-center gap-3 rounded-2xl border bg-card p-3 transition hover:border-primary"
                  >
                    <div className="h-14 w-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {item.poster_path && <img src={img(item.poster_path, "w200")} alt={item.name} className="h-full w-full object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{item.name}</p>
                      {item.season && item.episode && (
                        <p className="text-xs text-muted-foreground">S{item.season} E{item.episode}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground">{new Date(item.watchedAt).toLocaleDateString()}</p>
                    </div>
                    <Play className="h-4 w-4 shrink-0 text-primary" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Downloads Tab */}
        {activeTab === "downloads" && (
          <div>
            {downloads.length === 0 ? (
              <EmptyState emoji="⬇️" title="No downloads yet" sub="Use the download button inside the player to save episodes." />
            ) : (
              <div className="space-y-3">
                {downloads.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-2xl border bg-card p-3">
                    <div className="h-14 w-10 shrink-0 overflow-hidden rounded-lg bg-muted">
                      {item.poster_path && <img src={img(item.poster_path, "w200")} alt={item.name} className="h-full w-full object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{item.name}</p>
                      {item.season && item.episode && (
                        <p className="text-xs text-muted-foreground">S{item.season} E{item.episode} · {item.quality}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground">{new Date(item.downloadedAt).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <a href={item.url} download target="_blank" rel="noreferrer"
                        className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition"
                      >
                        <Download className="h-4 w-4" />
                      </a>
                      <button onClick={() => removeDownload(item.url)}
                        className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:text-destructive transition"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === "settings" && (
          <div className="space-y-6">
            {/* Country */}
            <div className="rounded-2xl border bg-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Globe className="h-4 w-4 text-primary" />
                <h3 className="font-bold">Country / Region</h3>
              </div>
              <select
                value={settings.country}
                onChange={e => update({ country: e.target.value })}
                className="w-full rounded-xl border bg-secondary px-4 py-3 text-sm outline-none focus:border-primary"
              >
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Streaming Quality */}
            <div className="rounded-2xl border bg-card p-5">
              <div className="flex items-center gap-2 mb-3">
                <Wifi className="h-4 w-4 text-primary" />
                <h3 className="font-bold">Streaming Quality</h3>
              </div>
              <div className="space-y-2">
                {QUALITIES.map(q => (
                  <label key={q.value} className="flex items-center gap-3 cursor-pointer">
                    <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center transition ${
                      settings.streamingQuality === q.value ? "border-primary" : "border-muted-foreground"
                    }`}>
                      {settings.streamingQuality === q.value && <div className="h-2 w-2 rounded-full bg-primary" />}
                    </div>
                    <input type="radio" className="sr-only" checked={settings.streamingQuality === q.value} onChange={() => update({ streamingQuality: q.value as any })} />
                    <span className="text-sm">{q.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Data Saver */}
            <div className="rounded-2xl border bg-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold">Data Saver</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Force 360p, reduce image quality</p>
                </div>
                <button
                  onClick={() => update({ dataSaver: !settings.dataSaver })}
                  className={`relative h-6 w-11 rounded-full transition-colors ${settings.dataSaver ? "bg-primary" : "bg-muted"}`}
                >
                  <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${settings.dataSaver ? "translate-x-5" : "translate-x-0.5"}`} />
                </button>
              </div>
            </div>

            {/* Account */}
            <div className="rounded-2xl border bg-card p-5">
              <h3 className="font-bold mb-1">Account</h3>
              <p className="text-sm text-muted-foreground mb-4">{user.email}</p>
              <button
                onClick={signOut}
                className="flex w-full items-center justify-between rounded-xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive transition hover:bg-destructive/20"
              >
                <span className="flex items-center gap-2"><LogOut className="h-4 w-4" /> Sign Out</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
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
      <p className="mt-4 font-bold">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{sub}</p>
    </div>
  );
}
