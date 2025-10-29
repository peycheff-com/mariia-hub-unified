const CACHE_VERSION = '5.0'; // Updated for performance optimizations
const CACHE_NAME = `mariia-beauty-v${CACHE_VERSION}`;
const STATIC_CACHE = `static-v${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-v${CACHE_VERSION}`;
const IMAGE_CACHE = `images-v${CACHE_VERSION}`;
const API_CACHE = `api-v${CACHE_VERSION}`;
const BACKGROUND_SYNC_CACHE = `bg-sync-v${CACHE_VERSION}`;

// Cache TTLs (in milliseconds) - Optimized for performance
const CACHE_TTL = {
  STATIC: 7 * 24 * 60 * 60 * 1000, // 7 days
  IMAGES: 30 * 24 * 60 * 60 * 1000, // 30 days
  API: 5 * 60 * 1000, // 5 minutes
  DYNAMIC: 24 * 60 * 60 * 1000, // 24 hours
  CRITICAL_API: 2 * 60 * 1000, // 2 minutes for critical APIs
};

// Cache size limits - Increased for better performance
const CACHE_LIMITS = {
  STATIC: 100, // entries (increased)
  IMAGES: 200, // entries (increased)
  API: 100, // entries (increased)
  DYNAMIC: 200, // entries (increased)
  BACKGROUND_SYNC: 50, // entries for offline actions
};

// Background sync tags
const SYNC_TAGS = {
  BOOKING_CREATE: 'booking-create',
  BOOKING_UPDATE: 'booking-update',
  BOOKING_CANCEL: 'booking-cancel',
  AVAILABILITY_CHECK: 'availability-check',
  ANALYTICS_EVENT: 'analytics-event',
  FEEDBACK_SUBMIT: 'feedback-submit',
};

// Push notification types
const NOTIFICATION_TYPES = {
  BOOKING_REMINDER: 'booking-reminder',
  BOOKING_CONFIRMATION: 'booking-confirmation',
  AVAILABILITY_ALERT: 'availability-alert',
  PROMOTION: 'promotion',
  SYSTEM_UPDATE: 'system-update',
};

// Critical assets to cache immediately
const CRITICAL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png',
  // Critical booking pages
  '/booking',
  '/beauty',
  '/fitness',
  '/dashboard',
  // Static assets
  '/assets',
];

// Patterns for different content types
const URL_PATTERNS = {
  API: /^\/api\//,
  SUPABASE: /supabase\.co/,
  BOOKING: /\/booking|\/beauty|\/fitness|dashboard/,
  IMAGE: /\.(jpg|jpeg|png|gif|webp|avif|svg)$/i,
  FONT: /\.(woff|woff2|ttf|eot)$/i,
  STATIC: /\.(js|css|ico)$/i,
};

// Cache management utilities
class CacheManager {
  static async putWithTimestamp(cacheName, request, response) {
    const cache = await caches.open(cacheName);
    const responseWithTimestamp = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: {
        ...response.headers,
        'sw-cached-at': Date.now().toString(),
      },
    });
    return cache.put(request, responseWithTimestamp);
  }

  static async isValid(cacheName, request, ttl) {
    const cache = await caches.open(cacheName);
    const response = await cache.match(request);

    if (!response) return false;

    const cachedAt = response.headers.get('sw-cached-at');
    if (!cachedAt) return true; // Backward compatibility

    return Date.now() - parseInt(cachedAt) < ttl;
  }

  static async cleanup(cacheName, limit) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();

    if (keys.length <= limit) return;

    // Sort by last modified (using our timestamp header)
    const sorted = await Promise.all(
      keys.map(async (key) => {
        const response = await cache.match(key);
        const timestamp = response?.headers.get('sw-cached-at') || '0';
        return { key, timestamp: parseInt(timestamp) };
      })
    );

    sorted.sort((a, b) => a.timestamp - b.timestamp);

    // Delete oldest entries
    const toDelete = sorted.slice(0, keys.length - limit);
    await Promise.all(toDelete.map(({ key }) => cache.delete(key)));
  }

  static async clearOldVersions() {
    const cacheNames = await caches.keys();
    const oldCaches = cacheNames.filter(name =>
      name.includes('mariia-beauty-') && !name.includes(`v${CACHE_VERSION}`)
    );

    await Promise.all(oldCaches.map(name => caches.delete(name)));
  }
}

