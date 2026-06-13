import { useEffect, useRef, useState, useCallback } from "react";
import Hls from "hls.js";
import type { StreamResult, StreamSource } from "@/lib/consumet";
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  Download, SkipForward, SkipBack, Settings, Loader2,
  AlertCircle, RefreshCw, Subtitles,
} from "lucide-react";

type Props = {
  streamResult: StreamResult;
  title: string;
  poster?: string;
  onDownload?: (url: string, quality: string) => void;
};

function fmtTime(s: number) {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  return `${m}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
}

export function VideoPlayer({ streamResult, title, poster, onDownload }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();

  const [activeSrc, setActiveSrc] = useState<StreamSource | null>(streamResult.sources[0] ?? null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [buffering, setBuffering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showSubs, setShowSubs] = useState(false);
  const [activeSub, setActiveSub] = useState<string | null>(null);
  const [hlsLevels, setHlsLevels] = useState<{ height: number; index: number }[]>([]);
  const [activeLevel, setActiveLevel] = useState(-1);

  // Load source
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !activeSrc) return;
    setError(null);
    setBuffering(true);
    setPlaying(false);
    setHlsLevels([]);
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }

    if (activeSrc.isM3U8 && Hls.isSupported()) {
      const hls = new Hls({ enableWorker: true, maxBufferLength: 30 });
      hlsRef.current = hls;
      hls.loadSource(activeSrc.url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, (_e, data) => {
        setHlsLevels(data.levels.map((l, i) => ({ height: l.height, index: i })));
        setBuffering(false);
        video.play().then(() => setPlaying(true)).catch(() => {});
      });
      hls.on(Hls.Events.LEVEL_SWITCHED, (_e, data) => setActiveLevel(data.level));
      hls.on(Hls.Events.ERROR, (_e, data) => {
        if (data.fatal) {
          if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
          else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
          else setError("Stream error — try another source.");
        }
      });
    } else if (activeSrc.isM3U8 && video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = activeSrc.url;
      video.play().then(() => setPlaying(true)).catch(() => {});
      setBuffering(false);
    } else {
      video.src = activeSrc.url;
      video.load();
      video.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
      setBuffering(false);
    }

    return () => { if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; } };
  }, [activeSrc]);

  // Video events
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTime = () => setCurrentTime(v.currentTime);
    const onDur = () => setDuration(v.duration);
    const onWait = () => setBuffering(true);
    const onCan = () => setBuffering(false);
    const onVol = () => { setVolume(v.volume); setMuted(v.muted); };
    const onErr = () => setError("Playback error — try another source.");
    v.addEventListener("play", onPlay); v.addEventListener("pause", onPause);
    v.addEventListener("timeupdate", onTime); v.addEventListener("durationchange", onDur);
    v.addEventListener("waiting", onWait); v.addEventListener("canplay", onCan);
    v.addEventListener("volumechange", onVol); v.addEventListener("error", onErr);
    return () => {
      v.removeEventListener("play", onPlay); v.removeEventListener("pause", onPause);
      v.removeEventListener("timeupdate", onTime); v.removeEventListener("durationchange", onDur);
      v.removeEventListener("waiting", onWait); v.removeEventListener("canplay", onCan);
      v.removeEventListener("volumechange", onVol); v.removeEventListener("error", onErr);
    };
  }, []);

  useEffect(() => {
    const onFs = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  const resetHide = useCallback(() => {
    setShowControls(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => { if (playing) setShowControls(false); }, 3000);
  }, [playing]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    v.paused ? v.play().catch(() => {}) : v.pause();
  };

  const seek = (s: number) => {
    const v = videoRef.current;
    if (v) v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + s));
  };

  const handleDownload = () => {
    if (!activeSrc) return;
    if (onDownload) onDownload(activeSrc.url, activeSrc.quality);
    const a = document.createElement("a");
    a.href = activeSrc.url;
    a.download = `${title.replace(/[^a-z0-9]/gi, "_")}.${activeSrc.isM3U8 ? "m3u8" : "mp4"}`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  // No direct sources — show embed fallback
  if (!streamResult.sources.length) {
    return (
      <div className="flex flex-col bg-black">
        <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
          {streamResult.fallbackEmbed ? (
            <>
              <iframe
                src={streamResult.fallbackEmbed}
                className="absolute inset-0 h-full w-full border-0"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                title={title}
              />
              <div className="pointer-events-none absolute top-2 left-2 rounded-full bg-orange-500/90 px-2.5 py-1 text-[10px] font-bold text-white">
                Embed mode
              </div>
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white">
              <AlertCircle className="h-8 w-8 text-red-400" />
              <p className="text-sm font-semibold">No sources available</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="group relative w-full select-none overflow-hidden bg-black"
      style={{ aspectRatio: "16/9" }}
      onMouseMove={resetHide}
      onTouchStart={resetHide}
      onClick={() => { togglePlay(); resetHide(); }}
    >
      <video
        ref={videoRef}
        className="absolute inset-0 h-full w-full object-contain"
        poster={poster}
        playsInline
        preload="auto"
      >
        {activeSub && <track kind="subtitles" src={activeSub} default />}
      </video>

      {buffering && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/80 text-white">
          <AlertCircle className="h-8 w-8 text-red-400" />
          <p className="text-sm font-semibold">{error}</p>
          <button
            onClick={e => { e.stopPropagation(); setError(null); if (activeSrc) setActiveSrc({ ...activeSrc }); }}
            className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold"
          >
            <RefreshCw className="h-4 w-4" /> Retry
          </button>
        </div>
      )}

      {/* Controls */}
      <div
        className={`absolute inset-0 flex flex-col justify-end transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent pointer-events-none" />

        <div className="relative px-4 pb-1">
          <p className="text-[11px] font-semibold text-white/60 line-clamp-1">{title}</p>
        </div>

        {/* Seek bar */}
        <div className="relative px-4 pb-2">
          <input
            type="range" min={0} max={duration || 100} value={currentTime}
            onChange={e => { const v = videoRef.current; if (v) v.currentTime = Number(e.target.value); }}
            className="kscene-seek w-full h-1 cursor-pointer appearance-none rounded-full"
            style={{ background: `linear-gradient(to right,#e8503a ${progress}%,rgba(255,255,255,.2) ${progress}%)` }}
          />
        </div>

        {/* Bottom row */}
        <div className="relative flex items-center gap-1 px-3 pb-4">
          <button onClick={togglePlay} className="p-1.5 text-white hover:text-primary transition">
            {playing ? <Pause className="h-6 w-6 fill-current" /> : <Play className="h-6 w-6 fill-current" />}
          </button>
          <button onClick={() => seek(-10)} className="p-1.5 text-white/70 hover:text-white transition">
            <SkipBack className="h-5 w-5" />
          </button>
          <button onClick={() => seek(10)} className="p-1.5 text-white/70 hover:text-white transition">
            <SkipForward className="h-5 w-5" />
          </button>
          <span className="text-[11px] font-mono text-white/60 tabular-nums">
            {fmtTime(currentTime)} / {fmtTime(duration)}
          </span>

          <div className="flex-1" />

          {/* Volume */}
          <button onClick={() => { const v = videoRef.current; if (v) v.muted = !v.muted; }} className="p-1.5 text-white/70 hover:text-white transition">
            {muted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
          <input
            type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume}
            onChange={e => { const v = videoRef.current; if (v) { v.volume = Number(e.target.value); v.muted = Number(e.target.value) === 0; } }}
            className="kscene-seek hidden sm:block w-20 h-1 cursor-pointer appearance-none rounded-full"
            style={{ background: `linear-gradient(to right,#e8503a ${(muted ? 0 : volume) * 100}%,rgba(255,255,255,.2) ${(muted ? 0 : volume) * 100}%)` }}
          />

          {streamResult.subtitles.length > 0 && (
            <button onClick={() => setShowSubs(s => !s)} className={`p-1.5 transition ${showSubs ? "text-primary" : "text-white/70 hover:text-white"}`}>
              <Subtitles className="h-5 w-5" />
            </button>
          )}

          <button onClick={() => setShowSettings(s => !s)} className={`p-1.5 transition ${showSettings ? "text-primary" : "text-white/70 hover:text-white"}`}>
            <Settings className="h-5 w-5" />
          </button>

          <button onClick={handleDownload} className="p-1.5 text-white/70 hover:text-primary transition">
            <Download className="h-5 w-5" />
          </button>

          <button onClick={() => { const el = containerRef.current; if (!el) return; document.fullscreenElement ? document.exitFullscreen() : el.requestFullscreen(); }} className="p-1.5 text-white/70 hover:text-white transition">
            {fullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          </button>
        </div>

        {/* Settings panel */}
        {showSettings && (
          <div className="absolute bottom-16 right-3 w-52 rounded-2xl border border-white/10 bg-gray-950/95 p-3 text-xs text-white backdrop-blur" onClick={e => e.stopPropagation()}>
            {hlsLevels.length > 0 && (
              <div className="mb-3">
                <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400">Quality</p>
                {[{ label: "Auto", index: -1 }, ...hlsLevels.map(l => ({ label: `${l.height}p`, index: l.index }))].map(q => (
                  <button key={q.index} onClick={() => { if (hlsRef.current) hlsRef.current.currentLevel = q.index; setActiveLevel(q.index); setShowSettings(false); }}
                    className={`mb-1 w-full rounded-xl px-3 py-1.5 text-left font-semibold transition ${activeLevel === q.index ? "bg-primary text-white" : "hover:bg-white/10"}`}>
                    {q.label}
                  </button>
                ))}
              </div>
            )}
            {streamResult.sources.length > 1 && (
              <div>
                <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400">Source</p>
                {streamResult.sources.map((src, i) => (
                  <button key={i} onClick={() => { setActiveSrc(src); setShowSettings(false); }}
                    className={`mb-1 w-full rounded-xl px-3 py-1.5 text-left font-semibold transition ${activeSrc?.url === src.url ? "bg-primary text-white" : "hover:bg-white/10"}`}>
                    {src.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Subtitle panel */}
        {showSubs && streamResult.subtitles.length > 0 && (
          <div className="absolute bottom-16 right-20 w-44 rounded-2xl border border-white/10 bg-gray-950/95 p-3 text-xs text-white backdrop-blur" onClick={e => e.stopPropagation()}>
            <p className="mb-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400">Subtitles</p>
            {[{ url: null, lang: "Off" }, ...streamResult.subtitles].map((sub, i) => (
              <button key={i} onClick={() => { setActiveSub(sub.url); setShowSubs(false); }}
                className={`mb-1 w-full rounded-xl px-3 py-1.5 text-left font-semibold transition ${activeSub === sub.url ? "bg-primary text-white" : "hover:bg-white/10"}`}>
                {sub.lang}
              </button>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .kscene-seek::-webkit-slider-thumb{-webkit-appearance:none;width:14px;height:14px;border-radius:50%;background:#e8503a;cursor:pointer;}
        .kscene-seek::-moz-range-thumb{width:14px;height:14px;border-radius:50%;background:#e8503a;cursor:pointer;border:none;}
      `}</style>
    </div>
  );
}
