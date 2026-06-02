// Lightweight localStorage cache for per-user interaction state (saved slugs,
// liked blog ids). React Query is in-memory only, so it's lost on a hard
// refresh — this lets the Like/Save buttons show the CORRECT state INSTANTLY on
// reload, before the live revalidation fetch resolves. Keyed by userId so
// switching accounts never leaks state.
const isBrowser = () => typeof window !== "undefined";

const SAVED_KEY = (uid: string) => `bs.saved.${uid}`;
const LIKED_KEY = (uid: string) => `bs.liked.${uid}`;
const FOLLOW_KEY = (uid: string) => `bs.following.${uid}`;
const PUSH_KEY = (uid: string) => `bs.push.${uid}`;

function read(key: string): string[] | undefined {
  if (!isBrowser()) return undefined;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as string[]) : undefined;
  } catch {
    return undefined;
  }
}

function write(key: string, list: string[]): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(list));
  } catch {
    // ignore (quota / private mode)
  }
}

export const interactionCache = {
  getSavedSlugs: (uid?: string) => (uid ? read(SAVED_KEY(uid)) : undefined),
  setSavedSlugs: (uid: string | undefined, slugs: string[]) => uid && write(SAVED_KEY(uid), slugs),

  getLikedIds: (uid?: string) => (uid ? read(LIKED_KEY(uid)) : undefined),
  setLikedIds: (uid: string | undefined, ids: string[]) => uid && write(LIKED_KEY(uid), ids),

  // Target user ids the current user follows.
  getFollowingIds: (uid?: string) => (uid ? read(FOLLOW_KEY(uid)) : undefined),
  setFollowingIds: (uid: string | undefined, ids: string[]) => uid && write(FOLLOW_KEY(uid), ids),
  isFollowing: (uid: string | undefined, targetId: string) =>
    uid ? (read(FOLLOW_KEY(uid)) ?? []).includes(targetId) : undefined,
  setFollowing: (uid: string | undefined, targetId: string, following: boolean) => {
    if (!uid) return;
    const cur = read(FOLLOW_KEY(uid)) ?? [];
    const next = following ? [...new Set([...cur, targetId])] : cur.filter((id) => id !== targetId);
    write(FOLLOW_KEY(uid), next);
  },

  // Push-notification enabled state for THIS device (per user). undefined = unknown.
  getPushEnabled: (uid?: string): boolean | undefined => {
    if (!isBrowser() || !uid) return undefined;
    try {
      const raw = window.localStorage.getItem(PUSH_KEY(uid));
      return raw === null ? undefined : raw === "1";
    } catch {
      return undefined;
    }
  },
  setPushEnabled: (uid: string | undefined, enabled: boolean) => {
    if (!isBrowser() || !uid) return;
    try {
      window.localStorage.setItem(PUSH_KEY(uid), enabled ? "1" : "0");
    } catch {
      // ignore
    }
  },
};
