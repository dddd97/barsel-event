import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../lib/axios';
import { EyeIcon, EyeSlashIcon, LockClosedIcon, EnvelopeIcon } from '@heroicons/react/24/outline';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from || '/admin';

  // Reduce debug API calls to prevent infinite loops
  useEffect(() => {
    // Only fetch debug info when explicitly requested
    if (showDebug && !debugInfo) {
      const fetchDebugInfo = async () => {
        try {
          const response = await api.get('/api/debug');
          setDebugInfo(response.data);
        } catch (err) {
          console.log('Debug info fetch error (can be ignored):', err);
          setDebugInfo({ error: 'Debug info not available' });
        }
      };
      fetchDebugInfo();
    }
  }, [showDebug, debugInfo]);

  // Redirect if already authenticated (prevent login loop)
  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      // Navigation is handled by AuthContext after successful login
    } catch (err: any) {
      setError(err.message || 'Login gagal. Periksa email dan password Anda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleDebug = () => {
    setShowDebug(!showDebug);
    // Clear debug info when hiding to force fresh fetch next time
    if (showDebug) {
      setDebugInfo(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Logo and Header */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-full shadow-lg overflow-hidden bg-white">
            <img 
              src="/images/barsel-event.png" 
              alt="Barsel Event Logo" 
              className="h-16 w-16 object-contain"
            />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            SIGN IN
          </h2>
        </div>

        
        {/* Login Card */}
        <div className="bg-white py-8 px-6 shadow-xl rounded-xl border border-gray-100">
        
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
              </div>
            </div>
          )}
        
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                  placeholder="Your email address"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 placeholder-gray-500"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Ingat saya
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Memproses...
                  </>
                ) : (
                  'Login ke Dashboard'
                )}
              </button>
            </div>
          </form>
        
          {/* Back to Home */}
          <div className="text-center">
            <Link 
              to="/" 
              className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200"
            >
              ← Kembali ke Halaman Utama
            </Link>
          </div>
        </div>

        {/* Default admin credentials info - DISABLED IN PRODUCTION */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center mb-2">
              <div className="h-2 w-2 bg-blue-500 rounded-full mr-2"></div>
              <h4 className="text-sm font-semibold text-blue-800">Default Admin Credentials</h4>
            </div>
            <div className="text-xs text-blue-700 space-y-1">
              <p>Email: <code className="bg-blue-100 px-2 py-1 rounded font-mono">admin@example.com</code></p>
              <p>Password: <code className="bg-blue-100 px-2 py-1 rounded font-mono">password123</code></p>
            </div>
          </div>
        )}
        
        {/* Debug section - hidden by default and only loads when requested */}
        <div className="border-t border-gray-200 pt-4">
          <button 
            onClick={toggleDebug}
            className="text-xs text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            {showDebug ? 'Sembunyikan' : 'Tampilkan'} Informasi Debug
          </button>
          
          {showDebug && (
            <div className="mt-3 bg-gray-50 rounded-lg border p-4 text-xs">
              <h4 className="font-semibold text-gray-700 mb-2">Session Info:</h4>
              <pre className="bg-white border rounded p-3 overflow-auto max-h-40 text-gray-600">
                {debugInfo ? JSON.stringify(debugInfo, null, 2) : 'Loading...'}
              </pre>
              
              <h4 className="font-semibold text-gray-700 mt-3 mb-2">Browser Cookies:</h4>
              <pre className="bg-white border rounded p-3 overflow-auto max-h-20 text-gray-600">
                {document.cookie || 'No cookies found'}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 