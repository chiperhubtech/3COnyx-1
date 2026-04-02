import { useState, useRef, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useSeasonalTheme, THEME_OPTIONS, type SeasonalMode } from "@/context/SeasonalThemeContext";
import { useToast } from "@/hooks/use-toast";
import {
  Download, Share2, Copy, Check, Sparkles, ChevronLeft, ChevronRight,
} from "lucide-react";

const BADGE_THEMES: {
  id: SeasonalMode | "none";
  label: string;
  icon: string;
  accent: string;
  bg: string;
  ring: string;
  emojis: string[];
}[] = [
  { id: "none",           label: "Classic Gold",      icon: "✨",  accent: "#C9A227", bg: "#0a0a0f", ring: "#C9A227", emojis: ["✨","⚡","💎","🏆"] },
  { id: "easter",         label: "Easter",            icon: "🐣",  accent: "#A78BFA", bg: "#faf5ff", ring: "#A78BFA", emojis: ["🐣","🐰","🌷","🥚","🌸","🪺"] },
  { id: "christmas",      label: "Christmas",         icon: "🎄",  accent: "#DC2626", bg: "#0f1a0f", ring: "#DC2626", emojis: ["🎄","🎅","⛄","🦌","🎁","❄️"] },
  { id: "halloween",      label: "Halloween",         icon: "🎃",  accent: "#F97316", bg: "#1a0f1a", ring: "#F97316", emojis: ["🎃","👻","🦇","💀","🕷️","🧙"] },
  { id: "july4th",        label: "4th of July",       icon: "🇺🇸", accent: "#3B82F6", bg: "#0f0f1a", ring: "#EF4444", emojis: ["🇺🇸","🎆","🗽","🦅","⭐","🎇"] },
  { id: "valentines",     label: "Valentine's Day",   icon: "💕",  accent: "#EC4899", bg: "#1a0f14", ring: "#EC4899", emojis: ["💕","❤️","💘","🌹","💝","😍"] },
  { id: "thanksgiving",   label: "Thanksgiving",      icon: "🦃",  accent: "#D97706", bg: "#1a140f", ring: "#D97706", emojis: ["🦃","🍂","🌽","🥧","🍁","🌻"] },
  { id: "stpatricks",     label: "St. Patrick's Day", icon: "☘️",  accent: "#22C55E", bg: "#0f1a0f", ring: "#22C55E", emojis: ["☘️","🍀","🌈","🪙","💚","🎩"] },
  { id: "cincodemayo",    label: "Cinco de Mayo",     icon: "🪅",  accent: "#EF4444", bg: "#1a0f0f", ring: "#22C55E", emojis: ["🪅","🌮","🎊","💃","🇲🇽","🌶️"] },
  { id: "chinesenewyear", label: "Chinese New Year",  icon: "🧧",  accent: "#DC2626", bg: "#1a0f0f", ring: "#DC2626", emojis: ["🧧","🐉","🧨","🏮","🎆","🎊"] },
  { id: "newyears",       label: "New Year's Eve",    icon: "🎆",  accent: "#C9A227", bg: "#0f0f1a", ring: "#C9A227", emojis: ["🎆","🥂","🎊","🎉","⏰","🍾"] },
  { id: "mardigras",      label: "Mardi Gras",        icon: "🎭",  accent: "#A855F7", bg: "#1a0f1a", ring: "#22C55E", emojis: ["🎭","👑","🎺","⚜️","🎪","💜"] },
  { id: "diwali",         label: "Diwali",            icon: "🪔",  accent: "#F59E0B", bg: "#1a140f", ring: "#F59E0B", emojis: ["🪔","🎇","✨","🎆","🌟","🕉️"] },
  { id: "birthday",       label: "Birthday",          icon: "🎂",  accent: "#EC4899", bg: "#1a0f1a", ring: "#A855F7", emojis: ["🎂","🎈","🎉","🥳","🎁","🪩"] },
];

const CUSTOM_EMOJIS = ["🏎️","🚗","🏁","🔥","💰","🛡️","⚙️","🌟","💪","👊","🤝","🏆","💎","⭐","🔑","🚀"];

const ROLE_LABELS: Record<string, string> = {
  Member: "CLUB MEMBER",
  Dealer: "DEALER PARTNER",
  Runner: "CERTIFIED RUNNER",
  Specialist: "SPECIALIST",
  Admin: "PLATFORM ADMIN",
};

