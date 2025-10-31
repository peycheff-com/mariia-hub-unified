/**
 * Voice Assistant Integration (Siri, Google Assistant, Alexa)
 *
 * Comprehensive integration with voice assistants for hands-free booking,
 * service discovery, and platform navigation.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types for voice assistant integration
export interface VoiceAssistantAction {
  id: string;
  name: string;
  description: string;
  utterances: string[];
  intent: string;
  parameters: Record<string, any>;
  handler: (params: any) => Promise<void>;
  enabled: boolean;
}

export interface VoiceAssistantConfig {
  enabled: boolean;
  assistants: {
    siri: boolean;
    google: boolean;
    alexa: boolean;
    cortana: boolean;
  };
  deepLinks: {
    booking: string;
    services: string;
    contact: string;
    appointments: string;
    pricing: string;
  };
  customActions: VoiceAssistantAction[];
  language: string;
  fallbackUrl: string;
}

export interface VoiceCommand {
  assistant: 'siri' | 'google' | 'alexa' | 'cortana' | 'web-speech';
  intent: string;
  parameters: Record<string, any>;
  confidence: number;
  timestamp: Date;
}

export interface BookingAction {
  type: 'book' | 'reschedule' | 'cancel' | 'inquire';
  service?: string;
  datetime?: string;
  provider?: string;
  duration?: number;
  notes?: string;
}

interface VoiceAssistantStore {
  // Configuration
  config: VoiceAssistantConfig;

  // State
  isActive: boolean;
  isListening: boolean;
  lastCommand: VoiceCommand | null;
  processingQueue: VoiceCommand[];
  conversationHistory: Array<{
    type: 'user' | 'assistant';
    text: string;
    timestamp: Date;
  }>;

  // Actions
  initialize: () => void;
  activate: () => void;
  deactivate: () => void;
  registerAction: (action: VoiceAssistantAction) => void;
  unregisterAction: (actionId: string) => void;
  processCommand: (command: VoiceCommand) => Promise<void>;
  handleBookingAction: (action: BookingAction) => Promise<void>;
  handleServiceInquiry: (service: string) => Promise<void>;
  handleNavigation: (destination: string) => void;
  speakResponse: (text: string, options?: any) => Promise<void>;
  generateDeepLink: (action: string, params?: Record<string, any>) => string;
  addCustomAction: (action: VoiceAssistantAction) => void;
  updateConfiguration: (config: Partial<VoiceAssistantConfig>) => void;
  reset: () => void;
}

export const useVoiceAssistant = create<VoiceAssistantStore>()(
  persist(
    (set, get) => ({
      // Default configuration
      config: {
        enabled: false,
        assistants: {
          siri: true,
          google: true,
          alexa: true,
          cortana: false
        },
        deepLinks: {
          booking: '/booking',
          services: '/services',
          contact: '/contact',
          appointments: '/appointments',
          pricing: '/pricing'
        },
        customActions: [],
        language: 'pl-PL',
        fallbackUrl: 'https://mariaborysevych.com'
      },

      // Initial state
      isActive: false,
      isListening: false,
      lastCommand: null,
      processingQueue: [],
      conversationHistory: [],

      // Initialize voice assistant integration
      initialize: () => {
        const store = get();

        // Register default actions
        store.registerDefaultActions();

        // Set up web speech API for browser-based voice assistants
        store.setupWebSpeechAPI();

        // Register service worker for voice assistant support
        store.registerServiceWorker();

        // Set up deep link handling
        store.setupDeepLinkHandling();

        // Initialize schema markup
        store.initializeSchemaMarkup();
      },

      // Activate voice assistant
      activate: () => {
        const store = get();

        set({ isActive: true });

        // Start listening for voice commands
        store.startListening();

        // Announce activation
        store.speakResponse('Voice assistant activated. How can I help you today?');

        // Update manifest for voice assistant registration
        store.updateWebAppManifest();
      },

      // Deactivate voice assistant
      deactivate: () => {
        const store = get();

        set({
          isActive: false,
          isListening: false
        });

        // Stop listening
        store.stopListening();

        // Announce deactivation
        store.speakResponse('Voice assistant deactivated.');
      },

      // Register custom action
      registerAction: (action: VoiceAssistantAction) => {
        set(state => ({
          config: {
            ...state.config,
            customActions: [...state.config.customActions, action]
          }
        }));
      },

      // Unregister action
      unregisterAction: (actionId: string) => {
        set(state => ({
          config: {
            ...state.config,
            customActions: state.config.customActions.filter(a => a.id !== actionId)
          }
        }));
      },

      // Process voice command
      processCommand: async (command: VoiceCommand) => {
        const store = get();

        set({ lastCommand: command });

        // Add to conversation history
        set(state => ({
          conversationHistory: [...state.conversationHistory, {
            type: 'user',
            text: `${command.intent}: ${JSON.stringify(command.parameters)}`,
            timestamp: new Date()
          }]
        }));

        try {
          // Find matching action
          const action = store.findMatchingAction(command.intent);

          if (action && action.enabled) {
            await action.handler(command.parameters);
          } else {
            await store.handleUnknownCommand(command);
          }
        } catch (error) {
          console.error('Error processing voice command:', error);
          await store.speakResponse('Sorry, I encountered an error processing your request. Please try again.');
        }
      },

      // Handle booking action
      handleBookingAction: async (action: BookingAction) => {
        const store = get();

        switch (action.type) {
          case 'book':
            await store.handleBookingRequest(action);
            break;
          case 'reschedule':
            await store.handleRescheduleRequest(action);
            break;
          case 'cancel':
            await store.handleCancelRequest(action);
            break;
          case 'inquire':
            await store.handleBookingInquiry(action);
            break;
        }
      },

      // Handle service inquiry
      handleServiceInquiry: async (service: string) => {
        const store = get();

        // Search for service
        const serviceInfo = await store.searchService(service);

        if (serviceInfo) {
          const response = `I found ${serviceInfo.name}. ${serviceInfo.description}. The price is ${serviceInfo.price} and the duration is ${serviceInfo.duration}. Would you like to book this service?`;
          await store.speakResponse(response);

          // Navigate to service page
          window.location.href = serviceInfo.url;
        } else {
          await store.speakResponse(`I couldn't find a service called "${service}". Would you like me to show you all available services?`);
        }
      },

      // Handle navigation command
      handleNavigation: (destination: string) => {
        const store = get();
        const { config } = store;

        const routes: Record<string, string> = {
          'home': '/',
          'main': '/',
          'services': config.deepLinks.services,
          'booking': config.deepLinks.booking,
          'contact': config.deepLinks.contact,
          'appointments': config.deepLinks.appointments,
          'pricing': config.deepLinks.pricing,
          'about': '/about'
        };

        const route = routes[destination.toLowerCase()];

        if (route) {
          window.location.href = route;
          store.speakResponse(`Navigating to ${destination}`);
        } else {
          store.speakResponse(`I don't know how to navigate to "${destination}". Available destinations are: ${Object.keys(routes).join(', ')}`);
        }
      },

      // Speak response using available TTS
      speakResponse: async (text: string, options: any = {}) => {
        const store = get();

        // Add to conversation history
        set(state => ({
          conversationHistory: [...state.conversationHistory, {
            type: 'assistant',
            text,
            timestamp: new Date()
          }]
        }));

        // Try different TTS methods based on assistant
        if ('speechSynthesis' in window) {
          await store.speakWithWebSpeech(text, options);
        } else {
          // Fallback to visual feedback
          store.showVisualResponse(text);
        }
      },

      // Generate deep link for voice actions
      generateDeepLink: (action: string, params: Record<string, any> = {}): string => {
        const store = get();
        const { config } = store;

        const baseUrl = window.location.origin;

        switch (action) {
          case 'booking':
            const bookingParams = new URLSearchParams(params).toString();
            return `${baseUrl}${config.deepLinks.booking}?${bookingParams}`;

          case 'service':
            return `${baseUrl}${config.deepLinks.services}/${params.service || ''}`;

          case 'contact':
            return `${baseUrl}${config.deepLinks.contact}`;

          default:
            return `${baseUrl}?action=${action}&${new URLSearchParams(params).toString()}`;
        }
      },

      // Add custom action
      addCustomAction: (action: VoiceAssistantAction) => {
        store.registerAction(action);
      },

      // Update configuration
      updateConfiguration: (newConfig: Partial<VoiceAssistantConfig>) => {
        set(state => ({
          config: { ...state.config, ...newConfig }
        }));
      },

      // Reset all state
      reset: () => {
        set({
          isActive: false,
          isListening: false,
          lastCommand: null,
          processingQueue: [],
          conversationHistory: []
        });
      },

      // Internal methods
      registerDefaultActions: () => {
        const store = get();

        // Booking actions
        store.registerAction({
          id: 'book-appointment',
          name: 'Book Appointment',
          description: 'Book a beauty or fitness appointment',
          utterances: [
            'book appointment',
            'make appointment',
            'schedule appointment',
            'zarezerwuj wizytę',
            'umów się'
          ],
          intent: 'book_appointment',
          parameters: { service: 'string', datetime: 'string' },
          handler: async (params) => {
            await store.handleBookingAction({
              type: 'book',
              service: params.service,
              datetime: params.datetime
            });
          },
          enabled: true
        });

        // Service discovery
        store.registerAction({
          id: 'find-services',
          name: 'Find Services',
          description: 'Find available beauty and fitness services',
          utterances: [
            'what services do you offer',
            'show services',
            'find services',
            'jakie usługi oferujesz',
            'pokaż usługi'
          ],
          intent: 'find_services',
          parameters: { category: 'string' },
          handler: async (params) => {
            if (params.category) {
              await store.handleServiceInquiry(params.category);
            } else {
              window.location.href = store.config.deepLinks.services;
              await store.speakResponse('Here are all our available services');
            }
          },
          enabled: true
        });

        // Navigation
        store.registerAction({
          id: 'navigate',
          name: 'Navigate',
          description: 'Navigate to different pages',
          utterances: [
            'go to {page}',
            'navigate to {page}',
            'show me {page}',
            'przejdź do {page}',
            'pokaż {page}'
          ],
          intent: 'navigate',
          parameters: { page: 'string' },
          handler: async (params) => {
            store.handleNavigation(params.page);
          },
          enabled: true
        });

        // Contact information
        store.registerAction({
          id: 'contact-info',
          name: 'Contact Information',
          description: 'Get contact information',
          utterances: [
            'how can I contact you',
            'contact information',
            'phone number',
            'jak się skontaktować',
            'numer telefonu'
          ],
          intent: 'contact_info',
          parameters: {},
          handler: async () => {
            await store.speakResponse('You can contact us by phone at +48 123 456 789, or visit our contact page. Would you like me to navigate there?');
            window.location.href = store.config.deepLinks.contact;
          },
          enabled: true
        });

        // Pricing
        store.registerAction({
          id: 'pricing-info',
          name: 'Pricing Information',
          description: 'Get pricing information',
          utterances: [
            'how much does it cost',
            'pricing',
            'prices',
            'ile to kosztuje',
            'cennik'
          ],
          intent: 'pricing_info',
          parameters: { service: 'string' },
          handler: async (params) => {
            if (params.service) {
              await store.handleServiceInquiry(params.service);
            } else {
              window.location.href = store.config.deepLinks.pricing;
              await store.speakResponse('Here is our pricing information');
            }
          },
          enabled: true
        });

        // Help
        store.registerAction({
          id: 'help',
          name: 'Help',
          description: 'Get help and available commands',
          utterances: [
            'help',
            'what can you do',
            'available commands',
            'pomoc',
            'co możesz zrobić'
          ],
          intent: 'help',
          parameters: {},
          handler: async () => {
            const actions = store.config.customActions.filter(a => a.enabled);
            const commandList = actions.map(a => a.name).join(', ');
            await store.speakResponse(`I can help you book appointments, find services, navigate pages, get pricing information, and contact details. Available commands include: ${commandList}`);
          },
          enabled: true
        });
      },

      setupWebSpeechAPI: () => {
        // Setup for browser-based voice assistant integration
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
          const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
          const recognition = new SpeechRecognition();

          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = get().config.language;

          recognition.onresult = (event: SpeechRecognitionEvent) => {
            for (let i = event.resultIndex; i < event.results.length; i++) {
              if (event.results[i].isFinal) {
                const transcript = event.results[i][0].transcript;
                store.processVoiceInput(transcript);
              }
            }
          };

          recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            console.error('Speech recognition error:', event.error);
          };

          (get() as any).recognition = recognition;
        }
      },

      registerServiceWorker: async () => {
        // Register service worker for voice assistant support
        if ('serviceWorker' in navigator) {
          try {
            const registration = await navigator.serviceWorker.register('/sw-voice-assistant.js');
            console.log('Voice assistant service worker registered:', registration);
          } catch (error) {
            console.error('Failed to register service worker:', error);
          }
        }
      },

      setupDeepLinkHandling: () => {
        // Handle deep links from voice assistants
        const urlParams = new URLSearchParams(window.location.search);
        const action = urlParams.get('action');
        const assistant = urlParams.get('assistant');

        if (action && assistant) {
          const command: VoiceCommand = {
            assistant: assistant as any,
            intent: action,
            parameters: Object.fromEntries(urlParams.entries()),
            confidence: 1.0,
            timestamp: new Date()
          };

          get().processCommand(command);
        }
      },

      initializeSchemaMarkup: () => {
        // Add JSON-LD schema markup for voice assistant optimization
        const schema = {
          '@context': 'https://schema.org',
          '@type': 'BeautySalon',
          name: 'mariiaborysevych - Beauty & Fitness',
          url: 'https://mariaborysevych.com',
          telephone: '+48 123 456 789',
          address: {
            '@type': 'PostalAddress',
            streetAddress: 'ul. Jana Pawła II 43/15',
            addressLocality: 'Warszawa',
            addressCountry: 'PL'
          },
          openingHours: 'Mo-Su 09:00-21:00',
          offers: {
            '@type': 'Offer',
            priceCurrency: 'PLN'
          },
          potentialAction: {
            '@type': 'ReserveAction',
            target: 'https://mariaborysevych.com/booking',
            result: {
              '@type': 'Reservation',
              name: 'Beauty Service Appointment'
            }
          }
        };

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(schema);
        document.head.appendChild(script);
      },

      startListening: () => {
        const store = get();
        const recognition = (store as any).recognition;

        if (recognition) {
          try {
            recognition.start();
            set({ isListening: true });
          } catch (error) {
            console.error('Failed to start speech recognition:', error);
          }
        }
      },

      stopListening: () => {
        const store = get();
        const recognition = (store as any).recognition;

        if (recognition) {
          recognition.stop();
          set({ isListening: false });
        }
      },

      processVoiceInput: async (input: string) => {
        const store = get();

        // Simple intent recognition (in production, would use NLP)
        const intent = store.recognizeIntent(input);
        const parameters = store.extractParameters(input, intent);

        const command: VoiceCommand = {
          assistant: 'web-speech',
          intent,
          parameters,
          confidence: 0.8,
          timestamp: new Date()
        };

        await store.processCommand(command);
      },

      recognizeIntent: (input: string): string => {
        const text = input.toLowerCase();

        // Simple keyword matching for intent recognition
        if (text.includes('book') || text.includes('appointment') || text.includes('zarezerwuj') || text.includes('umów')) {
          return 'book_appointment';
        } else if (text.includes('service') || text.includes('offer') || text.includes('usługa')) {
          return 'find_services';
        } else if (text.includes('go to') || text.includes('navigate') || text.includes('przejdź')) {
          return 'navigate';
        } else if (text.includes('contact') || text.includes('phone') || text.includes('skontaktuj')) {
          return 'contact_info';
        } else if (text.includes('price') || text.includes('cost') || text.includes('cena')) {
          return 'pricing_info';
        } else if (text.includes('help') || text.includes('pomoc')) {
          return 'help';
        }

        return 'unknown';
      },

      extractParameters: (input: string, intent: string): Record<string, any> => {
        const params: Record<string, any> = {};

        switch (intent) {
          case 'book_appointment':
            // Extract service type
            if (input.includes('beauty') || input.includes('kosmetyczne')) {
              params.service = 'beauty';
            } else if (input.includes('fitness') || input.includes('trening')) {
              params.service = 'fitness';
            }
            break;

          case 'navigate':
            // Extract destination
            const destinations = ['home', 'services', 'booking', 'contact', 'pricing'];
            for (const dest of destinations) {
              if (input.includes(dest)) {
                params.page = dest;
                break;
              }
            }
            break;
        }

        return params;
      },

      findMatchingAction: (intent: string): VoiceAssistantAction | null => {
        const store = get();
        return store.config.customActions.find(action => action.intent === intent) || null;
      },

      handleUnknownCommand: async (command: VoiceCommand) => {
        const response = `I'm not sure how to handle "${command.intent}". You can ask me to book appointments, find services, navigate pages, get pricing, or contact information. Say "help" for more options.`;
        await get().speakResponse(response);
      },

      handleBookingRequest: async (action: BookingAction) => {
        const store = get();

        if (action.service) {
          const deepLink = store.generateDeepLink('booking', { service: action.service });
          window.location.href = deepLink;
          await store.speakResponse(`I'll help you book a ${action.service} appointment. Please select your preferred date and time.`);
        } else {
          window.location.href = store.config.deepLinks.booking;
          await store.speakResponse('I\'ll help you book an appointment. Please select the service you\'d like to book.');
        }
      },

      handleRescheduleRequest: async (action: BookingAction) => {
        await get().speakResponse('To reschedule your appointment, please visit your appointments page or contact us directly.');
        window.location.href = store.config.deepLinks.appointments;
      },

      handleCancelRequest: async (action: BookingAction) => {
        await get().speakResponse('To cancel your appointment, please visit your appointments page or contact us directly.');
        window.location.href = store.config.deepLinks.appointments;
      },

      handleBookingInquiry: async (action: BookingAction) => {
        await get().speakResponse('I can help you with booking information. Would you like to see available appointments or book a new one?');
      },

      searchService: async (serviceName: string): Promise<any> => {
        // Simulate service search (in production, would query actual service database)
        const services = [
          { name: 'Lip Enhancement', description: 'Professional lip enhancement treatments', price: '500 PLN', duration: '60 minutes', url: '/services/lip-enhancement' },
          { name: 'Brow Lamination', description: 'Perfectly shaped brows with lamination', price: '200 PLN', duration: '45 minutes', url: '/services/brow-lamination' },
          { name: 'Personal Training', description: 'One-on-one fitness training sessions', price: '150 PLN', duration: '60 minutes', url: '/services/personal-training' }
        ];

        return services.find(s => s.name.toLowerCase().includes(serviceName.toLowerCase()));
      },

      speakWithWebSpeech: async (text: string, options: any) => {
        return new Promise((resolve, reject) => {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.lang = get().config.language;
          utterance.rate = options.rate || 0.9;
          utterance.pitch = options.pitch || 1.0;
          utterance.volume = options.volume || 0.8;

          utterance.onend = () => resolve();
          utterance.onerror = (event) => reject(event.error);

          speechSynthesis.speak(utterance);
        });
      },

      showVisualResponse: (text: string) => {
        // Create visual notification for non-audio feedback
        const notification = document.createElement('div');
        notification.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #007bff;
          color: white;
          padding: 15px 20px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          z-index: 10000;
          max-width: 300px;
          animation: slideInRight 0.3s ease-out;
        `;
        notification.textContent = text;

        document.body.appendChild(notification);

        setTimeout(() => {
          notification.style.animation = 'slideOutRight 0.3s ease-in';
          setTimeout(() => notification.remove(), 300);
        }, 5000);
      },

      updateWebAppManifest: () => {
        // Update web app manifest for voice assistant registration
        const manifest = {
          name: 'mariiaborysevych - Voice Assistant',
          short_name: 'mariiaborysevych',
          description: 'Beauty and fitness services with voice assistant integration',
          lang: 'pl',
          start_url: '/',
          display: 'standalone',
          background_color: '#ffffff',
          theme_color: '#a8876a',
          voice_commands: [
            'book appointment',
            'find services',
            'get pricing',
            'contact us'
          ]
        };

        const manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        manifestLink.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(manifest));
        document.head.appendChild(manifestLink);
      }
    }),
    {
      name: 'voice-assistant-store',
      partialize: (state) => ({
        config: state.config,
        conversationHistory: state.conversationHistory.slice(-10), // Keep last 10
      }),
    }
  )
);

// React hook for voice assistant
export const useVoiceAssistantControls = () => {
  const store = useVoiceAssistant();

  const initialize = () => {
    store.initialize();
  };

  const toggleAssistant = () => {
    if (store.isActive) {
      store.deactivate();
    } else {
      store.activate();
    }
  };

  const startListening = () => {
    if (store.isActive) {
      store.startListening();
    }
  };

  const stopListening = () => {
    store.stopListening();
  };

  const processTextCommand = async (text: string) => {
    const intent = store.recognizeIntent(text);
    const parameters = store.extractParameters(text, intent);

    const command: VoiceCommand = {
      assistant: 'manual',
      intent,
      parameters,
      confidence: 1.0,
      timestamp: new Date()
    };

    await store.processCommand(command);
  };

  const createBookingDeepLink = (service: string, date?: string) => {
    return store.generateDeepLink('booking', { service, datetime: date });
  };

  const createServiceDeepLink = (service: string) => {
    return store.generateDeepLink('service', { service });
  };

  return {
    ...store,
    initialize,
    toggleAssistant,
    startListening,
    stopListening,
    processTextCommand,
    createBookingDeepLink,
    createServiceDeepLink,
  };
};

export default useVoiceAssistant;