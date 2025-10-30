import { vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// Import enhanced mocks
import { setupGlobalMocks } from './mocks/enhanced-supabase.mock'

// Setup enhanced global mocks
const { supabase, stripe, booksy, email, meta, ga } = setupGlobalMocks()

// Mock all external dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase
}))

vi.mock('@/integrations/stripe/client', () => ({
  stripe
}))

vi.mock('@/services/booksy.service', () => ({
  booksyAPI: booksy
}))

vi.mock('@/services/email.service', () => ({
  emailService: email
}))

vi.mock('@/lib/meta', () => ({
  meta: meta
}))

vi.mock('@/lib/gtag', () => ({
  gtag: ga.gtag
}))

// Mock React Router
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({ pathname: '/', search: '', hash: '', state: null }),
    useParams: () => ({}),
    useSearchParams: () => [new URLSearchParams(), vi.fn()]
  }
})

// Mock React Query
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useMutation: vi.fn(),
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
    refetchQueries: vi.fn(),
    getQueryData: vi.fn(),
    setQueryData: vi.fn()
  }),
  QueryClient: vi.fn(),
  QueryClientProvider: ({ children }: { children: React.ReactNode }) => children
}))

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'en',
      changeLanguage: vi.fn()
    }
  }),
  initReactI18next: vi.fn()
}))

// Mock Framer Motion
vi.mock('framer-motion', () => ({
  motion: {
    div: 'div',
    span: 'span',
    button: 'button',
    form: 'form',
    section: 'section',
    main: 'main'
  },
  AnimatePresence: 'div',
  useAnimation: () => ({
    start: vi.fn(),
    stop: vi.fn(),
    set: vi.fn()
  }),
  useScroll: () => ({
    scrollY: { get: () => 0 },
    scrollYProgress: { get: () => 0 }
  }),
  useTransform: (value: any, inputRange: any[], outputRange: any[]) => value,
  useSpring: () => ({})
}))

// Mock React Hook Form
vi.mock('react-hook-form', () => ({
  useForm: () => ({
    register: vi.fn(),
    handleSubmit: vi.fn(),
    formState: { errors: {} },
    setValue: vi.fn(),
    getValues: vi.fn(),
    reset: vi.fn(),
    watch: vi.fn()
  }),
  Controller: 'div'
}))

// Mock Zustand stores
vi.mock('@/stores/booking', () => ({
  useBookingStore: () => ({
    selectedService: null,
    selectedTimeSlot: null,
    bookingDetails: {},
    setService: vi.fn(),
    setTimeSlot: vi.fn(),
    setBookingDetails: vi.fn(),
    clearBooking: vi.fn(),
    isLoading: false,
    error: null
  })
}))

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    register: vi.fn(),
    resetPassword: vi.fn()
  })
}))

// Mock Context providers
vi.mock('@/contexts/BookingContext', () => ({
  BookingContext: {
    Provider: 'div',
    Consumer: 'div',
  },
  useBooking: () => ({
    bookingState: {
      service: null,
      timeSlot: null,
      details: {},
      step: 1
    },
    bookingActions: {
      setService: vi.fn(),
      setTimeSlot: vi.fn(),
      setDetails: vi.fn(),
      nextStep: vi.fn(),
      prevStep: vi.fn(),
      reset: vi.fn()
    }
  })
}))

vi.mock('@/contexts/CurrencyContext', () => ({
  CurrencyContext: {
    Provider: 'div',
  },
  useCurrency: () => ({
    currency: 'PLN',
    convertPrice: (price: number) => price,
    formatPrice: (price: number) => `${price} PLN`,
    setCurrency: vi.fn()
  })
}))

vi.mock('@/contexts/ModeContext', () => ({
  ModeContext: {
    Provider: 'div',
  },
  useMode: () => ({
    mode: 'beauty',
    setMode: vi.fn(),
    trackModeChange: vi.fn()
  })
}))

// Mock React hot toast
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn()
  },
  Toaster: 'div'
}))

