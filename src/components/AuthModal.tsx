import { useState } from "react";
import { X, Eye, EyeOff, Rabbit } from "lucide-react";
import { useAuth } from "@/lib/auth";

type Props = { onClose: () => void; defaultTab?: "login" | "signup" };

export function AuthModal({ onClose, defaultTab = "login" }: Props) {
  const { signIn, signUp } = useAuth();
  const [tab, setTab] = useState<"login" | "signup">(defaultTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const submit = async () => {
    setError(null);
    setLoading(true);
    if (tab === "login") {
      const { error } = await signIn(email, password);
      if (error) { setError(error); setLoading(false); return; }
      onClose();
    } else {
      if (!name.trim()) { setError("Please enter your name."); setLoading(false); return; }
      const { error } = await signUp(email, password, name);
      if (error) { setError(error); setLoading(false); return; }
      setSuccess(true);
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-3xl border bg-card p-8 shadow-hero">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-lift">
            <Rabbit className="h-6 w-6" strokeWidth={2.4} />
          </div>
          <h2 className="mt-3 text-xl font-black">K·Scene</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {tab === "login" ? "Welcome back" : "Create your account"}
          </p>
        </div>

        {success ? (
          <div className="mt-6 rounded-2xl bg-green-500/10 p-4 text-center text-sm text-green-600 dark:text-green-400">
            Check your email to confirm your account, then log in.
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="mt-6 flex rounded-full bg-secondary p-1 text-sm font-semibold">
              {(["login", "signup"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setError(null); }}
                  className={`flex-1 rounded-full py-2 transition-all ${tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
                >
                  {t === "login" ? "Log In" : "Sign Up"}
                </button>
              ))}
            </div>

            <div className="mt-5 space-y-3">
              {tab === "signup" && (
                <div>
                  <label className="mb-1 block text-xs font-semibold text-muted-foreground">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full rounded-xl border bg-secondary px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              )}
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="w-full rounded-xl border bg-secondary px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-muted-foreground">Password</label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border bg-secondary px-4 py-3 pr-10 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    onKeyDown={e => e.key === "Enter" && submit()}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <p className="rounded-xl bg-destructive/10 px-4 py-2 text-xs text-destructive">{error}</p>
              )}

              <button
                onClick={submit}
                disabled={loading}
                className="mt-2 w-full rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground shadow-lift transition hover:brightness-110 disabled:opacity-60"
              >
                {loading ? "Please wait…" : tab === "login" ? "Log In" : "Create Account"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
