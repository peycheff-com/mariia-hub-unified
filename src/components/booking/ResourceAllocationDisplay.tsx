import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users,
  MapPin,
  Calendar,
  CheckCircle,
  AlertTriangle,
  Clock,
  Wrench
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ResourceAllocation, ResourceConflict, ResourceUtilization } from '@/services/resourceAllocation.service';

interface ResourceAllocationDisplayProps {
  allocations: ResourceAllocation[];
  conflicts?: ResourceConflict[];
  utilization?: ResourceUtilization[];
  compact?: boolean;
  showConflicts?: boolean;
  showUtilization?: boolean;
}

export const ResourceAllocationDisplay: React.FC<ResourceAllocationDisplayProps> = ({
  allocations,
  conflicts = [],
  utilization = [],
  compact = false,
  showConflicts = true,
  showUtilization = true
}) => {
  const { t } = useTranslation();

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'room':
        return <MapPin className="h-4 w-4" />;
      case 'equipment':
        return <Wrench className="h-4 w-4" />;
      case 'specialist':
        return <Users className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getConflictSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'outline';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const groupAllocationsByType = () => {
    const grouped: Record<string, ResourceAllocation[]> = {};
    allocations.forEach(allocation => {
      if (!grouped[allocation.resourceType]) {
        grouped[allocation.resourceType] = [];
      }
      grouped[allocation.resourceType].push(allocation);
    });
    return grouped;
  };

  if (compact) {
    return (
      <div className="space-y-2">
        {Object.entries(groupAllocationsByType()).map(([type, typeAllocations]) => (
          <div key={type} className="flex items-center justify-between p-2 border rounded">
            <div className="flex items-center gap-2">
              {getResourceIcon(type)}
              <span className="text-sm font-medium capitalize">{type}</span>
            </div>
            <Badge variant="outline">{typeAllocations.length} allocated</Badge>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Conflicts Alert */}
      {showConflicts && conflicts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {conflicts.length} resource conflict{conflicts.length > 1 ? 's' : ''} detected. Some resources may not be available.
          </AlertDescription>
        </Alert>
      )}

      {/* Resource Allocations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('booking.resources.allocated', 'Allocated Resources')}
          </CardTitle>
          <CardDescription>
            Resources assigned to your appointment
          </CardDescription>
        </CardHeader>
        <CardContent>
          {allocations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No resources allocated</p>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupAllocationsByType()).map(([type, typeAllocations]) => (
                <div key={type} className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b">
                    {getResourceIcon(type)}
                    <h4 className="font-medium capitalize">{type}s</h4>
                    <Badge variant="outline">{typeAllocations.length}</Badge>
                  </div>

                  <div className="grid gap-3">
                    {typeAllocations.map(allocation => (
                      <div
                        key={allocation.id}
                        className={`p-3 border rounded-lg ${
                          allocation.status === 'confirmed'
                            ? 'bg-green-50 border-green-200'
                            : allocation.status === 'allocated'
                            ? 'bg-blue-50 border-blue-200'
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {allocation.status === 'confirmed' ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : (
                              <Clock className="h-4 w-4 text-blue-600" />
                            )}
                            <span className="font-medium">
                              Resource {allocation.resourceId.slice(-8)} {/* Show last 8 chars of ID */}
                            </span>
                          </div>
                          <Badge
                            variant={
                              allocation.status === 'confirmed' ? 'default' :
                              allocation.status === 'allocated' ? 'secondary' : 'outline'
                            }
                          >
                            {allocation.status}
                          </Badge>
                        </div>

                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Quantity:</span>
                            <span className="font-medium">{allocation.quantity}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Time:</span>
                            <span className="font-medium">
                              {allocation.startTime.toLocaleTimeString()} - {allocation.endTime.toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resource Utilization */}
      {showUtilization && utilization.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('booking.resources.utilization', 'Resource Utilization')}
            </CardTitle>
            <CardDescription>
              Current utilization rates for allocated resources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {utilization.map(resource => (
                <div key={resource.resourceId} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getResourceIcon(resource.resourceType)}
                      <span className="font-medium">{resource.resourceName}</span>
                    </div>
                    <Badge
                      variant={
                        resource.utilizationRate >= 80 ? 'destructive' :
                        resource.utilizationRate >= 60 ? 'outline' : 'secondary'
                      }
                    >
                      {Math.round(resource.utilizationRate)}%
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <Progress value={resource.utilizationRate} className="h-2" />
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>{resource.utilizedCapacity} / {resource.totalCapacity} in use</span>
                      <span>Peak: {Math.round(resource.peakUtilization)}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Conflicts Detail */}
      {showConflicts && conflicts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              {t('booking.resources.conflicts', 'Resource Conflicts')}
            </CardTitle>
            <CardDescription>
              Conflicts that need to be resolved
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {conflicts.map(conflict => (
                <div
                  key={conflict.id}
                  className={`p-3 border rounded-lg ${
                    conflict.severity === 'critical' || conflict.severity === 'high'
                      ? 'border-red-200 bg-red-50'
                      : conflict.severity === 'medium'
                      ? 'border-yellow-200 bg-yellow-50'
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium capitalize">{conflict.conflictType}</span>
                    </div>
                    <Badge variant={getConflictSeverityColor(conflict.severity)}>
                      {conflict.severity}
                    </Badge>
                  </div>

                  <p className="text-sm text-gray-700 mb-2">{conflict.description}</p>

                  <div className="text-xs text-gray-600">
                    <div>Detected: {conflict.detectedAt.toLocaleString()}</div>
                    {conflict.resolution && (
                      <div className="mt-1 p-2 bg-white rounded border">
                        <strong>Resolution:</strong> {conflict.resolution}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};