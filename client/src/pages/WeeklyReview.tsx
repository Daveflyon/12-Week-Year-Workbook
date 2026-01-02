import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { FileText, ChevronLeft, ChevronRight, Save, Quote, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { toast } from "sonner";
import { getQuoteForWeek, WEEK_THEMES } from "@shared/quotes";
import TooltipTour, { TourStep } from "@/components/TooltipTour";

const REVIEW_TOUR_STEPS: TourStep[] = [
  {
    target: "[data-tour='score-summary']",
    title: "Weekly Score Summary",
    content: "Review your execution score for the week. This helps you understand your performance before reflecting.",
    position: "bottom",
  },
  {
    target: "[data-tour='reflection-section']",
    title: "Weekly Reflection",
    content: "Answer these questions honestly. What worked? What didn't? What will you adjust? This drives continuous improvement.",
    position: "top",
  },
  {
    target: "[data-tour='wam-section']",
    title: "Weekly Accountability Meeting",
    content: "Track your WAM with your accountability partner. Regular check-ins dramatically improve execution.",
    position: "top",
  },
];

export default function WeeklyReview() {
  const params = useParams<{ weekNumber?: string }>();
  const [, setLocation] = useLocation();
  
  const { data: cycles } = trpc.cycle.list.useQuery();
  const activeCycle = cycles?.find(c => c.status === 'active') || cycles?.[0];
  
  const currentWeekFromCycle = activeCycle ? Math.min(
    Math.max(1, Math.ceil((Date.now() - new Date(activeCycle.startDate).getTime()) / (7 * 24 * 60 * 60 * 1000))),
    12
  ) : 1;
  
  const [selectedWeek, setSelectedWeek] = useState(
    params.weekNumber ? parseInt(params.weekNumber) : currentWeekFromCycle
  );

  const { data: review, isLoading } = trpc.weeklyReview.get.useQuery(
    { cycleId: activeCycle?.id ?? 0, weekNumber: selectedWeek },
    { enabled: !!activeCycle }
  );

  const { data: weeklyScore } = trpc.weeklyScore.get.useQuery(
    { cycleId: activeCycle?.id ?? 0, weekNumber: selectedWeek },
    { enabled: !!activeCycle }
  );

  const [whatWorkedWell, setWhatWorkedWell] = useState("");
  const [whatDidNotWork, setWhatDidNotWork] = useState("");
  const [adjustmentsForNextWeek, setAdjustmentsForNextWeek] = useState("");
  const [wamCompleted, setWamCompleted] = useState(false);
  const [wamNotes, setWamNotes] = useState("");

  const upsertReview = trpc.weeklyReview.upsert.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (review) {
      setWhatWorkedWell(review.whatWorkedWell || "");
      setWhatDidNotWork(review.whatDidNotWork || "");
      setAdjustmentsForNextWeek(review.adjustmentsForNextWeek || "");
      setWamCompleted(review.wamCompleted || false);
      setWamNotes(review.wamNotes || "");
    } else {
      setWhatWorkedWell("");
      setWhatDidNotWork("");
      setAdjustmentsForNextWeek("");
      setWamCompleted(false);
      setWamNotes("");
    }
  }, [review]);

  const handleSave = async () => {
    if (!activeCycle) return;

    try {
      await upsertReview.mutateAsync({
        cycleId: activeCycle.id,
        weekNumber: selectedWeek,
        whatWorkedWell,
        whatDidNotWork,
        adjustmentsForNextWeek,
        wamCompleted,
        wamNotes,
      });
      utils.weeklyReview.get.invalidate();
      toast.success("Review saved successfully");
    } catch (error) {
      toast.error("Failed to save review");
    }
  };

  const weekTheme = WEEK_THEMES.find(w => w.week === selectedWeek);
  const weekQuote = getQuoteForWeek(selectedWeek);
  const executionScore = weeklyScore ? parseFloat(weeklyScore.executionScore ?? "0") : 0;
  const scoreStatus = executionScore >= 85 ? 'on-target' : executionScore >= 70 ? 'below-target' : 'critical';

  // Check if this is Week 6 (mid-cycle) or Week 12 (final)
  const isMidCycleWeek = selectedWeek === 6;
  const isFinalWeek = selectedWeek === 12;

  if (!activeCycle) {
    return (
      <AppLayout currentPage="review">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <FileText className="h-16 w-16 text-muted-foreground/40 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Active Cycle</h2>
          <p className="text-muted-foreground">Create a cycle from the dashboard to start your reviews.</p>
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
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <FileText className="h-7 w-7 text-primary" />
              Weekly Review
            </h1>
            <p className="text-muted-foreground mt-1">
              Reflect on your execution and plan adjustments
            </p>
          </div>
          <Button 
            onClick={handleSave}
            disabled={upsertReview.isPending}
            className="gradient-primary text-primary-foreground"
          >
            <Save className="mr-2 h-4 w-4" />
            Save Review
          </Button>
        </div>

        {/* Tooltip Tour */}
        <TooltipTour pageKey="review" steps={REVIEW_TOUR_STEPS} />

        {/* Week Navigation */}
        <Card className="bg-card border-border" data-tour="score-summary">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                onClick={() => setSelectedWeek(Math.max(1, selectedWeek - 1))}
                disabled={selectedWeek <= 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              
              <div className="flex items-center gap-4">
                <Select 
                  value={selectedWeek.toString()} 
                  onValueChange={(v) => setSelectedWeek(parseInt(v))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={(i + 1).toString()}>
                        Week {i + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <div className="text-center hidden md:block">
                  <p className="text-sm font-medium">{weekTheme?.theme}</p>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className={`score-badge ${scoreStatus}`}>
                      {executionScore.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
              
              <Button 
                variant="ghost" 
                onClick={() => setSelectedWeek(Math.min(12, selectedWeek + 1))}
                disabled={selectedWeek >= 12}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Special Week Notices */}
        {isMidCycleWeek && (
          <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
            <h3 className="font-semibold text-primary mb-2">Mid-Cycle Review (Week 6)</h3>
            <p className="text-sm text-muted-foreground mb-3">
              This is your mid-cycle checkpoint. Take extra time to assess your progress and make strategic adjustments.
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setLocation("/cycle-review/mid_cycle")}
            >
              Complete Mid-Cycle Review
            </Button>
          </div>
        )}

        {isFinalWeek && (
          <div className="p-4 rounded-lg bg-accent/10 border border-accent/30">
            <h3 className="font-semibold text-accent mb-2">Final Week (Week 12)</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Congratulations on reaching the final week! Complete your final review and plan your next cycle.
            </p>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setLocation("/cycle-review/final")}
            >
              Complete Final Review
            </Button>
          </div>
        )}

        {/* Quote Card */}
        <div className="quote-card">
          <Quote className="h-5 w-5 text-primary/40 mb-2" />
          <p className="text-sm italic text-foreground/90">"{weekQuote.text}"</p>
          <p className="text-xs text-primary mt-2">— {weekQuote.chapter}</p>
        </div>

        {/* WAM Section */}
        <Card className="bg-card border-border" data-tour="wam-section">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Weekly Accountability Meeting (WAM)
            </CardTitle>
            <CardDescription>
              15-20 minute meeting to review progress and commit to next week
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
              <div>
                <p className="font-medium">WAM Completed</p>
                <p className="text-sm text-muted-foreground">
                  Did you complete your weekly accountability meeting?
                </p>
              </div>
              <Switch
                checked={wamCompleted}
                onCheckedChange={setWamCompleted}
              />
            </div>
            {wamCompleted && (
              <div className="space-y-2">
                <Label>WAM Notes</Label>
                <Textarea
                  value={wamNotes}
                  onChange={(e) => setWamNotes(e.target.value)}
                  placeholder="Key takeaways from your accountability meeting..."
                  className="bg-input border-border"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Review Questions */}
        <Card className="bg-card border-border" data-tour="reflection-section">
          <CardHeader>
            <CardTitle>Weekly Reflection</CardTitle>
            <CardDescription>
              Answer these questions to learn from your week
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label className="text-base">What worked well this week?</Label>
              <Textarea
                value={whatWorkedWell}
                onChange={(e) => setWhatWorkedWell(e.target.value)}
                placeholder="List your wins, successful tactics, and positive habits..."
                className="min-h-[100px] bg-input border-border"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-base">What didn't work or got in the way?</Label>
              <Textarea
                value={whatDidNotWork}
                onChange={(e) => setWhatDidNotWork(e.target.value)}
                placeholder="Identify obstacles, missed tactics, and areas for improvement..."
                className="min-h-[100px] bg-input border-border"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-base">What adjustments will you make next week?</Label>
              <Textarea
                value={adjustmentsForNextWeek}
                onChange={(e) => setAdjustmentsForNextWeek(e.target.value)}
                placeholder="Specific changes to tactics, schedule, or approach..."
                className="min-h-[100px] bg-input border-border"
              />
            </div>
          </CardContent>
        </Card>

        {/* Review Prompts */}
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="text-lg">Review Prompts</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• Did I protect my Strategic Blocks this week?</li>
              <li>• Which tactics had the highest impact on my goals?</li>
              <li>• What distractions pulled me away from execution?</li>
              <li>• Am I on track to hit 85% for the week?</li>
              <li>• What one thing could I do differently next week?</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
