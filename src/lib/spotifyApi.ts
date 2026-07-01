import type {
  Playlist,
  PlaylistItem,
  SpotifyPage,
  SpotifyTrack,
  TopArtist,
} from "../types";
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
        : `Error ${status}: ${errorData?.error?.message || text || "Request failed"}`;
    return { status, data: null, error };
  }

  const data = parseJSON<T>(await response.text());
  return { status, data, error: null };
};

// Spotify returns 403 for the tracks/items sub-resource of a playlist owned
// by a user outside this app's Development Mode allowlist, even though the
// playlist's own metadata (name, images, totals) is still readable.
export const PLAYLIST_TRACKS_FORBIDDEN = "playlist-tracks-forbidden";

export const getPlaylistWithTracks = async (
  playlistId: string,
): Promise<SpotifyResponse<Playlist>> => {
  const result = await spotifyFetch<Playlist>(`/playlists/${playlistId}`);
  if (result.error || !result.data) {
    return { status: result.status, data: null, error: result.error };
  }

  const data = result.data;

  // GET /playlists/{id} doesn't inline the track list — it either omits the
  // `items` field entirely or (per the list endpoint's shape) includes just
  // an `href` + `total` summary. Either way, fetch the first page of tracks
  // separately: from that href when present, or the default items endpoint.
  if (!data.items?.items?.length) {
    const path = data.items?.href
      ? data.items.href.replace(SPOTIFY_API_BASE, "")
      : `/playlists/${playlistId}/items`;
    const tracksResult = await spotifyFetch<SpotifyPage<PlaylistItem>>(path);
    if (tracksResult.data) {
      data.items = tracksResult.data;
    } else if (tracksResult.status === 403) {
      // Deliberately returns both `data` and `error` — unlike every other
      // branch in this file — so the UI can still show the playlist's name,
      // art, and total even though its tracks are forbidden.
      return { status: 403, data, error: PLAYLIST_TRACKS_FORBIDDEN };
    } else if (tracksResult.error) {
      return { status: tracksResult.status, data: null, error: tracksResult.error };
    }
  }

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

export const getTopArtists = (timeRange: TimeRange, limit = 50, offset = 0) =>
  spotifyFetch<SpotifyPage<TopArtist>>(
    `/me/top/artists?time_range=${timeRange}&limit=${limit}&offset=${offset}`,
  );

export const getTopTracks = (timeRange: TimeRange, limit = 50, offset = 0) =>
  spotifyFetch<SpotifyPage<SpotifyTrack>>(
    `/me/top/tracks?time_range=${timeRange}&limit=${limit}&offset=${offset}`,
  );
