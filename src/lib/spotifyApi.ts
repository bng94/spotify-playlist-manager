import type { Playlist, SpotifyTrack, TopArtist } from "../types";
import { refreshAccessToken } from "./spotifyAuth";

const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

const parseJSON = <T>(text: string): T | null => {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
};

export type SpotifyResponse<T> = {
  status: number;
  data: T | null;
  error: string | null;
};

const OWNER_PREMIUM_MESSAGE =
  "Active premium subscription required for the owner of the app.";

export const APP_CONFIG_ERROR = "app-config-error";

export const spotifyFetch = async <T>(
  path: string,
  init: RequestInit = {},
): Promise<SpotifyResponse<T>> => {
  let accessToken = sessionStorage.getItem("spotify_access_token");
  if (!accessToken) {
    return { status: 401, data: null, error: "Not authenticated" };
  }

  const expiresAt = Number(
    sessionStorage.getItem("spotify_token_expires_at") ?? 0,
  );
  if (expiresAt > 0 && Date.now() > expiresAt) {
    const refreshed = await refreshAccessToken();
    if (!refreshed)
      return { status: 401, data: null, error: "Session expired" };
    accessToken = refreshed;
  }

  let response = await fetch(`${SPOTIFY_API_BASE}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${accessToken}`, ...init.headers },
  });

  if (response.status === 401) {
    const refreshed = await refreshAccessToken();
    if (!refreshed)
      return { status: 401, data: null, error: "Session expired" };
    response = await fetch(`${SPOTIFY_API_BASE}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${refreshed}`, ...init.headers },
    });
  }

  const status = response.status;

  if (!response.ok) {
    if (status === 429) {
      console.warn("Spotify rate limit hit");
    }

    const text = await response.text();
    const errorData = parseJSON<{ error?: { message?: string } }>(text);

    const error =
      status === 403 && text.includes(OWNER_PREMIUM_MESSAGE)
        ? APP_CONFIG_ERROR
        : `Error ${status}: ${errorData?.error?.message || text || ` Request failed`}`;
    return { status, data: null, error };
  }

  const data = parseJSON<T>(await response.text());
  return { status, data, error: null };
};

export const getPlaylistWithTracks = async (
  playlistId: string,
): Promise<{
  status: number;
  data: Playlist | null;
  error: string | null;
}> => {
  const result = await spotifyFetch<Playlist>(`/playlists/${playlistId}`);
  if (result.error || !result.data) {
    return { status: result.status, data: null, error: result.error };
  }

  const data = result.data;

  return { status: result.status, data, error: null };
};

export const removePlaylistTracks = (
  playlistId: string,
  trackUris: string[],
  snapshotId: string,
): Promise<SpotifyResponse<{ snapshot_id: string }>> =>
  spotifyFetch<{ snapshot_id: string }>(`/playlists/${playlistId}/tracks`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      items: trackUris.map((uri) => ({ uri })),
      snapshot_id: snapshotId,
    }),
  });

interface SpotifySearchResponse {
  tracks: { items: SpotifyTrack[]; total: number; next: string | null };
}

export const searchTracks = async (
  query: string,
): Promise<SpotifyResponse<SpotifyTrack[]>> => {
  const params = new URLSearchParams({ q: query, type: "track", limit: "10" });
  const result = await spotifyFetch<SpotifySearchResponse>(`/search?${params}`);
  if (result.error || !result.data) {
    return { status: result.status, data: null, error: result.error };
  }
  return { status: result.status, data: result.data.tracks.items, error: null };
};

export const updatePlaylistDetails = (
  playlistId: string,
  details: { name?: string; description?: string; public?: boolean },
): Promise<SpotifyResponse<null>> =>
  spotifyFetch<null>(`/playlists/${playlistId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(details),
  });

export const createPlaylistOnSpotify = (
  name: string,
): Promise<SpotifyResponse<Playlist>> =>
  spotifyFetch<Playlist>("/me/playlists", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, public: false }),
  });

export const unfollowPlaylist = (
  playlistId: string,
): Promise<SpotifyResponse<null>> =>
  spotifyFetch<null>(`/playlists/${playlistId}/followers`, {
    method: "DELETE",
  });

export const addTracksToPlaylist = (
  playlistId: string,
  uris: string[],
): Promise<SpotifyResponse<{ snapshot_id: string }>> =>
  spotifyFetch<{ snapshot_id: string }>(`/playlists/${playlistId}/tracks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uris }),
  });

export type TimeRange = "long_term" | "medium_term" | "short_term";

interface TopItemsPage<T> {
  items: T[];
  next: string | null;
  total: number;
  limit: number;
  offset: number;
}

export const getTopArtists = (timeRange: TimeRange, limit = 50, offset = 0) =>
  spotifyFetch<TopItemsPage<TopArtist>>(
    `/me/top/artists?time_range=${timeRange}&limit=${limit}&offset=${offset}`,
  );

export const getTopTracks = (timeRange: TimeRange, limit = 50, offset = 0) =>
  spotifyFetch<TopItemsPage<SpotifyTrack>>(
    `/me/top/tracks?time_range=${timeRange}&limit=${limit}&offset=${offset}`,
  );
