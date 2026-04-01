import { useState, useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import { AIConcierge, RewardToast } from "@/components/AIConcierge";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ProtectedRoute, PublicRoute } from "@/components/ProtectedRoute";
import { OnboardingModal, useOnboarding } from "@/components/OnboardingModal";

import Home from "@/pages/home";
import LandingPage from "@/pages/landing";
import JoinPage from "@/pages/join";
import JoinSuccess from "@/pages/join-success";
import MemberProfilePage from "@/pages/member-profile";
import GrowthDashboard from "@/pages/growth";
import Concierge from "@/pages/concierge";
import Inventory from "@/pages/inventory";
import Marketplace from "@/pages/marketplace";
import Garage from "@/pages/garage";
import Logistics from "@/pages/logistics";
import BayDashboard from "@/pages/bay-dashboard";
import ComplianceDashboard from "@/pages/compliance";
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
import IntelligenceFeed from "@/pages/intelligence";
import AftermarketPage from "@/pages/aftermarket";
import AlibabaDropship from "@/pages/alibaba-dropship";
import FamilyOfficePage from "@/pages/family-office";
import RaceHubPage from "@/pages/race-hub";
import CRMHubPage  from "@/pages/crm-hub";
import PlatformIntelligence from "@/pages/platform-intelligence";
import StrategicCenter from "@/pages/strategic-center";
import Guardian from "@/pages/guardian";
import SafetyShield from "@/pages/safety-shield";
import SovereignOps from "@/pages/sovereign-ops";
import WhatsAppHub from "@/pages/whatsapp-hub";
import DynastyFoundation from "@/pages/dynasty-foundation";
import OnyxSource from "@/pages/onyx-source";
import OnyxShield from "@/pages/onyx-shield";
import PreLaunchReadiness from "@/pages/prelaunch-readiness";
import LegalArmor from "@/pages/legal-armor";
import LegalDeclaration from "@/pages/legal/declaration";
import Subscription from "@/pages/subscription";
import Partners from "@/pages/partners";
import Unity from "@/pages/unity";
import Share from "@/pages/share";
import AgenticOS from "@/pages/agentic-os";
import ONYXBrain from "@/pages/onyx-brain";
import Impact from "@/pages/impact";
import Pro from "@/pages/pro";
import Custody from "@/pages/custody";
import ARViewer from "@/pages/ar-viewer";
import NotFound from "@/pages/not-found";
import RunnerTasks from "@/pages/runner-tasks";
import WorkerDashboard from "@/pages/worker-dashboard";
import TechnologyPage from "@/pages/technology";
import SDVPage from "@/pages/sdv";
import FounderDeclaration from "@/pages/founder-declaration";
import CreatorOutreachHub from "@/pages/creator-outreach";
import WisdomEngine from "@/pages/wisdom-engine";
import AgentMesh from "@/pages/agent-mesh";
import DealerFlowOS from "@/pages/dealerflow";
import GuestFlow from "@/pages/guest-flow";

// Auth + launch pages
import LoginPage    from "@/pages/login";
import RegisterPage from "@/pages/register";
import WaitlistPage from "@/pages/waitlist";
import AdminPage    from "@/pages/admin";
import OwnerPortal  from "@/pages/owner-portal";
import TermsPage    from "@/pages/legal/terms";
import PrivacyPage  from "@/pages/legal/privacy";
import TrustPage    from "@/pages/trust";
import { AccessGate } from "@/components/AccessGate";

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

/* ─── Onboarding Gate — wraps authenticated app ─────────────────────────── */
function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { needsOnboarding } = useOnboarding();
  const [dismissed, setDismissed] = useState(false);

  // Only show onboarding if logged in AND not yet complete
  const show = !!user && needsOnboarding && !dismissed;

  return (
    <>
      {show && <OnboardingModal onComplete={() => setDismissed(true)} />}
      {children}
    </>
  );
}

