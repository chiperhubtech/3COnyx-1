import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Fingerprint, ScanFace, Plus, Trash2, Loader2, CheckCircle2, ChevronLeft, Shield, Smartphone } from "lucide-react";
import {
  startRegistration,
  browserSupportsWebAuthn,
} from "@simplewebauthn/browser";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function authFetch(url: string, opts: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem("onyxToken") || localStorage.getItem("3c_auth_token");
  return fetch(url, {
    ...opts,
    headers: { ...opts.headers, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
}

interface Credential {
  id: string;
  deviceType: string;
  friendlyName: string | null;
  createdAt: string;
  lastUsedAt: string | null;
}

export default function BiometricSettingsPage() {
  const { user } = useAuth();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [supported, setSupported] = useState(false);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setSupported(browserSupportsWebAuthn());
    loadCredentials();
  }, []);

  const loadCredentials = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${BASE}/api/webauthn/credentials`);
      if (res.ok) {
        const data = await res.json();
        setCredentials(data.credentials);
      }
    } catch {}
    setLoading(false);
  };

  const handleRegister = async () => {
    setError("");
    setSuccess("");
    setRegistering(true);
    try {
      const optRes = await authFetch(`${BASE}/api/webauthn/register/options`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!optRes.ok) {
        const data = await optRes.json();
        setError(data.error || "Failed to start registration");
        setRegistering(false);
        return;
      }

      const options = await optRes.json();
      const { sessionId, ...optionsJSON } = options;
      const regResp = await startRegistration({ optionsJSON });

      const verifyRes = await authFetch(`${BASE}/api/webauthn/register/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: regResp, sessionId }),
      });

      if (!verifyRes.ok) {
        const data = await verifyRes.json();
        setError(data.error || "Registration failed");
        setRegistering(false);
        return;
      }

      const result = await verifyRes.json();
      setSuccess(`${result.friendlyName || "Biometric"} registered successfully`);
      await loadCredentials();
    } catch (err: any) {
      if (err.name === "NotAllowedError") {
        setError("Registration was cancelled");
      } else {
        setError(err.message || "Failed to register biometric");
      }
    }
    setRegistering(false);
  };

  const handleRemove = async (credId: string) => {
    setError("");
    setSuccess("");
    try {
      const res = await authFetch(`${BASE}/api/webauthn/credentials/${encodeURIComponent(credId)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setSuccess("Credential removed");
        await loadCredentials();
      }
    } catch {
      setError("Failed to remove credential");
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#000", padding: "24px 20px 100px" }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>

        <a href="/" style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          color: "rgba(255,255,255,0.35)", fontSize: 13, textDecoration: "none",
          fontWeight: 500, marginBottom: 24,
        }}>
          <ChevronLeft size={16} /> Back
        </a>

        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 18,
            background: "linear-gradient(135deg, rgba(201,162,39,0.12), rgba(201,162,39,0.04))",
            border: "1px solid rgba(201,162,39,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Fingerprint size={28} style={{ color: "#C9A227" }} />
          </div>
          <div>
            <h1 style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: 26, fontWeight: 900, color: "#fff", margin: 0, lineHeight: 1.2,
            }}>
              Biometric Security
            </h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", margin: "4px 0 0" }}>
              Face ID &amp; Fingerprint access
            </p>
          </div>
        </div>

        {!supported && (
          <div style={{
            background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)",
            borderRadius: 16, padding: "20px", marginBottom: 24, textAlign: "center",
          }}>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", margin: 0 }}>
              Biometric authentication is not supported on this browser. Use Safari on iOS or Chrome on Android for Face ID / Fingerprint access.
            </p>
          </div>
        )}

        {success && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "14px 18px",
            borderRadius: 14, background: "rgba(52,211,153,0.06)", border: "1px solid rgba(52,211,153,0.15)",
            marginBottom: 20, animation: "fadeIn 0.3s ease",
          }}>
            <CheckCircle2 size={16} style={{ color: "#34D399", flexShrink: 0 }} />
            <p style={{ fontSize: 14, color: "#34D399", margin: 0 }}>{success}</p>
          </div>
        )}

        {error && (
          <div style={{
            display: "flex", alignItems: "center", gap: 10, padding: "14px 18px",
            borderRadius: 14, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)",
            marginBottom: 20,
          }}>
            <Shield size={16} style={{ color: "#EF4444", flexShrink: 0 }} />
            <p style={{ fontSize: 14, color: "#EF4444", margin: 0 }}>{error}</p>
          </div>
        )}

        <div style={{
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 20, padding: "24px", marginBottom: 24,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <ScanFace size={18} style={{ color: "rgba(255,255,255,0.3)" }} />
            <p style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.3)", margin: 0, letterSpacing: 1.5, textTransform: "uppercase" }}>
              Registered Devices
            </p>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "32px 0" }}>
              <Loader2 size={24} className="animate-spin" style={{ color: "rgba(255,255,255,0.2)" }} />
            </div>
          ) : credentials.length === 0 ? (
            <div style={{ textAlign: "center", padding: "24px 0" }}>
              <Fingerprint size={40} style={{ color: "rgba(255,255,255,0.08)", marginBottom: 12 }} />
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.3)", margin: 0, lineHeight: 1.5 }}>
                No biometric credentials registered yet.<br />
                Add Face ID or Fingerprint for instant access.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {credentials.map((cred) => (
                <div key={cred.id} style={{
                  display: "flex", alignItems: "center", gap: 14,
                  padding: "16px", borderRadius: 14,
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12,
                    background: "rgba(201,162,39,0.08)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  }}>
                    <Smartphone size={18} style={{ color: "#C9A227" }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#fff", margin: 0 }}>
                      {cred.friendlyName || "Biometric Device"}
                    </p>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", margin: "2px 0 0" }}>
                      {cred.deviceType === "singleDevice" ? "This device only" : "Synced across devices"} •{" "}
                      Added {new Date(cred.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemove(cred.id)}
                    style={{
                      background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)",
                      borderRadius: 10, padding: 8, cursor: "pointer", color: "#EF4444", flexShrink: 0,
                    }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {supported && (
          <button
            onClick={handleRegister}
            disabled={registering}
            style={{
              width: "100%", padding: "18px", borderRadius: 16,
              background: registering
                ? "rgba(201,162,39,0.1)"
                : "linear-gradient(135deg, #C9A227, #A68B1B)",
              border: "none",
              color: registering ? "#C9A227" : "#000",
              fontWeight: 800, fontSize: 16,
              cursor: registering ? "default" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              boxShadow: registering ? "none" : "0 4px 24px rgba(201,162,39,0.3)",
              transition: "all 0.2s",
            }}
          >
            {registering ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Plus size={18} strokeWidth={3} />
            )}
            {registering ? "Follow the prompt on your device..." : "Register Face ID / Fingerprint"}
          </button>
        )}

        <p style={{ textAlign: "center", marginTop: 20, fontSize: 11, color: "rgba(255,255,255,0.15)", lineHeight: 1.6 }}>
          Your biometric data never leaves your device.<br />
          ONYX only stores a cryptographic key — not your face or fingerprint.
        </p>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
