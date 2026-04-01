import { useState, useRef, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { MemberQRBadge } from "@/components/MemberQRBadge";
import {
  Camera, Upload, Share2, Copy, Check, QrCode, Shield,
  Sparkles, User, Building2, Wrench, Truck, Crown,
  Image as ImageIcon, X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API = import.meta.env.VITE_API_URL || "";

const ROLE_ICONS: Record<string, any> = {
  Member: User,
  Dealer: Building2,
  Runner: Truck,
  Specialist: Wrench,
  Admin: Crown,
};

const AVATAR_OPTIONS = [
  { id: "upload", label: "Upload Photo", icon: Upload, description: "From your phone or computer" },
  { id: "camera", label: "Take Photo", icon: Camera, description: "Use your camera" },
];

export default function MyQRPage() {
  const { user, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const profileUrl = (() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const base = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
    const code = user?.referralCode || `user-${user?.id || 0}`;
    return `${origin}${base}/m/${code}`;
  })();

  const handleCopyLink = useCallback(async () => {
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
    toast({ title: "Link copied", description: "Your profile link is ready to share" });
    setTimeout(() => setCopied(false), 2000);
  }, [profileUrl, toast]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${user?.name} on 3C ONYX`,
          text: "Scan my QR code to connect on the 3C ONYX automotive platform",
          url: profileUrl,
        });
      } catch {}
    } else {
      handleCopyLink();
    }
  }, [user, profileUrl, handleCopyLink]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file", description: "Please select an image file", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Please select an image under 5MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    setShowAvatarPicker(false);

    try {
      const reader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const token = localStorage.getItem("3c_auth_token");
      const res = await fetch(`${API}/api/users/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ avatarUrl: dataUrl }),
      });

      if (!res.ok) throw new Error("Upload failed");

      if (refreshProfile) await refreshProfile();
      toast({ title: "Profile photo updated", description: "Your QR badge now shows your photo" });
    } catch (err) {
      toast({ title: "Upload failed", description: "Please try again", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (cameraInputRef.current) cameraInputRef.current.value = "";
    }
  }, [toast, refreshProfile]);

  const RoleIcon = ROLE_ICONS[user?.role || "Member"] || User;
  const accent = user?.role === "Dealer" ? "#F59E0B"
    : user?.role === "Runner" ? "#8B5CF6"
    : user?.role === "Specialist" ? "#4FC3F7"
    : user?.role === "Admin" ? "#EF4444"
    : "#C9A227";

  if (!user) return null;

  return (
    <div style={{ padding: "24px 16px", maxWidth: 480, margin: "0 auto" }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: "none" }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={handleFileSelect}
        style={{ display: "none" }}
      />

      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 6 }}>
          <QrCode size={20} style={{ color: accent }} />
          <h1 style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 22, fontWeight: 900, color: "var(--onyx-text-primary)",
            letterSpacing: "0.1em",
          }}>MY QR IDENTITY</h1>
        </div>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", lineHeight: 1.4 }}>
          Your scannable club badge. Anyone who scans it connects directly to your profile.
        </p>
      </div>

      <div style={{
        background: "rgba(0,0,0,0.3)",
        border: `1px solid ${accent}20`,
        borderRadius: 20,
        padding: "28px 20px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
        position: "relative",
      }}>
        {user.isVerified && (
          <div style={{
            position: "absolute",
            top: 12,
            right: 12,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#34D399", animation: "pulse 2s infinite" }} />
            <span style={{ fontSize: 8, color: "rgba(52,211,153,0.6)", fontWeight: 700, letterSpacing: "0.1em" }}>VERIFIED</span>
          </div>
        )}

        <MemberQRBadge size={240} showName showRole showDownload />

        <button
          onClick={() => setShowAvatarPicker(true)}
          disabled={uploading}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "8px 16px",
            borderRadius: 8,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: uploading ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.5)",
            fontSize: 11,
            fontWeight: 600,
            cursor: uploading ? "default" : "pointer",
            transition: "all 0.15s",
          }}
        >
          <Camera size={13} />
          {uploading ? "UPLOADING..." : user.avatarUrl ? "CHANGE PHOTO" : "ADD PROFILE PHOTO"}
        </button>
      </div>

      {showAvatarPicker && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.7)",
          zIndex: 50,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
          onClick={() => setShowAvatarPicker(false)}
        >
          <div
            style={{
              background: "#111118",
              border: `1px solid ${accent}30`,
              borderRadius: 16,
              padding: 20,
              width: "100%",
              maxWidth: 320,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h3 style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: 16, fontWeight: 800, color: "#fff",
                letterSpacing: "0.08em",
              }}>SET PROFILE PHOTO</h3>
              <button
                onClick={() => setShowAvatarPicker(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 4 }}
              >
                <X size={16} />
              </button>
            </div>

            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 16, lineHeight: 1.4 }}>
              Choose a photo for the center of your QR badge. Use your license photo, a selfie, or your business logo.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "12px 14px", borderRadius: 10,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  cursor: "pointer", textAlign: "left",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = `${accent}40`;
                  (e.currentTarget as HTMLButtonElement).style.background = `${accent}08`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)";
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.03)";
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: `${accent}12`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <ImageIcon size={16} style={{ color: accent }} />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>Choose from Gallery</p>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Photo, selfie, or business logo</p>
                </div>
              </button>

              <button
                onClick={() => cameraInputRef.current?.click()}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "12px 14px", borderRadius: 10,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  cursor: "pointer", textAlign: "left",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = `${accent}40`;
                  (e.currentTarget as HTMLButtonElement).style.background = `${accent}08`;
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)";
                  (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.03)";
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 8,
                  background: `${accent}12`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Camera size={16} style={{ color: accent }} />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: "#fff" }}>Take a Photo</p>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Use your camera for a fresh shot</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <button
          onClick={handleCopyLink}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "12px",
            borderRadius: 10,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.6)",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            fontFamily: "'Barlow Condensed', sans-serif",
            letterSpacing: "0.06em",
            transition: "all 0.15s",
          }}
        >
          {copied ? <Check size={14} style={{ color: "#34D399" }} /> : <Copy size={14} />}
          {copied ? "COPIED" : "COPY LINK"}
        </button>

        <button
          onClick={handleShare}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "12px",
            borderRadius: 10,
            background: `linear-gradient(135deg, ${accent} 0%, #8B6914 100%)`,
            border: "none",
            color: "#000",
            fontSize: 12,
            fontWeight: 800,
            cursor: "pointer",
            fontFamily: "'Barlow Condensed', sans-serif",
            letterSpacing: "0.08em",
            transition: "all 0.15s",
          }}
        >
          <Share2 size={14} />
          SHARE
        </button>
      </div>

      <div style={{
        marginTop: 16,
        padding: "14px 16px",
        borderRadius: 12,
        background: "rgba(0,0,0,0.2)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
          <Shield size={13} style={{ color: "#34D399" }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(52,211,153,0.7)", letterSpacing: "0.1em" }}>
            YOUR CLUB IDENTITY
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <InfoTile label="MEMBER ID" value={`#${user.id}`} accent={accent} />
          <InfoTile label="ROLE" value={user.role.toUpperCase()} accent={accent} />
          <InfoTile label="REFERRAL CODE" value={user.referralCode || "—"} accent={accent} />
          <InfoTile label="POINTS" value={String(user.points || 0)} accent={accent} />
        </div>
      </div>

      <div style={{
        marginTop: 16,
        padding: "12px 16px",
        borderRadius: 10,
        background: `${accent}06`,
        border: `1px solid ${accent}15`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
          <Sparkles size={12} style={{ color: accent }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: accent, letterSpacing: "0.1em" }}>HOW IT WORKS</span>
        </div>
        <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
          When someone scans your QR code, they land on your member profile and can join the platform through your referral link. You earn commissions on every deal they complete — the Bird-Dog protocol handles everything automatically.
        </p>
      </div>

      <p style={{
        textAlign: "center",
        fontSize: 8,
        color: "rgba(255,255,255,0.1)",
        marginTop: 20,
        letterSpacing: "0.14em",
        fontFamily: "'Barlow Condensed', sans-serif",
      }}>
        3C ONYX &middot; SOVEREIGN AUTOMOTIVE OS &middot; CUXTOMCANDYCLUB LLC
      </p>
    </div>
  );
}

function InfoTile({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div style={{
      padding: "8px 10px",
      borderRadius: 8,
      background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.04)",
    }}>
      <p style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", fontWeight: 700, letterSpacing: "0.12em", marginBottom: 3 }}>
        {label}
      </p>
      <p style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: 14, fontWeight: 800, color: accent, lineHeight: 1,
      }}>
        {value}
      </p>
    </div>
  );
}
