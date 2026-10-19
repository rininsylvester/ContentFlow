"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useState that mirrors its value to sessionStorage, so form input and edits
 * survive reloads, navigation and failed generations.
 */
export function usePersistentState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(initial);
  const hydrated = useRef(false);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(key);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring client-only storage after hydration
      if (stored !== null) setValue({ ...initial, ...(JSON.parse(stored) as T) });
    } catch {
      // Storage unavailable or corrupt: keep the initial value.
    }
    hydrated.current = true;
    // `initial` is intentionally excluded: it's only the fallback for the first read.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Quota exceeded or storage disabled; the in-memory value still works.
    }
  }, [key, value]);

  const clear = useCallback(() => {
    try {
      sessionStorage.removeItem(key);
    } catch {
      // ignore
    }
  }, [key]);

  return [value, setValue, clear] as const;
}

/** Write a draft for another tool (e.g. "Write script" from an idea) before navigating. */
export function writeDraft(key: string, value: unknown) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export const DRAFT_KEYS = {
  ideas: "creatorhub:draft:ideas",
  script: "creatorhub:draft:script",
  scriptResult: "creatorhub:result:script",
} as const;
