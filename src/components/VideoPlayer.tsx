import { useEffect, useRef, useState } from "react";
import type { StreamResult } from "@/lib/consumet";

type Props = {
  streamResult: StreamResult;
  title: string;
  poster?: string;
  onDownload?: (url: string, quality: string) => void;
  defaultQuality?: string;
};

// We load ArtPlayer dynamically to avoid SSR issues
export function VideoPlayer({ streamResult, title, poster, onDownload, defaultQuality = "auto" }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [activeUrl, setActiveUrl] = useState("");
  const [activeQuality, setActiveQuality] = useState(defaultQuality);
  const [isIframe, setIsIframe] = useState(false);
  const [iframeUrl, setIframeUrl] = useState("");

  useEffect(() => {
    if (!streamResult.sources.length) return;

    // Detect if sources are embed iframes (vidsrc/2embed)
    const firstSrc = streamResult.sources[0];
    const isEmbed = firstSrc.url.includes("vidsrc") || firstSrc.url.includes("2embed") || firstSrc.url.includes("embed");

    if (isEmbed) {
      setIsIframe(true);
      setIframeUrl(firstSrc.url);
      return;
    }

    setIsIframe(false);

    // Pick best source based on quality preference
    const sources = streamResult.sources;
    let chosen = sources[0];
    if (defaultQuality !== "auto") {
      const match = sources.find(s => s.quality.includes(defaultQuality.replace("p", "")));
      if (match) chosen = match;
    }
    setActiveUrl(chosen.url);
    setActiveQuality(chosen.quality);

    const container = containerRef.current;
    if (!container) return;

    let art: any = null;

    async function init() {
      const [{ default: Artplayer }, { default: Hls }] = await Promise.all([
        import("artplayer"),
        import("hls.js"),
      ]);

      // Destroy previous instance
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch {}
      }

      const isM3U8 = chosen.isM3U8 || chosen.url.includes(".m3u8");
      const qualityList = sources.map(s => ({ default: s.url === chosen.url, html: s.quality, url: s.url }));

      const downloadPlugin = (player: any) => {
        player.controls.add({
          name: "download",
          position: "right",
          index: 10,
          html: `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
          tooltip: "Download",
          click() {
            const url = player.url;
            const q = player.quality?.name || activeQuality;
            if (onDownload) onDownload(url, q);
            // Create temp link
            const a = document.createElement("a");
            a.href = url;
            a.download = `${title.replace(/[^a-z0-9]/gi, "_")}_${q}.mp4`;
            a.target = "_blank";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          },
        });
      };

      art = new Artplayer({
        container,
        url: chosen.url,
        title,
        poster: poster || "",
        volume: 0.85,
        isLive: false,
        muted: false,
        autoplay: false,
        pip: true,
        autoSize: false,
        autoMini: false,
        screenshot: false,
        setting: true,
        loop: false,
        flip: false,
        playbackRate: true,
        aspectRatio: false,
        fullscreen: true,
        fullscreenWeb: true,
        subtitleOffset: false,
        miniProgressBar: true,
        mutex: true,
        backdrop: true,
        playsInline: true,
        autoPlayback: true,
        airplay: true,
        theme: "#e8503a",
        lang: "en",
        // Quality selector
        quality: qualityList.length > 1 ? qualityList : undefined,
        // Custom controls
        plugins: [downloadPlugin],
        // Subtitle support
        subtitle: streamResult.subtitles.length > 0 ? {
          url: streamResult.subtitles[0].url,
          type: "vtt",
          style: { color: "#fff", fontSize: "18px", textShadow: "0 2px 4px rgba(0,0,0,0.8)" },
          encoding: "utf-8",
        } : undefined,
        // HLS support
        customType: isM3U8 ? {
          m3u8: function (video: HTMLVideoElement, url: string) {
            if (Hls.isSupported()) {
              const hls = new Hls({ enableWorker: true, lowLatencyMode: false });
              hls.loadSource(url);
              hls.attachMedia(video);
            } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
              video.src = url;
            }
          },
        } : undefined,
      });

      playerRef.current = art;

      art.on("quality", (quality: any) => {
        setActiveUrl(quality.url || quality);
        setActiveQuality(quality.html || quality);
      });
    }

    init().catch(console.error);

    return () => {
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch {}
        playerRef.current = null;
      }
    };
  }, [streamResult, defaultQuality]);

  if (isIframe) {
    return (
      <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
        <iframe
          src={iframeUrl}
          className="absolute inset-0 h-full w-full rounded-2xl border-0 bg-black"
          allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          title={title}
        />
        <div className="absolute bottom-2 right-2 flex gap-2">
          {streamResult.sources.map((src, i) => (
            <button
              key={i}
              onClick={() => setIframeUrl(src.url)}
              className={`rounded-full px-3 py-1 text-xs font-bold backdrop-blur transition ${
                iframeUrl === src.url
                  ? "bg-primary text-white"
                  : "bg-black/60 text-white hover:bg-primary/70"
              }`}
            >
              {i === 0 ? "VidSrc" : "Mirror " + i}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
      <div ref={containerRef} className="absolute inset-0 h-full w-full overflow-hidden rounded-2xl bg-black" />
    </div>
  );
}
