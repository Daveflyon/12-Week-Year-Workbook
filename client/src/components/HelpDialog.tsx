import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  HelpCircle,
  BookOpen,
  Target,
  Calendar,
  TrendingUp,
  Clock,
  CheckCircle2,
  Rocket,
  LayoutDashboard,
  Eye,
  ListChecks,
  ClipboardCheck,
  Users,
  Settings,
  Quote,
  PlayCircle,
} from "lucide-react";
import { useTourTrigger } from "./TooltipTour";

interface HelpDialogProps {
  currentPage?: string;
  showIntro?: () => void;
}

const PAGE_HELP = {
  dashboard: {
    title: "Dashboard",
    icon: LayoutDashboard,
    content: `The Dashboard is your command centre for tracking your 12-week execution.

**What you'll see here:**
• Your current execution score and trend over time
• Progress comparison with other users (aim to be above average!)
• Quick access to your active cycle and goals
• Daily flashcards to reinforce key concepts

**Key metrics:**
• **Execution Score**: Percentage of tactics completed (target: 85%+)
• **Week Progress**: Which week you're in out of 12
• **Goal Completion**: How close you are to your lag indicators`,
    quote: "What gets measured gets managed. Track your execution religiously.",
  },
  vision: {
    title: "Vision & Goals",
    icon: Eye,
    content: `Your Vision is the foundation of everything. Without a compelling "why," the discipline required will eventually fade.

**How to use this page:**
1. **Long-term Vision**: Where do you want to be in 3-5 years? Be specific and emotionally compelling.
2. **Strategic Imperatives**: 3-5 key areas that must improve to achieve your vision.
3. **Commitment Statement**: A personal declaration of your commitment to this cycle.

**Tips:**
• Make your vision vivid and personal
• Read it daily to stay connected to your "why"
• Update it as your clarity improves`,
    quote: "The 12 Week Year is demanding. Without a strong 'Why' (Vision), the discipline required will eventually fade.",
  },
  goals: {
    title: "Goals & Tactics",
    icon: Target,
    content: `Goals define WHAT you want to achieve. Tactics define HOW you'll get there.

**Setting effective goals:**
• Limit to 1-3 goals per 12-week cycle
• Each goal needs a clear lag indicator (the measurable result)
• Break each goal into weekly tactics (lead indicators)

**Lead vs Lag Indicators:**
• **Lag indicators**: The results you want (e.g., "Lose 10 lbs")
• **Lead indicators**: The actions that drive results (e.g., "Exercise 4x/week")

**The key insight:** You can't directly control lag indicators, but you CAN control lead indicators. Focus your energy there.`,
    quote: "You don't control outcomes, but you do control the actions that drive them. Focus on lead indicators.",
  },
  scorecard: {
    title: "Weekly Scorecard",
    icon: ListChecks,
    content: `The Scorecard is where execution happens. Track your daily completion of tactics here.

**How to use it:**
1. Each day, mark which tactics you completed
2. Your weekly execution score calculates automatically
3. Aim for 85% or higher each week

**The 85% Rule:**
You don't need perfection. Research shows that consistent 85% execution almost guarantees goal achievement. This removes the pressure of perfection and focuses you on showing up consistently.

**Weekly rhythm:**
• Update your scorecard daily (set a reminder!)
• Review your score at the end of each week
• Adjust tactics if consistently missing targets`,
    quote: "You don't need a 100% score to be successful. The goal is consistent effort (85%), not flawless execution (100%).",
  },
  blocks: {
    title: "Performance Blocks",
    icon: Clock,
    content: `Performance Blocks protect your most important work from interruptions and distractions.

**Three types of blocks:**

**1. Strategic Blocks (3+ hours)**
• Uninterrupted deep work on your most important tactics
• Schedule at least one per week
• No email, no phone, no meetings

**2. Buffer Blocks (30-60 min)**
• Handle email, admin, and low-leverage tasks
• Batch these activities together
• Prevents them from bleeding into strategic time

**3. Breakout Blocks (1-3 hours)**
• Learning, networking, and recharging
• Essential for long-term growth
• Schedule at least one per week

**Key principle:** Treat these as non-negotiable appointments with yourself.`,
    quote: "Treat your Strategic Blocks as non-negotiable appointments with yourself.",
  },
  review: {
    title: "Weekly Review",
    icon: ClipboardCheck,
    content: `The Weekly Review is your accountability checkpoint. It's where learning happens.

**Weekly Accountability Meeting (WAM):**
Ideally done with an accountability partner, but can be done solo.

**Review these questions:**
1. What was my execution score this week?
2. What worked well? What didn't?
3. What will I do differently next week?
4. Am I on track for my 12-week goals?

**Tips:**
• Schedule a fixed time each week (Friday or Sunday works well)
• Be honest in your reflections
• Focus on systems, not just outcomes
• Celebrate progress, learn from setbacks`,
    quote: "True accountability is about ownership, which begins with self-awareness of your thoughts, actions, and results.",
  },
  checklist: {
    title: "Pre-Cycle Checklist",
    icon: CheckCircle2,
    content: `Before starting a new 12-week cycle, ensure you're fully prepared. Rushing in without preparation leads to poor execution.

**Complete these before starting:**
• ✓ Vision is clear and compelling
• ✓ 1-3 SMART goals defined
• ✓ Weekly tactics identified for each goal
• ✓ Performance blocks scheduled
• ✓ Accountability partner identified (optional but recommended)
• ✓ Scorecard template ready
• ✓ Weekly review time scheduled

**Why this matters:**
The first week sets the tone for the entire cycle. Starting strong creates momentum that carries you through challenging weeks.`,
    quote: "Commitment is the resolve to keep promises made to oneself and others, especially when the initial excitement fades.",
  },
  partners: {
    title: "Accountability Partners",
    icon: Users,
    content: `Accountability partners dramatically increase your success rate. They provide external motivation when internal motivation wavers.

**How it works:**
1. Invite a partner via email
2. Choose what to share (progress, goals, or both)
3. Schedule Weekly Accountability Meetings (WAMs)
4. Track your WAM sessions

**WAM Structure (15-20 min):**
• Share your execution score
• Discuss what worked and what didn't
• Commit to next week's actions
• Encourage each other

**Tips:**
• Choose someone who will be honest with you
• Meet at the same time each week
• Focus on support, not judgment`,
    quote: "Accountability is not about blame; it's about ownership and support.",
  },
  settings: {
    title: "Settings",
    icon: Settings,
    content: `Configure your reminders and preferences to support consistent execution.

**Daily Reminders:**
Set a time to be reminded to update your scorecard. Consistency is key!

**Weekly Review Reminders:**
Choose a day and time for your weekly review. Friday afternoon or Sunday evening work well for most people.

**Notification Test:**
Use the test button to verify notifications are working properly.

**Tips:**
• Set reminders for times when you're typically available
• Start with more reminders, reduce as habits form
• Adjust based on what actually works for you`,
    quote: "Small consistent actions compound into remarkable results.",
  },
};

