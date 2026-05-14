import { useEffect, useRef, useState } from "react";

interface VideoClip {
  mp4: string;
  webm?: string;
  poster: string;
}

interface Props {
  videos: VideoClip[];
}

const CLIP_MS = 5000;

export default function RosterHeroVideo({ videos }: Props) {
  const refs = useRef<(HTMLVideoElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (reduced || videos.length <= 1) return;
    const id = window.setInterval(
      () => setActive((i) => (i + 1) % videos.length),
      CLIP_MS
    );
    return () => window.clearInterval(id);
  }, [reduced, videos.length]);

  useEffect(() => {
    if (reduced) return;
    refs.current.forEach((v, i) => {
      if (!v) return;
      // playbackRate left at default 1.0 — all roster clips are 25 fps native.
      if (i === active) {
        try {
          v.currentTime = 0;
          const p = v.play();
          if (p && typeof p.catch === "function") p.catch(() => {});
        } catch {
          /* ignore */
        }
      } else {
        try { v.pause(); } catch { /* ignore */ }
      }
    });
  }, [active, reduced]);

  if (reduced && videos[0]) {
    return (
      <img
        src={videos[0].poster}
        alt="Bradford Bassline crew"
        className="absolute inset-0 h-full w-full object-cover"
      />
    );
  }

  return (
    <>
      {videos.map((v, i) => (
        <video
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out ${
            i === active ? "opacity-100" : "opacity-0"
          }`}
          style={{ willChange: "opacity" }}
          autoPlay={i === 0}
          muted
          loop
          playsInline
          poster={v.poster}
          preload={i === 0 ? "auto" : "metadata"}
          aria-hidden="true"
        >
          <source src={v.mp4} type="video/mp4" />
          {v.webm && <source src={v.webm} type="video/webm" />}
        </video>
      ))}
    </>
  );
}
