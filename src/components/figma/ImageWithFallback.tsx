import React, { useMemo, useState } from 'react'

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg=='

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  width?: number;
}

export function ImageWithFallback(props: ImageWithFallbackProps) {
  const [didError, setDidError] = useState(false)
  const { src, alt, style, className, width: widthProp, ...rest } = props

  /**
   * Converts Google Drive URLs to the thumbnail format (fewer CORS issues)
   * Method from old ysp-webapp repo
   */
  const getDisplayableGoogleDriveUrl = (url: string, width: number = 800): string => {
    if (!url || url.trim() === '') return url;
    let fileId = '';
    if (url.includes('drive.google.com/uc')) {
      const match = url.match(/[?&]id=([^&]+)/);
      if (match) fileId = match[1];
    } else if (url.includes('drive.google.com/file/d/')) {
      const match = url.match(/\/file\/d\/([^\/]+)/);
      if (match) fileId = match[1];
    } else if (url.includes('drive.google.com/open')) {
      const match = url.match(/[?&]id=([^&]+)/);
      if (match) fileId = match[1];
    }
    if (fileId) {
      const w = Math.max(200, Math.min(width, 2400));
      return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${w}`;
    }
    return url;
  }

  const safeSrc = useMemo(() => {
    if (!src) return ERROR_IMG_SRC;
    const urlString = String(src);
    const targetWidth = widthProp || 800;
    if (urlString.includes('drive.google.com')) {
      return getDisplayableGoogleDriveUrl(urlString, targetWidth);
    }
    return urlString;
  }, [src, widthProp])

  const handleError = () => {
    if (!didError) {
      console.warn('[ImageWithFallback] Failed to load:', src);
      setDidError(true);
    }
  }

  return didError ? (
    <div
      className={`inline-block bg-gray-100 dark:bg-gray-800 text-center align-middle ${className ?? ''}`}
      style={style}
    >
      <div className="flex items-center justify-center w-full h-full">
        <img src={ERROR_IMG_SRC} alt="Error loading image" {...rest} data-original-url={src} />
      </div>
    </div>
  ) : (
    <img src={safeSrc} alt={alt} className={className} style={style} {...rest} onError={handleError} />
  )
}
