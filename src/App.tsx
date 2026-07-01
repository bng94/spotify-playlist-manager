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
  SpotifyPage,
  SpotifyTrack,
} from "./types";
import {
  createPlaylistOnSpotify,
  unfollowPlaylist,
  updatePlaylistDetails,
  getPlaylistWithTracks,
  spotifyFetch,
  APP_CONFIG_ERROR,
  PLAYLIST_TRACKS_FORBIDDEN,
} from "./lib/spotifyApi";
import type { SpotifyResponse } from "./lib/spotifyApi";
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
  currentIndex,
  isPaused,
}: {
  playlists: Playlist[];
  loadingPlaylists: boolean;
  onBack: () => void;
  onRename: (id: string, name: string) => void;
  onTracksLoad: (tracks: SpotifyTrack[]) => void;
  onPlay: (index: number) => void;
  currentTrackId: string;
  currentIndex: number | undefined;
  isPaused: boolean;
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
  const [tracksForbidden, setTracksForbidden] = useState(false);

  // Keep nowPlayingTracks in sync with all accumulated playlist items
  useEffect(() => {
    onTracksLoad(
      playlistItems
        .map((pi) => pi.item)
        .filter((t): t is SpotifyTrack => t != null),
    );
  }, [playlistItems, onTracksLoad]);

  const applyPage = useCallback(
    (page: SpotifyPage<PlaylistItem>, append: boolean) => {
      const newItems = page.items ?? [];
      setPlaylistItems((prev) => (append ? [...prev, ...newItems] : newItems));
      setNextUrl(page.next);
      setTotalTracks(page.total);
    },
    [],
  );

  // Fetch first page whenever the playlist id is ready
  useEffect(() => {
    if (loadingPlaylists || !id || !playlistId) return;
    setPlaylistItems([]);
    setNextUrl(null);
    setLoadMoreError(false);
    setTracksForbidden(false);
    setLoadingItems(true);
    getPlaylistWithTracks(id).then((result) => {
      setLoadingItems(false);
      if (result.error === PLAYLIST_TRACKS_FORBIDDEN) {
        setTracksForbidden(true);
      } else if (result.data?.items) {
        applyPage(result.data.items, false);
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
    const result = await spotifyFetch<SpotifyPage<PlaylistItem>>(path);
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
      currentIndex={currentIndex}
      isPaused={isPaused}
      totalTracks={totalTracks}
      hasMore={nextUrl !== null}
      loadingMore={loadingMore}
      loadMoreError={loadMoreError}
      onLoadMore={loadMore}
      tracksForbidden={tracksForbidden}
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
  const [selectedTrack, setSelectedTrack] = useState<SpotifyTrack | undefined>(
    undefined,
  );
  const [selectedPlaylistName, setSelectedPlaylistName] = useState<
    string | undefined
  >(undefined);
  const [currentIndex, setCurrentIndex] = useState<number | undefined>(
    undefined,
  );
  const [playbackActionError, setPlaybackActionError] = useState(false);
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
  const {
    deviceId,
    playerState,
    playbackError,
    seek,
    togglePlay,
    volume,
    setPlayerVolume,
  } = useSpotifyPlayer(hasToken, pushApiError);

  // Reset data-fetch guard whenever the session ends so re-login re-fetches
  useEffect(() => {
    if (!hasToken) sessionFetchedRef.current = false;
  }, [hasToken]);

  const fetchPlaylists = useCallback(
    async (offset = 0) => {
      setLoadingPlaylists(true);
      const data = await apiFetch<SpotifyPage<Playlist>>(
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
  // The SDK's live state always wins once it has reported anything; the
  // optimistic click-time guess only fills the gap before the first
  // player_state_changed event arrives (or if the SDK never connects).
  const nowPlayingTrack = playerState.currentTrack ?? selectedTrack;
  const isPlaying = nowPlayingTrack !== undefined && !playerState.isPaused;

  // Playlist context isn't reliably exposed by the SDK, so capture it from
  // whichever playlist page is open at the moment a fresh play starts —
  // stable afterward since Next/Previous stay within that same context.
  const openPlaylistId = location.pathname.match(/^\/playlists\/([^/]+)/)?.[1];
  const openPlaylistName = openPlaylistId
    ? playlists.find((p) => p.id === openPlaylistId)?.name
    : undefined;

  // Clear the bar when the user logs out
  useEffect(() => {
    if (!hasToken) {
      setSelectedTrack(undefined);
      setSelectedPlaylistName(undefined);
      setCurrentIndex(undefined);
    }
  }, [hasToken]);

  // Natural end-of-track advance (or an external Next/Prev) isn't driven by
  // our own handlers, so currentIndex would otherwise go stale — this only
  // reacts when the SDK reports a genuinely different track (not on every
  // render), so it doesn't fight the optimistic index set by handlePlay
  // before the SDK has caught up. If the live track can't be found at all
  // (shuffle/autoplay picked something outside the currently loaded page,
  // or a different device took over), clear the highlight rather than
  // leaving a stale, now-wrong row marked current.
  //
  // Matched by name+artist rather than id: Spotify's track relinking can
  // report a different id for the same song (regionally-equivalent
  // substitute), so comparing ids between the Web API list and the SDK's
  // live track is unreliable — the name/artist stay the same either way.
  useEffect(() => {
    const liveTrack = playerState.currentTrack;
    if (!liveTrack) return;
    const keyOf = (t: { name: string; artists: { name: string }[] } | undefined) =>
      t && `${t.name}::${t.artists[0]?.name ?? ""}`;
    const liveKey = keyOf(liveTrack);
    setCurrentIndex((prevIndex) => {
      if (prevIndex === undefined) return prevIndex;
      if (keyOf(nowPlayingTracks[prevIndex]) === liveKey) return prevIndex;
      if (keyOf(nowPlayingTracks[prevIndex + 1]) === liveKey) return prevIndex + 1;
      if (keyOf(nowPlayingTracks[prevIndex - 1]) === liveKey) return prevIndex - 1;
      const found = nowPlayingTracks.findIndex((t) => keyOf(t) === liveKey);
      return found === -1 ? undefined : found;
    });
  }, [playerState.currentTrack, nowPlayingTracks]);

  const runPlaybackAction = async (
    action: (deviceId: string) => Promise<SpotifyResponse<null>>,
  ) => {
    if (!deviceId) return;
    setPlaybackActionError(false);
    const result = await action(deviceId);
    if (result.error) {
      pushApiError(result.error);
      setPlaybackActionError(true);
    }
  };

  const handlePlay = (index: number) => {
    setSelectedTrack(nowPlayingTracks[index]); // always update the bar immediately
    setSelectedPlaylistName(openPlaylistName);
    if (index === currentIndex) {
      setPlaybackActionError(false);
      togglePlay(); // already loaded in the bar — pause/resume instead of restarting
      return;
    }
    setCurrentIndex(index);
    const uris = nowPlayingTracks.map((t) => t.uri);
    return runPlaybackAction((deviceId) => playbackPlay(deviceId, uris, index));
  };

  const handleNext = () => {
    setCurrentIndex((i) =>
      i === undefined ? i : Math.min(i + 1, nowPlayingTracks.length - 1),
    );
    return runPlaybackAction(playbackNext);
  };
  const handlePrev = () => {
    setCurrentIndex((i) => (i === undefined ? i : Math.max(i - 1, 0)));
    return runPlaybackAction(playbackPrev);
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
                  currentTrackId={nowPlayingTrack?.id ?? ""}
                  currentIndex={currentIndex}
                  isPaused={playerState.isPaused}
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
          track={nowPlayingTrack}
          playlistName={selectedPlaylistName}
          isPlaying={isPlaying}
          position={playerState.position}
          hasError={playbackError || playbackActionError}
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
