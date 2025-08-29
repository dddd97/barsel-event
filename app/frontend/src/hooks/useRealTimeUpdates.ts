import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './useAuth';

interface DashboardData {
  timestamp: number;
  eventsCount: number;
  participantsCount: number;
  activeEvents: number;
  recentRegistrations: Array<{
    id: number;
    name: string;
    eventName: string;
    registrationNumber: string;
    createdAt: string;
  }>;
  recentLogins: Array<{
    adminName: string;
    ipAddress: string;
    createdAt: string;
  }>;
  systemAlerts: Array<{
    type: 'warning' | 'danger' | 'info';
    message: string;
    eventId?: number;
    action?: string;
  }>;
}

interface UseRealTimeUpdatesReturn {
  data: DashboardData | null;
  isConnected: boolean;
  lastUpdated: Date | null;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
}

export const useRealTimeUpdates = (): UseRealTimeUpdatesReturn => {
  const { isAuthenticated, isAdmin } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = 3; // Reduced from 5 to prevent excessive reconnections
  const isConnectingRef = useRef(false); // Prevent multiple concurrent connections
  const lastAuthStateRef = useRef(isAuthenticated && isAdmin);

  // Track authentication changes without creating dependency loops
  useEffect(() => {
    const currentAdminAuth = isAuthenticated && isAdmin;
    const handleAuthChange = () => {
      if (lastAuthStateRef.current !== currentAdminAuth) {
        lastAuthStateRef.current = currentAdminAuth;
        // Add delay to prevent rapid reconnections and ensure auth is stable
        setTimeout(() => {
          if (currentAdminAuth && !isConnected && !isConnectingRef.current) {
            console.log('Admin authentication confirmed, attempting connection...');
            connect();
          } else if (!currentAdminAuth) {
            console.log('Admin authentication lost, disconnecting...');
            disconnect();
          }
        }, 1000); // Increased delay to 1 second
      }
    };

    handleAuthChange();
  }, [isAuthenticated, isAdmin]); // Track both authentication and admin status

  const startPollingFallback = useCallback(() => {
    // Clear existing polling first
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    pollingIntervalRef.current = setInterval(async () => {
      if (!isAuthenticated || !isAdmin) return;
      
      try {
        const response = await fetch('/api/dashboard/stats', {
          credentials: 'include',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const newData = await response.json();
          setData({
            timestamp: Date.now() / 1000,
            eventsCount: newData.events?.total || 0,
            participantsCount: newData.participants?.total || 0,
            activeEvents: newData.events?.active || 0,
            recentRegistrations: (newData.recent_registrations || []).map((reg: any) => ({
              id: reg.id || Math.random(),
              name: reg.name || 'Unknown',
              eventName: reg.event_name || 'Unknown Event',
              registrationNumber: reg.registration_number || 'N/A',
              createdAt: reg.created_at || new Date().toISOString()
            })),
            recentLogins: [],
            systemAlerts: []
          });
          setLastUpdated(new Date());
          setError(null); // Clear error on successful fetch
        }
      } catch (error) {
        if (error instanceof TypeError || (error as Error)?.message?.includes('network')) {
          console.warn('Network error in polling fallback:', (error as Error).message);
          setError('Connection unstable - using fallback mode');
        }
      }
    }, 20000); // Increased interval to 20 seconds to reduce server load
  }, [isAuthenticated, isAdmin]);

  const connect = useCallback(() => {
    if (!isAuthenticated || !isAdmin) {
      console.warn('Cannot connect to real-time updates: not authenticated as admin');
      setError('Admin authentication required');
      return;
    }

    if (isConnectingRef.current || eventSourceRef.current) {
      console.log('Connection already in progress or exists');
      return;
    }

    isConnectingRef.current = true;

    try {
      // Use absolute URL to ensure proper proxy handling
      const eventSource = new EventSource('/api/dashboard/events', {
        withCredentials: true
      });

      // Set a connection timeout - increased for better SSE reliability
      const connectionTimeout = setTimeout(() => {
        if (!isConnected) {
          console.warn('Real-time connection timeout, falling back to polling mode');
          eventSource.close();
          setError(null);
          isConnectingRef.current = false;
          startPollingFallback();
        }
      }, 30000); // Increased to 30 seconds timeout

      eventSource.onopen = () => {
        console.log('Real-time connection established');
        clearTimeout(connectionTimeout);
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
        isConnectingRef.current = false;
        
        // Stop polling if it was running
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      };

      eventSource.onmessage = (event) => {
        try {
          if (event.data === 'connected') {
            clearTimeout(connectionTimeout);
            setIsConnected(true);
            setError(null);
            reconnectAttemptsRef.current = 0;
            isConnectingRef.current = false;
            return;
          }
          
          // Handle JSON data in default message events
          const data = JSON.parse(event.data);
          if (data.message === 'Connection error') {
            console.warn('Server sent connection error message - likely authentication issue');
            setError('Authentication required');
            setIsConnected(false);
            isConnectingRef.current = false;
            eventSource.close();
            return;
          }
        } catch (e) {
          console.warn('Received non-JSON message:', event.data);
        }
      };

      eventSource.addEventListener('initial', (event) => {
        try {
          const rawData = JSON.parse(event.data);
          const transformedData = {
            timestamp: rawData.timestamp,
            eventsCount: rawData.events_count,
            participantsCount: rawData.participants_count,
            activeEvents: rawData.active_events,
            recentRegistrations: (rawData.recent_registrations || []).map((reg: any) => ({
              id: reg.id,
              name: reg.name,
              eventName: reg.event_name,
              registrationNumber: reg.registration_number,
              createdAt: reg.created_at
            })),
            recentLogins: (rawData.recent_logins || []).map((login: any) => ({
              adminName: login.admin_name,
              ipAddress: login.ip_address,
              createdAt: login.created_at
            })),
            systemAlerts: rawData.system_alerts || []
          };
          setData(transformedData);
          setLastUpdated(new Date());
        } catch (err) {
          console.error('Error parsing initial data:', err);
        }
      });

      eventSource.addEventListener('update', (event) => {
        try {
          const rawData = JSON.parse(event.data);
          const transformedData = {
            timestamp: rawData.timestamp,
            eventsCount: rawData.events_count,
            participantsCount: rawData.participants_count,
            activeEvents: rawData.active_events,
            recentRegistrations: (rawData.recent_registrations || []).map((reg: any) => ({
              id: reg.id,
              name: reg.name,
              eventName: reg.event_name,
              registrationNumber: reg.registration_number,
              createdAt: reg.created_at
            })),
            recentLogins: (rawData.recent_logins || []).map((login: any) => ({
              adminName: login.admin_name,
              ipAddress: login.ip_address,
              createdAt: login.created_at
            })),
            systemAlerts: rawData.system_alerts || []
          };
          setData(transformedData);
          setLastUpdated(new Date());
        } catch (err) {
          console.error('Error parsing update data:', err);
        }
      });

      eventSource.addEventListener('heartbeat', () => {
        // Keep connection alive - no action needed
      });

      eventSource.onerror = (event) => {
        console.error('EventSource error:', event);
        setIsConnected(false);
        isConnectingRef.current = false;
        
        if (eventSource.readyState === EventSource.CLOSED) {
          console.log('Connection closed by server');
          
          // Only attempt reconnection if we haven't exceeded max attempts
          if (reconnectAttemptsRef.current < maxReconnectAttempts && isAuthenticated && isAdmin) {
            const delay = Math.min(Math.pow(2, reconnectAttemptsRef.current) * 2000, 30000); // Max 30 seconds
            reconnectAttemptsRef.current++;
            
            console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);
            setError(`Connection lost. Reconnecting in ${delay / 1000}s...`);
            
            reconnectTimeoutRef.current = setTimeout(() => {
              if (isAuthenticated && isAdmin) { // Double-check authentication before reconnecting
                connect();
              }
            }, delay);
          } else {
            console.warn('Max reconnection attempts reached or not authenticated as admin, switching to polling mode');
            setError(null);
            if (isAuthenticated && isAdmin) {
              startPollingFallback();
            }
          }
        }
      };

      eventSourceRef.current = eventSource;
    } catch (err) {
      console.error('Error creating EventSource:', err);
      setError('Failed to establish real-time connection');
      isConnectingRef.current = false;
      if (isAuthenticated && isAdmin) {
        startPollingFallback();
      }
    }
  }, [startPollingFallback]);

  const disconnect = useCallback(() => {
    isConnectingRef.current = false;
    
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    setIsConnected(false);
    setError(null);
    reconnectAttemptsRef.current = 0;
  }, []);

  // Initial connection setup - run only once on mount
  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;
    
    const initializeConnection = () => {
      if (mounted && isAuthenticated && isAdmin && !isConnected && !isConnectingRef.current) {
        timeoutId = setTimeout(() => {
          if (mounted && isAuthenticated && isAdmin && !isConnected && !isConnectingRef.current) {
            connect();
          }
        }, 1000);
      } else if (mounted && (!isAuthenticated || !isAdmin)) {
        disconnect();
      }
    };

    initializeConnection();

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []); // Run only once on mount - no dependencies to prevent loops

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    data,
    isConnected,
    lastUpdated,
    error,
    connect,
    disconnect
  };
}; 