const INTRO_STEPS = [
  {
    title: "The 12 Week Year",
    icon: Calendar,
    content: `The 12 Week Year is a powerful execution system that helps you achieve more in 12 weeks than most people accomplish in 12 months.

Instead of annual goals that lose momentum, you'll work in focused 12-week cycles with clear targets, weekly accountability, and measurable progress.`,
    quote: "A year is no longer 12 months, it is now 12 weeks. There are no longer four quarters in a year; there is only one.",
  },
  {
    title: "The 85% Rule",
    icon: TrendingUp,
    content: `Your goal isn't 100% perfect execution—it's consistent 85% execution.

Research shows that hitting 85% on your lead indicators almost guarantees you'll achieve your goals. This removes the pressure of perfection and focuses you on what matters: showing up consistently, week after week.`,
    quote: "You don't need a 100% score to be successful. The goal is consistent effort (85%), not flawless execution (100%).",
  },
  {
    title: "Lead vs Lag Indicators",
    icon: Target,
    content: `**Lag indicators** are the results you want (e.g., "Lose 10 lbs", "Close $100K in sales").

**Lead indicators** are the actions that drive those results (e.g., "Exercise 4x/week", "Make 20 calls/day").

The key insight: You can't directly control lag indicators, but you CAN control lead indicators. Focus your energy on the actions.`,
    quote: "You don't control outcomes, but you do control the actions that drive them.",
  },
  {
    title: "Performance Blocks",
    icon: Clock,
    content: `Protect your most important work with three types of time blocks:

• **Strategic Blocks** (3+ hours): Deep work on key tactics
• **Buffer Blocks** (30-60 min): Email, admin, low-leverage tasks
• **Breakout Blocks** (1-3 hours): Learning and recharging

Treat these as non-negotiable appointments with yourself.`,
    quote: "Treat your Strategic Blocks as non-negotiable appointments with yourself.",
  },
  {
    title: "Weekly Accountability",
    icon: CheckCircle2,
    content: `Every week, you'll:

1. Track your daily execution on the scorecard
2. Calculate your execution score (aim for 85%+)
3. Complete a Weekly Accountability Meeting (WAM)
4. Reflect on what worked and adjust

This weekly rhythm keeps you focused and accountable.`,
    quote: "True accountability is about ownership, which begins with self-awareness.",
  },
];

