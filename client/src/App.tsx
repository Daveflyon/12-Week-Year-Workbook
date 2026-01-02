import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Vision from "./pages/Vision";
import Goals from "./pages/Goals";
import Scorecard from "./pages/Scorecard";
import PerformanceBlocks from "./pages/PerformanceBlocks";
import WeeklyReview from "./pages/WeeklyReview";
import CycleReview from "./pages/CycleReview";
import Checklist from "./pages/Checklist";
import Settings from "./pages/Settings";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/vision" component={Vision} />
      <Route path="/goals" component={Goals} />
      <Route path="/scorecard" component={Scorecard} />
      <Route path="/scorecard/:weekNumber" component={Scorecard} />
      <Route path="/blocks" component={PerformanceBlocks} />
      <Route path="/review" component={WeeklyReview} />
      <Route path="/review/:weekNumber" component={WeeklyReview} />
      <Route path="/cycle-review/:reviewType" component={CycleReview} />
      <Route path="/checklist" component={Checklist} />
      <Route path="/settings" component={Settings} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
