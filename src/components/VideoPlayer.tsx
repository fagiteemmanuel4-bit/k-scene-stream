import { useEffect, useRef, useState } from "react";
import type { StreamResult, StreamSource } from "@/lib/consumet";
import { Download, AlertCircle, RefreshCw } from "lucide-react";

type Props = {
  streamResult: StreamResult;
  title: string;
  poster?: string;
  onDownload?: (url: string, quality: string) => void;
  defaultQuality?: string;
};

export function VideoPlayer({ streamResult, title, poster, onDownload }: Props) {
  const [activeSource, setActiveSource] = useState<StreamSource>(streamResult.sources[0]);
  const [error, setError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setActiveSource(streamResult.sources[0]);
    setError(false);
  }, [streamResult]);

  const handleSourceChange = (src: StreamSource) => {
    setActiveSource(src);
    setError(false);
  };

  const handleDownload = () => {
    if (onDownload) onDownload(activeSource.url, activeSource.quality);
    const a = document.createElement("a");
    a.href = activeSource.url;
    a.download = `${title.replace(/[^a-z0-9]/gi, "_")}.mp4`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex flex-col bg-black">
      {/* Iframe player */}
      <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-950 text-white">
            <AlertCircle className="h-8 w-8 text-red-400" />
            <p className="text-sm font-semibold">This source failed to load</p>
            <button
              onClick={() => { setError(false); }}
              className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold"
            >
              <RefreshCw className="h-4 w-4" /> Retry
            </button>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            key={activeSource.url}
            src={activeSource.url}
            className="absolute inset-0 h-full w-full border-0 bg-black"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            title={title}
            onError={() => setError(true)}
          />
        )}
      </div>

      {/* Source switcher + download */}
      <div className="flex items-center gap-2 overflow-x-auto bg-gray-950 px-3 py-2 scrollbar-hide">
        <span className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-gray-500">Source:</span>
        {streamResult.sources.map((src, i) => (
          <button
            key={i}
            onClick={() => handleSourceChange(src)}
            className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold transition ${
              activeSource.url === src.url
                ? "bg-primary text-white"
                : "bg-white/10 text-white/70 hover:bg-white/20"
            }`}
          >
            {src.label || `Mirror ${i + 1}`}
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
