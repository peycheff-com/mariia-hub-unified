import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { SupportService } from '@/services/support.service';
import type { Database } from '@/types/supabase';
import {
  MessageCircle,
  Send,
  Phone,
  Mail,
  User,
  Clock,
  CheckCircle,
  AlertCircle,
  Minimize2,
  Maximize2,
  X,
  Paperclip,
  Smile,
  MoreVertical,
  Star,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';

interface LiveChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderType: 'customer' | 'agent' | 'system';
  message: string;
  timestamp: Date;
  isRead: boolean;
  attachments?: string[];
}

interface ChatSession {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  agentId?: string;
  agentName?: string;
  status: 'active' | 'waiting' | 'ended';
  startTime: Date;
  endTime?: Date;
  messages: LiveChatMessage[];
  rating?: number;
  feedback?: string;
}

interface LiveChatProps {
  isOpen: boolean;
  onToggle: () => void;
  customerId?: string;
  agentMode?: boolean;
}

const LiveChat: React.FC<LiveChatProps> = ({
  isOpen,
  onToggle,
  customerId,
  agentMode = false
}) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showRating, setShowRating] = useState(false);
  const [chatRating, setChatRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    if (isOpen && customerId) {
      initializeChat();
    }

    return () => {
      if (subscriptionRef.current) {
        SupportService.unsubscribe(subscriptionRef.current);
      }
    };
  }, [isOpen, customerId]);

  useEffect(() => {
    scrollToBottom();
  }, [activeSession?.messages]);

  const initializeChat = async () => {
    try {
      // In a real implementation, this would connect to a chat service
      // For now, we'll create a mock session
      const newSession: ChatSession = {
        id: `chat_${Date.now()}`,
        customerId: customerId || 'guest',
        customerName: 'Guest User',
        customerEmail: 'guest@example.com',
        status: 'waiting',
        startTime: new Date(),
        messages: [
          {
            id: 'msg_welcome',
            senderId: 'system',
            senderName: 'Support Bot',
            senderType: 'system',
            message: 'Welcome to our live chat! A support agent will be with you shortly.',
            timestamp: new Date(),
            isRead: true
          }
        ]
      };

      setActiveSession(newSession);
      setSessions([newSession]);

      // Simulate agent joining
      setTimeout(() => {
        addSystemMessage('An agent has joined the chat');
        setActiveSession(prev => prev ? {
          ...prev,
          status: 'active',
          agentId: 'agent_1',
          agentName: 'Support Agent'
        } : null);
      }, 3000);

      // Subscribe to real-time updates
      if (activeSession?.id) {
        subscriptionRef.current = SupportService.subscribeToTicketUpdates(
          activeSession.id,
          (payload) => {
            handleRealtimeMessage(payload);
          }
        );
      }
    } catch (error) {
      console.error('Error initializing chat:', error);
    }
  };

  const handleRealtimeMessage = (payload: any) => {
    if (payload.eventType === 'INSERT' && payload.table === 'ticket_conversations') {
      const newMessage: LiveChatMessage = {
        id: payload.new.id,
        senderId: payload.new.sender_id,
        senderName: payload.new.sender_name,
        senderType: payload.new.message_type === 'agent_message' ? 'agent' : 'customer',
        message: payload.new.message,
        timestamp: new Date(payload.new.created_at),
        isRead: false,
        attachments: payload.new.attachments
      };

      setActiveSession(prev => prev ? {
        ...prev,
        messages: [...prev.messages, newMessage]
      } : null);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !activeSession) return;

    const newMessage: LiveChatMessage = {
      id: `msg_${Date.now()}`,
      senderId: customerId || 'guest',
      senderName: agentMode ? 'Support Agent' : activeSession.customerName,
      senderType: agentMode ? 'agent' : 'customer',
      message: message.trim(),
      timestamp: new Date(),
      isRead: false
    };

    setActiveSession(prev => prev ? {
      ...prev,
      messages: [...prev.messages, newMessage]
    } : null);

    // Send message to backend
    try {
      await SupportService.addConversationMessage({
        ticket_id: activeSession.id,
        message: message.trim(),
        message_type: agentMode ? 'agent_message' : 'customer_message',
        channel: 'chat',
        sender_id: agentMode ? activeSession.agentId : activeSession.customerId,
        sender_name: agentMode ? activeSession.agentName : activeSession.customerName,
        is_internal: false
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }

    setMessage('');

    // Simulate typing indicator for agent
    if (!agentMode) {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        // Simulate agent response
        const agentResponses = [
          'I understand your concern. Let me help you with that.',
          'Thank you for reaching out. I\'m looking into this for you.',
          'I can definitely assist you with this issue.',
          'Let me check that information for you right away.',
          'I appreciate your patience while I look into this matter.'
        ];

        const randomResponse = agentResponses[Math.floor(Math.random() * agentResponses.length)];
        addAgentMessage(randomResponse);
      }, 2000);
    }
  };

  const addSystemMessage = (message: string) => {
    if (!activeSession) return;

    const systemMessage: LiveChatMessage = {
      id: `msg_${Date.now()}`,
      senderId: 'system',
      senderName: 'System',
      senderType: 'system',
      message,
      timestamp: new Date(),
      isRead: true
    };

    setActiveSession(prev => prev ? {
      ...prev,
      messages: [...prev.messages, systemMessage]
    } : null);
  };

  const addAgentMessage = (message: string) => {
    if (!activeSession) return;

    const agentMessage: LiveChatMessage = {
      id: `msg_${Date.now()}`,
      senderId: 'agent_1',
      senderName: 'Support Agent',
      senderType: 'agent',
      message,
      timestamp: new Date(),
      isRead: false
    };

    setActiveSession(prev => prev ? {
      ...prev,
      messages: [...prev.messages, agentMessage]
    } : null);
  };

  const endChat = async () => {
    if (!activeSession) return;

    setShowRating(true);
    setActiveSession(prev => prev ? {
      ...prev,
      status: 'ended',
      endTime: new Date()
    } : null);

    // Create support ticket from chat
    try {
      const transcript = activeSession.messages
        .map(msg => `[${msg.senderName}]: ${msg.message}`)
        .join('\n');

      await SupportService.createTicket({
        user_id: activeSession.customerId,
        client_name: activeSession.customerName,
        client_email: activeSession.customerEmail,
        subject: 'Live Chat Support',
        description: transcript,
        category: 'general',
        priority: 'medium',
        channel: 'chat',
        metadata: {
          chatSessionId: activeSession.id,
          chatRating,
          feedback
        }
      });
    } catch (error) {
      console.error('Error creating ticket from chat:', error);
    }
  };

  const submitRating = async () => {
    if (!activeSession) return;

    setActiveSession(prev => prev ? {
      ...prev,
      rating: chatRating,
      feedback
    } : null);

    setShowRating(false);
    onToggle();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!isOpen) {
    return (
      <Button
        onClick={onToggle}
        className="fixed bottom-6 right-6 bg-amber-600 hover:bg-amber-700 text-white rounded-full shadow-lg z-50"
        size="lg"
      >
        <MessageCircle className="h-6 w-6 mr-2" />
        Live Chat
      </Button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className={`w-96 shadow-2xl border-amber-200 ${isMinimized ? 'h-14' : 'h-[600px]'} transition-all duration-300`}>
        {/* Chat Header */}
        <CardHeader className="bg-gradient-to-r from-amber-600 to-amber-700 text-white p-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="relative">
                <MessageCircle className="h-6 w-6" />
                {activeSession?.status === 'active' && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
                )}
              </div>
              <div>
                <CardTitle className="text-white text-lg">
                  {agentMode ? 'Chat with Customer' : 'Live Support'}
                </CardTitle>
                <p className="text-amber-100 text-sm">
                  {activeSession?.status === 'waiting' ? 'Connecting...' :
                   activeSession?.status === 'active' ? activeSession.agentName || 'Support Agent' :
                   'Chat ended'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
                className="text-white hover:bg-amber-500"
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (activeSession?.status === 'active') {
                    endChat();
                  } else {
                    onToggle();
                  }
                }}
                className="text-white hover:bg-amber-500"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <>
            {/* Chat Messages */}
            <CardContent className="flex-1 overflow-y-auto p-4 h-[420px]">
              {activeSession?.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 mb-4 ${
                    msg.senderType === (agentMode ? 'agent' : 'customer') ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.senderType !== (agentMode ? 'agent' : 'customer') && (
                    <Avatar className="w-8 h-8">
                      <AvatarFallback>
                        {msg.senderType === 'system' ? (
                          <AlertCircle className="h-4 w-4" />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      msg.senderType === (agentMode ? 'agent' : 'customer')
                        ? 'bg-amber-600 text-white'
                        : msg.senderType === 'system'
                        ? 'bg-gray-100 text-gray-600 text-sm'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    {msg.senderType !== 'system' && (
                      <p className="text-xs font-medium mb-1 opacity-75">
                        {msg.senderName}
                      </p>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    <p className={`text-xs mt-1 opacity-75 ${
                      msg.senderType === (agentMode ? 'agent' : 'customer') ? 'text-amber-100' : 'text-gray-500'
                    }`}>
                      {formatTime(msg.timestamp)}
                      {msg.senderType === (agentMode ? 'agent' : 'customer') && (
                        <CheckCircle className="inline h-3 w-3 ml-1" />
                      )}
                    </p>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex gap-3 mb-4">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-gray-100 rounded-lg p-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </CardContent>

            {/* Chat Input */}
            {!showRating ? (
              <div className="border-t border-amber-200 p-4">
                {activeSession?.status === 'active' ? (
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="text-amber-600">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-amber-600">
                      <Smile className="h-4 w-4" />
                    </Button>
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Type your message..."
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      className="flex-1 border-amber-200 focus:border-amber-400"
                    />
                    <Button onClick={sendMessage} className="bg-amber-600 hover:bg-amber-700">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                ) : activeSession?.status === 'waiting' ? (
                  <div className="text-center text-amber-600">
                    <Clock className="h-4 w-4 inline mr-2" />
                    Waiting for an agent to join...
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={onToggle}
                      className="border-amber-300 text-amber-700 hover:bg-amber-50"
                    >
                      Close
                    </Button>
                    <Button
                      onClick={() => setShowRating(true)}
                      className="bg-amber-600 hover:bg-amber-700 text-white"
                    >
                      Rate Chat
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              /* Rating Screen */
              <div className="border-t border-amber-200 p-6">
                <h3 className="text-lg font-semibold text-amber-900 mb-4">How was your chat experience?</h3>
                <div className="flex justify-center gap-2 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setChatRating(star)}
                      className="text-3xl transition-colors"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= chatRating
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'fill-gray-200 text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Additional feedback (optional)"
                  className="mb-4 border-amber-200 focus:border-amber-400"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowRating(false)}
                    className="border-amber-300 text-amber-700 hover:bg-amber-50"
                  >
                    Skip
                  </Button>
                  <Button
                    onClick={submitRating}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    Submit
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
};

export default LiveChat;