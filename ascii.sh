#!/bin/bash

# ============================================
# ascii.sh — Convert video to ASCII text frames
# ============================================
#
# Based on the approach from github.com/developedbyed/react-gradient-glow
# Requires: ffmpeg, ImageMagick (convert/magick)
#
# Usage:
#   ./ascii.sh <video-file>
#
# Example:
#   ./ascii.sh my-animation.mp4
#
# Output:
#   public/frames/frame_0001.txt through frame_NNNN.txt
#
# The video should ideally have a black background.
# Adjust LUMINANCE_THRESHOLD to control how much dark background is removed.

set -e

# --- Configuration ---

# Font aspect ratio (width/height). Monospace chars are typically ~0.5x as wide as tall.
FONT_RATIO="0.44"

# Luminance threshold (0-255). Pixels darker than this become spaces.
# Increase to remove more background. Decrease to keep more detail.
LUMINANCE_THRESHOLD=15

# ASCII characters from dark (sparse) to light (dense).
# First chars used for dark areas, last chars for bright areas.
ASCII_CHARS=" .'\`^,:;Il!i><~+_-?][}{1)(|/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@\$"

# Supported input video formats
VIDEO_FORMATS="mp4|webm|mov|avi|mkv|gif"

# Output frames per second
OUTPUT_FPS=24

# Output width in character columns
OUTPUT_COLUMNS=80

# --- Validate Input ---

if [ -z "$1" ]; then
  echo "Usage: ./ascii.sh <video-file>"
  echo "Example: ./ascii.sh my-animation.mp4"
  exit 1
fi

VIDEO_FILE="$1"

if [ ! -f "$VIDEO_FILE" ]; then
  echo "Error: File not found: $VIDEO_FILE"
  exit 1
fi

EXTENSION="${VIDEO_FILE##*.}"
if ! echo "$EXTENSION" | grep -qiE "^($VIDEO_FORMATS)$"; then
  echo "Error: Unsupported format .$EXTENSION"
  echo "Supported: $VIDEO_FORMATS"
  exit 1
fi

# Check dependencies
for cmd in ffmpeg convert; do
  if ! command -v "$cmd" &>/dev/null; then
    echo "Error: $cmd is required but not installed."
    if [ "$cmd" = "convert" ]; then
      echo "Install ImageMagick: brew install imagemagick"
    else
      echo "Install ffmpeg: brew install ffmpeg"
    fi
    exit 1
  fi
done

# --- Setup ---

WORK_DIR="ascii_workdir_$(date +%s)"
FRAME_DIR="$WORK_DIR/frames"
OUTPUT_DIR="public/frames"

mkdir -p "$FRAME_DIR"
mkdir -p "$OUTPUT_DIR"

echo "=== ASCII Frame Generator ==="
echo "Input:    $VIDEO_FILE"
echo "FPS:      $OUTPUT_FPS"
echo "Columns:  $OUTPUT_COLUMNS"
echo "Threshold: $LUMINANCE_THRESHOLD"
echo ""

# --- Step 1: Extract PNG frames ---

echo "[1/2] Extracting frames with ffmpeg..."
ffmpeg -i "$VIDEO_FILE" \
  -vf "fps=$OUTPUT_FPS" \
  -q:v 2 \
  "$FRAME_DIR/frame_%04d.png" \
  -hide_banner -loglevel error

FRAME_COUNT=$(ls "$FRAME_DIR"/frame_*.png 2>/dev/null | wc -l | tr -d ' ')
echo "       Extracted $FRAME_COUNT frames"

if [ "$FRAME_COUNT" -eq 0 ]; then
  echo "Error: No frames extracted. Check the video file."
  rm -rf "$WORK_DIR"
  exit 1
fi

# --- Step 2: Convert PNGs to ASCII text ---

echo "[2/2] Converting to ASCII..."

# Calculate output height based on font ratio
OUTPUT_ROWS=$(echo "$OUTPUT_COLUMNS * $FONT_RATIO" | bc | cut -d. -f1)
CHAR_COUNT=${#ASCII_CHARS}

COUNTER=0
for PNG_FILE in "$FRAME_DIR"/frame_*.png; do
  COUNTER=$((COUNTER + 1))
  BASENAME=$(basename "$PNG_FILE" .png)
  OUTPUT_FILE="$OUTPUT_DIR/${BASENAME}.txt"

  # Resize image to match our column/row grid, then extract pixel luminance
  convert "$PNG_FILE" \
    -resize "${OUTPUT_COLUMNS}x${OUTPUT_ROWS}!" \
    -colorspace Gray \
    -depth 8 \
    txt:- | \
  tail -n +2 | \
  while IFS= read -r line; do
    # Extract coordinates and gray value
    # Format: "X,Y: (GRAY)  #HEX  gray(VALUE%)"
    X=$(echo "$line" | cut -d, -f1)
    Y=$(echo "$line" | sed 's/.*,\([0-9]*\):.*/\1/')
    
    # Extract the gray value (0-255) from the sRGB or gray representation
    GRAY=$(echo "$line" | grep -oE 'gray\(([0-9]+)' | grep -oE '[0-9]+' | head -1)
    
    # Fallback: try to extract from srgb format
    if [ -z "$GRAY" ]; then
      GRAY=$(echo "$line" | grep -oE 'srgb\(([0-9]+)' | grep -oE '[0-9]+' | head -1)
    fi
    
    if [ -z "$GRAY" ]; then
      GRAY=0
    fi

    # Apply threshold — dark pixels become spaces
    if [ "$GRAY" -le "$LUMINANCE_THRESHOLD" ]; then
      printf " "
    else
      # Map luminance to ASCII character index
      CHAR_INDEX=$(( GRAY * (CHAR_COUNT - 1) / 255 ))
      printf "%s" "${ASCII_CHARS:$CHAR_INDEX:1}"
    fi

    # Newline at end of each row
    if [ "$X" = "$((OUTPUT_COLUMNS - 1))" ]; then
      printf "\n"
    fi
  done > "$OUTPUT_FILE"

  # Progress
  printf "\r       Frame %d/%d" "$COUNTER" "$FRAME_COUNT"
done

echo ""
echo ""
echo "=== Done ==="
echo "Output: $OUTPUT_DIR/ ($FRAME_COUNT frames)"
echo "Frame size: ${OUTPUT_COLUMNS}x${OUTPUT_ROWS} characters"
echo ""
echo "Tip: Update your component's frameCount to $FRAME_COUNT"
echo ""

# Cleanup
rm -rf "$WORK_DIR"

echo "Working directory cleaned up."
