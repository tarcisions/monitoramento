import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAppStore } from "./store/useAppStore";
import { useEffect } from "react";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Robots from "./pages/Robots";
import Executions from "./pages/Executions";
import TelegramBots from "./pages/TelegramBots";
import Settings from "./pages/Settings";
import NotFound from "./pages/not-found";

// Layout
import Sidebar from "./components/layout/Sidebar";
import Header from "./components/layout/Header";

function AuthenticatedApp() {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Header />
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/robots" component={Robots} />
          <Route path="/executions" component={Executions} />
          <Route path="/telegram-bots" component={TelegramBots} />
          <Route path="/settings" component={Settings} />
          <Route component={NotFound} />
        </Switch>
      </main>
    </div>
  );
}

function Router() {
  const { isAuthenticated, checkAuth } = useAppStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <Switch>
      <Route path="/login">
        {isAuthenticated ? <Redirect to="/" /> : <Login />}
      </Route>
      <Route>
        {isAuthenticated ? <AuthenticatedApp /> : <Redirect to="/login" />}
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
