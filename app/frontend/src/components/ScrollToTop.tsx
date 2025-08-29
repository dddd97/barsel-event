import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Instant scroll to top on route change untuk mencegah halaman muncul dari posisi scroll sebelumnya
    window.scrollTo(0, 0);
    
    // Optional: Smooth scroll setelah delay singkat untuk pengalaman yang lebih baik
    const timeoutId = setTimeout(() => {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
      });
    }, 50);

    return () => clearTimeout(timeoutId);
  }, [pathname]);

  return null;
};

export default ScrollToTop;