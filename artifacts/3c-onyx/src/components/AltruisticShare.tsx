import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Heart, Share2, QrCode, Link2, Copy, CheckCircle2,
  X, DollarSign, Users, TrendingUp, MessageCircle, Send,
} from "lucide-react";

const API = import.meta.env.BASE_URL.replace(/\/$/, "") + "/api";

interface AltruisticShareProps {
  visible: boolean;
  onDismiss: () => void;
  context?: string;
}

export function AltruisticShare({ visible, onDismiss, context }: AltruisticShareProps) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [earnings, setEarnings] = useState<{ totalPaid: number; totalPending: number; referralCount: number } | null>(null);

  const referralCode = (user as any)?.referralCode;
  const shareUrl = referralCode
    ? `${window.location.origin}/assist/${referralCode}`
    : `${window.location.origin}/join`;
  const firstName = user?.name?.split(" ")[0] ?? "Member";

  useEffect(() => {
    if (!visible || !user) return;
    const token = localStorage.getItem("onyxToken") || localStorage.getItem("3c_auth_token");
    fetch(`${API}/node/${(user as any).id}/earnings`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data) {
          setEarnings({
            totalPaid: data.earnings.totalPaid,
            totalPending: data.earnings.totalPending,
            referralCount: data.network.referralCount,
          });
        }
      })
      .catch(() => {});
  }, [visible, user]);

  if (!visible) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleNativeShare = () => {
    if (navigator.share) {
      navigator.share({
        title: "3C ONYX — Your Car. Handled.",
        text: `${firstName} helped solve a problem and you can too. Join ONYX.`,
        url: shareUrl,
      }).catch(() => {});
    } else {
      handleCopy();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-md mx-4 mb-4 sm:mb-0 rounded-2xl overflow-hidden border border-amber-500/30 bg-gradient-to-b from-zinc-900 to-black shadow-2xl shadow-amber-500/10 animate-in slide-in-from-bottom-4 duration-500">

        <div className="relative p-6 pb-4">
          <button
            onClick={onDismiss}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-zinc-800/80 flex items-center justify-center text-zinc-500 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
              <Heart className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg">
                You helped {context ? "solve this" : "someone today"}, {firstName}!
              </h3>
              <p className="text-xs text-zinc-500">Earn by helping someone else</p>
            </div>
          </div>

          {earnings && (
            <div className="grid grid-cols-3 gap-2 mb-5">
              <div className="bg-zinc-800/50 rounded-xl p-3 text-center border border-zinc-700/50">
                <DollarSign className="w-4 h-4 text-green-400 mx-auto mb-1" />
                <div className="text-sm font-bold text-green-400">${earnings.totalPaid.toFixed(0)}</div>
                <div className="text-[10px] text-zinc-500">Earned</div>
              </div>
              <div className="bg-zinc-800/50 rounded-xl p-3 text-center border border-zinc-700/50">
                <TrendingUp className="w-4 h-4 text-amber-400 mx-auto mb-1" />
                <div className="text-sm font-bold text-amber-400">${earnings.totalPending.toFixed(0)}</div>
                <div className="text-[10px] text-zinc-500">Pending</div>
              </div>
              <div className="bg-zinc-800/50 rounded-xl p-3 text-center border border-zinc-700/50">
                <Users className="w-4 h-4 text-blue-400 mx-auto mb-1" />
                <div className="text-sm font-bold text-blue-400">{earnings.referralCount}</div>
                <div className="text-[10px] text-zinc-500">Helped</div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <button
              onClick={handleNativeShare}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-black font-bold text-sm flex items-center justify-center gap-2 hover:from-amber-400 hover:to-amber-500 transition-all active:scale-[0.98]"
            >
              <Share2 className="w-4 h-4" />
              Share Your Link
            </button>

            <div className="grid grid-cols-5 gap-2">
              <button
                onClick={() => window.open(`sms:?body=${encodeURIComponent(`Join me on 3C ONYX! ${shareUrl}`)}`, "_blank")}
                className="py-3 rounded-xl border border-zinc-700 bg-zinc-900 text-sm font-medium flex flex-col items-center justify-center gap-1 hover:border-green-500/40 hover:bg-green-500/5 transition-colors"
                title="SMS"
              >
                <MessageCircle className="w-4 h-4 text-green-400" />
                <span className="text-[9px] text-zinc-500">SMS</span>
              </button>
              <button
                onClick={() => window.open(`https://www.tiktok.com/share?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(`Join 3C ONYX - your car, handled. 🚗`)}`, "_blank")}
                className="py-3 rounded-xl border border-zinc-700 bg-zinc-900 text-sm font-medium flex flex-col items-center justify-center gap-1 hover:border-pink-500/40 hover:bg-pink-500/5 transition-colors"
                title="TikTok"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V9.41a8.16 8.16 0 004.77 1.53V7.49a4.85 4.85 0 01-1-.8z" fill="#FF2D9A"/>
                </svg>
                <span className="text-[9px] text-zinc-500">TikTok</span>
              </button>
              <button
                onClick={() => window.open(`https://www.instagram.com/`, "_blank")}
                className="py-3 rounded-xl border border-zinc-700 bg-zinc-900 text-sm font-medium flex flex-col items-center justify-center gap-1 hover:border-purple-500/40 hover:bg-purple-500/5 transition-colors"
                title="Instagram"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="2" width="20" height="20" rx="5" stroke="#C13584" strokeWidth="2"/>
                  <circle cx="12" cy="12" r="5" stroke="#C13584" strokeWidth="2"/>
                  <circle cx="17.5" cy="6.5" r="1.5" fill="#C13584"/>
                </svg>
                <span className="text-[9px] text-zinc-500">IG</span>
              </button>
              <button
                onClick={handleCopy}
                className="py-3 rounded-xl border border-zinc-700 bg-zinc-900 text-sm font-medium flex flex-col items-center justify-center gap-1 hover:border-zinc-500/40 transition-colors"
                title="Copy Link"
              >
                {copied
                  ? <CheckCircle2 className="w-4 h-4 text-green-400" />
                  : <Copy className="w-4 h-4 text-zinc-400" />
                }
                <span className="text-[9px] text-zinc-500">{copied ? "Done" : "Copy"}</span>
              </button>
              <button
                onClick={() => setShowQR(!showQR)}
                className="py-3 rounded-xl border border-zinc-700 bg-zinc-900 text-sm font-medium flex flex-col items-center justify-center gap-1 hover:border-zinc-500/40 transition-colors"
                title="QR Code"
              >
                <QrCode className="w-4 h-4 text-zinc-400" />
                <span className="text-[9px] text-zinc-500">QR</span>
              </button>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Check out 3C ONYX! ${shareUrl}`)}`, "_blank")}
                className="flex-1 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 text-xs font-medium flex items-center justify-center gap-2 hover:border-green-600/40 hover:bg-green-600/5 transition-colors"
              >
                <Send className="w-3.5 h-3.5 text-green-500" />
                WhatsApp
              </button>
              <button
                onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent("Join 3C ONYX!")}`, "_blank")}
                className="flex-1 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 text-xs font-medium flex items-center justify-center gap-2 hover:border-blue-500/40 hover:bg-blue-500/5 transition-colors"
              >
                <Send className="w-3.5 h-3.5 text-blue-400" />
                Telegram
              </button>
            </div>
          </div>

          {showQR && (
            <div className="mt-4 p-4 bg-white rounded-xl flex flex-col items-center">
              <div className="w-32 h-32 bg-zinc-100 rounded-lg flex items-center justify-center mb-2">
                <div className="text-center">
                  <QrCode className="w-12 h-12 text-zinc-800 mx-auto mb-1" />
                  <div className="text-[8px] text-zinc-500 font-mono">{referralCode}</div>
                </div>
              </div>
              <div className="text-[10px] text-zinc-600 font-mono truncate max-w-full">{shareUrl}</div>
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-zinc-800/50 text-center">
          <p className="text-[10px] text-zinc-600 tracking-wider uppercase">
            3C ONYX — Every connection earns. Every action is verified.
          </p>
        </div>
      </div>
    </div>
  );
}

export function useAltruisticShare() {
  const [visible, setVisible] = useState(false);
  const [context, setContext] = useState<string | undefined>();

  const trigger = (ctx?: string) => {
    setContext(ctx);
    setVisible(true);
  };

  const dismiss = () => {
    setVisible(false);
    setContext(undefined);
  };

  return { visible, context, trigger, dismiss };
}
