#!/usr/bin/env node

/**
 * generate-placeholder-frames.js
 *
 * Generates 60 placeholder ASCII animation frames.
 * Creates a pulsing/rotating abstract shape so the app
 * is fully functional before real frames are supplied.
 *
 * Usage: node scripts/generate-placeholder-frames.js
 * Output: public/frames/frame_0001.txt through frame_0060.txt
 */

const fs = require("fs");
const path = require("path");

const FRAME_COUNT = 60;
const COLS = 80;
const ROWS = 36;
const OUTPUT_DIR = path.join(__dirname, "..", "public", "frames");

const ASCII_CHARS = " .':;|\\/)({*#%@";

function distance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function generateFrame(frameIndex) {
  const t = (frameIndex / FRAME_COUNT) * Math.PI * 2;
  const centerX = COLS / 2;
  const centerY = ROWS / 2;
  const maxRadius = Math.min(COLS / 2, ROWS) * 0.85;

  let lines = [];

  for (let y = 0; y < ROWS; y++) {
    let line = "";
    for (let x = 0; x < COLS; x++) {
      // Adjust for font aspect ratio (chars are ~2x taller than wide)
      const ax = x;
      const ay = y * 2.0;
      const acx = centerX;
      const acy = centerY * 2.0;

      const dist = distance(ax, ay, acx, acy);
      const angle = Math.atan2(ay - acy, ax - acx);

      // Multiple concentric pulsing rings
      const ring1 = Math.sin(dist * 0.4 - t * 2) * 0.5 + 0.5;
      const ring2 = Math.sin(dist * 0.25 - t * 1.5 + Math.PI) * 0.5 + 0.5;

      // Spiral arms
      const spiral = Math.sin(angle * 3 + dist * 0.15 - t * 2) * 0.5 + 0.5;

      // Radial falloff
      const normalizedDist = dist / (maxRadius * 2.0);
      const falloff = Math.max(0, 1 - normalizedDist * normalizedDist);

      // Combine
      const value = (ring1 * 0.4 + ring2 * 0.3 + spiral * 0.3) * falloff;

      // Map to ASCII character
      const charIndex = Math.floor(value * (ASCII_CHARS.length - 1));
      line += ASCII_CHARS[Math.max(0, Math.min(charIndex, ASCII_CHARS.length - 1))];
    }
    lines.push(line);
  }

  return lines.join("\n");
}

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

for (let i = 1; i <= FRAME_COUNT; i++) {
  const frameContent = generateFrame(i - 1);
  const filename = `frame_${String(i).padStart(4, "0")}.txt`;
  fs.writeFileSync(path.join(OUTPUT_DIR, filename), frameContent);
}

console.log(`Generated ${FRAME_COUNT} placeholder frames in ${OUTPUT_DIR}`);
