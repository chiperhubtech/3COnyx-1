import { useState, useRef, useEffect, useCallback } from "react";
import { X, Sparkles, Send, ChevronDown, Car, Zap, MapPin, RotateCcw } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  streaming?: boolean;
}

interface Vehicle {
  id: string;
  make: string;
  model: string;
  year: number;
  vin: string;
  odometer: number;
}

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

const QUICK_CHIPS = [
  { label: "My car is acting up", icon: Car },
  { label: "Book a Runner", icon: MapPin },
  { label: "Check my car status", icon: Zap },
  { label: "Browse luxury inventory", icon: Sparkles },
];

function generateId() {
  return Math.random().toString(36).slice(2);
}

export function AIConcierge() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [garageVehicles, setGarageVehicles] = useState<Vehicle[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [pulse, setPulse] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setPulse(false), 5000);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    fetch(`${BASE}/api/garage/vehicles`)
      .then((r) => r.json())
      .then((d: { vehicles: Vehicle[] }) => setGarageVehicles(d.vehicles ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (open && conversationId === null) {
      initConversation();
    }
  }, [open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  async function initConversation() {
    try {
      const res = await fetch(`${BASE}/api/gemini/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Concierge Session" }),
      });
      const data = await res.json();
      setConversationId(data.id);
      setMessages([
        {
          id: generateId(),
          role: "assistant",
          content:
            garageVehicles.length > 0
              ? `Welcome back. I can see you have ${garageVehicles.length} vehicle${garageVehicles.length > 1 ? "s" : ""} in your garage — your ${garageVehicles.map((v) => `${v.year} ${v.make} ${v.model}`).join(" and ")}. How can I assist you today?`
              : "Welcome to 3C Onyx. I'm your personal concierge for luxury automotive services. How can I assist you today?",
        },
      ]);
    } catch {
      setMessages([
        {
          id: generateId(),
          role: "assistant",
          content: "Welcome to 3C Onyx. I'm your personal concierge. How can I assist you today?",
        },
      ]);
    }
  }

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming || conversationId === null) return;

      const userMsg: Message = { id: generateId(), role: "user", content: text };
      const assistantMsg: Message = { id: generateId(), role: "assistant", content: "", streaming: true };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setInput("");
      setIsStreaming(true);

      try {
        const res = await fetch(`${BASE}/api/gemini/conversations/${conversationId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: text, garageVehicles }),
        });

        if (!res.ok || !res.body) throw new Error("Stream failed");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const payload = JSON.parse(line.slice(6));
              if (payload.done) break;
              if (payload.content) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMsg.id
                      ? { ...m, content: m.content + payload.content }
                      : m
                  )
                );
              }
            } catch {
              // skip malformed
            }
          }
        }
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id
              ? { ...m, content: "I'm having trouble connecting. Please try again in a moment." }
              : m
          )
        );
      } finally {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsg.id ? { ...m, streaming: false } : m
          )
        );
        setIsStreaming(false);
      }
    },
    [conversationId, garageVehicles, isStreaming]
  );

  function handleReset() {
    setConversationId(null);
    setMessages([]);
    initConversation();
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open AI Concierge"
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center rounded-full shadow-2xl transition-all duration-300 hover:scale-110 focus:outline-none"
        style={{
          width: 56,
          height: 56,
          background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
          boxShadow: pulse
            ? "0 0 0 0 rgba(245,158,11,0.7)"
            : "0 8px 32px rgba(245,158,11,0.4)",
          animation: pulse ? "concierge-pulse 1.5s ease-out 3" : undefined,
        }}
      >
        {open ? (
          <ChevronDown className="text-black" size={22} />
        ) : (
          <Sparkles className="text-black" size={22} />
        )}
      </button>

      <div
        className="fixed bottom-[80px] right-6 z-50 flex flex-col transition-all duration-300 origin-bottom-right"
        style={{
          width: 380,
          maxWidth: "calc(100vw - 24px)",
          height: 540,
          maxHeight: "calc(100vh - 120px)",
          transform: open ? "scale(1)" : "scale(0)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          borderRadius: 16,
          background: "#111111",
          border: "1px solid rgba(245,158,11,0.3)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(245,158,11,0.1)",
          overflow: "hidden",
        }}
      >
        <div
          className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{
            background: "linear-gradient(90deg, #1a1400 0%, #1c1205 100%)",
            borderBottom: "1px solid rgba(245,158,11,0.2)",
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="flex items-center justify-center rounded-full"
              style={{ width: 32, height: 32, background: "rgba(245,158,11,0.15)" }}
            >
              <Sparkles size={14} style={{ color: "#F59E0B" }} />
            </div>
            <div>
              <div className="text-white font-semibold text-sm leading-none">Onyx Concierge</div>
              <div className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
                Powered by Gemini
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleReset}
              title="New conversation"
              className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
            >
              <RotateCcw size={14} style={{ color: "#9CA3AF" }} />
            </button>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg transition-colors hover:bg-white/10"
            >
              <X size={14} style={{ color: "#9CA3AF" }} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ scrollbarWidth: "none" }}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div
                  className="flex items-end justify-center rounded-full mr-2 shrink-0"
                  style={{
                    width: 24,
                    height: 24,
                    background: "rgba(245,158,11,0.15)",
                    alignSelf: "flex-end",
                    marginBottom: 2,
                  }}
                >
                  <Sparkles size={11} style={{ color: "#F59E0B" }} />
                </div>
              )}
              <div
                className="max-w-[75%] px-3 py-2 text-sm leading-relaxed"
                style={{
                  borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                  background: msg.role === "user"
                    ? "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)"
                    : "rgba(255,255,255,0.06)",
                  color: msg.role === "user" ? "#000" : "#E5E7EB",
                  fontWeight: msg.role === "user" ? 500 : 400,
                }}
              >
                {msg.content || (
                  <span className="flex gap-1 items-center">
                    <span className="typing-dot" />
                    <span className="typing-dot" style={{ animationDelay: "0.2s" }} />
                    <span className="typing-dot" style={{ animationDelay: "0.4s" }} />
                  </span>
                )}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        {messages.length <= 1 && (
          <div className="px-3 pb-2 flex gap-2 flex-wrap shrink-0">
            {QUICK_CHIPS.map(({ label, icon: Icon }) => (
              <button
                key={label}
                onClick={() => sendMessage(label)}
                disabled={isStreaming}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all hover:scale-105 disabled:opacity-50"
                style={{
                  background: "rgba(245,158,11,0.1)",
                  border: "1px solid rgba(245,158,11,0.3)",
                  color: "#F59E0B",
                }}
              >
                <Icon size={11} />
                {label}
              </button>
            ))}
          </div>
        )}

        <div
          className="px-3 pb-3 pt-2 shrink-0"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <div
            className="flex items-center gap-2 rounded-xl px-3 py-2"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(245,158,11,0.2)",
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
              disabled={isStreaming}
              placeholder="Ask your concierge…"
              className="flex-1 bg-transparent text-sm text-white placeholder-gray-500 outline-none disabled:opacity-50"
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isStreaming}
              className="flex items-center justify-center rounded-lg transition-all hover:scale-110 disabled:opacity-30"
              style={{
                width: 28,
                height: 28,
                background: input.trim() && !isStreaming
                  ? "linear-gradient(135deg, #F59E0B, #D97706)"
                  : "rgba(255,255,255,0.1)",
              }}
            >
              <Send size={13} style={{ color: input.trim() && !isStreaming ? "#000" : "#6B7280" }} />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes concierge-pulse {
          0% { box-shadow: 0 0 0 0 rgba(245,158,11,0.7); }
          70% { box-shadow: 0 0 0 18px rgba(245,158,11,0); }
          100% { box-shadow: 0 0 0 0 rgba(245,158,11,0); }
        }
        .typing-dot {
          display: inline-block;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #9CA3AF;
          animation: typing-bounce 1.2s infinite;
        }
        @keyframes typing-bounce {
          0%, 60%, 100% { transform: translateY(0); }
          30% { transform: translateY(-4px); }
        }
      `}</style>
    </>
  );
}
