export interface PWAConfig {
  name: string;
  shortName: string;
  description: string;
  themeColor: string;
  backgroundColor: string;
  display: 'standalone' | 'minimal-ui' | 'fullscreen' | 'browser';
  orientation: 'portrait' | 'landscape' | 'any';
  scope: string;
  startUrl: string;
  icons: PWAIcon[];
}

export interface PWAIcon {
  src: string;
  sizes: string;
  type: string;
  purpose?: 'any' | 'maskable' | 'monochrome';
}

export interface ServiceWorkerMessage {
  type: 'INSTALL' | 'ACTIVATE' | 'UPDATE_AVAILABLE' | 'CACHE_UPDATED' | 'OFFLINE_FALLBACK';
  payload?: any;
}

export interface OfflineQueueItem {
  id: string;
  url: string;
  method: string;
  data?: any;
  headers?: Record<string, string>;
  timestamp: Date;
  retryCount: number;
}

export class PWAService {
  private deferredPrompt: any = null;
  private isInstalled = false;
  private offlineQueue: OfflineQueueItem[] = [];
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private config: PWAConfig;

  constructor(config: PWAConfig) {
    this.config = config;
    this.initializePWA();
  }

  private async initializePWA(): Promise<void> {
    // Check if app is already installed
    this.isInstalled = await this.checkIfInstalled();
    
    // Listen for beforeinstallprompt event
    this.setupInstallPrompt();
    
    // Register service worker
    await this.registerServiceWorker();
    
    // Setup offline functionality
    this.setupOfflineSupport();
    
    // Setup update handling
    this.setupUpdateHandling();
  }

