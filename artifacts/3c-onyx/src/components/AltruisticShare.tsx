import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Heart, Share2, QrCode, Link2, Copy, CheckCircle2,
  X, DollarSign, Users, TrendingUp
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

            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex-1 py-3 rounded-xl border border-zinc-700 bg-zinc-900 text-sm font-medium flex items-center justify-center gap-2 hover:border-zinc-600 transition-colors"
              >
                {copied
                  ? <><CheckCircle2 className="w-4 h-4 text-green-400" /> Copied!</>
                  : <><Copy className="w-4 h-4 text-zinc-400" /> Copy Link</>
                }
              </button>
              <button
                onClick={() => setShowQR(!showQR)}
                className="flex-1 py-3 rounded-xl border border-zinc-700 bg-zinc-900 text-sm font-medium flex items-center justify-center gap-2 hover:border-zinc-600 transition-colors"
              >
                <QrCode className="w-4 h-4 text-zinc-400" />
                QR Code
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
