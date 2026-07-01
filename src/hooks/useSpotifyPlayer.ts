import { useCallback, useEffect, useRef, useState } from "react";
import { refreshAccessToken } from "../lib/spotifyAuth";

interface SpotifyPlayerState {
  isPaused: boolean;
  currentTrackId: string | null;
  position: number;
}

export function useSpotifyPlayer(enabled: boolean, onError?: (msg: string) => void) {
  const playerRef = useRef<Spotify.Player | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [playerState, setPlayerState] = useState<SpotifyPlayerState>({
    isPaused: true,
    currentTrackId: null,
    position: 0,
  });

  // Tracks the last known position snapshot from the SDK so the timer can
  // interpolate between discrete player_state_changed events.
  const positionRef = useRef({ position: 0, at: 0 });

  // Smooth position interpolation while playing
  useEffect(() => {
    if (playerState.isPaused) return;
    const interval = setInterval(() => {
      const estimated = positionRef.current.position + (Date.now() - positionRef.current.at);
      setPlayerState((prev) => ({ ...prev, position: estimated }));
    }, 500);
    return () => clearInterval(interval);
  }, [playerState.isPaused, playerState.currentTrackId]);

  // Prevents duplicate toasts when authentication_error fires and connect() also
  // resolves to false for the same root cause (e.g. Firefox ETP blocking SDK connections).
  const sdkErrorRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const init = () => {
      sdkErrorRef.current = false;

      const player = new window.Spotify.Player({
        name: "Spotify Playlist Manager",
        getOAuthToken: (cb) => {
          const stored = sessionStorage.getItem("spotify_access_token") ?? "";
          const expiresAt = Number(sessionStorage.getItem("spotify_token_expires_at") ?? 0);
          if (expiresAt > 0 && Date.now() > expiresAt) {
            refreshAccessToken().then((refreshed) => cb(refreshed ?? stored));
          } else {
            cb(stored);
          }
        },
        volume: Number(localStorage.getItem("player_volume") ?? 0.5),
      });

      player.addListener("ready", ({ device_id }) => setDeviceId(device_id));

      player.addListener("not_ready", () => setDeviceId(null));

      player.addListener("player_state_changed", (state) => {
        if (!state) return;
        positionRef.current = { position: state.position, at: Date.now() };
        setPlayerState({
          isPaused: state.paused,
          currentTrackId: state.track_window.current_track.id ?? null,
          position: state.position,
        });
      });

      player.addListener("initialization_error", ({ message }) => {
        console.error("[Spotify SDK] initialization_error:", message);
        if (sdkErrorRef.current) return;
        sdkErrorRef.current = true;
        const isDrm = message.toLowerCase().includes("failed to initialize");
        onError?.(
          isDrm
            ? "Spotify playback requires DRM (Widevine). Use Chrome or Edge, and make sure DRM is enabled in your browser settings."
            : `Spotify player error: ${message}`,
        );
      });
      player.addListener("authentication_error", ({ message }) => {
        console.error("[Spotify SDK] authentication_error:", message);
        if (sdkErrorRef.current) return;
        sdkErrorRef.current = true;
        const isFirefox = navigator.userAgent.includes("Firefox");
        onError?.(
          isFirefox
            ? "Spotify playback is blocked by Firefox's Enhanced Tracking Protection. Click the shield icon in the address bar and disable protection for this site, then refresh."
            : "Spotify authentication failed — try logging out and back in.",
        );
      });
      player.addListener("account_error", ({ message }) => {
        console.error("[Spotify SDK] account_error:", message);
        if (sdkErrorRef.current) return;
        sdkErrorRef.current = true;
        onError?.("Spotify Premium is required for in-browser audio playback.");
      });

      player.connect().then((success) => {
        if (!success && !sdkErrorRef.current) {
          sdkErrorRef.current = true;
          onError?.("Spotify player failed to connect — try refreshing.");
        }
      });

      playerRef.current = player;
    };

    if (window.Spotify?.Player) {
      init();
    } else {
      window.onSpotifyWebPlaybackSDKReady = init;
    }

    return () => {
      playerRef.current?.disconnect();
      playerRef.current = null;
    };
  }, [enabled, onError]);

  const seek = useCallback((positionMs: number) => {
    positionRef.current = { position: positionMs, at: Date.now() };
    setPlayerState((prev) => ({ ...prev, position: positionMs }));
    playerRef.current?.seek(positionMs);
  }, []);

  const togglePlay = useCallback(() => playerRef.current?.togglePlay(), []);

  const [volume, setVolume] = useState(
    () => Number(localStorage.getItem("player_volume") ?? 0.5),
  );

  const setPlayerVolume = useCallback((v: number) => {
    setVolume(v);
    localStorage.setItem("player_volume", String(v));
    playerRef.current?.setVolume(v);
  }, []);

  return { deviceId, playerState, seek, togglePlay, volume, setPlayerVolume };
}
