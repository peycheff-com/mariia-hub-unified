import { describe, it, expect, beforeEach } from 'vitest'
import type {
  MarketingWorkflow,
  WorkflowNode,
  MarketingTemplate,
  CustomerSegment,
  SegmentCriteria
} from '@/types/marketing-automation'

describe('Marketing Automation Types', () => {
  describe('MarketingWorkflow', () => {
    it('should create a valid workflow with required fields', () => {
      const workflow: MarketingWorkflow = {
        id: 'test-workflow',
        name: 'Test Workflow',
        type: 'welcome_series',
        status: 'draft',
        trigger_config: {
          trigger_type: 'customer_created'
        },
        workflow_nodes: [],
        workflow_edges: [],
        segment_criteria: {},
        created_at: '2024-01-20T10:00:00Z',
        updated_at: '2024-01-20T10:00:00Z',
        metadata: {}
      }

      expect(workflow.id).toBe('test-workflow')
      expect(workflow.name).toBe('Test Workflow')
      expect(workflow.type).toBe('welcome_series')
      expect(workflow.status).toBe('draft')
      expect(workflow.trigger_config.trigger_type).toBe('customer_created')
    })

    it('should handle optional fields', () => {
      const workflow: MarketingWorkflow = {
        id: 'test-workflow',
        name: 'Test Workflow',
        type: 'custom',
        status: 'active',
        trigger_config: {
          trigger_type: 'manual'
        },
        workflow_nodes: [],
        workflow_edges: [],
        segment_criteria: {},
        description: 'Optional description',
        ab_test_config: {
          enabled: true,
          variants: [],
          success_metric: 'open_rate',
          confidence_level: 95,
          test_duration_days: 7
        },
        created_at: '2024-01-20T10:00:00Z',
        updated_at: '2024-01-20T10:00:00Z',
        metadata: {}
      }

      expect(workflow.description).toBe('Optional description')
      expect(workflow.ab_test_config?.enabled).toBe(true)
    })
  })

  describe('WorkflowNode', () => {
    it('should create a node with required properties', () => {
      const node: WorkflowNode = {
        id: 'node-1',
        type: 'send_email',
        config: {
          template_id: 'template-1'
        },
        position: {
          x: 100,
          y: 200
        }
      }

      expect(node.id).toBe('node-1')
      expect(node.type).toBe('send_email')
      expect(node.config.template_id).toBe('template-1')
      expect(node.position.x).toBe(100)
      expect(node.position.y).toBe(200)
    })

    it('should handle different node types', () => {
      const nodeTypes = [
        'send_email',
        'send_sms',
        'send_whatsapp',
        'wait',
        'branch',
        'update_data',
        'ab_test',
        'webhook',
        'tag_customer'
      ] as const

      nodeTypes.forEach(type => {
        const node: WorkflowNode = {
          id: `node-${type}`,
          type,
          config: {},
          position: { x: 0, y: 0 }
        }
        expect(node.type).toBe(type)
      })
    })
  })

  describe('MarketingTemplate', () => {
    it('should create an email template', () => {
      const template: MarketingTemplate = {
        id: 'template-1',
        name: 'Welcome Email',
        channel: 'email',
        type: 'automation',
        subject_template: 'Welcome {{customer_name}}!',
        body_template: '<h1>Welcome!</h1><p>Hello {{customer_name}}</p>',
        variables: [
          {
            name: 'customer_name',
            type: 'string',
            description: 'Customer first name',
            required: true
          }
        ],
        language: 'en',
        is_active: true,
        created_at: '2024-01-20T10:00:00Z',
        updated_at: '2024-01-20T10:00:00Z',
        metadata: {}
      }

      expect(template.channel).toBe('email')
      expect(template.subject_template).toContain('customer_name')
      expect(template.variables).toHaveLength(1)
      expect(template.variables[0].name).toBe('customer_name')
    })

    it('should create an SMS template without subject', () => {
      const template: MarketingTemplate = {
        id: 'template-2',
        name: 'Appointment Reminder',
        channel: 'sms',
        type: 'transactional',
        body_template: 'Hi {{customer_name}}, your appointment is at {{time}}.',
        variables: [
          { name: 'customer_name', type: 'string', required: true },
          { name: 'time', type: 'string', required: true }
        ],
        language: 'en',
        is_active: true,
        created_at: '2024-01-20T10:00:00Z',
        updated_at: '2024-01-20T10:00:00Z',
        metadata: {}
      }

      expect(template.channel).toBe('sms')
      expect(template.subject_template).toBeUndefined()
      expect(template.body_template).toContain('time'))
    })

  describe('CustomerSegment', () => {
    it('should create a segment with criteria', () => {
      const criteria: SegmentCriteria = {
        service_types: ['beauty', 'fitness'],
        total_bookings_min: 5,
        last_booking_after: '2024-01-01',
        email_consent: true
      }

      const segment: CustomerSegment = {
        id: 'segment-1',
        name: 'VIP Customers',
        description: 'High-value customers',
        criteria,
        is_dynamic: true,
        customer_count: 150,
        last_calculated_at: '2024-01-20T10:00:00Z',
        created_at: '2024-01-20T10:00:00Z',
        updated_at: '2024-01-20T10:00:00Z'
      }

      expect(segment.criteria.service_types).toContain('beauty')
      expect(segment.criteria.total_bookings_min).toBe(5)
      expect(segment.is_dynamic).toBe(true)
      expect(segment.customer_count).toBe(150)
    })

    it('should handle empty criteria', () => {
      const segment: CustomerSegment = {
        id: 'segment-all',
        name: 'All Customers',
        criteria: {},
        is_dynamic: true,
        customer_count: 1000,
        created_at: '2024-01-20T10:00:00Z',
        updated_at: '2024-01-20T10:00:00Z'
      }

      expect(Object.keys(segment.criteria)).toHaveLength(0)
    })
  })
})

describe('Template Variable Processing', () => {
  it('should extract variables from template', () => {
    const template = 'Hello {{customer_name}}, your appointment at {{time}} on {{date}} is confirmed.'
    const variableRegex = /\{\{(\w+)\}\}/g
    const matches = template.match(variableRegex)

    expect(matches).toHaveLength(3)
    expect(matches).toContain('{{customer_name}}')
    expect(matches).toContain('{{time}}')
    expect(matches).toContain('{{date}}')
  })

  it('should render template with data', () => {
    const template = 'Hello {{customer_name}}, your appointment is at {{time}}.'
    const data = { customer_name: 'John', time: '10:00 AM' }

    const rendered = template.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      return String(data[varName as keyof typeof data] || `[${varName}]`)
    })

    expect(rendered).toBe('Hello John, your appointment is at 10:00 AM.')
  })

  it('should handle missing variables', () => {
    const template = 'Hello {{customer_name}}, your appointment is at {{time}}.'
    const data = { customer_name: 'John' }

    const rendered = template.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
      return String(data[varName as keyof typeof data] || `[${varName}]`)
    })

    expect(rendered).toBe('Hello John, your appointment is at [time].')
  })
})

