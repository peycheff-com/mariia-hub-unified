import { useState } from 'react';
import { Zap, Plus, Trash2, Clock, MapPin, Laptop, Dumbbell } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface TimeBlock {
  id: string;
  startTime: string;
  endTime: string;
  duration: number; // minutes per slot
}

interface AutoSlotGeneratorProps {
  serviceType: 'beauty' | 'fitness';
  onComplete: () => void;
}

export const AutoSlotGenerator = ({ serviceType, onComplete }: AutoSlotGeneratorProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);

  const [config, setConfig] = useState({
    selectedDays: [1, 2, 3, 4, 5],
    location: serviceType === 'beauty' ? 'studio' : 'fitness' as 'studio' | 'online' | 'fitness',
  });

  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([
    { id: '1', startTime: '09:00', endTime: '12:00', duration: 60 },
    { id: '2', startTime: '13:00', endTime: '17:00', duration: 90 },
  ]);

  const addTimeBlock = () => {
    const newBlock: TimeBlock = {
      id: Date.now().toString(),
      startTime: '09:00',
      endTime: '17:00',
      duration: 60,
    };
    setTimeBlocks([...timeBlocks, newBlock]);
  };

  const removeTimeBlock = (id: string) => {
    setTimeBlocks(timeBlocks.filter(b => b.id !== id));
  };

  const updateTimeBlock = (id: string, updates: Partial<TimeBlock>) => {
    setTimeBlocks(timeBlocks.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const handleDayToggle = (day: number) => {
    setConfig(prev => ({
      ...prev,
      selectedDays: prev.selectedDays.includes(day)
        ? prev.selectedDays.filter(d => d !== day)
        : [...prev.selectedDays, day].sort()
    }));
  };

  const generateSlots = async () => {
    if (config.selectedDays.length === 0) {
      toast({
        title: 'No days selected',
        description: 'Please select at least one day',
        variant: 'destructive',
      });
      return;
    }

    if (timeBlocks.length === 0) {
      toast({
        title: 'No time blocks',
        description: 'Please add at least one time block',
        variant: 'destructive',
      });
      return;
    }

    setGenerating(true);

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const day of config.selectedDays) {
        for (const block of timeBlocks) {
          // Parse times
          const [startHour, startMin] = block.startTime.split(':').map(Number);
          const [endHour, endMin] = block.endTime.split(':').map(Number);
          
          const startMinutes = startHour * 60 + startMin;
          const endMinutes = endHour * 60 + endMin;
          const blockDuration = endMinutes - startMinutes;

          // Generate slots based on duration
          let currentStart = startMinutes;
          while (currentStart + block.duration <= endMinutes) {
            const slotStartHour = Math.floor(currentStart / 60);
            const slotStartMin = currentStart % 60;
            const slotStart = `${slotStartHour.toString().padStart(2, '0')}:${slotStartMin.toString().padStart(2, '0')}`;

            const slotEndMinutes = currentStart + block.duration;
            const slotEndHour = Math.floor(slotEndMinutes / 60);
            const slotEndMin = slotEndMinutes % 60;
            const slotEnd = `${slotEndHour.toString().padStart(2, '0')}:${slotEndMin.toString().padStart(2, '0')}`;

            // Check for conflicts
            const { data: conflicts } = await supabase
              .from('availability_slots')
              .select('id')
              .eq('day_of_week', day)
              .eq('service_type', serviceType)
              .eq('location', config.location)
              .or(`and(start_time.lte.${slotStart},end_time.gt.${slotStart}),and(start_time.lt.${slotEnd},end_time.gte.${slotEnd}),and(start_time.gte.${slotStart},end_time.lte.${slotEnd})`);

            if (!conflicts || conflicts.length === 0) {
              const { error } = await supabase
                .from('availability_slots')
                .insert({
                  day_of_week: day,
                  start_time: slotStart,
                  end_time: slotEnd,
                  service_type: serviceType,
                  location: config.location,
                  is_available: true,
                  notes: `Auto-generated ${block.duration}min slot`,
                });

              if (error) {
                errorCount++;
                logger.error('Slot creation error:', error);
              } else {
                successCount++;
              }
            }

            currentStart += block.duration;
          }
        }
      }

      if (successCount > 0) {
        toast({
          title: 'Slots Generated',
          description: `Successfully created ${successCount} slot${successCount !== 1 ? 's' : ''}${errorCount > 0 ? ` (${errorCount} skipped due to conflicts)` : ''}`,
        });
        setOpen(false);
        onComplete();
      } else {
        toast({
          title: 'No slots created',
          description: 'All time slots already exist or conflicts detected',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate slots',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-champagne text-charcoal hover:bg-champagne/90 gap-2">
          <Zap className="w-4 h-4" />
          Auto-Generate Slots
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-card border-graphite/20 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif text-pearl flex items-center gap-2">
            <Zap className="w-5 h-5 text-champagne" />
            Intelligent Slot Generator
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Days Selection */}
          <div>
            <Label className="text-pearl/70 text-sm mb-3 block">Select Days</Label>
            <div className="grid grid-cols-7 gap-2">
              {DAYS.map((day, index) => (
                <div key={index} className="text-center">
                  <Checkbox
                    id={`day-${index}`}
                    checked={config.selectedDays.includes(index)}
                    onCheckedChange={() => handleDayToggle(index)}
                    className="mx-auto"
                  />
                  <label
                    htmlFor={`day-${index}`}
                    className="text-[10px] text-pearl/60 block mt-1 cursor-pointer"
                  >
                    {day.slice(0, 3)}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Location */}
          <div>
            <Label className="text-pearl/70 text-sm">Location</Label>
            <Select
              value={config.location}
              onValueChange={(value: any) => setConfig({ ...config, location: value })}
            >
              <SelectTrigger className="glass-card border-graphite/20 text-pearl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="studio">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Studio
                  </div>
                </SelectItem>
                <SelectItem value="online">
                  <div className="flex items-center gap-2">
                    <Laptop className="w-4 h-4" />
                    Online
                  </div>
                </SelectItem>
                <SelectItem value="fitness">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="w-4 h-4" />
                    Fitness
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Time Blocks */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-pearl/70 text-sm">Time Blocks (Different slot lengths)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTimeBlock}
                className="gap-2 border-champagne/30 text-champagne hover:bg-champagne/10"
              >
                <Plus className="w-3 h-3" />
                Add Block
              </Button>
            </div>

            <div className="space-y-3">
              {timeBlocks.map((block, index) => (
                <Card key={block.id} className="bg-cocoa/30 border-graphite/20 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-pearl/50">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">Block {index + 1}</span>
                    </div>
                    
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <div>
                        <Input
                          type="time"
                          value={block.startTime}
                          onChange={(e) => updateTimeBlock(block.id, { startTime: e.target.value })}
                          className="glass-card border-graphite/20 text-pearl text-sm"
                        />
                      </div>
                      <div>
                        <Input
                          type="time"
                          value={block.endTime}
                          onChange={(e) => updateTimeBlock(block.id, { endTime: e.target.value })}
                          className="glass-card border-graphite/20 text-pearl text-sm"
                        />
                      </div>
                      <div>
                        <Select
                          value={block.duration.toString()}
                          onValueChange={(value) => updateTimeBlock(block.id, { duration: parseInt(value) })}
                        >
                          <SelectTrigger className="glass-card border-graphite/20 text-pearl text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="30">30 min slots</SelectItem>
                            <SelectItem value="45">45 min slots</SelectItem>
                            <SelectItem value="60">60 min slots</SelectItem>
                            <SelectItem value="90">90 min slots</SelectItem>
                            <SelectItem value="120">120 min slots</SelectItem>
                            <SelectItem value="180">180 min slots</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTimeBlock(block.id)}
                      className="h-8 w-8 text-graphite hover:text-pearl hover:bg-graphite/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-champagne/10 border border-champagne/20 rounded-lg p-4">
            <p className="text-xs text-pearl/70 leading-relaxed">
              The system will automatically create time slots based on your configuration. Each time block can have different slot durations (e.g., morning 60min, afternoon 90min). Conflicting slots will be skipped automatically.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1 border-graphite/20 text-pearl hover:bg-cocoa/50"
              disabled={generating}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={generateSlots}
              className="flex-1 bg-champagne text-charcoal hover:bg-champagne/90"
              disabled={generating}
            >
              {generating ? 'Generating...' : 'Generate Slots'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
