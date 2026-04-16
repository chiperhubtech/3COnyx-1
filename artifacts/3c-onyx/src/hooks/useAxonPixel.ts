import { useEffect } from "react";
import { useLocation } from "wouter";

declare global {
  interface Window {
    axon?: {
      pageview: () => void;
      track: (event: string, data?: Record<string, unknown>) => void;
    };
  }
}

export function useAxonPageview() {
  const [location] = useLocation();

  useEffect(() => {
    if (window.axon) {
      window.axon.pageview();
    }
  }, [location]);
}

export function fireAxonConversion(event: "Lead" | "Purchase", data?: Record<string, unknown>) {
  if (window.axon) {
    window.axon.track(event, data);
  }
}
