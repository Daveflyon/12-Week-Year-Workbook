import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { trpc } from "@/lib/trpc";
import { Target, Plus, Trash2, Edit, CheckCircle2, Quote } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { getRandomQuote } from "@shared/quotes";
import TooltipTour, { TourStep } from "@/components/TooltipTour";

const GOALS_TOUR_STEPS: TourStep[] = [
  {
    target: "[data-tour='add-goal-btn']",
    title: "Add Your Goals",
    content: "Create 1-3 SMART goals for this 12-week cycle. Focus is key - fewer goals mean better execution.",
    position: "bottom",
  },
  {
    target: "[data-tour='goal-card']",
    title: "Goal Structure",
    content: "Each goal has a lag indicator (the outcome you want) and lead indicators (the actions that drive results).",
    position: "right",
  },
  {
    target: "[data-tour='tactic-section']",
    title: "Weekly Tactics",
    content: "Add specific, measurable tactics with weekly targets. These become your daily scorecard items.",
    position: "top",
  },
];

function GoalForm({ 
  cycleId, 
  goal, 
  onClose 
}: { 
  cycleId: number; 
  goal?: any; 
  onClose: () => void;
}) {
  const [title, setTitle] = useState(goal?.title || "");
  const [lagIndicator, setLagIndicator] = useState(goal?.lagIndicator || "");
  const [lagTarget, setLagTarget] = useState(goal?.lagTarget || "");
  const [whyItMatters, setWhyItMatters] = useState(goal?.whyItMatters || "");

  const createGoal = trpc.goal.create.useMutation();
  const updateGoal = trpc.goal.update.useMutation();
  const utils = trpc.useUtils();

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Goal title is required");
      return;
    }

    try {
      if (goal) {
        await updateGoal.mutateAsync({
          goalId: goal.id,
          title,
          lagIndicator,
          lagTarget,
          whyItMatters,
        });
        toast.success("Goal updated");
      } else {
        await createGoal.mutateAsync({
          cycleId,
          title,
          lagIndicator,
          lagTarget,
          whyItMatters,
        });
        toast.success("Goal created");
      }
      utils.goal.list.invalidate();
      onClose();
    } catch (error) {
      toast.error("Failed to save goal");
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Goal Title</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Launch the new API service"
          className="bg-input border-border"
        />
      </div>
      <div className="space-y-2">
        <Label>Lag Indicator (Result)</Label>
        <Input
          value={lagIndicator}
          onChange={(e) => setLagIndicator(e.target.value)}
          placeholder="e.g., 100% test coverage, $10,000 revenue"
          className="bg-input border-border"
        />
      </div>
      <div className="space-y-2">
        <Label>Target Value</Label>
        <Input
          value={lagTarget}
          onChange={(e) => setLagTarget(e.target.value)}
          placeholder="e.g., 100%, $10,000"
          className="bg-input border-border"
        />
      </div>
      <div className="space-y-2">
        <Label>Why This Goal Matters</Label>
        <Textarea
          value={whyItMatters}
          onChange={(e) => setWhyItMatters(e.target.value)}
          placeholder="Connect this goal to your vision..."
          className="bg-input border-border"
        />
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit}
          disabled={createGoal.isPending || updateGoal.isPending}
          className="gradient-primary text-primary-foreground"
        >
          {goal ? "Update Goal" : "Create Goal"}
        </Button>
      </DialogFooter>
    </div>
  );
}

