import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import { spotifyFetch, APP_CONFIG_ERROR } from "../../lib/spotifyApi";
import { useToast } from "../ToastContext/ToastContext";
import { useUser } from "../UserContext/UserContext";

interface SpotifyApiContextValue {
  apiFetch: <T>(path: string) => Promise<T | null>;
  appConfigError: boolean;
}

const SpotifyApiContext = createContext<SpotifyApiContextValue | null>(null);

const SpotifyApiProvider = ({ children }: { children: ReactNode }) => {
  const { pushError } = useToast();
  const { logout } = useUser();
  const [appConfigError, setAppConfigError] = useState(false);

  const apiFetch = useCallback(
    async (path: string) => {
      const { status, data, error } = await spotifyFetch(path);
      if (!error) return data;
      if (status === 401) {
        pushError("Spotify session expired. Please log in again.");
        logout();
      } else if (error === APP_CONFIG_ERROR) {
        pushError(
          "Configuration Error. App Developer need active Premium subscription.",
        );
        setAppConfigError(true);
      } else {
        pushError(error);
      }
      return null;
    },
    [pushError, logout],
  ) as <T>(path: string) => Promise<T | null>;

  const value = useMemo(
    () => ({ apiFetch, appConfigError }),
    [apiFetch, appConfigError],
  );

  return (
    <SpotifyApiContext.Provider value={value}>
      {children}
    </SpotifyApiContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useSpotifyApi = () => {
  const ctx = useContext(SpotifyApiContext);
  if (!ctx)
    throw new Error("useSpotifyApi must be used within SpotifyApiProvider");
  return ctx;
};

export default SpotifyApiProvider;
