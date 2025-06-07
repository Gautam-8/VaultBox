import { useEffect, useRef } from 'react';
import { keepAliveService } from '@/services/keepalive';

export const useKeepAlive = (enabled: boolean = true) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Ping immediately when hook is enabled
    keepAliveService.ping().catch(() => {
      // Silently handle errors - we don't want to break the UI
    });

    // Set up interval to ping every minute (60000 ms)
    intervalRef.current = setInterval(async () => {
      try {
        await keepAliveService.ping();
      } catch (error) {
        // Silently handle errors - we don't want to break the UI
        // Error logging is already handled in the service
      }
    }, 60000); // 60 seconds

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled]);

  const stopKeepAlive = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  return { stopKeepAlive };
}; 