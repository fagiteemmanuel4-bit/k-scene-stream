import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  LogOut,
  Settings,
  Bookmark,
  Clock,
  Download,
  LogIn,
  Trash2,
  Play,
  Star,
  Flame,
  ChevronRight,
  ShieldCheck,
  Globe,
  Wifi,
  Zap,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { AuthModal } from "@/components/AuthModal";
import { useWatchlist } from "@/lib/watchlist";
import { useWatchHistory, useDownloads, useSettings } from "@/lib/userdata";
import { getStreakData } from "@/components/StreakOverlay";
import { img } from "@/lib/tmdb";
import { CustomSelect } from "@/components/ui/CustomSelect";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "My K·Scene Profile" }] }),
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
].map((c) => ({ value: c, label: c }));

const QUALITIES = [
  { value: "auto", label: "Auto (Recommended)" },
  { value: "360p", label: "360p — Data Saver" },
  { value: "720p", label: "720p — HD" },
  { value: "1080p", label: "1080p — Full HD" },
];

type Tab = "library" | "history" | "settings";

function ProfilePage() {
  const { user, signOut } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "signup">("login");
  const [activeTab, setActiveTab] = useState<Tab>("library");
  const { list: watchlist } = useWatchlist();
  const { list: history, clearHistory } = useWatchHistory();
  const { list: downloads } = useDownloads();
  const { settings, update } = useSettings();
  const streak = getStreakData();

  if (!user) {
    return (
      <div className="flex min-h-[90vh] flex-col items-center justify-center bg-white px-8 text-center">
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} defaultTab={authTab} />}
        <div className="relative mb-8">
          <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center text-4xl animate-pulse">
            🎬
          </div>
          <div className="absolute -bottom-2 -right-2 h-10 w-10 rounded-full bg-white shadow-xl flex items-center justify-center text-xl">
            ✨
          </div>
        </div>
        <h2 className="text-3xl font-black italic tracking-tighter text-gray-900">
          JOIN THE SCENE
        </h2>
        <p className="mt-3 text-sm font-medium text-gray-500 max-w-xs leading-relaxed">
          Sign in to unlock your personal K-Drama library, track progress, and manage downloads.
        </p>
        <div className="mt-10 flex w-full max-w-xs flex-col gap-4">
          <button
            onClick={() => {
              setAuthTab("login");
              setShowAuth(true);
            }}
            className="w-full rounded-full bg-primary py-4 text-sm font-black uppercase tracking-widest text-white shadow-[0_12px_24px_-6px_rgba(232,80,58,0.4)] transition hover:brightness-110 active:scale-95"
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setAuthTab("signup");
              setShowAuth(true);
            }}
            className="w-full rounded-full border border-gray-100 bg-gray-50 py-4 text-sm font-bold text-gray-600 transition hover:bg-gray-100"
          >
            Create Account
          </button>
        </div>
      </div>
    );
  }

  const displayName = user.displayName || user.email?.split("@")[0] || "Fan";
  const streakCount = streak?.count || 0;

  return (
    <div className="min-h-screen bg-gray-50/30 pb-28">
      {/* Premium Header */}
      <div className="bg-white px-6 pt-16 pb-12 rounded-b-[48px] shadow-sm ring-1 ring-gray-100">
        <div className="mx-auto max-w-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-orange-400 p-0.5 shadow-xl">
                  <div className="h-full w-full rounded-[22px] bg-white flex items-center justify-center text-2xl font-black text-primary">
                    {displayName[0].toUpperCase()}
                  </div>
                </div>
                <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-green-500 ring-4 ring-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="truncate text-2xl font-black italic tracking-tighter text-gray-900">
                    {displayName.toUpperCase()}
                  </h1>
                  <ShieldCheck className="h-5 w-5 text-blue-500 fill-current" />
                </div>
                <p className="truncate text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                  {user.email}
                </p>
              </div>
            </div>
            <button
              onClick={signOut}
              className="rounded-full bg-gray-50 p-3 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>

          {/* New Streak Card */}
          {streakCount > 0 && (
            <div className="mt-8 relative overflow-hidden rounded-3xl bg-gray-900 p-6 text-white shadow-2xl">
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center ring-1 ring-white/20">
                    <Flame className="h-7 w-7 text-primary fill-current" />
                  </div>
                  <div>
                    <p className="text-2xl font-black italic">{streakCount} DAYS</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/50">
                      Current Streak
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-black uppercase tracking-widest text-primary">
                    Elite Fan
                  </p>
                  <div className="mt-1 flex gap-0.5">
                    <Star className="h-3 w-3 fill-primary text-primary" />
                    <Star className="h-3 w-3 fill-primary text-primary" />
                    <Star className="h-3 w-3 fill-primary text-primary" />
                  </div>
                </div>
              </div>
              <div className="absolute -right-8 -bottom-8 h-32 w-32 rounded-full bg-primary/20 blur-3xl" />
            </div>
          )}

          <div className="mt-8 grid grid-cols-3 gap-4">
            <StatCard label="Watchlist" value={watchlist.length} icon={Bookmark} />
            <StatCard label="History" value={history.length} icon={Clock} />
            <StatCard label="Offline" value={downloads.length} icon={Download} />
          </div>
        </div>
      </div>

      {/* Modern Tabs */}
      <div className="mx-auto max-w-2xl px-6 mt-10">
        <div className="flex gap-2 rounded-2xl bg-gray-100 p-1.5">
          {["library", "history", "settings"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as Tab)}
              className={`flex-1 rounded-xl py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-6 pt-8">
        {activeTab === "library" && (
          <div className="space-y-6">
            <SectionHeader title="Your Watchlist" count={watchlist.length} />
            {watchlist.length === 0 ? (
              <EmptyState emoji="🔖" message="No dramas saved." />
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {watchlist.map((item) => (
                  <Link
                    key={item.id}
                    to="/title/$id"
                    params={{ id: String(item.id) }}
                    className="group"
                  >
                    <div className="aspect-[2/3] overflow-hidden rounded-2xl bg-gray-200 shadow-sm ring-1 ring-gray-100 transition-transform group-hover:scale-105">
                      <img
                        src={img(item.poster_path, "w300")}
                        className="h-full w-full object-cover"
                        alt=""
                      />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <SectionHeader title="Recently Watched" count={history.length} />
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-full transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
            {history.length === 0 ? (
              <EmptyState emoji="⏱️" message="Nothing watched yet." />
            ) : (
              <div className="space-y-4">
                {history.map((item, i) => (
                  <Link
                    key={i}
                    to="/title/$id"
                    params={{ id: String(item.id) }}
                    className="flex items-center gap-4 rounded-3xl bg-white p-3 shadow-sm ring-1 ring-gray-100 hover:ring-primary/30 transition-all group"
                  >
                    <div className="h-16 w-12 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                      <img
                        src={img(item.poster_path, "w200")}
                        className="h-full w-full object-cover"
                        alt=""
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-black text-gray-900 group-hover:text-primary transition-colors">
                        {item.name}
                      </p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                        {item.season ? `S${item.season} · E${item.episode}` : "Movie"}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6">
            <SectionHeader title="App Settings" />
            <div className="space-y-6">
              <div className="rounded-[40px] bg-white p-8 shadow-sm ring-1 ring-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="rounded-2xl bg-blue-50 p-2">
                    <Globe className="h-5 w-5 text-blue-500" />
                  </div>
                  <h3 className="font-black italic text-gray-900 tracking-tight">REGION</h3>
                </div>
                <CustomSelect<string>
                  options={COUNTRIES}
                  value={settings.country}
                  onChange={(val) => update({ country: val })}
                />
              </div>

              <div className="rounded-[40px] bg-white p-8 shadow-sm ring-1 ring-gray-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="rounded-2xl bg-primary/10 p-2">
                    <Wifi className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-black italic text-gray-900 tracking-tight">STREAMING</h3>
                </div>
                <CustomSelect<string>
                  label="Default Quality"
                  options={QUALITIES}
                  value={settings.streamingQuality}
                  onChange={(val) => update({ streamingQuality: val })}
                />

                <div className="mt-8 flex items-center justify-between rounded-[32px] bg-gray-50 p-6">
                  <div className="flex items-center gap-3">
                    <Zap
                      className={`h-5 w-5 ${settings.dataSaver ? "text-yellow-500 fill-current" : "text-gray-300"}`}
                    />
                    <div>
                      <p className="text-xs font-black text-gray-900 uppercase">Data Saver</p>
                      <p className="text-[10px] font-bold text-gray-400">
                        Force 360p & reduce data usage
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => update({ dataSaver: !settings.dataSaver })}
                    className={`relative h-7 w-12 rounded-full transition-colors ${settings.dataSaver ? "bg-primary" : "bg-gray-300"}`}
                  >
                    <div
                      className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${settings.dataSaver ? "translate-x-6" : "translate-x-1"}`}
                    />
                  </button>
                </div>
              </div>

              <button
                onClick={signOut}
                className="w-full rounded-[32px] bg-red-50 py-5 text-sm font-black uppercase tracking-[0.2em] text-red-500 transition-colors hover:bg-red-100"
              >
                Sign Out Account
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl bg-gray-50/50 py-4 ring-1 ring-gray-100">
      <Icon className="h-4 w-4 text-gray-400 mb-1" />
      <span className="text-xl font-black italic text-gray-900">{value}</span>
      <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">{label}</span>
    </div>
  );
}

function SectionHeader({ title, count }: { title: string; count?: number }) {
  return (
    <div className="flex items-center gap-3">
      <h2 className="text-lg font-black italic tracking-tighter text-gray-900 uppercase">
        {title}
      </h2>
      {count !== undefined && (
        <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-black text-primary">
          {count}
        </span>
      )}
    </div>
  );
}

function EmptyState({ emoji, message }: { emoji: string; message: string }) {
  return (
    <div className="py-12 text-center rounded-3xl bg-gray-50/30 ring-1 ring-inset ring-gray-100">
      <span className="text-3xl">{emoji}</span>
      <p className="mt-2 text-sm font-bold text-gray-400 uppercase tracking-widest">{message}</p>
    </div>
  );
}
