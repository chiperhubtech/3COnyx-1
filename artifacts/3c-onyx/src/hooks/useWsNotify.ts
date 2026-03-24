/**
 * 3C Onyx — WebSocket Notification Hook
 *
 * Connects to the platform WS server, subscribes to the "notify" room,
 * and delivers real-time notifications to any component that uses it.
 *
 * Usage:
 *   const { notifications, unreadCount, markRead, clearAll } = useWsNotify();
 */
import { useState, useEffect, useRef, useCallback } from "react";

export interface WsNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  ts: string;
  read: boolean;
  data?: Record<string, unknown>;
}

interface UseWsNotifyReturn {
  notifications: WsNotification[];
  unreadCount: number;
  connected: boolean;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
}

let idCounter = 0;

export function useWsNotify(): UseWsNotifyReturn {
  const [notifications, setNotifications] = useState<WsNotification[]>([]);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    // Derive WS URL from current page origin + base path
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}${base}/ws`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      // Subscribe to notify room
      ws.send(JSON.stringify({ type: "subscribe", room: "notify" }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string);
        if (msg.type === "pong") return;
        if (msg.room !== "notify" && msg.type !== "broadcast") return;

        const payload = msg.payload ?? msg;
        if (!payload?.title) return;

        const notif: WsNotification = {
          id: `notif-${++idCounter}-${Date.now()}`,
          type: payload.type ?? "info",
          title: payload.title,
          body: payload.body ?? "",
          ts: payload.ts ?? new Date().toISOString(),
          read: false,
          data: payload,
        };

        setNotifications((prev) => [notif, ...prev].slice(0, 50)); // keep last 50
      } catch {
        // ignore parse errors
      }
    };

    ws.onclose = () => {
      setConnected(false);
      // Reconnect after 5 seconds
      reconnectRef.current = setTimeout(connect, 5000);
    };

    ws.onerror = () => {
      ws.close();
    };

    // Heartbeat
    const ping = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "ping" }));
      }
    }, 30000);

    ws.addEventListener("close", () => clearInterval(ping));
  }, []);

  useEffect(() => {
    connect();
    return () => {
      reconnectRef.current && clearTimeout(reconnectRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => setNotifications([]), []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, unreadCount, connected, markRead, markAllRead, clearAll };
}