// Install event - cache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const cache = await caches.open(STATIC_CACHE);
        await cache.addAll(CRITICAL_ASSETS);

        // Pre-cache essential fonts and styles
        const fontCache = await caches.open(DYNAMIC_CACHE);
        // Add critical fonts/styles here if needed

        console.log(`Service Worker v${CACHE_VERSION} installed successfully`);
      } catch (err) {
        console.warn('Failed to cache some assets:', err);
      }
    })()
  );

  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Clear old cache versions
      await CacheManager.clearOldVersions();

      // Clean up oversized caches
      await Promise.all([
        CacheManager.cleanup(STATIC_CACHE, CACHE_LIMITS.STATIC),
        CacheManager.cleanup(IMAGE_CACHE, CACHE_LIMITS.IMAGES),
        CacheManager.cleanup(API_CACHE, CACHE_LIMITS.API),
        CacheManager.cleanup(DYNAMIC_CACHE, CACHE_LIMITS.DYNAMIC),
      ]);

      // Take control of all open pages
      self.clients.claim();

      console.log(`Service Worker v${CACHE_VERSION} activated`);
    })()
  );
});

// Network strategies
class NetworkStrategies {
  static async staleWhileRevalidate(request, cacheName, ttl) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    // Return cached version immediately if valid
    if (cachedResponse && await CacheManager.isValid(cacheName, request, ttl)) {
      // Fetch in background and update cache
      fetch(request).then(async (response) => {
        if (response.ok) {
          await CacheManager.putWithTimestamp(cacheName, request, response);
          await CacheManager.cleanup(cacheName, CACHE_LIMITS[cacheName.split('-')[0].toUpperCase()]);
        }
      }).catch(() => {}); // Ignore background fetch errors

      return cachedResponse;
    }

    // No valid cache, fetch from network
    try {
      const networkResponse = await fetch(request);

      if (networkResponse.ok) {
        await CacheManager.putWithTimestamp(cacheName, request, networkResponse);
        await CacheManager.cleanup(cacheName, CACHE_LIMITS[cacheName.split('-')[0].toUpperCase()]);
      }

      return networkResponse;
    } catch (error) {
      // Network failed, return stale cache if available
      if (cachedResponse) {
        return cachedResponse;
      }

      throw error;
    }
  }

  static async networkFirst(request, cacheName, ttl) {
    try {
      const networkResponse = await fetch(request);

      if (networkResponse.ok) {
        const cache = await caches.open(cacheName);
        await CacheManager.putWithTimestamp(cacheName, request, networkResponse);
        await CacheManager.cleanup(cacheName, CACHE_LIMITS[cacheName.split('-')[0].toUpperCase()]);
      }

      return networkResponse;
    } catch (error) {
      const cache = await caches.open(cacheName);
      const cachedResponse = await cache.match(request);

      if (cachedResponse && await CacheManager.isValid(cacheName, request, ttl)) {
        return cachedResponse;
      }

      throw error;
    }
  }

  static async cacheFirst(request, cacheName, ttl) {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse && await CacheManager.isValid(cacheName, request, ttl)) {
      return cachedResponse;
    }

    try {
      const networkResponse = await fetch(request);

      if (networkResponse.ok) {
        await CacheManager.putWithTimestamp(cacheName, request, networkResponse);
        await CacheManager.cleanup(cacheName, CACHE_LIMITS[cacheName.split('-')[0].toUpperCase()]);
      }

      return networkResponse;
    } catch (error) {
      if (cachedResponse) {
        return cachedResponse; // Return stale cache if network fails
      }

      throw error;
    }
  }
}

// Background sync for failed requests
const SYNC_QUEUE = 'sync-queue';

self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(processSyncQueue());
  }
});

async function processSyncQueue() {
  const cache = await caches.open(DYNAMIC_CACHE);
  const queue = await cache.match(SYNC_QUEUE);

  if (!queue) return;

  const requests = await queue.json();
  const successful = [];
  const failed = [];

  for (const req of requests) {
    try {
      const response = await fetch(req.request);
      if (response.ok) {
        successful.push(req);
        // Retry caching the successful response
        const cacheName = getCacheNameForRequest(req.request);
        if (cacheName) {
          await CacheManager.putWithTimestamp(cacheName, req.request, response);
        }
      } else {
        failed.push(req);
      }
    } catch (error) {
      failed.push(req);
    }
  }

  // Update queue with only failed requests
  await cache.put(SYNC_QUEUE, new Response(JSON.stringify(failed)));

  if (failed.length > 0) {
    console.log(`${failed.length} requests still failed after background sync`);
  }
}

