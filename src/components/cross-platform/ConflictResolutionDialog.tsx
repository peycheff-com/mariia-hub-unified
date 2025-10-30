import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConflictData {
  entityId: string;
  entityType: string;
  localData: Record<string, any>;
  remoteData: Record<string, any>;
  timestamp: string;
  resolutionStrategy: 'use_local' | 'use_remote' | 'merge' | 'manual';
}

interface ConflictResolutionDialogProps {
  isOpen: boolean;
  conflict: ConflictData | null;
  onResolve: (resolution: any) => void;
  onCancel: () => void;
}

interface ResolutionOption {
  id: 'use_local' | 'use_remote' | 'merge' | 'manual';
  title: string;
  description: string;
  icon: React.ReactNode;
  action: string;
  className?: string;
}

export const ConflictResolutionDialog: React.FC<ConflictResolutionDialogProps> = ({
  isOpen,
  conflict,
  onResolve,
  onCancel
}) => {
  const [selectedResolution, setSelectedResolution] = useState<ConflictData['resolutionStrategy'] | null>(null);
  const [showDataComparison, setShowDataComparison] = useState(false);

  if (!isOpen || !conflict) return null;

  const resolutionOptions: ResolutionOption[] = [
    {
      id: 'use_local',
      title: 'Use Your Changes',
      description: 'Keep the changes you made on this device',
      icon: <CheckCircle className="h-5 w-5 text-blue-500" />,
      action: 'Your changes will be saved and synced to other devices',
      className: 'border-blue-200 hover:border-blue-300'
    },
    {
      id: 'use_remote',
      title: 'Use Their Changes',
      description: 'Accept the changes from another device',
      icon: <RefreshCw className="h-5 w-5 text-green-500" />,
      action: 'Their changes will be applied here and on other devices',
      className: 'border-green-200 hover:border-green-300'
    },
    {
      id: 'merge',
      title: 'Merge Changes',
      description: 'Combine both sets of changes if possible',
      icon: <Eye className="h-5 w-5 text-purple-500" />,
      action: 'The system will try to merge changes automatically',
      className: 'border-purple-200 hover:border-purple-300'
    },
    {
      id: 'manual',
      title: 'Review Manually',
      description: 'See all changes and decide what to keep',
      icon: <AlertTriangle className="h-5 w-5 text-orange-500" />,
      action: 'You will be able to review all changes before deciding',
      className: 'border-orange-200 hover:border-orange-300'
    }
  ];

  const handleResolve = () => {
    if (!selectedResolution) return;

    const resolution = {
      action: selectedResolution,
      data: selectedResolution === 'use_local' ? conflict.localData :
             selectedResolution === 'use_remote' ? conflict.remoteData :
             selectedResolution === 'merge' ? mergeData(conflict.localData, conflict.remoteData) :
             conflict.localData,
      timestamp: new Date().toISOString()
    };

    onResolve(resolution);
    setSelectedResolution(null);
    setShowDataComparison(false);
  };

  const mergeData = (local: Record<string, any>, remote: Record<string, any>): Record<string, any> => {
    const merged = { ...local };

    for (const [key, value] of Object.entries(remote)) {
      if (key in merged) {
        // Simple merge strategy: prefer remote values with more recent timestamps
        if (value && typeof value === 'object' && 'updated_at' in value) {
          const remoteTime = new Date(value.updated_at).getTime();
          const localValue = merged[key];
          const localTime = localValue && typeof localValue === 'object' && 'updated_at' in localValue
            ? new Date(localValue.updated_at).getTime()
            : 0;

          if (remoteTime > localTime) {
            merged[key] = value;
          }
        } else {
          merged[key] = value;
        }
      } else {
        merged[key] = value;
      }
    }

    return merged;
  };

  const formatDataForDisplay = (data: Record<string, any>): string => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  const getConflictTypeDescription = (): string => {
    switch (conflict.entityType) {
      case 'booking':
        return 'Booking appointment details';
      case 'profile':
        return 'User profile information';
      case 'preferences':
        return 'User preferences and settings';
      default:
        return conflict.entityType;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6" />
            <div>
              <h2 className="text-xl font-semibold">Sync Conflict Detected</h2>
              <p className="text-orange-100 text-sm mt-1">
                Changes were made on multiple devices simultaneously
              </p>
            </div>
          </div>
        </div>

        {/* Conflict Details */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-gray-900">
                {getConflictTypeDescription()}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                ID: {conflict.entityId}
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              {new Date(conflict.timestamp).toLocaleString()}
            </div>
          </div>

          {/* Data Comparison Toggle */}
          <button
            onClick={() => setShowDataComparison(!showDataComparison)}
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
          >
            <Eye className="h-4 w-4" />
            {showDataComparison ? 'Hide' : 'Show'} Data Comparison
          </button>

          {/* Data Comparison */}
          {showDataComparison && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Your Changes</h4>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <pre className="text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap">
                    {formatDataForDisplay(conflict.localData)}
                  </pre>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Their Changes</h4>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <pre className="text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap">
                    {formatDataForDisplay(conflict.remoteData)}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Resolution Options */}
        <div className="p-6">
          <h4 className="font-semibold text-gray-900 mb-4">How would you like to resolve this?</h4>
          <div className="space-y-3">
            {resolutionOptions.map((option) => (
              <button
                key={option.id}
                onClick={() => setSelectedResolution(option.id)}
                className={cn(
                  'w-full p-4 rounded-lg border-2 text-left transition-all duration-200',
                  selectedResolution === option.id
                    ? 'border-blue-500 bg-blue-50'
                    : option.className || 'border-gray-200 hover:border-gray-300',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {option.icon}
                  </div>
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900">{option.title}</h5>
                    <p className="text-sm text-gray-600 mt-1">{option.description}</p>
                    <p className="text-xs text-gray-500 mt-2">{option.action}</p>
                  </div>
                  <div className="flex-shrink-0">
                    {selectedResolution === option.id && (
                      <CheckCircle className="h-5 w-5 text-blue-500" />
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleResolve}
            disabled={!selectedResolution}
            className={cn(
              'px-4 py-2 rounded-lg transition-colors',
              selectedResolution
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            )}
          >
            Resolve Conflict
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConflictResolutionDialog;