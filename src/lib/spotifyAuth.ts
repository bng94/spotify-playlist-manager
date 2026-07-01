import { SPOTIFY_CLIENT_ID, SPOTIFY_REDIRECT_URI } from "./config";

const CHARSET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export const generateRandomString = (length: number): string => {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => CHARSET[b % CHARSET.length]).join("");
};

export const generateCodeChallenge = async (verifier: string) => {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(verifier),
  );
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
};

/** Thrown by validateSpotifyCallback when the redirect can't be trusted. */
export class SpotifyAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SpotifyAuthError";
  }
}

/**
 * Reads the Spotify redirect's query params, validates the PKCE state,
 * and clears both the query string and the one-time session values.
 * Throws if the redirect is missing required params or the state doesn't
 * match what we issued (possible CSRF or stale/replayed redirect).
 */
export const validateSpotifyCallback = (): {
  code: string;
  codeVerifier: string;
} => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const returnedState = params.get("state");
  const expectedState = sessionStorage.getItem("spotify_auth_state");
  const codeVerifier = sessionStorage.getItem("spotify_code_verifier");
  window.history.replaceState({}, "", import.meta.env.BASE_URL);

  if (!code || !codeVerifier || returnedState !== expectedState) {
    throw new SpotifyAuthError(
      "Spotify sign-in didn't complete. Please try again.",
    );
  }
  return { code, codeVerifier };
};

const storeTokens = (data: {
  access_token: string;
  expires_in?: number;
  refresh_token?: string;
}) => {
  const expiresAt = Date.now() + (data.expires_in ?? 3600) * 1000;
  sessionStorage.setItem("spotify_access_token", data.access_token);
  sessionStorage.setItem("spotify_token_expires_at", String(expiresAt));
  if (data.refresh_token) {
    sessionStorage.setItem("spotify_refresh_token", data.refresh_token);
  }
};

export const refreshAccessToken = async (): Promise<string | null> => {
  const refreshToken = sessionStorage.getItem("spotify_refresh_token");
  if (!refreshToken) return null;

  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: SPOTIFY_CLIENT_ID,
  });

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    console.error(`Token refresh failed (${response.status})`);
    return null;
  }

  const data = await response.json();
  if (typeof data.access_token !== "string") {
    console.error("Refresh response missing access_token");
    return null;
  }

  // Spotify may rotate the refresh token — always store the latest
  storeTokens(data);
  return data.access_token;
};

/**
 * Exchange an authorization code + PKCE verifier for an access token.
 * Throws on network failure, non-2xx response, or a malformed body —
 * the caller treats any throw the same as a failed sign-in.
 */
export const exchangeCodeForToken = async (
  code: string,
  codeVerifier: string,
): Promise<{ accessToken: string; refreshToken?: string }> => {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: SPOTIFY_REDIRECT_URI,
    client_id: SPOTIFY_CLIENT_ID,
    code_verifier: codeVerifier,
  });

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Token exchange failed (${response.status}): ${detail}`);
  }

  const data = await response.json();
  if (typeof data.access_token !== "string") {
    throw new Error("Token exchange response missing access_token");
  }

  const accessToken: string = data.access_token;
  const refreshToken: string | undefined = data.refresh_token;

  storeTokens(data);
  sessionStorage.removeItem("spotify_auth_state");
  sessionStorage.removeItem("spotify_code_verifier");

  return { accessToken, refreshToken };
};
