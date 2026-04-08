import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Newspaper, MessageCircle, AlertTriangle, TrendingUp, Play,
  ExternalLink, ArrowUp, MessageSquare, Clock, Loader2,
  Search, RefreshCw, Flame, Zap, Radio, Shield,
  ChevronRight, Hash, Globe, Car, Tv, Filter,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");
const GOLD = "#C9A227";

interface FeedItem {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  sourceType: "news" | "social" | "recall" | "market" | "video";
  imageUrl?: string;
  author?: string;
  publishedAt: string;
  category: string;
  engagement?: { upvotes?: number; comments?: number };
}

interface TrendingTopic {
  topic: string;
  mentions: number;
}

function apiFetch(path: string) {
  const token = localStorage.getItem("3c_auth_token");
  return fetch(`${BASE}/api${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  }).then(async (r) => {
    const data = await r.json();
    if (!r.ok) throw new Error(data.error || "Request failed");
    return data;
  });
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

const SOURCE_ICONS: Record<string, { icon: typeof Newspaper; color: string }> = {
  news: { icon: Newspaper, color: "#60A5FA" },
  social: { icon: MessageCircle, color: "#F59E0B" },
  recall: { icon: AlertTriangle, color: "#EF4444" },
  market: { icon: TrendingUp, color: "#10B981" },
  video: { icon: Play, color: "#A78BFA" },
};

const CATEGORY_TABS = [
  { id: "all", label: "For You", icon: Zap },
  { id: "news", label: "News", icon: Newspaper },
  { id: "social", label: "Social", icon: MessageCircle },
  { id: "video", label: "Video", icon: Tv },
  { id: "recall", label: "Recalls", icon: Shield },
  { id: "EV & Tech", label: "EV & Tech", icon: Car },
];

function FeedCard({ item }: { item: FeedItem }) {
  const sourceInfo = SOURCE_ICONS[item.sourceType] || SOURCE_ICONS.news;
  const SourceIcon = sourceInfo.icon;

  const isRecall = item.sourceType === "recall";
  const isVideo = item.sourceType === "video";

  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "block", textDecoration: "none", color: "inherit",
        padding: "16px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        transition: "background 0.15s",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(255,255,255,0.02)"}
      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
    >
      <div style={{ display: "flex", gap: 14 }}>
        {item.imageUrl && !isRecall && (
          <div style={{
            width: isVideo ? 160 : 80, minWidth: isVideo ? 160 : 80,
            height: isVideo ? 90 : 80,
            borderRadius: 12, overflow: "hidden",
            background: "rgba(255,255,255,0.04)",
            flexShrink: 0, position: "relative",
          }}>
            <img
              src={item.imageUrl}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              loading="lazy"
            />
            {isVideo && (
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: "rgba(0,0,0,0.3)",
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: "rgba(255,255,255,0.9)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Play size={16} style={{ color: "#000", marginLeft: 2 }} fill="#000" />
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
            <SourceIcon size={12} style={{ color: sourceInfo.color }} />
            <span style={{
              fontSize: 11, fontWeight: 700, color: sourceInfo.color,
              letterSpacing: "0.02em",
            }}>
              {item.source}
            </span>
            {item.author && item.source !== item.author && (
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>
                · {item.author}
              </span>
            )}
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)" }}>
              · {timeAgo(item.publishedAt)}
            </span>
            {isRecall && (
              <span style={{
                fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 4,
                background: "rgba(239,68,68,0.15)", color: "#EF4444",
                letterSpacing: "0.08em",
              }}>
                SAFETY RECALL
              </span>
            )}
          </div>

          <h3 style={{
            fontSize: 15, fontWeight: 700, margin: "0 0 4px",
            color: isRecall ? "#EF4444" : "#fff",
            lineHeight: 1.35,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}>
            {item.title}
          </h3>

          {item.description && (
            <p style={{
              fontSize: 13, color: "rgba(255,255,255,0.4)", margin: 0,
              lineHeight: 1.5,
              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}>
              {item.description}
            </p>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
            <span style={{
              fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 6,
              background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.3)",
            }}>
              {item.category}
            </span>

            {item.engagement?.upvotes !== undefined && item.engagement.upvotes > 0 && (
              <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: "rgba(255,255,255,0.25)" }}>
                <ArrowUp size={10} />
                {item.engagement.upvotes >= 1000
                  ? `${(item.engagement.upvotes / 1000).toFixed(1)}k`
                  : item.engagement.upvotes}
              </span>
            )}
            {item.engagement?.comments !== undefined && item.engagement.comments > 0 && (
              <span style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: "rgba(255,255,255,0.25)" }}>
                <MessageSquare size={10} />
                {item.engagement.comments}
              </span>
            )}
          </div>
        </div>
      </div>
    </a>
  );
}

function TrendingSidebar({ topics, hotStories }: {
  topics: TrendingTopic[];
  hotStories: FeedItem[];
}) {
  return (
    <div style={{ width: 280, flexShrink: 0 }}>
      <div style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.06)",
        borderRadius: 16, overflow: "hidden", marginBottom: 16,
      }}>
        <div style={{
          padding: "14px 16px",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <Flame size={14} style={{ color: "#F59E0B" }} />
          <span style={{ fontSize: 12, fontWeight: 800, color: "#fff", letterSpacing: "0.06em" }}>
            TRENDING
          </span>
        </div>
        {topics.slice(0, 10).map((t, i) => (
          <div key={t.topic} style={{
            padding: "10px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.03)",
            display: "flex", alignItems: "center", gap: 10,
          }}>
            <span style={{
              fontSize: 11, fontWeight: 900, color: "rgba(255,255,255,0.15)",
              width: 18, textAlign: "right", fontFamily: "monospace",
            }}>
              {i + 1}
            </span>
            <div>
              <span style={{
                fontSize: 13, fontWeight: 700, color: "#fff",
                textTransform: "capitalize",
              }}>
                {t.topic}
              </span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", marginLeft: 6 }}>
                {t.mentions} mentions
              </span>
            </div>
          </div>
        ))}
      </div>

      {hotStories.length > 0 && (
        <div style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 16, overflow: "hidden",
        }}>
          <div style={{
            padding: "14px 16px",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <TrendingUp size={14} style={{ color: "#10B981" }} />
            <span style={{ fontSize: 12, fontWeight: 800, color: "#fff", letterSpacing: "0.06em" }}>
              HOT ON SOCIAL
            </span>
          </div>
          {hotStories.map(story => (
            <a
              key={story.id}
              href={story.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block", padding: "10px 16px", textDecoration: "none",
                borderBottom: "1px solid rgba(255,255,255,0.03)",
              }}
            >
              <p style={{
                fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.7)",
                margin: "0 0 4px", lineHeight: 1.4,
                display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}>
                {story.title}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10, color: "rgba(255,255,255,0.25)" }}>
                <span>{story.source}</span>
                {story.engagement?.upvotes && (
                  <span style={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <ArrowUp size={8} /> {story.engagement.upvotes >= 1000 ? `${(story.engagement.upvotes / 1000).toFixed(1)}k` : story.engagement.upvotes}
                  </span>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AutoPulse() {
  const { user } = useAuth();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [trending, setTrending] = useState<TrendingTopic[]>([]);
  const [hotStories, setHotStories] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [total, setTotal] = useState(0);
  const [sourceBreakdown, setSourceBreakdown] = useState<Record<string, number>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  const loadFeed = useCallback(async (cat: string, isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const catParam = cat === "all" ? "all" : cat;
      const data = await apiFetch(`/auto-pulse/feed?category=${encodeURIComponent(catParam)}&limit=40`);
      setItems(data.items || []);
      setTotal(data.total || 0);
      setSourceBreakdown(data.sourceBreakdown || {});
    } catch (err) {
      console.error("Feed load error:", err);
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  const loadTrending = useCallback(async () => {
    try {
      const data = await apiFetch("/auto-pulse/trending");
      setTrending(data.trending || []);
      setHotStories(data.hotStories || []);
    } catch {}
  }, []);

  useEffect(() => {
    loadFeed(activeTab);
    loadTrending();
  }, [activeTab, loadFeed, loadTrending]);

  const filteredItems = searchQuery.trim()
    ? items.filter(item =>
        (item.title + " " + item.description + " " + item.source)
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      )
    : items;

  return (
    <div style={{ background: "#050508", minHeight: "100vh", color: "#fff" }}>
      <div style={{
        background: "linear-gradient(180deg, rgba(201,162,39,0.04) 0%, transparent 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
        padding: "20px 24px 0",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <Radio size={16} style={{ color: GOLD }} />
                <h1 style={{
                  fontFamily: "'Barlow Condensed', sans-serif",
                  fontSize: 28, fontWeight: 900, margin: 0, color: "#fff",
                  letterSpacing: "-0.01em",
                }}>
                  Auto Pulse
                </h1>
                <div style={{
                  width: 8, height: 8, borderRadius: "50%",
                  background: "#10B981",
                  boxShadow: "0 0 8px rgba(16,185,129,0.5)",
                }} />
              </div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: 0 }}>
                Real-time automotive intelligence — news, social, recalls, and market trends
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
              {Object.entries(sourceBreakdown).map(([key, val]) => (
                <span key={key} style={{
                  fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6,
                  background: "rgba(255,255,255,0.04)", color: "rgba(255,255,255,0.3)",
                  letterSpacing: "0.04em",
                }}>
                  {val} {key}
                </span>
              ))}
              <button
                onClick={() => { loadFeed(activeTab, true); loadTrending(); }}
                disabled={refreshing}
                style={{
                  padding: "6px 12px", borderRadius: 8,
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                  color: "rgba(255,255,255,0.5)", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 700,
                }}
              >
                <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
                {refreshing ? "UPDATING..." : "REFRESH"}
              </button>
            </div>
          </div>

          <div style={{
            position: "relative", marginBottom: 16,
          }}>
            <Search size={16} style={{
              position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)",
              color: "rgba(255,255,255,0.2)",
            }} />
            <input
              ref={searchRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search automotive news, trends, and social content..."
              style={{
                width: "100%", padding: "12px 16px 12px 40px", borderRadius: 14,
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
                color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => e.target.style.borderColor = `${GOLD}40`}
              onBlur={(e) => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
            />
          </div>

          <div style={{
            display: "flex", gap: 2, overflow: "auto",
            paddingBottom: 0,
          }}>
            {CATEGORY_TABS.map(tab => {
              const TabIcon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: "10px 16px", borderRadius: "10px 10px 0 0",
                    fontSize: 12, fontWeight: 700, cursor: "pointer",
                    background: active ? "rgba(255,255,255,0.04)" : "transparent",
                    border: "none",
                    borderBottom: active ? `2px solid ${GOLD}` : "2px solid transparent",
                    color: active ? GOLD : "rgba(255,255,255,0.35)",
                    display: "flex", alignItems: "center", gap: 6,
                    transition: "all 0.15s",
                    whiteSpace: "nowrap",
                  }}
                >
                  <TabIcon size={13} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div style={{
        maxWidth: 1100, margin: "0 auto",
        display: "flex", gap: 24, padding: "0 24px",
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <Loader2 size={28} className="animate-spin" style={{ color: GOLD, marginBottom: 12 }} />
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>
                Scanning automotive sources...
              </p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <Globe size={32} style={{ color: "rgba(255,255,255,0.1)", marginBottom: 12 }} />
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.25)" }}>
                {searchQuery ? "No results match your search" : "No content available — try refreshing"}
              </p>
            </div>
          ) : (
            <div style={{
              background: "rgba(255,255,255,0.01)",
              border: "1px solid rgba(255,255,255,0.04)",
              borderRadius: 16, overflow: "hidden", marginTop: 16, marginBottom: 40,
            }}>
              {filteredItems.map(item => (
                <FeedCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>

        <div style={{ paddingTop: 16 }} className="pulse-sidebar">
          <TrendingSidebar topics={trending} hotStories={hotStories} />
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .pulse-sidebar { display: none !important; }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
