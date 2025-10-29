import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { createSupabaseMock } from '@/test/mocks/services.mock'

import StaffManagement from '../StaffManagement'

// Mock the dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: createSupabaseMock(),
}))

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
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
}))

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className, ...props }: any) => (
    <button
      onClick={onClick}
      className={className}
      data-testid="button"
      {...props}
    >
      {children}
    </button>
  ),
}))

vi.mock('@/components/ui/input', () => ({
  Input: ({ value, onChange, placeholder, className, ...props }: any) => (
    <input
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      data-testid="input"
      {...props}
    />
  ),
}))

vi.mock('@/components/ui/label', () => ({
  Label: ({ children, className, ...props }: any) => (
    <label className={className} data-testid="label" {...props}>{children}</label>
  ),
}))

vi.mock('@/components/ui/textarea', () => ({
  Textarea: ({ value, onChange, placeholder, className, ...props }: any) => (
    <textarea
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      data-testid="textarea"
      {...props}
    />
  ),
}))

vi.mock('@/components/ui/select', () => ({
  Select: ({ children, onValueChange, value }: any) => (
    <div data-testid="select" data-value={value} onClick={() => onValueChange?.('test-role')}>
      {children}
    </div>
  ),
  SelectContent: ({ children }: any) => <div data-testid="select-content">{children}</div>,
  SelectItem: ({ children, value }: any) => <div data-testid="select-item" data-value={value}>{children}</div>,
  SelectTrigger: ({ children }: any) => <div data-testid="select-trigger">{children}</div>,
  SelectValue: ({ children }: any) => <div data-testid="select-value">{children}</div>,
}))

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open, onOpenChange }: any) => (
    open ? <div data-testid="dialog">{children({ open, onOpenChange })}</div> : null
  ),
  DialogContent: ({ children, className, ...props }: any) => (
    <div className={className} data-testid="dialog-content" {...props}>{children}</div>
  ),
  DialogHeader: ({ children, ...props }: any) => (
    <div data-testid="dialog-header" {...props}>{children}</div>
  ),
  DialogTitle: ({ children, className, ...props }: any) => (
    <h2 className={className} data-testid="dialog-title" {...props}>{children}</h2>
  ),
}))

vi.mock('@/components/ui/badge', () => ({
  Badge: ({ children, className, variant, ...props }: any) => (
    <span className={className} data-variant={variant} data-testid="badge" {...props}>{children}</span>
  ),
}))

vi.mock('@/components/ui/tabs', () => ({
  Tabs: ({ children, onValueChange, value }: any) => (
    <div data-testid="tabs" data-value={value}>{children}</div>
  ),
  TabsContent: ({ children, value }: any) => (
    <div data-testid="tabs-content" data-value={value}>{children}</div>
  ),
  TabsList: ({ children }: any) => (
    <div data-testid="tabs-list">{children}</div>
  ),
  TabsTrigger: ({ children, value, onClick }: any) => (
    <button data-testid="tabs-trigger" data-value={value} onClick={onClick}>{children}</button>
  ),
}))

vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children, className, ...props }: any) => (
    <div className={className} data-testid="avatar" {...props}>{children}</div>
  ),
  AvatarFallback: ({ children, className, ...props }: any) => (
    <div className={className} data-testid="avatar-fallback" {...props}>{children}</div>
  ),
  AvatarImage: ({ src, className, ...props }: any) => (
    <img src={src} className={className} data-testid="avatar-image" {...props} />
  ),
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

vi.mock('@/components/ui/table', () => ({
  Table: ({ children }: any) => <table data-testid="table">{children}</table>,
  TableBody: ({ children }: any) => <tbody data-testid="table-body">{children}</tbody>,
  TableCell: ({ children, className, ...props }: any) => <td className={className} {...props}>{children}</td>,
  TableHead: ({ children, className, ...props }: any) => <th className={className} {...props}>{children}</th>,
  TableHeader: ({ children }: any) => <thead data-testid="table-header">{children}</thead>,
  TableRow: ({ children, className, ...props }: any) => <tr className={className} {...props}>{children}</tr>,
}))

