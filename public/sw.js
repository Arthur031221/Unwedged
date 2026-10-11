const VERSION = "__UNWEDGED_BUILD__";
const base = new URL("./", self.location.href);
const PREFIX = `unwedged:${base.pathname}:`;
const CACHE = `${PREFIX}${VERSION}`;
const local = (url) =>
  url.origin === base.origin && url.pathname.startsWith(base.pathname);

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const response = await fetch(new URL("offline-assets.json", base), {
        cache: "no-store",
      });
      if (!response.ok) throw new Error("Offline manifest is unavailable");
      const paths = await response.json();
      if (
        !Array.isArray(paths) ||
        paths.some(
          (path) => typeof path !== "string" || !local(new URL(path, base)),
        )
      )
        throw new Error("Invalid offline manifest");
      const cache = await caches.open(CACHE);
      try {
        await cache.addAll(paths.map((path) => new URL(path, base).href));
      } catch (error) {
        await caches.delete(CACHE);
        throw error;
      }
    })(),
  );
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys())
        if (name.startsWith(PREFIX) && name !== CACHE)
          await caches.delete(name);
      await self.clients.claim();
    })(),
  );
});
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || !local(url)) return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(event.request);
      if (cached) return cached;
      try {
        return await fetch(event.request);
      } catch {
        if (event.request.mode === "navigate")
          return (await cache.match(base.href)) ?? Response.error();
        return Response.error();
      }
    })(),
  );
});
