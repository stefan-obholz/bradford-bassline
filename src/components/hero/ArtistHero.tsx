import { useEffect, useRef, useState } from "react";

interface VideoClip {
  mp4: string;
  webm?: string;
  poster: string;
  track: string;
}

interface Props {
  name: string;
  city: string;
  tagline: string;
  videos: VideoClip[];
  spotifyUrl?: string;
  topTrackTitle?: string;
  cityShort?: string;
  areaCode?: string;
}

const CLIP_DURATION_MS = 5000;
const EQ_BARS = 32;

export default function ArtistHero({
  name,
  city,
  tagline,
  videos,
  spotifyUrl,
  topTrackTitle,
  cityShort,
  areaCode,
}: Props) {
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  useEffect(() => {
    if (reducedMotion || videos.length <= 1) return;
    const id = window.setInterval(
      () => setActiveIndex((i) => (i + 1) % videos.length),
      CLIP_DURATION_MS
    );
    return () => window.clearInterval(id);
  }, [reducedMotion, videos.length]);

  useEffect(() => {
    if (reducedMotion) return;
    setProgress(0);
    const start = performance.now();
    let raf = 0;
    const tick = () => {
      const elapsed = performance.now() - start;
      const p = Math.min(elapsed / CLIP_DURATION_MS, 1);
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [activeIndex, reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;
    videoRefs.current.forEach((v, i) => {
      if (!v) return;
      if (i === activeIndex) {
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
  }, [activeIndex, reducedMotion]);

  const showVideo = !reducedMotion && videos.length > 0;
  const currentTrack = videos[activeIndex]?.track ?? topTrackTitle;
  const cityLabel = cityShort ?? city.split(",")[0];

  const eqHeights = Array.from({ length: EQ_BARS }, (_, i) => {
    return 30 + Math.abs(Math.sin((i + 1) * 0.7)) * 70;
  });

  return (
    <div className="relative h-screen w-full overflow-hidden bg-ink">
      {showVideo &&
        videos.map((v, i) => (
          <video
            key={i}
            ref={(el) => {
              videoRefs.current[i] = el;
            }}
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ease-out ${
              i === activeIndex ? "opacity-100" : "opacity-0"
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

      {!showVideo && videos[0] && (
        <img
          src={videos[0].poster}
          alt={`${name} performing`}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}

      {/* Color-tinted overlays — magenta/cyan gradient */}
      <div className="absolute inset-0" style={{
        background: "linear-gradient(180deg, rgba(10,6,18,0.4) 0%, rgba(10,6,18,0.7) 50%, rgba(10,6,18,0.95) 100%)",
      }} />
      <div className="absolute inset-0 mix-blend-color" style={{
        background: "linear-gradient(135deg, rgba(255,0,122,0.18) 0%, rgba(0,245,255,0.10) 100%)",
      }} />

      {/* Vignette */}
      <div className="pointer-events-none absolute inset-0" style={{
        background: "radial-gradient(ellipse at 50% 50%, transparent 35%, rgba(10,6,18,0.7) 100%)",
      }} />

      {/* LEFT vertical sidebar */}
      <div className="pointer-events-none absolute left-0 top-0 hidden h-full w-12 flex-col items-center justify-between border-r border-ghost/10 py-10 sm:flex">
        <div
          className="font-mono text-[10px] uppercase tracking-[0.4em] text-magenta"
          style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
        >
          ◉ TUNE IN · {areaCode ?? cityLabel.toUpperCase()}
        </div>
        <div className="flex flex-col gap-3 font-mono text-[9px] uppercase tracking-widest text-ghost/40">
          <span>L</span><span>I</span><span>V</span><span>E</span>
        </div>
        <div
          className="font-mono text-[10px] uppercase tracking-[0.4em] text-cyan"
          style={{ writingMode: "vertical-rl" }}
        >
          BASSLINE FREQ · 138 BPM
        </div>
      </div>

      {/* RIGHT vertical sidebar */}
      <div className="pointer-events-none absolute right-0 top-0 hidden h-full w-12 flex-col items-center justify-between border-l border-ghost/10 py-10 sm:flex">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.4em] text-acid">
          <span style={{ writingMode: "vertical-rl" }}>● ON AIR · {currentTrack ?? "LIVE"}</span>
        </div>
        <div
          className="font-mono text-[10px] uppercase tracking-[0.4em] text-ghost/50"
          style={{ writingMode: "vertical-rl" }}
        >
          NOW PLAYING [{String(activeIndex + 1).padStart(2, "0")}/{String(videos.length).padStart(2, "0")}]
        </div>
      </div>

      {/* TOP BAR */}
      <div className="absolute left-6 right-6 top-6 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.3em] sm:left-20 sm:right-20 sm:top-8">
        <span className="text-ghost/70">FM {areaCode ?? cityLabel.toUpperCase()} · WEST YORKSHIRE</span>
        <span className="flex items-center gap-2 text-acid">
          <span className="live-dot inline-block h-2 w-2 rounded-full bg-acid" />
          ON AIR
        </span>
      </div>

      {/* BOTTOM EQUALIZER */}
      {!reducedMotion && (
        <div className="pointer-events-none absolute bottom-12 left-6 right-6 flex h-16 items-end gap-[3px] sm:bottom-16 sm:left-20 sm:right-20">
          {eqHeights.map((h, i) => (
            <div
              key={i}
              className="eq-bar w-full flex-1"
              style={{
                height: `${h}%`,
                background:
                  i % 5 === 0
                    ? "var(--color-magenta)"
                    : i % 7 === 0
                    ? "var(--color-cyan)"
                    : "var(--color-ghost)",
                opacity: 0.6,
                animationDelay: `${(i * 50) % 800}ms`,
              }}
            />
          ))}
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="relative z-10 flex h-full flex-col justify-center px-6 sm:px-24">
        <div className="max-w-5xl">
          <div className="font-mono text-[10px] uppercase tracking-[0.4em] text-cyan">
            <span className="bg-cyan px-2 py-1 text-ink">▶</span>{" "}
            <span className="ml-2">PRESENTING</span>
          </div>

          <h1
            className="font-display chrom mt-6 text-[24vw] uppercase leading-[0.82] text-ghost sm:text-[18vw] md:text-[15vw] lg:text-[13vw]"
            style={{ letterSpacing: "-0.05em" }}
          >
            {name}
          </h1>

          <div className="mt-6 flex flex-wrap items-center gap-3 sm:mt-8 sm:gap-4">
            <span className="sticker px-3 py-1.5 text-[11px]">
              {cityLabel.toUpperCase()} · {areaCode}
            </span>
            <span
              className="border border-cyan/60 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.3em] text-cyan"
              style={{ background: "rgba(0,245,255,0.06)" }}
            >
              ⏵ {tagline}
            </span>
          </div>

          {spotifyUrl && (
            <a
              href={spotifyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-10 inline-flex items-center gap-3 border-2 border-magenta bg-ink/40 px-7 py-3.5 font-mono text-xs font-bold uppercase tracking-[0.3em] text-magenta backdrop-blur-md transition-all hover:bg-magenta hover:text-ink sm:mt-12"
              style={{ boxShadow: "0 0 0 1px rgba(255,0,122,0.2), 0 8px 32px rgba(255,0,122,0.15)" }}
            >
              <span className="inline-block h-2 w-2 rounded-full bg-magenta group-hover:bg-ink" />
              ⏵ Hit play · Spotify
            </a>
          )}
        </div>
      </div>

      {/* PROGRESS BAR */}
      {!reducedMotion && videos.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 z-20 h-1 bg-ghost/10">
          <div
            className="h-full bg-magenta transition-none"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}
