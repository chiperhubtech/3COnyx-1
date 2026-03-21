import { Shield, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center overflow-y-auto">
      <div className="mb-6 w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/20">
        <Shield className="w-8 h-8 text-black" />
      </div>
      <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
        3C Onyx
      </h1>
      <p className="text-white/40 text-base max-w-sm mb-8">
        A high-end luxury platform with Security First PII protection — all sensitive identifiers are masked automatically.
      </p>
      <Link href="/concierge">
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-medium text-sm transition-colors cursor-pointer">
          Enter Platform
          <ArrowRight className="w-4 h-4" />
        </div>
      </Link>
    </div>
  );
}
