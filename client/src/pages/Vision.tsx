import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Eye, Plus, X, Save, Quote, Lightbulb } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getRandomQuote } from "@shared/quotes";

export default function Vision() {
  const { data: cycles } = trpc.cycle.list.useQuery();
  const activeCycle = cycles?.find(c => c.status === 'active') || cycles?.[0];
  
  const { data: vision, isLoading } = trpc.vision.get.useQuery(
    { cycleId: activeCycle?.id ?? 0 },
    { enabled: !!activeCycle }
  );

  const [longTermVision, setLongTermVision] = useState("");
  const [strategicImperatives, setStrategicImperatives] = useState<string[]>([""]);
  const [commitmentStatement, setCommitmentStatement] = useState("");
  const [quote] = useState(() => getRandomQuote("vision"));

  const upsertVision = trpc.vision.upsert.useMutation();
  const utils = trpc.useUtils();

  useEffect(() => {
    if (vision) {
      setLongTermVision(vision.longTermVision || "");
      setStrategicImperatives(
        (vision.strategicImperatives as string[])?.length > 0 
          ? (vision.strategicImperatives as string[]) 
          : [""]
      );
      setCommitmentStatement(vision.commitmentStatement || "");
    }
  }, [vision]);

  const handleSave = async () => {
    if (!activeCycle) return;
    
    try {
      await upsertVision.mutateAsync({
        cycleId: activeCycle.id,
        longTermVision,
        strategicImperatives: strategicImperatives.filter(s => s.trim()),
        commitmentStatement,
      });
      utils.vision.get.invalidate();
      toast.success("Vision saved successfully");
    } catch (error) {
      toast.error("Failed to save vision");
    }
  };

  const addImperative = () => {
    if (strategicImperatives.length < 3) {
      setStrategicImperatives([...strategicImperatives, ""]);
    }
  };

  const removeImperative = (index: number) => {
    setStrategicImperatives(strategicImperatives.filter((_, i) => i !== index));
  };

  const updateImperative = (index: number, value: string) => {
    const updated = [...strategicImperatives];
    updated[index] = value;
    setStrategicImperatives(updated);
  };

  if (!activeCycle) {
    return (
      <AppLayout currentPage="vision">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Eye className="h-16 w-16 text-muted-foreground/40 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Active Cycle</h2>
          <p className="text-muted-foreground">Create a cycle from the dashboard to set your vision.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout currentPage="vision">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Eye className="h-7 w-7 text-primary" />
              Vision & Purpose
            </h1>
            <p className="text-muted-foreground mt-1">
              Define your "Why" to fuel your 12-week execution
            </p>
          </div>
          <Button 
            onClick={handleSave}
            disabled={upsertVision.isPending}
            className="gradient-primary text-primary-foreground"
          >
            <Save className="mr-2 h-4 w-4" />
            Save Vision
          </Button>
        </div>

        {/* Quote Card */}
        <div className="quote-card">
          <Quote className="h-5 w-5 text-primary/40 mb-2" />
          <p className="text-sm italic text-foreground/90">"{quote.text}"</p>
          <p className="text-xs text-primary mt-2">— {quote.chapter}</p>
        </div>

        {/* Long-Term Vision */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-primary" />
              3-5 Year Vision
            </CardTitle>
            <CardDescription>
              Write a clear, inspiring picture of your future. What does success look like in 3-5 years?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={longTermVision}
              onChange={(e) => setLongTermVision(e.target.value)}
              placeholder="Example: To be a recognized expert in my field, leading a high-impact team, achieving financial independence, and having the freedom to travel and spend quality time with family..."
              className="min-h-[150px] bg-input border-border"
            />
            <p className="text-xs text-muted-foreground mt-2">
              Tip: Start with "What if?" to dream big, then ground it with "How might I?"
            </p>
          </CardContent>
        </Card>

        {/* Strategic Imperatives */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Strategic Imperatives</CardTitle>
            <CardDescription>
              What are the 2-3 key areas you must focus on in the next 12 weeks to move toward your vision?
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {strategicImperatives.map((imperative, index) => (
              <div key={index} className="flex gap-2">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="font-bold text-primary">{index + 1}</span>
                </div>
                <Input
                  value={imperative}
                  onChange={(e) => updateImperative(index, e.target.value)}
                  placeholder={`Strategic imperative ${index + 1}...`}
                  className="bg-input border-border"
                />
                {strategicImperatives.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeImperative(index)}
                    className="shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            {strategicImperatives.length < 3 && (
              <Button variant="outline" onClick={addImperative} className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                Add Imperative
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Commitment Statement */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Commitment Statement</CardTitle>
            <CardDescription>
              Write a personal commitment focusing on the 3 Principles: Accountability, Commitment, and Greatness in the Moment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={commitmentStatement}
              onChange={(e) => setCommitmentStatement(e.target.value)}
              placeholder="I commit to taking full ownership of my actions and results. I will keep the promises I make to myself, especially when the initial excitement fades. I will make the right choice in the present moment, even when I don't feel like it..."
              className="min-h-[120px] bg-input border-border"
            />
          </CardContent>
        </Card>

        {/* The 3 Principles Reference */}
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="text-lg">The 3 Core Principles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-muted/30">
                <h4 className="font-semibold text-primary mb-2">Accountability</h4>
                <p className="text-sm text-muted-foreground">
                  Taking full ownership of actions and results, regardless of external circumstances.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/30">
                <h4 className="font-semibold text-primary mb-2">Commitment</h4>
                <p className="text-sm text-muted-foreground">
                  Keeping promises to yourself and others, especially when the initial excitement fades.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-muted/30">
                <h4 className="font-semibold text-primary mb-2">Greatness in the Moment</h4>
                <p className="text-sm text-muted-foreground">
                  Making the right choice and taking critical action in the present, even when you don't feel like it.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
