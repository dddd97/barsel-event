/**
 * Image utilities for handling lazy loading and error fallbacks
 */
import type { SyntheticEvent } from 'react';

export interface ImageErrorEvent extends SyntheticEvent<HTMLImageElement> {
  target: HTMLImageElement;
}

/**
 * Robust image error handler with fallback chain
 */
export const handleImageError = (e: ImageErrorEvent): void => {
  const target = e.target;
  const currentSrc = target.src;
  
  // Prevent infinite loops by tracking failed URLs
  if (target.dataset.failedUrls) {
    const failedUrls = JSON.parse(target.dataset.failedUrls);
    if (failedUrls.includes(currentSrc)) {
      // All fallbacks failed, hide image and show placeholder div
      target.style.display = 'none';
      showPlaceholderDiv(target);
      return;
    }
    failedUrls.push(currentSrc);
    target.dataset.failedUrls = JSON.stringify(failedUrls);
  } else {
    target.dataset.failedUrls = JSON.stringify([currentSrc]);
  }

  // Fallback chain - improved with better checks
  if (!currentSrc.includes('event-placeholder.jpg') && !currentSrc.includes('barsel-event.png')) {
    // Try barsel event placeholder first (more appropriate for events)
    target.src = '/images/event-placeholder.jpg';
  } else if (!currentSrc.includes('barsel-logo.png')) {
    // Try barsel logo as secondary fallback
    target.src = '/images/barsel-logo.png';
  } else {
    // All fallbacks failed, hide image and show div
    target.style.display = 'none';
    showPlaceholderDiv(target);
  }
};

/**
 * Show a styled placeholder div when all images fail
 */
const showPlaceholderDiv = (imgElement: HTMLImageElement): void => {
  const placeholder = document.createElement('div');
  placeholder.className = 'flex items-center justify-center bg-gray-100 text-gray-400 rounded';
  placeholder.style.width = '100%';
  placeholder.style.height = '100%';
  placeholder.innerHTML = `
    <div class="text-center p-4">
      <svg class="w-12 h-12 mx-auto mb-2 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
      </svg>
      <p class="text-xs text-gray-500">Gambar tidak tersedia</p>
    </div>
  `;
  
  // Insert placeholder after the image
  if (imgElement.parentNode) {
    imgElement.parentNode.insertBefore(placeholder, imgElement.nextSibling);
  }
};

/**
 * Get optimized image URL with fallback and responsive sizing
 */
export const getImageUrl = (
  primaryUrl: string | null | undefined,
  fallbackUrl: string | null | undefined = null,
  defaultPlaceholder: string = '/images/event-placeholder.jpg'
): string => {
  const url = primaryUrl || fallbackUrl;
  
  if (!url) {
    return defaultPlaceholder;
  }
  
  // If it's already a full URL, use as-is
  if (url.startsWith('http')) {
    return url;
  }
  
  // Prepend origin for relative URLs
  return `${window.location.origin}${url}`;
};

/**
 * Get responsive image URL based on container size
 */
export const getResponsiveImageUrl = (
  event: { bannerUrl?: string; banner_url?: string; optimizedBannerUrls?: any },
  containerWidth: number = 800
): string => {
  // Select appropriate size based on container width
  let targetSize: string;
  if (containerWidth <= 400) {
    targetSize = 'small';
  } else if (containerWidth <= 800) {
    targetSize = 'medium';
  } else {
    targetSize = 'large';
  }

  // Try optimized URLs first
  if (event.optimizedBannerUrls?.[targetSize]) {
    return event.optimizedBannerUrls[targetSize];
  }

  // Fallback to regular URLs
  return getImageUrl(event.bannerUrl, event.banner_url);
};

/**
 * Generate srcSet for responsive images
 */
export const generateSrcSet = (
  event: { bannerUrl?: string; banner_url?: string; optimizedBannerUrls?: any }
): string => {
  const srcSet: string[] = [];
  
  if (event.optimizedBannerUrls) {
    if (event.optimizedBannerUrls.small) {
      srcSet.push(`${event.optimizedBannerUrls.small} 400w`);
    }
    if (event.optimizedBannerUrls.medium) {
      srcSet.push(`${event.optimizedBannerUrls.medium} 800w`);
    }
    if (event.optimizedBannerUrls.large) {
      srcSet.push(`${event.optimizedBannerUrls.large} 1200w`);
    }
  }
  
  // Fallback to regular URL
  if (srcSet.length === 0) {
    const fallbackUrl = getImageUrl(event.bannerUrl, event.banner_url);
    srcSet.push(`${fallbackUrl} 800w`);
  }
  
  return srcSet.join(', ');
};

/**
 * Preload critical images for better performance
 */
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
};

/**
 * Lazy load images when they enter viewport
 * Usage: Add data-src instead of src, then call this function
 */
export const initLazyLoading = (): void => {
  if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
          }
        }
      });
    });

    // Observe all images with lazy class
    document.querySelectorAll('img.lazy').forEach(img => {
      imageObserver.observe(img);
    });
  } else {
    // Fallback for browsers without IntersectionObserver
    document.querySelectorAll('img[data-src]').forEach(img => {
      const imgElement = img as HTMLImageElement;
      if (imgElement.dataset.src) {
        imgElement.src = imgElement.dataset.src;
      }
    });
  }
};

/**
 * Check if WebP is supported by the browser
 */
export const supportsWebP = (): Promise<boolean> => {
  return new Promise(resolve => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
};