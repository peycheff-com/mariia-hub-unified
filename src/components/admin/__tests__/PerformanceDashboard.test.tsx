import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import PerformanceDashboard from '../PerformanceDashboard'

// Mock the performance monitoring service
const mockPerformanceMonitoringService = {
  getCurrentMetrics: vi.fn(),
  getAPIMetrics: vi.fn(),
  getActiveAlerts: vi.fn(),
  getSLAMetrics: vi.fn(),
  acknowledgeAlert: vi.fn(),
  resolveAlert: vi.fn(),
  exportMetrics: vi.fn(),
}

vi.mock('@/lib/performance-monitoring', () => ({
  performanceMonitoringService: mockPerformanceMonitoringService,
}))

// Mock UI components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className, ...props }: any) => (
    <div className={className} data-testid="card" {...props}>{children}</div>
  ),
  CardContent: ({ children, className, ...props }: any) => (
    <div className={className} data-testid="card-content" {...props}>{children}</div>
  ),
  CardHeader: ({ children, className, ...props }: any) => (
    <div className={className} data-testid="card-header" {...props}>{children}</div>
  ),
  CardTitle: ({ children, className, ...props }: any) => (
    <h3 className={className} data-testid="card-title" {...props}>{children}</h3>
  ),
  CardDescription: ({ children, className, ...props }: any) => (
    <p className={className} data-testid="card-description" {...props}>{children}</p>
  ),
}))

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className, variant, ...props }: any) => (
    <span className={className} data-variant={variant} data-testid="badge" {...props}>{children}</span>
  ),
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className, disabled, ...props }: any) => (
    <button
      onClick={onClick}
      className={className}
      disabled={disabled}
      data-testid="button"
      {...props}
    >
      {children}
    </button>
  ),
}))

vi.mock('@/components/ui/alert', () => ({
  Alert: ({ children, className, ...props }: any) => (
    <div className={className} data-testid="alert" {...props}>{children}</div>
  ),
  AlertDescription: ({ children, className, ...props }: any) => (
    <div className={className} data-testid="alert-description" {...props}>{children}</div>
  ),
}))

vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, onValueChange, value }: any) => (
    <div data-testid="tabs" data-value={value} onClick={() => onValueChange?.('overview')}>
      {children}
    </div>
  ),
  TabsContent: ({ children, value }: any) => (
    <div data-testid="tabs-content" data-value={value}>{children}</div>
  ),
  TabsList: ({ children }: any) => (
    <div data-testid="tabs-list">{children}</div>
  ),
  TabsTrigger: ({ children, value }: any) => (
    <button data-testid="tabs-trigger" data-value={value}>{children}</button>
  ),
}))

vi.mock('@/components/ui/progress', () => ({
  Progress: ({ value, className }: any) => (
    <div className={className} data-testid="progress" data-value={value}>
      {value}%
    </div>
  ),
}))

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange, value }: any) => (
    <div data-testid="select" data-value={value} onClick={() => onValueChange?.('24h')}>
      {children}
    </div>
  ),
  SelectContent: ({ children }: any) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value }: any) => <div data-testid="select-item" data-value={value}>{children}</div>,
  SelectTrigger: ({ children }: any) => <div data-testid="select-trigger">{children}</div>,
  SelectValue: ({ children }: any) => <div data-testid="select-value">{children}</div>,
}))

vi.mock('@/components/ui/switch', () => ({
  Switch: ({ checked, onCheckedChange }: any) => (
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      data-testid="switch"
    />
  ),
}))

