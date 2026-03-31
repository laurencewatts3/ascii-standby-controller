# ascii · standby

Fullscreen Spotify now-playing display with ASCII character animation. Designed for iPhone StandBy mode — landscape, OLED-safe, always on.

## What it does

- Shows currently playing Spotify track with clean monospace typography
- Loops a pre-generated ASCII character animation on the left side
- Extracts the dominant color from album art and applies it as a glow overlay on the ASCII character via `mix-blend-mode: color-dodge`
- Controls playback on your Mac via Spotify Connect (play/pause, skip)
- Near-black background throughout — OLED pixels barely active
- Subtle breathe animation on controls to prevent burn-in

## Requirements

- Node.js 18+
- Spotify Premium account
- ffmpeg + ImageMagick (for generating ASCII frames from video)

## Quick start

```bash
# Install dependencies
npm install

# Generate placeholder ASCII frames
node scripts/generate-placeholder-frames.js

# Start dev server
npm run dev
```

Open `http://127.0.0.1:3000` in your browser.

## Creating your ASCII animation

1. Find or create a looping video with a black background (fire, coin, character, etc.)
2. Run the conversion script:

```bash
./ascii.sh your-video.mp4
```

3. The script outputs `.txt` frames to `public/frames/`
4. Update `frameCount` in `app/page.tsx` to match your frame count
5. Tweak `LUMINANCE_THRESHOLD` and `OUTPUT_COLUMNS` in `ascii.sh` to refine the look

### Tips for good results

- Black background videos work best
- Simpler shapes with strong contrast convert cleanly
- Try adjusting `LUMINANCE_THRESHOLD` (0-255) — higher removes more dark areas
- `OUTPUT_COLUMNS=80` is a good default for the landscape layout
- Sources: [LottieFiles](https://lottiefiles.com) (export as MP4), YouTube stock animations, After Effects renders

## Spotify setup

1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Create an app
3. Add these redirect URIs:
   - `https://laurencewatts3.github.io/ascii-standby-controller/callback`
   - `http://127.0.0.1:3000/callback`
4. Copy your Client ID into `lib/spotify.ts`

## Deploy to GitHub Pages

Push to `main` and the GitHub Action builds and deploys automatically.

Or manually:

```bash
npm run build
# Output is in ./out — deploy that folder
```

### GitHub repo settings

1. Go to Settings → Pages
2. Set Source to "GitHub Actions"

## StandBy mode setup (iPhone)

1. Open `https://laurencewatts3.github.io/ascii-standby-controller` in Safari
2. Connect your Spotify account
3. Set Auto-Lock to Never (Settings → Display & Brightness)
4. Place phone in landscape on a charger
5. StandBy activates — Safari stays fullscreen

## Architecture

```
app/
  page.tsx          Main player — polls Spotify, manages state
  callback/page.tsx OAuth callback handler
  layout.tsx        Root layout with font + viewport
  globals.css       All styles — OLED dark, breathe animation

components/
  AsciiAnimation.tsx  Frame loader + AnimationManager + color overlay
  NowPlaying.tsx      Track/artist/album display
  Controls.tsx        Play/pause/skip buttons
  LoginScreen.tsx     Pre-auth Spotify connect button

lib/
  AnimationManager.ts requestAnimationFrame loop with delta timing
  spotify.ts          PKCE auth + API client (fully client-side)
  colorExtraction.ts  Canvas-based dominant color from album art
  basePath.ts         Runtime path helper for GitHub Pages

scripts/
  generate-placeholder-frames.js  Creates 60 demo frames

ascii.sh              Video → ASCII text frame pipeline (ffmpeg + ImageMagick)
```

## No backend

Everything runs client-side. Auth uses PKCE (no client secret needed). Tokens live in `sessionStorage` only. The app controls Spotify playback on your Mac via the Connect API — it doesn't stream audio.
