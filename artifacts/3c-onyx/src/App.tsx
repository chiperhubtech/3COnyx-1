import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import { AIConcierge } from "@/components/AIConcierge";
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
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/concierge" component={Concierge} />
      <Route path="/inventory" component={Inventory} />
      <Route path="/marketplace" component={Marketplace} />
      <Route path="/garage" component={Garage} />
      <Route path="/logistics" component={Logistics} />
      <Route path="/delivery" component={Delivery} />
      <Route path="/wallet" component={Wallet} />
      <Route path="/referral-wallet" component={ReferralWallet} />
      <Route path="/audit-vault" component={AuditVault} />
      <Route path="/apply" component={Apply} />
      <Route path="/specialist-dashboard" component={SpecialistDashboard} />
      <Route path="/inspection" component={Inspection} />
      <Route path="/watchlist" component={Watchlist} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/ci-cd" component={CiCd} />
      <Route path="/finance" component={Finance} />
      <Route path="/insurance" component={Insurance} />
      <Route path="/vehicle-history" component={VehicleHistory} />
      <Route path="/ai-hub" component={AIHub} />
      <Route path="/dropship" component={Dropship} />
      <Route path="/security" component={Security} />
      <Route path="/command" component={Command} />
      <Route path="/guardian" component={Guardian} />
      <Route path="/subscribe" component={Subscription} />
      <Route path="/partners" component={Partners} />
      <Route path="/unity" component={Unity} />
      <Route path="/share" component={Share} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Layout>
            <Router />
          </Layout>
          <AIConcierge />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
