/* Custom service worker: precache + push notifications. Built with Vite PWA injectManifest. */
import { precacheAndRoute, createHandlerBoundToURL } from "workbox-precaching";
import { skipWaiting, clientsClaim } from "workbox-core";
import { registerRoute, NavigationRoute } from "workbox-routing";

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision?: string | null }>;
};

skipWaiting();
clientsClaim();

precacheAndRoute(self.__WB_MANIFEST);

registerRoute(
  new NavigationRoute(createHandlerBoundToURL("/index.html"), {
    denylist: [/^\/api/, /\.(?:json|txt)$/],
  })
);

self.addEventListener("push", (event: PushEvent) => {
  const data = event.data?.json?.() ?? {};
  const title = (data.title as string) ?? "Shyftcut";
  const options: NotificationOptions = {
    body: (data.body as string) ?? "Don't break your streak — study today!",
    icon: (data.icon as string) ?? "/pwa.png",
  };
  event.waitUntil(self.registration.showNotification(title, options));
});