// Determine cache name based on request
function getCacheNameForRequest(request) {
  const url = new URL(request.url);

  if (request.destination === 'image' || URL_PATTERNS.IMAGE.test(url.pathname)) {
    return IMAGE_CACHE;
  }

  if (URL_PATTERNS.API.test(url.pathname) || URL_PATTERNS.SUPABASE.test(url.href)) {
    return API_CACHE;
  }

  if (URL_PATTERNS.FONT.test(url.pathname) || URL_PATTERNS.STATIC.test(url.pathname)) {
    return STATIC_CACHE;
  }

  return DYNAMIC_CACHE;
}

// Main fetch event handler
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle POST requests for booking actions when offline
  if (request.method === 'POST' && !navigator.onLine) {
    if (URL_PATTERNS.API.test(url.pathname) || URL_PATTERNS.BOOKING.test(url.pathname)) {
      event.respondWith(handleOfflinePost(request));
      return;
    }
  }

  // Skip non-GET requests and cross-origin requests (except for our APIs)
  if (request.method !== 'GET' || (url.origin !== location.origin && !URL_PATTERNS.SUPABASE.test(url.href))) {
    return;
  }

  // Skip Chrome extensions and dev tools
  if (url.protocol === 'chrome-extension:' || url.protocol === 'moz-extension:') {
    return;
  }

  // Route to appropriate strategy
  if (request.mode === 'navigate') {
    // Navigation requests - network first with HTML cache fallback
    event.respondWith(NetworkStrategies.networkFirst(request, STATIC_CACHE, CACHE_TTL.STATIC));
    return;
  }

  // API requests - network first with short cache
  if (URL_PATTERNS.API.test(url.pathname) || URL_PATTERNS.SUPABASE.test(url.href)) {
    event.respondWith(NetworkStrategies.networkFirst(request, API_CACHE, CACHE_TTL.API));
    return;
  }

  // Booking pages - cache first for offline access
  if (URL_PATTERNS.BOOKING.test(url.pathname)) {
    event.respondWith(NetworkStrategies.cacheFirst(request, DYNAMIC_CACHE, CACHE_TTL.DYNAMIC));
    return;
  }

  // Images - cache first with long TTL
  if (request.destination === 'image' || URL_PATTERNS.IMAGE.test(url.pathname)) {
    event.respondWith(NetworkStrategies.cacheFirst(request, IMAGE_CACHE, CACHE_TTL.IMAGES));
    return;
  }

  // Fonts and static assets - stale while revalidate
  if (URL_PATTERNS.FONT.test(url.pathname) || URL_PATTERNS.STATIC.test(url.pathname)) {
    event.respondWith(NetworkStrategies.staleWhileRevalidate(request, STATIC_CACHE, CACHE_TTL.STATIC));
    return;
  }

  // Everything else - stale while revalidate
  event.respondWith(NetworkStrategies.staleWhileRevalidate(request, DYNAMIC_CACHE, CACHE_TTL.DYNAMIC));
});

// Handle POST requests when offline
async function handleOfflinePost(request) {
  try {
    const clonedRequest = request.clone();
    const body = await clonedRequest.json();

    // Store the request for later sync
    const cache = await caches.open(DYNAMIC_CACHE);
    const queue = await cache.match(SYNC_QUEUE);
    const currentQueue = queue ? await queue.json() : [];

    currentQueue.push({
      request: {
        url: request.url,
        method: request.method,
        headers: Object.fromEntries(request.headers.entries()),
        body: body,
      },
      timestamp: Date.now(),
    });

    await cache.put(SYNC_QUEUE, new Response(JSON.stringify(currentQueue)));

    // Return a success response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Action queued for sync when online',
        queued: true
      }),
      {
        status: 202,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to queue action',
        error: error.message
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Push notification handling (if needed)
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const options = event.data.json();

  event.waitUntil(
    self.registration.showNotification(options.title, {
      body: options.body,
      icon: '/logo.png',
      badge: '/badge.png',
      tag: options.tag,
      data: options.data,
      actions: options.actions,
    })
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.notification.data && event.notification.data.url) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url)
    );
  }
});

// Periodic background sync for cache cleanup
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'cache-cleanup') {
    event.waitUntil(
      Promise.all([
        CacheManager.cleanup(IMAGE_CACHE, CACHE_LIMITS.IMAGES),
        CacheManager.cleanup(API_CACHE, CACHE_LIMITS.API),
        CacheManager.cleanup(DYNAMIC_CACHE, CACHE_LIMITS.DYNAMIC),
        CacheManager.cleanup(STATIC_CACHE, CACHE_LIMITS.STATIC),
      ])
    );
  }
});

