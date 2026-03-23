import { Component, type ReactNode } from "react";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";

interface Props  { children: ReactNode }
interface State  { hasError: boolean; error: Error | null; errorInfo: string }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: "" };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    this.setState({ errorInfo: info.componentStack ?? "" });
    console.error("[3C Onyx] Render error:", error, info);
  }

  reset = () => {
    this.setState({ hasError: false, error: null, errorInfo: "" });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    const isDev = import.meta.env.DEV;

    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(160deg, #04040a 0%, #060609 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          padding: 24,
        }}
      >
        <div
          style={{
            maxWidth: 520,
            width: "100%",
            borderRadius: 20,
            border: "1px solid rgba(248,113,113,0.2)",
            background: "rgba(10,10,16,0.97)",
            padding: "36px 32px",
            boxShadow: "0 0 40px rgba(248,113,113,0.08)",
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: 56, height: 56, borderRadius: 16,
              background: "rgba(248,113,113,0.1)",
              border: "1px solid rgba(248,113,113,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
              marginBottom: 20,
            }}
          >
            <AlertTriangle size={26} style={{ color: "#F87171" }} />
          </div>

          {/* Headline */}
          <p style={{ fontSize: 10, fontWeight: 700, color: "#F87171", letterSpacing: "0.15em", marginBottom: 6 }}>
            SYSTEM FAULT — MODULE ISOLATED
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#fff", marginBottom: 8, lineHeight: 1.2 }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)", marginBottom: 24, lineHeight: 1.6 }}>
            3C Onyx isolated the fault to prevent a full platform outage. Your session data is intact. Click below to reload this module.
          </p>

          {/* Dev error detail */}
          {isDev && this.state.error && (
            <div
              style={{
                padding: "10px 14px", borderRadius: 10,
                background: "rgba(248,113,113,0.06)",
                border: "1px solid rgba(248,113,113,0.15)",
                marginBottom: 20, fontFamily: "monospace",
                fontSize: 11, color: "#F87171", lineHeight: 1.5,
                maxHeight: 120, overflowY: "auto",
              }}
            >
              {this.state.error.message}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={this.reset}
              style={{
                flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "11px 16px", borderRadius: 12, cursor: "pointer",
                background: "rgba(201,162,39,0.1)", border: "1px solid rgba(201,162,39,0.3)",
                color: "#C9A227", fontSize: 12, fontWeight: 700, letterSpacing: "0.05em",
              }}
            >
              <RotateCcw size={14} /> RELOAD MODULE
            </button>
            <button
              onClick={() => { window.location.href = "/"; }}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                padding: "11px 16px", borderRadius: 12, cursor: "pointer",
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: 700, letterSpacing: "0.05em",
              }}
            >
              <Home size={14} /> HOME
            </button>
          </div>

          {/* Footer */}
          <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.18)", letterSpacing: "0.1em" }}>3C ONYX · PLATFORM v1.0</span>
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.18)", letterSpacing: "0.1em" }}>PII PROTECTED</span>
          </div>
        </div>
      </div>
    );
  }
}
