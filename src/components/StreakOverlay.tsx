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

      const t1 = setTimeout(() => setPhase("hold"), 1000);
      const t2 = setTimeout(() => setPhase("out"), 3500);
      const t3 = setTimeout(() => setShow(false), 4500);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    }
  }, [user]);

  if (!show) return null;

  const getEmoji = () => {
    if (streak >= 30) return "👑";
    if (streak >= 14) return "🔥";
    if (streak >= 7) return "💜";
    return "✨";
  };

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[200] flex items-center justify-center p-6"
      aria-hidden="true"
    >
      <div
        className="streak-card relative flex flex-col items-center gap-4 rounded-[40px] bg-white px-12 py-10 shadow-[0_32px_64px_-16px_rgba(232,80,58,0.4)] ring-1 ring-gray-100"
        style={{
          animation:
            phase === "in"
              ? "streakIn 1s cubic-bezier(.34,1.56,.64,1) forwards"
              : phase === "out"
                ? "streakOut 0.8s cubic-bezier(.36,0,.66,-0.56) forwards"
                : "streakHold 2.5s ease-in-out infinite",
        }}
      >
        <div className="flex items-center justify-center gap-2">
          <span className="text-4xl animate-bounce" style={{ animationDelay: "0ms" }}>
            {getEmoji()}
          </span>
          <span className="text-4xl animate-bounce" style={{ animationDelay: "200ms" }}>
            {getEmoji()}
          </span>
          <span className="text-4xl animate-bounce" style={{ animationDelay: "400ms" }}>
            {getEmoji()}
          </span>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-8xl font-black italic tracking-tighter text-primary leading-none">
            {streak}
          </span>
          <span className="text-sm font-black uppercase tracking-[0.3em] text-gray-400 -mt-2">
            DAY STREAK
          </span>
        </div>

        <div className="text-center">
          <p className="text-lg font-black text-gray-900 leading-tight">
            {streak === 1 ? "STREAK STARTED!" : "CONTINUED VIBES!"}
          </p>
          <p className="mt-1 text-xs font-bold text-primary/60 uppercase tracking-widest">
            {streak >= 30
              ? "LEGENDARY STATUS"
              : streak >= 14
                ? "DEDICATED STAN"
                : streak >= 7
                  ? "KDRAMA ADDICT"
                  : "KEEP IT UP!"}
          </p>
        </div>

        {/* Decorative dots */}
        <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-yellow-400 animate-ping" />
        <div
          className="absolute -bottom-2 -left-2 h-4 w-4 rounded-full bg-primary animate-ping"
          style={{ animationDelay: "500ms" }}
        />
      </div>

      <style>{`
        @keyframes streakIn {
          0% { opacity: 0; transform: scale(0.3) rotate(-15deg) translateY(100px); }
          70% { transform: scale(1.1) rotate(5deg); }
          100% { opacity: 1; transform: scale(1) rotate(0) translateY(0); }
        }
        @keyframes streakOut {
          0% { opacity: 1; transform: scale(1) translateY(0); }
          100% { opacity: 0; transform: scale(0.5) translateY(-100px) rotate(15deg); }
        }
        @keyframes streakHold {
          0%, 100% { transform: scale(1) translateY(0); }
          50% { transform: scale(1.02) translateY(-5px); }
        }
      `}</style>
    </div>
  );
}

export function getStreakData(): StreakData | null {
  try {
    return JSON.parse(localStorage.getItem(STREAK_KEY) || "null");
  } catch {
    return null;
  }
}