/* ─── All Routes ─────────────────────────────────────────────────────────── */
function AppRoutes() {
  const [location] = useLocation();

  // Public pages — no sidebar, no auth required
  const PUBLIC_PATHS = ["/landing", "/login", "/register", "/waitlist", "/legal/terms", "/legal/privacy", "/join", "/m/", "/technology", "/sdv", "/oa", "/flow"];
  const isPublic = PUBLIC_PATHS.some((p) => location === p || location.startsWith(p));
  const isHome = location === "/" || location === "";

  if (isHome || isPublic) {
    return (
      <Switch>
        <Route path="/"                component={Home} />
        <Route path="/flow/:type"      component={GuestFlow} />
        <Route path="/landing"         component={LandingPage} />
        <Route path="/join/success"    component={JoinSuccess} />
        <Route path="/join"            component={JoinPage} />
        <Route path="/technology"      component={TechnologyPage} />
        <Route path="/sdv"             component={SDVPage} />
        <Route path="/m/:code"         component={MemberProfilePage} />
        <Route path="/login">
          <PublicRoute><LoginPage /></PublicRoute>
        </Route>
        <Route path="/register">
          <PublicRoute><RegisterPage /></PublicRoute>
        </Route>
        <Route path="/waitlist"        component={WaitlistPage} />
        <Route path="/legal/terms"     component={TermsPage} />
        <Route path="/legal/privacy"   component={PrivacyPage} />
        <Route path="/oa"              component={OwnerPortal} />
      </Switch>
    );
  }

  return (
    <AccessGate>
    <ProtectedRoute>
      <OnboardingGate>
        <Layout>
          <Switch>
            {/* Core Dashboard */}
            <Route path="/"                     component={Home} />
            <Route path="/intelligence"         component={IntelligenceFeed} />
            <Route path="/aftermarket"          component={AftermarketPage} />
            <Route path="/alibaba-dropship"     component={AlibabaDropship} />
            <Route path="/family-office"        component={FamilyOfficePage} />
            <Route path="/race-hub"             component={RaceHubPage} />
            <Route path="/crm-hub"             component={CRMHubPage}  />
            <Route path="/platform-intelligence" component={PlatformIntelligence} />
            <Route path="/strategic-center"      component={StrategicCenter} />
            <Route path="/trust"                component={TrustPage} />

            {/* Consumer */}
            <Route path="/concierge"            component={Concierge} />
            <Route path="/marketplace"          component={Marketplace} />
            <Route path="/garage"               component={Garage} />
            <Route path="/logistics"            component={Logistics} />
            <Route path="/bay-dashboard"        component={BayDashboard} />
            <Route path="/compliance"           component={ComplianceDashboard} />
            <Route path="/delivery"             component={Delivery} />
            <Route path="/wallet"               component={Wallet} />
            <Route path="/referral-wallet"      component={ReferralWallet} />
            <Route path="/watchlist"            component={Watchlist} />
            <Route path="/finance"              component={Finance} />
            <Route path="/insurance"            component={Insurance} />
            <Route path="/vehicle-history"      component={VehicleHistory} />

            {/* Specialist / Runner */}
            <Route path="/specialist-dashboard" component={SpecialistDashboard} />
            <Route path="/inspection"           component={Inspection} />
            <Route path="/delivery"             component={Delivery} />
            <Route path="/dropship"             component={Dropship} />
            <Route path="/apply"                component={Apply} />
            <Route path="/runner-tasks"         component={RunnerTasks} />
            <Route path="/worker-dashboard"     component={WorkerDashboard} />

            {/* Platform */}
            <Route path="/inventory"            component={Inventory} />
            <Route path="/audit-vault"          component={AuditVault} />
            <Route path="/analytics"            component={Analytics} />
            <Route path="/ci-cd"                component={CiCd} />
            <Route path="/ai-hub"               component={AIHub} />
            <Route path="/security"             component={Security} />
            <Route path="/command"              component={Command} />
            <Route path="/guardian"             component={Guardian} />
            <Route path="/safety-shield"        component={SafetyShield} />
            <Route path="/sovereign-ops"        component={SovereignOps} />
            <Route path="/whatsapp"             component={WhatsAppHub} />
            <Route path="/dynasty-foundation"   component={DynastyFoundation} />
            <Route path="/onyx-source"          component={OnyxSource} />
            <Route path="/onyx-shield"          component={OnyxShield} />
            <Route path="/prelaunch-readiness"  component={PreLaunchReadiness} />
            <Route path="/legal/armor"          component={LegalArmor} />
            <Route path="/legal/declaration"    component={LegalDeclaration} />
            <Route path="/founder"              component={FounderDeclaration} />
            <Route path="/subscribe"            component={Subscription} />
            <Route path="/partners"             component={Partners} />
            <Route path="/unity"                component={Unity} />
            <Route path="/share"                component={Share} />
            <Route path="/agentic-os"           component={AgenticOS} />
            <Route path="/onyx-brain"           component={ONYXBrain} />
            <Route path="/wisdom-engine"        component={WisdomEngine} />
            <Route path="/agent-mesh"           component={AgentMesh} />
            <Route path="/impact"               component={Impact} />
            <Route path="/pro"                  component={Pro} />
            <Route path="/custody"              component={Custody} />
            <Route path="/ar-viewer"            component={ARViewer} />

            {/* DealerFlow OS — Industry Professional */}
            <Route path="/dealerflow"           component={DealerFlowOS} />

            {/* Growth Engine */}
            <Route path="/growth"               component={GrowthDashboard} />
            <Route path="/creator-outreach">
              <ProtectedRoute requiredRole="Admin"><CreatorOutreachHub /></ProtectedRoute>
            </Route>

            {/* Admin — role protected */}
            <Route path="/admin">
              <ProtectedRoute requiredRole="Admin"><AdminPage /></ProtectedRoute>
            </Route>

            <Route component={NotFound} />
          </Switch>
        </Layout>
      </OnboardingGate>
    </ProtectedRoute>
    </AccessGate>
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
