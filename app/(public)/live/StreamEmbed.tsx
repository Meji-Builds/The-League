"use client";

import { useEffect, useState } from "react";

interface Props {
  url:   string;
  title: string;
}

function parseStream(url: string): { type: "youtube"; videoId: string } | { type: "twitch"; channel: string } | { type: "twitch-vod"; videoId: string } | { type: "other" } {
  // YouTube
  const ytMatch = url.match(/(?:v=|youtu\.be\/|\/live\/|\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return { type: "youtube", videoId: ytMatch[1] };

  // Twitch VOD: twitch.tv/videos/123456
  const twitchVod = url.match(/twitch\.tv\/videos\/(\d+)/);
  if (twitchVod) return { type: "twitch-vod", videoId: twitchVod[1] };

  // Twitch channel: twitch.tv/CHANNEL (not twitch.tv/videos/...)
  const twitchChannel = url.match(/twitch\.tv\/([^/?]+)/);
  if (twitchChannel && twitchChannel[1] !== "videos") return { type: "twitch", channel: twitchChannel[1] };

  return { type: "other" };
}

export function StreamEmbed({ url, title }: Props) {
  const [hostname, setHostname] = useState<string | null>(null);

  useEffect(() => {
    setHostname(window.location.hostname);
  }, []);

  const parsed = parseStream(url);

  if (parsed.type === "youtube") {
    return (
      <Wrapper>
        <iframe
          className="absolute inset-0 w-full h-full"
          src={`https://www.youtube.com/embed/${parsed.videoId}?autoplay=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </Wrapper>
    );
  }

  if (parsed.type === "twitch" || parsed.type === "twitch-vod") {
    if (!hostname) {
      // SSR/hydration placeholder — same dimensions, no content
      return <Wrapper><div className="absolute inset-0 bg-surface" /></Wrapper>;
    }

    const src =
      parsed.type === "twitch"
        ? `https://player.twitch.tv/?channel=${parsed.channel}&parent=${hostname}&autoplay=false`
        : `https://player.twitch.tv/?video=${parsed.videoId}&parent=${hostname}&autoplay=false`;

    return (
      <Wrapper>
        <iframe
          className="absolute inset-0 w-full h-full"
          src={src}
          title={title}
          allowFullScreen
        />
      </Wrapper>
    );
  }

  // Other URL — show an external link card instead of attempting an iframe
  return (
    <div className="flex flex-col items-center justify-center bg-surface py-14 px-6 text-center gap-4">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 text-muted">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.07A1 1 0 0121 8.87v6.259a1 1 0 01-1.447.9L15 14M3 8a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
      </svg>
      <p className="text-sm text-muted">This stream cannot be embedded.</p>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-semibold bg-navy text-white px-5 py-2 rounded hover:bg-navy/80 transition-colors"
      >
        Watch Stream
      </a>
    </div>
  );
}

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
      {children}
    </div>
  );
}
