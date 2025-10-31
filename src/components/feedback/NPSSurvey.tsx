import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, X, TrendingUp, Users, Target, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useNPSSurvey } from '@/hooks/useFeedback';
import { cn } from '@/lib/utils';


interface NPSSurveyProps {
  trigger?: React.ReactNode;
  autoShow?: boolean;
  showDelay?: number; // milliseconds
  surveyType?: 'post_booking' | 'periodic' | 'trigger_based';
  triggerEvent?: string;
  compact?: boolean;
  showResults?: boolean;
  className?: string;
}

interface NPSScore {
  score: number;
  promoters: number;
  passives: number;
  detractors: number;
  totalResponses: number;
}

const scoreMessages = {
  0: { text: "Very unlikely", color: "text-red-600", bgColor: "bg-red-50" },
  1: { text: "Very unlikely", color: "text-red-600", bgColor: "bg-red-50" },
  2: { text: "Very unlikely", color: "text-red-600", bgColor: "bg-red-50" },
  3: { text: "Very unlikely", color: "text-red-600", bgColor: "bg-red-50" },
  4: { text: "Very unlikely", color: "text-red-600", bgColor: "bg-red-50" },
  5: { text: "Very unlikely", color: "text-red-600", bgColor: "bg-red-50" },
  6: { text: "Unlikely", color: "text-orange-600", bgColor: "bg-orange-50" },
  7: { text: "Neutral", color: "text-yellow-600", bgColor: "bg-yellow-50" },
  8: { text: "Neutral", color: "text-yellow-600", bgColor: "bg-yellow-50" },
  9: { text: "Likely", color: "text-green-600", bgColor: "bg-green-50" },
  10: { text: "Very likely", color: "text-emerald-600", bgColor: "bg-emerald-50" },
};

const getScoreCategory = (score: number) => {
  if (score >= 9) return { label: 'Promoter', color: 'text-green-600', bgColor: 'bg-green-50' };
  if (score >= 7) return { label: 'Passive', color: 'text-yellow-600', bgColor: 'bg-yellow-50' };
  return { label: 'Detractor', color: 'text-red-600', bgColor: 'bg-red-50' };
};

