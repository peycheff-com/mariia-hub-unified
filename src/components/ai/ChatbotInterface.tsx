import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { format } from 'date-fns';

// UI Components
import {
  Send,
  Bot,
  User,
  Phone,
  Mail,
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  Star,
  ThumbsUp,
  ThumbsDown,
  Copy,
  ExternalLink,
  MessageCircle,
  X,
  Minimize2,
  Maximize2,
  RefreshCw,
  Check,
  AlertCircle,
  Info,
  HelpCircle,
  Booking,
  CreditCard,
  Users,
  Languages,
  Zap,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Button,
} from '@/components/ui/button';
import {
  Input,
} from '@/components/ui/input';
import {
  Badge,
} from '@/components/ui/badge';
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@/components/ui/avatar';
import {
  ScrollArea,
} from '@/components/ui/scroll-area';
import {
  Separator,
} from '@/components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// Icons

import { getEnhancedAIService } from '@/integrations/ai/core/AIService';
import { cn } from '@/lib/utils';


// Types
interface Message {
  id: string;
  type: 'user' | 'bot' | 'system';
  content: string;
  timestamp: Date;
  intent?: string;
  confidence?: number;
  actions?: MessageAction[];
  metadata?: Record<string, any>;
}

interface MessageAction {
  type: 'book' | 'call' | 'email' | 'navigate' | 'schedule' | 'feedback';
  label: string;
  data?: any;
  url?: string;
}

interface ChatSession {
  id: string;
  userId: string;
  messages: Message[];
  startTime: Date;
  lastActivity: Date;
  status: 'active' | 'ended' | 'transferred';
  language: string;
  satisfaction?: number;
}

interface ChatbotInterfaceProps {
  userId?: string;
  isOpen?: boolean;
  onClose?: () => void;
  onBookService?: (serviceId: string) => void;
  onScheduleCall?: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'custom';
  className?: string;
}

const QUICK_ACTIONS = [
  { id: 'book', label: 'Book Service', icon: <Calendar className="w-4 h-4" />, intent: 'booking' },
  { id: 'price', label: 'Check Prices', icon: <DollarSign className="w-4 h-4" />, intent: 'pricing' },
  { id: 'availability', label: 'Check Availability', icon: <Clock className="w-4 h-4" />, intent: 'availability' },
  { id: 'services', label: 'Our Services', icon: <Sparkles className="w-4 h-4" />, intent: 'services' },
  { id: 'contact', label: 'Contact Us', icon: <Phone className="w-4 h-4" />, intent: 'contact' },
  { id: 'help', label: 'Get Help', icon: <HelpCircle className="w-4 h-4" />, intent: 'help' },
];

const INTENT_RESPONSES = {
  greeting: {
    responses: [
      "Hello! Welcome to Mariia Beauty & Fitness. How can I assist you today?",
      "Hi there! I'm here to help you with our beauty and fitness services. What would you like to know?",
    ],
    actions: ['book', 'services', 'help'],
  },
  booking: {
    responses: [
      "I'd be happy to help you book an appointment! Which service are you interested in?",
      "Great! Let's find the perfect service for you. What type of treatment are you looking for?",
    ],
    actions: ['services', 'availability'],
  },
  pricing: {
    responses: [
      "Our prices vary by service. Would you like to know about specific treatments or packages?",
      "I can help you with pricing information. Which service are you interested in?",
    ],
    actions: ['services', 'book'],
  },
  availability: {
    responses: [
      "Let me check our availability. Which service and preferred time are you looking for?",
      "I can help you find available slots. When would you like to schedule your appointment?",
    ],
    actions: ['book', 'contact'],
  },
  services: {
    responses: [
      "We offer a wide range of beauty and fitness services. Are you interested in beauty treatments, fitness programs, or wellness packages?",
      "Our services include lip enhancements, brow lamination, personal training, and more. What catches your interest?",
    ],
    actions: ['book', 'price'],
  },
  contact: {
    responses: [
      "You can reach us at +48 123 456 789 or visit our Warsaw salon. Would you like me to help you with anything else?",
      "We're located in Warsaw, Poland. You can call us or book online. How else can I assist?",
    ],
    actions: ['book', 'call'],
  },
  help: {
    responses: [
      "I'm here to help! You can ask me about our services, pricing, availability, or any questions you have.",
      "Feel free to ask anything about our beauty and fitness treatments. I'm happy to assist!",
    ],
    actions: ['services', 'contact', 'book'],
  },
};

