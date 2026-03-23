/**
 * 3C Onyx — WebSocket Hook
 *
 * Connects to the 3C Onyx WebSocket hub at /ws.
 * Supports room subscriptions: tracking, alerts, prices, agents, notify.
 *
 * Usage:
 *   const { connected, lastMessage, subscribe, broadcast } = useSocket("tracking");
 */
import { useEffect, useRef, useState, useCallback } from "react";

export type WsRoom = "tracking" | "alerts" | "prices" | "agents" | "notify";

export interface WsPayload {
  room: WsRoom | "all";
  data: unknown;
  ts: string;
}

interface UseSocketReturn {
  connected: boolean;
  clientId: string | null;
  lastMessage: WsPayload | null;
  messages: WsPayload[];
  subscribe: (room: WsRoom) => void;
  unsubscribe: (room: WsRoom) => void;
  ping: () => void;
}

const WS_URL = (() => {
  const base = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";
  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  const host = window.location.host;
  return `${proto}://${host}${base}/ws`;
})();

const MAX_MESSAGES = 50;

export function useSocket(initialRoom?: WsRoom): UseSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<WsPayload | null>(null);
  const [messages, setMessages] = useState<WsPayload[]>([]);
  const subscribedRooms = useRef<Set<WsRoom>>(new Set(initialRoom ? [initialRoom] : []));
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmounted = useRef(false);

  const send = useCallback((data: object) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  const subscribe = useCallback((room: WsRoom) => {
    subscribedRooms.current.add(room);
    send({ type: "subscribe", room });
  }, [send]);

  const unsubscribe = useCallback((room: WsRoom) => {
    subscribedRooms.current.delete(room);
    send({ type: "unsubscribe", room });
  }, [send]);

  const ping = useCallback(() => send({ type: "ping" }), [send]);

  const connect = useCallback(() => {
    if (unmounted.current) return;

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnected(true);
        for (const room of subscribedRooms.current) {
          ws.send(JSON.stringify({ type: "subscribe", room }));
        }
      };

      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data as string);
          if (msg.type === "welcome") {
            setClientId(msg.clientId);
            return;
          }
          if (msg.type === "pong") return;
          const payload = msg as WsPayload;
          setLastMessage(payload);
          setMessages(prev => [payload, ...prev].slice(0, MAX_MESSAGES));
        } catch {
          // ignore malformed
        }
      };

      ws.onclose = () => {
        setConnected(false);
        wsRef.current = null;
        if (!unmounted.current) {
          reconnectTimer.current = setTimeout(connect, 3_000);
        }
      };

      ws.onerror = () => {
        ws.close();
      };
    } catch {
      reconnectTimer.current = setTimeout(connect, 5_000);
    }
  }, []);

  useEffect(() => {
    unmounted.current = false;
    connect();

    const pingInterval = setInterval(ping, 30_000);

    return () => {
      unmounted.current = true;
      clearInterval(pingInterval);
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect, ping]);

  return { connected, clientId, lastMessage, messages, subscribe, unsubscribe, ping };
}
