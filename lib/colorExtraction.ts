/**
 * Color Extraction
 *
 * Extracts dominant color from album art via canvas pixel sampling.
 * Returns the most vibrant/saturated color for the ASCII overlay.
 * Falls back gracefully if CORS blocks the image.
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
}

const DEFAULT_COLOR: RGB = { r: 140, g: 140, b: 140 };

export function rgbToString(color: RGB): string {
  return `rgb(${color.r}, ${color.g}, ${color.b})`;
}

export function rgbToStringAlpha(color: RGB, alpha: number): string {
  return `rgba(${color.r}, ${color.g}, ${color.b}, ${alpha})`;
}

/**
 * Extract the dominant vibrant color from an image URL.
 * Uses a small canvas to sample pixels, then picks the most
 * saturated color cluster for the best visual effect with color-dodge.
 */
export async function extractDominantColor(imageUrl: string): Promise<RGB> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        const size = 64; // downsample for speed
        canvas.width = size;
        canvas.height = size;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(DEFAULT_COLOR);
          return;
        }

        ctx.drawImage(img, 0, 0, size, size);
        const imageData = ctx.getImageData(0, 0, size, size);
        const pixels = imageData.data;

        // Collect all pixels with decent saturation
        const colorBuckets: Map<string, { color: RGB; count: number; saturation: number }> =
          new Map();

        for (let i = 0; i < pixels.length; i += 4) {
          const r = pixels[i];
          const g = pixels[i + 1];
          const b = pixels[i + 2];
          const a = pixels[i + 3];

          if (a < 128) continue; // skip transparent

          // Skip near-black and near-white
          const brightness = (r + g + b) / 3;
          if (brightness < 30 || brightness > 230) continue;

          const sat = saturation(r, g, b);
          if (sat < 0.15) continue; // skip greys

          // Bucket by rounding to reduce noise
          const bucketR = Math.round(r / 32) * 32;
          const bucketG = Math.round(g / 32) * 32;
          const bucketB = Math.round(b / 32) * 32;
          const key = `${bucketR},${bucketG},${bucketB}`;

          const existing = colorBuckets.get(key);
          if (existing) {
            existing.count++;
            // Keep running average
            existing.color.r = Math.round(
              (existing.color.r * (existing.count - 1) + r) / existing.count
            );
            existing.color.g = Math.round(
              (existing.color.g * (existing.count - 1) + g) / existing.count
            );
            existing.color.b = Math.round(
              (existing.color.b * (existing.count - 1) + b) / existing.count
            );
            existing.saturation = Math.max(existing.saturation, sat);
          } else {
            colorBuckets.set(key, {
              color: { r, g, b },
              count: 1,
              saturation: sat,
            });
          }
        }

        if (colorBuckets.size === 0) {
          resolve(DEFAULT_COLOR);
          return;
        }

        // Sort by (saturation * count) to find dominant vibrant color
        const sorted = Array.from(colorBuckets.values()).sort(
          (a, b) =>
            b.saturation * Math.sqrt(b.count) -
            a.saturation * Math.sqrt(a.count)
        );

        resolve(sorted[0].color);
      } catch {
        resolve(DEFAULT_COLOR);
      }
    };

    img.onerror = () => resolve(DEFAULT_COLOR);

    // Timeout after 3 seconds
    setTimeout(() => resolve(DEFAULT_COLOR), 3000);

    img.src = imageUrl;
  });
}

function saturation(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max === 0) return 0;
  return (max - min) / max;
}
