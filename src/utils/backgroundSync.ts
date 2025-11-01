/**
 * Background Sync Helper
 * Handles offline form submissions that sync when online
 */

export class BackgroundSyncManager {
  private static instance: BackgroundSyncManager;
  private readonly SYNC_CACHE = 'ysp-pending-sync';

  private constructor() {}

  static getInstance(): BackgroundSyncManager {
    if (!BackgroundSyncManager.instance) {
      BackgroundSyncManager.instance = new BackgroundSyncManager();
    }
    return BackgroundSyncManager.instance;
  }

  /**
   * Check if background sync is supported
   */
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype;
  }

  /**
   * Register a sync event for a specific tag
   */
  async registerSync(tag: string): Promise<boolean> {
    if (!this.isSupported()) {
      console.warn('Background sync not supported');
      return false;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register(tag);
      console.log(`Background sync registered: ${tag}`);
      return true;
    } catch (error) {
      console.error('Failed to register background sync:', error);
      return false;
    }
  }

  /**
   * Save a request to sync later when online
   */
  async saveForSync(request: Request): Promise<boolean> {
    try {
      const cache = await caches.open(this.SYNC_CACHE);
      await cache.put(request, new Response(JSON.stringify({ pending: true })));
      return true;
    } catch (error) {
      console.error('Failed to save request for sync:', error);
      return false;
    }
  }

  /**
   * Get all pending sync requests
   */
  async getPendingRequests(): Promise<Request[]> {
    try {
      const cache = await caches.open(this.SYNC_CACHE);
      const requests = await cache.keys();
      return requests;
    } catch (error) {
      console.error('Failed to get pending requests:', error);
      return [];
    }
  }

  /**
   * Clear a specific pending request
   */
  async clearPendingRequest(request: Request): Promise<boolean> {
    try {
      const cache = await caches.open(this.SYNC_CACHE);
      await cache.delete(request);
      return true;
    } catch (error) {
      console.error('Failed to clear pending request:', error);
      return false;
    }
  }

  /**
   * Queue attendance submission for background sync
   */
  async queueAttendance(data: any): Promise<boolean> {
    const request = new Request('/api/gas-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'submitAttendance', ...data })
    });

    const saved = await this.saveForSync(request);
    if (saved) {
      await this.registerSync('sync-attendance');
    }
    return saved;
  }

  /**
   * Queue feedback submission for background sync
   */
  async queueFeedback(data: any): Promise<boolean> {
    const request = new Request('/api/gas-proxy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'createFeedback', ...data })
    });

    const saved = await this.saveForSync(request);
    if (saved) {
      await this.registerSync('sync-feedback');
    }
    return saved;
  }

  /**
   * Get count of pending sync items
   */
  async getPendingCount(): Promise<number> {
    const requests = await this.getPendingRequests();
    return requests.length;
  }
}

export const backgroundSync = BackgroundSyncManager.getInstance();
