import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { FileText, Quote, Target, TrendingUp, AlertTriangle, Lightbulb, ArrowLeft, Download } from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { toast } from "sonner";
import { getRandomQuote } from "@shared/quotes";
import { useAutoSave } from "@/hooks/useAutoSave";
import SaveStatusIndicator from "@/components/SaveStatusIndicator";

export default function CycleReview() {
  const params = useParams<{ reviewType: string }>();
  const [, setLocation] = useLocation();
  const reviewType = (params.reviewType === 'final' ? 'final' : 'mid_cycle') as 'mid_cycle' | 'final';
  
  const { data: cycles } = trpc.cycle.list.useQuery();
  const activeCycle = cycles?.find(c => c.status === 'active') || cycles?.[0];
  
  const { data: review, isLoading } = trpc.cycleReview.get.useQuery(
    { cycleId: activeCycle?.id ?? 0, reviewType },
    { enabled: !!activeCycle }
  );

  const { data: stats } = trpc.stats.getDashboard.useQuery(
    { cycleId: activeCycle?.id ?? 0 },
    { enabled: !!activeCycle }
  );

  const { data: goals } = trpc.goal.list.useQuery(
    { cycleId: activeCycle?.id ?? 0 },
    { enabled: !!activeCycle }
  );

  const [averageExecutionScore, setAverageExecutionScore] = useState("");
  const [greatestSuccess, setGreatestSuccess] = useState("");
  const [biggestObstacle, setBiggestObstacle] = useState("");
  const [mostEffectiveTactic, setMostEffectiveTactic] = useState("");
  const [pitfallsEncountered, setPitfallsEncountered] = useState("");
  const [adjustmentsForNextCycle, setAdjustmentsForNextCycle] = useState("");
  const [lessonsLearned, setLessonsLearned] = useState("");
  const [quote] = useState(() => getRandomQuote("review"));

  const upsertReview = trpc.cycleReview.upsert.useMutation();
  const utils = trpc.useUtils();

  const handleExportPDF = async () => {
    if (!activeCycle) return;
    try {
      const response = await fetch(`/api/trpc/export.cycleReview?input=${encodeURIComponent(JSON.stringify({ cycleId: activeCycle.id, reviewType }))}`);
      const data = await response.json();
      const html = data.result?.data?.html;
      if (html) {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          printWindow.print();
        }
      }
    } catch (error) {
      toast.error("Failed to export review");
    }
  };

  useEffect(() => {
    if (review) {
      setAverageExecutionScore(review.averageExecutionScore || "");
      setGreatestSuccess(review.greatestSuccess || "");
      setBiggestObstacle(review.biggestObstacle || "");
      setMostEffectiveTactic(review.mostEffectiveTactic || "");
      setPitfallsEncountered(review.pitfallsEncountered || "");
      setAdjustmentsForNextCycle(review.adjustmentsForNextCycle || "");
      setLessonsLearned(review.lessonsLearned || "");
    }
  }, [review]);

  useEffect(() => {
    if (stats && !averageExecutionScore) {
      setAverageExecutionScore(stats.averageScore.toFixed(1));
    }
  }, [stats, averageExecutionScore]);

  // Auto-save data object
  const reviewData = useMemo(() => ({
    averageExecutionScore,
    greatestSuccess,
    biggestObstacle,
    mostEffectiveTactic,
    pitfallsEncountered,
    adjustmentsForNextCycle,
    lessonsLearned,
  }), [averageExecutionScore, greatestSuccess, biggestObstacle, mostEffectiveTactic, pitfallsEncountered, adjustmentsForNextCycle, lessonsLearned]);

  // Auto-save callback
  const performAutoSave = useCallback(async (data: typeof reviewData) => {
    if (!activeCycle) return;

    await upsertReview.mutateAsync({
      cycleId: activeCycle.id,
      reviewType,
      averageExecutionScore: data.averageExecutionScore,
      greatestSuccess: data.greatestSuccess,
      biggestObstacle: data.biggestObstacle,
      mostEffectiveTactic: data.mostEffectiveTactic,
      pitfallsEncountered: data.pitfallsEncountered,
      adjustmentsForNextCycle: data.adjustmentsForNextCycle,
      lessonsLearned: data.lessonsLearned,
    });
    utils.cycleReview.get.invalidate();
  }, [activeCycle, reviewType, upsertReview, utils]);

  // Auto-save hook
  const { status: saveStatus, retry: retrySave } = useAutoSave({
    data: reviewData,
    onSave: performAutoSave,
    debounceMs: 1000,
    enabled: !!activeCycle,
  });

  const isMidCycle = reviewType === 'mid_cycle';
  const title = isMidCycle ? "Mid-Cycle Review (Week 6)" : "Final Cycle Review (Week 13)";
  const description = isMidCycle 
    ? "Assess your progress at the halfway point and make strategic adjustments"
    : "Reflect on your entire 12-week cycle and prepare for the next one";

  if (!activeCycle) {
    return (
      <AppLayout currentPage="review">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <FileText className="h-16 w-16 text-muted-foreground/40 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Active Cycle</h2>
          <p className="text-muted-foreground">Create a cycle from the dashboard to complete reviews.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout currentPage="review">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setLocation("/review")}
              className="mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Weekly Review
            </Button>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <FileText className="h-7 w-7 text-primary" />
              {title}
            </h1>
            <p className="text-muted-foreground mt-1">{description}</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={handleExportPDF}
            >
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
            <SaveStatusIndicator 
              status={saveStatus} 
              onRetry={retrySave}
            />
          </div>
        </div>

        {/* Quote Card */}
        <div className="quote-card">
          <Quote className="h-5 w-5 text-primary/40 mb-2" />
          <p className="text-sm italic text-foreground/90">"{quote.text}"</p>
          <p className="text-xs text-primary mt-2">— {quote.chapter}</p>
        </div>

        {/* Stats Summary */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Execution Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <p className="text-sm text-muted-foreground">Average Execution Score</p>
                <p className="text-3xl font-bold mt-1">
                  {stats?.averageScore.toFixed(0) ?? 0}%
                </p>
                <Progress value={stats?.averageScore ?? 0} className="mt-2 h-2" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Weeks On Target (85%+)</p>
                <p className="text-3xl font-bold mt-1">
                  {stats?.weeksOnTarget ?? 0} / {stats?.totalWeeks ?? 0}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Goals</p>
                <p className="text-3xl font-bold mt-1">{goals?.length ?? 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Goals Progress */}
        {goals && goals.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Goal Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {goals.map((goal, index) => (
                  <div key={goal.id} className="p-4 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <span className="font-bold text-primary text-sm">{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{goal.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {goal.lagIndicator}: {goal.lagCurrentValue || '0'} / {goal.lagTarget || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Review Questions */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              Successes & Wins
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-base">What was your greatest success this {isMidCycle ? 'half-cycle' : 'cycle'}?</Label>
              <Textarea
                value={greatestSuccess}
                onChange={(e) => setGreatestSuccess(e.target.value)}
                placeholder="Describe your biggest win or achievement..."
                className="min-h-[100px] bg-input border-border"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-base">Which tactic was most effective?</Label>
              <Textarea
                value={mostEffectiveTactic}
                onChange={(e) => setMostEffectiveTactic(e.target.value)}
                placeholder="Which lead indicator had the biggest impact on your results?"
                className="min-h-[80px] bg-input border-border"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-accent" />
              Challenges & Obstacles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-base">What was your biggest obstacle?</Label>
              <Textarea
                value={biggestObstacle}
                onChange={(e) => setBiggestObstacle(e.target.value)}
                placeholder="What got in the way of your execution?"
                className="min-h-[100px] bg-input border-border"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-base">Which pitfalls did you encounter?</Label>
              <Textarea
                value={pitfallsEncountered}
                onChange={(e) => setPitfallsEncountered(e.target.value)}
                placeholder="Common pitfalls: All-or-nothing thinking, lack of accountability, poor time blocking..."
                className="min-h-[80px] bg-input border-border"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Looking Forward</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-base">
                What adjustments will you make {isMidCycle ? 'for the second half' : 'in your next cycle'}?
              </Label>
              <Textarea
                value={adjustmentsForNextCycle}
                onChange={(e) => setAdjustmentsForNextCycle(e.target.value)}
                placeholder="Specific changes to goals, tactics, or approach..."
                className="min-h-[100px] bg-input border-border"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-base">Key lessons learned</Label>
              <Textarea
                value={lessonsLearned}
                onChange={(e) => setLessonsLearned(e.target.value)}
                placeholder="What insights will you carry forward?"
                className="min-h-[100px] bg-input border-border"
              />
            </div>
          </CardContent>
        </Card>

        {/* Common Pitfalls Reference */}
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="text-lg">Common Pitfalls to Avoid</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• <strong>All-or-Nothing Thinking:</strong> Missing one tactic doesn't ruin the week</li>
              <li>• <strong>Lack of Vision Connection:</strong> Goals must connect to your "Why"</li>
              <li>• <strong>Too Many Goals:</strong> Stick to 1-3 maximum per cycle</li>
              <li>• <strong>Vague Tactics:</strong> Use the Monday Morning Test</li>
              <li>• <strong>Ignoring the Score:</strong> Measure weekly, adjust accordingly</li>
              <li>• <strong>Skipping WAMs:</strong> Accountability is essential for success</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
