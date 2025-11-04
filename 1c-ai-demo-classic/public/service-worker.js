// Service Worker для 1С ИИ-ассистенты PWA
const CACHE_NAME = '1c-ai-demo-v1.0.0';
const OFFLINE_URL = '/offline.html';

// Ресурсы для кэширования
const STATIC_RESOURCES = [
  '/',
  '/manifest.json',
  '/offline.html',
  // CSS и JS файлы будут добавлены автоматически при сборке
];

// Ресурсы для кэширования при первом посещении
const CACHE_STRATEGIES = {
  // Кэшировать навсегда (статические ресурсы)
  CACHE_FIRST: [
    '/manifest.json',
    '/icons/',
    '/screenshots/'
  ],
  
  // Сеть с fallback в кэш
  NETWORK_FIRST: [
    '/api/',
    '/role/'
  ],
  
  // Кэш с обновлением в фоне
  STALE_WHILE_REVALIDATE: [
    '/',
    '/role/architect',
    '/role/developer',
    '/role/pm',
    '/role/ba',
    '/role/data-analyst'
  ]
};

// Установка Service Worker
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...');
  
  event.waitUntil(
    (async () => {
      try {
        // Кэшируем базовые ресурсы
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll(STATIC_RESOURCES);
        
        console.log('✅ Service Worker: Cached static resources');
        
        // Принудительно активируем новый SW
        await self.skipWaiting();
        
      } catch (error) {
        console.error('❌ Service Worker: Install failed', error);
      }
    })()
  );
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Activating...');
  
  event.waitUntil(
    (async () => {
      try {
        // Удаляем старые кэши
        const cacheNames = await caches.keys();
        const oldCaches = cacheNames.filter(name => name !== CACHE_NAME);
        
        await Promise.all(
          oldCaches.map(name => caches.delete(name))
        );
        
        console.log('✅ Service Worker: Cleaned old caches');
        
        // Берем контроль над всеми клиентами
        await self.clients.claim();
        
      } catch (error) {
        console.error('❌ Service Worker: Activate failed', error);
      }
    })()
  );
});

// Перехват запросов
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Игнорируем non-GET запросы
  if (request.method !== 'GET') {
    return;
  }
  
  // Определяем стратегию кэширования
  if (isStaticResource(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request));
  } else if (isNetworkResource(url.pathname)) {
    event.respondWith(networkFirstStrategy(request));
  } else if (isStaleWhileRevalidate(url.pathname)) {
    event.respondWith(staleWhileRevalidateStrategy(request));
  } else {
    // По умолчанию - кэш с fallback в сеть
    event.respondWith(cacheFirstStrategy(request));
  }
});

// Стратегии кэширования
async function cacheFirstStrategy(request) {
  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Если нет в кэше, загружаем из сети
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('Cache-first failed, trying offline fallback:', error);
    return getOfflineFallback(request);
  }
}

async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('Network-first failed, trying cache:', error);
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    return getOfflineFallback(request);
  }
}

async function staleWhileRevalidateStrategy(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);
  
  const fetchPromise = fetch(request).then(networkResponse => {
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  }).catch(error => {
    console.warn('Stale-while-revalidate network failed:', error);
    return null;
  });
  
  // Возвращаем кэшированную версию сразу, если есть
  return cachedResponse || fetchPromise || getOfflineFallback(request);
}

// Background Sync для офлайн действий
self.addEventListener('sync', (event) => {
  console.log('🔄 Background Sync:', event.tag);
  
  if (event.tag === 'demo-results-sync') {
    event.waitUntil(syncDemoResults());
  }
  
  if (event.tag === 'export-sync') {
    event.waitUntil(syncExports());
  }
});

async function syncDemoResults() {
  try {
    // Получаем офлайн результаты демо из IndexedDB
    const offlineResults = await getOfflineDemoResults();
    
    if (offlineResults.length > 0) {
      // Синхронизируем с сервером
      for (const result of offlineResults) {
        try {
          await fetch('/api/demo-results', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(result)
          });
          
          // Удаляем из офлайн хранилища после успешной синхронизации
          await removeOfflineDemoResult(result.id);
        } catch (error) {
          console.warn('Failed to sync demo result:', error);
        }
      }
    }
    
    console.log('✅ Demo results synced successfully');
  } catch (error) {
    console.error('❌ Demo results sync failed:', error);
  }
}

