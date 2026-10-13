const SERVICE_WORKER_VERSION = "stage-0-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("message", (event) => {
  if (event.data === "GET_VERSION") {
    event.source?.postMessage({ type: "SERVICE_WORKER_VERSION", version: SERVICE_WORKER_VERSION });
  }
});
