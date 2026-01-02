import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Clock, Plus, Trash2, Edit, Quote, Zap, Coffee, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { getRandomQuote } from "@shared/quotes";

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const BLOCK_TYPES = [
  { value: 'strategic', label: 'Strategic Block', icon: Zap, description: '3+ hours of uninterrupted deep work' },
  { value: 'buffer', label: 'Buffer Block', icon: Coffee, description: '30-60 min for admin tasks' },
  { value: 'breakout', label: 'Breakout Block', icon: Sparkles, description: '1-3 hours for growth & recharge' },
];

function BlockForm({ 
  cycleId, 
  block, 
  onClose 
}: { 
  cycleId: number; 
  block?: any; 
  onClose: () => void;
}) {
  const [blockType, setBlockType] = useState<'strategic' | 'buffer' | 'breakout'>(block?.blockType || 'strategic');
  const [dayOfWeek, setDayOfWeek] = useState(block?.dayOfWeek?.toString() || '1');
  const [startTime, setStartTime] = useState(block?.startTime || '09:00');
  const [endTime, setEndTime] = useState(block?.endTime || '12:00');
  const [description, setDescription] = useState(block?.description || '');

  const createBlock = trpc.performanceBlock.create.useMutation();
  const updateBlock = trpc.performanceBlock.update.useMutation();
  const utils = trpc.useUtils();

  const handleSubmit = async () => {
    try {
      if (block) {
        await updateBlock.mutateAsync({
          blockId: block.id,
          blockType,
          dayOfWeek: parseInt(dayOfWeek),
          startTime,
          endTime,
          description,
        });
        toast.success("Block updated");
      } else {
        await createBlock.mutateAsync({
          cycleId,
          blockType,
          dayOfWeek: parseInt(dayOfWeek),
          startTime,
          endTime,
          description,
        });
        toast.success("Block created");
      }
      utils.performanceBlock.list.invalidate();
      onClose();
    } catch (error) {
      toast.error("Failed to save block");
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Block Type</Label>
        <Select value={blockType} onValueChange={(v: any) => setBlockType(v)}>
          <SelectTrigger className="bg-input border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {BLOCK_TYPES.map(type => (
              <SelectItem key={type.value} value={type.value}>
                <div className="flex items-center gap-2">
                  <type.icon className="h-4 w-4" />
                  {type.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {BLOCK_TYPES.find(t => t.value === blockType)?.description}
        </p>
      </div>

      <div className="space-y-2">
        <Label>Day of Week</Label>
        <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
          <SelectTrigger className="bg-input border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DAYS.map((day, index) => (
              <SelectItem key={index} value={index.toString()}>
                {day}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Time</Label>
          <Input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="bg-input border-border"
          />
        </div>
        <div className="space-y-2">
          <Label>End Time</Label>
          <Input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="bg-input border-border"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Description (Optional)</Label>
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What will you focus on during this block?"
          className="bg-input border-border"
        />
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button 
          onClick={handleSubmit}
          disabled={createBlock.isPending || updateBlock.isPending}
          className="gradient-primary text-primary-foreground"
        >
          {block ? "Update Block" : "Create Block"}
        </Button>
      </DialogFooter>
    </div>
  );
}

function BlockCard({ block, onEdit, onDelete }: { block: any; onEdit: () => void; onDelete: () => void }) {
  const blockType = BLOCK_TYPES.find(t => t.value === block.blockType);
  const Icon = blockType?.icon || Clock;
  
  return (
    <div className={`p-4 rounded-lg border block-${block.blockType}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-lg bg-current/10 flex items-center justify-center">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-medium">{blockType?.label}</h4>
            <p className="text-sm opacity-80">
              {block.startTime} - {block.endTime}
            </p>
            {block.description && (
              <p className="text-sm mt-1 opacity-70">{block.description}</p>
            )}
          </div>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={onEdit} className="h-8 w-8">
            <Edit className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onDelete} className="h-8 w-8">
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function PerformanceBlocks() {
  const [isAdding, setIsAdding] = useState(false);
  const [editingBlock, setEditingBlock] = useState<any>(null);
  const [quote] = useState(() => getRandomQuote("time_management"));

  const { data: cycles } = trpc.cycle.list.useQuery();
  const activeCycle = cycles?.find(c => c.status === 'active') || cycles?.[0];
  
  const { data: blocks, isLoading } = trpc.performanceBlock.list.useQuery(
    { cycleId: activeCycle?.id ?? 0 },
    { enabled: !!activeCycle }
  );

  const deleteBlock = trpc.performanceBlock.delete.useMutation();
  const utils = trpc.useUtils();

  const handleDelete = async (blockId: number) => {
    if (confirm("Delete this performance block?")) {
      await deleteBlock.mutateAsync({ blockId });
      utils.performanceBlock.list.invalidate();
      toast.success("Block deleted");
    }
  };

  // Group blocks by day
  const blocksByDay = DAYS.map((day, index) => ({
    day,
    dayIndex: index,
    blocks: blocks?.filter(b => b.dayOfWeek === index) || [],
  }));

  if (!activeCycle) {
    return (
      <AppLayout currentPage="blocks">
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <Clock className="h-16 w-16 text-muted-foreground/40 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Active Cycle</h2>
          <p className="text-muted-foreground">Create a cycle from the dashboard to schedule your blocks.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout currentPage="blocks">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3">
              <Clock className="h-7 w-7 text-primary" />
              Performance Blocks
            </h1>
            <p className="text-muted-foreground mt-1">
              Schedule your Strategic, Buffer, and Breakout blocks
            </p>
          </div>
          <Button 
            onClick={() => setIsAdding(true)}
            className="gradient-primary text-primary-foreground"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Block
          </Button>
        </div>

        {/* Quote Card */}
        <div className="quote-card">
          <Quote className="h-5 w-5 text-primary/40 mb-2" />
          <p className="text-sm italic text-foreground/90">"{quote.text}"</p>
          <p className="text-xs text-primary mt-2">— {quote.chapter}</p>
        </div>

        {/* Block Types Reference */}
        <div className="grid md:grid-cols-3 gap-4">
          {BLOCK_TYPES.map(type => (
            <Card key={type.value} className={`bg-card border-border block-${type.value}`}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-2">
                  <type.icon className="h-5 w-5" />
                  <h3 className="font-semibold">{type.label}</h3>
                </div>
                <p className="text-sm opacity-80">{type.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Weekly Schedule */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Weekly Schedule</CardTitle>
            <CardDescription>
              Your recurring performance blocks for each day
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-7 gap-4">
              {blocksByDay.map(({ day, dayIndex, blocks: dayBlocks }) => (
                <div key={dayIndex} className="space-y-2">
                  <h4 className="font-medium text-sm text-center pb-2 border-b border-border">
                    {day.slice(0, 3)}
                  </h4>
                  {dayBlocks.length > 0 ? (
                    <div className="space-y-2">
                      {dayBlocks
                        .sort((a, b) => a.startTime.localeCompare(b.startTime))
                        .map(block => {
                          const blockType = BLOCK_TYPES.find(t => t.value === block.blockType);
                          const Icon = blockType?.icon || Clock;
                          return (
                            <div 
                              key={block.id}
                              className={`p-2 rounded-lg border text-xs block-${block.blockType} cursor-pointer hover:opacity-80 transition-opacity`}
                              onClick={() => setEditingBlock(block)}
                            >
                              <div className="flex items-center gap-1 mb-1">
                                <Icon className="h-3 w-3" />
                                <span className="font-medium truncate">{blockType?.label.split(' ')[0]}</span>
                              </div>
                              <p className="opacity-80">{block.startTime}</p>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      No blocks
                    </p>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* All Blocks List */}
        {blocks && blocks.length > 0 && (
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>All Blocks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {DAYS.map((day, dayIndex) => {
                  const dayBlocks = blocks.filter(b => b.dayOfWeek === dayIndex);
                  if (dayBlocks.length === 0) return null;
                  
                  return (
                    <div key={dayIndex}>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">{day}</h4>
                      <div className="space-y-2">
                        {dayBlocks
                          .sort((a, b) => a.startTime.localeCompare(b.startTime))
                          .map(block => (
                            <BlockCard
                              key={block.id}
                              block={block}
                              onEdit={() => setEditingBlock(block)}
                              onDelete={() => handleDelete(block.id)}
                            />
                          ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add Block Dialog */}
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Performance Block</DialogTitle>
              <DialogDescription>
                Schedule a recurring block for focused work
              </DialogDescription>
            </DialogHeader>
            <BlockForm cycleId={activeCycle.id} onClose={() => setIsAdding(false)} />
          </DialogContent>
        </Dialog>

        {/* Edit Block Dialog */}
        <Dialog open={!!editingBlock} onOpenChange={() => setEditingBlock(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Performance Block</DialogTitle>
            </DialogHeader>
            <BlockForm 
              cycleId={activeCycle.id} 
              block={editingBlock} 
              onClose={() => setEditingBlock(null)} 
            />
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
