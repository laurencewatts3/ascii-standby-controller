"use client";

interface NowPlayingProps {
  trackName: string;
  artistName: string;
  albumName: string;
}

export default function NowPlaying({
  trackName,
  artistName,
  albumName,
}: NowPlayingProps) {
  return (
    <div className="now-playing">
      <p className="now-playing-track">{trackName}</p>
      <p className="now-playing-artist">{artistName}</p>
      <p className="now-playing-album">{albumName}</p>
    </div>
  );
}
