import React, { useState, useEffect } from 'react';
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Info,
  Download,
  Play,
  Square,
  Eye,
  EyeOff,
  Settings,
  BarChart3,
  FileText,
  Zap
} from 'lucide-react';
import { useAccessibilityTesting } from '@/hooks/useAccessibilityTesting';
import { useAccessibility } from '@/contexts/AccessibilityContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AccessibilityDashboardProps {
  className?: string;
}

export const AccessibilityDashboard: React.FC<AccessibilityDashboardProps> = ({ className }) => {
  const {
    isTesting,
    results,
    realTimeMonitoring,
    runAccessibilityTest,
    startRealTimeMonitoring,
    stopRealTimeMonitoring,
    generateReport,
    exportResults
  } = useAccessibilityTesting();

  const { preferences, toggleHighContrast, toggleReducedMotion, toggleLargeText } = useAccessibility();
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'issues' | 'settings'>('overview');

  useEffect(() => {
    // Run initial test when component mounts
    runAccessibilityTest();
  }, [runAccessibilityTest]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 50) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBackground = (score: number) => {
    if (score >= 90) return 'bg-green-100';
    if (score >= 70) return 'bg-yellow-100';
    if (score >= 50) return 'bg-orange-100';
    return 'bg-red-100';
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'medium':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'low':
        return <Info className="w-4 h-4 text-blue-600" />;
      default:
        return <Info className="w-4 h-4 text-gray-600" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'aria':
        return <FileText className="w-4 h-4" />;
      case 'contrast':
        return <Eye className="w-4 h-4" />;
      case 'keyboard':
        return <Settings className="w-4 h-4" />;
      case 'semantic':
        return <BarChart3 className="w-4 h-4" />;
      case 'focus':
        return <Zap className="w-4 h-4" />;
      default:
        return <Info className="w-4 h-4" />;
    }
  };

  return (
    <div
      className={`fixed bottom-4 left-4 z-50 transition-all duration-300 ${
        isExpanded ? 'w-96 max-h-[80vh]' : 'w-auto'
      } ${className}`}
    >
      {/* Toggle Button */}
      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 p-3 rounded-xl bg-champagne-100 hover:bg-champagne-200 text-champagne-900 border-2 border-champagne-300 transition-all duration-300"
        aria-expanded={isExpanded}
        aria-label="Accessibility dashboard"
      >
        <div className="relative">
          <BarChart3 className="w-5 h-5" />
          {results && results.score < 90 && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
          )}
        </div>
        <span className="font-medium text-sm">A11y</span>
        {results && (
          <Badge
            variant="secondary"
            className={`text-xs px-1.5 py-0.5 ${getScoreBackground(results.score)}`}
          >
            {results.score}
          </Badge>
        )}
      </Button>

      {/* Expanded Dashboard */}
      {isExpanded && (
        <Card className="mt-2 p-4 bg-white border-2 border-champagne-200 shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-champagne-900">
              Accessibility Dashboard
            </h3>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => realTimeMonitoring ? stopRealTimeMonitoring() : startRealTimeMonitoring()}
                className={realTimeMonitoring ? 'text-red-600 border-red-300' : 'text-green-600 border-green-300'}
              >
                {realTimeMonitoring ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span className="ml-1 text-xs">
                  {realTimeMonitoring ? 'Stop' : 'Monitor'}
                </span>
              </Button>
              <Button
                size="sm"
                onClick={runAccessibilityTest}
                disabled={isTesting}
                className="text-champagne-600 border-champagne-300"
              >
                {isTesting ? 'Testing...' : 'Test'}
              </Button>
            </div>
          </div>

          {/* Score Overview */}
          {results && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Accessibility Score</span>
                <span className={`text-2xl font-bold ${getScoreColor(results.score)}`}>
                  {results.score}/100
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    results.score >= 90 ? 'bg-green-500' :
                    results.score >= 70 ? 'bg-yellow-500' :
                    results.score >= 50 ? 'bg-orange-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${results.score}%` }}
                />
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 mb-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('overview')}
              className={`pb-2 px-1 text-sm font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'text-champagne-600 border-b-2 border-champagne-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('issues')}
              className={`pb-2 px-1 text-sm font-medium transition-colors ${
                activeTab === 'issues'
                  ? 'text-champagne-600 border-b-2 border-champagne-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Issues {results && results.issues.length > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs">
                  {results.issues.length}
                </Badge>
              )}
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`pb-2 px-1 text-sm font-medium transition-colors ${
                activeTab === 'settings'
                  ? 'text-champagne-600 border-b-2 border-champagne-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Settings
            </button>
          </div>

          {/* Tab Content */}
          <div className="max-h-64 overflow-y-auto">
            {activeTab === 'overview' && results && (
              <div className="space-y-3">
                {/* Issues Summary */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <XCircle className="w-3 h-3 text-red-600" />
                    <span>Critical: {results.issues.filter(i => i.severity === 'critical').length}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-orange-600" />
                    <span>High: {results.issues.filter(i => i.severity === 'high').length}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-yellow-600" />
                    <span>Medium: {results.issues.filter(i => i.severity === 'medium').length}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Info className="w-3 h-3 text-blue-600" />
                    <span>Low: {results.issues.filter(i => i.severity === 'low').length}</span>
                  </div>
                </div>

                {/* Test Results */}
                <div className="space-y-2">
                  <div className="text-sm font-medium text-gray-700">Test Results</div>
                  {results.passedTests.map((test) => (
                    <div key={test} className="flex items-center gap-2 text-xs">
                      <CheckCircle className="w-3 h-3 text-green-600" />
                      <span>{test}</span>
                    </div>
                  ))}
                  {results.failedTests.map((test) => (
                    <div key={test} className="flex items-center gap-2 text-xs">
                      <XCircle className="w-3 h-3 text-red-600" />
                      <span>{test}</span>
                    </div>
                  ))}
                </div>

                {/* Recommendations */}
                {results.recommendations.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-gray-700">Recommendations</div>
                    {results.recommendations.map((rec, index) => (
                      <div key={index} className="text-xs text-gray-600 flex items-start gap-1">
                        <span className="text-champagne-600 mt-0.5">•</span>
                        <span>{rec}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Export Button */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={exportResults}
                  className="w-full text-xs"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Export Report
                </Button>
              </div>
            )}

            {activeTab === 'issues' && results && (
              <div className="space-y-2">
                {results.issues.length === 0 ? (
                  <div className="text-center py-4 text-sm text-green-600">
                    <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                    <div>No accessibility issues found!</div>
                  </div>
                ) : (
                  results.issues.map((issue, index) => (
                    <div
                      key={index}
                      className="p-2 bg-gray-50 rounded-lg text-xs border border-gray-200"
                    >
                      <div className="flex items-start gap-2">
                        {getSeverityIcon(issue.severity)}
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{issue.message}</div>
                          <div className="flex items-center gap-2 mt-1 text-gray-600">
                            {getCategoryIcon(issue.category)}
                            <span className="capitalize">{issue.category}</span>
                            <Badge
                              variant="secondary"
                              className={`text-xs ${
                                issue.severity === 'critical' ? 'bg-red-100 text-red-800' :
                                issue.severity === 'high' ? 'bg-orange-100 text-orange-800' :
                                issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {issue.severity}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-3">
                <div className="text-sm font-medium text-gray-700 mb-2">Quick Settings</div>

                <div className="space-y-2">
                  <button
                    onClick={toggleHighContrast}
                    className="w-full flex items-center justify-between p-2 bg-gray-50 rounded-lg text-xs hover:bg-gray-100 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      {preferences.highContrast ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      High Contrast
                    </span>
                    <div className={`w-8 h-4 rounded-full transition-colors ${
                      preferences.highContrast ? 'bg-champagne-500' : 'bg-gray-300'
                    }`}>
                      <div className={`w-3 h-3 bg-white rounded-full transition-transform ${
                        preferences.highContrast ? 'translate-x-4' : 'translate-x-0.5'
                      }`} />
                    </div>
                  </button>

                  <button
                    onClick={toggleReducedMotion}
                    className="w-full flex items-center justify-between p-2 bg-gray-50 rounded-lg text-xs hover:bg-gray-100 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Zap className="w-3 h-3" />
                      Reduced Motion
                    </span>
                    <div className={`w-8 h-4 rounded-full transition-colors ${
                      preferences.reducedMotion ? 'bg-champagne-500' : 'bg-gray-300'
                    }`}>
                      <div className={`w-3 h-3 bg-white rounded-full transition-transform ${
                        preferences.reducedMotion ? 'translate-x-4' : 'translate-x-0.5'
                      }`} />
                    </div>
                  </button>

                  <button
                    onClick={toggleLargeText}
                    className="w-full flex items-center justify-between p-2 bg-gray-50 rounded-lg text-xs hover:bg-gray-100 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="w-3 h-3" />
                      Large Text
                    </span>
                    <div className={`w-8 h-4 rounded-full transition-colors ${
                      preferences.largeText ? 'bg-champagne-500' : 'bg-gray-300'
                    }`}>
                      <div className={`w-3 h-3 bg-white rounded-full transition-transform ${
                        preferences.largeText ? 'translate-x-4' : 'translate-x-0.5'
                      }`} />
                    </div>
                  </button>
                </div>

                <div className="pt-2 border-t border-gray-200 text-xs text-gray-600">
                  Real-time monitoring: {realTimeMonitoring ? 'Active' : 'Inactive'}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
};

export default AccessibilityDashboard;