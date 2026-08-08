"use client";

import { useEffect, useRef, useState } from "react";

/** Camera self-view, so a call feels like a real video call. */
export default function SelfVideo({ active }: { active: boolean }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!active) return;

    let stream: MediaStream | null = null;
    let cancelled = false;

    navigator.mediaDevices
      .getUserMedia({ video: { width: 480, height: 360 }, audio: false })
      .then((s) => {
        if (cancelled) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        if (videoRef.current) videoRef.current.srcObject = s;
      })
      .catch(() => setError("Camera not available."));

    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [active]);

  if (!active) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-card-border bg-black">
      {error ? (
        <p className="p-4 text-center text-sm text-muted">{error}</p>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="aspect-video w-full -scale-x-100 object-cover"
        />
      )}
    </div>
  );
}
