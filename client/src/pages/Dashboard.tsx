import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { 
  Target, 
  TrendingUp, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  Plus,
  ArrowRight,
  Sparkles,
  Users,
  Quote
} from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { BOOK_QUOTES, FLASHCARDS, getRandomQuote, getRandomFlashcard } from "@shared/quotes";
import Onboarding from "@/components/Onboarding";

function FlashcardWidget() {
  const [flipped, setFlipped] = useState(false);
  const [flashcard, setFlashcard] = useState(() => getRandomFlashcard());
  const recordView = trpc.flashcard.recordView.useMutation();

  const handleFlip = () => {
    if (!flipped) {
      recordView.mutate({ flashcardKey: flashcard.id, context: "dashboard" });
    }
    setFlipped(!flipped);
  };

  const handleNext = () => {
    setFlipped(false);
    setFlashcard(getRandomFlashcard([flashcard.id]));
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Daily Flashcard
        </CardTitle>
        <CardDescription>Tap to reveal the answer</CardDescription>
      </CardHeader>
      <CardContent>
        <div 
          className={`flashcard ${flipped ? 'flipped' : ''}`}
          onClick={handleFlip}
        >
          <div className="flashcard-inner">
            <div className="flashcard-front">
              <p className="font-medium">{flashcard.front}</p>
            </div>
            <div className="flashcard-back">
              <p className="text-sm whitespace-pre-line">{flashcard.back}</p>
            </div>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          className="w-full mt-4"
          onClick={handleNext}
        >
          Next Card
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
}

function QuoteWidget() {
  const [quote] = useState(() => getRandomQuote());

  return (
    <div className="quote-card">
      <Quote className="h-6 w-6 text-primary/40 mb-3" />
      <p className="text-sm italic text-foreground/90 mb-2">
        "{quote.text}"
      </p>
      <p className="text-xs text-primary">— {quote.chapter}</p>
    </div>
  );
}

function CreateCyclePrompt() {
  const [, setLocation] = useLocation();
  const createCycle = trpc.cycle.create.useMutation();
  const utils = trpc.useUtils();

  const handleCreateCycle = async () => {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 84); // 12 weeks

    await createCycle.mutateAsync({
      title: `12-Week Cycle - ${startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`,
      startDate,
      endDate,
    });
    utils.cycle.list.invalidate();
    setLocation("/checklist");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="h-20 w-20 rounded-2xl gradient-primary flex items-center justify-center mb-6 glow-primary">
        <Calendar className="h-10 w-10 text-primary-foreground" />
      </div>
      <h2 className="text-2xl font-bold mb-3">Start Your 12-Week Journey</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        Create your first 12-week cycle to begin tracking your goals and execution.
      </p>
      <Button 
        onClick={handleCreateCycle}
        size="lg"
        className="gradient-primary text-primary-foreground glow-primary"
        disabled={createCycle.isPending}
      >
        <Plus className="mr-2 h-5 w-5" />
        Create New Cycle
      </Button>
    </div>
  );
}

