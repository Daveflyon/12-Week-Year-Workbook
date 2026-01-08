import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { CheckSquare, Quote, Rocket, ArrowRight, CheckCheck, XCircle, Zap } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { getRandomQuote } from "@shared/quotes";

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

  const handleBulkUpdate = async (items: { id: number }[], isCompleted: boolean) => {
    if (!items.length) return;
    
    try {
      // Update all items in parallel
      await Promise.all(
        items.map(item => updateItem.mutateAsync({ itemId: item.id, isCompleted }))
      );
      utils.checklist.get.invalidate();
      toast.success(isCompleted 
        ? `Marked ${items.length} item${items.length > 1 ? 's' : ''} as complete` 
        : `Unmarked ${items.length} item${items.length > 1 ? 's' : ''}`
      );
    } catch (error) {
      toast.error("Failed to update checklist");
    }
  };

  const handleCheckAll = () => {
    if (!checklist) return;
    const uncheckedItems = checklist.filter(item => !item.isCompleted);
    handleBulkUpdate(uncheckedItems, true);
  };

  const handleUncheckAll = () => {
    if (!checklist) return;
    const checkedItems = checklist.filter(item => item.isCompleted);
    handleBulkUpdate(checkedItems, false);
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

        {/* Checklist Items - Rendered directly from database */}
        <Card className="bg-card border-border">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle className="text-lg">Pre-Cycle Readiness Items</CardTitle>
                <CardDescription>
                  Tick each item as you complete it to track your readiness
                </CardDescription>
              </div>
              {/* Bulk Action Buttons */}
              {checklist && checklist.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCheckAll}
                    disabled={completedCount === totalCount || updateItem.isPending}
                    className="text-xs"
                  >
                    <CheckCheck className="mr-1 h-3 w-3" />
                    Check All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleUncheckAll}
                    disabled={completedCount === 0 || updateItem.isPending}
                    className="text-xs"
                  >
                    <XCircle className="mr-1 h-3 w-3" />
                    Uncheck All
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="h-12 bg-muted rounded-lg" />
                ))}
              </div>
            ) : checklist && checklist.length > 0 ? (
              <div className="space-y-3">
                {checklist.map((item) => (
                  <div 
                    key={item.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => handleToggle(item.id, !item.isCompleted)}
                  >
                    <Checkbox
                      id={`item-${item.id}`}
                      checked={item.isCompleted ?? false}
                      onCheckedChange={(checked) => handleToggle(item.id, checked as boolean)}
                      className="mt-0.5"
                    />
                    <label 
                      htmlFor={`item-${item.id}`}
                      className={`text-sm cursor-pointer flex-1 ${item.isCompleted ? 'text-muted-foreground line-through' : ''}`}
                    >
                      {item.itemLabel}
                    </label>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No checklist items found. Try creating a new cycle.
              </p>
            )}
          </CardContent>
        </Card>

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