  private async checkIfInstalled(): Promise<boolean> {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      return !!registration;
    }
    return false;
  }

  private setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      
      // Show custom install prompt
      this.showInstallPrompt();
    });

    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      this.isInstalled = true;
      this.hideInstallPrompt();
    });
  }

  private showInstallPrompt(): void {
    // Custom install prompt UI
    const installBanner = document.createElement('div');
    installBanner.className = 'pwa-install-banner';
    installBanner.innerHTML = `
      <div class="install-banner-content">
        <h3>Установить приложение</h3>
        <p>Установите 1C AI Demo для лучшего опыта</p>
        <div class="install-actions">
          <button id="install-btn">Установить</button>
          <button id="dismiss-btn">Позже</button>
        </div>
      </div>
    `;

    document.body.appendChild(installBanner);

    document.getElementById('install-btn')?.addEventListener('click', () => {
      this.installApp();
    });

    document.getElementById('dismiss-btn')?.addEventListener('click', () => {
      this.hideInstallPrompt();
    });
  }

  private hideInstallPrompt(): void {
    const banner = document.querySelector('.pwa-install-banner');
    if (banner) {
      banner.remove();
    }
  }

  async installApp(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.log('No install prompt available');
      return false;
    }

    this.deferredPrompt.prompt();
    
    const { outcome } = await this.deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      this.deferredPrompt = null;
      return true;
    } else {
      console.log('User dismissed the install prompt');
      return false;
    }
  }

  private async registerServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully');
        
        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          this.handleServiceWorkerMessage(event.data);
        });
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  private handleServiceWorkerMessage(message: ServiceWorkerMessage): void {
    switch (message.type) {
      case 'UPDATE_AVAILABLE':
        this.showUpdateNotification();
        break;
      case 'OFFLINE_FALLBACK':
        this.handleOfflineFallback(message.payload);
        break;
      case 'CACHE_UPDATED':
        console.log('Cache updated successfully');
        break;
    }
  }

  private showUpdateNotification(): void {
    const updateBanner = document.createElement('div');
    updateBanner.className = 'pwa-update-banner';
    updateBanner.innerHTML = `
      <div class="update-banner-content">
        <p>Доступно обновление приложения</p>
        <button id="update-btn">Обновить</button>
        <button id="ignore-update-btn">Позже</button>
      </div>
    `;

    document.body.appendChild(updateBanner);

    document.getElementById('update-btn')?.addEventListener('click', () => {
      this.updateApp();
    });

    document.getElementById('ignore-update-btn')?.addEventListener('click', () => {
      updateBanner.remove();
    });
  }

  async updateApp(): Promise<void> {
    if (this.serviceWorkerRegistration) {
      await this.serviceWorkerRegistration.update();
      if (this.serviceWorkerRegistration.waiting) {
        this.serviceWorkerRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
    }
  }

  private setupOfflineSupport(): void {
    // Check for online/offline status
    const updateOnlineStatus = () => {
      const status = navigator.onLine ? 'online' : 'offline';
      document.body.setAttribute('data-connection', status);
      
      if (status === 'online') {
        this.syncOfflineQueue();
      }
    };

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus(); // Initial check
  }

  private syncOfflineQueue(): void {
    if (this.offlineQueue.length === 0) return;

    const itemsToSync = [...this.offlineQueue];
    
    itemsToSync.forEach(async (item) => {
      try {
        await this.syncRequest(item);
        this.removeFromOfflineQueue(item.id);
      } catch (error) {
        console.error('Failed to sync request:', error);
        // Keep in queue for retry
      }
    });
  }

  private async syncRequest(item: OfflineQueueItem): Promise<void> {
    const response = await fetch(item.url, {
      method: item.method,
      headers: item.headers,
      body: item.data ? JSON.stringify(item.data) : undefined
    });

    if (!response.ok) {
      throw new Error(`Sync failed: ${response.status}`);
    }
  }

  private removeFromOfflineQueue(id: string): void {
    this.offlineQueue = this.offlineQueue.filter(item => item.id !== id);
  }

  private handleOfflineFallback(payload: any): void {
    // Handle offline fallback scenarios
    console.log('Offline fallback:', payload);
  }

  private setupUpdateHandling(): void {
    // Listen for updates
    if (this.serviceWorkerRegistration) {
      this.serviceWorkerRegistration.addEventListener('updatefound', () => {
        const newWorker = this.serviceWorkerRegistration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              this.showUpdateNotification();
            }
          });
        }
      });
    }
  }

  addToOfflineQueue(url: string, method: string, data?: any, headers?: Record<string, string>): void {
    const item: OfflineQueueItem = {
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url,
      method,
      data,
      headers,
      timestamp: new Date(),
      retryCount: 0
    };

    this.offlineQueue.push(item);
  }

  getOfflineQueue(): OfflineQueueItem[] {
    return [...this.offlineQueue];
  }

  clearOfflineQueue(): void {
    this.offlineQueue = [];
  }

  isAppInstalled(): boolean {
    return this.isInstalled;
  }

  getConnectionStatus(): 'online' | 'offline' {
    return navigator.onLine ? 'online' : 'offline';
  }

  async sendMessageToServiceWorker(message: ServiceWorkerMessage): Promise<void> {
    if (this.serviceWorkerRegistration && this.serviceWorkerRegistration.active) {
      this.serviceWorkerRegistration.active.postMessage(message);
    }
  }

  async cacheData(key: string, data: any): Promise<void> {
    if ('serviceWorker' in navigator && 'caches' in window) {
      const cache = await caches.open('pwa-data');
      const response = new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' }
      });
      await cache.put(key, response);
    }
  }

  async getCachedData(key: string): Promise<any | null> {
    if ('serviceWorker' in navigator && 'caches' in window) {
      const cache = await caches.open('pwa-data');
      const response = await cache.match(key);
      if (response) {
        return await response.json();
      }
    }
    return null;
  }
}

// React hook for PWA functionality
import React from 'react';

export function usePWA() {
  const [isInstalled, setIsInstalled] = React.useState(false);
  const [isOnline, setIsOnline] = React.useState(navigator.onLine);
  const [updateAvailable, setUpdateAvailable] = React.useState(false);
  const [installPrompt, setInstallPrompt] = React.useState<any>(null);

  React.useEffect(() => {
    // Check installation status
    const checkInstallStatus = () => {
      setIsInstalled(window.matchMedia('(display-mode: standalone)').matches);
    };

    checkInstallStatus();

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    // Listen for online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const installApp = React.useCallback(async (): Promise<boolean> => {
    if (!installPrompt) return false;

    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setInstallPrompt(null);
      return true;
    }
    
    return false;
  }, [installPrompt]);

  const updateApp = React.useCallback(async (): Promise<void> => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration?.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        window.location.reload();
      }
    }
  }, []);

  return {
    isInstalled,
    isOnline,
    isOffline: !isOnline,
    updateAvailable,
    installPrompt: !!installPrompt,
    initializePWA,
    installApp,
    updateApp,
    applyUpdate,
    updateInfo,
    canInstall: !!installPrompt,
    isInstallable: !!installPrompt,
    installPWA: installApp,
    getPlatform,
    getDisplayMode
  };
}