const ONBOARDING_KEY = '12wy_onboarding_complete';

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [showOnboarding, setShowOnboarding] = useState(() => {
    if (typeof window !== 'undefined') {
      return !localStorage.getItem(ONBOARDING_KEY);
    }
    return false;
  });
  
  const handleOnboardingComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setShowOnboarding(false);
  };

  const handleShowIntro = () => {
    setShowOnboarding(true);
  };
  
  const { data: cycles, isLoading: cyclesLoading } = trpc.cycle.list.useQuery();
  
  const activeCycle = cycles?.find(c => c.status === 'active') || cycles?.[0];
  
  const { data: stats, isLoading: statsLoading } = trpc.stats.getDashboard.useQuery(
    { cycleId: activeCycle?.id ?? 0 },
    { enabled: !!activeCycle }
  );

  const { data: goals } = trpc.goal.list.useQuery(
    { cycleId: activeCycle?.id ?? 0 },
    { enabled: !!activeCycle }
  );

  if (cyclesLoading) {
    return (
      <AppLayout currentPage="dashboard" showIntro={handleShowIntro}>
        <div className="animate-pulse space-y-6">
          <div className="h-8 w-48 bg-muted rounded" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-muted rounded-xl" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  // Show onboarding for new users
  if (showOnboarding) {
    return (
      <>
        <Onboarding onComplete={handleOnboardingComplete} />
        <AppLayout currentPage="dashboard" showIntro={handleShowIntro}>
          <CreateCyclePrompt />
        </AppLayout>
      </>
    );
  }

  if (!cycles || cycles.length === 0) {
    return (
      <AppLayout currentPage="dashboard" showIntro={handleShowIntro}>
        <CreateCyclePrompt />
      </AppLayout>
    );
  }

  const currentWeek = activeCycle ? Math.min(
    Math.ceil((Date.now() - new Date(activeCycle.startDate).getTime()) / (7 * 24 * 60 * 60 * 1000)),
    12
  ) : 1;

  const scoreStatus = (stats?.currentWeekScore ?? 0) >= 85 
    ? 'on-target' 
    : (stats?.currentWeekScore ?? 0) >= 70 
      ? 'below-target' 
      : 'critical';

  const chartData = stats?.weeklyScores?.map(s => ({
    week: `W${s.weekNumber}`,
    score: s.score,
    target: 85,
  })) ?? [];

  // Add remaining weeks with null scores
  for (let i = (stats?.weeklyScores?.length ?? 0) + 1; i <= 12; i++) {
    chartData.push({ week: `W${i}`, score: 0, target: 85 });
  }

  return (
    <AppLayout currentPage="dashboard" showIntro={handleShowIntro}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              {activeCycle?.title} • Week {currentWeek} of 12
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setLocation("/scorecard")}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Update Scorecard
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-border card-hover">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Current Week Score</p>
                  <p className="text-3xl font-bold mt-1">
                    {stats?.currentWeekScore?.toFixed(0) ?? 0}%
                  </p>
                </div>
                <div className={`score-badge ${scoreStatus}`}>
                  {scoreStatus === 'on-target' ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                </div>
              </div>
              <Progress 
                value={stats?.currentWeekScore ?? 0} 
                className="mt-4 h-2"
              />
            </CardContent>
          </Card>

          <Card className="bg-card border-border card-hover">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Average Score</p>
                  <p className="text-3xl font-bold mt-1">
                    {stats?.averageScore?.toFixed(0) ?? 0}%
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary/40" />
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Target: 85% • {stats?.weeksOnTarget ?? 0}/{stats?.totalWeeks ?? 0} weeks on target
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border card-hover">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active Goals</p>
                  <p className="text-3xl font-bold mt-1">{goals?.length ?? 0}</p>
                </div>
                <Target className="h-8 w-8 text-primary/40" />
              </div>
              <p className="text-xs text-muted-foreground mt-4">
                Recommended: 1-3 goals per cycle
              </p>
            </CardContent>
          </Card>

          <Card className="bg-card border-border card-hover">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">vs. Community</p>
                  <p className="text-3xl font-bold mt-1">
                    {((stats?.userAverageScore ?? 0) - (stats?.globalAverageScore ?? 85)).toFixed(0)}%
                  </p>
                </div>
                <Users className="h-8 w-8 text-primary/40" />
              </div>
              <div className="mt-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>You: {stats?.userAverageScore?.toFixed(0) ?? 0}%</span>
                  <span>Avg: {stats?.globalAverageScore?.toFixed(0) ?? 85}%</span>
                </div>
                <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="absolute h-full bg-muted-foreground/30 rounded-full"
                    style={{ width: `${stats?.globalAverageScore ?? 85}%` }}
                  />
                  <div 
                    className="absolute h-full gradient-primary rounded-full"
                    style={{ width: `${stats?.userAverageScore ?? 0}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Execution Score Chart */}
          <Card className="lg:col-span-2 bg-card border-border">
            <CardHeader>
              <CardTitle>Execution Score Trend</CardTitle>
              <CardDescription>Weekly execution scores with 85% target line</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="week" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      domain={[0, 100]} 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <ReferenceLine 
                      y={85} 
                      stroke="hsl(var(--primary))" 
                      strokeDasharray="5 5"
                      label={{ value: '85% Target', fill: 'hsl(var(--primary))', fontSize: 12 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="score" 
                      stroke="hsl(var(--chart-1))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--chart-1))' }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Right Column */}
          <div className="space-y-6">
            <FlashcardWidget />
            <QuoteWidget />
          </div>
        </div>

        {/* Goals Overview */}
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Goals Overview</CardTitle>
              <CardDescription>Your 12-week goals and progress</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setLocation("/goals")}>
              Manage Goals
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {goals && goals.length > 0 ? (
              <div className="space-y-4">
                {goals.map((goal, index) => (
                  <div key={goal.id} className="flex items-center gap-4 p-4 rounded-lg bg-muted/30">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="font-bold text-primary">{index + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{goal.title}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {goal.lagIndicator || 'No lag indicator set'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{goal.lagCurrentValue || '0'}</p>
                      <p className="text-xs text-muted-foreground">/ {goal.lagTarget || 'N/A'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">No goals set yet</p>
                <Button variant="outline" onClick={() => setLocation("/goals")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Your First Goal
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
