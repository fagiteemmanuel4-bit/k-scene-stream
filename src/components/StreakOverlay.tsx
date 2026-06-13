import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { useUserProfile } from "@/lib/userdata";
import { Flame, CheckCircle2, Sparkles } from "lucide-react";

export function StreakOverlay() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const [show, setShow] = useState(false);
  const [displayStreak, setDisplayStreak] = useState(0);
  const [step, setStep] = useState<"idle" | "ignition" | "increment" | "settled">("idle");
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (!user || !profile.lastVisit || hasTriggeredRef.current) return;

    const todayUTC = new Date(
      Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate()),
    )
      .toISOString()
      .slice(0, 10);

    if (profile.lastVisit === todayUTC) {
      hasTriggeredRef.current = true;
      setShow(true);
      setDisplayStreak(profile.streakCount - 1);
      setStep("idle");

      // Step 1: Idle (0.5s)
      const t1 = setTimeout(() => {
        setStep("ignition");
      }, 800);

      // Step 2: Ignition (0.8s)
      const t2 = setTimeout(() => {
        setStep("increment");
        setDisplayStreak(profile.streakCount);
      }, 1600);

      // Step 3: Increment (1.2s)
      const t3 = setTimeout(() => {
        setStep("settled");
      }, 2800);

      // Final: Hide (4s total)
      const t4 = setTimeout(() => {
        setShow(false);
      }, 5000);

      return () => {
        [t1, t2, t3, t4].forEach(clearTimeout);
      };
    }
  }, [user, profile.lastVisit, profile.streakCount]);

  if (!show) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[300] flex items-center justify-center bg-black/20 p-6 backdrop-blur-[2px] animate-in fade-in duration-500"
      aria-hidden="true"
    >
      <div className="relative flex w-full max-w-sm flex-col items-center gap-6 rounded-[50px] bg-white p-12 shadow-2xl ring-1 ring-gray-100 animate-in zoom-in-90 duration-500">
        {/* Step 1 & 2: The Flame (Idle -> Ignition) */}
        <div className="relative">
          <div
            className={`flex h-32 w-32 items-center justify-center rounded-[40px] transition-all duration-700 ${
              step === "idle"
                ? "bg-gray-100 grayscale opacity-50 pulse-dim"
                : "bg-orange-500/10 shadow-[0_20px_50px_rgba(249,115,22,0.3)] scale-110"
            }`}
          >
            <Flame
              className={`h-16 w-16 transition-all duration-700 ${
                step === "idle" ? "text-gray-400" : "text-orange-500 fill-orange-500 animate-bounce"
              }`}
            />
          </div>

          {/* Ignition Burst (Confetti Effect) */}
          {step !== "idle" && (
            <div className="absolute inset-0 z-[-1] scale-150">
              <div className="confetti-burst" />
            </div>
          )}
        </div>

        {/* Step 3: Number Increment (Text Flip) */}
        <div className="flex flex-col items-center">
          <div className="relative h-20 overflow-hidden text-7xl font-black italic tracking-tighter text-gray-900">
            <div
              className={`flex flex-col transition-transform duration-700 ease-out`}
              style={{
                transform:
                  step === "increment" || step === "settled" ? "translateY(-50%)" : "translateY(0)",
              }}
            >
              <span>{displayStreak > 0 ? displayStreak : profile.streakCount}</span>
              <span>{profile.streakCount}</span>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-400">
            DAY STREAK
          </span>
        </div>

        {/* Step 4: Settled State (Satisfying Glow) */}
        <div className="text-center">
          <h3 className="text-xl font-black uppercase tracking-tight text-gray-900">
            {step === "settled" ? "Progress Saved!" : "Checking Activity..."}
          </h3>
          <div className="mt-2 flex items-center justify-center gap-2">
            {step === "settled" ? (
              <div className="flex items-center gap-1.5 rounded-full bg-green-500 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-white shadow-lift animate-in slide-in-from-bottom-2">
                <CheckCircle2 className="h-3.5 w-3.5" /> SECURE
              </div>
            ) : (
              <div className="h-1.5 w-24 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full bg-primary transition-all duration-[3000ms]"
                  style={{ width: step === "settled" ? "100%" : "60%" }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Ambient Sparkles */}
        {step === "settled" && (
          <div className="absolute top-0 right-0 p-8">
            <Sparkles className="h-6 w-6 text-yellow-400 animate-pulse" />
          </div>
        )}
      </div>

      <style>{`
        .pulse-dim {
          animation: pulseDim 2s infinite ease-in-out;
        }
        @keyframes pulseDim {
          0%, 100% { opacity: 0.4; transform: scale(0.98); }
          50% { opacity: 0.6; transform: scale(1); }
        }
        .confetti-burst {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          box-shadow:
            0 -40px #f97316, 0 40px #f97316,
            -40px 0 #f97316, 40px 0 #f97316,
            -30px -30px #facc15, 30px 30px #facc15,
            -30px 30px #facc15, 30px -30px #facc15;
          animation: burst 0.8s ease-out forwards;
        }
        @keyframes burst {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(2.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

export function getStreakData(): { count: number; lastSeen: string } | null {
  try {
    const raw = localStorage.getItem("kscene_profile_v1");
    if (!raw) return null;
    const profile = JSON.parse(raw);
    return { count: profile.streakCount, lastSeen: profile.lastVisit };
  } catch {
    return null;
  }
}
