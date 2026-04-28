import { useEffect, useRef } from 'react';
import { ScanEvent } from '@cerberus/shared';

/**
 * Subscribe to real-time scan events via Server-Sent Events.
 */
export function useScanEvents(
  scanId: string,
  onEvent: (event: ScanEvent) => void
): void {
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!scanId) return;

    const apiBase = import.meta.env.VITE_API_URL
      ? `${import.meta.env.VITE_API_URL}/api`
      : '/api';
    const url = `${apiBase}/scans/${scanId}/events`;
    const es = new EventSource(url);

    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data) as ScanEvent;
        onEventRef.current(event);

        // Close stream when scan is done
        if (event.type === 'scan:completed' || event.type === 'scan:failed') {
          es.close();
        }
      } catch {
        // Malformed event — skip
      }
    };

    es.onerror = () => {
      // SSE connection error — browser will auto-reconnect
    };

    return () => {
      es.close();
    };
  }, [scanId]);
}
