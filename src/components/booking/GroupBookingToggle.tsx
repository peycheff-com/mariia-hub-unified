import React, { useState } from 'react';
import { Users, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useGroupBooking } from '@/stores/bookingStore';
import { GroupParticipant } from '@/types/booking';

interface GroupBookingToggleProps {
  onGroupSizeChange?: (size: number) => void;
  maxGroupSize?: number;
}

export function GroupBookingToggle({ onGroupSizeChange, maxGroupSize = 10 }: GroupBookingToggleProps) {
  const { isGroupBooking, groupSize, groupParticipants, setGroupBooking, setGroupSize, addGroupParticipant, removeGroupParticipant, updateGroupParticipant } = useGroupBooking();
  const [newParticipant, setNewParticipant] = useState<GroupParticipant>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
  });

  const handleToggleGroup = () => {
    const newIsGroup = !isGroupBooking;
    setGroupBooking(newIsGroup);

    if (newIsGroup && groupSize < 2) {
      setGroupSize(2);
      // Initialize with primary contact
      addGroupParticipant({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
      });
    }

    onGroupSizeChange?.(newIsGroup ? groupSize : 1);
  };

  const handleGroupSizeChange = (newSize: number) => {
    const size = Math.max(1, Math.min(newSize, maxGroupSize));
    setGroupSize(size);

    // Adjust participants array
    if (size > groupParticipants.length) {
      // Add participants
      for (let i = groupParticipants.length; i < size; i++) {
        addGroupParticipant({
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
        });
      }
    } else {
      // Remove participants
      for (let i = groupParticipants.length; i > size; i--) {
        removeGroupParticipant(i - 1);
      }
    }

    onGroupSizeChange?.(size);
  };

  const handleAddParticipant = () => {
    if (newParticipant.firstName && newParticipant.lastName) {
      addGroupParticipant(newParticipant);
      setNewParticipant({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
      });
      handleGroupSizeChange(groupSize + 1);
    }
  };

  const handleParticipantChange = (index: number, field: keyof GroupParticipant, value: string) => {
    updateGroupParticipant(index, { [field]: value });
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {isGroupBooking ? <Users className="h-5 w-5" /> : <User className="h-5 w-5" />}
              Group Booking
            </CardTitle>
            <CardDescription>
              {isGroupBooking
                ? `Booking for ${groupSize} participants`
                : 'Individual booking'
              }
            </CardDescription>
          </div>
          <Button
            variant={isGroupBooking ? 'default' : 'outline'}
            onClick={handleToggleGroup}
            className="min-w-[140px]"
          >
            {isGroupBooking ? 'Group Booking' : 'Individual'}
          </Button>
        </div>
      </CardHeader>

      {isGroupBooking && (
        <CardContent className="space-y-4">
          {/* Group Size Selector */}
          <div className="space-y-2">
            <Label>Number of Participants</Label>
            <div className="flex items-center gap-4">
              <Input
                type="number"
                min={2}
                max={maxGroupSize}
                value={groupSize}
                onChange={(e) => handleGroupSizeChange(parseInt(e.target.value) || 1)}
                className="w-24"
              />
              <span className="text-sm text-muted-foreground">
                {groupSize === maxGroupSize ? `(Maximum: ${maxGroupSize})` : ''}
              </span>
            </div>
          </div>

          <Separator />

          {/* Participants List */}
          <div className="space-y-3">
            <Label>Participants Information</Label>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {groupParticipants.map((participant, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 p-3 border rounded-lg">
                  <div>
                    <Label htmlFor={`first-name-${index}`} className="text-xs">
                      First Name *
                    </Label>
                    <Input
                      id={`first-name-${index}`}
                      placeholder="First name"
                      value={participant.first_name || ''}
                      onChange={(e) => handleParticipantChange(index, 'firstName', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`last-name-${index}`} className="text-xs">
                      Last Name *
                    </Label>
                    <Input
                      id={`last-name-${index}`}
                      placeholder="Last name"
                      value={participant.last_name || ''}
                      onChange={(e) => handleParticipantChange(index, 'lastName', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`email-${index}`} className="text-xs">
                      Email
                    </Label>
                    <Input
                      id={`email-${index}`}
                      type="email"
                      placeholder="Email (optional)"
                      value={participant.email || ''}
                      onChange={(e) => handleParticipantChange(index, 'email', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`phone-${index}`} className="text-xs">
                      Phone
                    </Label>
                    <Input
                      id={`phone-${index}`}
                      placeholder="Phone (optional)"
                      value={participant.phone || ''}
                      onChange={(e) => handleParticipantChange(index, 'phone', e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Add Participant */}
          {groupSize < maxGroupSize && (
            <div className="flex items-center gap-2 pt-2">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                <Input
                  placeholder="First name"
                  value={newParticipant.firstName}
                  onChange={(e) => setNewParticipant({ ...newParticipant, firstName: e.target.value })}
                  className="text-sm"
                />
                <Input
                  placeholder="Last name"
                  value={newParticipant.lastName}
                  onChange={(e) => setNewParticipant({ ...newParticipant, lastName: e.target.value })}
                  className="text-sm"
                />
                <Input
                  type="email"
                  placeholder="Email (optional)"
                  value={newParticipant.email}
                  onChange={(e) => setNewParticipant({ ...newParticipant, email: e.target.value })}
                  className="text-sm"
                />
                <Input
                  placeholder="Phone (optional)"
                  value={newParticipant.phone}
                  onChange={(e) => setNewParticipant({ ...newParticipant, phone: e.target.value })}
                  className="text-sm"
                />
              </div>
              <Button
                onClick={handleAddParticipant}
                disabled={!newParticipant.firstName || !newParticipant.lastName}
                size="sm"
                className="whitespace-nowrap"
              >
                Add Participant
              </Button>
            </div>
          )}

          {/* Group Benefits */}
          <div className="mt-4 p-3 bg-primary/5 rounded-lg">
            <h4 className="font-medium text-sm mb-2">Group Benefits</h4>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Special group discounts available</li>
              <li>• Easy booking for multiple participants</li>
              <li>• Flexible scheduling options</li>
              <li>• Single payment for all participants</li>
            </ul>
          </div>
        </CardContent>
      )}
    </Card>
  );
}