/**
 * Real-time Captioning System for Video Content
 *
 * Comprehensive real-time captioning with ASR, manual editing,
 * multi-language support, and accessibility features.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types for real-time captioning
export interface CaptionConfig {
  enabled: boolean;
  language: string;
  autoGenerate: boolean;
  displayMode: 'overlay' | 'below' | 'side' | 'custom';
  fontSize: number;
  fontColor: string;
  backgroundColor: string;
  backgroundOpacity: number;
  position: 'top' | 'center' | 'bottom';
  timing: 'synchronized' | 'delayed';
  delay: number; // milliseconds
  maxLines: number;
  wrapText: boolean;
  showTimestamps: boolean;
  highlightCurrentWord: boolean;
  animations: boolean;
}

export interface Caption {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  confidence: number;
  speaker?: string;
  language: string;
  isEdited: boolean;
  editedBy?: string;
  editedAt?: Date;
  keywords: string[];
}

export interface CaptionTrack {
  id: string;
  language: string;
  label: string;
  captions: Caption[];
  isDefault: boolean;
  source: 'auto' | 'manual' | 'uploaded';
  metadata: {
    duration: number;
    wordCount: number;
    accuracy: number;
    generatedAt: Date;
  };
}

export interface CaptionSession {
  id: string;
  videoElement: HTMLVideoElement;
  isActive: boolean;
  currentTrack: CaptionTrack | null;
  currentTime: number;
  activeCaption: Caption | null;
  volume: number;
  playbackRate: number;
}

export interface ASRProvider {
  name: string;
  apiKey?: string;
  language: string;
  confidence: number;
  realTime: boolean;
  supportsPunctuation: boolean;
  supportsSpeakerDiarization: boolean;
}

interface RealTimeCaptioningStore {
  // Configuration
  config: CaptionConfig;

  // State
  isCaptionsEnabled: boolean;
  activeSession: CaptionSession | null;
  captionTracks: Map<string, CaptionTrack>;
  currentTranscript: string;
  isRecording: boolean;
  asrProvider: ASRProvider | null;
  recognitionInstance: any | null;

  // Actions
  initialize: () => void;
  updateConfiguration: (config: Partial<CaptionConfig>) => void;
  enableCaptions: (videoElement: HTMLVideoElement) => void;
  disableCaptions: () => void;
  startRealTimeCaptioning: (videoElement: HTMLVideoElement) => void;
  stopRealTimeCaptioning: () => void;
  addCaptionTrack: (track: CaptionTrack) => void;
  removeCaptionTrack: (trackId: string) => void;
  switchCaptionTrack: (trackId: string) => void;
  editCaption: (captionId: string, newText: string) => void;
  uploadCaptionFile: (file: File, language: string) => Promise<CaptionTrack>;
  exportCaptions: (trackId: string, format: 'srt' | 'vtt' | 'txt') => string;
  searchCaptions: (query: string, trackId?: string) => Caption[];
  adjustTiming: (captionId: string, startTime: number, endTime: number) => void;
  setASRProvider: (provider: ASRProvider) => void;
  transcribeAudio: (audioData: MediaStream) => Promise<Caption>;
  getCaptionAtTime: (time: number, trackId: string) => Caption | null;
  addSpeakerLabel: (captionId: string, speaker: string) => void;
  translateCaptions: (trackId: string, targetLanguage: string) => Promise<CaptionTrack>;
  reset: () => void;
}

export const useRealTimeCaptioning = create<RealTimeCaptioningStore>()(
  persist(
    (set, get) => ({
      // Default configuration
      config: {
        enabled: true,
        language: 'pl',
        autoGenerate: true,
        displayMode: 'overlay',
        fontSize: 16,
        fontColor: '#FFFFFF',
        backgroundColor: '#000000',
        backgroundOpacity: 0.8,
        position: 'bottom',
        timing: 'synchronized',
        delay: 0,
        maxLines: 2,
        wrapText: true,
        showTimestamps: false,
        highlightCurrentWord: false,
        animations: true
      },

      // Initial state
      isCaptionsEnabled: false,
      activeSession: null,
      captionTracks: new Map(),
      currentTranscript: '',
      isRecording: false,
      asrProvider: null,
      recognitionInstance: null,

      // Initialize captioning system
      initialize: () => {
        const store = get();

        // Set up video element detection
        store.setupVideoDetection();

        // Initialize ASR providers
        store.initializeASRProviders();

        // Set up keyboard shortcuts
        store.setupKeyboardShortcuts();

        // Create caption display element
        store.createCaptionDisplay();

        // Set up Web Audio API for audio processing
        store.setupAudioProcessing();
      },

      // Update configuration
      updateConfiguration: (newConfig: Partial<CaptionConfig>) => {
        set(state => ({
          config: { ...state.config, ...newConfig }
        }));

        // Update caption display if active
        const store = get();
        if (store.isCaptionsEnabled) {
          store.updateCaptionDisplay();
        }
      },

      // Enable captions for video
      enableCaptions: (videoElement: HTMLVideoElement) => {
        const store = get();

        const session: CaptionSession = {
          id: `session-${Date.now()}`,
          videoElement,
          isActive: true,
          currentTrack: null,
          currentTime: 0,
          activeCaption: null,
          volume: videoElement.volume,
          playbackRate: videoElement.playbackRate
        };

        set({ activeSession: session, isCaptionsEnabled: true });

        // Set up video event listeners
        store.setupVideoEventListeners(videoElement);

        // Show caption display
        store.showCaptionDisplay();

        // Start real-time captioning if configured
        if (store.config.autoGenerate) {
          store.startRealTimeCaptioning(videoElement);
        }
      },

      // Disable captions
      disableCaptions: () => {
        const store = get();

        if (store.activeSession) {
          store.cleanupVideoEventListeners(store.activeSession.videoElement);
        }

        store.stopRealTimeCaptioning();
        store.hideCaptionDisplay();

        set({
          isCaptionsEnabled: false,
          activeSession: null
        });
      },

      // Start real-time captioning
      startRealTimeCaptioning: (videoElement: HTMLVideoElement) => {
        const store = get();

        if (!store.asrProvider) {
          console.warn('No ASR provider configured');
          return;
        }

        // Create audio context from video element
        const audioContext = new AudioContext();
        const source = audioContext.createMediaElementSource(videoElement);
        const destination = audioContext.createMediaStreamDestination();

        source.connect(destination);
        source.connect(audioContext.destination);

        const audioStream = destination.stream;

        // Start recognition
        store.startAudioRecognition(audioStream);

        set({ isRecording: true });
      },

      // Stop real-time captioning
      stopRealTimeCaptioning: () => {
        const store = get();

        if (store.recognitionInstance) {
          store.recognitionInstance.stop();
          store.recognitionInstance = null;
        }

        set({ isRecording: false, currentTranscript: '' });
      },

      // Add caption track
      addCaptionTrack: (track: CaptionTrack) => {
        set(state => ({
          captionTracks: new Map(state.captionTracks).set(track.id, track)
        }));

        // Set as default if no default track exists
        const store = get();
        const hasDefault = Array.from(store.captionTracks.values()).some(t => t.isDefault);
        if (!hasDefault && store.activeSession) {
          store.switchCaptionTrack(track.id);
        }
      },

      // Remove caption track
      removeCaptionTrack: (trackId: string) => {
        set(state => {
          const newTracks = new Map(state.captionTracks);
          newTracks.delete(trackId);

          // If this was the active track, switch to default
          const newSession = { ...state.activeSession };
          if (state.activeSession?.currentTrack?.id === trackId) {
            const defaultTrack = Array.from(newTracks.values()).find(t => t.isDefault);
            newSession.currentTrack = defaultTrack || null;
          }

          return {
            captionTracks: newTracks,
            activeSession: newSession
          };
        });
      },

      // Switch caption track
      switchCaptionTrack: (trackId: string) => {
        const store = get();
        const track = store.captionTracks.get(trackId);

        if (track && store.activeSession) {
          set(state => ({
            activeSession: {
              ...state.activeSession!,
              currentTrack: track
            }
          }));
        }
      },

      // Edit caption
      editCaption: (captionId: string, newText: string) => {
        set(state => {
          const updatedTracks = new Map(state.captionTracks);

          updatedTracks.forEach((track) => {
            const captionIndex = track.captions.findIndex(c => c.id === captionId);
            if (captionIndex !== -1) {
              track.captions[captionIndex] = {
                ...track.captions[captionIndex],
                text: newText,
                isEdited: true,
                editedAt: new Date()
              };
            }
          });

          return { captionTracks: updatedTracks };
        });
      },

      // Upload caption file
      uploadCaptionFile: async (file: File, language: string): Promise<CaptionTrack> => {
        const store = get();

        try {
          const content = await file.text();
          const captions = store.parseCaptionFile(content, file.name);

          const track: CaptionTrack = {
            id: `track-${Date.now()}`,
            language,
            label: file.name,
            captions,
            isDefault: false,
            source: 'uploaded',
            metadata: {
              duration: Math.max(...captions.map(c => c.endTime)),
              wordCount: captions.reduce((sum, c) => sum + c.text.split(' ').length, 0),
              accuracy: 1.0, // Manually uploaded captions are assumed accurate
              generatedAt: new Date()
            }
          };

          store.addCaptionTrack(track);
          return track;

        } catch (error) {
          console.error('Failed to upload caption file:', error);
          throw error;
        }
      },

      // Export captions
      exportCaptions: (trackId: string, format: 'srt' | 'vtt' | 'txt'): string => {
        const store = get();
        const track = store.captionTracks.get(trackId);

        if (!track) {
          throw new Error('Caption track not found');
        }

        switch (format) {
          case 'srt':
            return store.exportToSRT(track);
          case 'vtt':
            return store.exportToVTT(track);
          case 'txt':
            return store.exportToTXT(track);
          default:
            throw new Error('Unsupported format');
        }
      },

      // Search captions
      searchCaptions: (query: string, trackId?: string): Caption[] => {
        const store = get();
        const tracks = trackId
          ? [store.captionTracks.get(trackId)].filter(Boolean) as CaptionTrack[]
          : Array.from(store.captionTracks.values());

        const results: Caption[] = [];
        const lowerQuery = query.toLowerCase();

        tracks.forEach(track => {
          track.captions.forEach(caption => {
            if (caption.text.toLowerCase().includes(lowerQuery) ||
                caption.keywords.some(keyword => keyword.toLowerCase().includes(lowerQuery))) {
              results.push(caption);
            }
          });
        });

        return results;
      },

      // Adjust caption timing
      adjustTiming: (captionId: string, startTime: number, endTime: number) => {
        set(state => {
          const updatedTracks = new Map(state.captionTracks);

          updatedTracks.forEach((track) => {
            const captionIndex = track.captions.findIndex(c => c.id === captionId);
            if (captionIndex !== -1) {
              track.captions[captionIndex] = {
                ...track.captions[captionIndex],
                startTime,
                endTime
              };
            }
          });

          return { captionTracks: updatedTracks };
        });
      },

      // Set ASR provider
      setASRProvider: (provider: ASRProvider) => {
        set({ asrProvider: provider });
      },

      // Transcribe audio data
      transcribeAudio: async (audioData: MediaStream): Promise<Caption> => {
        const store = get();
        const { asrProvider } = store;

        if (!asrProvider) {
          throw new Error('No ASR provider configured');
        }

        // Simulate ASR transcription
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            const caption: Caption = {
              id: `caption-${Date.now()}`,
              text: 'To jest przykładowa transkrypcja mowy.',
              startTime: Date.now() / 1000,
              endTime: (Date.now() + 3000) / 1000,
              confidence: 0.85,
              speaker: undefined,
              language: store.config.language,
              isEdited: false,
              keywords: ['przykładowa', 'transkrypcja', 'mowy']
            };

            resolve(caption);
          }, 500);
        });
      },

      // Get caption at specific time
      getCaptionAtTime: (time: number, trackId: string): Caption | null => {
        const store = get();
        const track = store.captionTracks.get(trackId);

        if (!track) return null;

        return track.captions.find(caption =>
          time >= caption.startTime && time <= caption.endTime
        ) || null;
      },

      // Add speaker label
      addSpeakerLabel: (captionId: string, speaker: string) => {
        set(state => {
          const updatedTracks = new Map(state.captionTracks);

          updatedTracks.forEach((track) => {
            const captionIndex = track.captions.findIndex(c => c.id === captionId);
            if (captionIndex !== -1) {
              track.captions[captionIndex] = {
                ...track.captions[captionIndex],
                speaker
              };
            }
          });

          return { captionTracks: updatedTracks };
        });
      },

      // Translate captions
      translateCaptions: async (trackId: string, targetLanguage: string): Promise<CaptionTrack> => {
        const store = get();
        const track = store.captionTracks.get(trackId);

        if (!track) {
          throw new Error('Caption track not found');
        }

        // Simulate translation
        const translatedCaptions = await Promise.all(
          track.captions.map(async (caption) => ({
            ...caption,
            text: `[Translated to ${targetLanguage}] ${caption.text}`,
            language: targetLanguage
          }))
        );

        const translatedTrack: CaptionTrack = {
          ...track,
          id: `${track.id}-translated-${targetLanguage}`,
          language: targetLanguage,
          label: `${track.label} (${targetLanguage})`,
          captions: translatedCaptions,
          source: 'auto'
        };

        store.addCaptionTrack(translatedTrack);
        return translatedTrack;
      },

      // Reset all state
      reset: () => {
        const store = get();

        store.disableCaptions();
        set({
          captionTracks: new Map(),
          currentTranscript: '',
          asrProvider: null,
          recognitionInstance: null
        });
      },

      // Internal methods
      setupVideoDetection: () => {
        // Auto-detect video elements and offer captioning
        const observer = new MutationObserver((mutations) => {
          mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
              if (node.nodeType === Node.ELEMENT_NODE) {
                const videos = (node as Element).querySelectorAll('video');
                videos.forEach(video => {
                  if (!video.hasAttribute('data-captions-processed')) {
                    video.setAttribute('data-captions-processed', 'true');
                    // Optionally auto-enable captions
                  }
                });
              }
            });
          });
        });

        observer.observe(document.body, {
          childList: true,
          subtree: true
        });

        (get() as any).videoObserver = observer;
      },

      initializeASRProviders: () => {
        const store = get();

        // Set up default ASR provider
        const defaultProvider: ASRProvider = {
          name: 'Web Speech API',
          language: 'pl-PL',
          confidence: 0.8,
          realTime: true,
          supportsPunctuation: true,
          supportsSpeakerDiarization: false
        };

        store.setASRProvider(defaultProvider);
      },

      setupKeyboardShortcuts: () => {
        document.addEventListener('keydown', (e) => {
          // Ctrl + Shift + C: Toggle captions
          if (e.ctrlKey && e.shiftKey && e.key === 'C') {
            const store = get();
            if (store.isCaptionsEnabled) {
              store.disableCaptions();
            } else {
              const video = document.querySelector('video') as HTMLVideoElement;
              if (video) store.enableCaptions(video);
            }
          }
        });
      },

      createCaptionDisplay: () => {
        const store = get();
        const { config } = store;

        const display = document.createElement('div');
        display.id = 'real-time-captions';
        display.style.cssText = `
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, ${config.backgroundOpacity});
          color: ${config.fontColor};
          padding: 10px 20px;
          border-radius: 8px;
          font-size: ${config.fontSize}px;
          font-family: Arial, sans-serif;
          max-width: 80%;
          text-align: center;
          z-index: 10000;
          display: none;
          pointer-events: none;
          line-height: 1.4;
        `;

        document.body.appendChild(display);
        (get() as any).captionDisplay = display;
      },

      setupAudioProcessing: () => {
        // Set up Web Audio API for audio processing
        if ('AudioContext' in window || 'webkitAudioContext' in window) {
          const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
          (get() as any).audioContext = new AudioContext();
        }
      },

      setupVideoEventListeners: (videoElement: HTMLVideoElement) => {
        const store = get();

        const handleTimeUpdate = () => {
          if (store.activeSession) {
            store.activeSession.currentTime = videoElement.currentTime;
            store.updateActiveCaption();
          }
        };

        const handlePlay = () => {
          if (store.config.autoGenerate && !store.isRecording) {
            store.startRealTimeCaptioning(videoElement);
          }
        };

        const handlePause = () => {
          if (store.isRecording) {
            store.stopRealTimeCaptioning();
          }
        };

        videoElement.addEventListener('timeupdate', handleTimeUpdate);
        videoElement.addEventListener('play', handlePlay);
        videoElement.addEventListener('pause', handlePause);

        // Store event listeners for cleanup
        (store as any).videoEventListeners = {
          timeupdate: handleTimeUpdate,
          play: handlePlay,
          pause: handlePause
        };
      },

      cleanupVideoEventListeners: (videoElement: HTMLVideoElement) => {
        const store = get();
        const listeners = (store as any).videoEventListeners;

        if (listeners) {
          Object.entries(listeners).forEach(([event, handler]) => {
            videoElement.removeEventListener(event, handler as EventListener);
          });
        }
      },

      startAudioRecognition: (audioStream: MediaStream) => {
        const store = get();
        const { asrProvider } = store;

        if (!asrProvider || !('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
          console.warn('Speech recognition not supported');
          return;
        }

        const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SpeechRecognition();

        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = asrProvider.language;

        recognition.onresult = (event: SpeechRecognitionEvent) => {
          let finalTranscript = '';
          let interimTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;

            if (event.results[i].isFinal) {
              finalTranscript += transcript;

              // Create caption from final transcript
              if (finalTranscript.trim()) {
                const caption: Caption = {
                  id: `caption-${Date.now()}`,
                  text: finalTranscript.trim(),
                  startTime: store.activeSession?.currentTime || 0,
                  endTime: (store.activeSession?.currentTime || 0) + 3,
                  confidence: event.results[i][0].confidence,
                  language: store.config.language,
                  isEdited: false,
                  keywords: store.extractKeywords(finalTranscript)
                };

                store.addCaptionToCurrentTrack(caption);
                store.updateCaptionDisplay(caption);
              }
            } else {
              interimTranscript += transcript;
            }
          }

          set({ currentTranscript: interimTranscript });
          store.updateInterimCaption(interimTranscript);
        };

        recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
          console.error('Speech recognition error:', event.error);
          set({ isRecording: false });
        };

        recognition.onend = () => {
          set({ isRecording: false });
        };

        recognition.start();
        set({ recognitionInstance: recognition });
      },

      addCaptionToCurrentTrack: (caption: Caption) => {
        const store = get();

        if (!store.activeSession?.currentTrack) {
          // Create default track if none exists
          const defaultTrack: CaptionTrack = {
            id: 'default-track',
            language: store.config.language,
            label: 'Auto-generated',
            captions: [],
            isDefault: true,
            source: 'auto',
            metadata: {
              duration: 0,
              wordCount: 0,
              accuracy: 0,
              generatedAt: new Date()
            }
          };

          store.addCaptionTrack(defaultTrack);
        }

        // Add caption to current track
        set(state => {
          const updatedTracks = new Map(state.captionTracks);
          const currentTrack = state.activeSession?.currentTrack;

          if (currentTrack) {
            const track = updatedTracks.get(currentTrack.id);
            if (track) {
              track.captions.push(caption);
              track.metadata.duration = Math.max(track.metadata.duration, caption.endTime);
              track.metadata.wordCount += caption.text.split(' ').length;
            }
          }

          return { captionTracks: updatedTracks };
        });
      },

      updateCaptionDisplay: (caption?: Caption) => {
        const store = get();
        const display = (store as any).captionDisplay;

        if (!display) return;

        if (caption) {
          display.textContent = caption.text;
          display.style.display = 'block';
        } else {
          display.textContent = '';
          display.style.display = 'none';
        }
      },

      updateInterimCaption: (text: string) => {
        const store = get();
        const display = (store as any).captionDisplay;

        if (!display) return;

        if (text) {
          display.textContent = text + '...';
          display.style.opacity = '0.7';
        } else {
          display.style.opacity = '1';
        }
      },

      updateActiveCaption: () => {
        const store = get();
        const { activeSession } = store;

        if (!activeSession?.currentTrack) return;

        const caption = store.getCaptionAtTime(
          activeSession.currentTime,
          activeSession.currentTrack.id
        );

        if (caption !== activeSession.activeCaption) {
          set(state => ({
            activeSession: state.activeSession ? {
              ...state.activeSession,
              activeCaption: caption
            } : null
          }));

          store.updateCaptionDisplay(caption);
        }
      },

      showCaptionDisplay: () => {
        const display = (get() as any).captionDisplay;
        if (display) {
          display.style.display = 'block';
        }
      },

      hideCaptionDisplay: () => {
        const display = (get() as any).captionDisplay;
        if (display) {
          display.style.display = 'none';
        }
      },

      updateCaptionDisplay: () => {
        const store = get();
        const { config } = store;
        const display = (store as any).captionDisplay;

        if (!display) return;

        display.style.fontSize = `${config.fontSize}px`;
        display.style.color = config.fontColor;
        display.style.backgroundColor = config.backgroundColor + Math.round(config.backgroundOpacity * 255).toString(16).padStart(2, '0');

        // Update position
        const positions = {
          top: 'top: 20px; bottom: auto;',
          center: 'top: 50%; transform: translate(-50%, -50%);',
          bottom: 'bottom: 20px; top: auto;'
        };

        const positionStyle = positions[config.position];
        display.style.cssText += positionStyle;
      },

      parseCaptionFile: (content: string, filename: string): Caption[] => {
        const extension = filename.split('.').pop()?.toLowerCase();

        switch (extension) {
          case 'srt':
            return store.parseSRT(content);
          case 'vtt':
            return store.parseVTT(content);
          default:
            throw new Error('Unsupported caption format');
        }
      },

      parseSRT: (content: string): Caption[] => {
        const blocks = content.trim().split(/\n\s*\n/);
        const captions: Caption[] = [];

        blocks.forEach(block => {
          const lines = block.split('\n');
          if (lines.length >= 3) {
            const index = lines[0];
            const timeMatch = lines[1].match(/(\d{2}):(\d{2}):(\d{2}),(\d{3}) --> (\d{2}):(\d{2}):(\d{2}),(\d{3})/);

            if (timeMatch) {
              const [_, h1, m1, s1, ms1, h2, m2, s2, ms2] = timeMatch;
              const startTime = parseInt(h1) * 3600 + parseInt(m1) * 60 + parseInt(s1) + parseInt(ms1) / 1000;
              const endTime = parseInt(h2) * 3600 + parseInt(m2) * 60 + parseInt(s2) + parseInt(ms2) / 1000;

              const text = lines.slice(2).join(' ').trim();

              captions.push({
                id: `srt-${index}`,
                text,
                startTime,
                endTime,
                confidence: 1.0,
                language: 'unknown',
                isEdited: false,
                keywords: store.extractKeywords(text)
              });
            }
          }
        });

        return captions;
      },

      parseVTT: (content: string): Caption[] => {
        // Simplified VTT parsing
        const lines = content.split('\n');
        const captions: Caption[] = [];
        let currentCaption: Partial<Caption> | null = null;

        lines.forEach(line => {
          if (line.includes('-->')) {
            const timeMatch = line.match(/(\d{2}):(\d{2}):(\d{2})\.(\d{3}) --> (\d{2}):(\d{2}):(\d{2})\.(\d{3})/);
            if (timeMatch) {
              const [_, h1, m1, s1, ms1, h2, m2, s2, ms2] = timeMatch;
              currentCaption = {
                startTime: parseInt(h1) * 3600 + parseInt(m1) * 60 + parseInt(s1) + parseInt(ms1) / 1000,
                endTime: parseInt(h2) * 3600 + parseInt(m2) * 60 + parseInt(s2) + parseInt(ms2) / 1000,
                text: ''
              };
            }
          } else if (currentCaption && line.trim()) {
            currentCaption.text += (currentCaption.text ? ' ' : '') + line.trim();
          } else if (currentCaption && !line.trim()) {
            if (currentCaption.text) {
              captions.push({
                id: `vtt-${captions.length}`,
                text: currentCaption.text,
                startTime: currentCaption.startTime!,
                endTime: currentCaption.endTime!,
                confidence: 1.0,
                language: 'unknown',
                isEdited: false,
                keywords: store.extractKeywords(currentCaption.text)
              });
            }
            currentCaption = null;
          }
        });

        return captions;
      },

      exportToSRT: (track: CaptionTrack): string => {
        return track.captions.map((caption, index) => {
          const startTime = store.formatSRTTime(caption.startTime);
          const endTime = store.formatSRTTime(caption.endTime);

          return `${index + 1}\n${startTime} --> ${endTime}\n${caption.text}\n`;
        }).join('\n');
      },

      exportToVTT: (track: CaptionTrack): string => {
        let vtt = 'WEBVTT\n\n';

        vtt += track.captions.map(caption => {
          const startTime = store.formatVTTTime(caption.startTime);
          const endTime = store.formatVTTTime(caption.endTime);

          return `${startTime} --> ${endTime}\n${caption.text}\n`;
        }).join('\n');

        return vtt;
      },

      exportToTXT: (track: CaptionTrack): string => {
        return track.captions.map(caption => caption.text).join(' ');
      },

      formatSRTTime: (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 1000);

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
      },

      formatVTTTime: (seconds: number): string => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        const ms = Math.floor((seconds % 1) * 1000);

        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
      },

      extractKeywords: (text: string): string[] => {
        // Simple keyword extraction
        const words = text.toLowerCase().split(/\s+/);
        const stopWords = ['i', 'w', 'na', 'do', 'się', 'z', 'o', 'to', 'jest', 'jak', 'ale', 'czy'];

        return words
          .filter(word => word.length > 3 && !stopWords.includes(word))
          .slice(0, 5);
      }
    }),
    {
      name: 'real-time-captioning-store',
      partialize: (state) => ({
        config: state.config,
        captionTracks: Array.from(state.captionTracks.entries()),
      }),
    }
  )
);

// React hook for real-time captioning
export const useRealTimeCaptioningControls = () => {
  const store = useRealTimeCaptioning();

  const initialize = () => {
    store.initialize();
  };

  const toggleCaptions = () => {
    if (store.isCaptionsEnabled) {
      store.disableCaptions();
    } else {
      const video = document.querySelector('video') as HTMLVideoElement;
      if (video) {
        store.enableCaptions(video);
      }
    }
  };

  const startCaptioningForVideo = (videoElement: HTMLVideoElement) => {
    store.enableCaptions(videoElement);
  };

  const exportCurrentTrack = (format: 'srt' | 'vtt' | 'txt') => {
    if (store.activeSession?.currentTrack) {
      return store.exportCaptions(store.activeSession.currentTrack.id, format);
    }
    throw new Error('No active caption track');
  };

  const addManualCaption = (text: string, startTime: number, endTime: number) => {
    const caption: Caption = {
      id: `manual-${Date.now()}`,
      text,
      startTime,
      endTime,
      confidence: 1.0,
      language: store.config.language,
      isEdited: false,
      keywords: store.extractKeywords(text)
    };

    store.addCaptionToCurrentTrack(caption);
  };

  return {
    ...store,
    initialize,
    toggleCaptions,
    startCaptioningForVideo,
    exportCurrentTrack,
    addManualCaption,
  };
};

export default useRealTimeCaptioning;