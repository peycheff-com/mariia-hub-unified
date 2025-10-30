import { useState } from 'react';
import { Zap, MapPin, Laptop, Dumbbell } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast aria-live="polite" aria-atomic="true"';
import { useAvailability } from '@/hooks/useAvailability';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface QuickSlotCreatorProps {
  serviceType: 'beauty' | 'fitness';
  onComplete: () => void;
}

const QuickSlotCreator = ({ serviceType, onComplete }: QuickSlotCreatorProps) => {
  const { createSlot } = useAvailability(serviceType);
  const { toast aria-live="polite" aria-atomic="true" } = useToast();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  const [formData, setFormData] = useState({
    startTime: '09:00',
    endTime: '17:00',
    location: serviceType === 'beauty' ? 'studio' : 'fitness' as 'studio' | 'online' | 'fitness',
    selectedDays: [1, 2, 3, 4, 5], // Monday to Friday by default
  });

  const handleDayToggle = (day: number) => {
    setFormData(prev => ({
      ...prev,
      selectedDays: prev.selectedDays.includes(day)
        ? prev.selectedDays.filter(d => d !== day)
        : [...prev.selectedDays, day].sort()
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.selectedDays.length === 0) {
      toast aria-live="polite" aria-atomic="true"({
        title: 'No days selected',
        description: 'Please select at least one day',
        variant: 'destructive',
      });
      return;
    }

    setCreating(true);

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const day of formData.selectedDays) {
        const result = await createSlot({
          day_of_week: day,
          start_time: formData.startTime,
          end_time: formData.endTime,
          service_type: serviceType,
          location: formData.location,
          is_available: true,
          notes: null,
        });

        if (result.success) {
          successCount++;
        } else {
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast aria-live="polite" aria-atomic="true"({
          title: 'Slots Created',
          description: `Successfully created ${successCount} availability slot${successCount !== 1 ? 's' : ''}${errorCount > 0 ? ` (${errorCount} failed)` : ''}`,
        });
        setOpen(false);
        onComplete();
      }
    } catch (error) {
      toast aria-live="polite" aria-atomic="true"({
        title: 'Error',
        description: 'Failed to create slots',
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-sage text-charcoal hover:bg-sage/90">
          <Zap className="w-4 h-4 mr-2" />
          Quick Create Slots
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-card border-graphite/20 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-serif text-pearl flex items-center gap-2">
            <Zap className="w-5 h-5 text-sage" />
            Quick Create Availability
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div>
            <Label className="text-pearl/70 text-sm mb-3 block">Select Days</Label>
            <div className="grid grid-cols-7 gap-2">
              {DAYS.map((day, index) => (
                <div key={index} className="text-center">
                  <Checkbox
                    id={`day-${index}`}
                    checked={formData.selectedDays.includes(index)}
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-pearl/70 text-sm">Start Time</Label>
              <Input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="glass-card border-graphite/20 text-pearl"
                required
              />
            </div>
            <div>
              <Label className="text-pearl/70 text-sm">End Time</Label>
              <Input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="glass-card border-graphite/20 text-pearl"
                required
              />
            </div>
          </div>

          <div>
            <Label className="text-pearl/70 text-sm">Location</Label>
            <Select
              value={formData.location}
              onValueChange={(value: any) => setFormData({ ...formData, location: value })}
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

          <div className="bg-sage/10 border border-sage/20 rounded-lg p-3">
            <p className="text-xs text-pearl/70">
              This will create availability slots for the selected days at the specified time.
              Conflicting slots will be skipped automatically.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1 border-graphite/20 text-pearl hover:bg-cocoa/50"
              disabled={creating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-sage text-charcoal hover:bg-sage/90"
              disabled={creating}
            >
              {creating ? 'Creating...' : 'Create Slots'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default QuickSlotCreator;
