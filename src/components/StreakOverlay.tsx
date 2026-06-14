import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";

const STREAK_KEY = "kscene_streak_v1";

type StreakData = { count: number; lastSeen: string };

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function calcStreak(data: StreakData | null): { streak: number; isNew: boolean } {
  const today = todayStr();
  if (!data) return { streak: 1, isNew: true };
  if (data.lastSeen === today) return { streak: data.count, isNew: false };
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (data.lastSeen === yesterday) return { streak: data.count + 1, isNew: true };
  return { streak: 1, isNew: true };
}

export function StreakOverlay() {
  const { user } = useAuth();
  const [show, setShow] = useState(false);
  const [streak, setStreak] = useState(1);
  const [phase, setPhase] = useState<"in" | "hold" | "out">("in");

  useEffect(() => {
    if (!user) return;
    try {
      const raw = localStorage.getItem(STREAK_KEY);
      const data: StreakData | null = raw ? JSON.parse(raw) : null;
      const { streak: s, isNew } = calcStreak(data);
      if (!isNew) return;
      localStorage.setItem(STREAK_KEY, JSON.stringify({ count: s, lastSeen: todayStr() }));
      setStreak(s);
      setShow(true);
      setPhase("in");
      const t1 = setTimeout(() => setPhase("hold"), 600);
      const t2 = setTimeout(() => setPhase("out"), 3200);
      const t3 = setTimeout(() => setShow(false), 4000);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    } catch {}
  }, [user]);

  if (!show) return null;

  const stars = streak >= 30 ? "🌟🌟🌟" : streak >= 14 ? "⭐⭐⭐" : streak >= 7 ? "⭐⭐" : "⭐";
  const msg =
    streak >= 30
      ? "Legendary viewer 🏆"
      : streak >= 14
        ? "Dedicated fan 🔥"
        : streak >= 7
          ? "K-drama addict 💜"
          : "Keep it up!";

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[200] flex items-center justify-center"
      aria-hidden
    >
      <div
        style={{
          background: "linear-gradient(135deg,#e8503a,#ff8c6b)",
          animation:
            phase === "in"
              ? "streakIn 0.6s cubic-bezier(.34,1.56,.64,1) forwards"
              : phase === "out"
                ? "streakOut 0.8s ease-in forwards"
                : "none",
          opacity: phase === "hold" ? 1 : undefined,
          transform: phase === "hold" ? "scale(1)" : undefined,
          borderRadius: 28,
          padding: "32px 40px",
          boxShadow: "0 20px 60px rgba(232,80,58,.5)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div style={{ fontSize: 48 }}>{stars}</div>
        <div style={{ fontSize: 64, fontWeight: 900, color: "white", lineHeight: 1 }}>{streak}</div>
        <div style={{ color: "white", textAlign: "center" }}>
          <p style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>
            {streak === 1 ? "Day 1 Streak!" : `${streak} Day Streak!`}
          </p>
          <p style={{ fontSize: 13, opacity: 0.8, margin: "4px 0 0" }}>{msg}</p>
        </div>
      </div>
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