function TacticForm({ 
  goalId, 
  tactic, 
  onClose 
}: { 
  goalId: number; 
  tactic?: any; 
  onClose: () => void;
}) {
  const [title, setTitle] = useState(tactic?.title || "");
  const [weeklyTarget, setWeeklyTarget] = useState(tactic?.weeklyTarget?.toString() || "");
  const [measurementUnit, setMeasurementUnit] = useState(tactic?.measurementUnit || "");

  const createTactic = trpc.tactic.create.useMutation();
  const updateTactic = trpc.tactic.update.useMutation();
  const utils = trpc.useUtils();

  const handleSubmit = async () => {
    if (!title.trim() || !weeklyTarget) {
      toast.error("Title and weekly target are required");
      return;
    }

    const weeklyTargetNum = parseInt(weeklyTarget);
    const totalTarget = weeklyTargetNum * 12;

    try {
      if (tactic) {
        await updateTactic.mutateAsync({
          tacticId: tactic.id,
          title,
          weeklyTarget: weeklyTargetNum,
          totalTarget,
          measurementUnit,
        });
        toast.success("Tactic updated");
      } else {
        await createTactic.mutateAsync({
          goalId,
          title,
          weeklyTarget: weeklyTargetNum,
          totalTarget,
          measurementUnit,
        });
        toast.success("Tactic created");
      }
      utils.tactic.listByGoal.invalidate();
      onClose();
    } catch (error) {
      toast.error("Failed to save tactic");
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Tactic (Lead Indicator)</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Code commits, Sales calls, Workouts"
          className="bg-input border-border"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Weekly Target</Label>
          <Input
            type="number"
            value={weeklyTarget}
            onChange={(e) => setWeeklyTarget(e.target.value)}
            placeholder="e.g., 5"
            className="bg-input border-border"
          />
        </div>
        <div className="space-y-2">
          <Label>Measurement Unit</Label>
          <Input
            value={measurementUnit}
            onChange={(e) => setMeasurementUnit(e.target.value)}
            placeholder="e.g., commits, calls, hours"
            className="bg-input border-border"
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        12-Week Total: {weeklyTarget ? parseInt(weeklyTarget) * 12 : 0} {measurementUnit}
      </p>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit}
          disabled={createTactic.isPending || updateTactic.isPending}
          className="gradient-primary text-primary-foreground"
        >
          {tactic ? "Update Tactic" : "Add Tactic"}
        </Button>
      </DialogFooter>
    </div>
  );
}

