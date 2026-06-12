import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";

const STREAK_KEY = "kscene_streak_v1";

type StreakData = {
  count: number;
  lastSeen: string; // YYYY-MM-DD
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function calcStreak(data: StreakData | null): { streak: number; isNew: boolean } {
  const today = todayStr();
  if (!data) return { streak: 1, isNew: true };
  if (data.lastSeen === today) return { streak: data.count, isNew: false };
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (data.lastSeen === yesterday) return { streak: data.count + 1, isNew: true };
  return { streak: 1, isNew: true }; // streak broken
}

export function StreakOverlay() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [streak, setStreak] = useState(1);
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");

  useEffect(() => {
    if (!user) return;
    const raw = localStorage.getItem(STREAK_KEY);
    const data: StreakData | null = raw ? JSON.parse(raw) : null;
    const { streak: s, isNew } = calcStreak(data);

    if (isNew) {
      localStorage.setItem(STREAK_KEY, JSON.stringify({ count: s, lastSeen: todayStr() }));
      setStreak(s);
      setShow(true);
      setPhase("in");

      const t1 = setTimeout(() => setPhase("hold"), 600);
      const t2 = setTimeout(() => setPhase("out"), 3200);
      const t3 = setTimeout(() => setShow(false), 4000);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
  }, [user]);

  if (!show) return null;

  const stars = streak >= 30 ? "🌟🌟🌟" : streak >= 14 ? "⭐⭐⭐" : streak >= 7 ? "⭐⭐" : "⭐";

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[200] flex items-center justify-center"
      aria-hidden="true"
    >
      <div
        className="streak-card flex flex-col items-center gap-2 rounded-3xl px-10 py-8 shadow-hero"
        style={{
          background: "linear-gradient(135deg, #e8503a, #ff8c6b)",
          animation: phase === "in"
            ? "streakIn 0.6s cubic-bezier(.34,1.56,.64,1) forwards"
            : phase === "out"
            ? "streakOut 0.8s ease-in forwards"
            : "none",
          opacity: phase === "hold" ? 1 : undefined,
          transform: phase === "hold" ? "scale(1)" : undefined,
        }}
      >
        <div className="text-5xl">{stars}</div>
        <div className="text-6xl font-black text-white leading-none">{streak}</div>
        <div className="text-center text-white/90">
          <p className="text-lg font-bold">
            {streak === 1 ? "Day 1 Streak!" : `${streak} Day Streak!`}
          </p>
          <p className="text-sm font-medium opacity-80">
            {streak >= 30 ? "Legendary viewer 🏆" : streak >= 14 ? "Dedicated fan 🔥" : streak >= 7 ? "K-drama addict 💜" : "Keep it up!"}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes streakIn {
          from { opacity: 0; transform: scale(0.3) translateY(60px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes streakOut {
          from { opacity: 1; transform: scale(1) translateY(0); }
          to   { opacity: 0; transform: scale(0.8) translateY(-40px); }
        }
      `}</style>
    </div>
  );
}

// Exposed for profile page to read streak count
export function getStreakData(): StreakData | null {
  try { return JSON.parse(localStorage.getItem(STREAK_KEY) || "null"); } catch { return null; }
}
