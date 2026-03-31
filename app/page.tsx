"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  isAuthenticated,
  getCurrentlyPlaying,
  play,
  pause,
  skipNext,
  skipPrevious,
  type PlaybackState,
} from "@/lib/spotify";
import {
  extractDominantColor,
  rgbToStringAlpha,
  type RGB,
} from "@/lib/colorExtraction";
import AsciiAnimation from "@/components/AsciiAnimation";
import NowPlaying from "@/components/NowPlaying";
import Controls from "@/components/Controls";
import LoginScreen from "@/components/LoginScreen";

const POLL_INTERVAL = 3000;

export default function Home() {
  const [authed, setAuthed] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [playback, setPlayback] = useState<PlaybackState | null>(null);
  const [overlayColor, setOverlayColor] = useState<string | undefined>(
    undefined
  );
  const currentTrackIdRef = useRef<string | null>(null);
  const colorCacheRef = useRef<Map<string, RGB>>(new Map());

  // Hydration check
  useEffect(() => {
    setHydrated(true);
    setAuthed(isAuthenticated());
  }, []);

  // Poll currently playing
  const poll = useCallback(async () => {
    if (!isAuthenticated()) return;

    try {
      const state = await getCurrentlyPlaying();
      setPlayback(state);

      if (state?.item) {
        const trackId = state.item.id;

        // Only extract color on track change
        if (trackId !== currentTrackIdRef.current) {
          currentTrackIdRef.current = trackId;

          // Check cache first
          const cached = colorCacheRef.current.get(trackId);
          if (cached) {
            setOverlayColor(rgbToStringAlpha(cached, 1));
          } else {
            // Get smallest album art for faster extraction
            const images = state.item.album.images;
            const artUrl =
              images.length > 0
                ? images[images.length - 1].url // smallest
                : null;

            if (artUrl) {
              const color = await extractDominantColor(artUrl);
              colorCacheRef.current.set(trackId, color);
              setOverlayColor(rgbToStringAlpha(color, 1));
            }
          }
        }
      } else {
        currentTrackIdRef.current = null;
        setOverlayColor(undefined);
      }
    } catch (err) {
      console.error("Poll error:", err);
    }
  }, []);

  useEffect(() => {
    if (!authed) return;

    // Initial poll
    poll();

    const interval = setInterval(poll, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [authed, poll]);

  // Playback controls
  const handlePlayPause = async () => {
    if (!playback) return;
    if (playback.is_playing) {
      await pause();
    } else {
      await play();
    }
    // Immediate re-poll to update UI
    setTimeout(poll, 300);
  };

  const handleSkipNext = async () => {
    await skipNext();
    setTimeout(poll, 500);
  };

  const handleSkipPrevious = async () => {
    await skipPrevious();
    setTimeout(poll, 500);
  };

  // Don't render until hydrated (avoids SSR mismatch with sessionStorage)
  if (!hydrated) return null;

  if (!authed) {
    return <LoginScreen />;
  }

  const track = playback?.item;
  const trackName = track?.name ?? "—";
  const artistName =
    track?.artists.map((a) => a.name).join(", ") ?? "—";
  const albumName = track?.album.name ?? "";

  return (
    <div className="player">
      <div className="player-ascii">
        <AsciiAnimation
          fps={24}
          frameCount={60}
          frameFolder="frames"
          overlayColor={overlayColor}
        />
      </div>

      <div className="player-info">
        <div className="player-info-inner">
          <NowPlaying
            trackName={trackName}
            artistName={artistName}
            albumName={albumName}
          />
          <Controls
            isPlaying={playback?.is_playing ?? false}
            onPlayPause={handlePlayPause}
            onSkipNext={handleSkipNext}
            onSkipPrevious={handleSkipPrevious}
          />
        </div>
      </div>
    </div>
  );
}
