import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, ChevronRight, Dumbbell, TrendingUp, BookOpen, Sparkles, FileText } from 'lucide-react';
import { CYCLE_TEMPLATES, CycleTemplate } from '@shared/templates';

interface TemplateSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelectTemplate: (template: CycleTemplate | null) => void;
}

const CATEGORY_ICONS = {
  fitness: Dumbbell,
  business: TrendingUp,
  learning: BookOpen,
  personal: Sparkles,
};

const CATEGORY_LABELS = {
  fitness: 'Fitness',
  business: 'Business',
  learning: 'Learning',
  personal: 'Personal',
};

export function TemplateSelector({ open, onClose, onSelectTemplate }: TemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<CycleTemplate | null>(null);
  const [viewingDetails, setViewingDetails] = useState<CycleTemplate | null>(null);

  const handleSelect = () => {
    onSelectTemplate(selectedTemplate);
    onClose();
    setSelectedTemplate(null);
    setViewingDetails(null);
  };

  const handleStartBlank = () => {
    onSelectTemplate(null);
    onClose();
    setSelectedTemplate(null);
    setViewingDetails(null);
  };

  const categories = ['all', 'fitness', 'business', 'learning', 'personal'] as const;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Choose a Template
          </DialogTitle>
          <DialogDescription>
            Start with a pre-built template or create a blank cycle. Templates include goals and tactics you can customise.
          </DialogDescription>
        </DialogHeader>

        {viewingDetails ? (
          // Template Details View
          <div className="space-y-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setViewingDetails(null)}
              className="mb-2"
            >
              ← Back to templates
            </Button>
            
            <div className="flex items-start gap-4">
              <div className="text-4xl">{viewingDetails.icon}</div>
              <div>
                <h3 className="text-xl font-semibold">{viewingDetails.name}</h3>
                <p className="text-muted-foreground">{viewingDetails.description}</p>
                <Badge variant="outline" className="mt-2 capitalize">
                  {viewingDetails.category}
                </Badge>
              </div>
            </div>

            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-4">
                {viewingDetails.goals.map((goal, index) => (
                  <Card key={index} className="bg-muted/30 border-border">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{goal.title}</CardTitle>
                      <CardDescription>{goal.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm font-medium mb-2 text-muted-foreground">Tactics:</p>
                      <ul className="space-y-1">
                        {goal.tactics.map((tactic, tIndex) => (
                          <li key={tIndex} className="text-sm flex items-center gap-2">
                            <Check className="h-3 w-3 text-primary" />
                            <span>{tactic.title}</span>
                            <Badge variant="secondary" className="ml-auto text-xs">
                              {tactic.weeklyTarget} {tactic.unit}/week
                            </Badge>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>

            <DialogFooter>
              <Button variant="outline" onClick={() => setViewingDetails(null)}>
                Back
              </Button>
              <Button 
                onClick={() => {
                  setSelectedTemplate(viewingDetails);
                  handleSelect();
                }}
                className="gradient-primary text-primary-foreground"
              >
                Use This Template
              </Button>
            </DialogFooter>
          </div>
        ) : (
          // Template List View
          <>
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="fitness">Fitness</TabsTrigger>
                <TabsTrigger value="business">Business</TabsTrigger>
                <TabsTrigger value="learning">Learning</TabsTrigger>
                <TabsTrigger value="personal">Personal</TabsTrigger>
              </TabsList>

              {categories.map((category) => (
                <TabsContent key={category} value={category} className="mt-4">
                  <ScrollArea className="h-[350px] pr-4">
                    <div className="grid gap-3">
                      {/* Blank Cycle Option */}
                      {category === 'all' && (
                        <Card 
                          className={`cursor-pointer transition-all hover:border-primary/50 ${
                            selectedTemplate === null ? 'border-primary bg-primary/5' : 'bg-muted/20 border-border'
                          }`}
                          onClick={() => setSelectedTemplate(null)}
                        >
                          <CardContent className="p-4 flex items-center gap-4">
                            <div className="text-3xl">📝</div>
                            <div className="flex-1">
                              <h4 className="font-medium">Blank Cycle</h4>
                              <p className="text-sm text-muted-foreground">
                                Start fresh with your own goals and tactics
                              </p>
                            </div>
                            {selectedTemplate === null && (
                              <Check className="h-5 w-5 text-primary" />
                            )}
                          </CardContent>
                        </Card>
                      )}

                      {/* Template Cards */}
                      {CYCLE_TEMPLATES
                        .filter(t => category === 'all' || t.category === category)
                        .map((template) => {
                          const CategoryIcon = CATEGORY_ICONS[template.category];
                          return (
                            <Card 
                              key={template.id}
                              className={`cursor-pointer transition-all hover:border-primary/50 ${
                                selectedTemplate?.id === template.id ? 'border-primary bg-primary/5' : 'bg-muted/20 border-border'
                              }`}
                              onClick={() => setSelectedTemplate(template)}
                            >
                              <CardContent className="p-4 flex items-center gap-4">
                                <div className="text-3xl">{template.icon}</div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-medium">{template.name}</h4>
                                    <Badge variant="outline" className="text-xs capitalize">
                                      <CategoryIcon className="h-3 w-3 mr-1" />
                                      {CATEGORY_LABELS[template.category]}
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-muted-foreground line-clamp-1">
                                    {template.description}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {template.goals.length} goal{template.goals.length !== 1 ? 's' : ''} • {template.goals.reduce((acc, g) => acc + g.tactics.length, 0)} tactics
                                  </p>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setViewingDetails(template);
                                  }}
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                                {selectedTemplate?.id === template.id && (
                                  <Check className="h-5 w-5 text-primary" />
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                    </div>
                  </ScrollArea>
                </TabsContent>
              ))}
            </Tabs>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={handleStartBlank} className="w-full sm:w-auto">
                Start Blank
              </Button>
              <Button 
                onClick={handleSelect}
                disabled={selectedTemplate === null}
                className="w-full sm:w-auto gradient-primary text-primary-foreground"
              >
                {selectedTemplate ? `Use "${selectedTemplate.name}"` : 'Select a Template'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default TemplateSelector;
