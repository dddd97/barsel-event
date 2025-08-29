import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Clear any existing service workers to prevent stale API caching
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      registration.unregister().catch(err => {
        console.warn('Failed to unregister service worker:', err);
      });
    });
  }).catch(err => {
    console.warn('Failed to get service worker registrations:', err);
  });
}

// Clear cache storage to prevent stale API responses
if ('caches' in window) {
  caches.keys().then(names => {
    names.forEach(name => {
      caches.delete(name).catch(err => {
        console.warn(`Failed to delete cache ${name}:`, err);
      });
    });
  }).catch(err => {
    console.warn('Failed to clear cache storage:', err);
  });
}

// Only mount React if root element exists
const rootElement = document.getElementById('root')
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
