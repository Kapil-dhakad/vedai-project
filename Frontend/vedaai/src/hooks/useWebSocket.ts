'use client';
import { useEffect, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/store';
import { setGenerationStatus, updateAssignmentStatus, fetchPaper } from '@/store/assignmentSlice';
import { WSEvent } from '@/types';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:5000/ws';
const RECONNECT_DELAY = 3000;
const MAX_RECONNECTS = 5; // reduced: stop spamming if backend is down

export const useWebSocket = (assignmentId?: string) => {
  const dispatch = useDispatch<AppDispatch>();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectCount = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isUnmounted = useRef(false);
  const isConnecting = useRef(false);

  const handleEvent = useCallback(
    (event: WSEvent) => {
      if (!event.assignmentId) return;

      switch (event.type) {
        case 'status':
          dispatch(
            setGenerationStatus({
              status:
                (event.status as 'pending' | 'processing' | 'completed' | 'failed') ||
                'processing',
              progress: event.progress,
              message: event.message,
            })
          );
          dispatch(
            updateAssignmentStatus({
              id: event.assignmentId,
              status: event.status as 'pending' | 'processing' | 'completed' | 'failed',
            })
          );
          if (event.status === 'completed' && event.paperId) {
            dispatch(fetchPaper(event.assignmentId));
          }
          break;

        case 'error':
          dispatch(
            setGenerationStatus({
              status: 'failed',
              message: event.message || 'Generation failed',
            })
          );
          dispatch(
            updateAssignmentStatus({ id: event.assignmentId, status: 'failed' })
          );
          break;

        default:
          break;
      }
    },
    [dispatch]
  );

  const connect = useCallback(() => {
    if (isUnmounted.current) return;
    if (isConnecting.current) return;

    const state = wsRef.current?.readyState;
    if (state === WebSocket.OPEN || state === WebSocket.CONNECTING) return;

    if (reconnectCount.current >= MAX_RECONNECTS) {
      console.warn(`⚠️  WebSocket: max reconnect attempts (${MAX_RECONNECTS}) reached. Backend may be offline.`);
      return;
    }

    isConnecting.current = true;
    console.log(`🔌 WebSocket connecting to ${WS_URL} (attempt ${reconnectCount.current + 1})`);

    let ws: WebSocket;
    try {
      ws = new WebSocket(WS_URL);
    } catch (err) {
      console.error('❌ WebSocket: invalid URL', WS_URL, err);
      isConnecting.current = false;
      return;
    }

    wsRef.current = ws;

    ws.onopen = () => {
      isConnecting.current = false;
      reconnectCount.current = 0;
      console.log('✅ WebSocket connected');

      if (assignmentId) {
        ws.send(JSON.stringify({ type: 'subscribe', assignmentId }));
      }
    };

    ws.onmessage = (e: MessageEvent) => {
      try {
        const event: WSEvent = JSON.parse(e.data as string);
        handleEvent(event);
      } catch {
        console.warn('⚠️  WebSocket: could not parse message:', e.data);
      }
    };

    ws.onclose = (e: CloseEvent) => {
      isConnecting.current = false;
      if (isUnmounted.current) return;

      if (e.code === 1000 || e.code === 1001) return;

      console.log(`🔌 WebSocket closed (code ${e.code}). Reconnecting in ${RECONNECT_DELAY}ms…`);
      reconnectCount.current += 1;

      if (reconnectCount.current < MAX_RECONNECTS) {
        reconnectTimer.current = setTimeout(connect, RECONNECT_DELAY);
      } else {
        console.warn('⚠️  WebSocket: giving up reconnecting. Make sure the backend is running at', WS_URL);
      }
    };

    ws.onerror = () => {
      const attempt = reconnectCount.current + 1;
      if (attempt === 1) {
        console.warn(
          `⚠️  WebSocket: could not connect to ${WS_URL}.\n` +
          `   Make sure the backend is running: cd Backend && npm run dev`
        );
      }
    };
  }, [assignmentId, handleEvent]);

  useEffect(() => {
    isUnmounted.current = false;
    reconnectCount.current = 0; // reset on mount
    connect();

    return () => {
      isUnmounted.current = true;
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);

      if (wsRef.current) {
        wsRef.current.close(1000, 'component unmounted');
        wsRef.current = null;
      }
    };
  }, [connect]);

  const subscribe = useCallback((id: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'subscribe', assignmentId: id }));
    }
  }, []);

  return { subscribe };
};