export const NPSSurvey: React.FC<NPSSurveyProps> = ({
  trigger,
  autoShow = false,
  showDelay = 5000,
  surveyType = 'periodic',
  triggerEvent,
  compact = false,
  showResults = false,
  className,
}) => {
  const { toast } = useToast();
  const { submitNPSSurvey, getNPSScore, loading: submitting } = useNPSSurvey();
  const [isOpen, setIsOpen] = useState(false);
  const [showWidget, setShowWidget] = useState(false);
  const [currentScore, setCurrentScore] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [npsData, setNpsData] = useState<NPSScore | null>(null);

  // Load NPS data if showResults is enabled
  useEffect(() => {
    if (showResults) {
      loadNPSData();
    }
  }, [showResults]);

  // Auto-show logic
  useEffect(() => {
    if (autoShow && !submitted && !dismissed) {
      const timer = setTimeout(() => {
        setShowWidget(true);
      }, showDelay);

      return () => clearTimeout(timer);
    }
  }, [autoShow, showDelay, submitted, dismissed]);

  const loadNPSData = async () => {
    const data = await getNPSScore('month');
    setNpsData(data);
  };

  const handleScoreChange = (score: number) => {
    setCurrentScore(score);
  };

  const handleSubmit = async () => {
    if (currentScore === null) {
      toast({
        title: 'Please select a score',
        description: 'Rate how likely you are to recommend us',
        variant: 'destructive',
      });
      return;
    }

    try {
      const result = await submitNPSSurvey(currentScore, reason, surveyType, triggerEvent);

      if (result) {
        setSubmitted(true);
        toast({
          title: 'Thank you for your feedback!',
          description: 'Your response helps us improve our service.',
        });

        // Reload NPS data if showing results
        if (showResults) {
          await loadNPSData();
        }

        // Close after delay
        setTimeout(() => {
          setIsOpen(false);
          setShowWidget(false);
        }, 2000);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit survey',
        variant: 'destructive',
      });
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowWidget(false);
  };

  const resetForm = () => {
    setCurrentScore(null);
    setReason('');
    setSubmitted(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    resetForm();
  };

  const renderScoreButton = (score: number) => {
    const isSelected = currentScore === score;
    const message = scoreMessages[score as keyof typeof scoreMessages];
    const category = currentScore === score ? getScoreCategory(score) : null;

    return (
      <div className="flex flex-col items-center gap-1">
        <button
          type="button"
          onClick={() => handleScoreChange(score)}
          className={cn(
            'w-12 h-12 rounded-lg border-2 font-semibold transition-all duration-200 hover:scale-105',
            isSelected
              ? `${category?.bgColor} ${category?.color} border-current`
              : 'border-gray-300 hover:border-gray-400 bg-white'
          )}
        >
          {score}
        </button>
        {isSelected && (
          <span className={cn('text-xs font-medium', category?.color)}>
            {category?.label}
          </span>
        )}
      </div>
    );
  };

  const SurveyContent = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-full">
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        <h3 className="text-xl font-semibold text-gray-900">
          How likely are you to recommend us?
        </h3>
        <p className="text-gray-600">
          On a scale of 0 to 10, how likely are you to recommend mariiaborysevych to friends and colleagues?
        </p>
      </div>

      {/* Score selection */}
      <div className="space-y-4">
        <div className="flex justify-between text-xs text-gray-500 px-1">
          <span>Not likely</span>
          <span>Very likely</span>
        </div>
        <div className="flex gap-1 justify-between">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(renderScoreButton)}
        </div>
      </div>

      {/* Reason field */}
      <div className="space-y-2">
        <Label htmlFor="reason">What's the main reason for your score?</Label>
        <Textarea
          id="reason"
          placeholder="Share your thoughts with us..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={3}
          className="resize-none"
        />
      </div>

      {/* NPS Results (if enabled) */}
      {showResults && npsData && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Users className="w-4 h-4" />
            Recent NPS Score
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{npsData.score}</div>
              <div className="text-xs text-gray-500">NPS Score</div>
            </div>
            <div className="flex gap-4 text-xs">
              <div className="text-center">
                <div className="text-green-600 font-medium">{npsData.promoters.toFixed(0)}%</div>
                <div className="text-gray-500">Promoters</div>
              </div>
              <div className="text-center">
                <div className="text-yellow-600 font-medium">{npsData.passives.toFixed(0)}%</div>
                <div className="text-gray-500">Passives</div>
              </div>
              <div className="text-center">
                <div className="text-red-600 font-medium">{npsData.detractors.toFixed(0)}%</div>
                <div className="text-gray-500">Detractors</div>
              </div>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            Based on {npsData.totalResponses} responses in the last month
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button
          onClick={handleSubmit}
          disabled={submitting || submitted}
          className="flex-1"
        >
          {submitting ? 'Submitting...' : submitted ? 'Thank you!' : 'Submit Feedback'}
          {submitted && <Award className="w-4 h-4 ml-2" />}
        </Button>
        <Button
          variant="outline"
          onClick={handleClose}
          disabled={submitting}
        >
          Skip
        </Button>
      </div>
    </div>
  );

  // Compact floating widget
  if (compact && showWidget && !submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className={cn("fixed bottom-4 right-4 z-50 max-w-sm", className)}
      >
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <span className="font-medium text-sm">Quick Survey</span>
                </div>
                <p className="text-xs text-gray-600 mb-3">
                  How likely are you to recommend us? (0-10)
                </p>
                <div className="flex gap-1 mb-3">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                    <button
                      key={score}
                      onClick={() => handleScoreChange(score)}
                      className={cn(
                        'w-6 h-6 text-xs rounded border',
                        currentScore === score
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white border-gray-300 hover:border-gray-400'
                      )}
                    >
                      {score}
                    </button>
                  ))}
                </div>
                {currentScore !== null && (
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Why did you give this score?"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={2}
                      className="text-xs"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="flex-1 text-xs"
                      >
                        {submitting ? '...' : 'Submit'}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleDismiss}
                        className="text-xs"
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Full dialog version
  if (trigger || isOpen) {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          {trigger || (
            <Button variant="outline" className="gap-2">
              <MessageSquare className="w-4 h-4" />
              Take Survey
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600" />
              Net Promoter Score Survey
            </DialogTitle>
            <DialogDescription>
              Your feedback helps us understand what we're doing well and where we can improve.
            </DialogDescription>
          </DialogHeader>
          <SurveyContent />
        </DialogContent>
      </Dialog>
    );
  }

  return null;
};

export default NPSSurvey;