import { spotifyFetch } from "./spotifyApi";
import type { SpotifyResponse } from "./spotifyApi";

export const playbackPlay = (
  deviceId: string,
  uris: string[],
  offsetPosition: number,
): Promise<SpotifyResponse<null>> =>
  spotifyFetch<null>(`/me/player/play?device_id=${encodeURIComponent(deviceId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ uris, offset: { position: offsetPosition }, position_ms: 0 }),
  });


export const playbackNext = (deviceId: string): Promise<SpotifyResponse<null>> =>
  spotifyFetch<null>(`/me/player/next?device_id=${encodeURIComponent(deviceId)}`, {
    method: "POST",
  });

export const playbackPrev = (deviceId: string): Promise<SpotifyResponse<null>> =>
  spotifyFetch<null>(`/me/player/previous?device_id=${encodeURIComponent(deviceId)}`, {
    method: "POST",
  });
