import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { CheckSquare, Quote, Rocket, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { getRandomQuote } from "@shared/quotes";

const CHECKLIST_CATEGORIES = [
  {
    title: "Vision & Purpose",
    items: [
      { key: "vision_written", label: "I have written my 3-5 year vision" },
      { key: "strategic_imperatives", label: "I have identified 2-3 strategic imperatives" },
      { key: "commitment_statement", label: "I have created a personal commitment statement" },
    ],
  },
  {
    title: "Goal Setting",
    items: [
      { key: "goals_defined", label: "I have defined 1-3 SMART goals for this cycle" },
      { key: "lag_indicators", label: "Each goal has a clear lag indicator (result)" },
      { key: "goals_connected", label: "My goals connect to my vision and strategic imperatives" },
    ],
  },
  {
    title: "Tactics & Lead Indicators",
    items: [
      { key: "tactics_defined", label: "I have defined specific tactics for each goal" },
      { key: "weekly_targets", label: "Each tactic has a weekly target" },
      { key: "monday_test", label: "My tactics pass the Monday Morning Test (clear & actionable)" },
    ],
  },
  {
    title: "Time Blocking",
    items: [
      { key: "strategic_blocks", label: "I have scheduled Strategic Blocks (3+ hours for deep work)" },
      { key: "buffer_blocks", label: "I have scheduled Buffer Blocks (for admin tasks)" },
      { key: "breakout_blocks", label: "I have scheduled Breakout Blocks (for growth & recharge)" },
    ],
  },
  {
    title: "Accountability",
    items: [
      { key: "wam_scheduled", label: "I have a Weekly Accountability Meeting (WAM) scheduled" },
      { key: "accountability_partner", label: "I have an accountability partner or group" },
      { key: "scorecard_ready", label: "I understand how to use the weekly scorecard" },
    ],
  },
  {
    title: "Mindset",
    items: [
      { key: "understand_85", label: "I understand the 85% execution target rule" },
      { key: "committed_12_weeks", label: "I am committed to treating these 12 weeks as a complete year" },
      { key: "ready_discomfort", label: "I am ready to embrace productive tension" },
    ],
  },
];

export default function Checklist() {
  const [, setLocation] = useLocation();
  const [quote] = useState(() => getRandomQuote("commitment"));

  const { data: cycles } = trpc.cycle.list.useQuery();
  const activeCycle = cycles?.find(c => c.status === 'active') || cycles?.[0];
  
  const { data: checklist, isLoading } = trpc.checklist.get.useQuery(
    { cycleId: activeCycle?.id ?? 0 },
    { enabled: !!activeCycle }
  );

  const updateItem = trpc.checklist.update.useMutation();
  const updateCycle = trpc.cycle.update.useMutation();
  const utils = trpc.useUtils();

  const handleToggle = async (itemId: number, isCompleted: boolean) => {
    try {
      await updateItem.mutateAsync({ itemId, isCompleted });
      utils.checklist.get.invalidate();
    } catch (error) {
      toast.error("Failed to update checklist");
    }
  };

  const completedCount = checklist?.filter(item => item.isCompleted).length ?? 0;
  const totalCount = checklist?.length ?? 0;
  const completionPercentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
  const isReady = completionPercentage >= 80;

  const handleStartCycle = async () => {
    if (!activeCycle) return;
    
    try {
      await updateCycle.mutateAsync({
        cycleId: activeCycle.id,
        status: 'active',
      });
      utils.cycle.list.invalidate();
      toast.success("Cycle started! Let's execute!");
      setLocation("/dashboard");
    } catch (error) {
      toast.error("Failed to start cycle");
    }
  };

  // Group checklist items by category
  const getItemForKey = (key: string) => {
    return checklist?.find(item => item.itemKey === key);
  };

  if (!activeCycle) {
    return (
      <AppLayout currentPage="checklist">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <CheckSquare className="h-16 w-16 text-muted-foreground/40 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Active Cycle</h2>
          <p className="text-muted-foreground">Create a cycle from the dashboard to view your checklist.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout currentPage="checklist">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <CheckSquare className="h-7 w-7 text-primary" />
              Pre-Cycle Checklist
            </h1>
            <p className="text-muted-foreground mt-1">
              Ensure you're ready before starting your 12-week execution
            </p>
          </div>
          {isReady && activeCycle.status === 'planning' && (
            <Button 
              onClick={handleStartCycle}
              className="gradient-primary text-primary-foreground glow-primary"
            >
              <Rocket className="mr-2 h-4 w-4" />
              Start My 12-Week Year
            </Button>
          )}
        </div>

        {/* Progress Card */}
        <Card className="bg-card border-border">
          <CardContent className="py-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Readiness Score</h3>
                <p className="text-sm text-muted-foreground">
                  Complete at least 80% to start your cycle
                </p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-bold">{completedCount}</span>
                <span className="text-muted-foreground">/{totalCount}</span>
              </div>
            </div>
            <Progress value={completionPercentage} className="h-3" />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>0%</span>
              <span className={isReady ? "text-primary font-medium" : ""}>
                {completionPercentage.toFixed(0)}% Complete
              </span>
              <span>100%</span>
            </div>
            {!isReady && (
              <p className="text-sm text-accent mt-4">
                Complete {Math.ceil(totalCount * 0.8) - completedCount} more items to unlock cycle start
              </p>
            )}
          </CardContent>
        </Card>

        {/* Quote Card */}
        <div className="quote-card">
          <Quote className="h-5 w-5 text-primary/40 mb-2" />
          <p className="text-sm italic text-foreground/90">"{quote.text}"</p>
          <p className="text-xs text-primary mt-2">— {quote.chapter}</p>
        </div>

        {/* Checklist Categories */}
        {CHECKLIST_CATEGORIES.map((category, categoryIndex) => (
          <Card key={categoryIndex} className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg">{category.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {category.items.map((item) => {
                  const checklistItem = getItemForKey(item.key);
                  return (
                    <div 
                      key={item.key}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors"
                    >
                      <Checkbox
                        id={item.key}
                        checked={checklistItem?.isCompleted ?? false}
                        onCheckedChange={(checked) => {
                          if (checklistItem) {
                            handleToggle(checklistItem.id, checked as boolean);
                          }
                        }}
                        className="mt-0.5"
                      />
                      <label 
                        htmlFor={item.key}
                        className={`text-sm cursor-pointer ${checklistItem?.isCompleted ? 'text-muted-foreground line-through' : ''}`}
                      >
                        {item.label}
                      </label>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Quick Links */}
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="text-lg">Quick Setup Links</CardTitle>
            <CardDescription>
              Jump to each section to complete your setup
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-3">
              <Button variant="outline" onClick={() => setLocation("/vision")} className="justify-start">
                <ArrowRight className="mr-2 h-4 w-4" />
                Set Your Vision
              </Button>
              <Button variant="outline" onClick={() => setLocation("/goals")} className="justify-start">
                <ArrowRight className="mr-2 h-4 w-4" />
                Define Goals & Tactics
              </Button>
              <Button variant="outline" onClick={() => setLocation("/blocks")} className="justify-start">
                <ArrowRight className="mr-2 h-4 w-4" />
                Schedule Performance Blocks
              </Button>
              <Button variant="outline" onClick={() => setLocation("/settings")} className="justify-start">
                <ArrowRight className="mr-2 h-4 w-4" />
                Configure Reminders
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
