
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { pushNotifications } from "./utils/pushNotifications";
import "./index.css";

// Add error handler for unhandled errors
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Register service worker for better cache management
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('SW registered:', registration);
        
        // Check for updates every 60 seconds
        setInterval(() => {
          registration.update();
        }, 60000);
        
        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New version available, prompt user to refresh
                if (confirm('New version available! Refresh to update?')) {
                  window.location.reload();
                }
              }
            });
          }
        });

        // Initialize PWA features after service worker is ready
        navigator.serviceWorker.ready.then(() => {
          // PWA features ready: Push notifications and background sync available
          console.log('PWA features ready');
          
          // Register periodic background sync (if supported)
          if ('periodicSync' in registration) {
            registration.periodicSync.register('sync-data', {
              minInterval: 24 * 60 * 60 * 1000, // 24 hours
            }).then(() => {
              console.log('Periodic background sync registered');
            }).catch((err: Error) => {
              console.log('Periodic sync registration failed:', err);
            });
          }
          
          // Initialize push notifications (don't auto-subscribe, let user decide)
          if (pushNotifications.isSupported()) {
            console.log('Push notifications supported');
          }
        });
      })
      .catch((err) => {
        console.log('SW registration failed:', err);
      });
  });
}

const rootElement = document.getElementById("root");

if (!rootElement) {
  document.body.innerHTML = '<div style="padding: 20px; text-align: center;"><h1>Error: Root element not found</h1></div>';
} else {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>
  );
}
  