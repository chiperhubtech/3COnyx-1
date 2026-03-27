/**
 * AgentFeed — Live stream of AI agent activity
 * Simulates the orchestration layer in real time.
 * Shows what ONYX's brain is doing at any moment.
 */
import { useState, useEffect, useRef } from "react";
import { Brain, Zap, Shield, BarChart3, Route, Cpu, Search, Lock, Truck, DollarSign } from "lucide-react";

interface AgentEvent {
  id: string;
  agent: string;
  action: string;
  detail: string;
  color: string;
  icon: any;
  ts: Date;
}

const AGENT_POOL: Omit<AgentEvent, "id" | "action" | "ts">[] = [
  { agent: "PRICING",   detail: "Comparing 47 dealer listings",            color: "#C9A227", icon: DollarSign },
  { agent: "MARKET",    detail: "Ingesting live auction feed",              color: "#60A5FA", icon: BarChart3  },
  { agent: "GUARDIAN",  detail: "V2X anomaly scan — all clear",             color: "#34D399", icon: Shield     },
  { agent: "ROUTE",     detail: "Optimizing I-95 corridor delivery",        color: "#A78BFA", icon: Route      },
  { agent: "INSPECT",   detail: "SHA-256 condition digest committed",       color: "#F97316", icon: Search     },
  { agent: "FINANCE",   detail: "Finance hub sync completed",               color: "#4FC3F7", icon: Zap        },
  { agent: "TRUST",     detail: "Reputation mesh — Provider score 97%",    color: "#34D399", icon: Lock       },
  { agent: "ONYX",      detail: "Routing to Specialist network",            color: "#C9A227", icon: Brain      },
  { agent: "LOGISTICS", detail: "Runner dispatched — ETA 18 min",          color: "#A78BFA", icon: Truck      },
  { agent: "AUDIT",     detail: "Immutable log entry written",              color: "#818CF8", icon: Cpu        },
  { agent: "CUSTODY",   detail: "Ethereum anchor confirmed — block 19.4M", color: "#60A5FA", icon: Lock       },
  { agent: "MARKET",    detail: "Target price alert triggered",             color: "#60A5FA", icon: BarChart3  },
  { agent: "GUARDIAN",  detail: "Insurance premium optimized -$340/yr",    color: "#34D399", icon: Shield     },
  { agent: "PRICING",   detail: "Ignorance Tax avoided — $2,140 saved",    color: "#C9A227", icon: DollarSign },
  { agent: "ROUTE",     detail: "Live GPS handshake — Runner in range",    color: "#A78BFA", icon: Route      },
];

const ACTIONS = ["dispatched", "completed", "analyzing", "confirmed", "syncing", "scanning", "routing"];

let idCounter = 0;
function makeEvent(): AgentEvent {
  const pool = AGENT_POOL[Math.floor(Math.random() * AGENT_POOL.length)];
  const action = ACTIONS[Math.floor(Math.random() * ACTIONS.length)];
  return { ...pool, id: String(++idCounter), action, ts: new Date() };
}

function timeSince(d: Date): string {
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 5)  return "just now";
  if (s < 60) return `${s}s ago`;
  return `${Math.floor(s / 60)}m ago`;
}

export function AgentFeed() {
  const [events, setEvents] = useState<AgentEvent[]>(() =>
    Array.from({ length: 6 }, makeEvent).map((e, i) => ({
      ...e,
      ts: new Date(Date.now() - (6 - i) * 4000),
    }))
  );
  const [tick, setTick] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  // Auto-generate new events
  useEffect(() => {
    const interval = setInterval(() => {
      setEvents((prev) => [makeEvent(), ...prev].slice(0, 12));
      setTick((t) => t + 1);
    }, 3200 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, []);

  // Force re-render for time labels
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }} ref={listRef}>
      {events.slice(0, 8).map((e, i) => {
        const Icon = e.icon;
        const isNew = i === 0;
        return (
          <div
            key={e.id}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              padding: "8px 0",
              borderBottom: "1px solid rgba(255,255,255,0.04)",
              opacity: isNew ? 1 : Math.max(0.3, 1 - i * 0.1),
              animation: isNew ? "feed-in 0.4s cubic-bezier(0.34,1.56,0.64,1)" : undefined,
              transition: "opacity 0.5s",
            }}
          >
            <div style={{
              width: 26, height: 26, borderRadius: 8, flexShrink: 0, marginTop: 1,
              background: `${e.color}14`, border: `1px solid ${e.color}28`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon size={11} style={{ color: e.color }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <span style={{ fontSize: 9, fontWeight: 800, color: e.color, letterSpacing: "0.1em", fontFamily: "'Barlow Condensed', sans-serif" }}>
                  {e.agent}
                </span>
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", letterSpacing: "0.06em" }}>{e.action}</span>
              </div>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", lineHeight: 1.4, margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {e.detail}
              </p>
            </div>
            <span style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", flexShrink: 0, marginTop: 2, fontFamily: "monospace" }}>
              {timeSince(e.ts)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