async function syncExports() {
  try {
    const offlineExports = await getOfflineExports();
    
    for (const exportJob of offlineExports) {
      try {
        // Повторяем экспорт
        await performExport(exportJob);
        await removeOfflineExport(exportJob.id);
      } catch (error) {
        console.warn('Failed to sync export:', error);
      }
    }
    
    console.log('✅ Exports synced successfully');
  } catch (error) {
    console.error('❌ Exports sync failed:', error);
  }
}

// Push уведомления
self.addEventListener('push', (event) => {
  console.log('📱 Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'Новое уведомление от 1С ИИ-ассистенты',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: '1c-ai-demo-notification',
    data: {
      url: '/',
      timestamp: Date.now()
    },
    actions: [
      {
        action: 'open',
        title: 'Открыть приложение',
        icon: '/icons/open-24x24.png'
      },
      {
        action: 'close',
        title: 'Закрыть',
        icon: '/icons/close-24x24.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('1С ИИ-ассистенты', options)
  );
});

// Обработка клика по уведомлению
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked:', event.action);
  
  event.notification.close();
  
  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.openWindow(event.notification.data.url || '/')
    );
  }
});

// Утилиты
function isStaticResource(pathname) {
  return CACHE_STRATEGIES.CACHE_FIRST.some(pattern => pathname.startsWith(pattern));
}

function isNetworkResource(pathname) {
  return CACHE_STRATEGIES.NETWORK_FIRST.some(pattern => pathname.startsWith(pattern));
}

function isStaleWhileRevalidate(pathname) {
  return CACHE_STRATEGIES.STALE_WHILE_REVALIDATE.some(pattern => 
    pathname === pattern || pathname.startsWith(pattern)
  );
}

async function getOfflineFallback(request) {
  // Для навигационных запросов показываем offline страницу
  if (request.mode === 'navigate') {
    const cache = await caches.open(CACHE_NAME);
    return await cache.match(OFFLINE_URL) || new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
  
  // Для других запросов возвращаем базовый ответ
  return new Response('Resource not available offline', {
    status: 503,
    statusText: 'Service Unavailable'
  });
}

// IndexedDB утилиты для офлайн данных
async function getOfflineDemoResults() {
  return new Promise((resolve) => {
    const request = indexedDB.open('1c-ai-demo-offline', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['demoResults'], 'readonly');
      const store = transaction.objectStore('demoResults');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => resolve(getAllRequest.result || []);
    };
    
    request.onerror = () => resolve([]);
  });
}

async function removeOfflineDemoResult(id) {
  return new Promise((resolve) => {
    const request = indexedDB.open('1c-ai-demo-offline', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['demoResults'], 'readwrite');
      const store = transaction.objectStore('demoResults');
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => resolve(true);
      deleteRequest.onerror = () => resolve(false);
    };
    
    request.onerror = () => resolve(false);
  });
}

async function getOfflineExports() {
  return new Promise((resolve) => {
    const request = indexedDB.open('1c-ai-demo-offline', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['exports'], 'readonly');
      const store = transaction.objectStore('exports');
      const getAllRequest = store.getAll();
      
      getAllRequest.onsuccess = () => resolve(getAllRequest.result || []);
    };
    
    request.onerror = () => resolve([]);
  });
}

async function removeOfflineExport(id) {
  return new Promise((resolve) => {
    const request = indexedDB.open('1c-ai-demo-offline', 1);
    
    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['exports'], 'readwrite');
      const store = transaction.objectStore('exports');
      const deleteRequest = store.delete(id);
      
      deleteRequest.onsuccess = () => resolve(true);
      deleteRequest.onerror = () => resolve(false);
    };
    
    request.onerror = () => resolve(false);
  });
}

async function performExport(exportJob) {
  // Логика выполнения экспорта
  console.log('Performing export:', exportJob);
}

// Логирование для отладки
console.log('📱 Service Worker: Loaded successfully');
