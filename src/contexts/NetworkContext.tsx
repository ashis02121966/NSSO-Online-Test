import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { testApi } from '../services/api';

interface NetworkContextType {
  isOnline: boolean;
  lastSynced: Date | null;
  hasPendingChanges: boolean;
  syncData: () => Promise<void>;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}

interface NetworkProviderProps {
  children: ReactNode;
}

export function NetworkProvider({ children }: NetworkProviderProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Try to sync when coming back online
      syncData();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // Check for pending changes in localStorage
    const checkPendingChanges = () => {
      try {
        const pendingSaves = localStorage.getItem('pending_saves');
        setHasPendingChanges(!!pendingSaves && JSON.parse(pendingSaves).length > 0);
        
        const lastSyncTime = localStorage.getItem('last_sync');
        if (lastSyncTime) {
          setLastSynced(new Date(parseInt(lastSyncTime)));
        }
      } catch (error) {
        console.error('Error checking pending changes:', error);
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check initially and set up interval
    checkPendingChanges();
    const interval = setInterval(checkPendingChanges, 10000); // Check every 10 seconds
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const syncData = async () => {
    if (!isOnline) return;
    
    try {
      await testApi.syncOfflineData();
      setHasPendingChanges(false);
      setLastSynced(new Date());
    } catch (error) {
      console.error('Failed to sync data:', error);
    }
  };

  const value = {
    isOnline,
    lastSynced,
    hasPendingChanges,
    syncData
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
}