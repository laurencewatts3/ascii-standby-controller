"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { AnimationManager } from "@/lib/AnimationManager";
import { getBasePath } from "@/lib/basePath";

interface AsciiAnimationProps {
  fps?: number;
  frameCount?: number;
  frameFolder?: string;
  overlayColor?: string; // CSS color string for the glow
}

export default function AsciiAnimation({
  fps = 24,
  frameCount = 60,
  frameFolder = "frames",
  overlayColor,
}: AsciiAnimationProps) {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const framesRef = useRef<string[]>([]);
  const managerRef = useRef<AnimationManager | null>(null);

  const advanceFrame = useCallback(() => {
    setCurrentFrame((prev) => {
      if (framesRef.current.length === 0) return prev;
      return (prev + 1) % framesRef.current.length;
    });
  }, []);

  // Load frames
  useEffect(() => {
    let cancelled = false;

    const loadFrames = async () => {
      try {
        const basePath = getBasePath();
        const filenames = Array.from(
          { length: frameCount },
          (_, i) => `frame_${String(i + 1).padStart(4, "0")}.txt`
        );

        const promises = filenames.map(async (filename) => {
          const url = `${basePath}/${frameFolder}/${filename}`;
          const res = await fetch(url);
          if (!res.ok) throw new Error(`Failed to load ${filename}`);
          return res.text();
        });

        const loaded = await Promise.all(promises);

        if (!cancelled) {
          framesRef.current = loaded;
          setCurrentFrame(0);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Frame load error:", err);
          setError("Failed to load animation frames");
          setIsLoading(false);
        }
      }
    };

    loadFrames();
    return () => {
      cancelled = true;
    };
  }, [frameCount, frameFolder]);

  // Animation loop — always running (StandBy mode, no focus/blur pause)
  useEffect(() => {
    if (isLoading || framesRef.current.length === 0) return;

    const manager = new AnimationManager(advanceFrame, fps);
    managerRef.current = manager;
    manager.start();

    return () => {
      manager.pause();
      managerRef.current = null;
    };
  }, [isLoading, fps, advanceFrame]);

  if (isLoading) {
    return (
      <div className="ascii-container">
        <span className="ascii-loading">loading</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ascii-container">
        <span className="ascii-loading">{error}</span>
      </div>
    );
  }

  return (
    <div className="ascii-container">
      <div className="ascii-frame-wrapper">
        <pre className="ascii-frame">{framesRef.current[currentFrame]}</pre>

        {/* Color overlay — radial gradient with color-dodge blend */}
        {overlayColor && (
          <div
            className="ascii-overlay"
            style={{
              background: `radial-gradient(ellipse at center, ${overlayColor} 0%, transparent 70%)`,
            }}
          />
        )}
      </div>
    </div>
  );
}