export default function HelpDialog({ currentPage, showIntro }: HelpDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(currentPage || "intro");
  const { triggerTour } = useTourTrigger();

  const currentHelp = currentPage ? PAGE_HELP[currentPage as keyof typeof PAGE_HELP] : null;

  const handleStartTour = () => {
    if (currentPage) {
      setOpen(false);
      // Small delay to let dialog close before starting tour
      setTimeout(() => {
        triggerTour(currentPage);
      }, 200);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:text-foreground"
          title="Help & Guide"
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Help & Guide
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2 shrink-0">
            <TabsTrigger value="intro">Getting Started</TabsTrigger>
            <TabsTrigger value="page">
              {currentHelp ? currentHelp.title : "Page Help"}
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            <TabsContent value="intro" className="mt-0 space-y-6 pr-4">
              {INTRO_STEPS.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={index} className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-semibold text-lg">{step.title}</h3>
                    </div>
                    <p className="text-sm text-foreground/80 whitespace-pre-line leading-relaxed pl-13">
                      {step.content}
                    </p>
                    <div className="quote-card ml-13">
                      <Quote className="h-3 w-3 text-primary/40 mb-1" />
                      <p className="text-xs italic text-foreground/70">"{step.quote}"</p>
                    </div>
                  </div>
                );
              })}

              {showIntro && (
                <div className="pt-4 border-t border-border">
                  <Button
                    onClick={() => {
                      setOpen(false);
                      showIntro();
                    }}
                    className="w-full gradient-primary"
                  >
                    <Rocket className="h-4 w-4 mr-2" />
                    Replay Full Introduction
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="page" className="mt-0 pr-4">
              {currentHelp ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <currentHelp.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-xl">{currentHelp.title}</h3>
                      <p className="text-sm text-muted-foreground">How to use this page</p>
                    </div>
                  </div>

                  {/* Start Interactive Tour Button */}
                  <Button
                    onClick={handleStartTour}
                    variant="outline"
                    className="w-full border-primary/30 hover:bg-primary/10"
                  >
                    <PlayCircle className="h-4 w-4 mr-2 text-primary" />
                    Start Interactive Tour
                  </Button>

                  <div className="prose prose-sm prose-invert max-w-none">
                    <p className="text-foreground/80 whitespace-pre-line leading-relaxed">
                      {currentHelp.content}
                    </p>
                  </div>

                  <div className="quote-card">
                    <Quote className="h-4 w-4 text-primary/40 mb-2" />
                    <p className="text-sm italic text-foreground/80">"{currentHelp.quote}"</p>
                    <p className="text-xs text-primary mt-2">— Brian Moran, The 12 Week Year</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a page from the sidebar to see contextual help.</p>
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
