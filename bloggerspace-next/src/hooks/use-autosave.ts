import { useEffect, useRef, useState } from "react";

export type AutoSaveStatus = "idle" | "saving" | "saved" | "error";

/**
 * Polls every `intervalMs` (default 30 s). If `watchValues` has changed since
 * the last save, calls `saveFn` silently. Returns status + last-saved timestamp.
 *
 * Pass a `canSave` flag to gate saves (e.g. require title to be non-empty).
 */
export function useAutoSave(
  saveFn: () => Promise<void>,
  watchValues: unknown,
  options?: { intervalMs?: number; canSave?: boolean },
) {
  const { intervalMs = 30_000, canSave = true } = options ?? {};

  const [status, setStatus] = useState<AutoSaveStatus>("idle");
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const lastSavedRef = useRef("");
  const saveFnRef = useRef(saveFn);
  const watchRef = useRef(watchValues);
  const canSaveRef = useRef(canSave);

  saveFnRef.current = saveFn;
  watchRef.current = watchValues;
  canSaveRef.current = canSave;

  useEffect(() => {
    const id = setInterval(async () => {
      if (!canSaveRef.current) return;
      const current = JSON.stringify(watchRef.current);
      if (current === lastSavedRef.current) return;
      lastSavedRef.current = current;
      setStatus("saving");
      try {
        await saveFnRef.current();
        setStatus("saved");
        setLastSavedAt(new Date());
      } catch {
        setStatus("error");
      }
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return { autoSaveStatus: status, lastSavedAt };
}
