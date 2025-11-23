// Performance optimization utilities

/**
 * Debounce function to limit API calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function for scroll/resize handlers
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Lazy load images with IntersectionObserver
 */
export function lazyLoadImage(img: HTMLImageElement): void {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLImageElement;
          if (target.dataset.src) {
            target.src = target.dataset.src;
            target.removeAttribute('data-src');
          }
          observer.unobserve(target);
        }
      });
    });
    observer.observe(img);
  } else {
    // Fallback for browsers without IntersectionObserver
    if (img.dataset.src) {
      img.src = img.dataset.src;
    }
  }
}

/**
 * Request idle callback wrapper for non-critical tasks
 */
export function requestIdleTask(callback: () => void): void {
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(callback);
  } else {
    setTimeout(callback, 1);
  }
}

/**
 * Batch state updates
 */
export function batchUpdates<T>(updates: T[]): T[] {
  return updates;
}

/**
 * Check if device is low-end (for lighter animations)
 */
export function isLowEndDevice(): boolean {
  if (typeof window === 'undefined' || !('navigator' in window)) return false;
  
  const nav = navigator as any;
  
  // Check for low memory
  if (nav.deviceMemory && nav.deviceMemory < 4) return true;
  
  // Check for slow connection
  if (nav.connection && (nav.connection.saveData || nav.connection.effectiveType === 'slow-2g' || nav.connection.effectiveType === '2g')) {
    return true;
  }
  
  // Check for low CPU cores
  if (nav.hardwareConcurrency && nav.hardwareConcurrency < 4) return true;
  
  return false;
}

/**
 * Preload image
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Get optimized image URL (for future CDN integration)
 */
export function getOptimizedImageUrl(url: string, _width?: number, _quality = 85): string {
  // For now, return original URL
  // Later can integrate with Vercel Image Optimization or Cloudinary
  return url;
}
