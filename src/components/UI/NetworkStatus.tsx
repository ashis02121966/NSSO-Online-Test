import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';

interface NetworkStatusProps {
  className?: string;
}

export function NetworkStatus({ className = '' }: NetworkStatusProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineMessage(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineMessage(true);
      
      // Hide the message after 5 seconds
      setTimeout(() => {
        setShowOfflineMessage(false);
      }, 5000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div className={`flex items-center ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
        {isOnline ? (
          <Wifi className="w-4 h-4" />
        ) : (
          <WifiOff className="w-4 h-4" />
        )}
      </div>
      
      {showOfflineMessage && (
        <div className="absolute top-full right-0 mt-2 w-64 bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded-lg shadow-lg z-50">
          <div className="flex items-center space-x-2">
            <WifiOff className="w-4 h-4" />
            <div>
              <p className="font-bold text-sm">You are offline</p>
              <p className="text-xs">Your progress will be saved locally and synced when you're back online.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}