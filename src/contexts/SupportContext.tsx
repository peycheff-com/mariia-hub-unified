import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SupportService } from '@/services/support.service';
import { TicketRoutingService } from '@/services/ticket-routing.service';
import { ClientRelationshipService } from '@/services/client-relationship.service';
import type { SupportTicketWithDetails, SupportDashboardData } from '@/types/supabase';
import { useTranslation } from 'react-i18next';

interface SupportContextType {
  // Ticket management
  tickets: SupportTicketWithDetails[];
  loading: boolean;
  createTicket: (ticketData: any) => Promise<void>;
  updateTicket: (ticketId: string, updates: any) => Promise<void>;
  assignTicket: (ticketId: string, agentId: string) => Promise<void>;
  getTicketById: (ticketId: string) => Promise<SupportTicketWithDetails | null>;

  // Dashboard data
  dashboardData: SupportDashboardData | null;
  refreshDashboard: () => Promise<void>;

  // Knowledge base
  knowledgeBase: {
    categories: any[];
    articles: any[];
    searchArticles: (query: string) => Promise<any[]>;
    getArticleBySlug: (slug: string) => Promise<any>;
  };

  // Live chat
  chatState: {
    isOpen: boolean;
    toggleChat: () => void;
    unreadCount: number;
    markAsRead: () => void;
  };

  // Notifications
  notifications: SupportNotification[];
  addNotification: (notification: Omit<SupportNotification, 'id' | 'timestamp'>) => void;
  clearNotifications: () => void;

  // Language support
  currentLanguage: 'en' | 'pl';
  changeLanguage: (lang: 'en' | 'pl') => void;
  t: (key: string, options?: any) => string;

  // Client relationship
  getClientProfile: (clientId: string) => Promise<any>;
  getAtRiskClients: () => Promise<any[]>;
}

