import React, { useState, useEffect } from 'react';
import { useCrossPlatform } from '@/contexts/CrossPlatformContext';
import { crossPlatformSyncService } from '@/services/cross-platform-sync.service';
import {
  CloudDownload,
  CloudUpload,
  Calendar,
  Shield,
  Trash2,
  Download,
  Smartphone,
  CheckCircle,
  AlertCircle,
  Clock,
  RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BackupRecord {
  id: string;
  backup_version: string;
  created_at: string;
  device_source?: string;
  size?: number;
  is_restorable: boolean;
  expires_at: string;
}

interface BackupManagerProps {
  className?: string;
  showAdvanced?: boolean;
}

export const BackupManager: React.FC<BackupManagerProps> = ({
  className,
  showAdvanced = false
}) => {
  const {
    currentDevice,
    createBackup,
    restoreBackup
  } = useCrossPlatform();

  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupRecord | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_preferences_backup')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_restorable', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to load backups:', error);
        showMessage('error', 'Failed to load backups');
        return;
      }

      setBackups(data || []);
    } catch (error) {
      console.error('Error loading backups:', error);
      showMessage('error', 'Error loading backups');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const backupVersion = `backup_${new Date().toISOString().replace(/[:.]/g, '-')}`;
      const backupId = await createBackup(backupVersion);

      if (backupId) {
        showMessage('success', 'Backup created successfully');
        await loadBackups(); // Reload backups
      } else {
        showMessage('error', 'Failed to create backup');
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      showMessage('error', 'Error creating backup');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleRestoreBackup = async (backup: BackupRecord) => {
    setSelectedBackup(backup);
    setShowRestoreConfirm(true);
  };

  const confirmRestoreBackup = async () => {
    if (!selectedBackup) return;

    setIsRestoringBackup(true);
    try {
      const success = await restoreBackup(selectedBackup.id);

      if (success) {
        showMessage('success', 'Backup restored successfully. Your preferences have been updated.');
        await loadBackups();
      } else {
        showMessage('error', 'Failed to restore backup');
      }
    } catch (error) {
      console.error('Error restoring backup:', error);
      showMessage('error', 'Error restoring backup');
    } finally {
      setIsRestoringBackup(false);
      setShowRestoreConfirm(false);
      setSelectedBackup(null);
    }
  };

  const handleDeleteBackup = async (backupId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_preferences_backup')
        .update({ is_restorable: false })
        .eq('id', backupId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Failed to delete backup:', error);
        showMessage('error', 'Failed to delete backup');
        return;
      }

      showMessage('success', 'Backup deleted successfully');
      await loadBackups();
    } catch (error) {
      console.error('Error deleting backup:', error);
      showMessage('error', 'Error deleting backup');
    }
  };

  const handleExportBackup = async (backup: BackupRecord) => {
    try {
      const { data, error } = await supabase
        .from('user_preferences_backup')
        .select('backup_data')
        .eq('id', backup.id)
        .single();

      if (error || !data) {
        showMessage('error', 'Failed to export backup');
        return;
      }

      // Create download link
      const blob = new Blob([JSON.stringify(data.backup_data, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_${backup.backup_version}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showMessage('success', 'Backup exported successfully');
    } catch (error) {
      console.error('Error exporting backup:', error);
      showMessage('error', 'Error exporting backup');
    }
  };

  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const getBackupSize = (backup: BackupRecord): string => {
    if (backup.size) {
      return `${(backup.size / 1024).toFixed(1)} KB`;
    }
    return 'Unknown';
  };

  const getDeviceName = (deviceId?: string): string => {
    if (!deviceId) return 'Unknown Device';
    if (deviceId === currentDevice?.id) return 'This Device';
    return `Device ${deviceId.slice(0, 8)}...`;
  };

  const getDaysUntilExpiry = (expiresAt: string): number => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className={cn('bg-white rounded-lg shadow-lg border border-gray-200', className)}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CloudDownload className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Backup & Restore</h2>
              <p className="text-sm text-gray-600 mt-1">
                Manage your cloud backups for device migration and data recovery
              </p>
            </div>
          </div>
          <button
            onClick={handleCreateBackup}
            disabled={isCreatingBackup}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreatingBackup ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <CloudUpload className="h-4 w-4" />
                Create Backup
              </>
            )}
          </button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={cn(
          'mx-6 mt-4 p-3 rounded-lg flex items-center gap-2',
          message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
          message.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
          'bg-blue-50 text-blue-800 border border-blue-200'
        )}>
          {message.type === 'success' && <CheckCircle className="h-4 w-4" />}
          {message.type === 'error' && <AlertCircle className="h-4 w-4" />}
          {message.type === 'info' && <Clock className="h-4 w-4" />}
          <span className="text-sm">{message.text}</span>
        </div>
      )}

      {/* Backup List */}
      <div className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Available Backups</h3>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Loading backups...</span>
          </div>
        ) : backups.length === 0 ? (
          <div className="text-center py-8">
            <CloudDownload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No backups available</p>
            <p className="text-sm text-gray-500 mt-1">
              Create your first backup to secure your data
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {backups.map((backup) => (
              <div
                key={backup.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Shield className="h-5 w-5 text-green-500" />
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {backup.backup_version}
                        </h4>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(backup.created_at).toLocaleDateString()}
                          </div>
                          <div className="flex items-center gap-1">
                            <Smartphone className="h-3 w-3" />
                            {getDeviceName(backup.device_source)}
                          </div>
                          <div className="flex items-center gap-1">
                            <CloudDownload className="h-3 w-3" />
                            {getBackupSize(backup)}
                          </div>
                          {getDaysUntilExpiry(backup.expires_at) <= 30 && (
                            <div className="flex items-center gap-1 text-orange-600">
                              <Clock className="h-3 w-3" />
                              Expires in {getDaysUntilExpiry(backup.expires_at)} days
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {showAdvanced && (
                      <button
                        onClick={() => handleExportBackup(backup)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Export backup"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleRestoreBackup(backup)}
                      disabled={isRestoringBackup}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Restore
                    </button>
                    <button
                      onClick={() => handleDeleteBackup(backup.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete backup"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Advanced Settings */}
      {showAdvanced && (
        <div className="p-6 border-t border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-4">Advanced Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Auto-Backup</h4>
                <p className="text-sm text-gray-600">Automatically create backups weekly</p>
              </div>
              <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-gray-200">
                <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-1" />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Backup Retention</h4>
                <p className="text-sm text-gray-600">Keep backups for 1 year</p>
              </div>
              <select className="px-3 py-1 border border-gray-300 rounded-lg text-sm">
                <option>1 month</option>
                <option>3 months</option>
                <option selected>1 year</option>
                <option>Forever</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Restore Confirmation Dialog */}
      {showRestoreConfirm && selectedBackup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-6 w-6 text-orange-500" />
              <h3 className="text-lg font-semibold">Confirm Restore</h3>
            </div>

            <p className="text-gray-600 mb-4">
              Are you sure you want to restore from backup "{selectedBackup.backup_version}"?
              This will replace your current preferences and settings.
            </p>

            <div className="bg-gray-50 rounded-lg p-3 mb-6">
              <div className="text-sm text-gray-600 space-y-1">
                <div>Created: {new Date(selectedBackup.created_at).toLocaleString()}</div>
                <div>Source: {getDeviceName(selectedBackup.device_source)}</div>
                <div>Size: {getBackupSize(selectedBackup)}</div>
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRestoreConfirm(false);
                  setSelectedBackup(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmRestoreBackup}
                disabled={isRestoringBackup}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50"
              >
                {isRestoringBackup ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin inline mr-2" />
                    Restoring...
                  </>
                ) : (
                  'Restore Backup'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackupManager;