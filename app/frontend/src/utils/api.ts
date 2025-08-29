/**
 * Get the appropriate base URL for API requests
 * This should match the logic used in lib/axios.ts
 */
export const getBaseUrl = (): string => {
  // Check for environment variable first
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // For development, detect if we're running on Vite dev server
  const isDev = import.meta.env.DEV || import.meta.env.NODE_ENV === 'development';
  if (isDev) {
    const currentOrigin = window.location.origin;
    // If frontend is running on Vite dev server (port 5173), point to Rails server (port 3000)
    if (currentOrigin.includes(':517')) {
      return 'http://localhost:3000';
    }
    return currentOrigin;
  }
  
  // Production: use same origin
  return window.location.origin;
};

/**
 * Open a PDF file in preview mode (inline in browser)
 */
export const previewPDF = (url: string): void => {
  const baseUrl = getBaseUrl();
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
  window.open(fullUrl, '_blank');
};

/**
 * Download a PDF file (forces download with attachment disposition)
 */
export const downloadPDF = async (url: string): Promise<void> => {
  const baseUrl = getBaseUrl();
  const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`;
  const downloadUrl = fullUrl.includes('?') ? `${fullUrl}&download=true` : `${fullUrl}?download=true`;
  
  try {
    const response = await fetch(downloadUrl);
    const blob = await response.blob();
    
    // Create a temporary URL for the blob
    const blobUrl = window.URL.createObjectURL(blob);
    
    // Create a temporary link element and trigger download
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = 'kartu-peserta.pdf'; // Default filename
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('Download failed:', error);
    // Fallback to window.open if fetch fails
    window.open(downloadUrl, '_blank');
  }
};
