// Luxury Feedback Widget
// Premium feedback collection component with luxury branding

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import {
  Heart,
  Star,
  MessageSquare,
  Sparkles,
  Diamond,
  Crown,
  Award,
  Send,
  X,
  ChevronRight
} from 'lucide-react';

import FeedbackSurvey from './FeedbackSurvey';
import type { SubmissionSource } from '@/types/feedback';

interface LuxuryFeedbackWidgetProps {
  clientId: string;
  bookingId?: string;
  serviceId?: string;
  staffId?: string;
  triggerType?: 'button' | 'floating' | 'inline' | 'automatic';
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  autoTrigger?: boolean;
  autoTriggerDelay?: number; // seconds
  luxuryMode?: boolean;
  showOnInit?: boolean;
  source?: SubmissionSource;
  onComplete?: (submissionId: string) => void;
  onClose?: () => void;
}

const LuxuryFeedbackWidget: React.FC<LuxuryFeedbackWidgetProps> = ({
  clientId,
  bookingId,
  serviceId,
  staffId,
  triggerType = 'floating',
  position = 'bottom-right',
  autoTrigger = false,
  autoTriggerDelay = 30,
  luxuryMode = true,
  showOnInit = false,
  source = 'in_app',
  onComplete,
  onClose
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showWidget, setShowWidget] = useState(showOnInit);
  const [isMobile, setIsMobile] = useState(false);
  const [autoTriggered, setAutoTriggered] = useState(false);

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-trigger logic
  useEffect(() => {
    if (autoTrigger && !autoTriggered && !isOpen) {
      const timer = setTimeout(() => {
        setShowWidget(true);
        setIsOpen(true);
        setAutoTriggered(true);
      }, autoTriggerDelay * 1000);

      return () => clearTimeout(timer);
    }
  }, [autoTrigger, autoTriggerDelay, autoTriggered, isOpen]);

  // Get position styles
  const getPositionStyles = () => {
    if (triggerType !== 'floating') return {};

    const baseStyles = {
      position: 'fixed' as const,
      zIndex: 50
    };

    switch (position) {
      case 'bottom-right':
        return { ...baseStyles, bottom: 24, right: 24 };
      case 'bottom-left':
        return { ...baseStyles, bottom: 24, left: 24 };
      case 'top-right':
        return { ...baseStyles, top: 24, right: 24 };
      case 'top-left':
        return { ...baseStyles, top: 24, left: 24 };
      default:
        return baseStyles;
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  const handleComplete = (submissionId: string) => {
    setIsOpen(false);
    onComplete?.(submissionId);
  };

  const FloatingTriggerButton = () => (
    <Button
      onClick={() => setIsOpen(true)}
      className={`rounded-full shadow-lg transition-all duration-300 hover:scale-110 ${
        luxuryMode
          ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white border-2 border-amber-300'
          : 'bg-blue-600 hover:bg-blue-700 text-white'
      } ${triggerType === 'floating' ? 'w-14 h-14' : 'w-auto h-auto px-4 py-2'}`}
    >
      {triggerType === 'floating' ? (
        <div className="relative">
          <Heart className="h-6 w-6" />
          {autoTriggered && (
            <Sparkles className="absolute -top-2 -right-2 h-4 w-4 text-yellow-300 animate-pulse" />
          )}
        </div>
      ) : (
        <div className="flex items-center space-x-2">
          {luxuryMode ? <Crown className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
          <span>Share Your Experience</span>
          {luxuryMode && <Diamond className="h-4 w-4" />}
        </div>
      )}
    </Button>
  );

  const InlineTrigger = () => (
    <Card className={`border-2 ${
      luxuryMode
        ? 'border-amber-300 bg-gradient-to-r from-amber-50 to-orange-50'
        : 'border-blue-200 bg-blue-50'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {luxuryMode ? (
              <div className="flex items-center space-x-2">
                <Crown className="h-5 w-5 text-amber-600" />
                <Diamond className="h-4 w-4 text-amber-500" />
              </div>
            ) : (
              <Star className="h-5 w-5 text-blue-600" />
            )}
            <div>
              <h3 className={`font-semibold ${
                luxuryMode ? 'text-amber-900' : 'text-gray-900'
              }`}>
                How was your experience?
              </h3>
              <p className={`text-sm ${
                luxuryMode ? 'text-amber-700' : 'text-gray-600'
              }`}>
                Your feedback helps us provide exceptional service
              </p>
            </div>
          </div>
          <Button
            onClick={() => setIsOpen(true)}
            className={luxuryMode
              ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700'
              : 'bg-blue-600 hover:bg-blue-700'
            }
          >
            Share Feedback
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const AutoTriggerOverlay = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className={`w-full max-w-md mx-4 border-2 ${
        luxuryMode
          ? 'border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50'
          : 'border-blue-200 bg-white'
      }`}>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            {luxuryMode ? (
              <div className="flex justify-center space-x-2">
                <Crown className="h-8 w-8 text-amber-600" />
                <Diamond className="h-6 w-6 text-amber-500" />
                <Crown className="h-8 w-8 text-amber-600" />
              </div>
            ) : (
              <Star className="h-8 w-8 text-blue-600 mx-auto" />
            )}

            <div>
              <h3 className={`text-lg font-semibold mb-2 ${
                luxuryMode ? 'text-amber-900' : 'text-gray-900'
              }`}>
                {luxuryMode ? 'Your Luxury Experience Matters' : 'How was your experience?'}
              </h3>
              <p className={`text-sm ${
                luxuryMode ? 'text-amber-700' : 'text-gray-600'
              }`}>
                {luxuryMode
                  ? 'As a valued client, your insights help us elevate our service excellence.'
                  : 'We\'d love to hear about your experience to improve our service.'
                }
              </p>
            </div>

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setShowWidget(false)}
                className={luxuryMode
                  ? 'border-amber-300 text-amber-700 hover:bg-amber-50'
                  : ''
                }
              >
                Maybe Later
              </Button>
              <Button
                onClick={() => setIsOpen(true)}
                className={luxuryMode
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700'
                  : 'bg-blue-600 hover:bg-blue-700'
                }
              >
                Share Feedback
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const SurveyContent = () => (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        {luxuryMode && (
          <div className="flex justify-center space-x-2">
            <Award className="h-6 w-6 text-amber-600" />
            <Heart className="h-6 w-6 text-amber-500" />
            <Award className="h-6 w-6 text-amber-600" />
          </div>
        )}
        <h2 className={`text-xl font-semibold ${
          luxuryMode ? 'text-amber-900' : 'text-gray-900'
        }`}>
          {luxuryMode ? 'Share Your Luxury Experience' : 'Share Your Feedback'}
        </h2>
        <p className={`text-sm ${
          luxuryMode ? 'text-amber-700' : 'text-gray-600'
        }`}>
          Your insights help us provide exceptional service
        </p>
      </div>

      <FeedbackSurvey
        clientId={clientId}
        bookingId={bookingId}
        serviceId={serviceId}
        staffId={staffId}
        source={source}
        luxuryBranding={luxuryMode}
        onComplete={handleComplete}
        onCancel={handleClose}
      />
    </div>
  );

  // Auto-trigger overlay
  if (autoTrigger && showWidget && !isOpen && autoTriggered) {
    return <AutoTriggerOverlay />;
  }

  // Mobile drawer
  if (isMobile) {
    return (
      <>
        {triggerType === 'inline' ? (
          <InlineTrigger />
        ) : triggerType === 'floating' ? (
          <div style={getPositionStyles()}>
            <FloatingTriggerButton />
          </div>
        ) : (
          <div className="w-full">
            <FloatingTriggerButton />
          </div>
        )}

        <Drawer open={isOpen} onOpenChange={setIsOpen}>
          <DrawerTrigger asChild>
            <div />
          </DrawerTrigger>
          <DrawerContent className={`max-h-[90vh] ${
            luxuryMode ? 'bg-gradient-to-b from-amber-50 to-orange-50' : ''
          }`}>
            <DrawerHeader>
              <div className="flex items-center justify-between">
                <DrawerTitle className={luxuryMode ? 'text-amber-900' : ''}>
                  {luxuryMode ? 'Luxury Feedback' : 'Feedback'}
                </DrawerTitle>
                <DrawerClose asChild>
                  <Button variant="ghost" size="sm">
                    <X className="h-4 w-4" />
                  </Button>
                </DrawerClose>
              </div>
              <DrawerDescription className={luxuryMode ? 'text-amber-700' : ''}>
                {luxuryMode
                  ? 'Your experience as a valued client matters to us.'
                  : 'We appreciate your feedback.'
                }
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-4 overflow-y-auto">
              <SurveyContent />
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  // Desktop dialog
  return (
    <>
      {triggerType === 'inline' ? (
        <InlineTrigger />
      ) : triggerType === 'floating' ? (
        <div style={getPositionStyles()}>
          <FloatingTriggerButton />
        </div>
      ) : (
        <div className="w-full">
          <FloatingTriggerButton />
        </div>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className={`max-w-2xl max-h-[90vh] overflow-y-auto ${
          luxuryMode ? 'border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50' : ''
        }`}>
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {luxuryMode && <Crown className="h-5 w-5 text-amber-600" />}
                <DialogTitle className={luxuryMode ? 'text-amber-900' : ''}>
                  {luxuryMode ? 'Luxury Experience Feedback' : 'Share Your Feedback'}
                </DialogTitle>
              </div>
              <Button variant="ghost" size="sm" onClick={handleClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogDescription className={luxuryMode ? 'text-amber-700' : ''}>
              {luxuryMode
                ? 'As a valued client, your insights help us continually enhance our luxury service experience.'
                : 'Your feedback helps us improve our service quality.'
              }
            </DialogDescription>
          </DialogHeader>
          <SurveyContent />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default LuxuryFeedbackWidget;