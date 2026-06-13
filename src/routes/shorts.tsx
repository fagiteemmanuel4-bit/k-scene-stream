import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Heart, MessageCircle, Share2, Music2 } from "lucide-react";
import shortsData from "../data/shorts.json";

export const Route = createFileRoute("/shorts")({
  head: () => ({ meta: [{ title: "Shorts — K·Scene" }] }),
  component: ShortsPage,
});

type Short = {
  id: string;
  title: string;
  url: string;
  author: string;
};

function ShortsPage() {
  return (
    <div className="h-screen w-full overflow-y-scroll snap-y snap-mandatory bg-black scrollbar-hide">
      {shortsData.map((short: Short) => (
        <ShortCard key={short.id} short={short} />
      ))}
    </div>
  );
}

function ShortCard({ short }: { short: Short }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [, setIsPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const options = {
      root: null,
      rootMargin: "0px",
      threshold: 0.7,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          video.play().catch(() => {
            console.log("Autoplay prevented, requires user interaction");
          });
          setIsPlaying(true);
        } else {
          video.pause();
          setIsPlaying(false);
        }
      });
    }, options);

    observer.observe(video);

    return () => {
      observer.unobserve(video);
    };
  }, []);

  return (
    <div className="relative h-screen w-full snap-start flex items-center justify-center bg-black">
      <video
        ref={videoRef}
        src={short.url}
        loop
        muted
        playsInline
        className="h-full w-full object-cover"
        onClick={() => {
          if (videoRef.current?.paused) {
            videoRef.current.play();
            setIsPlaying(true);
          } else {
            videoRef.current?.pause();
            setIsPlaying(false);
          }
        }}
      />

      {/* Overlays */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-black/20 via-transparent to-black/60" />

      {/* Info Overlay */}
      <div className="absolute bottom-20 left-4 right-16 text-white pointer-events-none">
        <h3 className="font-bold text-lg">{short.author}</h3>
        <p className="text-sm mt-2 line-clamp-2">{short.title}</p>
        <div className="flex items-center gap-2 mt-3">
          <Music2 className="h-4 w-4 animate-spin-slow" />
          <span className="text-xs">Original Sound - {short.author}</span>
        </div>
      </div>

      {/* Right Side Actions */}
      <div className="absolute right-4 bottom-24 flex flex-col items-center gap-6 text-white">
        <div className="flex flex-col items-center gap-1 group cursor-pointer pointer-events-auto">
          <div className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center group-hover:bg-red-500 transition-colors">
            <Heart className="h-6 w-6" />
          </div>
          <span className="text-[10px] font-bold">12.4K</span>
        </div>
        <div className="flex flex-col items-center gap-1 group cursor-pointer pointer-events-auto">
          <div className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center group-hover:bg-blue-500 transition-colors">
            <MessageCircle className="h-6 w-6" />
          </div>
          <span className="text-[10px] font-bold">482</span>
        </div>
        <div className="flex flex-col items-center gap-1 group cursor-pointer pointer-events-auto">
          <div className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center group-hover:bg-green-500 transition-colors">
            <Share2 className="h-6 w-6" />
          </div>
          <span className="text-[10px] font-bold">Share</span>
        </div>
      </div>
    </div>
  );
}
