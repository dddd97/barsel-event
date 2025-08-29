import { useState, useEffect } from 'react';
import api from '../lib/axios';

interface ConnectionStatusProps {
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ className = '' }) => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkConnection = async () => {
    if (isChecking) return;
    
    setIsChecking(true);
    try {
      // Use a more reliable endpoint for production health check
      const response = await api.get('/api/health', {
        timeout: 5000,
        headers: { 'Accept': 'application/json' }
      });
      setIsConnected(response.status === 200);
      setLastChecked(new Date());
    } catch (error) {
      setIsConnected(false);
      setLastChecked(new Date());
      console.log('Connection check failed:', error);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkConnection();
    
    // Check connection every 30 seconds
    const interval = setInterval(checkConnection, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    if (isConnected === null || isChecking) return 'bg-yellow-500';
    return isConnected ? 'bg-green-500' : 'bg-red-500';
  };

  const getStatusText = () => {
    if (isChecking) return 'Memeriksa koneksi...';
    if (isConnected === null) return 'Status tidak diketahui';
    return isConnected ? 'Terhubung ke server' : 'Server tidak dapat diakses';
  };

  const getStatusMessage = () => {
    if (isConnected === false) {
      return (
        <div className="text-sm text-red-600 mt-2">
          <p><strong>Server API tidak dapat diakses.</strong></p>
          <p>Periksa koneksi jaringan atau hubungi administrator sistem.</p>
          <p className="mt-1">
            <button 
              onClick={checkConnection}
              className="text-blue-600 hover:text-blue-800 underline"
              disabled={isChecking}
            >
              Coba lagi
            </button>
          </p>
        </div>
      );
    }
    
    if (lastChecked) {
      return (
        <div className="text-xs text-gray-500 mt-1">
          Terakhir dicek: {lastChecked.toLocaleTimeString()}
        </div>
      );
    }
    
    return null;
  };

  return (
    <div className={`border rounded-lg p-3 ${className}`}>
      <div className="flex items-center">
        <div className={`w-3 h-3 rounded-full ${getStatusColor()} mr-2 ${isChecking ? 'animate-pulse' : ''}`}></div>
        <span className="text-sm font-medium">{getStatusText()}</span>
      </div>
      {getStatusMessage()}
    </div>
  );
};