import { useEffect, useRef, useState } from "react";
import type { StreamResult, StreamSource } from "@/lib/consumet";
import { Download, AlertCircle, Shield, Zap } from "lucide-react";
import Plyr from "plyr";
import "plyr/dist/plyr.css";
import Hls from "hls.js";
import { toast } from "sonner";

type Props = {
  streamResult: StreamResult;
  title: string;
  poster?: string;
  onDownload?: (url: string, quality: string) => void;
};

export function VideoPlayer({ streamResult, title, poster, onDownload }: Props) {
  const [activeSource, setActiveSource] = useState<StreamSource | null>(
    streamResult.sources.length > 0 ? streamResult.sources[0] : null,
  );
  const [dataSaver, setDataSaver] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const plyrRef = useRef<Plyr | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const currentTimeRef = useRef<number>(0);

  // Handle Data Saver & Initial source
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamResult, dataSaver]);

  // Initialize Player
  useEffect(() => {
    if (!videoRef.current || !activeSource) return;

    const video = videoRef.current;

    // Cleanup previous instances
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
        video.play().catch(() => {
          console.log("[Player] Autoplay prevented after quality switch");
        });
      }
    };

    if (Hls.isSupported() && activeSource.url.includes(".m3u8")) {
      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: true,
      });
      hlsRef.current = hls;
      hls.loadSource(activeSource.url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        initPlyr();
      });
      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error("[Streaming Error]", event, data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              console.error("Fatal network error encountered, trying to recover");
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              console.error("Fatal media error encountered, trying to recover");
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              break;
          }
        }
      });
    } else {
      video.src = activeSource.url;
      video.onloadedmetadata = () => {
        initPlyr();
      };
    }

    return () => {
      if (plyrRef.current) plyrRef.current.destroy();
      if (hlsRef.current) hlsRef.current.destroy();
    };
  }, [activeSource, title, streamResult.sources]);

  const handleDownload = async () => {
    if (!activeSource) return;
    if (onDownload) onDownload(activeSource.url, activeSource.quality);

    if (activeSource.url.includes(".m3u8")) {
      toast.error(
        "Direct download for HLS streams (.m3u8) is not supported. Please use a video downloader extension.",
      );
      return;
    }

    try {
      toast.info("Starting download...");
      const response = await fetch(activeSource.url);
      if (!response.ok) throw new Error("Network response was not ok");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.replace(/[^a-z0-9]/gi, "_")}.mp4`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Download started!");
    } catch (error) {
      console.error("[Download Error]", error);
      toast.error("Download failed due to CORS restrictions. Opening source in new tab.");
      window.open(activeSource.url, "_blank");
    }
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
      </div>

      <div className="flex items-center gap-2 overflow-x-auto bg-gray-950 px-3 py-2 scrollbar-hide border-t border-white/10">
        <div className="flex items-center gap-2 mr-2">
          <Shield className="h-4 w-4 text-green-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
            Ad-Free
          </span>
        </div>

        <button
          onClick={() => setDataSaver(!dataSaver)}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold transition ${
            dataSaver ? "bg-primary text-white" : "bg-white/10 text-white/70 hover:bg-white/20"
          }`}
        >
          <Zap className={`h-3.5 w-3.5 ${dataSaver ? "fill-current" : ""}`} />
          Data Saver
        </button>

        <div className="h-4 w-[1px] bg-white/10 mx-1" />

        {streamResult.sources.map((src, i) => (
          <button
            key={i}
            onClick={() => {
              if (videoRef.current) currentTimeRef.current = videoRef.current.currentTime;
              setActiveSource(src);
            }}
            className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold transition ${
              activeSource?.url === src.url
                ? "bg-primary/20 text-primary border border-primary/50"
                : "bg-white/5 text-white/50 hover:bg-white/10"
            }`}
          >
            {src.quality}
          </button>
        ))}

        <button
          onClick={handleDownload}
          className="ml-auto flex shrink-0 items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-bold text-white/70 hover:bg-primary hover:text-white transition"
        >
          <Download className="h-3.5 w-3.5" /> Download
        </button>
      </div>
    </div>
  );
}
