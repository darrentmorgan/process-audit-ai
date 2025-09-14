/**
 * ProcessAudit AI Service Worker
 * Sprint 3 Story 2: PWA Enhancement with Advanced Offline Capabilities
 *
 * Provides comprehensive offline functionality, background sync, and intelligent caching
 */

const CACHE_NAME = 'processaudit-ai-v1.0.0';
const STATIC_CACHE = 'processaudit-static-v1.0.0';
const DYNAMIC_CACHE = 'processaudit-dynamic-v1.0.0';
const SOP_CACHE = 'processaudit-sops-v1.0.0';

// Critical resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/mobile/sops',
  '/mobile/analytics',
  '/mobile/compliance',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// API endpoints to cache with strategy
const API_CACHE_STRATEGY = {
  '/api/health': { strategy: 'networkFirst', maxAge: 60000 }, // 1 minute
  '/api/system-status': { strategy: 'networkFirst', maxAge: 300000 }, // 5 minutes
  '/api/organizations/': { strategy: 'cacheFirst', maxAge: 3600000 }, // 1 hour
  '/api/metrics': { strategy: 'networkOnly' } // Always fresh for monitoring
};

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  console.log('🔧 ProcessAudit AI Service Worker: Installing...');

  event.waitUntil(
    Promise.all([
      caches.open(STATIC_CACHE).then(cache => {
        console.log('📦 Caching static assets...');
        return cache.addAll(STATIC_ASSETS);
      }),
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('✅ ProcessAudit AI Service Worker: Activating...');

  event.waitUntil(
    Promise.all([
      // Clean old caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME &&
                cacheName !== STATIC_CACHE &&
                cacheName !== DYNAMIC_CACHE &&
                cacheName !== SOP_CACHE) {
              console.log('🗑️ Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Claim clients immediately
      self.clients.claim()
    ])
  );
});

// Fetch event - intelligent caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and chrome-extension requests
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // Handle different resource types with appropriate strategies
  if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isAPIRequest(request)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isSOPRequest(request)) {
    event.respondWith(handleSOPRequest(request));
  } else {
    event.respondWith(handleDynamicRequest(request));
  }
});

// Background sync for offline operations
self.addEventListener('sync', (event) => {
  console.log('🔄 Background sync triggered:', event.tag);

  if (event.tag === 'sop-completion-sync') {
    event.waitUntil(syncSOPCompletions());
  } else if (event.tag === 'compliance-photo-sync') {
    event.waitUntil(syncCompliancePhotos());
  } else if (event.tag === 'analytics-data-sync') {
    event.waitUntil(syncAnalyticsData());
  }
});

// Push notification handling
self.addEventListener('push', (event) => {
  console.log('📢 Push notification received');

  const options = {
    body: 'ProcessAudit AI notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/icons/action-view.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/action-dismiss.png'
      }
    ]
  };

  if (event.data) {
    const notificationData = event.data.json();

    options.title = notificationData.title || 'ProcessAudit AI';
    options.body = notificationData.body || 'New notification';
    options.data = { ...options.data, ...notificationData };

    // Customize notification based on type
    if (notificationData.type === 'compliance_alert') {
      options.icon = '/icons/compliance-alert.png';
      options.badge = '/icons/compliance-badge.png';
      options.requireInteraction = true;
    } else if (notificationData.type === 'sop_update') {
      options.icon = '/icons/sop-update.png';
      options.vibrate = [200, 100, 200];
    }
  }

  event.waitUntil(
    self.registration.showNotification('ProcessAudit AI', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.notification.data);

  event.notification.close();

  if (event.action === 'view') {
    // Open the app to relevant section
    const urlToOpen = event.notification.data.url || '/mobile/sops';

    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then(clientList => {
        if (clientList.length > 0) {
          // Focus existing window
          return clientList[0].focus();
        }
        // Open new window
        return self.clients.openWindow(urlToOpen);
      })
    );
  }
});

// Utility functions for caching strategies

function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff|woff2)$/) ||
         STATIC_ASSETS.includes(url.pathname);
}

function isAPIRequest(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith('/api/');
}

function isSOPRequest(request) {
  const url = new URL(request.url);
  return url.pathname.includes('/sop') || url.pathname.includes('/mobile');
}

async function handleStaticAsset(request) {
  // Cache first strategy for static assets
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('📱 Static asset offline, returning fallback');
    return new Response('Offline', { status: 503 });
  }
}

