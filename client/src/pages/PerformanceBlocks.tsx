import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { Clock, Plus, Trash2, Edit, Quote, Zap, Coffee, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { getRandomQuote } from "@shared/quotes";
import TooltipTour, { TourStep } from "@/components/TooltipTour";

const BLOCKS_TOUR_STEPS: TourStep[] = [
  {
    target: "[data-tour='block-types']",
    title: "Three Types of Blocks",
    content: "Strategic blocks are for deep work (3+ hours). Buffer blocks handle admin tasks. Breakout blocks are for growth and recharge.",
    position: "bottom",
  },
  {
    target: "[data-tour='weekly-schedule']",
    title: "Your Weekly Schedule",
    content: "Plan your blocks for each day of the week. Consistency is key to building productive habits.",
    position: "top",
  },
  {
    target: "[data-tour='add-block-btn']",
    title: "Add Performance Blocks",
    content: "Click here to schedule a new block. Use repeat patterns to add blocks to multiple days at once.",
    position: "left",
  },
];

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const BLOCK_TYPES = [
  { value: 'strategic', label: 'Strategic Block', icon: Zap, description: '3+ hours of uninterrupted deep work' },
  { value: 'buffer', label: 'Buffer Block', icon: Coffee, description: '30-60 min for admin tasks' },
  { value: 'breakout', label: 'Breakout Block', icon: Sparkles, description: '1-3 hours for growth & recharge' },
];

type RepeatPattern = 'single' | 'weekdays' | 'weekends' | 'all' | 'custom';

const REPEAT_PATTERNS = [
  { value: 'single', label: 'This Day Only', description: 'Just this one day' },
  { value: 'weekdays', label: 'Weekdays', description: 'Monday to Friday' },
  { value: 'weekends', label: 'Weekends', description: 'Saturday & Sunday' },
  { value: 'all', label: 'Every Day', description: 'All 7 days' },
  { value: 'custom', label: 'Custom', description: 'Select specific days' },
];

function getSelectedDays(pattern: RepeatPattern, customDays: number[], singleDay: number): number[] {
  switch (pattern) {
    case 'single':
      return [singleDay];
    case 'weekdays':
      return [1, 2, 3, 4, 5]; // Mon-Fri
    case 'weekends':
      return [0, 6]; // Sun, Sat
    case 'all':
      return [0, 1, 2, 3, 4, 5, 6];
    case 'custom':
      return customDays;
    default:
      return [singleDay];
  }
}

function BlockForm({ 
  cycleId, 
  block, 
  onClose,
  allBlocks,
}: { 
  cycleId: number; 
  block?: any; 
  onClose: () => void;
  allBlocks?: any[];
}) {
  const [blockType, setBlockType] = useState<'strategic' | 'buffer' | 'breakout'>(block?.blockType || 'strategic');
  const [repeatPattern, setRepeatPattern] = useState<RepeatPattern>(block ? 'single' : 'weekdays');
  const [singleDay, setSingleDay] = useState(block?.dayOfWeek ?? 1);
  const [customDays, setCustomDays] = useState<number[]>(block ? [block.dayOfWeek] : [1, 2, 3, 4, 5]);
  const [startTime, setStartTime] = useState(block?.startTime || '09:00');
  const [endTime, setEndTime] = useState(block?.endTime || '12:00');
  const [description, setDescription] = useState(block?.description || '');

  const createBlock = trpc.performanceBlock.create.useMutation();
  const updateBlock = trpc.performanceBlock.update.useMutation();
  const bulkUpdateBlock = trpc.performanceBlock.bulkUpdate.useMutation();
  const utils = trpc.useUtils();

  const toggleCustomDay = (dayIndex: number) => {
    setCustomDays(prev => 
      prev.includes(dayIndex) 
        ? prev.filter(d => d !== dayIndex)
        : [...prev, dayIndex].sort((a, b) => a - b)
    );
  };

  const selectedDays = getSelectedDays(repeatPattern, customDays, singleDay);

  // For edit mode, find similar blocks on other days
  const similarBlockDays = block && allBlocks 
    ? allBlocks
        .filter(b => b.blockType === block.blockType && b.startTime === block.startTime && b.id !== block.id)
        .map(b => b.dayOfWeek)
    : [];

  const handleSubmit = async () => {
    try {
      if (block) {
        // Editing existing block
        if (repeatPattern === 'single') {
          // Update just this block
          await updateBlock.mutateAsync({
            blockId: block.id,
            blockType,
            dayOfWeek: singleDay,
            startTime,
            endTime,
            description,
          });
          toast.success("Block updated");
        } else {
          // Bulk update - apply to multiple days
          const daysToUpdate = selectedDays;
          
          if (daysToUpdate.length === 0) {
            toast.error("Please select at least one day");
            return;
          }

          await bulkUpdateBlock.mutateAsync({
            cycleId,
            sourceBlockId: block.id,
            targetDays: daysToUpdate,
            blockType,
            startTime,
            endTime,
            description,
          });
          
          const dayNames = daysToUpdate.map(d => SHORT_DAYS[d]).join(', ');
          toast.success(`Block${daysToUpdate.length > 1 ? 's' : ''} updated for ${dayNames}`);
        }
      } else {
        // Create new blocks for all selected days
        const daysToCreate = selectedDays;
        
        if (daysToCreate.length === 0) {
          toast.error("Please select at least one day");
          return;
        }

        // Create blocks for each selected day
        for (const day of daysToCreate) {
          await createBlock.mutateAsync({
            cycleId,
            blockType,
            dayOfWeek: day,
            startTime,
            endTime,
            description,
          });
        }
        
        const dayNames = daysToCreate.map(d => SHORT_DAYS[d]).join(', ');
        toast.success(`Block${daysToCreate.length > 1 ? 's' : ''} created for ${dayNames}`);
      }
      utils.performanceBlock.list.invalidate();
      onClose();
    } catch (error) {
      toast.error("Failed to save block");
    }
  };

  const isLoading = createBlock.isPending || updateBlock.isPending || bulkUpdateBlock.isPending;

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

      {/* Apply To / Repeat Pattern - show for both create and edit */}
      <div className="space-y-2">
        <Label>{block ? 'Apply Changes To' : 'Repeat'}</Label>
        <Select value={repeatPattern} onValueChange={(v: RepeatPattern) => setRepeatPattern(v)}>
          <SelectTrigger className="bg-input border-border">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REPEAT_PATTERNS.map(pattern => (
              <SelectItem key={pattern.value} value={pattern.value}>
                <div className="flex flex-col">
                  <span>{pattern.label}</span>
                  <span className="text-xs text-muted-foreground">{pattern.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {block && similarBlockDays.length > 0 && (
          <p className="text-xs text-muted-foreground">
            Similar blocks exist on: {similarBlockDays.map(d => SHORT_DAYS[d]).join(', ')}
          </p>
        )}
      </div>

      {/* Single Day Selector - only show when single day pattern */}
      {repeatPattern === 'single' && (
        <div className="space-y-2">
          <Label>Day of Week</Label>
          <Select value={singleDay.toString()} onValueChange={(v) => setSingleDay(parseInt(v))}>
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
      )}

      {/* Custom Day Selector - show for custom pattern */}
      {repeatPattern === 'custom' && (
        <div className="space-y-2">
          <Label>Select Days</Label>
          <div className="grid grid-cols-7 gap-2">
            {DAYS.map((day, index) => (
              <div 
                key={index}
                className={`flex flex-col items-center p-2 rounded-lg border cursor-pointer transition-colors ${
                  customDays.includes(index) 
                    ? 'bg-primary/20 border-primary text-primary' 
                    : 'bg-input border-border hover:border-primary/50'
                }`}
                onClick={() => toggleCustomDay(index)}
              >
                <Checkbox 
                  checked={customDays.includes(index)}
                  className="mb-1"
                  onCheckedChange={() => toggleCustomDay(index)}
                />
                <span className="text-xs font-medium">{SHORT_DAYS[index]}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {customDays.length === 0 
              ? 'Select at least one day' 
              : `Selected: ${customDays.map(d => SHORT_DAYS[d]).join(', ')}`}
          </p>
        </div>
      )}

      {/* Preview of selected days for non-custom, non-single patterns */}
      {repeatPattern !== 'single' && repeatPattern !== 'custom' && (
        <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
          <p className="text-sm text-primary">
            <span className="font-medium">{block ? 'Will update blocks for:' : 'Will create blocks for:'}</span>{' '}
            {selectedDays.map(d => SHORT_DAYS[d]).join(', ')}
          </p>
        </div>
      )}

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
          disabled={isLoading || (repeatPattern === 'custom' && customDays.length === 0)}
          className="gradient-primary text-primary-foreground"
        >
          {block 
            ? (repeatPattern === 'single' ? "Update Block" : `Update ${selectedDays.length} Block${selectedDays.length > 1 ? 's' : ''}`)
            : `Create Block${selectedDays.length > 1 ? 's' : ''}`
          }
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
            data-tour="add-block-btn"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Block
          </Button>
        </div>

        {/* Tooltip Tour */}
        <TooltipTour pageKey="blocks" steps={BLOCKS_TOUR_STEPS} />

        {/* Quote Card */}
        <div className="quote-card">
          <Quote className="h-5 w-5 text-primary/40 mb-2" />
          <p className="text-sm italic text-foreground/90">"{quote.text}"</p>
          <p className="text-xs text-primary mt-2">— {quote.chapter}</p>
        </div>

        {/* Block Types Reference */}
        <div className="grid md:grid-cols-3 gap-4" data-tour="block-types">
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
        <Card className="bg-card border-border" data-tour="weekly-schedule">
          <CardHeader>
            <CardTitle>Weekly Schedule</CardTitle>
            <CardDescription>Your recurring performance blocks for each day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-4">
              {blocksByDay.map(({ day, dayIndex, blocks: dayBlocks }) => (
                <div key={dayIndex} className="space-y-2">
                  <h4 className="font-medium text-center text-sm pb-2 border-b border-border">
                    {SHORT_DAYS[dayIndex]}
                  </h4>
                  <div className="space-y-2 min-h-[100px]">
                    {dayBlocks.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-4">No blocks</p>
                    ) : (
                      dayBlocks.map(block => (
                        <BlockCard
                          key={block.id}
                          block={block}
                          onEdit={() => setEditingBlock(block)}
                          onDelete={() => handleDelete(block.id)}
                        />
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Add Block Dialog */}
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Add Performance Block</DialogTitle>
              <DialogDescription>
                Schedule a block to protect your focused work time. Use repeat patterns to add blocks to multiple days at once.
              </DialogDescription>
            </DialogHeader>
            <BlockForm 
              cycleId={activeCycle.id} 
              onClose={() => setIsAdding(false)} 
            />
          </DialogContent>
        </Dialog>

        {/* Edit Block Dialog */}
        <Dialog open={!!editingBlock} onOpenChange={(open) => !open && setEditingBlock(null)}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>Edit Performance Block</DialogTitle>
              <DialogDescription>
                Update your block details. Choose to apply changes to this day only, or to multiple days at once.
              </DialogDescription>
            </DialogHeader>
            {editingBlock && (
              <BlockForm 
                cycleId={activeCycle.id} 
                block={editingBlock}
                allBlocks={blocks}
                onClose={() => setEditingBlock(null)} 
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