interface SupportNotification {
  id: string;
  type: 'new_ticket' | 'ticket_assigned' | 'ticket_escalated' | 'sla_warning' | 'chat_message';
  title: string;
  message: string;
  ticketId?: string;
  isRead: boolean;
  timestamp: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

const SupportContext = createContext<SupportContextType | undefined>(undefined);

export const useSupport = () => {
  const context = useContext(SupportContext);
  if (!context) {
    throw new Error('useSupport must be used within a SupportProvider');
  }
  return context;
};

interface SupportProviderProps {
  children: ReactNode;
}

export const SupportProvider: React.FC<SupportProviderProps> = ({ children }) => {
  const { t, i18n } = useTranslation();
  const [tickets, setTickets] = useState<SupportTicketWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<SupportDashboardData | null>(null);
  const [knowledgeBase, setKnowledgeBase] = useState({
    categories: [],
    articles: [],
    searchArticles: async (query: string) => {
      return SupportService.searchKnowledgeBase(query, i18n.language);
    },
    getArticleBySlug: async (slug: string) => {
      return SupportService.getKnowledgeBaseArticle(slug);
    }
  });

  const [chatState, setChatState] = useState({
    isOpen: false,
    toggleChat: () => setChatState(prev => ({ ...prev, isOpen: !prev.isOpen })),
    unreadCount: 0,
    markAsRead: () => setChatState(prev => ({ ...prev, unreadCount: 0 }))
  });

  const [notification aria-live="polite" aria-atomic="true"s, setNotifications] = useState<SupportNotification[]>([]);

  // Initialize support data
  useEffect(() => {
    loadInitialData();
    setupRealtimeSubscriptions();

    return () => {
      // Cleanup subscriptions
    };
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadDashboardData(),
        loadKnowledgeBaseData()
      ]);
    } catch (error) {
      console.error('Error loading support data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    const data = await SupportService.getSupportMetrics();
    setDashboardData(data);
  };

  const loadKnowledgeBaseData = async () => {
    const [categories, featuredArticles] = await Promise.all([
      SupportService.getKnowledgeBaseCategories(),
      SupportService.getKnowledgeBaseArticles({ featured: true, limit: 6 })
    ]);

    setKnowledgeBase(prev => ({
      ...prev,
      categories,
      articles: featuredArticles
    }));
  };

  const setupRealtimeSubscriptions = () => {
    // Subscribe to ticket updates for notification aria-live="polite" aria-atomic="true"s
    const subscription = SupportService.subscribeToAgentTickets(
      'current-agent-id', // Replace with actual agent ID
      (payload) => {
        handleTicketUpdate(payload);
      }
    );

    return () => {
      SupportService.unsubscribe(subscription);
    };
  };

  const handleTicketUpdate = (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload;

    if (eventType === 'INSERT') {
      addNotification({
        type: 'new_ticket',
        title: t('notifications.newTicket.title'),
        message: t('notifications.newTicket.message', { ticketNumber: newRecord.ticket_number }),
        ticketId: newRecord.id,
        isRead: false,
        priority: newRecord.priority
      });
    } else if (eventType === 'UPDATE') {
      if (newRecord.assigned_agent_id !== oldRecord.assigned_agent_id) {
        addNotification({
          type: 'ticket_assigned',
          title: t('notifications.ticketAssigned.title'),
          message: t('notifications.ticketAssigned.message', { ticketNumber: newRecord.ticket_number }),
          ticketId: newRecord.id,
          isRead: false,
          priority: 'medium'
        });
      }

      if (newRecord.escalation_level > oldRecord.escalation_level) {
        addNotification({
          type: 'ticket_escalated',
          title: t('notifications.ticketEscalated.title'),
          message: t('notifications.ticketEscalated.message', { ticketNumber: newRecord.ticket_number }),
          ticketId: newRecord.id,
          isRead: false,
          priority: 'high'
        });
      }

      if (newRecord.sla_status === 'at_risk' && oldRecord.sla_status === 'on_track') {
        addNotification({
          type: 'sla_warning',
          title: t('notifications.slaWarning.title'),
          message: t('notifications.slaWarning.message', { ticketNumber: newRecord.ticket_number }),
          ticketId: newRecord.id,
          isRead: false,
          priority: 'high'
        });
      }
    }
  };

  // Ticket management functions
  const createTicket = async (ticketData: any) => {
    try {
      setLoading(true);

      // Auto-detect priority if not provided
      if (!ticketData.priority) {
        ticketData.priority = TicketRoutingService.calculateTicketPriority(
          ticketData.category,
          ticketData.description
        );
      }

      const createdTicket = await SupportService.createTicket(ticketData);

      // Auto-assign ticket
      const routingResult = await TicketRoutingService.routeTicket(createdTicket.id);

      if (routingResult.success) {
        addNotification({
          type: 'ticket_assigned',
          title: t('notifications.ticketAutoAssigned.title'),
          message: t('notifications.ticketAutoAssigned.message'),
          ticketId: createdTicket.id,
          isRead: false,
          priority: 'low'
        });
      }

      // Refresh data
      await loadDashboardData();

      setTickets(prev => [createdTicket, ...prev]);
    } catch (error) {
      console.error('Error creating ticket:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateTicket = async (ticketId: string, updates: any) => {
    try {
      await SupportService.updateTicket(ticketId, updates);

      setTickets(prev => prev.map(ticket =>
        ticket.id === ticketId ? { ...ticket, ...updates } : ticket
      ));

      await loadDashboardData();
    } catch (error) {
      console.error('Error updating ticket:', error);
      throw error;
    }
  };

  const assignTicket = async (ticketId: string, agentId: string) => {
    try {
      await SupportService.assignTicket(ticketId, agentId);

      setTickets(prev => prev.map(ticket =>
        ticket.id === ticketId ? { ...ticket, assigned_agent_id: agentId } : ticket
      ));

      await loadDashboardData();
    } catch (error) {
      console.error('Error assigning ticket:', error);
      throw error;
    }
  };

  const getTicketById = async (ticketId: string): Promise<SupportTicketWithDetails | null> => {
    try {
      return await SupportService.getTicketById(ticketId);
    } catch (error) {
      console.error('Error getting ticket:', error);
      return null;
    }
  };

  const refreshDashboard = async () => {
    await loadDashboardData();
  };

  // Notification functions
  const addNotification = (notification: Omit<SupportNotification, 'id' | 'timestamp'>) => {
    const newNotification: SupportNotification = {
      ...notification aria-live="polite" aria-atomic="true",
      id: `notif_${Date.now()}_${Math.random()}`,
      timestamp: new Date()
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Update unread count for chat notification aria-live="polite" aria-atomic="true"s
    if (notification.type === 'chat_message') {
      setChatState(prev => ({ ...prev, unreadCount: prev.unreadCount + 1 }));
    }
  };

  const clearNotifications = () => {
    setNotifications([]);
    setChatState(prev => ({ ...prev, unreadCount: 0 }));
  };

  // Language functions
  const changeLanguage = async (lang: 'en' | 'pl') => {
    await i18n.changeLanguage(lang);

    // Reload knowledge base in new language
    await loadKnowledgeBaseData();
  };

  // Client relationship functions
  const getClientProfile = async (clientId: string) => {
    try {
      return await ClientRelationshipService.getClientProfile(clientId);
    } catch (error) {
      console.error('Error getting client profile:', error);
      return null;
    }
  };

  const getAtRiskClients = async () => {
    try {
      return await ClientRelationshipService.getAtRiskClients();
    } catch (error) {
      console.error('Error getting at-risk clients:', error);
      return [];
    }
  };

  const contextValue: SupportContextType = {
    // Ticket management
    tickets,
    loading,
    createTicket,
    updateTicket,
    assignTicket,
    getTicketById,

    // Dashboard data
    dashboardData,
    refreshDashboard,

    // Knowledge base
    knowledgeBase,

    // Live chat
    chatState,

    // Notifications
    notification aria-live="polite" aria-atomic="true"s,
    addNotification,
    clearNotifications,

    // Language support
    currentLanguage: i18n.language as 'en' | 'pl',
    changeLanguage,
    t,

    // Client relationship
    getClientProfile,
    getAtRiskClients
  };

  return (
    <SupportContext.Provider value={contextValue}>
      {children}
    </SupportContext.Provider>
  );
};

// Support translations
export const supportTranslations = {
  en: {
    'notifications.newTicket.title': 'New Support Ticket',
    'notifications.newTicket.message': 'Ticket #{ticketNumber} has been created',
    'notifications.ticketAssigned.title': 'Ticket Assigned',
    'notifications.ticketAssigned.message': 'Ticket #{ticketNumber} has been assigned to you',
    'notifications.ticketAutoAssigned.title': 'Ticket Auto-Assigned',
    'notifications.ticketAutoAssigned.message': 'Ticket has been automatically assigned to the best available agent',
    'notifications.ticketEscalated.title': 'Ticket Escalated',
    'notifications.ticketEscalated.message': 'Ticket #{ticketNumber} has been escalated',
    'notifications.slaWarning.title': 'SLA Warning',
    'notifications.slaWarning.message': 'Ticket #{ticketNumber} is at risk of breaching SLA',

    'support.portal.title': 'Customer Support',
    'support.portal.subtitle': 'We\'re here to help with your beauty and fitness needs',
    'support.dashboard.title': 'Support Dashboard',
    'support.dashboard.subtitle': 'Luxury Customer Support Management',

    'ticket.create.title': 'Create Support Ticket',
    'ticket.create.subtitle': 'Fill out the form below and we\'ll get back to you as soon as possible',
    'ticket.subject': 'Subject',
    'ticket.category': 'Category',
    'ticket.priority': 'Priority',
    'ticket.description': 'Description',
    'ticket.bookingIssue': 'Booking Issue',
    'ticket.paymentProblem': 'Payment Problem',
    'ticket.serviceInquiry': 'Service Inquiry',
    'ticket.technicalSupport': 'Technical Support',
    'ticket.complaint': 'Complaint',
    'ticket.featureRequest': 'Feature Request',
    'ticket.billing': 'Billing',
    'ticket.accountManagement': 'Account Management',
    'ticket.general': 'General',
    'ticket.urgent': 'Urgent - Immediate attention required',
    'ticket.high': 'High - Affects service usage',
    'ticket.medium': 'Medium - General inquiry',
    'ticket.low': 'Low - Information request',

    'knowledgeBase.searchPlaceholder': 'Search for help articles...',
    'knowledgeBase.featuredArticles': 'Featured Articles',
    'knowledgeBase.categories': 'Categories',
    'knowledgeBase.helpful': 'Was this article helpful?',
    'knowledgeBase.readTime': 'min read',

    'chat.welcome': 'Welcome to our live chat! A support agent will be with you shortly.',
    'chat.agentJoined': 'An agent has joined the chat',
    'chat.typing': 'Agent is typing...',
    'chat.placeholder': 'Type your message...',
    'chat.rateExperience': 'How was your chat experience?',

    'metrics.totalTickets': 'Total Tickets',
    'metrics.resolvedToday': 'Resolved Today',
    'metrics.avgResponseTime': 'Avg Response Time',
    'metrics.customerSatisfaction': 'Customer Satisfaction',
    'metrics.overdueTickets': 'Overdue Tickets',
    'metrics.slaCompliance': 'SLA Compliance',
    'metrics.activeAgents': 'Active Agents',
    'metrics.channelBreakdown': 'Channel Breakdown'
  },
  pl: {
    'notifications.newTicket.title': 'Nowy Zgłoszenie',
    'notifications.newTicket.message': 'Zgłoszenie #{ticketNumber} zostało utworzone',
    'notifications.ticketAssigned.title': 'Przypisano Zgłoszenie',
    'notifications.ticketAssigned.message': 'Zgłoszenie #{ticketNumber} zostało Ci przypisane',
    'notifications.ticketAutoAssigned.title': 'Automatyczne Przypisanie',
    'notifications.ticketAutoAssigned.message': 'Zgłoszenie zostało automatycznie przypisane do najlepszego dostępnego agenta',
    'notifications.ticketEscalated.title': 'Eskalacja Zgłoszenia',
    'notifications.ticketEscalated.message': 'Zgłoszenie #{ticketNumber} zostało eskalowane',
    'notifications.slaWarning.title': 'Ostrzeżenie SLA',
    'notifications.slaWarning.message': 'Zgłoszenie #{ticketNumber} jest zagrożone naruszeniem SLA',

    'support.portal.title': 'Obsługa Klienta',
    'support.portal.subtitle': 'Jesteśmy tutaj, aby pomóc z potrzebami urody i fitness',
    'support.dashboard.title': 'Panel Obsługi',
    'support.dashboard.subtitle': 'Zarządzanie Obsługą Klienta Premium',

    'ticket.create.title': 'Utwórz Zgłoszenie',
    'ticket.create.subtitle': 'Wypełnij formularz poniżej, a my skontaktujemy się z Tobą jak najszybciej',
    'ticket.subject': 'Temat',
    'ticket.category': 'Kategoria',
    'ticket.priority': 'Priorytet',
    'ticket.description': 'Opis',
    'ticket.bookingIssue': 'Problem z Rezerwacją',
    'ticket.paymentProblem': 'Problem z Płatnością',
    'ticket.serviceInquiry': 'Zapytanie o Usługę',
    'ticket.technicalSupport': 'Wsparcie Techniczne',
    'ticket.complaint': 'Skarga',
    'ticket.featureRequest': 'Propozycja Funkcji',
    'ticket.billing': 'Rozliczenia',
    'ticket.accountManagement': 'Zarządzanie Kontem',
    'ticket.general': 'Ogólne',
    'ticket.urgent': 'Pilne - Wymagana natychmiastowa uwaga',
    'ticket.high': 'Wysoki - Wpływa na korzystanie z usługi',
    'ticket.medium': 'Średni - Ogólne zapytanie',
    'ticket.low': 'Niski - Zapytanie informacyjne',

    'knowledgeBase.searchPlaceholder': 'Szukaj artykułów pomocy...',
    'knowledgeBase.featuredArticles': 'Polecane Artykuły',
    'knowledgeBase.categories': 'Kategorie',
    'knowledgeBase.helpful': 'Czy ten artykuł był pomocny?',
    'knowledgeBase.readTime': 'min czytania',

    'chat.welcome': 'Witaj na czacie na żywo! Agent wsparcia będzie z Tobą wkrótce.',
    'chat.agentJoined': 'Agent dołączył do czatu',
    'chat.typing': 'Agent pisze...',
    'chat.placeholder': 'Wpisz swoją wiadomość...',
    'chat.rateExperience': 'Jak oceniasz swoje doświadczenie na czacie?',

    'metrics.totalTickets': 'Całkowita Liczba Zgłoszeń',
    'metrics.resolvedToday': 'Rozwiązane Dziś',
    'metrics.avgResponseTime': 'Średni Czas Odpowiedzi',
    'metrics.customerSatisfaction': 'Zadowolenie Klientów',
    'metrics.overdueTickets': 'Zaległe Zgłoszenia',
    'metrics.slaCompliance': 'Zgodność SLA',
    'metrics.activeAgents': 'Aktywni Agenci',
    'metrics.channelBreakdown': 'Podział według Kanałów'
  }
};