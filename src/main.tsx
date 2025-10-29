import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { I18nextProvider } from "react-i18next";

import App from "./App.tsx";
import "./index.css";
import i18n from "./i18n/config";
import { log } from "./lib/logger";
import "./lib/performance";

// Import parallax effects
import "./scripts/parallax.js";

// Initialize monitoring services
if (import.meta.env.PROD) {
  // Initialize Sentry error tracking
  import("./lib/sentry").then(({ initSentry }) => {
    initSentry();
    log.info('Sentry monitoring initialized');
  }).catch((error) => {
    log.warn('Failed to initialize Sentry:', error);
  });

  // Initialize health check monitoring
  import("./lib/health-check").then(({ startHealthMonitoring }) => {
    startHealthMonitoring();
    log.info('Health monitoring started');
  }).catch((error) => {
    log.warn('Failed to start health monitoring:', error);
  });

  // Initialize alerting service
  import("./lib/alerting").then(({ startAlerting }) => {
    startAlerting();
    log.info('Alerting service started');
  }).catch((error) => {
    log.warn('Failed to start alerting service:', error);
  });

  // Initialize real-time monitoring
  import("./services/realtimeMonitoringService").then(({ connectRealtimeMonitoring }) => {
    connectRealtimeMonitoring().catch((error) => {
      log.warn('Failed to connect real-time monitoring:', error);
    });
  });

  // Initialize production monitoring
  import("./lib/monitoring").then(({ initializeMonitoring }) => {
    initializeMonitoring();
    log.info('Production monitoring initialized');
  }).catch((error) => {
    log.warn('Failed to initialize production monitoring:', error);
  });

  // Initialize PWA features
  import("./lib/push/notificationManager").then(({ initializePushNotifications }) => {
    initializePushNotifications().then(() => {
      log.info('Push notifications initialized');
    }).catch((error) => {
      log.warn('Failed to initialize push notifications:', error);
    });
  });
}

// Register service worker for offline support and caching
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        log.info('ServiceWorker registered:', { scope: registration.scope });
        
        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000); // Check every hour
      })
      .catch((error) => {
        log.error('ServiceWorker registration failed:', error);
      });
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <App />
    </I18nextProvider>
  </StrictMode>
);