export function ChatbotInterface({
  userId = 'anonymous',
  isOpen: controlledOpen,
  onClose,
  onBookService,
  onScheduleCall,
  position = 'bottom-right',
  className,
}: ChatbotInterfaceProps) {
  const { t, i18n } = useTranslation();
  const [internalOpen, setInternalOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [session, setSession] = useState<ChatSession | null>(null);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [feedback, setFeedback] = useState<Record<string, 'like' | 'dislike'>>({});
  const [language, setLanguage] = useState(i18n.language);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const aiService = getEnhancedAIService();

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

  // Initialize chat session
  useEffect(() => {
    if (isOpen && !session) {
      initializeChat();
    }
  }, [isOpen]);

  const initializeChat = () => {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      userId,
      messages: [],
      startTime: new Date(),
      lastActivity: new Date(),
      status: 'active',
      language,
    };

    setSession(newSession);

    // Add welcome message
    const welcomeMessage: Message = {
      id: crypto.randomUUID(),
      type: 'bot',
      content: getRandomResponse('greeting'),
      timestamp: new Date(),
      intent: 'greeting',
      confidence: 1.0,
      actions: INTENT_RESPONSES.greeting.actions.map(action => ({
        type: action as any,
        label: QUICK_ACTIONS.find(a => a.id === action)?.label || action,
      })),
    };

    setMessages([welcomeMessage]);
  };

  const getRandomResponse = (intent: string): string => {
    const responses = INTENT_RESPONSES[intent as keyof typeof INTENT_RESPONSES];
    if (!responses) return "I'm here to help! How can I assist you?";
    const responseArray = responses.responses;
    return responseArray[Math.floor(Math.random() * responseArray.length)];
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle language change
  useEffect(() => {
    setLanguage(i18n.language);
    if (session) {
      setSession({ ...session, language: i18n.language });
    }
  }, [i18n.language]);

  const detectIntent = async (message: string): Promise<{ intent: string; confidence: number }> => {
    const lowerMessage = message.toLowerCase();

    // Simple keyword-based intent detection
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      return { intent: 'greeting', confidence: 0.9 };
    }
    if (lowerMessage.includes('book') || lowerMessage.includes('appointment') || lowerMessage.includes('schedule')) {
      return { intent: 'booking', confidence: 0.9 };
    }
    if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('how much')) {
      return { intent: 'pricing', confidence: 0.85 };
    }
    if (lowerMessage.includes('available') || lowerMessage.includes('when') || lowerMessage.includes('time')) {
      return { intent: 'availability', confidence: 0.8 };
    }
    if (lowerMessage.includes('service') || lowerMessage.includes('treatment') || lowerMessage.includes('offer')) {
      return { intent: 'services', confidence: 0.85 };
    }
    if (lowerMessage.includes('contact') || lowerMessage.includes('call') || lowerMessage.includes('phone')) {
      return { intent: 'contact', confidence: 0.8 };
    }
    if (lowerMessage.includes('help') || lowerMessage.includes('support') || lowerMessage.includes('assist')) {
      return { intent: 'help', confidence: 0.9 };
    }

    // Use AI for more complex intent detection
    try {
      const prompt = `Detect the user's intent from this message: "${message}"

      Possible intents: greeting, booking, pricing, availability, services, contact, help, general

      Respond with JSON: {"intent": "detected_intent", "confidence": 0.95}`;

      const result = await aiService.generateContent(prompt, { temperature: 0.1 });
      const parsed = JSON.parse(result.content);
      return { intent: parsed.intent || 'general', confidence: parsed.confidence || 0.5 };
    } catch (error) {
      return { intent: 'general', confidence: 0.5 };
    }
  };

  const generateResponse = async (intent: string, userMessage: string): Promise<string> => {
    // Use predefined responses for common intents
    if (INTENT_RESPONSES[intent as keyof typeof INTENT_RESPONSES]) {
      return getRandomResponse(intent);
    }

    // Use AI for complex queries
    try {
      const systemPrompt = `You are a helpful assistant for Mariia Beauty & Fitness, a premium beauty and fitness service in Warsaw, Poland.
      Be friendly, professional, and helpful. Keep responses concise but informative.
      The services include: lip enhancements, brow lamination, PMU treatments, personal training, group fitness, and wellness packages.
      Always maintain a luxury brand voice and offer to help with booking or more information.`;

      const result = await aiService.generateContent(userMessage, {
        systemPrompt,
        tone: 'friendly',
        language: language === 'pl' ? 'pl' : 'en',
        temperature: 0.6,
      });

      return result.content;
    } catch (error) {
      return "I'm sorry, I'm having trouble understanding. Could you please rephrase or contact our salon directly for assistance?";
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Detect intent
    const { intent, confidence } = await detectIntent(inputValue);

    // Simulate typing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    // Generate response
    const responseContent = await generateResponse(intent, inputValue);
    const intentData = INTENT_RESPONSES[intent as keyof typeof INTENT_RESPONSES];

    const botMessage: Message = {
      id: crypto.randomUUID(),
      type: 'bot',
      content: responseContent,
      timestamp: new Date(),
      intent,
      confidence,
      actions: intentData?.actions.map(action => ({
        type: action as any,
        label: QUICK_ACTIONS.find(a => a.id === action)?.label || action,
      })) || [],
    };

    setMessages(prev => [...prev, botMessage]);
    setIsTyping(false);

    // Update session
    if (session) {
      setSession({
        ...session,
        lastActivity: new Date(),
        messages: [...session.messages, userMessage, botMessage],
      });
    }
  };

  const handleQuickAction = (action: { id: string; label: string; intent: string }) => {
    const actionMessages = {
      book: "I'd like to book an appointment",
      price: "What are your prices?",
      availability: "What times are available?",
      services: "Tell me about your services",
      contact: "How can I contact you?",
      help: "I need help",
    };

    setInputValue(actionMessages[action.id as keyof typeof actionMessages] || action.label);
    setTimeout(() => handleSendMessage(), 100);
  };

  const handleMessageAction = async (action: MessageAction) => {
    switch (action.type) {
      case 'book':
        if (onBookService && action.data?.serviceId) {
          onBookService(action.data.serviceId);
        } else {
          setInputValue("I'd like to book an appointment");
          setTimeout(() => handleSendMessage(), 100);
        }
        break;

      case 'call':
        window.open('tel:+48123456789');
        break;

      case 'email':
        window.open('mailto:info@mariia.com');
        break;

      case 'navigate':
        if (action.url) {
          window.open(action.url, '_blank');
        }
        break;

      case 'schedule':
        if (onScheduleCall) {
          onScheduleCall();
        }
        break;

      case 'feedback':
        // Open feedback form
        break;
    }
  };

  const handleFeedback = (messageId: string, type: 'like' | 'dislike') => {
    setFeedback({ ...feedback, [messageId]: type });
    toast.success(t('chatbot.feedbackThanks'));
  };

  const handleTransferToHuman = () => {
    setShowTransferDialog(true);
  };

  const confirmTransferToHuman = () => {
    if (session) {
      setSession({ ...session, status: 'transferred' });
    }

    const systemMessage: Message = {
      id: crypto.randomUUID(),
      type: 'system',
      content: "Connecting you to a human specialist...",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, systemMessage]);
    setShowTransferDialog(false);

    // Simulate transfer
    setTimeout(() => {
      const humanMessage: Message = {
        id: crypto.randomUUID(),
        type: 'bot',
        content: "A human specialist will be with you shortly. You can also call us directly at +48 123 456 789.",
        timestamp: new Date(),
        actions: [
          { type: 'call', label: 'Call Now' },
          { type: 'email', label: 'Email Us' },
        ],
      };

      setMessages(prev => [...prev, humanMessage]);
    }, 2000);
  };

  const resetChat = () => {
    setMessages([]);
    setSession(null);
    setFeedback({});
    initializeChat();
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      default:
        return 'bottom-4 right-4';
    }
  };

  const getMessageIcon = (type: 'user' | 'bot' | 'system') => {
    switch (type) {
      case 'user':
        return <User className="w-4 h-4" />;
      case 'bot':
        return <Bot className="w-4 h-4" />;
      case 'system':
        return <Info className="w-4 h-4" />;
    }
  };

  const copyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success(t('chatbot.copied'));
  };

  if (!isOpen) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setInternalOpen(true)}
              className={cn(
                "fixed z-50 w-14 h-14 rounded-full shadow-lg",
                getPositionClasses(),
                className
              )}
              size="icon"
            >
              <MessageCircle className="w-6 h-6" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>{t('chatbot.chatWithUs')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className={cn(
          "fixed z-50 bg-background border rounded-lg shadow-2xl",
          getPositionClasses(),
          isMaximized ? "inset-4 rounded-lg" : "w-96 h-[600px]",
          className
        )}
      >
        <Card className="h-full flex flex-col">
          {/* Header */}
          <CardHeader className="flex-shrink-0 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src="/assets/logo.png" />
                  <AvatarFallback>
                    <Bot className="w-5 h-5" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {t('chatbot.assistant')}
                    <Badge variant="secondary" className="text-xs">
                      <Zap className="w-3 h-3 mr-1" />
                      AI
                    </Badge>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {isTyping ? t('chatbot.typing') : t('chatbot.online')}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={resetChat}
                  className="h-8 w-8"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMaximized(!isMaximized)}
                  className="h-8 w-8"
                >
                  {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (onClose) onClose();
                    else setInternalOpen(false);
                  }}
                  className="h-8 w-8"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          {/* Messages */}
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full px-4">
              <div className="space-y-4 pb-4">
                <AnimatePresence>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className={cn(
                        "flex gap-3",
                        message.type === 'user' ? "justify-end" : "justify-start"
                      )}
                    >
                      {message.type !== 'user' && (
                        <Avatar className="w-8 h-8 mt-1">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {getMessageIcon(message.type)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className={cn(
                        "max-w-[70%] space-y-2",
                        message.type === 'user' && "text-right"
                      )}>
                        <div className={cn(
                          "rounded-lg px-3 py-2",
                          message.type === 'user'
                            ? "bg-primary text-primary-foreground"
                            : message.type === 'system'
                            ? "bg-muted text-muted-foreground"
                            : "bg-secondary"
                        )}>
                          <p className="text-sm">{message.content}</p>
                          {message.intent && message.confidence && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              {Math.round(message.confidence * 100)}% confidence
                            </Badge>
                          )}
                        </div>

                        {/* Message Actions */}
                        {message.actions && message.actions.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {message.actions.map((action, idx) => (
                              <Button
                                key={idx}
                                variant="outline"
                                size="sm"
                                onClick={() => handleMessageAction(action)}
                                className="text-xs h-7"
                              >
                                {action.label}
                                {action.type === 'navigate' && <ExternalLink className="w-3 h-3 ml-1" />}
                                {action.type === 'call' && <Phone className="w-3 h-3 ml-1" />}
                                {action.type === 'email' && <Mail className="w-3 h-3 ml-1" />}
                              </Button>
                            ))}
                          </div>
                        )}

                        {/* Message Footer */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span>{format(message.timestamp, 'HH:mm')}</span>
                          {message.type === 'bot' && (
                            <>
                              <button
                                onClick={() => copyMessage(message.content)}
                                className="hover:text-foreground"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleFeedback(message.id, 'like')}
                                className={cn(
                                  "hover:text-green-600",
                                  feedback[message.id] === 'like' && "text-green-600"
                                )}
                              >
                                <ThumbsUp className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleFeedback(message.id, 'dislike')}
                                className={cn(
                                  "hover:text-red-600",
                                  feedback[message.id] === 'dislike' && "text-red-600"
                                )}
                              >
                                <ThumbsDown className="w-3 h-3" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {message.type === 'user' && (
                        <Avatar className="w-8 h-8 mt-1">
                          <AvatarFallback className="bg-muted">
                            <User className="w-4 h-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Typing Indicator */}
                {isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Bot className="w-4 h-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-secondary rounded-lg px-3 py-2">
                      <div className="flex gap-1">
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 0.8 }}
                          className="w-2 h-2 bg-muted-foreground rounded-full"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 0.8, delay: 0.2 }}
                          className="w-2 h-2 bg-muted-foreground rounded-full"
                        />
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 0.8, delay: 0.4 }}
                          className="w-2 h-2 bg-muted-foreground rounded-full"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </CardContent>

          {/* Quick Actions */}
          {!isMaximized && (
            <div className="px-4 py-2 border-t">
              <div className="flex gap-2 overflow-x-auto pb-2">
                {QUICK_ACTIONS.slice(0, 4).map((action) => (
                  <Button
                    key={action.id}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickAction(action)}
                    className="flex items-center gap-1 whitespace-nowrap text-xs"
                  >
                    {action.icon}
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <CardFooter className="flex-shrink-0 pt-3">
            <div className="flex w-full gap-2">
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={t('chatbot.typeMessage')}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isTyping}
                className="flex-1"
              />
              <Button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isTyping}
                size="icon"
              >
                {isTyping ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            <div className="flex items-center justify-between w-full mt-2">
              <p className="text-xs text-muted-foreground">
                {t('chatbot.poweredBy')} AI
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleTransferToHuman}
                className="text-xs"
              >
                <Users className="w-3 h-3 mr-1" />
                {t('chatbot.talkToHuman')}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </motion.div>

      {/* Transfer to Human Dialog */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('chatbot.transferToHuman')}</DialogTitle>
            <DialogDescription>
              {t('chatbot.transferDescription')}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" onClick={() => setShowTransferDialog(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={confirmTransferToHuman}>
              {t('chatbot.confirmTransfer')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}