// Mock Lucide React icons - comprehensive list
vi.mock('lucide-react', () => ({
  ChevronLeft: 'div',
  ChevronRight: 'div',
  ChevronDown: 'div',
  ChevronUp: 'div',
  X: 'div',
  Check: 'div',
  AlertCircle: 'div',
  Calendar: 'div',
  Clock: 'div',
  User: 'div',
  Mail: 'div',
  Phone: 'div',
  MapPin: 'div',
  Star: 'div',
  Heart: 'div',
  Search: 'div',
  Filter: 'div',
  Menu: 'div',
  Settings: 'div',
  LogOut: 'div',
  LogIn: 'div',
  CreditCard: 'div',
  Shield: 'div',
  Zap: 'div',
  TrendingUp: 'div',
  Users: 'div',
  Package: 'div',
  ShoppingBag: 'div',
  Eye: 'div',
  EyeOff: 'div',
  Edit: 'div',
  Trash: 'div',
  Plus: 'div',
  Minus: 'div',
  ArrowRight: 'div',
  ArrowLeft: 'div',
  ArrowUp: 'div',
  ArrowDown: 'div',
  Camera: 'div',
  Video: 'div',
  VideoOff: 'div',
  Mic: 'div',
  MicOff: 'div',
  PhoneCall: 'div',
  PhoneOff: 'div',
  MessageSquare: 'div',
  Send: 'div',
  Paperclip: 'div',
  Smile: 'div',
  Frown: 'div',
  Meh: 'div',
  ThumbsUp: 'div',
  ThumbsDown: 'div',
  Share: 'div',
  Bookmark: 'div',
  BookmarkOff: 'div',
  ExternalLink: 'div',
  Copy: 'div',
  Move: 'div',
  Download: 'div',
  Upload: 'div',
  RefreshCw: 'div',
  RotateCw: 'div',
  RotateCcw: 'div',
  Play: 'div',
  Pause: 'div',
  Square: 'div',
  Volume2: 'div',
  VolumeX: 'div',
  Volume1: 'div',
  Volume: 'div',
  Wifi: 'div',
  WifiOff: 'div',
  Battery: 'div',
  BatteryCharging: 'div',
  Sun: 'div',
  Moon: 'div',
  Cloud: 'div',
  CloudRain: 'div',
  CloudSnow: 'div',
  Umbrella: 'div',
  Wind: 'div',
  Thermometer: 'div',
  Droplets: 'div',
  Globe: 'div',
  Lock: 'div',
  Unlock: 'div',
  Key: 'div',
  Fingerprint: 'div',
  Bell: 'div',
  BellOff: 'div',
  Home: 'div',
  Building: 'div',
  Store: 'div',
  Briefcase: 'div',
  Wrench: 'div',
  Hammer: 'div',
  Tool: 'div',
  Cpu: 'div',
  HardDrive: 'div',
  Database: 'div',
  Server: 'div',
  CloudDrizzle: 'div',
  Navigation: 'div',
  Compass: 'div',
  Map: 'div',
  Flag: 'div',
  FlagOff: 'div',
  ZapOff: 'div',
  Bolt: 'div',
  Flame: 'div',
  Snowflake: 'div',
  SunMoon: 'div',
  Sunrise: 'div',
  Sunset: 'div',
  Mountain: 'div',
  Trees: 'div',
  Flower: 'div',
  Bug: 'div',
  Fish: 'div',
  Bird: 'div',
  Cat: 'div',
  Dog: 'div',
  HeartHandshake: 'div',
  Handshake: 'div',
  Users2: 'div',
  UserPlus: 'div',
  UserMinus: 'div',
  UserCheck: 'div',
  UserX: 'div',
  UserCircle: 'div',
  AtSign: 'div',
  Hash: 'div',
  Percent: 'div',
  DollarSign: 'div',
  Euro: 'div',
  PoundSterling: 'div',
  Currency: 'div',
  Calculator: 'div',
  PieChart: 'div',
  BarChart: 'div',
  LineChart: 'div',
  TrendingDown: 'div',
  Activity: 'div',
  Target: 'div',
  Award: 'div',
  Trophy: 'div',
  Medal: 'div',
  Gift: 'div',
  Sparkles: 'div',
  Sparkle: 'div',
  StarOff: 'div',
  HeartOff: 'div'
}))

// Enhanced environment mocks
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

Object.defineProperty(window, 'getComputedStyle', {
  value: () => ({
    getPropertyValue: () => '',
    zIndex: '0',
    transform: 'none',
    opacity: '1',
  }),
})