export default function ARBadgePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { season } = useSeasonalTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const initialThemeIdx = BADGE_THEMES.findIndex(t => t.id === season);
  const [selectedThemeIdx, setSelectedThemeIdx] = useState(Math.max(0, initialThemeIdx));
  const [selectedEmojis, setSelectedEmojis] = useState<string[]>([]);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [copied, setCopied] = useState(false);
  const [rendering, setRendering] = useState(false);

  const theme = BADGE_THEMES[selectedThemeIdx];
  const profileUrl = useMemo(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const base = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
    const code = user?.referralCode || `user-${user?.id || 0}`;
    return `${origin}${base}/m/${encodeURIComponent(code)}`;
  }, [user]);

  const displayName = user?.name || "Member";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase();
  const roleLabel = ROLE_LABELS[user?.role || "Member"] || "CLUB MEMBER";

  const toggleEmoji = (emoji: string) => {
    setSelectedEmojis(prev =>
      prev.includes(emoji) ? prev.filter(e => e !== emoji) : prev.length < 6 ? [...prev, emoji] : prev
    );
  };

  const prevTheme = () => setSelectedThemeIdx(i => (i - 1 + BADGE_THEMES.length) % BADGE_THEMES.length);
  const nextTheme = () => setSelectedThemeIdx(i => (i + 1) % BADGE_THEMES.length);

  const renderBadgeToCanvas = useCallback((): Promise<HTMLCanvasElement> => {
    return new Promise(async (resolve) => {
      const canvas = canvasRef.current || document.createElement("canvas");
      const W = 800, H = 1000;
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d")!;

      ctx.fillStyle = theme.bg;
      ctx.fillRect(0, 0, W, H);

      ctx.strokeStyle = theme.ring;
      ctx.lineWidth = 4;
      const rr = 32;
      ctx.beginPath();
      ctx.moveTo(rr + 20, 20);
      ctx.lineTo(W - rr - 20, 20);
      ctx.quadraticCurveTo(W - 20, 20, W - 20, 20 + rr);
      ctx.lineTo(W - 20, H - rr - 20);
      ctx.quadraticCurveTo(W - 20, H - 20, W - rr - 20, H - 20);
      ctx.lineTo(rr + 20, H - 20);
      ctx.quadraticCurveTo(20, H - 20, 20, H - rr - 20);
      ctx.lineTo(20, 20 + rr);
      ctx.quadraticCurveTo(20, 20, 20 + rr, 20);
      ctx.closePath();
      ctx.stroke();

      ctx.strokeStyle = `${theme.accent}40`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(rr + 28, 28);
      ctx.lineTo(W - rr - 28, 28);
      ctx.quadraticCurveTo(W - 28, 28, W - 28, 28 + rr);
      ctx.lineTo(W - 28, H - rr - 28);
      ctx.quadraticCurveTo(W - 28, H - 28, W - rr - 28, H - 28);
      ctx.lineTo(rr + 28, H - 28);
      ctx.quadraticCurveTo(28, H - 28, 28, H - rr - 28);
      ctx.lineTo(28, 28 + rr);
      ctx.quadraticCurveTo(28, 28, 28 + rr, 28);
      ctx.closePath();
      ctx.stroke();

      const scattered = [...theme.emojis, ...selectedEmojis];
      ctx.font = "28px serif";
      ctx.globalAlpha = 0.15;
      for (let i = 0; i < 20; i++) {
        const emoji = scattered[i % scattered.length];
        const x = 40 + Math.random() * (W - 80);
        const y = 40 + Math.random() * (H - 80);
        ctx.fillText(emoji, x, y);
      }
      ctx.globalAlpha = 1;

      ctx.font = "bold 14px 'Barlow Condensed', 'Inter', sans-serif";
      ctx.fillStyle = theme.accent;
      ctx.textAlign = "center";
      ctx.fillText("CUXTOMCANDYCLUB LLC", W / 2, 65);

      const peaceR = 48;
      const logoCx = W / 2;
      const logoCy = 180;

      const grad = ctx.createRadialGradient(logoCx, logoCy, 0, logoCx, logoCy, peaceR + 20);
      grad.addColorStop(0, `${theme.accent}33`);
      grad.addColorStop(1, `${theme.accent}00`);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(logoCx, logoCy, peaceR + 20, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = theme.ring;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(logoCx, logoCy, peaceR, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = theme.accent;
      ctx.lineWidth = 3.5;
      const RAD = Math.PI / 180;
      ctx.beginPath();
      ctx.moveTo(logoCx, logoCy - peaceR);
      ctx.lineTo(logoCx, logoCy + peaceR);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(logoCx, logoCy);
      ctx.lineTo(logoCx + peaceR * Math.cos(210 * RAD), logoCy + peaceR * Math.sin(210 * RAD));
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(logoCx, logoCy);
      ctx.lineTo(logoCx + peaceR * Math.cos(330 * RAD), logoCy + peaceR * Math.sin(330 * RAD));
      ctx.stroke();

      ctx.font = "bold 26px 'Barlow Condensed', 'Inter', sans-serif";
      ctx.fillStyle = theme.accent;
      ctx.textAlign = "center";
      ctx.fillText("3", logoCx - 16, logoCy + 8);
      ctx.fillStyle = theme.id === "easter" ? "#374151" : "#FFFFFF";
      ctx.fillText("C", logoCx + 16, logoCy + 8);

      const avatarY = 295;
      const avatarR = 50;
      const drawInitialsFallback = () => {
        ctx.save();
        ctx.strokeStyle = theme.ring;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(W / 2, avatarY, avatarR + 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(W / 2, avatarY, avatarR, 0, Math.PI * 2);
        ctx.clip();
        ctx.fillStyle = `${theme.accent}22`;
        ctx.fillRect(W / 2 - avatarR, avatarY - avatarR, avatarR * 2, avatarR * 2);
        ctx.font = "bold 36px 'Barlow Condensed', sans-serif";
        ctx.fillStyle = theme.accent;
        ctx.textAlign = "center";
        ctx.fillText(initials, W / 2, avatarY + 12);
        ctx.restore();
      };

      if (user?.avatarUrl) {
        const img = new Image();
        img.crossOrigin = "anonymous";
        await new Promise<void>((imgResolve) => {
          img.onload = () => {
            ctx.save();
            ctx.strokeStyle = theme.ring;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(W / 2, avatarY, avatarR + 4, 0, Math.PI * 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(W / 2, avatarY, avatarR, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(img, W / 2 - avatarR, avatarY - avatarR, avatarR * 2, avatarR * 2);
            ctx.restore();
            imgResolve();
          };
          img.onerror = () => {
            drawInitialsFallback();
            imgResolve();
          };
          img.src = user.avatarUrl!;
        });
      } else {
        drawInitialsFallback();
      }

      ctx.font = "bold 32px 'Barlow Condensed', 'Inter', sans-serif";
      ctx.fillStyle = theme.id === "easter" ? "#1f2937" : "#FFFFFF";
      ctx.textAlign = "center";
      ctx.fillText(displayName, W / 2, 395);

      ctx.font = "bold 13px 'Barlow Condensed', 'Inter', sans-serif";
      ctx.fillStyle = theme.accent;
      ctx.letterSpacing = "3px";
      ctx.fillText(roleLabel, W / 2, 420);

      if (user?.referralCode) {
        ctx.font = "bold 16px 'Courier New', monospace";
        ctx.fillStyle = `${theme.accent}99`;
        ctx.fillText(user.referralCode, W / 2, 450);
      }

      if (selectedEmojis.length > 0 || theme.emojis.length > 0) {
        const displayEmojis = selectedEmojis.length > 0 ? selectedEmojis : theme.emojis.slice(0, 4);
        ctx.font = "36px serif";
        const emojiWidth = displayEmojis.length * 48;
        const startX = (W - emojiWidth) / 2 + 24;
        displayEmojis.forEach((emoji, i) => {
          ctx.fillText(emoji, startX + i * 48, 500);
        });
      }

      ctx.font = "bold 18px 'Barlow Condensed', 'Inter', sans-serif";
      ctx.fillStyle = theme.id === "easter" ? "#374151" : "#FFFFFF";
      ctx.textAlign = "center";
      ctx.fillText("3C ONYX", W / 2, 570);

      ctx.font = "13px 'Inter', sans-serif";
      ctx.fillStyle = `${theme.accent}88`;
      ctx.fillText("AUTOMOTIVE ECOSYSTEM OS", W / 2, 592);

      if (theme.id !== "none") {
        const themeLabel = theme.label.toUpperCase();
        ctx.font = "bold 14px 'Barlow Condensed', 'Inter', sans-serif";
        ctx.fillStyle = theme.accent;
        ctx.fillText(`${theme.icon}  ${themeLabel} EDITION  ${theme.icon}`, W / 2, 630);
      }

      ctx.fillStyle = `${theme.accent}44`;
      ctx.fillRect(60, 665, W - 120, 1);

      ctx.font = "12px 'Inter', sans-serif";
      ctx.fillStyle = `${theme.id === "easter" ? "#6b7280" : "#FFFFFF"}88`;
      ctx.fillText("Scan or visit to join the platform", W / 2, 700);

      ctx.font = "bold 14px 'Courier New', monospace";
      ctx.fillStyle = theme.accent;
      const shortUrl = profileUrl.replace(/^https?:\/\//, "");
      ctx.fillText(shortUrl.length > 50 ? shortUrl.slice(0, 47) + "..." : shortUrl, W / 2, 725);

      ctx.font = "11px 'Inter', sans-serif";
      ctx.fillStyle = `${theme.id === "easter" ? "#9ca3af" : "#FFFFFF"}55`;
      ctx.fillText("ONYX acts; member confirms.", W / 2, 780);
      ctx.fillText("cuxtomcandyclub.com", W / 2, 800);

      const cornerSize = 16;
      const corners = [
        { x: 40, y: 40 },
        { x: W - 40, y: 40 },
        { x: 40, y: H - 40 },
        { x: W - 40, y: H - 40 },
      ];
      ctx.strokeStyle = `${theme.accent}66`;
      ctx.lineWidth = 2;
      corners.forEach(({ x, y }, i) => {
        ctx.beginPath();
        const dx = i % 2 === 0 ? 1 : -1;
        const dy = i < 2 ? 1 : -1;
        ctx.moveTo(x, y + dy * cornerSize);
        ctx.lineTo(x, y);
        ctx.lineTo(x + dx * cornerSize, y);
        ctx.stroke();
      });

      resolve(canvas);
    });
  }, [theme, selectedEmojis, user, displayName, initials, roleLabel, profileUrl]);

  const handleDownload = useCallback(async () => {
    setRendering(true);
    try {
      const canvas = await renderBadgeToCanvas();
      const link = document.createElement("a");
      link.download = `3C-ONYX-Badge-${theme.label.replace(/\s+/g, "-")}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast({ title: "Badge downloaded", description: `${theme.label} edition saved` });
    } catch {
      toast({ title: "Download failed", description: "Could not render badge", variant: "destructive" });
    }
    setRendering(false);
  }, [renderBadgeToCanvas, theme, toast]);

  const handleShare = useCallback(async () => {
    setRendering(true);
    try {
      const canvas = await renderBadgeToCanvas();
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));

      if (blob && navigator.share && navigator.canShare) {
        const file = new File([blob], `3C-ONYX-${theme.label}.png`, { type: "image/png" });
        const shareData = {
          title: `${displayName} | 3C ONYX ${theme.label} Badge`,
          text: `Join me on 3C ONYX — Automotive Ecosystem OS. ${theme.icon}`,
          url: profileUrl,
          files: [file],
        };
        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
        } else {
          await navigator.share({ title: shareData.title, text: shareData.text, url: profileUrl });
        }
      } else {
        await navigator.clipboard.writeText(profileUrl);
        toast({ title: "Link copied", description: "Share your profile link" });
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        toast({ title: "Share", description: "Could not share, link copied instead" });
        try { await navigator.clipboard.writeText(profileUrl); } catch {}
      }
    }
    setRendering(false);
  }, [renderBadgeToCanvas, theme, displayName, profileUrl, toast]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = profileUrl;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    toast({ title: "Copied!", description: "Profile link ready to paste" });
    setTimeout(() => setCopied(false), 2000);
  }, [profileUrl, toast]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Sign in to create your badge</p>
      </div>
    );
  }

  const activeEmojis = selectedEmojis.length > 0 ? selectedEmojis : theme.emojis.slice(0, 4);
  const isLightBg = theme.id === "easter";

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-6">

      <div className="text-center space-y-1">
        <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
          Shareable AR Badge
        </h1>
        <p className="text-sm text-muted-foreground">
          Theme it. Brand it. Share it. Every tap links back to you.
        </p>
      </div>

      <div className="flex items-center justify-center gap-3">
        <button
          onClick={prevTheme}
          className="w-10 h-10 rounded-full flex items-center justify-center border border-border hover:bg-accent transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 text-center">
          <span className="text-2xl mr-2">{theme.icon}</span>
          <span className="font-semibold">{theme.label}</span>
        </div>
        <button
          onClick={nextTheme}
          className="w-10 h-10 rounded-full flex items-center justify-center border border-border hover:bg-accent transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="flex gap-1.5 flex-wrap justify-center">
        {BADGE_THEMES.map((t, i) => (
          <button
            key={t.id}
            onClick={() => setSelectedThemeIdx(i)}
            className={`w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all ${
              i === selectedThemeIdx ? "ring-2 scale-110" : "opacity-60 hover:opacity-100"
            }`}
            style={{
              backgroundColor: `${t.accent}22`,
              border: i === selectedThemeIdx ? `2px solid ${t.accent}` : "2px solid transparent",
              boxShadow: i === selectedThemeIdx ? `0 0 0 2px ${t.accent}44` : "none",
            }}
            title={t.label}
          >
            {t.icon}
          </button>
        ))}
      </div>

      <div
        className="relative rounded-2xl overflow-hidden mx-auto shadow-2xl"
        style={{
          maxWidth: 380,
          backgroundColor: theme.bg,
          boxShadow: `0 0 60px ${theme.accent}25, 0 20px 40px rgba(0,0,0,0.4)`,
        }}
      >
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {theme.emojis.concat(selectedEmojis).map((emoji, i) => (
            <span
              key={`${emoji}-${i}`}
              className="absolute text-xl opacity-10 select-none"
              style={{
                left: `${10 + (i * 37) % 80}%`,
                top: `${5 + (i * 53) % 85}%`,
                transform: `rotate(${(i * 45) % 360}deg)`,
              }}
            >
              {emoji}
            </span>
          ))}
        </div>

        <div className="relative z-10 flex flex-col items-center py-8 px-6">

          <p className="text-xs font-semibold tracking-[0.2em] mb-5" style={{ color: theme.accent }}>
            CUXTOMCANDYCLUB LLC
          </p>

          <div className="relative mb-6">
            <div
              className="absolute inset-0 rounded-full blur-xl"
              style={{ backgroundColor: `${theme.accent}20`, transform: "scale(1.5)" }}
            />
            <svg width={120} height={120} viewBox="0 0 100 100" className="relative z-10">
              <defs>
                <radialGradient id="badgeGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor={theme.accent} stopOpacity="0.2" />
                  <stop offset="100%" stopColor={theme.accent} stopOpacity="0" />
                </radialGradient>
                <linearGradient id="badgeGold" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={theme.ring} />
                  <stop offset="100%" stopColor={theme.accent} />
                </linearGradient>
              </defs>
              <circle cx="50" cy="50" r="48" fill="url(#badgeGlow)" />
              <circle cx="50" cy="50" r="46" fill="none" stroke={theme.ring} strokeWidth="0.6" strokeOpacity="0.35" />
              <circle cx="50" cy="50" r="31" fill="none" stroke="url(#badgeGold)" strokeWidth="2.8" strokeLinecap="round" />
              <line x1="50" y1="19" x2="50" y2="81" stroke={theme.accent} strokeWidth="2.8" strokeLinecap="round" />
              <line x1="50" y1="50" x2={50 + 31 * Math.cos(210 * Math.PI / 180)} y2={50 + 31 * Math.sin(210 * Math.PI / 180)} stroke={theme.accent} strokeWidth="2.8" strokeLinecap="round" />
              <line x1="50" y1="50" x2={50 + 31 * Math.cos(330 * Math.PI / 180)} y2={50 + 31 * Math.sin(330 * Math.PI / 180)} stroke={theme.accent} strokeWidth="2.8" strokeLinecap="round" />
              <text x="37" y="52" fontSize="16" fontWeight="900" fill={theme.accent} textAnchor="middle" dominantBaseline="middle">3</text>
              <text x="63" y="52" fontSize="16" fontWeight="900" fill={isLightBg ? "#374151" : "#FFFFFF"} textAnchor="middle" dominantBaseline="middle">C</text>
            </svg>
          </div>

          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mb-4 overflow-hidden"
            style={{
              border: `3px solid ${theme.ring}`,
              boxShadow: `0 0 20px ${theme.accent}33`,
            }}
          >
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-2xl font-bold"
                style={{ backgroundColor: `${theme.accent}22`, color: theme.accent }}
              >
                {initials}
              </div>
            )}
          </div>

          <h2
            className="text-xl font-bold mb-1"
            style={{ color: isLightBg ? "#1f2937" : "#FFFFFF", fontFamily: "'Barlow Condensed', sans-serif" }}
          >
            {displayName}
          </h2>
          <p
            className="text-xs font-bold tracking-[0.15em] mb-1"
            style={{ color: theme.accent }}
          >
            {roleLabel}
          </p>
          {user.referralCode && (
            <p className="text-xs font-mono mb-3" style={{ color: `${theme.accent}99` }}>
              {user.referralCode}
            </p>
          )}

          <div className="flex gap-2 text-2xl mb-4">
            {activeEmojis.map((emoji, i) => (
              <span key={i} className="animate-pulse" style={{ animationDelay: `${i * 200}ms` }}>
                {emoji}
              </span>
            ))}
          </div>

          <div className="text-center mb-3">
            <p className="text-sm font-bold" style={{ color: isLightBg ? "#1f2937" : "#FFFFFF" }}>
              3C ONYX
            </p>
            <p className="text-[10px] tracking-[0.1em]" style={{ color: `${theme.accent}88` }}>
              AUTOMOTIVE ECOSYSTEM OS
            </p>
          </div>

          {theme.id !== "none" && (
            <p className="text-xs font-bold tracking-wider mb-3" style={{ color: theme.accent }}>
              {theme.icon} {theme.label.toUpperCase()} EDITION {theme.icon}
            </p>
          )}

          <div className="w-full max-w-[240px] mx-auto border-t pt-3 text-center" style={{ borderColor: `${theme.accent}33` }}>
            <p className="text-[10px] mb-1" style={{ color: `${isLightBg ? "#6b7280" : "#FFFFFF"}88` }}>
              Scan or visit to join the platform
            </p>
            <p className="text-[10px] font-mono truncate" style={{ color: theme.accent }}>
              {profileUrl.replace(/^https?:\/\//, "")}
            </p>
          </div>

          <p className="text-[9px] mt-4" style={{ color: `${isLightBg ? "#9ca3af" : "#FFFFFF"}55` }}>
            ONYX acts; member confirms.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border hover:bg-accent transition-colors text-sm"
        >
          <Sparkles className="w-4 h-4" />
          Customize Emojis {selectedEmojis.length > 0 && `(${selectedEmojis.length})`}
        </button>

        {showEmojiPicker && (
          <div className="rounded-xl border border-border p-4 space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-2">Theme Emojis</p>
              <div className="flex flex-wrap gap-1.5">
                {theme.emojis.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => toggleEmoji(emoji)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${
                      selectedEmojis.includes(emoji) ? "ring-2 ring-primary scale-110 bg-accent" : "hover:bg-accent"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Custom</p>
              <div className="flex flex-wrap gap-1.5">
                {CUSTOM_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => toggleEmoji(emoji)}
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${
                      selectedEmojis.includes(emoji) ? "ring-2 ring-primary scale-110 bg-accent" : "hover:bg-accent"
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            {selectedEmojis.length > 0 && (
              <button
                onClick={() => setSelectedEmojis([])}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear all
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={handleDownload}
          disabled={rendering}
          className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-border hover:bg-accent transition-colors disabled:opacity-50"
        >
          <Download className="w-5 h-5" />
          <span className="text-xs">Save</span>
        </button>
        <button
          onClick={handleShare}
          disabled={rendering}
          className="flex flex-col items-center gap-1.5 py-3 rounded-xl text-white transition-colors disabled:opacity-50"
          style={{ backgroundColor: theme.accent }}
        >
          <Share2 className="w-5 h-5" />
          <span className="text-xs font-semibold">Share</span>
        </button>
        <button
          onClick={handleCopy}
          className="flex flex-col items-center gap-1.5 py-3 rounded-xl border border-border hover:bg-accent transition-colors"
        >
          {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5" />}
          <span className="text-xs">{copied ? "Copied" : "Copy Link"}</span>
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
