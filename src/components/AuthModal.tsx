import { useState } from "react";
import { X, Eye, EyeOff } from "lucide-react";
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

  const submit = async () => {
    setError(null);
    if (!email.trim() || !password.trim()) { setError("Please fill in all fields."); return; }
    if (tab === "signup" && !name.trim()) { setError("Please enter your name."); return; }
    setLoading(true);
    const { error } = tab === "login"
      ? await signIn(email, password)
      : await signUp(email, password, name);
    setLoading(false);
    if (error) { setError(error); return; }
    onClose(); // login or signup both close immediately — no email verify
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-t-3xl sm:rounded-3xl border bg-white p-6 shadow-hero sm:p-8">
        <button onClick={onClose} className="absolute right-4 top-4 grid h-8 w-8 place-items-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition">
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center">
          <div className="text-4xl">🎬</div>
          <h2 className="mt-2 text-xl font-black text-gray-900">K·Scene</h2>
          <p className="mt-0.5 text-sm text-gray-500">
            {tab === "login" ? "Welcome back!" : "Create your free account"}
          </p>
        </div>

        {/* Tabs */}
        <div className="mt-5 flex rounded-full bg-gray-100 p-1 text-sm font-semibold">
          {(["login", "signup"] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setError(null); }}
              className={`flex-1 rounded-full py-2 transition-all text-sm ${tab === t ? "bg-white text-gray-900 shadow-sm font-bold" : "text-gray-500"}`}
            >
              {t === "login" ? "Log In" : "Sign Up"}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {tab === "signup" && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-gray-500">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          )}
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-500">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@email.com"
              className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-gray-500">Password</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                onKeyDown={e => e.key === "Enter" && submit()}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pr-10 text-sm text-gray-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              <button type="button" onClick={() => setShowPw(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {error && <p className="rounded-xl bg-red-50 px-4 py-2 text-xs font-medium text-red-600">{error}</p>}

          <button
            onClick={submit}
            disabled={loading}
            className="mt-1 w-full rounded-xl bg-primary py-3 text-sm font-bold text-white shadow-lift transition hover:brightness-110 disabled:opacity-60"
          >
            {loading ? "Please wait…" : tab === "login" ? "Log In" : "Create Account — Free"}
          </button>

          <p className="text-center text-[11px] text-gray-400">
            No email verification needed. You're in instantly.
          </p>
        </div>
      </div>
    </div>
  );
}
