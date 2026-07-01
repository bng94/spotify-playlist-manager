import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import type { SpotifyUser } from "../../types";
import {
  generateRandomString,
  generateCodeChallenge,
  validateSpotifyCallback,
  exchangeCodeForToken,
  SpotifyAuthError,
} from "../../lib/spotifyAuth";
import { spotifyFetch, APP_CONFIG_ERROR } from "../../lib/spotifyApi";
import { SPOTIFY_CLIENT_ID, SPOTIFY_REDIRECT_URI } from "../../lib/config";
import { useToast } from "../ToastContext/ToastContext";

type UserContextValue = {
  user: SpotifyUser | null;
  hasToken: boolean;
  callbackError: string | null;
  login: () => Promise<void>;
  logout: () => void;
  fetchUser: () => Promise<void>;
};

const UserContext = createContext<UserContextValue | null>(null);

const UserProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { pushError } = useToast();

  const [user, setUser] = useState<SpotifyUser | null>(null);
  const [hasToken, setHasToken] = useState(
    () => !!sessionStorage.getItem("spotify_access_token"),
  );
  const [callbackError, setCallbackError] = useState<string | null>(null);
  const callbackHandledRef = useRef(false);

  const login = useCallback(async () => {
    callbackHandledRef.current = false;
    setCallbackError(null);
    try {
      const state = generateRandomString(16);
      const codeVerifier = generateRandomString(64);
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      const params = new URLSearchParams({
        response_type: "code",
        client_id: SPOTIFY_CLIENT_ID,
        scope: "user-read-private user-read-email playlist-read-private playlist-modify-public playlist-modify-private streaming user-modify-playback-state user-top-read user-follow-read",
        redirect_uri: SPOTIFY_REDIRECT_URI,
        state,
        code_challenge_method: "S256",
        code_challenge: codeChallenge,
        show_dialog: "true",
      });
      sessionStorage.setItem("spotify_auth_state", state);
      sessionStorage.setItem("spotify_code_verifier", codeVerifier);
      window.location.href = `https://accounts.spotify.com/authorize?${params}`;
    } catch {
      pushError("Failed to start Spotify sign-in. Please try again.");
    }
  }, [pushError]);

  const logout = useCallback(() => {
    sessionStorage.removeItem("spotify_access_token");
    sessionStorage.removeItem("spotify_refresh_token");
    sessionStorage.removeItem("spotify_token_expires_at");
    setUser(null);
    setHasToken(false);
    navigate("/login");
  }, [navigate]);

  const fetchUser = useCallback(async () => {
    const { data, status, error } = await spotifyFetch<SpotifyUser>("/me");
    if (data) {
      setUser(data);
    } else if (status === 401) {
      logout();
    } else if (error && error !== APP_CONFIG_ERROR) {
      // APP_CONFIG_ERROR is suppressed here — SpotifyApiContext.apiFetch shows the human-readable message
      pushError(error);
    }
  }, [logout, pushError]);

  // Handle OAuth callback — runs once per actual redirect.
  // Detects either the /callback pathname (local dev) or a ?code= param at
  // root (GitHub Pages: callback/index.html redirects here with params).
  useEffect(() => {
    const hasCode = new URLSearchParams(location.search).has("code");
    if (location.pathname !== "/callback" && !hasCode) return;
    if (callbackHandledRef.current) return;
    callbackHandledRef.current = true;

    (async () => {
      try {
        const { code, codeVerifier } = validateSpotifyCallback();
        await exchangeCodeForToken(code, codeVerifier);
        setHasToken(true);
        navigate("/playlists");
      } catch (err) {
        setCallbackError(
          err instanceof SpotifyAuthError
            ? err.message
            : "Couldn't connect to Spotify. Please try again.",
        );
      }
    })();
  }, [location.pathname, location.search, navigate]);

  return (
    <UserContext value={{ user, hasToken, callbackError, login, logout, fetchUser }}>
      {children}
    </UserContext>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useUser = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
};

export default UserProvider;
