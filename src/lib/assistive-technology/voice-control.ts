/**
 * Voice Control and Speech Recognition System
 *
 * Comprehensive voice control implementation for the mariia-hub platform
 * supporting booking flows, navigation, form filling, and admin functions.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types for voice recognition
export interface VoiceCommand {
  id: string;
  phrases: string[];
  action: () => void | Promise<void>;
  description: string;
  contexts: string[];
  enabled: boolean;
}

export interface VoiceRecognitionState {
  isListening: boolean;
  isSupported: boolean;
  isEnabled: boolean;
  confidence: number;
  lastTranscript: string;
  language: string;
  error: string | null;
  feedback: string | null;
}

export interface VoiceFeedbackOptions {
  text?: string;
  pitch?: number;
  rate?: number;
  volume?: number;
  voice?: SpeechSynthesisVoice;
  lang?: string;
}

// Voice recognition store
interface VoiceStore extends VoiceRecognitionState {
  recognition: SpeechRecognition | null;
  synthesis: SpeechSynthesis | null;

  // Actions
  initialize: () => Promise<boolean>;
  startListening: () => Promise<void>;
  stopListening: () => void;
  toggleListening: () => Promise<void>;
  speak: (text: string, options?: VoiceFeedbackOptions) => Promise<void>;
  cancelSpeaking: () => void;
  setLanguage: (language: string) => void;
  setError: (error: string | null) => void;
  setFeedback: (feedback: string | null) => void;
  resetState: () => void;
}

export const useVoiceStore = create<VoiceStore>()(
  persist(
    (set, get) => ({
      // Initial state
      isListening: false,
      isSupported: false,
      isEnabled: false,
      confidence: 0,
      lastTranscript: '',
      language: 'pl-PL',
      error: null,
      feedback: null,
      recognition: null,
      synthesis: null,

      // Initialize speech recognition and synthesis
      initialize: async () => {
        try {
          // Check for browser support
          const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
          const speechSynthesis = window.speechSynthesis;

          if (!SpeechRecognition || !speechSynthesis) {
            set({
              error: 'Speech recognition is not supported in this browser',
              isSupported: false
            });
            return false;
          }

          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = get().language;

          // Set up event handlers
          recognition.onstart = () => {
            set({
              isListening: true,
              error: null,
              feedback: 'Listening...'
            });
          };

          recognition.onend = () => {
            set({
              isListening: false,
              feedback: null
            });
          };

          recognition.onresult = (event: SpeechRecognitionEvent) => {
            let finalTranscript = '';
            let interimTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
              const transcript = event.results[i][0].transcript;

              if (event.results[i].isFinal) {
                finalTranscript += transcript;
                set({
                  lastTranscript: finalTranscript,
                  confidence: event.results[i][0].confidence,
                  feedback: 'Processing command...'
                });

                // Process the voice command
                processVoiceCommand(finalTranscript.toLowerCase());
              } else {
                interimTranscript += transcript;
                set({
                  lastTranscript: interimTranscript,
                  confidence: event.results[i][0].confidence
                });
              }
            }
          };

          recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
            let errorMessage = 'Speech recognition error';

            switch (event.error) {
              case 'no-speech':
                errorMessage = 'No speech detected. Please try again.';
                break;
              case 'audio-capture':
                errorMessage = 'Microphone not available. Please check permissions.';
                break;
              case 'not-allowed':
                errorMessage = 'Microphone permission denied. Please allow microphone access.';
                break;
              case 'network':
                errorMessage = 'Network error. Please check your connection.';
                break;
              default:
                errorMessage = `Error: ${event.error}`;
            }

            set({
              error: errorMessage,
              isListening: false,
              feedback: null
            });

            // Speak error feedback
            get().speak(errorMessage);
          };

          set({
            recognition,
            synthesis: speechSynthesis,
            isSupported: true,
            isEnabled: true
          });

          return true;
        } catch (error) {
          set({
            error: 'Failed to initialize voice recognition',
            isSupported: false
          });
          return false;
        }
      },

      // Start listening for voice commands
      startListening: async () => {
        const { recognition, isSupported, isEnabled } = get();

        if (!isSupported || !recognition || !isEnabled) {
          set({ error: 'Voice recognition not available or disabled' });
          return;
        }

        try {
          recognition.start();
        } catch (error) {
          set({ error: 'Failed to start voice recognition' });
        }
      },

      // Stop listening
      stopListening: () => {
        const { recognition } = get();

        if (recognition) {
          recognition.stop();
        }

        set({
          isListening: false,
          feedback: null
        });
      },

      // Toggle listening state
      toggleListening: async () => {
        const { isListening } = get();

        if (isListening) {
          get().stopListening();
        } else {
          await get().startListening();
        }
      },

      // Text-to-speech
      speak: async (text: string, options: VoiceFeedbackOptions = {}) => {
        const { synthesis, isEnabled } = get();

        if (!synthesis || !isEnabled) return;

        // Cancel any ongoing speech
        synthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        // Apply options
        if (options.pitch !== undefined) utterance.pitch = options.pitch;
        if (options.rate !== undefined) utterance.rate = options.rate;
        if (options.volume !== undefined) utterance.volume = options.volume;
        if (options.lang) utterance.lang = options.lang;
        if (options.voice) utterance.voice = options.voice;

        // Set defaults for luxury experience
        utterance.pitch = options.pitch || 1.0;
        utterance.rate = options.rate || 0.9;
        utterance.volume = options.volume || 0.8;
        utterance.lang = options.lang || get().language;

        return new Promise((resolve, reject) => {
          utterance.onend = () => resolve();
          utterance.onerror = (event) => reject(event.error);

          synthesis.speak(utterance);
        });
      },

      // Cancel speaking
      cancelSpeaking: () => {
        const { synthesis } = get();

        if (synthesis) {
          synthesis.cancel();
        }
      },

      // Set language
      setLanguage: (language: string) => {
        const { recognition } = get();

        set({ language });

        if (recognition) {
          recognition.lang = language;
        }
      },

      // Set error
      setError: (error: string | null) => {
        set({ error });
      },

      // Set feedback
      setFeedback: (feedback: string | null) => {
        set({ feedback });
      },

      // Reset state
      resetState: () => {
        set({
          isListening: false,
          confidence: 0,
          lastTranscript: '',
          error: null,
          feedback: null
        });
      },
    }),
    {
      name: 'voice-store',
      partialize: (state) => ({
        isEnabled: state.isEnabled,
        language: state.language,
      }),
    }
  )
);

// Voice command definitions and registration
class VoiceCommandRegistry {
  private commands: Map<string, VoiceCommand> = new Map();
  private contextCommands: Map<string, Set<string>> = new Map();

  register(command: VoiceCommand) {
    this.commands.set(command.id, command);

    // Register by contexts
    command.contexts.forEach(context => {
      if (!this.contextCommands.has(context)) {
        this.contextCommands.set(context, new Set());
      }
      this.contextCommands.get(context)!.add(command.id);
    });
  }

  unregister(commandId: string) {
    const command = this.commands.get(commandId);
    if (command) {
      // Remove from contexts
      command.contexts.forEach(context => {
        this.contextCommands.get(context)?.delete(commandId);
      });

      this.commands.delete(commandId);
    }
  }

  getMatchingCommands(transcript: string, context: string = 'global'): VoiceCommand[] {
    const commands: VoiceCommand[] = [];

    // Get commands for current context and global
    const contextIds = this.contextCommands.get(context) || new Set();
    const globalIds = this.contextCommands.get('global') || new Set();

    const relevantIds = new Set([...contextIds, ...globalIds]);

    relevantIds.forEach(commandId => {
      const command = this.commands.get(commandId);
      if (command && command.enabled) {
        // Check if any phrase matches
        const matches = command.phrases.some(phrase =>
          transcript.includes(phrase.toLowerCase()) ||
          phrase.toLowerCase().includes(transcript)
        );

        if (matches) {
          commands.push(command);
        }
      }
    });

    return commands;
  }

  getCommandsByContext(context: string): VoiceCommand[] {
    const commandIds = this.contextCommands.get(context) || new Set();
    const globalIds = this.contextCommands.get('global') || new Set();

    const allIds = new Set([...commandIds, ...globalIds]);

    return Array.from(allIds)
      .map(id => this.commands.get(id))
      .filter((cmd): cmd is VoiceCommand => cmd !== undefined && cmd.enabled);
  }
}

export const voiceCommandRegistry = new VoiceCommandRegistry();

// Process voice commands
async function processVoiceCommand(transcript: string) {
  const store = useVoiceStore.getState();

  // Get current context (you can enhance this based on current page/component)
  const currentContext = getCurrentContext();

  const matchingCommands = voiceCommandRegistry.getMatchingCommands(transcript, currentContext);

  if (matchingCommands.length === 0) {
    store.speak('Command not recognized. Please try again.');
    store.setFeedback('No matching command found');
    return;
  }

  // Execute the first matching command (highest priority)
  const command = matchingCommands[0];

  try {
    store.setFeedback(`Executing: ${command.description}`);
    store.speak(`Executing ${command.description}`);

    await command.action();

    store.setFeedback('Command completed successfully');

    // Announce success after a brief delay
    setTimeout(() => {
      store.speak('Command completed');
    }, 500);

  } catch (error) {
    const errorMsg = 'Failed to execute command. Please try again.';
    store.setError(errorMsg);
    store.speak(errorMsg);
  } finally {
    // Clear feedback after 2 seconds
    setTimeout(() => {
      store.setFeedback(null);
    }, 2000);
  }
}

// Helper function to determine current context
function getCurrentContext(): string {
  const path = window.location.pathname;

  if (path.includes('/booking')) return 'booking';
  if (path.includes('/admin')) return 'admin';
  if (path.includes('/services')) return 'services';
  if (path.includes('/blog')) return 'blog';
  if (path.includes('/contact')) return 'contact';

  return 'global';
}

// React hook for voice control
export const useVoiceControl = () => {
  const store = useVoiceStore();

  const initialize = async () => {
    const success = await store.initialize();
    if (success) {
      // Register default commands
      registerDefaultCommands();
    }
    return success;
  };

  const registerCommand = (command: VoiceCommand) => {
    voiceCommandRegistry.register(command);
  };

  const unregisterCommand = (commandId: string) => {
    voiceCommandRegistry.unregister(commandId);
  };

  const getAvailableCommands = (context?: string) => {
    const ctx = context || getCurrentContext();
    return voiceCommandRegistry.getCommandsByContext(ctx);
  };

  return {
    ...store,
    initialize,
    registerCommand,
    unregisterCommand,
    getAvailableCommands,
  };
};

// Register default voice commands
function registerDefaultCommands() {
  // Navigation commands
  voiceCommandRegistry.register({
    id: 'nav-home',
    phrases: ['go home', 'home', 'strona główna', 'wróć do domu'],
    action: () => window.location.href = '/',
    description: 'Navigate to home page',
    contexts: ['global'],
    enabled: true,
  });

  voiceCommandRegistry.register({
    id: 'nav-services',
    phrases: ['show services', 'services', 'usługi', 'pokaż usługi'],
    action: () => window.location.href = '/services',
    description: 'Navigate to services page',
    contexts: ['global'],
    enabled: true,
  });

  voiceCommandRegistry.register({
    id: 'nav-booking',
    phrases: ['book appointment', 'book now', 'make booking', 'zarezerwuj', 'umów wizytę'],
    action: () => window.location.href = '/booking',
    description: 'Start booking process',
    contexts: ['global'],
    enabled: true,
  });

  voiceCommandRegistry.register({
    id: 'nav-contact',
    phrases: ['contact us', 'contact', 'kontakt', 'skontaktuj się'],
    action: () => window.location.href = '/contact',
    description: 'Navigate to contact page',
    contexts: ['global'],
    enabled: true,
  });

  // Booking flow commands
  voiceCommandRegistry.register({
    id: 'booking-next',
    phrases: ['next step', 'next', 'dalej', 'następny krok'],
    action: () => {
      const nextButton = document.querySelector('[data-testid="booking-next"], button:contains("Next"), button:contains("Dalej")') as HTMLElement;
      if (nextButton) nextButton.click();
    },
    description: 'Move to next booking step',
    contexts: ['booking'],
    enabled: true,
  });

  voiceCommandRegistry.register({
    id: 'booking-back',
    phrases: ['previous step', 'back', 'wróć', 'poprzedni krok'],
    action: () => {
      const backButton = document.querySelector('[data-testid="booking-back"], button:contains("Back"), button:contains("Wróć")') as HTMLElement;
      if (backButton) backButton.click();
    },
    description: 'Go back to previous booking step',
    contexts: ['booking'],
    enabled: true,
  });

  voiceCommandRegistry.register({
    id: 'booking-confirm',
    phrases: ['confirm booking', 'confirm', 'potwierdź', 'zatwierdź rezerwację'],
    action: () => {
      const confirmButton = document.querySelector('[data-testid="booking-confirm"], button:contains("Confirm"), button:contains("Potwierdź")') as HTMLElement;
      if (confirmButton) confirmButton.click();
    },
    description: 'Confirm booking',
    contexts: ['booking'],
    enabled: true,
  });

  // Service selection commands
  voiceCommandRegistry.register({
    id: 'service-beauty',
    phrases: ['beauty services', 'beauty', 'piękność', 'usługi kosmetyczne'],
    action: () => {
      const beautyButton = document.querySelector('[data-testid="beauty-services"], button:contains("Beauty"), button:contains("Piękność")') as HTMLElement;
      if (beautyButton) beautyButton.click();
    },
    description: 'Select beauty services',
    contexts: ['services', 'booking'],
    enabled: true,
  });

  voiceCommandRegistry.register({
    id: 'service-fitness',
    phrases: ['fitness programs', 'fitness', 'fitness programy', 'treningi'],
    action: () => {
      const fitnessButton = document.querySelector('[data-testid="fitness-services"], button:contains("Fitness"), button:contains("Treningi")') as HTMLElement;
      if (fitnessButton) fitnessButton.click();
    },
    description: 'Select fitness programs',
    contexts: ['services', 'booking'],
    enabled: true,
  });

  // Form filling commands
  voiceCommandRegistry.register({
    id: 'form-fill',
    phrases: ['fill form', 'wypełnij formularz', 'auto fill'],
    action: () => {
      // Trigger form auto-fill logic
      const event = new CustomEvent('voice-fill-form');
      document.dispatchEvent(event);
    },
    description: 'Automatically fill current form',
    contexts: ['booking', 'contact'],
    enabled: true,
  });

  // Search commands
  voiceCommandRegistry.register({
    id: 'search',
    phrases: ['search', 'szukaj', 'wyszukaj'],
    action: () => {
      const searchInput = document.querySelector('input[type="search"], [data-testid="search"]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
        useVoiceStore.getState().speak('What would you like to search for?');
      }
    },
    description: 'Focus search input',
    contexts: ['global'],
    enabled: true,
  });

  // Accessibility commands
  voiceCommandRegistry.register({
    id: 'accessibility-help',
    phrases: ['accessibility help', 'help', 'pomoc', 'pomoc dostępowość'],
    action: () => {
      useVoiceStore.getState().speak('Available voice commands include: navigate to pages, book appointments, select services, fill forms, and search. Say "list commands" to hear all available commands.');
    },
    description: 'Get accessibility help',
    contexts: ['global'],
    enabled: true,
  });

  voiceCommandRegistry.register({
    id: 'list-commands',
    phrases: ['list commands', 'what can I say', 'komendy', 'co mogę powiedzieć'],
    action: () => {
      const context = getCurrentContext();
      const commands = voiceCommandRegistry.getCommandsByContext(context);
      const commandList = commands.map(cmd => cmd.description).join('. ');
      useVoiceStore.getState().speak(`Available commands: ${commandList}`);
    },
    description: 'List available commands',
    contexts: ['global'],
    enabled: true,
  });

  // Admin commands
  voiceCommandRegistry.register({
    id: 'admin-dashboard',
    phrases: ['admin dashboard', 'panel', 'kokpit', 'admin panel'],
    action: () => {
      if (window.location.pathname.includes('/admin')) {
        const dashboardLink = document.querySelector('[data-testid="dashboard-link"], a:contains("Dashboard")') as HTMLElement;
        if (dashboardLink) dashboardLink.click();
      }
    },
    description: 'Navigate to admin dashboard',
    contexts: ['admin'],
    enabled: true,
  });

  voiceCommandRegistry.register({
    id: 'admin-analytics',
    phrases: ['show analytics', 'analytics', 'statystyki', 'analiza'],
    action: () => {
      const analyticsLink = document.querySelector('[data-testid="analytics-link"], a:contains("Analytics")') as HTMLElement;
      if (analyticsLink) analyticsLink.click();
    },
    description: 'Show analytics dashboard',
    contexts: ['admin'],
    enabled: true,
  });

  // Voice control commands
  voiceCommandRegistry.register({
    id: 'voice-start',
    phrases: ['start listening', 'start voice', 'włącz głos', 'zacznij słuchać'],
    action: () => {
      useVoiceStore.getState().startListening();
    },
    description: 'Start voice control',
    contexts: ['global'],
    enabled: true,
  });

  voiceCommandRegistry.register({
    id: 'voice-stop',
    phrases: ['stop listening', 'stop voice', 'wyłącz głos', 'przestań słuchać'],
    action: () => {
      useVoiceStore.getState().stopListening();
    },
    description: 'Stop voice control',
    contexts: ['global'],
    enabled: true,
  });

  voiceCommandRegistry.register({
    id: 'voice-toggle',
    phrases: ['toggle voice', 'przełącz głos', 'włącz/wyłącz głos'],
    action: () => {
      useVoiceStore.getState().toggleListening();
    },
    description: 'Toggle voice control',
    contexts: ['global'],
    enabled: true,
  });
}

export default useVoiceControl;