// Message handling for cache management
self.addEventListener('message', (event) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'CACHE_CLEAR':
      event.waitUntil(
        Promise.all([
          caches.delete(STATIC_CACHE),
          caches.delete(DYNAMIC_CACHE),
          caches.delete(IMAGE_CACHE),
          caches.delete(API_CACHE),
        ])
      );
      break;

    case 'CACHE_PRELOAD':
      event.waitUntil(
        preloadResources(payload.urls || [])
      );
      break;

    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_VERSION });
      break;
  }
});

async function preloadResources(urls) {
  const cache = await caches.open(DYNAMIC_CACHE);

  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await CacheManager.putWithTimestamp(DYNAMIC_CACHE, new Request(url), response);
      }
    } catch (error) {
      console.warn(`Failed to preload ${url}:`, error);
    }
  }
}

// Background Sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);

  if (event.tag === SYNC_TAGS.BOOKING_CREATE) {
    event.waitUntil(syncBookingCreate());
  } else if (event.tag === SYNC_TAGS.BOOKING_UPDATE) {
    event.waitUntil(syncBookingUpdate());
  } else if (event.tag === SYNC_TAGS.BOOKING_CANCEL) {
    event.waitUntil(syncBookingCancel());
  } else if (event.tag === SYNC_TAGS.AVAILABILITY_CHECK) {
    event.waitUntil(syncAvailabilityCheck());
  } else if (event.tag === SYNC_TAGS.ANALYTICS_EVENT) {
    event.waitUntil(syncAnalyticsEvents());
  } else if (event.tag === SYNC_TAGS.FEEDBACK_SUBMIT) {
    event.waitUntil(syncFeedbackSubmit());
  }
});