describe('Segment Criteria Logic', () => {
  it('should match customers with service types', () => {
    const criteria: SegmentCriteria = {
      service_types: ['beauty', 'fitness']
    }

    const customer1 = { service_types: ['beauty'] }
    const customer2 = { service_types: ['fitness', 'lifestyle'] }
    const customer3 = { service_types: ['lifestyle'] }

    const matchesServiceType = (customer: any) => {
      if (!criteria.service_types?.length) return true
      return criteria.service_types.some(type =>
        customer.service_types?.includes(type)
      )
    }

    expect(matchesServiceType(customer1)).toBe(true)
    expect(matchesServiceType(customer2)).toBe(true)
    expect(matchesServiceType(customer3)).toBe(false)
  })

  it('should match customers by booking count', () => {
    const criteria: SegmentCriteria = {
      total_bookings_min: 5,
      total_bookings_max: 20
    }

    const customers = [
      { total_bookings: 3 },
      { total_bookings: 10 },
      { total_bookings: 25 }
    ]

    const matchesBookingCount = (customer: any) => {
      const min = criteria.total_bookings_min ?? 0
      const max = criteria.total_bookings_max ?? Infinity
      return customer.total_bookings >= min && customer.total_bookings <= max
    }

    expect(matchesBookingCount(customers[0])).toBe(false)
    expect(matchesBookingCount(customers[1])).toBe(true)
    expect(matchesBookingCount(customers[2])).toBe(false)
  })

  it('should match customers by consent', () => {
    const criteria: SegmentCriteria = {
      email_consent: true,
      marketing_consent: true
    }

    const customers = [
      { email_consent: true, marketing_consent: true },
      { email_consent: false, marketing_consent: true },
      { email_consent: true, marketing_consent: false },
      { email_consent: false, marketing_consent: false }
    ]

    const matchesConsent = (customer: any) => {
      if (criteria.email_consent !== undefined && customer.email_consent !== criteria.email_consent) {
        return false
      }
      if (criteria.marketing_consent !== undefined && customer.marketing_consent !== criteria.marketing_consent) {
        return false
      }
      return true
    }

    expect(matchesConsent(customers[0])).toBe(true)
    expect(matchesConsent(customers[1])).toBe(false)
    expect(matchesConsent(customers[2])).toBe(false)
    expect(matchesConsent(customers[3])).toBe(false)
  })
})

