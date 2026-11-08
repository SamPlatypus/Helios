/** Registers the offline worker in production builds only.
 *  Dev preview stays network-live so edits are not stuck behind a cache. */
export function registerOfflineWorker() {
  if (!import.meta.env.PROD) return;
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* install is optional; the scene itself never needs a network */
    });
  });
}