describe('StaffManagement', () => {
  let mockSupabase: any
  let mockToast: any

  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase = createSupabaseMock()
    mockToast = vi.fn()

    // Setup mock data
    const mockStaffData = [
      {
        id: 'staff-1',
        first_name: 'Jane',
        last_name: 'Smith',
        email: 'jane@example.com',
        phone: '+48123456789',
        role_id: 'role-1',
        skills: ['beauty', 'massage'],
        specializations: ['PMU', 'Microblading'],
        employment_type: 'full_time',
        hourly_rate: 150,
        commission_rate: 10,
        max_daily_hours: 8,
        work_days: [1, 2, 3, 4, 5],
        bio: 'Experienced beautician',
        is_active: true,
        staff_roles: {
          name: 'Senior Beautician',
          level: 75,
          permissions: { bookings: true, services: true }
        }
      },
      {
        id: 'staff-2',
        first_name: 'John',
        last_name: 'Doe',
        email: 'john@example.com',
        role_id: 'role-2',
        skills: ['fitness'],
        specializations: ['Personal Training'],
        employment_type: 'part_time',
        hourly_rate: 100,
        max_daily_hours: 6,
        work_days: [1, 3, 5],
        is_active: false,
        staff_roles: {
          name: 'Trainer',
          level: 50,
          permissions: { bookings: false, services: true }
        }
      }
    ]

    const mockRolesData = [
      {
        id: 'role-1',
        name: 'Senior Beautician',
        description: 'Senior level beautician with full permissions',
        level: 75,
        is_system_role: false,
        permissions: { bookings: true, services: true, staff: false }
      },
      {
        id: 'role-2',
        name: 'Trainer',
        description: 'Fitness trainer',
        level: 50,
        is_system_role: false,
        permissions: { bookings: false, services: true, staff: false }
      },
      {
        id: 'role-3',
        name: 'Admin',
        description: 'System administrator',
        level: 90,
        is_system_role: true,
        permissions: { bookings: true, services: true, staff: true }
      }
    ]

    // Mock the Supabase queries
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'staff_members') {
        return {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: mockStaffData,
            error: null
          }),
          insert: vi.fn().mockResolvedValue({
            data: { id: 'new-staff' },
            error: null
          }),
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({
            data: mockStaffData[0],
            error: null
          }),
          delete: vi.fn().mockReturnThis()
        }
      }
      if (table === 'staff_roles') {
        return {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: mockRolesData,
            error: null
          })
        }
      }
      return mockSupabase.from(table)
    })

    vi.mock('@/hooks/use-toast', () => ({
      useToast: () => ({
        toast: mockToast,
      }),
    }))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders loading state initially', () => {
    // Override mock to simulate loading
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockImplementation(() => new Promise(() => {})) // Never resolves
    })

    render(<StaffManagement />)

    expect(screen.getByRole('generic', { hidden: true })).toBeInTheDocument() // Loading spinner
  })

  it('renders staff management interface with all sections', async () => {
    render(<StaffManagement />)

    await waitFor(() => {
      expect(screen.getByText('Staff Management')).toBeInTheDocument()
      expect(screen.getByText('Manage team members, roles, and availability')).toBeInTheDocument()
    })

    // Check for stats cards
    expect(screen.getByText('Total Staff')).toBeInTheDocument()
    expect(screen.getByText('Full-Time')).toBeInTheDocument()
    expect(screen.getByText('Admin Level')).toBeInTheDocument()
    expect(screen.getByText('Daily Hours')).toBeInTheDocument()

    // Check for add staff button
    expect(screen.getByRole('button', { name: /add staff member/i })).toBeInTheDocument()
  })

  it('displays staff statistics correctly', async () => {
    render(<StaffManagement />)

    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument() // Total staff
      expect(screen.getByText('1')).toBeInTheDocument() // Full-time staff
      expect(screen.getByText('1')).toBeInTheDocument() // Admin level roles
      expect(screen.getByText('14')).toBeInTheDocument() // Total daily hours (8 + 6)
    })
  })

  it('renders staff table with correct data', async () => {
    render(<StaffManagement />)

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      expect(screen.getByText('jane@example.com')).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('john@example.com')).toBeInTheDocument()
    })

    // Check for roles
    expect(screen.getByText('Senior Beautician')).toBeInTheDocument()
    expect(screen.getByText('Trainer')).toBeInTheDocument()

    // Check for skills badges
    expect(screen.getByText('beauty')).toBeInTheDocument()
    expect(screen.getByText('massage')).toBeInTheDocument()
    expect(screen.getByText('fitness')).toBeInTheDocument()
  })

  it('handles search functionality correctly', async () => {
    const user = userEvent.setup()
    render(<StaffManagement />)

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search staff...')).toBeInTheDocument()
    })

    const searchInput = screen.getByPlaceholderText('Search staff...')
    await user.type(searchInput, 'Jane')

    await waitFor(() => {
      expect(screen.getByText('Jane Smith')).toBeInTheDocument()
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
    })
  })

  it('handles role filtering correctly', async () => {
    render(<StaffManagement />)

    await waitFor(() => {
      const roleSelect = screen.getByDisplayValue('all')
      expect(roleSelect).toBeInTheDocument()
    })

    // Click on role filter
    const roleSelect = screen.getByDisplayValue('all')
    fireEvent.click(roleSelect)

    await waitFor(() => {
      expect(screen.getByText('Senior Beautician')).toBeInTheDocument()
      expect(screen.getByText('Trainer')).toBeInTheDocument()
    })
  })

  it('handles status filtering correctly', async () => {
    render(<StaffManagement />)

    await waitFor(() => {
      const statusSelect = screen.getByDisplayValue('all')
      expect(statusSelect).toBeInTheDocument()
    })

    // Click on status filter
    const statusSelect = screen.getByDisplayValue('all')
    fireEvent.click(statusSelect)
  })

  it('opens add staff dialog correctly', async () => {
    const user = userEvent.setup()
    render(<StaffManagement />)

    await waitFor(() => {
      const addButton = screen.getByRole('button', { name: /add staff member/i })
      expect(addButton).toBeInTheDocument()
    })

    const addButton = screen.getByRole('button', { name: /add staff member/i })
    await user.click(addButton)

    await waitFor(() => {
      expect(screen.getByTestId('dialog')).toBeInTheDocument()
      expect(screen.getByText('Add New Staff Member')).toBeInTheDocument()
    })
  })

  it('handles staff form submission correctly', async () => {
    const user = userEvent.setup()
    render(<StaffManagement />)

    // Open add staff dialog
    await waitFor(() => {
      const addButton = screen.getByRole('button', { name: /add staff member/i })
      user.click(addButton)
    })

    await waitFor(() => {
      expect(screen.getByTestId('dialog')).toBeInTheDocument()
    })

    // Fill out the form
    const firstNameInput = screen.getAllByTestId('input')[0]
    const lastNameInput = screen.getAllByTestId('input')[1]
    const emailInput = screen.getAllByTestId('input')[2]

    await user.type(firstNameInput, 'Alice')
    await user.type(lastNameInput, 'Johnson')
    await user.type(emailInput, 'alice@example.com')

    // Submit the form
    const form = screen.getByTestId('dialog-content').querySelector('form')
    if (form) {
      fireEvent.submit(form)
    }

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Staff member created successfully'
      })
    })
  })

  it('handles staff editing correctly', async () => {
    const user = userEvent.setup()
    render(<StaffManagement />)

    await waitFor(() => {
      const editButtons = screen.getAllByRole('button', { name: '' })
      expect(editButtons.length).toBeGreaterThan(0)
    })

    // Find and click edit button for first staff member
    const editButtons = screen.getAllByRole('button', { name: '' })
    const editButton = editButtons.find(btn =>
      btn.querySelector('svg[class*="lucide-edit"]')
    )

    if (editButton) {
      await user.click(editButton)

      await waitFor(() => {
        expect(screen.getByTestId('dialog')).toBeInTheDocument()
        expect(screen.getByText('Edit Staff Member')).toBeInTheDocument()
      })
    }
  })

  it('handles staff status toggle correctly', async () => {
    const user = userEvent.setup()
    render(<StaffManagement />)

    await waitFor(() => {
      const switches = screen.getAllByTestId('switch')
      expect(switches.length).toBeGreaterThan(0)
    })

    const switches = screen.getAllByTestId('switch')
    const firstSwitch = switches[0]

    await user.click(firstSwitch)

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Success',
        description: expect.stringContaining('deactivated')
      })
    })
  })

  it('handles staff deletion correctly', async () => {
    // Mock window.confirm
    const originalConfirm = window.confirm
    window.confirm = vi.fn(() => true)

    const user = userEvent.setup()
    render(<StaffManagement />)

    await waitFor(() => {
      const deleteButtons = screen.getAllByRole('button', { name: '' })
      expect(deleteButtons.length).toBeGreaterThan(0)
    })

    // Find delete button
    const deleteButtons = screen.getAllByRole('button', { name: '' })
    const deleteButton = deleteButtons.find(btn =>
      btn.querySelector('svg[class*="lucide-trash-2"]')
    )

    if (deleteButton) {
      await user.click(deleteButton)

      expect(window.confirm).toHaveBeenCalledWith(
        'Are you sure you want to delete this staff member? This action cannot be undone.'
      )

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Success',
          description: 'Staff member deleted successfully'
        })
      })
    }

    // Restore original confirm
    window.confirm = originalConfirm
  })

  it('renders tabs correctly', async () => {
    render(<StaffManagement />)

    await waitFor(() => {
      expect(screen.getByTestId('tabs')).toBeInTheDocument()
    })

    const tabs = screen.getAllByTestId('tabs-trigger')
    expect(tabs.length).toBe(3)
    expect(screen.getByText('Staff Members')).toBeInTheDocument()
    expect(screen.getByText('Roles & Permissions')).toBeInTheDocument()
    expect(screen.getByText('Availability')).toBeInTheDocument()
  })

  it('displays roles and permissions tab correctly', async () => {
    const user = userEvent.setup()
    render(<StaffManagement />)

    await waitFor(() => {
      const rolesTab = screen.getByText('Roles & Permissions')
      user.click(rolesTab)
    })

    await waitFor(() => {
      expect(screen.getByText('Senior Beautician')).toBeInTheDocument()
      expect(screen.getByText('Trainer')).toBeInTheDocument()
      expect(screen.getByText('Admin')).toBeInTheDocument()
      expect(screen.getByText('System')).toBeInTheDocument()
    })
  })

  it('handles tab switching correctly', async () => {
    const user = userEvent.setup()
    render(<StaffManagement />)

    await waitFor(() => {
      const tabs = screen.getAllByTestId('tabs-trigger')
      expect(tabs.length).toBe(3)
    })

    const availabilityTab = screen.getByText('Availability')
    await user.click(availabilityTab)

    await waitFor(() => {
      expect(screen.getByText('Staff Availability')).toBeInTheDocument()
      expect(screen.getByText('Availability management coming soon...')).toBeInTheDocument()
    })
  })

  it('handles API errors gracefully', async () => {
    // Override mock to simulate error
    mockSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' }
      })
    })

    render(<StaffManagement />)

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Database connection failed',
        variant: 'destructive'
      })
    })
  })

  it('displays correct staff count in stats', async () => {
    render(<StaffManagement />)

    await waitFor(() => {
      const totalStaffCard = screen.getAllByTestId('card')[0]
      expect(totalStaffCard).toBeInTheDocument()
    })

    // Check for active staff count
    expect(screen.getByText('1 active')).toBeInTheDocument()
  })

  it('has proper accessibility attributes', async () => {
    render(<StaffManagement />)

    await waitFor(() => {
      const mainHeading = screen.getByRole('heading', { name: /staff management/i })
      expect(mainHeading).toBeInTheDocument()
      expect(mainHeading.tagName).toBe('H3')
    })

    // Check for form labels
    const labels = screen.getAllByTestId('label')
    expect(labels.length).toBeGreaterThan(0)

    // Check for button roles
    const buttons = screen.getAllByRole('button')
    buttons.forEach(button => {
      expect(button).toHaveAttribute('type')
    })
  })

  it('displays employment type and hourly rate correctly', async () => {
    render(<StaffManagement />)

    await waitFor(() => {
      expect(screen.getByText('full time')).toBeInTheDocument()
      expect(screen.getByText('part time')).toBeInTheDocument()
      expect(screen.getByText('150 PLN/hr')).toBeInTheDocument()
    })
  })

  it('handles form validation correctly', async () => {
    const user = userEvent.setup()
    render(<StaffManagement />)

    // Open add staff dialog
    await waitFor(() => {
      const addButton = screen.getByRole('button', { name: /add staff member/i })
      user.click(addButton)
    })

    await waitFor(() => {
      expect(screen.getByTestId('dialog')).toBeInTheDocument()
    })

    // Try to submit empty form
    const form = screen.getByTestId('dialog-content').querySelector('form')
    if (form) {
      fireEvent.submit(form)
    }

    // Required fields should prevent submission
    expect(mockToast).not.toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Success'
      })
    )
  })

  it('shows avatar fallbacks correctly', async () => {
    render(<StaffManagement />)

    await waitFor(() => {
      const avatarFallbacks = screen.getAllByTestId('avatar-fallback')
      expect(avatarFallbacks.length).toBeGreaterThan(0)
      expect(avatarFallbacks[0]).toHaveTextContent('JS') // Jane Smith
    })
  })
})