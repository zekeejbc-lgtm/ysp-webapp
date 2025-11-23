import { useState, useEffect, useRef, ImgHTMLAttributes } from 'react';
import { getOptimizedImageUrl } from '../utils/performance';

interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
  fallbackSrc?: string;
  className?: string;
  loading?: 'lazy' | 'eager';
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  quality = 85,
  fallbackSrc = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect fill="%23f0f0f0" width="100" height="100"/%3E%3C/svg%3E',
  className = '',
  loading = 'lazy',
  ...props
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState<string>(fallbackSrc);
  const [imageError, setImageError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (loading === 'eager') {
      // Load immediately
      setImageSrc(getOptimizedImageUrl(src, width, quality));
      return;
    }

    // Lazy load with IntersectionObserver
    const img = imgRef.current;
    if (!img) return;

    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setImageSrc(getOptimizedImageUrl(src, width, quality));
              observer.unobserve(entry.target);
            }
          });
        },
        {
          rootMargin: '50px', // Start loading 50px before entering viewport
        }
      );

      observer.observe(img);

      return () => {
        observer.disconnect();
      };
    } else {
      // Fallback: load immediately
      setImageSrc(getOptimizedImageUrl(src, width, quality));
    }
  }, [src, width, quality, loading]);

  const handleError = () => {
    if (!imageError) {
      setImageError(true);
      setImageSrc(fallbackSrc);
    }
  };

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={handleError}
      loading={loading}
      decoding="async"
      {...props}
    />
  );
}
