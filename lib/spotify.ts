/**
 * Spotify PKCE Auth + API
 *
 * Fully client-side PKCE Authorization Code Flow.
 * No backend needed. Tokens in sessionStorage only.
 */

const CLIENT_ID = "d2cac685aaeb4640bfba1ce9add6a573";
const SCOPES = [
  "user-read-playback-state",
  "user-modify-playback-state",
  "user-read-currently-playing",
].join(" ");

const SPOTIFY_AUTH_URL = "https://accounts.spotify.com/authorize";
const SPOTIFY_TOKEN_URL = "https://accounts.spotify.com/api/token";
const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

// --- Helpers ---

function getRedirectUri(): string {
  const origin = window.location.origin;
  const isLocal =
    origin.includes("localhost") || origin.includes("127.0.0.1");
  if (isLocal) {
    return `${origin}/callback`;
  }
  return `${origin}/ascii-standby-controller/callback`;
}

function generateRandomString(length: number): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values, (v) => chars[v % chars.length]).join("");
}

async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);

  // Try crypto.subtle first (available in secure contexts)
  try {
    if (window?.crypto?.subtle) {
      return await window.crypto.subtle.digest("SHA-256", data);
    }
  } catch {
    // Fall through to pure JS implementation
  }

  // Pure JS SHA-256 fallback for non-secure contexts (http://127.0.0.1)
  return sha256Fallback(data).buffer as ArrayBuffer;
}

function sha256Fallback(data: Uint8Array): Uint8Array {
  const K: number[] = [
    0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
    0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
    0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
    0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
    0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
    0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
    0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
    0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2,
  ];

  const rr = (v: number, n: number) => (v >>> n) | (v << (32 - n));

  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;

  const len = data.length;
  const bitLen = len * 8;
  const padLen = ((len + 9 + 63) & ~63);
  const padded = new Uint8Array(padLen);
  padded.set(data);
  padded[len] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(padLen - 4, bitLen, false);

  for (let off = 0; off < padLen; off += 64) {
    const w = new Int32Array(64);
    for (let i = 0; i < 16; i++) w[i] = view.getUint32(off + i * 4, false);
    for (let i = 16; i < 64; i++) {
      const s0 = rr(w[i-15], 7) ^ rr(w[i-15], 18) ^ (w[i-15] >>> 3);
      const s1 = rr(w[i-2], 17) ^ rr(w[i-2], 19) ^ (w[i-2] >>> 10);
      w[i] = (w[i-16] + s0 + w[i-7] + s1) | 0;
    }
    let a=h0, b=h1, c=h2, d=h3, e=h4, f=h5, g=h6, h=h7;
    for (let i = 0; i < 64; i++) {
      const S1 = rr(e, 6) ^ rr(e, 11) ^ rr(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + K[i] + w[i]) | 0;
      const S0 = rr(a, 2) ^ rr(a, 13) ^ rr(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) | 0;
      h=g; g=f; f=e; e=(d+t1)|0; d=c; c=b; b=a; a=(t1+t2)|0;
    }
    h0=(h0+a)|0; h1=(h1+b)|0; h2=(h2+c)|0; h3=(h3+d)|0;
    h4=(h4+e)|0; h5=(h5+f)|0; h6=(h6+g)|0; h7=(h7+h)|0;
  }

  const out = new Uint8Array(32);
  const ov = new DataView(out.buffer);
  ov.setUint32(0,h0,false); ov.setUint32(4,h1,false);
  ov.setUint32(8,h2,false); ov.setUint32(12,h3,false);
  ov.setUint32(16,h4,false); ov.setUint32(20,h5,false);
  ov.setUint32(24,h6,false); ov.setUint32(28,h7,false);
  return out;
}

function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

// --- Auth Flow ---

export async function initiateLogin(): Promise<void> {
  const codeVerifier = generateRandomString(128);
  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64UrlEncode(hashed);

  sessionStorage.setItem("spotify_code_verifier", codeVerifier);

  const params = new URLSearchParams({
    response_type: "code",
    client_id: CLIENT_ID,
    scope: SCOPES,
    redirect_uri: getRedirectUri(),
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
  });

  window.location.href = `${SPOTIFY_AUTH_URL}?${params.toString()}`;
}