// Mock IntersectionObserver with more realistic behavior
global.IntersectionObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn((element) => {
    // Simulate immediate intersection
    setTimeout(() => {
      callback([{
        target: element,
        isIntersecting: true,
        intersectionRatio: 1,
        boundingClientRect: element.getBoundingClientRect(),
        intersectionRect: element.getBoundingClientRect(),
        rootBounds: null,
        time: Date.now()
      }])
    }, 0)
  }),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation((callback) => ({
  observe: vi.fn((element) => {
    // Simulate resize event
    setTimeout(() => {
      callback([{
        target: element,
        contentRect: element.getBoundingClientRect(),
        borderBoxSize: [{ blockSize: 100, inlineSize: 100 }],
        contentBoxSize: [{ blockSize: 100, inlineSize: 100 }],
        devicePixelContentBoxSize: [{ blockSize: 100, inlineSize: 100 }]
      }])
    }, 0)
  }),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock URL.createObjectURL and revokeObjectURL
Object.defineProperty(URL, 'createObjectURL', {
  value: vi.fn(() => 'mock-url'),
})

Object.defineProperty(URL, 'revokeObjectURL', {
  value: vi.fn(),
})

// Enhanced localStorage mock
const store: Record<string, string> = {}
const localStorageMock = {
  getItem: vi.fn((key: string) => store[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    store[key] = value
  }),
  removeItem: vi.fn((key: string) => {
    delete store[key]
  }),
  clear: vi.fn(() => {
    Object.keys(store).forEach(key => {
      delete store[key]
    })
  }),
  key: vi.fn((index: number) => {
    const keys = Object.keys(store)
    return keys[index] || null
  }),
  get length() {
    return Object.keys(store).length
  }
}

vi.stubGlobal('localStorage', localStorageMock)

// Enhanced sessionStorage mock
const sessionStore: Record<string, string> = {}
const sessionStorageMock = {
  getItem: vi.fn((key: string) => sessionStore[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    sessionStore[key] = value
  }),
  removeItem: vi.fn((key: string) => {
    delete sessionStore[key]
  }),
  clear: vi.fn(() => {
    Object.keys(sessionStore).forEach(key => {
      delete sessionStore[key]
    })
  }),
  key: vi.fn((index: number) => {
    const keys = Object.keys(sessionStore)
    return keys[index] || null
  }),
  get length() {
    return Object.keys(sessionStore).length
  }
}

vi.stubGlobal('sessionStorage', sessionStorageMock)

// Mock crypto with enhanced functionality
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'mock-uuid-' + Math.random().toString(36).substr(2, 9)),
    getRandomValues: vi.fn((arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256)
      }
      return arr
    }),
    subtle: {
      digest: vi.fn(() => Promise.resolve(new ArrayBuffer(32)))
    }
  },
})

// Mock fetch with enhanced responses
global.fetch = vi.fn()

// Mock AbortController
global.AbortController = class MockAbortController {
  signal = {
    aborted: false,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }
  abort = vi.fn()
}

// Mock Request and Response
global.Request = vi.fn()
global.Response = vi.fn()

// Enhanced console mocks for cleaner test output
const originalError = console.error
const originalWarn = console.warn

beforeAll(() => {
  console.error = (...args: any[]) => {
    // Suppress specific known warnings in tests
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('Warning: ReactDOM.render is deprecated') ||
       args[0].includes('Warning: componentWillReceiveProps has been renamed') ||
       args[0].includes('act(...) is not supported'))
    ) {
      return
    }
    originalError.call(console, ...args)
  }

  console.warn = (...args: any[]) => {
    // Suppress specific known warnings in tests
    if (
      typeof args[0] === 'string' &&
      args[0].includes('componentWillReceiveProps has been renamed')
    ) {
      return
    }
    originalWarn.call(console, ...args)
  }
})

afterAll(() => {
  console.error = originalError
  console.warn = originalWarn
})

// Enhanced cleanup
afterEach(() => {
  cleanup()
  vi.clearAllMocks()

  // Reset fetch mock
  if (vi.isMockFunction(fetch)) {
    fetch.mockClear()
  }

  // Clear localStorage and sessionStorage
  Object.keys(store).forEach(key => delete store[key])
  Object.keys(sessionStore).forEach(key => delete sessionStore[key])
})

// Export mocks for use in tests
export { supabase, stripe, booksy, email, meta, ga }