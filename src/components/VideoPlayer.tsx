import { useEffect, useRef, useState } from "react";
import type { StreamResult, StreamSource } from "@/lib/consumet";
import { Download, AlertCircle, Shield, Zap, Settings, Info, CheckCircle2 } from "lucide-react";
import Plyr from "plyr";
import "plyr/dist/plyr.css";
import Hls from "hls.js";
import { toast } from "sonner";

type Props = {
  streamResult: StreamResult;
  title: string;
  poster?: string;
  onDownload?: (url: string, quality: string) => void;
  onSmartDownload?: () => void;
};

export function VideoPlayer({ streamResult, title, poster, onDownload, onSmartDownload }: Props) {
  const [activeSource, setActiveSource] = useState<StreamSource | null>(
    streamResult.sources.length > 0 ? streamResult.sources[0] : null,
  );
  const [dataSaver, setDataSaver] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const plyrRef = useRef<Plyr | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const currentTimeRef = useRef<number>(0);

  useEffect(() => {
    if (streamResult.sources.length > 0) {
      let source = streamResult.sources[0];
      if (dataSaver) {
        source = [...streamResult.sources].sort((a, b) => {
          const qA = parseInt(a.quality) || 0;
          const qB = parseInt(b.quality) || 0;
          return qA - qB;
        })[0];
      }

      if (activeSource?.url !== source.url) {
        if (videoRef.current) {
          currentTimeRef.current = videoRef.current.currentTime;
        }
        setActiveSource(source);
      }
    }
  }, [streamResult, dataSaver]);

  useEffect(() => {
    if (!videoRef.current || !activeSource) return;

    const video = videoRef.current;
    if (plyrRef.current) plyrRef.current.destroy();
    if (hlsRef.current) hlsRef.current.destroy();

    const options: Plyr.Options = {
      controls: [
        "play-large",
        "play",
        "progress",
        "current-time",
        "mute",
        "volume",
        "captions",
        "settings",
        "pip",
        "airplay",
        "fullscreen",
      ],
      settings: ["quality", "speed", "loop"],
      quality: {
        default: parseInt(activeSource.quality) || 720,
        options: streamResult.sources.map((s) => parseInt(s.quality) || 0).filter((q) => q > 0),
        onChange: (newQuality: number) => {
          const source = streamResult.sources.find(
            (s) => (parseInt(s.quality) || 0) === newQuality,
          );
          if (source && source.url !== activeSource.url) {
            currentTimeRef.current = video.currentTime;
            setActiveSource(source);
          }
        },
      },
      title: title,
    };

    const initPlyr = () => {
      plyrRef.current = new Plyr(video, options);
      if (currentTimeRef.current > 0) {
        video.currentTime = currentTimeRef.current;
        video.play().catch(() => {});
      }
    };

    if (Hls.isSupported() && activeSource.url.includes(".m3u8")) {
      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hlsRef.current = hls;
      hls.loadSource(activeSource.url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        console.log("[Player] HLS Manifest parsed for:", activeSource.quality);
        initPlyr();
      });
      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error("[Player] HLS Error:", data.type, data.details, data.fatal);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.warn("[Player] Attempting network recovery...");
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.warn("[Player] Attempting media recovery...");
              hls.recoverMediaError();
              break;
            default:
              console.error("[Player] Unrecoverable error, destroying instance");
              hls.destroy();
              break;
          }
        }
      });
    } else {
      video.src = activeSource.url;
      video.onloadedmetadata = () => initPlyr();
    }

    return () => {
      if (plyrRef.current) plyrRef.current.destroy();
      if (hlsRef.current) hlsRef.current.destroy();
    };
  }, [activeSource, title, streamResult.sources]);

  const handleDownload = async () => {
    if (!activeSource) return;

    if (activeSource.url.includes(".m3u8")) {
        toast.info("HLS Stream detected. Opening stream link...");
        window.open(activeSource.url, '_blank');
        return;
    }

    toast.info("Preparing native download (Blob structure)...");
    console.log("[Download] Initiating fetch for:", activeSource.url);
    try {
        const response = await fetch(activeSource.url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const blob = await response.blob();
        console.log("[Download] Blob created, size:", blob.size);

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        const fileName = `${title.replace(/[^a-z0-9]/gi, '_')}_${activeSource.quality}.mp4`;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();

        // Use a small timeout before revoking to ensure the browser has started the download
        setTimeout(() => {
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        }, 100);

        toast.success("Download started!");
    } catch (error) {
        console.error("[Download] Native download failed:", error);
        toast.error("Native download failed. Trying fallback...");
        window.open(activeSource.url, '_blank');
    }

    if (onDownload) onDownload(activeSource.url, activeSource.quality);
  };

  if (streamResult.sources.length === 0) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 bg-gray-950 text-white">
        <AlertCircle className="h-8 w-8 text-red-400" />
        <p className="text-sm font-semibold">No streaming sources available</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-black">
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: "16/9" }}>
        <video ref={videoRef} className="plyr-react plyr" playsInline poster={poster} />
        <div className="absolute top-4 left-4 flex gap-2 pointer-events-none">
            <span className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-green-400 border border-green-400/30">
                <Shield className="h-3 w-3" /> AD-FREE
            </span>
            {dataSaver && (
                 <span className="flex items-center gap-1 bg-primary/80 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-white shadow-lift">
                    <Zap className="h-3 w-3 fill-current" /> DATA SAVER
                 </span>
            )}
        </div>
      </div>

      <div className="flex items-center gap-3 overflow-x-auto bg-gray-950 px-4 py-3 border-t border-white/5 scrollbar-hide">
        <button
          onClick={() => setDataSaver(!dataSaver)}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-widest transition ${
            dataSaver ? "bg-primary text-white" : "bg-white/5 text-white/50 hover:bg-white/10"
          }`}
        >
          <Zap className={`h-3.5 w-3.5 ${dataSaver ? "fill-current" : ""}`} />
          Data Saver
        </button>

        <div className="h-6 w-[1px] bg-white/10 mx-1 shrink-0" />

        {streamResult.sources.map((src, i) => (
          <button
            key={i}
            onClick={() => {
              if (videoRef.current) currentTimeRef.current = videoRef.current.currentTime;
              setActiveSource(src);
            }}
            className={`shrink-0 rounded-xl px-4 py-2 text-[11px] font-black uppercase tracking-widest transition border ${
              activeSource?.url === src.url
                ? "bg-primary/20 text-primary border-primary/50"
                : "bg-white/5 text-white/40 border-transparent hover:bg-white/10"
            }`}
          >
            {src.quality}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
            <button
              onClick={onSmartDownload}
              className="flex shrink-0 items-center gap-2 rounded-xl bg-green-500/10 border border-green-500/20 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-green-500 hover:bg-green-500 hover:text-white transition"
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Smart Download
            </button>
            <button
              onClick={handleDownload}
              className="flex shrink-0 items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-white/50 hover:bg-primary hover:text-white transition"
            >
              <Download className="h-3.5 w-3.5" /> Download
            </button>
        </div>
      </div>
    </div>
  );
}
