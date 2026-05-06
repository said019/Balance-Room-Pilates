import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);

// Service worker registration:
// - Caches static hashed assets so the app loads fast and works briefly offline.
// - Never caches /api/* so reservas and clases siempre vienen frescas del backend.
// - Auto-reloads the open tab when a new version of the SW takes over so users
//   never see stale UI after a deploy.
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        // Periodic update check (every 5 min while the tab is open)
        setInterval(() => reg.update().catch(() => {}), 5 * 60 * 1000);

        const handleNew = (newSW: ServiceWorker | null) => {
          if (!newSW) return;
          newSW.addEventListener('statechange', () => {
            if (
              newSW.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              // A new SW is waiting — tell it to take over right away
              newSW.postMessage({ type: 'SKIP_WAITING' });
            }
          });
        };

        if (reg.waiting) handleNew(reg.waiting);
        reg.addEventListener('updatefound', () => handleNew(reg.installing));
      })
      .catch(() => {
        // Silent fail — SW is best-effort, app still works without it.
      });

    let reloading = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (reloading) return;
      reloading = true;
      window.location.reload();
    });
  });
}
