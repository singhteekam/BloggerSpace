// Firebase Cloud Messaging — web push client helper.
// All values are public-by-design Firebase web config (safe to expose via NEXT_PUBLIC_*).
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getMessaging,
  getToken,
  onMessage,
  isSupported,
  type Messaging,
} from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};
const VAPID_KEY = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

/** True only when all required config is present — lets the UI hide push features cleanly. */
export function isPushConfigured(): boolean {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.projectId &&
      firebaseConfig.messagingSenderId &&
      firebaseConfig.appId &&
      VAPID_KEY,
  );
}

let app: FirebaseApp | null = null;
function getFirebaseApp(): FirebaseApp {
  if (!app) app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  return app;
}

let messagingPromise: Promise<Messaging | null> | null = null;
async function getMessagingInstance(): Promise<Messaging | null> {
  if (typeof window === "undefined" || !isPushConfigured()) return null;
  if (!messagingPromise) {
    messagingPromise = (async () => {
      if (!(await isSupported())) return null;
      return getMessaging(getFirebaseApp());
    })();
  }
  return messagingPromise;
}

/** Registers the FCM service worker (must live at the site root scope). */
async function registerServiceWorker(): Promise<ServiceWorkerRegistration | undefined> {
  if (!("serviceWorker" in navigator)) return undefined;
  return navigator.serviceWorker.register("/firebase-messaging-sw.js");
}

/**
 * Prompts for notification permission (if needed) and returns the FCM token.
 * Returns null when push is unsupported, unconfigured, or permission is denied.
 */
export async function requestPushToken(): Promise<string | null> {
  const messaging = await getMessagingInstance();
  if (!messaging) return null;

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return null;

  const swReg = await registerServiceWorker();
  try {
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swReg,
    });
    return token || null;
  } catch {
    return null;
  }
}

/** Foreground message handler — shows a toast when a push arrives while the tab is open. */
export async function onForegroundMessage(cb: (title: string, body: string, link?: string) => void) {
  const messaging = await getMessagingInstance();
  if (!messaging) return () => {};
  return onMessage(messaging, (payload) => {
    const title = payload.notification?.title ?? "BloggerSpace";
    const body = payload.notification?.body ?? "";
    const link = (payload.data?.link as string | undefined) ?? undefined;
    cb(title, body, link);
  });
}
