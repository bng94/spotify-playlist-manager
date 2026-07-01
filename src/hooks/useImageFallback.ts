import { useEffect, useState } from "react";

// Shared by any component that shows an <img> with a fallback element when
// the image fails to load. `resetKey` (e.g. the image URL or an item id)
// clears a stale failure once the thing being displayed changes.
export function useImageFallback(resetKey?: string | null) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [resetKey]);

  return { failed, onError: () => setFailed(true) };
}
