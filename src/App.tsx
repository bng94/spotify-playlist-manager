import { useCallback, useEffect, useRef, useState } from "react";
import {
  useNavigate,
  useLocation,
  useParams,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import type {
  Playlist,
  PlaylistItem,
  PlaylistTracksPage,
  SpotifyPlaylistsPage,
  SpotifyTrack,
} from "./types";
import {
  createPlaylistOnSpotify,
  unfollowPlaylist,
  updatePlaylistDetails,
  getPlaylistWithTracks,
  spotifyFetch,
  APP_CONFIG_ERROR,
} from "./lib/spotifyApi";
import { playbackPlay, playbackNext, playbackPrev } from "./lib/playbackApi";
import { removePlaylist } from "./lib/playlistOperations";
import { useSpotifyPlayer } from "./hooks/useSpotifyPlayer";
import { useToast } from "./contexts/ToastContext/ToastContext";
import { useUser } from "./contexts/UserContext/UserContext";
import { useSpotifyApi } from "./contexts/SpotifyApiContext/SpotifyApiContext";
import Button from "./components/Button/Button";
import NowPlayingBar from "./components/NowPlayingBar/NowPlayingBar";
import ProfileMenu from "./components/ProfileMenu/ProfileMenu";
import LoginScreen from "./screens/LoginScreen/LoginScreen";
import CallbackScreen from "./screens/CallbackScreen/CallbackScreen";
import PlaylistsScreen from "./screens/PlaylistsScreen/PlaylistsScreen";
import PlaylistDetailScreen from "./screens/PlaylistDetailScreen/PlaylistDetailScreen";
import ProfileScreen from "./screens/ProfileScreen/ProfileScreen";
import PrivacyScreen from "./screens/PrivacyScreen/PrivacyScreen";
import AppConfigErrorScreen from "./screens/AppConfigErrorScreen/AppConfigErrorScreen";

const PLAYLISTS_LIMIT = 50;

// Separate component so it can call useParams() for the :id segment
function PlaylistDetailRoute({
  playlists,
  loadingPlaylists,
  onBack,
  onRename,
  onTracksLoad,
  onPlay,
  currentTrackId,
}: {
  playlists: Playlist[];
  loadingPlaylists: boolean;
  onBack: () => void;
  onRename: (id: string, name: string) => void;
  onTracksLoad: (tracks: SpotifyTrack[]) => void;
  onPlay: (trackId: string) => void;
  currentTrackId: string;
}) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { pushError } = useToast();
  const playlist = playlists.find((p) => p.id === id);
  const playlistId = playlist?.id;
  const [playlistItems, setPlaylistItems] = useState<PlaylistItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [totalTracks, setTotalTracks] = useState(0);

  // Keep nowPlayingTracks in sync with all accumulated playlist items
  useEffect(() => {
    onTracksLoad(
      playlistItems.map((pi) => pi.item).filter((t): t is SpotifyTrack => t != null),
    );
  }, [playlistItems, onTracksLoad]);

  const applyPage = useCallback((page: PlaylistTracksPage, append: boolean) => {
    const newItems = page.items ?? [];
    setPlaylistItems((prev) => (append ? [...prev, ...newItems] : newItems));
    setNextUrl(page.next);
    setTotalTracks(page.total);
  }, []);

  // Fetch first page whenever the playlist id is ready
  useEffect(() => {
    if (loadingPlaylists || !id || !playlistId) return;
    setPlaylistItems([]);
    setNextUrl(null);
    setLoadMoreError(false);
    setLoadingItems(true);
    getPlaylistWithTracks(id).then((result) => {
      setLoadingItems(false);
      if (result.data?.tracks) {
        applyPage(result.data.tracks, false);
      } else if (result.error) {
        pushError(result.error);
      }
    });
  }, [id, loadingPlaylists, playlistId, applyPage, pushError]);

  const loadMore = useCallback(async () => {
    if (!nextUrl || loadingMore) return;
    setLoadMoreError(false);
    setLoadingMore(true);
    const path = nextUrl.replace("https://api.spotify.com/v1", "");
    const result = await spotifyFetch<PlaylistTracksPage>(path);
    setLoadingMore(false);
    if (result.data) {
      applyPage(result.data, true);
    } else {
      setLoadMoreError(true);
    }
  }, [nextUrl, loadingMore, applyPage]);

  // Navigation guard — redirect if playlist not found
  useEffect(() => {
    if (loadingPlaylists) return;
    if (!id || !playlist) {
      if (id) pushError("Playlist not found");
      navigate("/playlists", { replace: true });
    }
  }, [id, playlist, loadingPlaylists, navigate, pushError]);

  if (loadingPlaylists || !playlist) return null;

  return (
    <PlaylistDetailScreen
      playlist={playlist}
      onBack={onBack}
      onRename={(name) => onRename(playlist.id, name)}
      items={playlistItems}
      loadingTracks={loadingItems}
      onPlay={onPlay}
      currentTrackId={currentTrackId}
      totalTracks={totalTracks}
      hasMore={nextUrl !== null}
      loadingMore={loadingMore}
      loadMoreError={loadMoreError}
      onLoadMore={loadMore}
    />
  );
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [loadingPlaylists, setLoadingPlaylists] = useState(
    () => !!sessionStorage.getItem("spotify_access_token"),
  );
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [playlistsTotal, setPlaylistsTotal] = useState(0);
  const [playlistsOffset, setPlaylistsOffset] = useState(0);
  const [nowPlayingTracks, setNowPlayingTracks] = useState<SpotifyTrack[]>([]);
  const [selectedTrackId, setSelectedTrackId] = useState<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | undefined>(undefined);
  const sessionFetchedRef = useRef(false);
  const { pushToast, pushError } = useToast();
  // Suppress the raw APP_CONFIG_ERROR sentinel — SpotifyApiContext already shows the human-readable message
  const pushApiError = useCallback(
    (error: string | null) => {
      if (error && error !== APP_CONFIG_ERROR) pushError(error);
    },
    [pushError],
  );
  const { user, hasToken, callbackError, login, logout, fetchUser } = useUser();
  const { apiFetch, appConfigError } = useSpotifyApi();
  const { deviceId, playerState, seek, togglePlay, volume, setPlayerVolume } = useSpotifyPlayer(hasToken, pushApiError);

  // Reset data-fetch guard whenever the session ends so re-login re-fetches
  useEffect(() => {
    if (!hasToken) sessionFetchedRef.current = false;
  }, [hasToken]);

  const fetchPlaylists = useCallback(
    async (offset = 0) => {
      setLoadingPlaylists(true);
      const data = await apiFetch<SpotifyPlaylistsPage>(
        `/me/playlists?limit=${PLAYLISTS_LIMIT}&offset=${offset}`,
      );
      setPlaylists(data?.items ?? []);
      setPlaylistsTotal(data?.total ?? 0);
      setPlaylistsOffset(offset);
      setLoadingPlaylists(false);
    },
    [apiFetch],
  );

  // Restore session once when entering any authenticated page
  useEffect(() => {
    if (sessionFetchedRef.current) return;
    if (!hasToken) return;
    if (location.pathname === "/login" || location.pathname === "/callback")
      return;
    sessionFetchedRef.current = true;
    Promise.all([fetchUser(), fetchPlaylists()]);
  }, [location.pathname, hasToken, fetchUser, fetchPlaylists]);

  const handleOpenPlaylist = (id: string) => navigate(`/playlists/${id}`);
  const handleBack = () => navigate("/");

  const handleCreatePlaylist = async () => {
    const result = await createPlaylistOnSpotify("New playlist");
    if (result.data) {
      setPlaylists((prev) => [result.data!, ...prev]);
    } else if (result.error) {
      pushApiError(result.error);
    }
  };

  const handleDeletePlaylist = async (id: string) => {
    const playlist = playlists.find((p) => p.id === id);
    if (!playlist) return;
    setPlaylists((prev) => removePlaylist(prev, id));
    if (location.pathname === `/playlists/${id}`) navigate("/playlists");
    pushToast(`Deleted "${playlist.name}"`);
    if (!id.startsWith("local-")) {
      const result = await unfollowPlaylist(id);
      if (result.error) pushApiError(result.error);
    }
  };

  const handleRenamePlaylist = async (id: string, name: string) => {
    setPlaylists((prev) => prev.map((p) => (p.id === id ? { ...p, name } : p)));
    const result = await updatePlaylistDetails(id, { name });
    if (result.error) pushApiError(result.error);
  };

  const handleNextPage = () =>
    fetchPlaylists(playlistsOffset + PLAYLISTS_LIMIT);
  const handlePrevPage = () =>
    fetchPlaylists(Math.max(0, playlistsOffset - PLAYLISTS_LIMIT));

  /* Playback */
  // Update currentTrack only when we find a match — never clear it on a miss
  // so the NowPlayingBar never disappears due to a momentary empty track list.
  useEffect(() => {
    const id = playerState.currentTrackId ?? selectedTrackId;
    if (!id) return;
    const found = nowPlayingTracks.find((t) => t.id === id);
    if (found) setCurrentTrack(found);
  }, [playerState.currentTrackId, selectedTrackId, nowPlayingTracks]);

  // Clear the bar when the user logs out
  useEffect(() => {
    if (!hasToken) {
      setCurrentTrack(undefined);
      setSelectedTrackId(null);
    }
  }, [hasToken]);

  const handlePlay = async (trackId: string) => {
    setSelectedTrackId(trackId); // always update the bar immediately
    if (!deviceId) return; // SDK not ready — bar shows the track but no audio
    const uris = nowPlayingTracks.map((t) => t.uri);
    const offset = nowPlayingTracks.findIndex((t) => t.id === trackId);
    if (offset === -1) return;
    const result = await playbackPlay(deviceId, uris, offset);
    if (result.error) pushApiError(result.error);
  };

  const handleNext = async () => {
    if (!deviceId) return;
    const result = await playbackNext(deviceId);
    if (result.error) pushApiError(result.error);
  };

  const handlePrev = async () => {
    if (!deviceId) return;
    const result = await playbackPrev(deviceId);
    if (result.error) pushApiError(result.error);
  };

  // Full-screen: callback page (pathname match for local dev; ?code= match for
  // GitHub Pages where callback/index.html redirects to the app root).
  const isCallback =
    location.pathname === "/callback" ||
    new URLSearchParams(location.search).has("code");
  if (isCallback) {
    return (
      <CallbackScreen
        status={callbackError ? "error" : "loading"}
        errorMessage={callbackError ?? undefined}
        onRetry={login}
      />
    );
  }

  // Full-screen: login or unauthenticated (except /privacy which is public)
  if (
    (location.pathname === "/login" || !hasToken) &&
    location.pathname !== "/privacy"
  ) {
    return <LoginScreen onConnect={login} />;
  }

  // Shell (authenticated routes)
  return (
    <div className="app-shell">
      <nav className="app-nav">
        <div
          className="app-nav__brand"
          onClick={() => {
            navigate("/");
            if (hasToken) fetchPlaylists();
          }}
        >
          <img
            src={`${import.meta.env.BASE_URL}logo-mark.svg`}
            alt="Spotify Playlist Manager"
            className="app-nav__wordmark"
          />
        </div>
        <div className="app-nav__right">
          {hasToken ? (
            <>
              {user?.product && (
                <span className="app-nav__plan-badge">{user.product}</span>
              )}
              <ProfileMenu onLogout={logout} />
            </>
          ) : (
            <Button
              variant="primary"
              pill
              onClick={login}
              style={{ padding: "6px 16px", fontSize: 13 }}
            >
              Login to Spotify
            </Button>
          )}
        </div>
      </nav>

      <main className="app-main">
        {appConfigError ? (
          <AppConfigErrorScreen onLogout={logout} />
        ) : (
          <Routes>
            <Route
              path="/"
              element={
                <PlaylistsScreen
                  loading={loadingPlaylists}
                  playlists={playlists}
                  total={playlistsTotal}
                  offset={playlistsOffset}
                  onOpen={handleOpenPlaylist}
                  onCreate={handleCreatePlaylist}
                  onDelete={handleDeletePlaylist}
                  onNextPage={handleNextPage}
                  onPrevPage={handlePrevPage}
                />
              }
            />
            <Route path="/playlists" element={<Navigate to="/" replace />} />
            <Route
              path="/playlists/:id"
              element={
                <PlaylistDetailRoute
                  playlists={playlists}
                  loadingPlaylists={loadingPlaylists}
                  onBack={handleBack}
                  onRename={handleRenamePlaylist}
                  onTracksLoad={setNowPlayingTracks}
                  onPlay={handlePlay}
                  currentTrackId={playerState.currentTrackId ?? ""}
                />
              }
            />
            <Route
              path="/profile"
              element={<ProfileScreen onBack={handleBack} onLogout={logout} />}
            />
            <Route
              path="/privacy"
              element={<PrivacyScreen onBack={handleBack} />}
            />
            <Route path="*" element={<Navigate to="/playlists" replace />} />
          </Routes>
        )}
      </main>

      {hasToken && (
        <NowPlayingBar
          track={currentTrack}
          isPlaying={playerState.currentTrackId !== null && !playerState.isPaused}
          position={playerState.position}
          onTogglePlay={togglePlay}
          onPrev={handlePrev}
          onNext={handleNext}
          onSeek={seek}
          volume={volume}
          onVolumeChange={setPlayerVolume}
        />
      )}
    </div>
  );
}

export default App;
