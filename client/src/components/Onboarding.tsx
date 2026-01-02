import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Target, 
  Calendar, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Rocket,
  Quote
} from "lucide-react";

interface OnboardingProps {
  onComplete: () => void;
}

const ONBOARDING_STEPS = [
  {
    title: "Welcome to the 12 Week Year",
    subtitle: "Transform your productivity in just 12 weeks",
    content: `The 12 Week Year is a powerful execution system that helps you achieve more in 12 weeks than most people accomplish in 12 months.

Instead of annual goals that lose momentum, you'll work in focused 12-week cycles with clear targets, weekly accountability, and measurable progress.`,
    quote: "A year is no longer 12 months, it is now 12 weeks. There are no longer four quarters in a year; there is only one.",
    quoteSource: "Brian Moran, The 12 Week Year",
    icon: Calendar,
  },
  {
    title: "The 85% Rule",
    subtitle: "Consistency beats perfection",
    content: `Your goal isn't 100% perfect execution—it's consistent 85% execution. Research shows that hitting 85% on your lead indicators almost guarantees you'll achieve your goals.

This removes the pressure of perfection and focuses you on what matters: showing up consistently, week after week.`,
    quote: "You don't need a 100% score to be successful. The goal is consistent effort (85%), not flawless execution (100%).",
    quoteSource: "Brian Moran, The 12 Week Year",
    icon: TrendingUp,
  },
  {
    title: "Vision & Goals",
    subtitle: "Start with your 'Why'",
    content: `Begin by defining your compelling vision—where do you want to be in 3-5 years? Then set 1-3 SMART goals for your 12-week cycle.

Each goal has a lag indicator (the result you want) and lead indicators (the actions that drive results). You'll track the lead indicators weekly.`,
    quote: "The 12 Week Year is demanding. Without a strong 'Why' (Vision), the discipline required will eventually fade.",
    quoteSource: "Brian Moran, The 12 Week Year",
    icon: Target,
  },
  {
    title: "Performance Blocks",
    subtitle: "Protect your most important work",
    content: `Schedule three types of time blocks:

• Strategic Blocks (3+ hours): Uninterrupted deep work on your most important tactics
• Buffer Blocks (30-60 min): Handle email, admin, and low-leverage tasks
• Breakout Blocks (1-3 hours): Learning, networking, and recharging

Treat these as non-negotiable appointments with yourself.`,
    quote: "Treat your Strategic Blocks as non-negotiable appointments with yourself.",
    quoteSource: "Brian Moran, The 12 Week Year",
    icon: Clock,
  },
  {
    title: "Weekly Accountability",
    subtitle: "Measure, review, adjust",
    content: `Every week, you'll:

1. Track your daily execution on the scorecard
2. Calculate your execution score (aim for 85%+)
3. Complete a Weekly Accountability Meeting (WAM)
4. Reflect on what worked and what needs adjustment

This weekly rhythm keeps you focused and accountable.`,
    quote: "True accountability is about ownership, which begins with self-awareness of your thoughts, actions, and results.",
    quoteSource: "Brian Moran, The 12 Week Year",
    icon: CheckCircle2,
  },
  {
    title: "Ready to Begin?",
    subtitle: "Your 12-week transformation starts now",
    content: `Here's how to get started:

1. Complete the Pre-Cycle Checklist to ensure you're ready
2. Set your vision and define 1-3 goals with tactics
3. Schedule your performance blocks
4. Start tracking your daily execution

Let's make the next 12 weeks count!`,
    quote: "Commitment is the resolve to keep promises made to oneself and others, especially when the initial excitement fades.",
    quoteSource: "Brian Moran, The 12 Week Year",
    icon: Rocket,
  },
];

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = ONBOARDING_STEPS[currentStep];
  const Icon = step.icon;
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full bg-card border-border shadow-2xl">
        <CardContent className="p-0">
          {/* Progress indicator */}
          <div className="flex gap-1 p-4 pb-0">
            {ONBOARDING_STEPS.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  index <= currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {/* Content */}
          <div className="p-8">
            {/* Icon and title */}
            <div className="flex items-center gap-4 mb-6">
              <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Icon className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{step.title}</h2>
                <p className="text-muted-foreground">{step.subtitle}</p>
              </div>
            </div>

            {/* Main content */}
            <div className="space-y-4 mb-6">
              <p className="text-foreground/90 whitespace-pre-line leading-relaxed">
                {step.content}
              </p>
            </div>

            {/* Quote */}
            <div className="quote-card mb-8">
              <Quote className="h-4 w-4 text-primary/40 mb-2" />
              <p className="text-sm italic text-foreground/80">"{step.quote}"</p>
              <p className="text-xs text-primary mt-2">— {step.quoteSource}</p>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {currentStep > 0 && (
                  <Button variant="ghost" onClick={handlePrev}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">
                  {currentStep + 1} of {ONBOARDING_STEPS.length}
                </span>
                
                {!isLastStep && (
                  <Button variant="ghost" onClick={handleSkip} className="text-muted-foreground">
                    Skip intro
                  </Button>
                )}
                
                <Button 
                  onClick={handleNext}
                  className="gradient-primary text-primary-foreground"
                >
                  {isLastStep ? (
                    <>
                      Get Started
                      <Rocket className="h-4 w-4 ml-2" />
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
