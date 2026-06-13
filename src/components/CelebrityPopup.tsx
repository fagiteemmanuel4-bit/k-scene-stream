import { useEffect, useState } from "react";
import { X, Flame, ArrowRight, Zap, Star } from "lucide-react";

const MOVIEBOX_API = import.meta.env.VITE_MOVIEBOX_API_URL || "";

export function CelebrityPopup() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const hasSeen = sessionStorage.getItem("celeb-popup-seen");
    if (!hasSeen) {
      fetch(`${MOVIEBOX_API}/artists`)
        .then(res => res.json())
        .then(res => {
          if (res && res.length > 0) {
            setData(res[0]);
            setOpen(true);
            sessionStorage.setItem("celeb-popup-seen", "true");
          }
        })
        .catch(() => {});
    }
  }, []);

  if (!open || !data) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md">
      <div className="relative w-full max-w-sm overflow-hidden rounded-[50px] bg-white shadow-2xl animate-in zoom-in-95 duration-500">
        <div className="absolute top-6 right-6 z-10">
          <button
            onClick={() => setOpen(false)}
            className="rounded-full bg-white/20 p-3 text-white backdrop-blur-xl hover:bg-white/40 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="relative aspect-square w-full">
          <img
            src={data.img}
            alt={data.name}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
          <div className="absolute bottom-8 left-8 right-8 text-white">
            <div className="flex items-center gap-2 mb-3">
                <span className="bg-primary px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-lift">
                    <Star className="h-3 w-3 fill-current" /> Trending Artist
                </span>
            </div>
            <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none mb-4">{data.name}</h2>
            <p className="text-sm font-bold text-white/80 leading-relaxed uppercase tracking-wide">
              {data.reason}
            </p>
          </div>
        </div>

        <div className="p-8 space-y-4">
            <button
              onClick={() => setOpen(false)}
              className="flex w-full items-center justify-center gap-3 rounded-full bg-primary py-5 text-xs font-black uppercase tracking-widest text-white shadow-glow active:scale-95 transition"
            >
              Explore Profile <ArrowRight className="h-4 w-4" />
            </button>
            <p className="text-center text-[9px] font-black uppercase tracking-widest text-gray-400">
                Join our community to see more daily K·Highlights
            </p>
        </div>
      </div>
    </div>
  );
}