describe('PerformanceDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mock data
    mockPerformanceMonitoringService.getCurrentMetrics.mockReturnValue({
      vitals: {
        lcp: 1200,
        fid: 45,
        cls: 0.05,
        fcp: 800,
        ttfb: 300
      },
      memory: {
        used: 50000000,
        limit: 100000000,
        percentage: 50
      },
      device: {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        hardwareConcurrency: 8
      },
      connectivity: {
        effectiveType: '4g'
      },
      resources: {
        count: 25,
        totalSize: 1000000,
        compressedSize: 800000,
        slowResources: [],
        largeResources: []
      },
      url: 'https://example.com'
    })

    mockPerformanceMonitoringService.getAPIMetrics.mockReturnValue([
      {
        endpoint: '/api/bookings',
        method: 'GET',
        statusCode: 200,
        responseTime: 150,
        cacheHit: true,
        timestamp: Date.now()
      },
      {
        endpoint: '/api/services',
        method: 'GET',
        statusCode: 200,
        responseTime: 200,
        cacheHit: false,
        timestamp: Date.now()
      }
    ])

    mockPerformanceMonitoringService.getActiveAlerts.mockReturnValue([
      {
        id: 'alert-1',
        severity: 'warning',
        title: 'High Response Time',
        message: 'API response time exceeded threshold',
        businessImpact: 'Medium',
        timestamp: new Date().toISOString(),
        acknowledged: false,
        resolved: false
      }
    ])

    mockPerformanceMonitoringService.getSLAMetrics.mockResolvedValue([
      {
        metric: 'availability',
        value: 99.95,
        target: 99.9,
        period: 'daily'
      }
    ])

    mockPerformanceMonitoringService.acknowledgeAlert.mockResolvedValue({})
    mockPerformanceMonitoringService.resolveAlert.mockResolvedValue({})
    mockPerformanceMonitoringService.exportMetrics.mockReturnValue('{"data": "test"}')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders loading state initially', () => {
    mockPerformanceMonitoringService.getCurrentMetrics.mockReturnValue(null)

    render(<PerformanceDashboard />)

    expect(screen.getByText('Performance Dashboard')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument()
  })

  it('renders dashboard with all main sections', async () => {
    render(<PerformanceDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Performance Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Real-time performance monitoring and SLA tracking')).toBeInTheDocument()
    })

    // Check for main metric cards
    expect(screen.getByText('Health Score')).toBeInTheDocument()
    expect(screen.getByText('API Response')).toBeInTheDocument()
    expect(screen.getByText('Active Alerts')).toBeInTheDocument()
    expect(screen.getByText('SLA Compliance')).toBeInTheDocument()
  })

  it('displays overall health score correctly', async () => {
    render(<PerformanceDashboard />)

    await waitFor(() => {
      expect(screen.getByText('85%')).toBeInTheDocument() // Average score
    })

    // Check for health score card
    const healthScoreCard = screen.getAllByTestId('card')[0]
    expect(healthScoreCard).toBeInTheDocument()
  })

  it('shows API performance metrics', async () => {
    render(<PerformanceDashboard />)

    await waitFor(() => {
      expect(screen.getByText('175ms')).toBeInTheDocument() // Average of 150 + 200
      expect(screen.getByText('Error Rate: 0%')).toBeInTheDocument()
      expect(screen.getByText('Cache Hit: 50%')).toBeInTheDocument() // 1 out of 2 hits
    })
  })

  it('displays active alerts correctly', async () => {
    render(<PerformanceDashboard />)

    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument() // Number of alerts
      expect(screen.getByText('1 Warning')).toBeInTheDocument()
    })

    // Check for critical alerts banner
    expect(screen.queryByText('Critical Alerts:')).not.toBeInTheDocument()
  })

  it('shows critical alerts banner when critical alerts exist', async () => {
    mockPerformanceMonitoringService.getActiveAlerts.mockReturnValue([
      {
        id: 'critical-alert',
        severity: 'critical',
        title: 'System Down',
        message: 'Critical system failure detected',
        businessImpact: 'High',
        timestamp: new Date().toISOString(),
        acknowledged: false,
        resolved: false
      }
    ])

    render(<PerformanceDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Critical Alerts: 1 critical performance issue detected')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /view alerts/i })).toBeInTheDocument()
    })
  })

  it('handles tab navigation correctly', async () => {
    const user = userEvent.setup()
    render(<PerformanceDashboard />)

    await waitFor(() => {
      expect(screen.getByTestId('tabs')).toBeInTheDocument()
    })

    const tabs = screen.getAllByTestId('tabs-trigger')
    expect(tabs.length).toBe(6) // Overview, Web Vitals, API, Alerts, SLA, Geography

    // Click on Web Vitals tab
    await user.click(tabs[1])
    expect(screen.getByDisplayValue('web-vitals')).toBeInTheDocument()
  })

  it('shows web vitals metrics in overview tab', async () => {
    render(<PerformanceDashboard />)

    await waitFor(() => {
      expect(screen.getByText('LCP')).toBeInTheDocument()
      expect(screen.getByText('FID')).toBeInTheDocument()
      expect(screen.getByText('CLS')).toBeInTheDocument()
    })
  })

  it('displays system resource information', async () => {
    render(<PerformanceDashboard />)

    await waitFor(() => {
      expect(screen.getByText('System Resources')).toBeInTheDocument()
      expect(screen.getByText('Desktop')).toBeInTheDocument()
      expect(screen.getByText('4g')).toBeInTheDocument()
      expect(screen.getByText('8')).toBeInTheDocument() // CPU cores
    })
  })

  it('handles real-time toggle', async () => {
    const user = userEvent.setup()
    render(<PerformanceDashboard />)

    await waitFor(() => {
      expect(screen.getByText('Live')).toBeInTheDocument()
    })

    const pauseButton = screen.getByRole('button', { name: /pause/i })
    await user.click(pauseButton)

    expect(screen.getByText('Paused')).toBeInTheDocument()
  })

  it('handles time range selection', async () => {
    render(<PerformanceDashboard />)

    await waitFor(() => {
      expect(screen.getByTestId('select')).toBeInTheDocument()
    })

    const select = screen.getByTestId('select')
    fireEvent.click(select)

    expect(mockPerformanceMonitoringService.getAPIMetrics).toHaveBeenCalled()
  })

  it('handles manual refresh', async () => {
    const user = userEvent.setup()
    render(<PerformanceDashboard />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /refresh/i })).toBeInTheDocument()
    })

    const refreshButton = screen.getByRole('button', { name: /refresh/i })
    await user.click(refreshButton)

    expect(mockPerformanceMonitoringService.getCurrentMetrics).toHaveBeenCalled()
  })

  it('handles alert acknowledgment', async () => {
    const user = userEvent.setup()
    render(<PerformanceDashboard />)

    await waitFor(() => {
      // Navigate to alerts tab
      const alertsTab = screen.getByText('Alerts')
      user.click(alertsTab)
    })

    const acknowledgeButton = await screen.findByRole('button', { name: /acknowledge/i })
    await user.click(acknowledgeButton)

    expect(mockPerformanceMonitoringService.acknowledgeAlert).toHaveBeenCalledWith('alert-1', 'current-user')
  })

  it('handles alert resolution', async () => {
    const user = userEvent.setup()
    render(<PerformanceDashboard />)

    await waitFor(() => {
      // Navigate to alerts tab
      const alertsTab = screen.getByText('Alerts')
      user.click(alertsTab)
    })

    const resolveButton = await screen.findByRole('button', { name: /resolve/i })
    await user.click(resolveButton)

    expect(mockPerformanceMonitoringService.resolveAlert).toHaveBeenCalledWith('alert-1', 'current-user')
  })

  it('handles metrics export', async () => {
    const user = userEvent.setup()
    render(<PerformanceDashboard />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument()
    })

    const exportButton = screen.getByRole('button', { name: /export/i })
    await user.click(exportButton)

    expect(mockPerformanceMonitoringService.exportMetrics).toHaveBeenCalledWith('json')
  })

  it('displays "All Systems Operational" when no alerts', async () => {
    mockPerformanceMonitoringService.getActiveAlerts.mockReturnValue([])

    render(<PerformanceDashboard />)

    await waitFor(() => {
      expect(screen.getByText('All Systems Operational')).toBeInTheDocument()
      expect(screen.getByText('No active performance alerts at this time.')).toBeInTheDocument()
    })
  })

  it('shows SLA compliance metrics', async () => {
    render(<PerformanceDashboard />)

    await waitFor(() => {
      expect(screen.getByText('99.9%')).toBeInTheDocument()
    })

    const progressBars = screen.getAllByTestId('progress')
    expect(progressBars.length).toBeGreaterThan(0)
  })

  it('has proper accessibility attributes', async () => {
    render(<PerformanceDashboard />)

    await waitFor(() => {
      const mainHeading = screen.getByRole('heading', { name: /performance dashboard/i })
      expect(mainHeading).toBeInTheDocument()
      expect(mainHeading.tagName).toBe('H1')
    })

    // Check for ARIA labels on buttons
    const buttons = screen.getAllByRole('button')
    buttons.forEach(button => {
      expect(button).toHaveAttribute('type')
    })
  })

  it('handles error states gracefully', async () => {
    mockPerformanceMonitoringService.getCurrentMetrics.mockImplementation(() => {
      throw new Error('Service unavailable')
    })

    render(<PerformanceDashboard />)

    // Should still render the dashboard without crashing
    expect(screen.getByText('Performance Dashboard')).toBeInTheDocument()
  })

  it('calculates performance scores correctly', async () => {
    // Test with specific vitals values
    mockPerformanceMonitoringService.getCurrentMetrics.mockReturnValue({
      vitals: {
        lcp: 1200, // Should be good score
        fid: 45,   // Should be good score
        cls: 0.05, // Should be good score
        fcp: 800,  // Should be good score
        ttfb: 300  // Should be good score
      },
      memory: { used: 0, limit: 0, percentage: 0 },
      device: { userAgent: 'test', hardwareConcurrency: 4 },
      connectivity: { effectiveType: '4g' },
      resources: { count: 0, totalSize: 0, compressedSize: 0, slowResources: [], largeResources: [] },
      url: 'test'
    })

    render(<PerformanceDashboard />)

    await waitFor(() => {
      // Should show good performance scores (all above 90%)
      expect(screen.getByText('90%')).toBeInTheDocument()
    })
  })

  it('updates last update timestamp', async () => {
    render(<PerformanceDashboard />)

    await waitFor(() => {
      expect(screen.getByText(/Last updated:/)).toBeInTheDocument()
    })

    const timestampText = screen.getByText(/Last updated:/)
    expect(timestampText).toBeInTheDocument()
  })

  it('shows environment information', async () => {
    render(<PerformanceDashboard />)

    await waitFor(() => {
      expect(screen.getByText(/Environment:/)).toBeInTheDocument()
      expect(screen.getByText(/Version:/)).toBeInTheDocument()
    })
  })
})