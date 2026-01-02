import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TourStep {
  target: string; // CSS selector for the target element
  title: string;
  content: string;
  position?: "top" | "bottom" | "left" | "right";
}

interface TooltipTourProps {
  pageKey: string;
  steps: TourStep[];
  onComplete?: () => void;
}

const TOUR_STORAGE_KEY = "12wy_tours_completed";

function getCompletedTours(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(TOUR_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function markTourComplete(pageKey: string) {
  const completed = getCompletedTours();
  if (!completed.includes(pageKey)) {
    completed.push(pageKey);
    localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(completed));
  }
}

export function useTooltipTour(pageKey: string) {
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    // Small delay to ensure page has rendered
    const timer = setTimeout(() => {
      const completed = getCompletedTours();
      setShouldShow(!completed.includes(pageKey));
    }, 500);
    return () => clearTimeout(timer);
  }, [pageKey]);

  const completeTour = useCallback(() => {
    markTourComplete(pageKey);
    setShouldShow(false);
  }, [pageKey]);

  return { shouldShow, completeTour };
}

export default function TooltipTour({ pageKey, steps, onComplete }: TooltipTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [isVisible, setIsVisible] = useState(true);
  const { shouldShow, completeTour } = useTooltipTour(pageKey);

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const updatePosition = useCallback(() => {
    if (!step) return;

    const targetEl = document.querySelector(step.target);
    if (!targetEl) {
      // If target not found, try next step or complete
      if (currentStep < steps.length - 1) {
        setCurrentStep(prev => prev + 1);
      }
      return;
    }

    const rect = targetEl.getBoundingClientRect();
    const position = step.position || "bottom";
    const tooltipWidth = 320;
    const tooltipHeight = 150;
    const offset = 12;

    let top = 0;
    let left = 0;

    switch (position) {
      case "top":
        top = rect.top - tooltipHeight - offset + window.scrollY;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case "bottom":
        top = rect.bottom + offset + window.scrollY;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case "left":
        top = rect.top + rect.height / 2 - tooltipHeight / 2 + window.scrollY;
        left = rect.left - tooltipWidth - offset;
        break;
      case "right":
        top = rect.top + rect.height / 2 - tooltipHeight / 2 + window.scrollY;
        left = rect.right + offset;
        break;
    }

    // Keep tooltip within viewport
    left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16));
    top = Math.max(16, top);

    setTooltipPosition({ top, left });

    // Highlight the target element
    targetEl.classList.add("tour-highlight");
    return () => targetEl.classList.remove("tour-highlight");
  }, [step, currentStep, steps.length]);

  useEffect(() => {
    if (!shouldShow || !isVisible) return;

    const cleanup = updatePosition();
    
    // Update position on scroll/resize
    window.addEventListener("scroll", updatePosition);
    window.addEventListener("resize", updatePosition);

    return () => {
      cleanup?.();
      window.removeEventListener("scroll", updatePosition);
      window.removeEventListener("resize", updatePosition);
      // Clean up all highlights
      document.querySelectorAll(".tour-highlight").forEach(el => {
        el.classList.remove("tour-highlight");
      });
    };
  }, [shouldShow, isVisible, updatePosition]);

  const handleNext = () => {
    // Remove highlight from current target
    const currentTarget = document.querySelector(step.target);
    currentTarget?.classList.remove("tour-highlight");

    if (isLastStep) {
      handleComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    const currentTarget = document.querySelector(step.target);
    currentTarget?.classList.remove("tour-highlight");
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const handleComplete = () => {
    completeTour();
    setIsVisible(false);
    onComplete?.();
  };

  const handleSkip = () => {
    completeTour();
    setIsVisible(false);
  };

  if (!shouldShow || !isVisible || !step) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[100]"
        onClick={handleSkip}
      />

      {/* Tooltip */}
      <div
        className="fixed z-[101] w-80 bg-card border border-border rounded-xl shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
      >
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colours"
        >
          <X className="h-3 w-3" />
        </button>

        <div className="p-4">
          {/* Step indicator */}
          <div className="flex items-centre gap-1 mb-3">
            {steps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colours",
                  index <= currentStep ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>

          {/* Content */}
          <h4 className="font-semibold text-foreground mb-1">{step.title}</h4>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            {step.content}
          </p>

          {/* Navigation */}
          <div className="flex items-centre justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="text-muted-foreground"
            >
              Skip tour
            </Button>

            <div className="flex items-centre gap-2">
              {!isFirstStep && (
                <Button variant="ghost" size="sm" onClick={handlePrev}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
              )}
              <Button
                size="sm"
                onClick={handleNext}
                className="gradient-primary text-primary-foreground"
              >
                {isLastStep ? "Got it!" : "Next"}
                {!isLastStep && <ChevronRight className="h-4 w-4 ml-1" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
