import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import { AIConcierge, RewardToast } from "@/components/AIConcierge";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/context/AuthContext";

import Home from "@/pages/home";
import Concierge from "@/pages/concierge";
import Inventory from "@/pages/inventory";
import Marketplace from "@/pages/marketplace";
import Garage from "@/pages/garage";
import Logistics from "@/pages/logistics";
import Delivery from "@/pages/delivery";
import Wallet from "@/pages/wallet";
import AuditVault from "@/pages/audit-vault";
import Apply from "@/pages/apply";
import ReferralWallet from "@/pages/referral-wallet";
import SpecialistDashboard from "@/pages/specialist-dashboard";
import Inspection from "@/pages/inspection";
import Watchlist from "@/pages/watchlist";
import Analytics from "@/pages/analytics";
import CiCd from "@/pages/ci-cd";
import Finance from "@/pages/finance";
import Insurance from "@/pages/insurance";
import VehicleHistory from "@/pages/vehicle-history";
import AIHub from "@/pages/ai-hub";
import Dropship from "@/pages/dropship";
import Security from "@/pages/security";
import Command from "@/pages/command";
import Guardian from "@/pages/guardian";
import Subscription from "@/pages/subscription";
import Partners from "@/pages/partners";
import Unity from "@/pages/unity";
import Share from "@/pages/share";
import AgenticOS from "@/pages/agentic-os";
import Impact from "@/pages/impact";
import Pro from "@/pages/pro";
import Custody from "@/pages/custody";
import ARViewer from "@/pages/ar-viewer";
import NotFound from "@/pages/not-found";

// Auth + launch pages
import LoginPage    from "@/pages/login";
import RegisterPage from "@/pages/register";
import WaitlistPage from "@/pages/waitlist";
import AdminPage    from "@/pages/admin";
import TermsPage    from "@/pages/legal/terms";
import PrivacyPage  from "@/pages/legal/privacy";
import TrustPage    from "@/pages/trust";

const BARE_PATHS = ["/login", "/register", "/waitlist"];

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 12_000),
      staleTime:  30_000,
      gcTime:     5 * 60_000,
      refetchOnWindowFocus: false,
    },
    mutations: { retry: 1 },
  },
});

function AppRoutes() {
  const [location] = useLocation();
  const isBare = BARE_PATHS.some((p) => location === p);

  if (isBare) {
    return (
      <Switch>
        <Route path="/login"    component={LoginPage} />
        <Route path="/register" component={RegisterPage} />
        <Route path="/waitlist" component={WaitlistPage} />
      </Switch>
    );
  }

  return (
    <Layout>
      <Switch>
        <Route path="/"                   component={Home} />
        <Route path="/concierge"          component={Concierge} />
        <Route path="/inventory"          component={Inventory} />
        <Route path="/marketplace"        component={Marketplace} />
        <Route path="/garage"             component={Garage} />
        <Route path="/logistics"          component={Logistics} />
        <Route path="/delivery"           component={Delivery} />
        <Route path="/wallet"             component={Wallet} />
        <Route path="/referral-wallet"    component={ReferralWallet} />
        <Route path="/audit-vault"        component={AuditVault} />
        <Route path="/apply"              component={Apply} />
        <Route path="/specialist-dashboard" component={SpecialistDashboard} />
        <Route path="/inspection"         component={Inspection} />
        <Route path="/watchlist"          component={Watchlist} />
        <Route path="/analytics"          component={Analytics} />
        <Route path="/ci-cd"              component={CiCd} />
        <Route path="/finance"            component={Finance} />
        <Route path="/insurance"          component={Insurance} />
        <Route path="/vehicle-history"    component={VehicleHistory} />
        <Route path="/ai-hub"             component={AIHub} />
        <Route path="/dropship"           component={Dropship} />
        <Route path="/security"           component={Security} />
        <Route path="/command"            component={Command} />
        <Route path="/guardian"           component={Guardian} />
        <Route path="/subscribe"          component={Subscription} />
        <Route path="/partners"           component={Partners} />
        <Route path="/unity"              component={Unity} />
        <Route path="/share"              component={Share} />
        <Route path="/agentic-os"         component={AgenticOS} />
        <Route path="/impact"             component={Impact} />
        <Route path="/pro"                component={Pro} />
        <Route path="/custody"            component={Custody} />
        <Route path="/ar-viewer"          component={ARViewer} />
        <Route path="/admin"              component={AdminPage} />
        <Route path="/legal/terms"        component={TermsPage} />
        <Route path="/legal/privacy"      component={PrivacyPage} />
        <Route path="/trust"              component={TrustPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <AuthProvider>
              <ErrorBoundary>
                <AppRoutes />
              </ErrorBoundary>
              <AIConcierge />
              <RewardToast />
            </AuthProvider>
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
