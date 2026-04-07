import { useEffect, useRef, useCallback, useState } from 'react';
import { WSMessage } from '../types';

export type WSStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseWebSocketOptions {
  onMessage: (msg: WSMessage) => void;
  url?: string;
}

const DEFAULT_WS_URL =
  typeof window !== 'undefined'
    ? `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/ws`
    : 'ws://localhost:3001/ws';

export function useWebSocket({ onMessage, url = DEFAULT_WS_URL }: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onMessageRef = useRef(onMessage);
  onMessageRef.current = onMessage;

  const [status, setStatus] = useState<WSStatus>('connecting');

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(url);
    wsRef.current = ws;
    setStatus('connecting');

    ws.onopen = () => setStatus('connected');

    ws.onmessage = (event) => {
      try {
        const msg: WSMessage = JSON.parse(event.data);
        onMessageRef.current(msg);
      } catch {
        console.error('[ws] Failed to parse message', event.data);
      }
    };

    ws.onclose = () => {
      setStatus('disconnected');
      reconnectTimerRef.current = setTimeout(connect, 2000);
    };

    ws.onerror = () => {
      setStatus('error');
      ws.close();
    };
  }, [url]);

  const send = useCallback((data: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  const subscribe = useCallback(
    (symbols: string[]) => send({ type: 'subscribe', symbols }),
    [send],
  );

  const unsubscribe = useCallback(
    (symbols: string[]) => send({ type: 'unsubscribe', symbols }),
    [send],
  );

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { status, subscribe, unsubscribe };
}
