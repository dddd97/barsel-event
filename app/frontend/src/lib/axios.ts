import axios from 'axios';

// Function to convert snake_case keys to camelCase
const toCamelCase = (str: string): string => {
  return str.replace(/_([a-z])/g, (_, group) => group.toUpperCase());
};

// Recursive function to transform object keys from snake_case to camelCase
const transformKeys = (data: unknown): unknown => {
  if (data === null || data === undefined) {
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(transformKeys);
  }
  
  if (typeof data === 'object' && data !== null) {
    const transformed: Record<string, unknown> = {};
    
    Object.entries(data).forEach(([key, value]) => {
      const camelKey = toCamelCase(key);
      transformed[camelKey] = transformKeys(value);
    });
    
    return transformed;
  }
  
  return data;
};

// Function to fix Active Storage URLs
const fixActiveStorageUrl = (url: string | null | undefined): string | null | undefined => {
  if (!url) return url;
  
  // If already has full URL, return as is
  if (url.startsWith('http')) return url;
  
  // Prefix relative URL with API base URL (dev: localhost, prod: current origin)
  return `${getBaseUrl()}${url}`;
};

// Recursive function to fix URLs in the response data
const fixUrls = (data: unknown): unknown => {
  if (data === null || data === undefined) {
    return data;
  }
  
  if (Array.isArray(data)) {
    return data.map(fixUrls);
  }
  
  if (typeof data === 'object' && data !== null) {
    const transformed: Record<string, unknown> = {};
    
    Object.entries(data).forEach(([key, value]) => {
      // Fix URL fields
      if ((key === 'bannerUrl' || key === 'banner_url' || key === 'imageUrl' || key === 'image_url') && typeof value === 'string') {
        transformed[key] = fixActiveStorageUrl(value);
      } else {
        transformed[key] = fixUrls(value);
      }
    });
    
    return transformed;
  }
  
  return data;
};

// Try to get CSRF token safely from cookie or meta tag
const getCsrfToken = (): string => {
  // First try to get from cookie (set by Rails)
  const cookieMatch = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
  if (cookieMatch) {
    return decodeURIComponent(cookieMatch[1]);
  }
  
  // Fallback to meta tag
  const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
  return token || '';
};

// Determine current environment's base URL
const getBaseUrl = () => {
  // Check if we have environment variable first (Vite uses import.meta.env)
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // For development, try to detect the port
  const isDev = import.meta.env.DEV || import.meta.env.NODE_ENV === 'development';
  if (isDev) {
    // If we're running on different port, adjust accordingly
    const currentOrigin = window.location.origin;
    if (currentOrigin.includes(':517')) {
      // Frontend running on Vite dev server
      return 'http://localhost:3000';
    }
    return currentOrigin;
  }
  
  // Production: use same origin for all API calls
  // Nginx proxy handles routing to backend container
  const currentOrigin = window.location.origin;
  
  // Always use same origin - Nginx handles proxy to backend
  return currentOrigin;
};

// Debug logging disabled for production
// console.log('🍪 Current cookies:', document.cookie || '(none)');
// console.log('🌐 Current origin:', window.location.origin);
// console.log('🎯 API base URL:', getBaseUrl());

const instance = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Requested-With': 'XMLHttpRequest' // Ini penting untuk Rails
  },
  withCredentials: true // Pastikan credentials (cookies) dikirim dengan setiap request
});

// Add request interceptor to include CSRF token if available
instance.interceptors.request.use(config => {
  const token = getCsrfToken();
  if (token) {
    config.headers['X-CSRF-Token'] = token;
  }
  
  // Special handling for PDF downloads
  if (config.responseType === 'blob') {
    config.headers['Accept'] = config.headers['Accept'] || 'application/pdf';
  }
  
  // Enhanced logging for sessions endpoint to debug source
  if (config.url?.includes('/api/sessions')) {
    console.log(`🔍 Sessions API Call:`, {
      method: config.method?.toUpperCase(),
      url: config.url,
      data: config.data ? Object.keys(config.data) : null,
      withCredentials: config.withCredentials,
      hasCsrfToken: !!token,
      stack: new Error().stack?.split('\n').slice(1, 4).join('\n') // Show call stack
    });
  }
  
  return config;
}, error => {
  return Promise.reject(error);
});

// Add response interceptor to transform snake_case to camelCase and handle Active Storage URLs
instance.interceptors.response.use(response => {
  // Success log disabled for production
  // console.log(`✅ ${response.status} ${response.config.url}`);

  // Transform snake_case to camelCase
  if (response.data && typeof response.data === 'object') {
    response.data = transformKeys(response.data);
  }
  
  // Fix URLs in the response data
  if (response.data && typeof response.data === 'object') {
    response.data = fixUrls(response.data);
  }
  
  return response;
}, error => {
  // Enhanced error handling
  const status = error.response?.status;
  const url = error.config?.url;
  const errorData = error.response?.data;
  const method = error.config?.method?.toUpperCase();
  
  // Special handling for sessions endpoint errors
  if (url?.includes('/api/sessions')) {
    console.error(`❌ ${method} ${url} - Sessions Error:`, {
      status,
      errorData,
      stack: new Error().stack?.split('\n').slice(1, 4).join('\n')
    });
  }
  
  // Only log non-expected auth errors to reduce noise
  const isExpectedAuthError = status === 401 && url?.includes('/api/me');
  if (!isExpectedAuthError) {
    console.error(`❌ ${status} ${url}`, errorData);
  }
  
  // Detailed error logging based on status code
  switch (status) {
    case 401:
      if (!isExpectedAuthError) {
        console.warn('🔒 Authentication failed - checking session:');
        console.log('  Current cookies:', document.cookie || '(none)');
        console.log('  Request had credentials:', error.config?.withCredentials);
        console.log('  Server response:', errorData);
      }
      break;
    case 403:
      console.warn('🚫 Authorization failed - insufficient permissions');
      break;
    case 404:
      console.warn('🔍 Resource not found - check endpoint URL');
      break;
    case 422:
      console.warn('📝 Validation failed:', errorData?.errors || errorData?.error);
      break;
    case 500:
      console.error('💥 Server error - check backend logs');
      break;
    default:
      if (!isExpectedAuthError) {
        console.error('🔥 Unexpected error occurred');
      }
  }
  
  return Promise.reject(error);
});

export default instance; 