// Background sync functions
async function syncBookingCreate() {
  try {
    const cache = await caches.open(BACKGROUND_SYNC_CACHE);
    const requests = await cache.keys();

    for (const request of requests) {
      if (request.url.includes('booking-create')) {
        const response = await cache.match(request);
        const bookingData = await response?.json();

        if (bookingData) {
          try {
            const syncResponse = await fetch('/api/bookings', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(bookingData),
            });

            if (syncResponse.ok) {
              await cache.delete(request);

              // Notify client of successful sync
              notifyClients({
                type: 'BOOKING_SYNC_SUCCESS',
                payload: { bookingId: bookingData.id }
              });
            }
          } catch (error) {
            console.error('Failed to sync booking creation:', error);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in syncBookingCreate:', error);
  }
}

async function syncBookingUpdate() {
  try {
    const cache = await caches.open(BACKGROUND_SYNC_CACHE);
    const requests = await cache.keys();

    for (const request of requests) {
      if (request.url.includes('booking-update')) {
        const response = await cache.match(request);
        const updateData = await response?.json();

        if (updateData) {
          try {
            const syncResponse = await fetch(`/api/bookings/${updateData.id}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(updateData),
            });

            if (syncResponse.ok) {
              await cache.delete(request);

              notifyClients({
                type: 'BOOKING_UPDATE_SYNC_SUCCESS',
                payload: { bookingId: updateData.id }
              });
            }
          } catch (error) {
            console.error('Failed to sync booking update:', error);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error in syncBookingUpdate:', error);
  }
}

async function syncAnalyticsEvents() {
  try {
    const cache = await caches.open(BACKGROUND_SYNC_CACHE);
    const requests = await cache.keys();

    const events = [];
    for (const request of requests) {
      if (request.url.includes('analytics-event')) {
        const response = await cache.match(request);
        const eventData = await response?.json();

        if (eventData) {
          events.push(eventData);
          await cache.delete(request);
        }
      }
    }

    if (events.length > 0) {
      try {
        await fetch('/api/analytics/batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ events }),
        });
      } catch (error) {
        console.error('Failed to sync analytics events:', error);
      }
    }
  } catch (error) {
    console.error('Error in syncAnalyticsEvents:', error);
  }
}

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);

  if (!event.data) {
    return;
  }

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: data.primaryKey || 1,
      type: data.type || NOTIFICATION_TYPES.SYSTEM_UPDATE,
      actionUrl: data.actionUrl,
    },
    actions: data.actions || [
      {
        action: 'explore',
        title: 'View Details',
      },
      {
        action: 'close',
        title: 'Close',
      },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received:', event);

  event.notification.close();

  const action = event.action;
  const data = event.notification.data;

  if (action === 'explore' || !action) {
    // Open the app to relevant page
    event.waitUntil(
      clients.matchAll().then((clientList) => {
        // Focus existing window if available
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }

        // Open new window
        if (clients.openWindow) {
          const url = data.actionUrl || '/dashboard';
          return clients.openWindow(url);
        }
      })
    );
  } else if (action === 'close') {
    // Just close the notification
    return;
  } else {
    // Handle custom actions
    handleNotificationAction(action, data);
  }
});

// Notification close handler
self.addEventListener('notificationclose', async (event) => {
  console.log('Notification closed:', event);

  // Track notification dismissals for analytics
  const data = event.notification.data;

  try {
    // Store dismissal event for later sync
    const cache = await caches.open(BACKGROUND_SYNC_CACHE);
    const dismissalEvent = {
      type: 'notification_dismissal',
      notificationType: data.type,
      timestamp: Date.now(),
      primaryKey: data.primaryKey,
    };

    await cache.put(
      `/sync/analytics-event/${Date.now()}`,
      new Response(JSON.stringify(dismissalEvent))
    );
  } catch (error) {
    console.error('Failed to track notification dismissal:', error);
  }
});

// Helper function to handle custom notification actions
async function handleNotificationAction(action, data) {
  switch (action) {
    case 'confirm_booking':
      try {
        const response = await fetch(`/api/bookings/${data.bookingId}/confirm`, {
          method: 'POST',
        });

        if (response.ok) {
          notifyClients({
            type: 'BOOKING_CONFIRMED',
            payload: { bookingId: data.bookingId }
          });
        }
      } catch (error) {
        console.error('Failed to confirm booking:', error);
      }
      break;

    case 'cancel_booking':
      try {
        const response = await fetch(`/api/bookings/${data.bookingId}/cancel`, {
          method: 'POST',
        });

        if (response.ok) {
          notifyClients({
            type: 'BOOKING_CANCELLED',
            payload: { bookingId: data.bookingId }
          });
        }
      } catch (error) {
        console.error('Failed to cancel booking:', error);
      }
      break;

    default:
      console.log('Unknown notification action:', action);
  }
}

// Helper function to notify all clients
async function notifyClients(message) {
  try {
    const clients = await clients.matchAll();

    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN || client.readyState === 1) {
        client.postMessage(message);
      }
    });
  } catch (error) {
    console.error('Failed to notify clients:', error);
  }
}

// Periodic sync for background tasks (if supported)
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicsync', (event) => {
    console.log('Periodic sync triggered:', event.tag);

    if (event.tag === 'availability-refresh') {
      event.waitUntil(refreshAvailabilityCache());
    } else if (event.tag === 'cleanup-cache') {
      event.waitUntil(cleanupAllCaches());
    }
  });
}

// Refresh availability cache
async function refreshAvailabilityCache() {
  try {
    const response = await fetch('/api/availability/refresh', {
      method: 'POST',
    });

    if (response.ok) {
      // Clear old availability cache
      const cache = await caches.open(API_CACHE);
      const keys = await cache.keys();

      for (const key of keys) {
        if (key.url.includes('availability')) {
          await cache.delete(key);
        }
      }
    }
  } catch (error) {
    console.error('Failed to refresh availability cache:', error);
  }
}

// Clean up all caches
async function cleanupAllCaches() {
  try {
    const cacheNames = await caches.keys();

    for (const cacheName of cacheNames) {
      const cacheType = cacheName.split('-')[0].toUpperCase();
      const limit = CACHE_LIMITS[cacheType];

      if (limit) {
        await CacheManager.cleanup(cacheName, limit);
      }
    }
  } catch (error) {
    console.error('Failed to cleanup caches:', error);
  }
}

// Performance monitoring
self.addEventListener('fetch', (event) => {
  const start = Date.now();

  event.waitUntil(
    (async () => {
      // Wait for the fetch to complete
      await event.response;

      const duration = Date.now() - start;

      // Log slow requests
      if (duration > 2000) {
        console.warn(`Slow request detected: ${event.request.url} took ${duration}ms`);

        // Send to analytics if available
        try {
          self.clients.matchAll().then(clients => {
            clients.forEach(client => {
              client.postMessage({
                type: 'PERFORMANCE_SLOW_REQUEST',
                payload: {
                  url: event.request.url,
                  duration,
                  timestamp: Date.now(),
                }
              });
            });
          });
        } catch (error) {
          // Ignore messaging errors
        }
      }
    })()
  );
});