function GoalCard({ goal, cycleId }: { goal: any; cycleId: number }) {
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingTactic, setIsAddingTactic] = useState(false);
  const [editingTactic, setEditingTactic] = useState<any>(null);

  const { data: tactics } = trpc.tactic.listByGoal.useQuery({ goalId: goal.id });
  const deleteGoal = trpc.goal.delete.useMutation();
  const deleteTactic = trpc.tactic.delete.useMutation();
  const utils = trpc.useUtils();

  const handleDeleteGoal = async () => {
    if (confirm("Are you sure you want to delete this goal and all its tactics?")) {
      await deleteGoal.mutateAsync({ goalId: goal.id });
      utils.goal.list.invalidate();
      toast.success("Goal deleted");
    }
  };

  const handleDeleteTactic = async (tacticId: number) => {
    if (confirm("Delete this tactic?")) {
      await deleteTactic.mutateAsync({ tacticId });
      utils.tactic.listByGoal.invalidate();
      toast.success("Tactic deleted");
    }
  };

  return (
    <Card className="bg-card border-border" data-tour="goal-card">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-centre justify-centre shrink-0">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">{goal.title}</CardTitle>
              {goal.lagIndicator && (
                <CardDescription className="mt-1">
                  Target: {goal.lagTarget || 'Not set'} • {goal.lagIndicator}
                </CardDescription>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleDeleteGoal}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {goal.whyItMatters && (
          <p className="text-sm text-muted-foreground mb-4 italic">
            "{goal.whyItMatters}"
          </p>
        )}

        {/* Tactics */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Lead Indicators (Tactics)</h4>
            <Button variant="ghost" size="sm" onClick={() => setIsAddingTactic(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Tactic
            </Button>
          </div>
          
          {tactics && tactics.length > 0 ? (
            <div className="space-y-2">
              {tactics.map((tactic) => (
                <div 
                  key={tactic.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-primary/60" />
                    <div>
                      <p className="text-sm font-medium">{tactic.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {tactic.weeklyTarget} {tactic.measurementUnit}/week • {tactic.totalTarget} total
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setEditingTactic(tactic)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteTactic(tactic.id)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              No tactics yet. Add lead indicators to track your execution.
            </p>
          )}
        </div>
      </CardContent>

      {/* Edit Goal Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Goal</DialogTitle>
          </DialogHeader>
          <GoalForm cycleId={cycleId} goal={goal} onClose={() => setIsEditing(false)} />
        </DialogContent>
      </Dialog>

      {/* Add Tactic Dialog */}
      <Dialog open={isAddingTactic} onOpenChange={setIsAddingTactic}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Tactic</DialogTitle>
            <DialogDescription>
              Define a measurable action that drives your goal
            </DialogDescription>
          </DialogHeader>
          <TacticForm goalId={goal.id} onClose={() => setIsAddingTactic(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Tactic Dialog */}
      <Dialog open={!!editingTactic} onOpenChange={() => setEditingTactic(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tactic</DialogTitle>
          </DialogHeader>
          <TacticForm goalId={goal.id} tactic={editingTactic} onClose={() => setEditingTactic(null)} />
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default function Goals() {
  const [isAddingGoal, setIsAddingGoal] = useState(false);
  const [quote] = useState(() => getRandomQuote("goal_setting"));

  const { data: cycles } = trpc.cycle.list.useQuery();
  const activeCycle = cycles?.find(c => c.status === 'active') || cycles?.[0];
  
  const { data: goals, isLoading } = trpc.goal.list.useQuery(
    { cycleId: activeCycle?.id ?? 0 },
    { enabled: !!activeCycle }
  );

  if (!activeCycle) {
    return (
      <AppLayout currentPage="goals">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Target className="h-16 w-16 text-muted-foreground/40 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Active Cycle</h2>
          <p className="text-muted-foreground">Create a cycle from the dashboard to set your goals.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout currentPage="goals">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Target className="h-7 w-7 text-primary" />
              Goals & Tactics
            </h1>
            <p className="text-muted-foreground mt-1">
              Define 1-3 SMART goals with measurable lead indicators
            </p>
          </div>
          {goals && goals.length < 3 && (
            <Button 
              onClick={() => setIsAddingGoal(true)}
              className="gradient-primary text-primary-foreground"
              data-tour="add-goal-btn"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Goal
            </Button>
          )}
        </div>

        {/* Tooltip Tour */}
        <TooltipTour pageKey="goals" steps={GOALS_TOUR_STEPS} />

        {/* Quote Card */}
        <div className="quote-card">
          <Quote className="h-5 w-5 text-primary/40 mb-2" />
          <p className="text-sm italic text-foreground/90">"{quote.text}"</p>
          <p className="text-xs text-primary mt-2">— {quote.chapter}</p>
        </div>

        {/* Goals Limit Warning */}
        {goals && goals.length >= 3 && (
          <div className="p-4 rounded-lg bg-accent/10 border border-accent/30">
            <p className="text-sm text-accent">
              <strong>Maximum goals reached.</strong> The 12 Week Year recommends focusing on 1-3 goals maximum for optimal execution.
            </p>
          </div>
        )}

        {/* Goals List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="h-48 bg-muted rounded-xl animate-pulse" />
            ))}
          </div>
        ) : goals && goals.length > 0 ? (
          <div className="space-y-4">
            {goals.map((goal) => (
              <GoalCard key={goal.id} goal={goal} cycleId={activeCycle.id} />
            ))}
          </div>
        ) : (
          <Card className="bg-card border-border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Target className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Goals Yet</h3>
              <p className="text-muted-foreground text-center mb-4 max-w-md">
                Start by defining 1-3 SMART goals for your 12-week cycle. 
                Each goal should have clear lead indicators (tactics) to track.
              </p>
              <Button onClick={() => setIsAddingGoal(true)} className="gradient-primary text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Goal
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Add Goal Dialog */}
        <Dialog open={isAddingGoal} onOpenChange={setIsAddingGoal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Goal</DialogTitle>
              <DialogDescription>
                Define a SMART goal with a clear result (lag indicator)
              </DialogDescription>
            </DialogHeader>
            <GoalForm cycleId={activeCycle.id} onClose={() => setIsAddingGoal(false)} />
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