async function handleAPIRequest(request) {
  const url = new URL(request.url);
  const strategy = getAPIStrategy(url.pathname);

  if (strategy.strategy === 'networkOnly') {
    return fetch(request);
  }

  if (strategy.strategy === 'networkFirst') {
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        const cache = await caches.open(DYNAMIC_CACHE);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      const cachedResponse = await caches.match(request);
      return cachedResponse || new Response(JSON.stringify({
        error: 'Offline',
        cached: false
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  if (strategy.strategy === 'cacheFirst') {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Refresh cache in background
      fetch(request).then(response => {
        if (response.ok) {
          caches.open(DYNAMIC_CACHE).then(cache => cache.put(request, response));
        }
      }).catch(() => {}); // Ignore background refresh errors
      return cachedResponse;
    }

    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        const cache = await caches.open(DYNAMIC_CACHE);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    } catch (error) {
      return new Response(JSON.stringify({
        error: 'Offline and not cached'
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
}

async function handleSOPRequest(request) {
  // Priority caching for SOP-related requests
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(SOP_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Return offline SOP interface if available
    return caches.match('/mobile/sops') || new Response('SOP Offline', { status: 503 });
  }
}

async function handleDynamicRequest(request) {
  // Network first with cache fallback
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

function getAPIStrategy(pathname) {
  for (const [path, strategy] of Object.entries(API_CACHE_STRATEGY)) {
    if (pathname.startsWith(path)) {
      return strategy;
    }
  }
  return { strategy: 'networkFirst', maxAge: 300000 }; // Default strategy
}

// Background sync functions

async function syncSOPCompletions() {
  console.log('🔄 Syncing SOP completions...');

  try {
    // Get pending SOP completions from IndexedDB
    const pendingCompletions = await getPendingSOPCompletions();

    for (const completion of pendingCompletions) {
      try {
        const response = await fetch('/api/sync/sop-completion', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(completion)
        });

        if (response.ok) {
          await removePendingSOPCompletion(completion.id);
          console.log('✅ SOP completion synced:', completion.id);
        }
      } catch (error) {
        console.log('❌ Failed to sync SOP completion:', completion.id, error);
      }
    }
  } catch (error) {
    console.log('💥 SOP completion sync failed:', error);
  }
}

async function syncCompliancePhotos() {
  console.log('📸 Syncing compliance photos...');

  try {
    const pendingPhotos = await getPendingCompliancePhotos();

    for (const photo of pendingPhotos) {
      try {
        const formData = new FormData();
        formData.append('photo', photo.blob);
        formData.append('metadata', JSON.stringify(photo.metadata));

        const response = await fetch('/api/sync/compliance-photo', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          await removePendingCompliancePhoto(photo.id);
          console.log('✅ Compliance photo synced:', photo.id);
        }
      } catch (error) {
        console.log('❌ Failed to sync compliance photo:', photo.id, error);
      }
    }
  } catch (error) {
    console.log('💥 Compliance photo sync failed:', error);
  }
}

async function syncAnalyticsData() {
  console.log('📊 Syncing analytics data...');

  try {
    const pendingAnalytics = await getPendingAnalyticsData();

    if (pendingAnalytics.length > 0) {
      const response = await fetch('/api/sync/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ events: pendingAnalytics })
      });

      if (response.ok) {
        await clearPendingAnalyticsData();
        console.log('✅ Analytics data synced:', pendingAnalytics.length, 'events');
      }
    }
  } catch (error) {
    console.log('💥 Analytics sync failed:', error);
  }
}

// IndexedDB helper functions (simplified for MVP)
async function getPendingSOPCompletions() {
  const stored = localStorage.getItem('pendingSOPCompletions');
  return stored ? JSON.parse(stored) : [];
}

async function removePendingSOPCompletion(id) {
  const stored = await getPendingSOPCompletions();
  const filtered = stored.filter(item => item.id !== id);
  localStorage.setItem('pendingSOPCompletions', JSON.stringify(filtered));
}

async function getPendingCompliancePhotos() {
  const stored = localStorage.getItem('pendingCompliancePhotos');
  return stored ? JSON.parse(stored) : [];
}

async function removePendingCompliancePhoto(id) {
  const stored = await getPendingCompliancePhotos();
  const filtered = stored.filter(item => item.id !== id);
  localStorage.setItem('pendingCompliancePhotos', JSON.stringify(filtered));
}

async function getPendingAnalyticsData() {
  const stored = localStorage.getItem('pendingAnalytics');
  return stored ? JSON.parse(stored) : [];
}

async function clearPendingAnalyticsData() {
  localStorage.removeItem('pendingAnalytics');
}

console.log('🚀 ProcessAudit AI Service Worker: Ready for field operations');