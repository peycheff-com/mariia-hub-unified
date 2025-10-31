/**
 * Feedback Survey Component
 * Dynamic, multi-channel survey interface with conditional logic
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Star, MessageSquare, ThumbsUp, ThumbsDown, Send, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

import {
  FeedbackSurvey,
  SurveyQuestion,
  FeedbackSubmission,
  QuestionType,
  QuestionConfig,
  CreateFeedbackResponseRequest,
  DeviceInfo,
  ValidationRules,
  FeedbackFormErrors
} from '@/types/feedback';
import { feedbackCollectionService } from '@/services/feedback-collection.service';
import { useTranslation } from 'react-i18next';

interface FeedbackSurveyProps {
  survey: FeedbackSurvey;
  bookingId?: string;
  serviceId?: string;
  staffId?: string;
  onSubmit?: (submission: FeedbackSubmission) => void;
  onCancel?: () => void;
  className?: string;
  showProgress?: boolean;
  autoSave?: boolean;
}

interface QuestionResponse {
  questionId: string;
  responseValue?: string;
  responseNumber?: number;
  responseArray?: string[];
  responseMetadata?: Record<string, any>;
}

export function FeedbackSurvey({
  survey,
  bookingId,
  serviceId,
  staffId,
  onSubmit,
  onCancel,
  className = '',
  showProgress = true,
  autoSave = true
}: FeedbackSurveyProps) {
  const { t, i18n } = useTranslation();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, QuestionResponse>>({});
  const [submission, setSubmission] = useState<FeedbackSubmission | null>(null);
  const [errors, setErrors] = useState<FeedbackFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<SurveyQuestion | null>(null);
  const [nextQuestion, setNextQuestion] = useState<SurveyQuestion | null>(null);
  const [progress, setProgress] = useState(0);

  const questions = survey.survey_questions || [];
  const totalQuestions = questions.length;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const isFirstQuestion = currentQuestionIndex === 0;

  // Initialize survey
  useEffect(() => {
    if (survey && !submission) {
      initializeSurvey();
    }
  }, [survey]);

  // Update current question
  useEffect(() => {
    if (questions.length > 0) {
      const question = questions[currentQuestionIndex];
      setCurrentQuestion(question);

      // Pre-fetch next question for better UX
      if (!isLastQuestion) {
        setNextQuestion(questions[currentQuestionIndex + 1]);
      } else {
        setNextQuestion(null);
      }

      updateProgress();
    }
  }, [currentQuestionIndex, questions, isLastQuestion]);

  // Auto-save responses
  useEffect(() => {
    if (autoSave && submission && Object.keys(responses).length > 0) {
      const saveTimer = setTimeout(() => {
        saveCurrentProgress();
      }, 2000); // Save after 2 seconds of inactivity

      return () => clearTimeout(saveTimer);
    }
  }, [responses, autoSave, submission]);

  const initializeSurvey = async () => {
    try {
      const newSubmission = await feedbackCollectionService.startSubmission(
        survey.id,
        undefined, // clientId will be set by auth
        'in_app'
      );
      setSubmission(newSubmission);
    } catch (error) {
      console.error('Error initializing survey:', error);
      toast.error(t('feedback.survey.initError'));
    }
  };

  const updateProgress = () => {
    const answeredQuestions = Object.keys(responses).length;
    const progressPercentage = (answeredQuestions / totalQuestions) * 100;
    setProgress(progressPercentage);
  };

  const validateCurrentQuestion = (): boolean => {
    if (!currentQuestion) return false;

    const question = currentQuestion;
    const response = responses[question.id];
    const rules = question.validation_rules;

    let isValid = true;
    const newErrors: FeedbackFormErrors = {};

    // Check if required
    if (rules.required && !hasResponse(response)) {
      newErrors[question.id] = t('feedback.survey.required');
      isValid = false;
    }

    // Type-specific validation
    if (hasResponse(response)) {
      const validationResult = feedbackCollectionService.validateResponse(question, getResponseValue(response));
      if (!validationResult.isValid) {
        newErrors[question.id] = validationResult.error;
        isValid = false;
      }
    }

    setErrors(prev => ({ ...prev, [question.id]: newErrors[question.id] }));
    return isValid;
  };

  const hasResponse = (response: QuestionResponse | undefined): boolean => {
    if (!response) return false;
    return !!(
      response.responseValue ||
      response.responseNumber !== undefined ||
      (response.responseArray && response.responseArray.length > 0)
    );
  };

  const getResponseValue = (response: QuestionResponse): any => {
    if (response.responseNumber !== undefined) return response.responseNumber;
    if (response.responseValue !== undefined) return response.responseValue;
    if (response.responseArray) return response.responseArray;
    return null;
  };

  const handleResponse = (questionId: string, response: Partial<QuestionResponse>) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        ...response,
        responseMetadata: {
          ...prev[questionId]?.responseMetadata,
          timestamp: new Date().toISOString()
        }
      }
    }));

    // Clear error for this question
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[questionId];
      return newErrors;
    });
  };

  const handleNext = async () => {
    if (!validateCurrentQuestion()) {
      toast.error(t('feedback.survey.validationError'));
      return;
    }

    if (isLastQuestion) {
      await handleSubmit();
    } else {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstQuestion) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!submission) {
      toast.error(t('feedback.survey.noSubmission'));
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert responses to API format
      const apiResponses: CreateFeedbackResponseRequest[] = Object.entries(responses).map(([questionId, response]) => ({
        question_id: questionId,
        response_value: response.responseValue,
        response_number: response.responseNumber,
        response_array: response.responseArray,
        response_metadata: response.responseMetadata
      }));

      const completedSubmission = await feedbackCollectionService.submitFeedback({
        survey_id: survey.id,
        booking_id: bookingId,
        service_id: serviceId,
        staff_id: staffId,
        submission_source: 'in_app',
        responses: apiResponses
      });

      toast.success(t('feedback.survey.thankYou'));
      onSubmit?.(completedSubmission);

    } catch (error) {
      console.error('Error submitting survey:', error);
      toast.error(t('feedback.survey.submitError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveCurrentProgress = async () => {
    if (!submission || isSaving) return;

    setIsSaving(true);

    try {
      for (const [questionId, response] of Object.entries(responses)) {
        await feedbackCollectionService.savePartialResponse(submission.id, questionId, response);
      }
    } catch (error) {
      console.error('Error saving progress:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const renderQuestion = (question: SurveyQuestion) => {
    const error = errors[question.id];
    const response = responses[question.id];
    const config = question.config;
    const questionText = i18n.language === 'pl' ? question.question_text_pl : question.question_text_en;

    switch (question.question_type) {
      case 'rating':
        return (
          <RatingQuestion
            question={question}
            config={config}
            response={response}
            onResponse={(value) => handleResponse(question.id, { responseNumber: value })}
            error={error}
          />
        );

      case 'star_rating':
        return (
          <StarRatingQuestion
            question={question}
            config={config}
            response={response}
            onResponse={(value) => handleResponse(question.id, { responseNumber: value })}
            error={error}
          />
        );

      case 'nps':
        return (
          <NPSQuestion
            question={question}
            response={response}
            onResponse={(value) => handleResponse(question.id, { responseNumber: value })}
            error={error}
          />
        );

      case 'ces':
        return (
          <CESQuestion
            question={question}
            response={response}
            onResponse={(value) => handleResponse(question.id, { responseNumber: value })}
            error={error}
          />
        );

      case 'multiple_choice':
        return (
          <MultipleChoiceQuestion
            question={question}
            config={config}
            response={response}
            onResponse={(value) => handleResponse(question.id, { responseArray: value })}
            error={error}
          />
        );

      case 'emoji':
        return (
          <EmojiQuestion
            question={question}
            config={config}
            response={response}
            onResponse={(value) => handleResponse(question.id, { responseNumber: value })}
            error={error}
          />
        );

      case 'text':
      default:
        return (
          <TextQuestion
            question={question}
            config={config}
            response={response}
            onResponse={(value) => handleResponse(question.id, { responseValue: value })}
            error={error}
          />
        );
    }
  };

  if (!currentQuestion) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`w-full max-w-2xl mx-auto ${className}`}>
      <CardHeader className="text-center">
        {showProgress && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>{t('feedback.survey.progress', { current: currentQuestionIndex + 1, total: totalQuestions })}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <CardTitle className="text-xl">
          {i18n.language === 'pl' ? survey.title_pl : survey.title_en}
        </CardTitle>

        {(survey.description_en || survey.description_pl) && (
          <p className="text-muted-foreground mt-2">
            {i18n.language === 'pl' ? survey.description_pl : survey.description_en}
          </p>
        )}

        {isSaving && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertDescription>
              {t('feedback.survey.saving')}
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Question */}
        <div className="space-y-4">
          <div className="flex items-start gap-2">
            <Badge variant="outline" className="mt-1">
              {currentQuestionIndex + 1}
            </Badge>
            <div className="flex-1">
              <h3 className="text-lg font-medium">
                {i18n.language === 'pl' ? currentQuestion.question_text_pl : currentQuestion.question_text_en}
              </h3>
              {currentQuestion.is_required && (
                <span className="text-sm text-destructive"> *</span>
              )}
            </div>
          </div>

          {renderQuestion(currentQuestion)}

          {errors[currentQuestion.id] && (
            <Alert variant="destructive">
              <AlertDescription>
                {errors[currentQuestion.id]}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Navigation */}
        <Separator />

        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            {!isFirstQuestion && (
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={isSubmitting}
              >
                {t('common.previous')}
              </Button>
            )}

            {onCancel && (
              <Button
                variant="ghost"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                {t('common.cancel')}
              </Button>
            )}
          </div>

          <Button
            onClick={handleNext}
            disabled={isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                {t('feedback.survey.submitting')}
              </>
            ) : isLastQuestion ? (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                {t('feedback.survey.submit')}
              </>
            ) : (
              <>
                {t('common.next')}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Question Components
interface QuestionComponentProps {
  question: SurveyQuestion;
  config: QuestionConfig;
  response?: QuestionResponse;
  onResponse: (value: any) => void;
  error?: string;
}

function RatingQuestion({ question, config, response, onResponse, error }: QuestionComponentProps) {
  const { t } = useTranslation();
  const scale = config.scale || { min: 1, max: 5 };
  const currentValue = response?.responseNumber || scale.min;
  const labels = config.scale?.labels || {};

  const getLabel = (value: number): string => {
    const labelArray = labels?.[t('common.language') as 'en' | 'pl'] || [];
    return labelArray[value - 1] || value.toString();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <RadioGroup
          value={currentValue.toString()}
          onValueChange={(value) => onResponse(Number(value))}
          className="flex gap-4"
        >
          {Array.from({ length: scale.max - scale.min + 1 }, (_, i) => {
            const value = scale.min + i;
            return (
              <div key={value} className="text-center">
                <RadioGroupItem value={value.toString()} id={`rating-${value}`} />
                <Label htmlFor={`rating-${value}`} className="cursor-pointer">
                  <div className="text-2xl font-bold mt-1">{value}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {getLabel(value)}
                  </div>
                </Label>
              </div>
            );
          })}
        </RadioGroup>
      </div>
    </div>
  );
}

function StarRatingQuestion({ question, config, response, onResponse, error }: QuestionComponentProps) {
  const { t } = useTranslation();
  const scale = config.scale || { min: 1, max: 5 };
  const currentValue = response?.responseNumber || 0;

  return (
    <div className="space-y-4">
      <div className="flex justify-center gap-2">
        {Array.from({ length: scale.max }, (_, i) => {
          const value = i + 1;
          return (
            <button
              key={value}
              onClick={() => onResponse(value)}
              className="transition-all hover:scale-110 focus:outline-none focus:scale-110"
            >
              <Star
                className={`h-8 w-8 ${
                  value <= currentValue
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300 hover:text-yellow-200'
                }`}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function NPSQuestion({ question, response, onResponse, error }: QuestionComponentProps) {
  const { t } = useTranslation();
  const currentValue = response?.responseNumber || 0;

  return (
    <div className="space-y-4">
      <div className="text-center text-sm text-muted-foreground mb-4">
        {t('feedback.nps.scale')}
      </div>
      <div className="flex justify-between items-center gap-1">
        {Array.from({ length: 11 }, (_, i) => {
          const value = i;
          const isSelected = value === currentValue;
          return (
            <button
              key={value}
              onClick={() => onResponse(value)}
              className={`flex-1 py-2 text-sm font-medium rounded transition-all ${
                isSelected
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground'
              }`}
            >
              {value}
            </button>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{t('feedback.nps.unlikely')}</span>
        <span>{t('feedback.nps.likely')}</span>
      </div>
    </div>
  );
}

function CESQuestion({ question, response, onResponse, error }: QuestionComponentProps) {
  const { t } = useTranslation();
  const scale = { min: 1, max: 7 };
  const currentValue = response?.responseNumber || scale.min;

  const getEffortLabel = (value: number): string => {
    if (value <= 2) return t('feedback.ces.veryEasy');
    if (value <= 4) return t('feedback.ces.easy');
    if (value <= 5) return t('feedback.ces.neutral');
    return t('feedback.ces.difficult');
  };

  return (
    <div className="space-y-4">
      <div className="text-center text-sm text-muted-foreground mb-4">
        {t('feedback.ces.scale')}
      </div>
      <div className="flex justify-center">
        <RadioGroup
          value={currentValue.toString()}
          onValueChange={(value) => onResponse(Number(value))}
          className="flex gap-3"
        >
          {Array.from({ length: 7 }, (_, i) => {
            const value = i + 1;
            return (
              <div key={value} className="text-center">
                <RadioGroupItem value={value.toString()} id={`ces-${value}`} />
                <Label htmlFor={`ces-${value}`} className="cursor-pointer">
                  <div className="text-lg font-bold mt-1">{value}</div>
                  <div className="text-xs text-muted-foreground mt-1 w-16">
                    {getEffortLabel(value)}
                  </div>
                </Label>
              </div>
            );
          })}
        </RadioGroup>
      </div>
    </div>
  );
}

function MultipleChoiceQuestion({ question, config, response, onResponse, error }: QuestionComponentProps) {
  const { t } = useTranslation();
  const options = config.options?.[t('common.language') as 'en' | 'pl'] || [];
  const selectedValues = response?.responseArray || [];
  const allowMultiple = config.allow_multiple || false;

  const handleToggle = (value: string) => {
    if (allowMultiple) {
      const newValues = selectedValues.includes(value)
        ? selectedValues.filter(v => v !== value)
        : [...selectedValues, value];
      onResponse(newValues);
    } else {
      onResponse([value]);
    }
  };

  return (
    <div className="space-y-3">
      {options.map((option, index) => (
        <div key={index} className="flex items-center space-x-2">
          {allowMultiple ? (
            <Checkbox
              id={`option-${index}`}
              checked={selectedValues.includes(option.value)}
              onCheckedChange={() => handleToggle(option.value)}
            />
          ) : (
            <RadioGroup
              value={selectedValues[0] || ''}
              onValueChange={(value) => handleToggle(value)}
            >
              <RadioGroupItem value={option.value} id={`option-${index}`} />
            </RadioGroup>
          )}
          <Label htmlFor={`option-${index}`} className="cursor-pointer flex-1">
            {option.label}
          </Label>
        </div>
      ))}
    </div>
  );
}

function EmojiQuestion({ question, config, response, onResponse, error }: QuestionComponentProps) {
  const emojiSet = config.emoji_set || 'smileys';
  const currentValue = response?.responseNumber || 0;

  const getEmojis = () => {
    switch (emojiSet) {
      case 'stars':
        return ['⭐', '⭐⭐', '⭐⭐⭐', '⭐⭐⭐⭐', '⭐⭐⭐⭐⭐'];
      case 'hearts':
        return ['💔', '💛', '🧡', '❤️', '💕'];
      case 'thumbs':
        return ['👎', '👍'];
      case 'smileys':
      default:
        return ['😢', '😕', '😐', '🙂', '😄'];
    }
  };

  const emojis = getEmojis();

  return (
    <div className="space-y-4">
      <div className="flex justify-center gap-4">
        {emojis.map((emoji, index) => (
          <button
            key={index}
            onClick={() => onResponse(index + 1)}
            className={`text-4xl p-2 rounded-lg transition-all hover:scale-110 focus:outline-none focus:scale-110 ${
              currentValue === index + 1
                ? 'bg-primary/20 ring-2 ring-primary'
                : 'hover:bg-muted'
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

function TextQuestion({ question, config, response, onResponse, error }: QuestionComponentProps) {
  const { t } = useTranslation();
  const currentValue = response?.responseValue || '';
  const maxLength = config.max_length || 500;
  const isMultiline = maxLength > 100;

  return (
    <div className="space-y-4">
      {isMultiline ? (
        <Textarea
          value={currentValue}
          onChange={(e) => onResponse(e.target.value)}
          placeholder={config.placeholder?.[t('common.language') as 'en' | 'pl'] || t('feedback.text.placeholder')}
          maxLength={maxLength}
          rows={4}
          className="resize-none"
        />
      ) : (
        <Input
          value={currentValue}
          onChange={(e) => onResponse(e.target.value)}
          placeholder={config.placeholder?.[t('common.language') as 'en' | 'pl'] || t('feedback.text.placeholder')}
          maxLength={maxLength}
        />
      )}

      {maxLength > 0 && (
        <div className="text-right text-sm text-muted-foreground">
          {currentValue.length} / {maxLength}
        </div>
      )}
    </div>
  );
}