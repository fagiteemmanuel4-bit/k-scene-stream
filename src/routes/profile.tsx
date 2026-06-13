import { createFileRoute } from "@tanstack/react-router";
import {
  UserCircle,
  Settings,
  History,
  Download,
  MessageSquare,
  Share2,
  LogOut,
  ShieldCheck,
  Users,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Zap,
  X,
  MessageCircle
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useState } from "react";
import { AuthModal } from "@/components/AuthModal";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "My Profile — K·Scene" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const { user, signOut: logout } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  const [featureText, setFeatureText] = useState("");

  const handleFeatureSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!featureText.trim()) return;
    toast.success("Thanks! Our engineers have received your request.");
    setFeatureText("");
    setShowFeatureModal(false);
  };

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#FDFDFD] px-6 text-center">
        <div className="h-24 w-24 rounded-[32px] bg-primary/5 flex items-center justify-center mb-8 shadow-inner">
            <UserCircle className="h-12 w-12 text-primary/30" />
        </div>
        <h1 className="text-3xl font-black italic tracking-tighter uppercase mb-3">Join K·Scene</h1>
        <p className="max-w-xs text-sm font-bold text-gray-400 uppercase tracking-widest leading-relaxed mb-10">
          Sync your watchlist, history and connect with the community.
        </p>
        <button
          onClick={() => setShowAuth(true)}
          className="w-full max-w-sm rounded-full bg-primary py-5 text-xs font-black uppercase tracking-widest text-white shadow-lift active:scale-95 transition"
        >
          Sign In / Create Account
        </button>
        {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFDFD] pb-32">
      {showFeatureModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
              <div className="w-full max-w-sm rounded-[40px] bg-white p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black italic tracking-tighter uppercase">Request Feature</h3>
                    <button onClick={() => setShowFeatureModal(false)} className="rounded-full bg-gray-50 p-2 text-gray-400 hover:text-primary">
                        <X className="h-5 w-5" />
                    </button>
                  </div>
                  <form onSubmit={handleFeatureSubmit} className="space-y-6">
                      <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase text-gray-400 px-2 tracking-widest">What should we build?</label>
                          <textarea
                            value={featureText}
                            onChange={(e) => setFeatureText(e.target.value)}
                            placeholder="I want more filters for 90s K-Dramas..."
                            className="w-full h-32 rounded-3xl bg-gray-50 border-none p-5 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                            required
                          />
                      </div>
                      <button
                        type="submit"
                        className="w-full rounded-full bg-primary py-4 text-xs font-black uppercase tracking-widest text-white shadow-lift active:scale-95 transition"
                      >
                          Submit Request
                      </button>
                  </form>
              </div>
          </div>
      )}

      {/* Profile Header */}
      <div className="bg-white px-8 pt-16 pb-12 rounded-b-[60px] shadow-sm border-b border-gray-50">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-6">
              <div className="h-28 w-28 overflow-hidden rounded-[40px] bg-primary p-1 shadow-2xl ring-4 ring-white">
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                  alt="avatar"
                  className="h-full w-full rounded-[38px] bg-white"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 h-10 w-10 rounded-2xl bg-green-500 flex items-center justify-center text-white border-4 border-white shadow-lift">
                  <ShieldCheck className="h-5 w-5" />
              </div>
          </div>
          <h2 className="text-2xl font-black italic tracking-tighter uppercase text-gray-900">{user.email?.split("@")[0]}</h2>
          <div className="mt-3 flex items-center gap-3">
              <span className="bg-gray-100 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-500">Elite Member</span>
              <div className="h-1.5 w-1.5 rounded-full bg-gray-200" />
              <span className="text-[9px] font-black uppercase tracking-widest text-primary flex items-center gap-1">
                  <Sparkles className="h-3 w-3 fill-current" /> 1,240 pts
              </span>
          </div>
        </div>
      </div>

      <div className="px-6 -mt-8 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-50 flex items-center gap-4">
                <div className="h-10 w-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <History className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase">History</p>
                    <p className="text-sm font-black text-gray-900">42 Titles</p>
                </div>
            </div>
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-50 flex items-center gap-4">
                <div className="h-10 w-10 rounded-2xl bg-pink-500/10 flex items-center justify-center text-pink-500">
                    <Download className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase">Saved</p>
                    <p className="text-sm font-black text-gray-900">12 Clips</p>
                </div>
            </div>
        </div>

        {/* Community Links */}
        <div className="bg-gray-900 rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10">
                <Users className="h-32 w-32" />
            </div>
            <h3 className="text-xl font-black italic tracking-tighter uppercase mb-2">Connect with Fans</h3>
            <p className="text-xs font-bold text-white/50 uppercase tracking-widest leading-relaxed mb-8 max-w-[200px]">
                Join our exclusive groups for the latest leaks & subtitles.
            </p>
            <div className="space-y-3">
                <a
                    href="https://t.me/kscene_official"
                    target="_blank"
                    className="flex items-center justify-between bg-white/10 hover:bg-white/20 px-6 py-4 rounded-3xl transition-all"
                >
                    <div className="flex items-center gap-3">
                        <MessageSquare className="h-5 w-5 text-blue-400" />
                        <span className="text-[11px] font-black uppercase tracking-widest">Telegram Group</span>
                    </div>
                    <ChevronRight className="h-4 w-4 opacity-30" />
                </a>
                <a
                    href="https://wa.me/kscene_official"
                    target="_blank"
                    className="flex items-center justify-between bg-white/10 hover:bg-white/20 px-6 py-4 rounded-3xl transition-all"
                >
                    <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-green-400" />
                        <span className="text-[11px] font-black uppercase tracking-widest">WhatsApp Group</span>
                    </div>
                    <ChevronRight className="h-4 w-4 opacity-30" />
                </a>
            </div>
        </div>

        {/* Account Options */}
        <div className="space-y-3">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 px-4">Account Settings</p>
            <div className="bg-white rounded-[40px] border border-gray-50 shadow-sm divide-y divide-gray-50">
                <button
                    onClick={() => setShowFeatureModal(true)}
                    className="flex w-full items-center justify-between px-8 py-6 hover:bg-gray-50 transition-colors rounded-t-[40px]"
                >
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                            <Zap className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-black uppercase tracking-tight text-gray-900">Ask for a Feature</span>
                    </div>
                    <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[9px] font-black uppercase">Feedback</span>
                </button>
                <button className="flex w-full items-center justify-between px-8 py-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-2xl bg-gray-500/10 flex items-center justify-center text-gray-500">
                            <Settings className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-black uppercase tracking-tight text-gray-900">App Preferences</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-300" />
                </button>
                <button
                  onClick={logout}
                  className="flex w-full items-center justify-between px-8 py-6 hover:bg-red-50/50 transition-colors rounded-b-[40px]"
                >
                    <div className="flex items-center gap-4 text-red-500">
                        <div className="h-10 w-10 rounded-2xl bg-red-500/10 flex items-center justify-center">
                            <LogOut className="h-5 w-5" />
                        </div>
                        <span className="text-sm font-black uppercase tracking-tight">Disconnect Session</span>
                    </div>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}