describe('Workflow Validation', () => {
  it('should validate workflow has trigger node', () => {
    const nodes: WorkflowNode[] = [
      { id: 'node-1', type: 'trigger', config: {}, position: { x: 0, y: 0 } },
      { id: 'node-2', type: 'send_email', config: {}, position: { x: 100, y: 0 } }
    ]

    const hasTrigger = nodes.some(node => node.type === 'trigger')
    expect(hasTrigger).toBe(true)
  })

  it('should detect circular references', () => {
    const edges = [
      { id: 'e1', source: 'node-1', target: 'node-2' },
      { id: 'e2', source: 'node-2', target: 'node-3' },
      { id: 'e3', source: 'node-3', target: 'node-1' }
    ]

    // Simple circular reference detection
    const visited = new Set()
    let hasCircular = false

    const detectCircular = (nodeId: string, path: string[] = []) => {
      if (path.includes(nodeId)) {
        hasCircular = true
        return
      }

      if (visited.has(nodeId)) return
      visited.add(nodeId)

      const nextNodes = edges
        .filter(e => e.source === nodeId)
        .map(e => e.target)

      nextNodes.forEach(next => detectCircular(next, [...path, nodeId]))
    }

    detectCircular('node-1')
    expect(hasCircular).toBe(true)
  })

  it('should validate node configuration', () => {
    const validateNode = (node: WorkflowNode): string[] => {
      const errors: string[] = []

      switch (node.type) {
        case 'send_email':
          if (!node.config.template_id) {
            errors.push('Email node requires template_id')
          }
          break
        case 'send_sms':
          if (!node.config.message && !node.config.template_id) {
            errors.push('SMS node requires message or template_id')
          }
          break
        case 'wait':
          if (!node.config.duration) {
            errors.push('Wait node requires duration')
          }
          break
        case 'branch':
          if (!node.config.conditions || node.config.conditions.length === 0) {
            errors.push('Branch node requires conditions')
          }
          break
      }

      return errors
    }

    const validNode: WorkflowNode = {
      id: 'email-1',
      type: 'send_email',
      config: { template_id: 'template-1' },
      position: { x: 0, y: 0 }
    }

    const invalidNode: WorkflowNode = {
      id: 'email-2',
      type: 'send_email',
      config: {},
      position: { x: 0, y: 0 }
    }

    expect(validateNode(validNode)).toHaveLength(0)
    expect(validateNode(invalidNode)).toContain('Email node requires template_id')
  })
})

describe('Campaign Metrics Calculation', () => {
  it('should calculate delivery rate', () => {
    const sent = 1000
    const delivered = 950
    const deliveryRate = (delivered / sent) * 100
    expect(deliveryRate).toBe(95)
  })

  it('should calculate open rate', () => {
    const delivered = 950
    const opened = 570
    const openRate = (opened / delivered) * 100
    expect(openRate).toBe(60)
  })

  it('should calculate click rate', () => {
    const opened = 570
    const clicked = 171
    const clickRate = (clicked / opened) * 100
    expect(clickRate).toBe(30)
  })

  it('should calculate conversion rate', () => {
    const clicked = 171
    const converted = 85
    const conversionRate = (converted / clicked) * 100
    expect(conversionRate).toBe(50)
  })

  it('should handle division by zero', () => {
    const delivered = 0
    const opened = 0
    const openRate = delivered > 0 ? (opened / delivered) * 100 : 0
    expect(openRate).toBe(0)
  })
})

describe('Consent Management', () => {
  it('should check consent validity', () => {
    const consent = {
      given: true,
      timestamp: '2024-01-20T10:00:00Z',
      expiryDays: 730
    }

    const now = new Date()
    const consentDate = new Date(consent.timestamp)
    const daysSinceConsent = Math.floor(
      (now.getTime() - consentDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    const isValid = consent.given && daysSinceConsent < consent.expiryDays
    expect(isValid).toBe(true)
  })

  it('should detect expired consent', () => {
    const consent = {
      given: true,
      timestamp: '2022-01-20T10:00:00Z',
      expiryDays: 365
    }

    const now = new Date()
    const consentDate = new Date(consent.timestamp)
    const daysSinceConsent = Math.floor(
      (now.getTime() - consentDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    const isExpired = daysSinceConsent >= consent.expiryDays
    expect(isExpired).toBe(true)
  })

  it('should validate consent source', () => {
    const validSources = [
      'registration_form',
      'checkout',
      'preference_center',
      'unsubscribe_link',
      'data_request'
    ]

    const consent = {
      source: 'registration_form' as const,
      ip: '192.168.1.1',
      userAgent: 'Mozilla/5.0...',
      timestamp: new Date().toISOString()
    }

    const isValidSource = validSources.includes(consent.source)
    expect(isValidSource).toBe(true)
    expect(consent.ip).toMatch(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)
  })
})})
