import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Lightbulb, RefreshCw, X, ChevronRight } from "lucide-react";
import { useState, useEffect } from "react";
import { FLASHCARDS } from "@shared/quotes";

interface FlashcardWidgetProps {
  onDismiss?: () => void;
}

export default function FlashcardWidget({ onDismiss }: FlashcardWidgetProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const { data: cycles } = trpc.cycle.list.useQuery();
  const activeCycle = cycles?.find(c => c.status === 'active') || cycles?.[0];

  const currentWeek = activeCycle ? Math.min(
    Math.max(1, Math.ceil((Date.now() - new Date(activeCycle.startDate).getTime()) / (7 * 24 * 60 * 60 * 1000))),
    12
  ) : 1;

  // Use all flashcards
  const relevantFlashcards = FLASHCARDS;

  const recordView = trpc.flashcard.recordView.useMutation();

  useEffect(() => {
    // Pick a random flashcard on mount
    const randomIndex = Math.floor(Math.random() * relevantFlashcards.length);
    setCurrentIndex(randomIndex);
  }, [relevantFlashcards.length]);

  const currentFlashcard = relevantFlashcards[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % relevantFlashcards.length);
    
    // Record the view
    if (currentFlashcard) {
      recordView.mutate({ flashcardKey: currentFlashcard.id });
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  if (dismissed || !currentFlashcard) {
    return null;
  }

  return (
    <Card className="bg-gradient-to-br from-primary/10 to-accent/10 border-primary/20 overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Lightbulb className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium text-primary">Daily Flashcard</p>
              <p className="text-xs text-muted-foreground">{currentFlashcard.category}</p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6" 
            onClick={handleDismiss}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>

        <div 
          className="min-h-[100px] cursor-pointer"
          onClick={() => setIsFlipped(!isFlipped)}
        >
          {!isFlipped ? (
            <div className="space-y-2">
              <p className="font-medium text-foreground">{currentFlashcard.front}</p>
              <p className="text-xs text-muted-foreground">Tap to reveal answer</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-foreground/90">{currentFlashcard.back}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
          <p className="text-xs text-muted-foreground">
            {currentIndex + 1} of {relevantFlashcards.length}
          </p>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleNext}
            className="text-primary"
          >
            Next
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
