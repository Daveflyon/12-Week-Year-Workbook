import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { ClipboardCheck, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, Quote, Save, Download } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { useParams } from "wouter";
import { toast } from "sonner";
import { getQuoteForWeek, WEEK_THEMES } from "@shared/quotes";

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getWeekDates(cycleStartDate: Date, weekNumber: number): Date[] {
  const dates: Date[] = [];
  const weekStart = new Date(cycleStartDate);
  weekStart.setDate(weekStart.getDate() + (weekNumber - 1) * 7);
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    dates.push(date);
  }
  return dates;
}

export default function Scorecard() {
  const params = useParams<{ weekNumber?: string }>();
  const { data: cycles } = trpc.cycle.list.useQuery();
  const activeCycle = cycles?.find(c => c.status === 'active') || cycles?.[0];
  
  const currentWeekFromCycle = activeCycle ? Math.min(
    Math.max(1, Math.ceil((Date.now() - new Date(activeCycle.startDate).getTime()) / (7 * 24 * 60 * 60 * 1000))),
    12
  ) : 1;
  
  const [selectedWeek, setSelectedWeek] = useState(
    params.weekNumber ? parseInt(params.weekNumber) : currentWeekFromCycle
  );

  const { data: tactics } = trpc.tactic.listByCycle.useQuery(
    { cycleId: activeCycle?.id ?? 0 },
    { enabled: !!activeCycle }
  );

  const { data: allEntries, refetch: refetchEntries } = trpc.tacticEntry.getAllForCycle.useQuery(
    { cycleId: activeCycle?.id ?? 0 },
    { enabled: !!activeCycle }
  );

  const { data: weeklyScore } = trpc.weeklyScore.get.useQuery(
    { cycleId: activeCycle?.id ?? 0, weekNumber: selectedWeek },
    { enabled: !!activeCycle }
  );

  const upsertEntry = trpc.tacticEntry.upsert.useMutation();
  const upsertWeeklyScore = trpc.weeklyScore.upsert.useMutation();
  const utils = trpc.useUtils();

  const handleExportPDF = async () => {
    if (!activeCycle) return;
    try {
      const response = await fetch(`/api/trpc/export.weeklyScorecard?input=${encodeURIComponent(JSON.stringify({ cycleId: activeCycle.id, weekNumber: selectedWeek }))}`);
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
      toast.error("Failed to export scorecard");
    }
  };

  // Local state for entries
  const [localEntries, setLocalEntries] = useState<Record<string, number>>({});

  // Initialize local entries from server data
  useEffect(() => {
    if (allEntries) {
      const entriesMap: Record<string, number> = {};
      allEntries.forEach(entry => {
        const key = `${entry.tacticId}-${entry.weekNumber}-${entry.dayOfWeek}`;
        entriesMap[key] = entry.completed;
      });
      setLocalEntries(entriesMap);
    }
  }, [allEntries]);

  const weekDates = useMemo(() => {
    if (!activeCycle) return [];
    return getWeekDates(new Date(activeCycle.startDate), selectedWeek);
  }, [activeCycle, selectedWeek]);

  const weekTheme = WEEK_THEMES.find(w => w.week === selectedWeek);
  const weekQuote = getQuoteForWeek(selectedWeek);

  // Calculate execution score for the week
  const executionScore = useMemo(() => {
    if (!tactics || tactics.length === 0) return 0;
    
    let totalCompleted = 0;
    let totalTarget = 0;
    
    tactics.forEach(tactic => {
      const weeklyTarget = tactic.weeklyTarget;
      totalTarget += weeklyTarget;
      
      let tacticCompleted = 0;
      for (let day = 0; day < 7; day++) {
        const key = `${tactic.id}-${selectedWeek}-${day}`;
        tacticCompleted += localEntries[key] || 0;
      }
      totalCompleted += Math.min(tacticCompleted, weeklyTarget);
    });
    
    return totalTarget > 0 ? (totalCompleted / totalTarget) * 100 : 0;
  }, [tactics, localEntries, selectedWeek]);

  const handleEntryChange = async (tacticId: number, dayOfWeek: number, value: number) => {
    const key = `${tacticId}-${selectedWeek}-${dayOfWeek}`;
    setLocalEntries(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!activeCycle) return;

    try {
      // Save all entries for this week
      const savePromises: Promise<any>[] = [];
      
      tactics?.forEach(tactic => {
        for (let day = 0; day < 7; day++) {
          const key = `${tactic.id}-${selectedWeek}-${day}`;
          const completed = localEntries[key] || 0;
          
          savePromises.push(
            upsertEntry.mutateAsync({
              tacticId: tactic.id,
              weekNumber: selectedWeek,
              dayOfWeek: day,
              date: weekDates[day],
              completed,
            })
          );
        }
      });

      await Promise.all(savePromises);

      // Save weekly score
      await upsertWeeklyScore.mutateAsync({
        cycleId: activeCycle.id,
        weekNumber: selectedWeek,
        executionScore: executionScore.toFixed(1),
      });

      utils.tacticEntry.getAllForCycle.invalidate();
      utils.weeklyScore.get.invalidate();
      utils.weeklyScore.getByCycle.invalidate();
      utils.stats.getDashboard.invalidate();
      
      toast.success("Scorecard saved successfully");
    } catch (error) {
      toast.error("Failed to save scorecard");
    }
  };

  const scoreStatus = executionScore >= 85 ? 'on-target' : executionScore >= 70 ? 'below-target' : 'critical';

  if (!activeCycle) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <ClipboardCheck className="h-16 w-16 text-muted-foreground/40 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Active Cycle</h2>
          <p className="text-muted-foreground">Create a cycle from the dashboard to track your scorecard.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <ClipboardCheck className="h-7 w-7 text-primary" />
              Weekly Scorecard
            </h1>
            <p className="text-muted-foreground mt-1">
              Track your daily execution of lead indicators
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline"
              onClick={handleExportPDF}
            >
              <Download className="mr-2 h-4 w-4" />
              Export PDF
            </Button>
            <Button 
              onClick={handleSave}
              disabled={upsertEntry.isPending || upsertWeeklyScore.isPending}
              className="gradient-primary text-primary-foreground"
            >
              <Save className="mr-2 h-4 w-4" />
              Save Scorecard
            </Button>
          </div>
        </div>

        {/* Week Navigation */}
        <Card className="bg-card border-border">
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
                  <p className="text-xs text-muted-foreground">
                    {weekDates[0]?.toLocaleDateString()} - {weekDates[6]?.toLocaleDateString()}
                  </p>
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

        {/* Quote Card */}
        <div className="quote-card">
          <Quote className="h-5 w-5 text-primary/40 mb-2" />
          <p className="text-sm italic text-foreground/90">"{weekQuote.text}"</p>
          <p className="text-xs text-primary mt-2">— {weekQuote.chapter}</p>
        </div>

        {/* Execution Score */}
        <Card className="bg-card border-border">
          <CardContent className="py-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">Week {selectedWeek} Execution Score</h3>
                <p className="text-sm text-muted-foreground">Target: 85%</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`score-badge ${scoreStatus}`}>
                  {scoreStatus === 'on-target' ? (
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                  ) : (
                    <AlertCircle className="h-4 w-4 mr-1" />
                  )}
                  {executionScore.toFixed(0)}%
                </span>
              </div>
            </div>
            <Progress value={executionScore} className="h-3" />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>0%</span>
              <span className="text-primary">85% Target</span>
              <span>100%</span>
            </div>
          </CardContent>
        </Card>

        {/* Scorecard Table */}
        {tactics && tactics.length > 0 ? (
          <Card className="bg-card border-border overflow-hidden">
            <CardHeader>
              <CardTitle>Daily Tracking</CardTitle>
              <CardDescription>
                Enter your completed count for each tactic per day
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left p-4 font-medium min-w-[200px]">Tactic</th>
                      <th className="text-center p-4 font-medium w-20">Target</th>
                      {DAYS.map((day, i) => (
                        <th key={day} className="text-center p-4 font-medium w-16">
                          <div>{day}</div>
                          <div className="text-xs text-muted-foreground font-normal">
                            {weekDates[i]?.getDate()}
                          </div>
                        </th>
                      ))}
                      <th className="text-center p-4 font-medium w-20">Total</th>
                      <th className="text-center p-4 font-medium w-20">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tactics.map((tactic) => {
                      let weekTotal = 0;
                      for (let day = 0; day < 7; day++) {
                        const key = `${tactic.id}-${selectedWeek}-${day}`;
                        weekTotal += localEntries[key] || 0;
                      }
                      const percentage = Math.min(100, (weekTotal / tactic.weeklyTarget) * 100);
                      
                      return (
                        <tr key={tactic.id} className="border-b border-border">
                          <td className="p-4">
                            <div className="font-medium">{tactic.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {tactic.measurementUnit}
                            </div>
                          </td>
                          <td className="text-center p-4 text-muted-foreground">
                            {tactic.weeklyTarget}
                          </td>
                          {DAYS.map((_, dayIndex) => {
                            const key = `${tactic.id}-${selectedWeek}-${dayIndex}`;
                            return (
                              <td key={dayIndex} className="text-center p-2">
                                <Input
                                  type="number"
                                  min="0"
                                  value={localEntries[key] || 0}
                                  onChange={(e) => handleEntryChange(
                                    tactic.id, 
                                    dayIndex, 
                                    parseInt(e.target.value) || 0
                                  )}
                                  className="w-14 h-10 text-center bg-input border-border mx-auto"
                                />
                              </td>
                            );
                          })}
                          <td className="text-center p-4 font-medium">
                            {weekTotal}
                          </td>
                          <td className="text-center p-4">
                            <span className={`score-badge ${percentage >= 85 ? 'on-target' : percentage >= 70 ? 'below-target' : 'critical'}`}>
                              {percentage.toFixed(0)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-card border-border">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <ClipboardCheck className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Tactics to Track</h3>
              <p className="text-muted-foreground text-center mb-4">
                Add tactics to your goals to start tracking your execution.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
