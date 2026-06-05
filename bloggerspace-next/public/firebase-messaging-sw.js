/* Firebase Cloud Messaging service worker — handles background push notifications.
 *
 * ⚠️ FILL IN your Firebase web config below. These values are PUBLIC by design
 * (same ones used on the client) — safe to commit. Get them from:
 *   Firebase Console → Project settings → General → Your apps → Web app → SDK config.
 * Keep the firebase version here in sync with the "firebase" package version.
 */
importScripts("https://www.gstatic.com/firebasejs/11.10.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/11.10.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyA6ZRP5k2mgEah-lX7IGXa8Nv7ZEojjKGQ",
  authDomain: "bloggerspace-backend.firebaseapp.com",
  projectId: "bloggerspace-backend",
  messagingSenderId: "912753062780",
  appId: "1:912753062780:web:28646802d691982b3b6af9"
});

const messaging = firebase.messaging();

// Shown when a push arrives while the site is closed / in the background.
//
// The backend sends DATA-ONLY messages (no `notification` block) so the browser does
// NOT auto-display anything — this handler renders the single notification. (A
// `notification` block would be auto-shown AND fire this handler → two notifications.)
// `tag` + `renotify` collapse any same-type pushes into one entry as a safety net.
messaging.onBackgroundMessage((payload) => {
  const d = payload.data || {};
  const title = d.title || "BloggerSpace";
  const body = d.body || "";
  const link = d.link || "/";
  self.registration.showNotification(title, {
    body,
    icon: "/brand/logo128x128.png",
    badge: "/brand/logo128x128.png",
    data: { link },
    tag: d.type || "bloggerspace",
    renotify: true,
  });
});

// Clicking the notification focuses an existing tab or opens the deep link.
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || "/";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((wins) => {
      for (const win of wins) {
        if (win.url === link && "focus" in win) return win.focus();
      }
      return clients.openWindow(link);
    }),
  );
});
