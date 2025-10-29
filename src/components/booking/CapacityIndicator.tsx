import React from 'react';
import { Users, UserPlus, AlertTriangle, CheckCircle } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TimeSlot } from '@/types/booking';

interface CapacityIndicatorProps {
  timeSlot: TimeSlot;
  showDetails?: boolean;
  compact?: boolean;
}

export function CapacityIndicator({ timeSlot, showDetails = false, compact = false }: CapacityIndicatorProps) {
  if (!timeSlot.capacity || !timeSlot.remainingCapacity !== undefined) {
    return null;
  }

  const capacity = timeSlot.capacity;
  const remaining = timeSlot.remainingCapacity;
  const occupied = capacity - remaining;
  const occupancyRate = (occupied / capacity) * 100;

  const getStatusColor = () => {
    if (occupancyRate >= 90) return 'text-red-600';
    if (occupancyRate >= 70) return 'text-amber-600';
    return 'text-green-600';
  };

  const getStatusBg = () => {
    if (occupancyRate >= 90) return 'bg-red-100';
    if (occupancyRate >= 70) return 'bg-amber-100';
    return 'bg-green-100';
  };

  const getStatusIcon = () => {
    if (remaining === 0) return <AlertTriangle className="h-4 w-4" />;
    if (remaining <= 2) return <UserPlus className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  const getStatusText = () => {
    if (remaining === 0) return 'Fully Booked';
    if (remaining <= 2) return `Only ${remaining} left`;
    return `${remaining} available`;
  };

  if (compact) {
    return (
      <div className={`flex items-center gap-1 ${getStatusColor()}`}>
        {getStatusIcon()}
        <span className="text-xs font-medium">
          {remaining}/{capacity}
        </span>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-3">
        {/* Main Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {remaining} of {capacity} slots available
            </span>
          </div>
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="outline" className={`${getStatusColor()} ${getStatusBg()} border-current`}>
                {getStatusIcon()}
                <span className="ml-1 text-xs">{getStatusText()}</span>
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">
                {occupancyRate.toFixed(0)}% occupied
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Progress Bar */}
        <Progress
          value={100 - occupancyRate}
          className="h-2"
          // Color based on availability
        />

        {/* Group Booking Info */}
        {timeSlot.allowsGroups && timeSlot.maxGroupSize && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="h-3 w-3" />
            <span>
              Groups up to {timeSlot.maxGroupSize} people
            </span>
            {remaining >= 2 && (
              <Badge variant="secondary" className="text-xs">
                Group-friendly
              </Badge>
            )}
          </div>
        )}

        {/* Detailed Breakdown */}
        {showDetails && (
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-muted-foreground">Available:</span>
              <span className={`ml-1 font-medium ${getStatusColor()}`}>
                {remaining} slots
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Occupied:</span>
              <span className="ml-1 font-medium">
                {occupied} slots
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Total Capacity:</span>
              <span className="ml-1 font-medium">
                {capacity} slots
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Utilization:</span>
              <span className={`ml-1 font-medium ${getStatusColor()}`}>
                {occupancyRate.toFixed(0)}%
              </span>
            </div>
          </div>
        )}

        {/* Availability Warning */}
        {remaining === 0 && (
          <div className="p-2 bg-red-50 border border-red-200 rounded-md">
            <p className="text-xs text-red-700">
              This time slot is fully booked. Consider joining the waitlist or selecting a different time.
            </p>
          </div>
        )}

        {remaining > 0 && remaining <= 2 && (
          <div className="p-2 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-xs text-amber-700">
              Only {remaining} slot{remaining === 1 ? '' : 's'} left! Book soon to secure your spot.
            </p>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}