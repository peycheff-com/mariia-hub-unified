/**
 * Assistive Technology Hub
 *
 * Central component that integrates all assistive technology features
 * and provides a unified interface for accessibility management.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Settings,
  Mic,
  MicOff,
  Monitor,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Keyboard,
  Accessibility,
  Zap,
  Brain,
  Video,
  BookOpen,
  ChevronRight,
  Info,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  RotateCcw,
  Download,
  Upload,
  Save
} from 'lucide-react';

// Import our assistive technology hooks
import useVoiceControl from '@/lib/assistive-technology/voice-control';
import useSwitchNavigationControls from '@/lib/assistive-technology/switch-navigation';
import useBrailleSupport from '@/lib/assistive-technology/braille-support';
import useScreenMagnifier from '@/lib/assistive-technology/screen-magnifier';
import useVoiceAssistant from '@/lib/assistive-technology/voice-assistant-integration';
import useAIAltText from '@/lib/assistive-technology/ai-alt-text';
import useRealTimeCaptioning from '@/lib/assistive-technology/real-time-captioning';
import useScreenReaderControls from '@/lib/assistive-technology/screen-reader-optimizations';

interface AssistiveTechnologyHubProps {
  className?: string;
}

export const AssistiveTechnologyHub: React.FC<AssistiveTechnologyHubProps> = ({
  className = ''
}) => {
  // Initialize all assistive technology systems
  const voiceControl = useVoiceControl();
  const switchNavigation = useSwitchNavigationControls();
  const brailleSupport = useBrailleSupport();
  const screenMagnifier = useScreenMagnifier();
  const voiceAssistant = useVoiceAssistant();
  const aiAltText = useAIAltText();
  const realTimeCaptioning = useRealTimeCaptioningControls();
  const screenReader = useScreenReaderControls();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize all systems on mount
  useEffect(() => {
    const initializeSystems = async () => {
      try {
        await Promise.all([
          voiceControl.initialize(),
          switchNavigation.initialize(),
          brailleSupport.initialize(),
          screenMagnifier.initialize(),
          voiceAssistant.initialize(),
          aiAltText.initialize(),
          realTimeCaptioning.initialize(),
          screenReader.initialize()
        ]);

        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize assistive technology systems:', error);
      }
    };

    initializeSystems();
  }, []);

  // Calculate overall accessibility score
  const calculateAccessibilityScore = useCallback(() => {
    let score = 0;
    let total = 0;

    // Voice control availability
    total += 20;
    if (voiceControl.isSupported) score += 20;

    // Screen reader optimizations
    total += 20;
    if (screenReader.isActive) score += 20;

    // Alternative input methods
    total += 15;
    if (switchNavigation.isScanning || voiceControl.isEnabled) score += 15;

    // Visual accessibility
    total += 15;
    if (screenMagnifier.isMagnifierActive) score += 15;

    // AI features
    total += 15;
    if (aiAltText.config.enabled) score += 15;

    // Media accessibility
    total += 15;
    if (realTimeCaptioning.isCaptionsEnabled) score += 15;

    return Math.round((score / total) * 100);
  }, [
    voiceControl.isSupported,
    voiceControl.isEnabled,
    screenReader.isActive,
    switchNavigation.isScanning,
    screenMagnifier.isMagnifierActive,
    aiAltText.config.enabled,
    realTimeCaptioning.isCaptionsEnabled
  ]);

  const accessibilityScore = calculateAccessibilityScore();

  const getSystemStatus = (enabled: boolean, supported: boolean = true) => {
    if (!supported) return { color: 'bg-gray-500', text: 'Not Supported' };
    if (enabled) return { color: 'bg-green-500', text: 'Active' };
    return { color: 'bg-yellow-500', text: 'Available' };
  };

  return (
    <div className={`assistive-technology-hub ${className}`}>
      {/* Floating accessibility button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg"
        variant="default"
        size="icon"
        aria-label="Open assistive technology controls"
      >
        <Accessibility className="h-6 w-6" />
      </Button>

      {/* Main dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <Accessibility className="h-8 w-8" />
              Assistive Technology Hub
            </DialogTitle>
            <DialogDescription>
              Comprehensive accessibility features for mariia-hub platform
            </DialogDescription>
          </DialogHeader>

          {isInitialized ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="voice">Voice</TabsTrigger>
                <TabsTrigger value="visual">Visual</TabsTrigger>
                <TabsTrigger value="input">Input</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Voice Control */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Mic className="h-5 w-5" />
                        Voice Control
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getSystemStatus(voiceControl.isEnabled, voiceControl.isSupported).color}`} />
                        <span className="text-sm text-muted-foreground">
                          {getSystemStatus(voiceControl.isEnabled, voiceControl.isSupported).text}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground mb-3">
                        Control the platform with your voice
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={voiceControl.isEnabled ? "default" : "outline"}
                          onClick={voiceControl.toggleListening}
                          disabled={!voiceControl.isSupported}
                        >
                          {voiceControl.isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                        </Button>
                        <Badge variant="secondary">
                          {voiceControl.confidence > 0 ? `${Math.round(voiceControl.confidence * 100)}%` : 'N/A'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Screen Reader */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <BookOpen className="h-5 w-5" />
                        Screen Reader
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getSystemStatus(screenReader.isActive).color}`} />
                        <span className="text-sm text-muted-foreground">
                          {getSystemStatus(screenReader.isActive).text}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground mb-3">
                        Enhanced screen reader support
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={screenReader.isActive ? "default" : "outline"}
                          onClick={screenReader.toggleOptimizations}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Keyboard className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem onClick={() => screenReader.setVerbosity('minimal')}>
                              Minimal verbosity
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => screenReader.setVerbosity('standard')}>
                              Standard verbosity
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => screenReader.setVerbosity('detailed')}>
                              Detailed verbosity
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Screen Magnifier */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Eye className="h-5 w-5" />
                        Screen Magnifier
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getSystemStatus(screenMagnifier.isMagnifierActive).color}`} />
                        <span className="text-sm text-muted-foreground">
                          {getSystemStatus(screenMagnifier.isMagnifierActive).text}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground mb-3">
                        Magnify and zoom screen content
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={screenMagnifier.isMagnifierActive ? "default" : "outline"}
                          onClick={screenMagnifier.toggleMagnifier}
                        >
                          {screenMagnifier.isMagnifierActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                        <Button size="sm" variant="outline" onClick={screenMagnifier.zoomIn}>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* AI Alt Text */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Brain className="h-5 w-5" />
                        AI Alt Text
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getSystemStatus(aiAltText.config.enabled).color}`} />
                        <span className="text-sm text-muted-foreground">
                          {getSystemStatus(aiAltText.config.enabled).text}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground mb-3">
                        AI-powered image descriptions
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={aiAltText.generateForAllImages}
                          disabled={aiAltText.isProcessing}
                        >
                          {aiAltText.isProcessing ? <RotateCcw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                        </Button>
                        <Badge variant="secondary">
                          {aiAltText.getQualityMetrics().total} images
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Real-time Captioning */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Video className="h-5 w-5" />
                        Captioning
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getSystemStatus(realTimeCaptioning.isCaptionsEnabled).color}`} />
                        <span className="text-sm text-muted-foreground">
                          {getSystemStatus(realTimeCaptioning.isCaptionsEnabled).text}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground mb-3">
                        Real-time video captions
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={realTimeCaptioning.toggleCaptions}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Upload className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Switch Navigation */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Keyboard className="h-5 w-5" />
                        Switch Navigation
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getSystemStatus(switchNavigation.isScanning).color}`} />
                        <span className="text-sm text-muted-foreground">
                          {getSystemStatus(switchNavigation.isScanning).text}
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-sm text-muted-foreground mb-3">
                        Alternative input methods
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={switchNavigation.isScanning ? "default" : "outline"}
                          onClick={switchNavigation.toggleScanning}
                        >
                          {switchNavigation.isScanning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                        <Button size="sm" variant="outline">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Accessibility Score */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Accessibility className="h-6 w-6" />
                      Overall Accessibility Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-medium">Current Score</span>
                        <Badge variant={accessibilityScore >= 80 ? "default" : accessibilityScore >= 60 ? "secondary" : "destructive"}>
                          {accessibilityScore}%
                        </Badge>
                      </div>
                      <Progress value={accessibilityScore} className="h-3" />
                      <p className="text-sm text-muted-foreground">
                        {accessibilityScore >= 80
                          ? "Excellent! Your platform is highly accessible."
                          : accessibilityScore >= 60
                          ? "Good! Consider enabling more features for better accessibility."
                          : "Basic accessibility enabled. Enable more features to improve accessibility."}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                    <CardDescription>
                      Common accessibility tasks and adjustments
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Button variant="outline" size="sm" onClick={() => setActiveTab('voice')}>
                        <Mic className="h-4 w-4 mr-2" />
                        Voice Setup
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setActiveTab('visual')}>
                        <Eye className="h-4 w-4 mr-2" />
                        Visual Aids
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setActiveTab('input')}>
                        <Keyboard className="h-4 w-4 mr-2" />
                        Input Methods
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setActiveTab('advanced')}>
                        <Settings className="h-4 w-4 mr-2" />
                        Advanced
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Voice Tab */}
              <TabsContent value="voice" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Voice Control Settings</CardTitle>
                      <CardDescription>
                        Configure voice recognition and commands
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium" htmlFor="enable-voice-control">Enable Voice Control</label>
                        <Switch
                          checked={voiceControl.isEnabled}
                          onCheckedChange={(checked) => voiceControl.isEnabled ? voiceControl.stopListening() : voiceControl.startListening()}
                          disabled={!voiceControl.isSupported}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="language">Language</label>
                        <select
                          className="w-full p-2 border rounded"
                          value={voiceControl.language}
                          onChange={(e) => voiceControl.setLanguage(e.target.value)}
                        >
                          <option value="pl-PL">Polish</option>
                          <option value="en-US">English</option>
                          <option value="de-DE">German</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="current-status">Current Status</label>
                        <div className="flex items-center gap-2">
                          {voiceControl.isListening ? (
                            <>
                              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                              <span className="text-sm">Listening...</span>
                            </>
                          ) : (
                            <>
                              <div className="w-3 h-3 bg-gray-500 rounded-full" />
                              <span className="text-sm">Not listening</span>
                            </>
                          )}
                        </div>
                      </div>

                      {voiceControl.lastTranscript && (
                        <div className="space-y-2">
                          <label className="text-sm font-medium" htmlFor="last-transcript">Last Transcript</label>
                          <div className="p-3 bg-muted rounded text-sm">
                            "{voiceControl.lastTranscript}"
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          onClick={voiceControl.toggleListening}
                          disabled={!voiceControl.isSupported}
                          className="flex-1"
                        >
                          {voiceControl.isListening ? (
                            <>
                              <MicOff className="h-4 w-4 mr-2" />
                              Stop Listening
                            </>
                          ) : (
                            <>
                              <Mic className="h-4 w-4 mr-2" />
                              Start Listening
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Voice Assistant Integration</CardTitle>
                      <CardDescription>
                        Connect with Siri, Google Assistant, and other voice assistants
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium" htmlFor="enable-voice-assistant">Enable Voice Assistant</label>
                        <Switch
                          checked={voiceAssistant.isActive}
                          onCheckedChange={voiceAssistant.toggleAssistant}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="available-assistants">Available Assistants</label>
                        <div className="space-y-2">
                          {Object.entries(voiceAssistant.config.assistants).map(([assistant, enabled]) => (
                            <div key={assistant} className="flex items-center justify-between">
                              <span className="text-sm capitalize">{assistant}</span>
                              <Switch
                                checked={enabled}
                                onCheckedChange={(checked) =>
                                  voiceAssistant.updateConfiguration({
                                    assistants: { ...voiceAssistant.config.assistants, [assistant]: checked }
                                  })
                                }
                              />
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Info className="h-4 w-4 mr-2" />
                          Setup Guide
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Download className="h-4 w-4 mr-2" />
                          Export Commands
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Available Voice Commands</CardTitle>
                    <CardDescription>
                      Commands you can use with voice control
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {voiceControl.getAvailableCommands().map((command, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <h4 className="font-medium text-sm mb-1">{command.description}</h4>
                          <p className="text-xs text-muted-foreground">{command.phrases.slice(0, 2).join(', ')}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Visual Tab */}
              <TabsContent value="visual" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Screen Magnifier</CardTitle>
                      <CardDescription>
                        Magnify and zoom screen content for better visibility
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium" htmlFor="enable-magnifier">Enable Magnifier</label>
                        <Switch
                          checked={screenMagnifier.isMagnifierActive}
                          onCheckedChange={screenMagnifier.toggleMagnifier}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="zoom-level-screenmagnifier-currentzoom-x">Zoom Level: {screenMagnifier.currentZoom}x</label>
                        <Slider
                          value={[screenMagnifier.currentZoom]}
                          onValueChange={(value) => screenMagnifier.setZoomLevel(value[0])}
                          min={1}
                          max={5}
                          step={0.5}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="visual-enhancements">Visual Enhancements</label>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">High Contrast</span>
                            <Switch
                              checked={screenMagnifier.config.highContrast}
                              onCheckedChange={(checked) => screenMagnifier.toggleHighContrast()}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Large Text</span>
                            <Switch
                              checked={screenMagnifier.config.largeText}
                              onCheckedChange={(checked) => screenMagnifier.toggleLargeText()}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Color Inversion</span>
                            <Switch
                              checked={screenMagnifier.config.colorInversion}
                              onCheckedChange={(checked) => screenMagnifier.toggleColorInversion()}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={screenMagnifier.zoomIn}>
                          <ChevronRight className="h-4 w-4 mr-2" />
                          Zoom In
                        </Button>
                        <Button variant="outline" size="sm" onClick={screenMagnifier.zoomOut}>
                          <ChevronRight className="h-4 w-4 mr-2 rotate-180" />
                          Zoom Out
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => screenMagnifier.setZoomLevel(1)}>
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Reset
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>AI Alternative Text</CardTitle>
                      <CardDescription>
                        AI-powered image descriptions for accessibility
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium" htmlFor="auto-generate-alt-text">Auto-generate Alt Text</label>
                        <Switch
                          checked={aiAltText.config.enabled}
                          onCheckedChange={(checked) => aiAltText.updateConfiguration({ enabled: checked })}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="ai-provider">AI Provider</label>
                        <select
                          className="w-full p-2 border rounded"
                          value={aiAltText.config.aiProvider}
                          onChange={(e) => aiAltText.updateConfiguration({ aiProvider: e.target.value as any })}
                        >
                          <option value="openai">OpenAI</option>
                          <option value="google">Google Vision</option>
                          <option value="anthropic">Anthropic</option>
                          <option value="local">Local Model</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="quality-level">Quality Level</label>
                        <select
                          className="w-full p-2 border rounded"
                          value={aiAltText.config.quality}
                          onChange={(e) => aiAltText.updateConfiguration({ quality: e.target.value as any })}
                        >
                          <option value="basic">Basic</option>
                          <option value="detailed">Detailed</option>
                          <option value="comprehensive">Comprehensive</option>
                        </select>
                      </div>

                      <div className="p-3 bg-muted rounded">
                        <div className="text-sm font-medium mb-2">Generation Statistics</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>Total: {aiAltText.getQualityMetrics().total}</div>
                          <div>Approved: {aiAltText.getQualityMetrics().approved}</div>
                          <div>Pending: {aiAltText.getQualityMetrics().pending}</div>
                          <div>Avg Quality: {Math.round(aiAltText.getQualityMetrics().avgQualityScore * 100)}%</div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={aiAltText.generateForAllImages}
                          disabled={aiAltText.isProcessing}
                          className="flex-1"
                        >
                          {aiAltText.isProcessing ? (
                            <>
                              <RotateCcw className="h-4 w-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Zap className="h-4 w-4 mr-2" />
                              Generate All
                            </>
                          )}
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Export
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Real-time Captioning</CardTitle>
                    <CardDescription>
                      Automatic captions for video and audio content
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium" htmlFor="enable-captioning">Enable Captioning</label>
                      <Switch
                        checked={realTimeCaptioning.isCaptionsEnabled}
                        onCheckedChange={realTimeCaptioning.toggleCaptions}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="display-mode">Display Mode</label>
                        <select
                          className="w-full p-2 border rounded"
                          value={realTimeCaptioning.config.displayMode}
                          onChange={(e) => realTimeCaptioning.updateConfiguration({ displayMode: e.target.value as any })}
                        >
                          <option value="overlay">Overlay</option>
                          <option value="below">Below Video</option>
                          <option value="side">Side Panel</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="font-size">Font Size</label>
                        <input
                          type="number"
                          className="w-full p-2 border rounded"
                          value={realTimeCaptioning.config.fontSize}
                          onChange={(e) => realTimeCaptioning.updateConfiguration({ fontSize: parseInt(e.target.value) })}
                          min="12"
                          max="32"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="max-lines">Max Lines</label>
                        <input
                          type="number"
                          className="w-full p-2 border rounded"
                          value={realTimeCaptioning.config.maxLines}
                          onChange={(e) => realTimeCaptioning.updateConfiguration({ maxLines: parseInt(e.target.value) })}
                          min="1"
                          max="5"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Caption File
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export Captions
                      </Button>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-2" />
                        Advanced Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Input Tab */}
              <TabsContent value="input" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Switch Navigation</CardTitle>
                      <CardDescription>
                        Navigate using switches or alternative input devices
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-medium" htmlFor="enable-switch-navigation">Enable Switch Navigation</label>
                        <Switch
                          checked={switchNavigation.isScanning}
                          onCheckedChange={switchNavigation.toggleScanning}
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="scan-speed-switchnavigation-config-scanspeed-ms">Scan Speed: {switchNavigation.config.scanSpeed}ms</label>
                        <Slider
                          value={[switchNavigation.config.scanSpeed]}
                          onValueChange={(value) => switchNavigation.updateScanSpeed(value[0])}
                          min={200}
                          max={2000}
                          step={100}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="dwell-time-switchnavigation-config-dwelltime-ms">Dwell Time: {switchNavigation.config.dwellTime}ms</label>
                        <Slider
                          value={[switchNavigation.config.dwellTime]}
                          onValueChange={(value) => switchNavigation.updateDwellTime(value[0])}
                          min={500}
                          max={3000}
                          step={100}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium" htmlFor="audio-feedback">Audio Feedback</label>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Scan Sounds</span>
                            <Switch
                              checked={switchNavigation.config.sounds.scan}
                              onCheckedChange={(checked) => switchNavigation.toggleSounds('scan')}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm">Select Sounds</span>
                            <Switch
                              checked={switchNavigation.config.sounds.select}
                              onCheckedChange={(checked) => switchNavigation.toggleSounds('select')}
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant={switchNavigation.isScanning ? "default" : "outline"}
                          size="sm"
                          onClick={switchNavigation.toggleScanning}
                          className="flex-1"
                        >
                          {switchNavigation.isScanning ? (
                            <>
                              <Pause className="h-4 w-4 mr-2" />
                              Stop Scanning
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Start Scanning
                            </>
                          )}
                        </Button>
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4 mr-2" />
                          Calibrate
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Keyboard Navigation</CardTitle>
                      <CardDescription>
                        Enhanced keyboard navigation and shortcuts
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 border rounded">
                          <div className="flex-shrink-0">
                            <kbd className="px-2 py-1 text-xs bg-muted rounded">Alt + L</kbd>
                          </div>
                          <div className="text-sm">
                            <div className="font-medium">Landmark Navigation</div>
                            <div className="text-muted-foreground">Jump to page landmarks</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 border rounded">
                          <div className="flex-shrink-0">
                            <kbd className="px-2 py-1 text-xs bg-muted rounded">Alt + H</kbd>
                          </div>
                          <div className="text-sm">
                            <div className="font-medium">Headings Navigation</div>
                            <div className="text-muted-foreground">Browse page headings</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 border rounded">
                          <div className="flex-shrink-0">
                            <kbd className="px-2 py-1 text-xs bg-muted rounded">Alt + M</kbd>
                          </div>
                          <div className="text-sm">
                            <div className="font-medium">Screen Magnifier</div>
                            <div className="text-muted-foreground">Toggle magnification</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 p-3 border rounded">
                          <div className="flex-shrink-0">
                            <kbd className="px-2 py-1 text-xs bg-muted rounded">Ctrl + Shift + C</kbd>
                          </div>
                          <div className="text-sm">
                            <div className="font-medium">Toggle Captions</div>
                            <div className="text-muted-foreground">Enable/disable captions</div>
                          </div>
                        </div>
                      </div>

                      <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                        <div className="flex items-start gap-2">
                          <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                          <div className="text-sm text-blue-800">
                            Press <kbd className="px-1 py-0.5 bg-blue-100 rounded text-xs">Tab</kbd> to navigate,
                            <kbd className="px-1 py-0.5 bg-blue-100 rounded text-xs">Enter</kbd> or
                            <kbd className="px-1 py-0.5 bg-blue-100 rounded text-xs">Space</kbd> to activate,
                            <kbd className="px-1 py-0.5 bg-blue-100 rounded text-xs">Escape</kbd> to cancel
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Advanced Tab */}
              <TabsContent value="advanced" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Advanced Settings</CardTitle>
                    <CardDescription>
                      Fine-tune accessibility features and export configurations
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Performance Settings</h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium" htmlFor="reduce-animations">Reduce Animations</label>
                            <Switch />
                          </div>
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium" htmlFor="high-performance-mode">High Performance Mode</label>
                            <Switch />
                          </div>
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium" htmlFor="prefetch-content">Prefetch Content</label>
                            <Switch />
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-lg font-medium">Data & Privacy</h3>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium" htmlFor="share-usage-data">Share Usage Data</label>
                            <Switch />
                          </div>
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium" htmlFor="store-voice-data">Store Voice Data</label>
                            <Switch />
                          </div>
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-medium" htmlFor="auto-save-preferences">Auto-save Preferences</label>
                            <Switch defaultChecked />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Export & Import</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4 mr-2" />
                          Export Settings
                        </Button>
                        <Button variant="outline" size="sm">
                          <Upload className="h-4 w-4 mr-2" />
                          Import Settings
                        </Button>
                        <Button variant="outline" size="sm">
                          <Save className="h-4 w-4 mr-2" />
                          Save Profile
                        </Button>
                        <Button variant="outline" size="sm">
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Reset All
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium">Diagnostics</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-green-600">{accessibilityScore}%</div>
                            <div className="text-sm text-muted-foreground">Accessibility Score</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-blue-600">
                              {voiceControl.isSupported ? 'Yes' : 'No'}
                            </div>
                            <div className="text-sm text-muted-foreground">Voice Recognition</div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="pt-6">
                            <div className="text-2xl font-bold text-purple-600">
                              {aiAltText.getQualityMetrics().total}
                            </div>
                            <div className="text-sm text-muted-foreground">Images Processed</div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>

                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Some advanced features may require additional setup or third-party services.
                        Check the setup guides for detailed instructions.
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-4">
                <div className="animate-spin">
                  <Settings className="h-12 w-12 mx-auto text-muted-foreground" />
                </div>
                <div className="text-lg font-medium">Initializing Assistive Technology</div>
                <div className="text-sm text-muted-foreground">
                  Setting up accessibility features for you...
                </div>
                <Progress value={75} className="w-64 mx-auto" />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssistiveTechnologyHub;