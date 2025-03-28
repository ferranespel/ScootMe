import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import HistoryPage from "@/pages/history-page";
import WalletPage from "@/pages/wallet-page";
import ProfilePage from "@/pages/profile-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "@/hooks/use-auth";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/history" component={HistoryPage} />
      <ProtectedRoute path="/wallet" component={WalletPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <I18nextProvider i18n={i18n}>
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </I18nextProvider>
    </QueryClientProvider>
  );
}

export default App;
