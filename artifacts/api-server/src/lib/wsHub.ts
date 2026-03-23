/**
 * 3C Onyx — WebSocket Hub
 *
 * Real-time pub/sub for live features:
 *   - tracking  → Runner GPS position updates
 *   - alerts    → Guardian V2X / predictive failure alerts
 *   - prices    → MarketCheck auction price ticks
 *   - agents    → Agentic mesh status / decision feed
 *   - notify    → Member notification push
 *
 * Attach to an existing HTTP server via wsHub.attach(httpServer).
 * Broadcast to a room with wsHub.broadcast(room, payload).
 */
import { WebSocketServer, WebSocket } from "ws";
import type { Server as HttpServer } from "http";
import { logger } from "./logger";
import crypto from "crypto";

export type WsRoom = "tracking" | "alerts" | "prices" | "agents" | "notify";

interface WsClient {
  id: string;
  ws: WebSocket;
  rooms: Set<WsRoom>;
  connectedAt: string;
  lastPing: number;
}

interface WsMessage {
  type: "subscribe" | "unsubscribe" | "ping" | "broadcast";
  room?: WsRoom;
  data?: unknown;
}

const clients = new Map<string, WsClient>();
let wss: WebSocketServer | null = null;

export function attach(server: HttpServer): void {
  wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws) => {
    const clientId = crypto.randomUUID();
    const client: WsClient = {
      id: clientId,
      ws,
      rooms: new Set(),
      connectedAt: new Date().toISOString(),
      lastPing: Date.now(),
    };
    clients.set(clientId, client);
    logger.info({ clientId, total: clients.size }, "WS client connected");

    ws.send(JSON.stringify({ type: "welcome", clientId, ts: new Date().toISOString() }));

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw.toString()) as WsMessage;
        if (msg.type === "subscribe" && msg.room) {
          client.rooms.add(msg.room);
          ws.send(JSON.stringify({ type: "subscribed", room: msg.room }));
        } else if (msg.type === "unsubscribe" && msg.room) {
          client.rooms.delete(msg.room);
        } else if (msg.type === "ping") {
          client.lastPing = Date.now();
          ws.send(JSON.stringify({ type: "pong", ts: new Date().toISOString() }));
        }
      } catch {
        // ignore malformed messages
      }
    });

    ws.on("close", () => {
      clients.delete(clientId);
      logger.info({ clientId, total: clients.size }, "WS client disconnected");
    });

    ws.on("error", (err) => {
      logger.error({ clientId, err: err.message }, "WS client error");
      clients.delete(clientId);
    });
  });

  // Heartbeat — evict stale connections every 30s
  setInterval(() => {
    const staleMs = 90_000;
    for (const [id, client] of clients.entries()) {
      if (Date.now() - client.lastPing > staleMs) {
        client.ws.terminate();
        clients.delete(id);
      }
    }
  }, 30_000);

  logger.info("WebSocket hub attached at /ws");
}

export function broadcast(room: WsRoom, payload: unknown): void {
  const message = JSON.stringify({ room, data: payload, ts: new Date().toISOString() });
  let sent = 0;
  for (const client of clients.values()) {
    if (client.rooms.has(room) && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
      sent++;
    }
  }
  if (sent > 0) logger.debug({ room, sent }, "WS broadcast");
}

export function broadcastAll(payload: unknown): void {
  const message = JSON.stringify({ room: "all", data: payload, ts: new Date().toISOString() });
  for (const client of clients.values()) {
    if (client.ws.readyState === WebSocket.OPEN) client.ws.send(message);
  }
}

export function stats() {
  const roomCounts: Partial<Record<WsRoom, number>> = {};
  for (const client of clients.values()) {
    for (const room of client.rooms) {
      roomCounts[room] = (roomCounts[room] ?? 0) + 1;
    }
  }
  return { totalConnections: clients.size, rooms: roomCounts };
}
