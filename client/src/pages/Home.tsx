import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { getLoginUrl } from "@/const";
import { 
  Sparkles, 
  Target, 
  Calendar, 
  TrendingUp, 
  Clock, 
  CheckCircle2,
  ArrowRight,
  Quote
} from "lucide-react";
import { useLocation } from "wouter";
import { useEffect } from "react";

const features = [
  {
    icon: Target,
    title: "Goal Setting",
    description: "Define 1-3 SMART goals with clear lead and lag indicators",
  },
  {
    icon: Calendar,
    title: "12-Week Planning",
    description: "Create weekly tactics and targets for focused execution",
  },
  {
    icon: TrendingUp,
    title: "Execution Tracking",
    description: "Track daily progress with the 85% execution score target",
  },
  {
    icon: Clock,
    title: "Performance Blocks",
    description: "Schedule Strategic, Buffer, and Breakout blocks",
  },
  {
    icon: CheckCircle2,
    title: "Weekly Reviews",
    description: "Reflect, adjust, and maintain accountability",
  },
  {
    icon: Sparkles,
    title: "Daily Flashcards",
    description: "Reinforce habits with contextual learning",
  },
];

const quotes = [
  {
    text: "A year is no longer 12 months, it is now 12 weeks. There are no longer four quarters in a year; there is only one.",
    author: "Brian P. Moran",
  },
  {
    text: "The challenge isn't knowing what to do; it's doing it.",
    author: "Brian P. Moran",
  },
  {
    text: "Greatness is achieved not in grand gestures, but in everyday actions.",
    author: "Brian P. Moran",
  },
];

export default function Home() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && user) {
      setLocation("/dashboard");
    }
  }, [user, loading, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-xl gradient-primary" />
          <div className="h-4 w-32 bg-muted rounded" />
        </div>
      </div>
    );
  }

  const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-dark opacity-50" />
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-chart-2/10 rounded-full blur-3xl" />
        </div>
        
        <div className="relative container mx-auto px-4 py-20 lg:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-3 mb-8">
              <div className="h-14 w-14 rounded-xl gradient-primary flex items-center justify-center glow-primary">
                <Sparkles className="h-7 w-7 text-primary-foreground" />
              </div>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              <span className="text-gradient">12 Week Year</span>
              <br />
              <span className="text-foreground">Execution Workbook</span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Achieve more in 12 weeks than others do in 12 months. 
              Track your goals, execute with discipline, and transform your productivity.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={() => window.location.href = getLoginUrl()}
                size="lg"
                className="gradient-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all glow-primary text-lg px-8"
              >
                Start Your 12-Week Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Quote Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <div className="quote-card">
            <Quote className="h-8 w-8 text-primary/40 mb-4" />
            <p className="text-xl md:text-2xl italic text-foreground/90 mb-4">
              "{randomQuote.text}"
            </p>
            <p className="text-primary font-medium">— {randomQuote.author}</p>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Everything You Need to Execute</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            A complete system for implementing The 12 Week Year methodology with discipline and accountability.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <div
              key={index}
              className="week-card card-hover group"
            >
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* The 85% Rule Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="glass rounded-2xl p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0">
                <div className="relative">
                  <div className="h-32 w-32 rounded-full border-8 border-primary/20 flex items-center justify-center">
                    <span className="text-4xl font-bold text-gradient">85%</span>
                  </div>
                  <div className="absolute inset-0 rounded-full border-8 border-transparent border-t-primary animate-spin" style={{ animationDuration: '3s' }} />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-4">The 85% Rule</h3>
                <p className="text-muted-foreground mb-4">
                  Research shows that consistently hitting 85% execution on your Lead Indicators 
                  almost guarantees the achievement of your 12-week goals. 
                  You don't need perfection—you need consistency.
                </p>
                <p className="text-sm text-primary font-medium">
                  "The goal is consistency, not perfection."
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Execution?</h2>
          <p className="text-muted-foreground mb-8">
            Join thousands who have achieved more in 12 weeks than they used to in 12 months.
          </p>
          <Button
            onClick={() => window.location.href = getLoginUrl()}
            size="lg"
            className="gradient-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all glow-primary text-lg px-8"
          >
            Get Started Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground space-y-3">
          <p>Based on "The 12 Week Year" by Brian P. Moran and Michael Lennington</p>
          <a 
            href="https://hiturnmedia.com" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <img src="/hiturn-media-logo.png" alt="Hiturn Media" className="h-6" />
          </a>
        </div>
      </footer>
    </div>
  );
}
