"use client";

import { useEffect, useRef, useState } from "react";

interface HLSPlayerProps {
  hlsUrl: string;
  style?: React.CSSProperties;
}

/**
 * Plays an HLS (m3u8) stream.
 * Uses native HLS on Safari, hls.js on all other browsers.
 */
export default function HLSPlayer({ hlsUrl, style }: HLSPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setError(false);
    let hlsInstance: { destroy: () => void } | null = null;

    const setup = async () => {
      if (video.canPlayType("application/vnd.apple.mpegurl")) {
        // Safari: native HLS support
        video.src = hlsUrl;
        video.play().catch(() => {});
        return;
      }

      const { default: Hls } = await import("hls.js");

      if (!Hls.isSupported()) {
        setError(true);
        return;
      }

      const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
      hlsInstance = hls;

      hls.loadSource(hlsUrl);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => {});
      });

      hls.on(Hls.Events.ERROR, (_: unknown, data: { fatal: boolean }) => {
        if (data.fatal) setError(true);
      });
    };

    setup();

    return () => {
      hlsInstance?.destroy();
      video.src = "";
    };
  }, [hlsUrl]);

  if (error) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#000",
          fontSize: 10,
          color: "var(--text-secondary)",
          gap: 4,
          letterSpacing: "0.1em",
          ...style,
        }}
      >
        <span>SIGNAL PERDU</span>
        <span
          style={{
            color: "var(--accent-red)",
            fontWeight: 700,
            animation: "blink-cursor 1s step-start infinite",
          }}
        >
          _
        </span>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      muted
      autoPlay
      playsInline
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
        ...style,
      }}
    />
  );
}