export async function handleCallback(): Promise<boolean> {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const error = params.get("error");

  if (error) {
    console.error("Spotify auth error:", error);
    return false;
  }

  if (!code) return false;

  const codeVerifier = sessionStorage.getItem("spotify_code_verifier");
  if (!codeVerifier) {
    console.error("No code verifier found");
    return false;
  }

  try {
    const response = await fetch(SPOTIFY_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: getRedirectUri(),
        client_id: CLIENT_ID,
        code_verifier: codeVerifier,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("Token exchange failed:", response.status, errBody);
      return false;
    }

    const data = await response.json();
    storeTokens(data);
    sessionStorage.removeItem("spotify_code_verifier");
    return true;
  } catch (err) {
    console.error("Token exchange error:", err);
    return false;
  }
}

function storeTokens(data: {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}): void {
  sessionStorage.setItem("spotify_access_token", data.access_token);
  sessionStorage.setItem("spotify_refresh_token", data.refresh_token);
  sessionStorage.setItem(
    "spotify_token_expiry",
    String(Date.now() + data.expires_in * 1000)
  );
}

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = sessionStorage.getItem("spotify_refresh_token");
  if (!refreshToken) return false;

  try {
    const response = await fetch(SPOTIFY_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: CLIENT_ID,
      }),
    });

    if (!response.ok) return false;

    const data = await response.json();
    storeTokens({
      access_token: data.access_token,
      refresh_token: data.refresh_token || refreshToken,
      expires_in: data.expires_in,
    });
    return true;
  } catch {
    return false;
  }
}

async function getAccessToken(): Promise<string | null> {
  const token = sessionStorage.getItem("spotify_access_token");
  const expiry = sessionStorage.getItem("spotify_token_expiry");

  if (!token || !expiry) return null;

  // Refresh 60 seconds before expiry
  if (Date.now() > Number(expiry) - 60_000) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) return null;
    return sessionStorage.getItem("spotify_access_token");
  }

  return token;
}

export function isAuthenticated(): boolean {
  return !!sessionStorage.getItem("spotify_access_token");
}

export function logout(): void {
  sessionStorage.removeItem("spotify_access_token");
  sessionStorage.removeItem("spotify_refresh_token");
  sessionStorage.removeItem("spotify_token_expiry");
  sessionStorage.removeItem("spotify_code_verifier");
}

// --- API Calls ---

async function spotifyFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response | null> {
  const token = await getAccessToken();
  if (!token) return null;

  const response = await fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  // Token expired mid-request
  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (!refreshed) return null;
    const newToken = sessionStorage.getItem("spotify_access_token");
    return fetch(`${SPOTIFY_API_BASE}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${newToken}`,
        ...options.headers,
      },
    });
  }

  return response;
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: { name: string }[];
  album: {
    name: string;
    images: { url: string; width: number; height: number }[];
  };
}

export interface PlaybackState {
  is_playing: boolean;
  item: SpotifyTrack | null;
  progress_ms: number;
  duration_ms: number;
}

export async function getCurrentlyPlaying(): Promise<PlaybackState | null> {
  const response = await spotifyFetch("/me/player/currently-playing");
  if (!response) return null;

  // 204 = no content (nothing playing)
  if (response.status === 204) return null;
  if (!response.ok) return null;

  const data = await response.json();
  if (!data || !data.item) return null;

  return {
    is_playing: data.is_playing,
    item: data.item,
    progress_ms: data.progress_ms || 0,
    duration_ms: data.item.duration_ms || 0,
  };
}

export async function play(): Promise<void> {
  await spotifyFetch("/me/player/play", { method: "PUT" });
}

export async function pause(): Promise<void> {
  await spotifyFetch("/me/player/pause", { method: "PUT" });
}

export async function skipNext(): Promise<void> {
  await spotifyFetch("/me/player/next", { method: "POST" });
}

export async function skipPrevious(): Promise<void> {
  await spotifyFetch("/me/player/previous", { method: "POST" });
}
