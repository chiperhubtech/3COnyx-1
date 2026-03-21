import { Link, useLocation } from "wouter";
import {
  UserCheck,
  Car,
  Truck,
  Wallet,
  Shield,
  ChevronRight,
  ShoppingBag,
  Gauge,
  QrCode,
  CreditCard,
} from "lucide-react";

const navItems = [
  {
    label: "Concierge",
    path: "/concierge",
    icon: UserCheck,
    description: "Client management",
  },
  {
    label: "Inventory",
    path: "/inventory",
    icon: Car,
    description: "Vehicle catalog",
  },
  {
    label: "Marketplace",
    path: "/marketplace",
    icon: ShoppingBag,
    description: "Live listings",
  },
  {
    label: "My Garage",
    path: "/garage",
    icon: Gauge,
    description: "Telematics & service",
  },
  {
    label: "Logistics",
    path: "/logistics",
    icon: Truck,
    description: "Delivery & transport",
  },
  {
    label: "Proof of Delivery",
    path: "/delivery",
    icon: QrCode,
    description: "Digital handshake",
  },
  {
    label: "Member Wallet",
    path: "/wallet",
    icon: CreditCard,
    description: "Stripe Connect payouts",
  },
  {
    label: "Referral Wallet",
    path: "/referral-wallet",
    icon: Wallet,
    description: "Earnings & rewards",
  },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-64 min-h-screen flex flex-col border-r border-white/10 bg-[#0a0a0c]">
      {/* Logo / Brand */}
      <div className="px-6 py-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center">
            <Shield className="w-4 h-4 text-black" />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-widest text-white uppercase">
              3C Onyx
            </p>
            <p className="text-[10px] text-white/40 tracking-wider uppercase">
              Secure Platform
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ label, path, icon: Icon, description }) => {
          const isActive = location === path || location.startsWith(path + "/");
          return (
            <Link key={path} href={path}>
              <div
                className={`group flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-all duration-150 ${
                  isActive
                    ? "bg-amber-500/10 border border-amber-500/30"
                    : "hover:bg-white/5 border border-transparent"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-md flex items-center justify-center transition-colors ${
                    isActive
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-white/5 text-white/50 group-hover:text-white/80"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium ${
                      isActive ? "text-amber-300" : "text-white/70 group-hover:text-white"
                    }`}
                  >
                    {label}
                  </p>
                  <p className="text-[11px] text-white/30 truncate">{description}</p>
                </div>
                <ChevronRight
                  className={`w-3.5 h-3.5 transition-opacity ${
                    isActive ? "text-amber-400 opacity-100" : "text-white/20 opacity-0 group-hover:opacity-100"
                  }`}
                />
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Security badge */}
      <div className="px-4 py-4 border-t border-white/10">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <p className="text-[11px] text-emerald-400/80 font-medium tracking-wide">
            PII Protection Active
          </p>
        </div>
      </div>
    </aside>
  );
}
