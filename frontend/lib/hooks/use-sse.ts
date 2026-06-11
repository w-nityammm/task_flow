'use client';

import { useEffect, useRef, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api/v1';

interface SSEEvent<T = unknown> {
  type: string;
  payload: T;
}

export function useSSE(onEvent: (event: SSEEvent) => void) {
  const esRef = useRef<EventSource | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  const connect = useCallback(() => {
    if (esRef.current) esRef.current.close();

    const es = new EventSource(`${API_URL}/tasks/stream`, { withCredentials: true });
    esRef.current = es;

    es.onmessage = (e) => {
      try {
        const event = JSON.parse(e.data) as SSEEvent;
        onEventRef.current(event);
      } catch {
        // ignore malformed events
      }
    };

    es.onerror = () => {
      es.close();
      // Auto-reconnect after 3 seconds
      setTimeout(connect, 3000);
    };
  }, []);

  useEffect(() => {
    connect();
    return () => esRef.current?.close();
  }, [connect]);
}
