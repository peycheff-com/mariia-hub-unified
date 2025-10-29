import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';
import { cacheService } from '@/services/cacheService';
import { bookingEvents } from '@/stores/bookingStore';

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  description?: string;
  capacity: number;
  location?: string;
  isActive: boolean;
  schedule?: ResourceSchedule;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export type ResourceType = 'room' | 'equipment' | 'specialist' | 'facility' | 'other';

export interface ResourceSchedule {
  id: string;
  resourceId: string;
  dayOfWeek: number; // 0-6, Sunday to Saturday
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  isActive: boolean;
  breakTimes?: Array<{
    startTime: string;
    endTime: string;
  }>;
}

export interface ResourceRequirement {
  id: string;
  serviceId: string;
  resourceId: string;
  resourceType: ResourceType;
  quantity: number;
  isRequired: boolean;
  priority: number; // 1-10, higher is more important
  flexibleTiming?: boolean;
  alternativeResources?: string[]; // Alternative resource IDs
}

export interface ResourceAllocation {
  id: string;
  bookingId: string;
  resourceId: string;
  resourceType: ResourceType;
  quantity: number;
  allocatedAt: Date;
  startTime: Date;
  endTime: Date;
  status: 'allocated' | 'confirmed' | 'released' | 'conflict';
  metadata?: Record<string, any>;
}

export interface ResourceConflict {
  id: string;
  resourceId: string;
  bookingId1: string;
  bookingId2: string;
  conflictType: 'double_booking' | 'over_capacity' | 'schedule_conflict' | 'maintenance';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detectedAt: Date;
  resolvedAt?: Date;
  resolution?: string;
}

export interface ResourceUtilization {
  resourceId: string;
  resourceName: string;
  resourceType: ResourceType;
  totalCapacity: number;
  utilizedCapacity: number;
  utilizationRate: number;
  timeSlots: Array<{
    startTime: Date;
    endTime: Date;
    utilizationRate: number;
    bookingsCount: number;
  }>;
  peakUtilization: number;
  averageUtilization: number;
}

export interface AllocationRequest {
  bookingId: string;
  serviceId: string;
  startTime: Date;
  endTime: Date;
  requirements: Array<{
    resourceType: ResourceType;
    quantity: number;
    isRequired: boolean;
  }>;
  preferredResources?: string[];
  excludeResources?: string[];
  allowAlternatives?: boolean;
}

export interface AllocationResult {
  success: boolean;
  allocations?: ResourceAllocation[];
  conflicts?: ResourceConflict[];
  alternatives?: Array<{
    requirement: string;
    alternativeResources: string[];
    alternativeTimeSlots: Array<{
      startTime: Date;
      endTime: Date;
      availableResources: string[];
    }>;
  }>;
  error?: string;
}

class ResourceAllocationService {
    private CACHE_KEY_PREFIX = 'resource_allocation_';
  private CACHE_TTL = 2 * 60 * 1000; // 2 minutes

  async getResources(
    type?: ResourceType,
    location?: string,
    activeOnly: boolean = true
  ): Promise<Resource[]> {
    try {
      let query = supabase
        .from('resources')
        .select(`
          *,
          resource_schedules (*)
        `)
        .order('name');

      if (type) {
        query = query.eq('type', type);
      }

      if (location) {
        query = query.eq('location', location);
      }

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(this.mapDbToResource);
    } catch (error) {
      logger.error('Failed to get resources', { error, type, location });
      return [];
    }
  }

  async getServiceRequirements(serviceId: string): Promise<ResourceRequirement[]> {
    try {
      const cacheKey = `${this.CACHE_KEY_PREFIX}requirements_${serviceId}`;

      // Check cache first
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      const { data, error } = await supabase
        .from('service_resource_requirements')
        .select(`
          *,
          resources:resource_id (
            id,
            name,
            type,
            capacity
          )
        `)
        .eq('service_id', serviceId)
        .eq('is_active', true)
        .order('priority', { ascending: false });

      if (error) throw error;

      const requirements = (data || []).map(this.mapDbToRequirement);

      // Cache result
      await cacheService.set(cacheKey, requirements, this.CACHE_TTL);

      return requirements;
    } catch (error) {
      logger.error('Failed to get service requirements', { error, serviceId });
      return [];
    }
  }

  async allocateResources(request: AllocationRequest): Promise<AllocationResult> {
    try {
      // Get requirements for the service
      const requirements = await this.getServiceRequirements(request.serviceId);

      // Merge with request requirements
      const allRequirements = [...requirements];
      if (request.requirements.length > 0) {
        request.requirements.forEach(req => {
          const existing = allRequirements.find(r => r.resourceType === req.resourceType);
          if (existing) {
            existing.quantity = Math.max(existing.quantity, req.quantity);
            existing.isRequired = existing.isRequired || req.isRequired;
          } else {
            allRequirements.push({
              id: '',
              serviceId: request.serviceId,
              resourceId: '',
              resourceType: req.resourceType,
              quantity: req.quantity,
              isRequired: req.isRequired,
              priority: 5,
              flexibleTiming: false,
              alternativeResources: []
            });
          }
        });
      }

      // Check for conflicts and availability
      const conflictCheck = await this.checkResourceConflicts(request);
      if (conflictCheck.conflicts.length > 0) {
        // Try to find alternatives
        const alternatives = await this.findAlternatives(request, conflictCheck);

        return {
          success: false,
          conflicts: conflictCheck.conflicts,
          alternatives,
          error: 'Resource conflicts detected'
        };
      }

      // Perform allocations
      const allocations: ResourceAllocation[] = [];

      for (const requirement of allRequirements) {
        if (requirement.isRequired) {
          const allocation = await this.allocateResource(request, requirement);
          if (allocation) {
            allocations.push(allocation);
          }
        }
      }

      if (allocations.length === 0) {
        return {
          success: false,
          error: 'No resources could be allocated'
        };
      }

      // Log successful allocation
      logger.info('Resources allocated successfully', {
        bookingId: request.bookingId,
        allocationsCount: allocations.length
      });

      // Emit event
      bookingEvents.emit('resources_allocated', {
        bookingId: request.bookingId,
        allocations
      });

      return {
        success: true,
        allocations
      };
    } catch (error) {
      logger.error('Failed to allocate resources', { error, request });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Allocation failed'
      };
    }
  }

  private async checkResourceConflicts(request: AllocationRequest): Promise<{
    conflicts: ResourceConflict[];
    availableResources: string[];
  }> {
    try {
      const conflicts: ResourceConflict[] = [];
      const availableResources: string[] = [];

      // Get all potential resources for the requirements
      const resourceTypes = [...new Set(request.requirements.map(req => req.resourceType))];
      const resources = await this.getResources();

      for (const resource of resources) {
        if (!resourceTypes.includes(resource.type)) continue;

        // Check if resource is available during the requested time
        const isAvailable = await this.checkResourceAvailability(
          resource.id,
          request.startTime,
          request.endTime
        );

        if (isAvailable) {
          availableResources.push(resource.id);
        } else {
          // Check for specific conflicts
          const existingAllocations = await this.getResourceAllocations(
            resource.id,
            request.startTime,
            request.endTime
          );

          existingAllocations.forEach(allocation => {
            conflicts.push({
              id: `conflict-${Date.now()}-${Math.random()}`,
              resourceId: resource.id,
              bookingId1: request.bookingId,
              bookingId2: allocation.bookingId,
              conflictType: 'double_booking',
              severity: 'high',
              description: `Resource ${resource.name} is already allocated to booking ${allocation.bookingId}`,
              detectedAt: new Date()
            });
          });
        }
      }

      return { conflicts, availableResources };
    } catch (error) {
      logger.error('Failed to check resource conflicts', { error, request });
      return { conflicts: [], availableResources: [] };
    }
  }

  private async checkResourceAvailability(
    resourceId: string,
    startTime: Date,
    endTime: Date
  ): Promise<boolean> {
    try {
      // Check resource schedule
      const { data: schedule, error: scheduleError } = await supabase
        .from('resource_schedules')
        .select('*')
        .eq('resource_id', resourceId)
        .eq('is_active', true)
        .eq('day_of_week', startTime.getDay());

      if (scheduleError) throw scheduleError;

      if (!schedule || schedule.length === 0) {
        return false; // No schedule means not available
      }

      const resourceSchedule = schedule[0];
      const requestStart = this.timeToMinutes(startTime.toTimeString().slice(0, 5));
      const requestEnd = this.timeToMinutes(endTime.toTimeString().slice(0, 5));
      const scheduleStart = this.timeToMinutes(resourceSchedule.start_time);
      const scheduleEnd = this.timeToMinutes(resourceSchedule.end_time);

      // Check if request time is within schedule
      if (requestStart < scheduleStart || requestEnd > scheduleEnd) {
        return false;
      }

      // Check break times
      if (resourceSchedule.break_times) {
        for (const breakTime of resourceSchedule.break_times) {
          const breakStart = this.timeToMinutes(breakTime.startTime);
          const breakEnd = this.timeToMinutes(breakTime.endTime);

          if (requestStart < breakEnd && requestEnd > breakStart) {
            return false;
          }
        }
      }

      // Check existing allocations
      const { data: existingAllocations, error: allocationError } = await supabase
        .from('resource_allocations')
        .select('*')
        .eq('resource_id', resourceId)
        .in('status', ['allocated', 'confirmed'])
        .or(`start_time.lte.${endTime.toISOString()},end_time.gte.${startTime.toISOString()}`);

      if (allocationError) throw allocationError;

      // Check capacity
      const resource = await this.getResourceById(resourceId);
      if (!resource) return false;

      const totalAllocated = (existingAllocations || []).reduce((sum, allocation) => sum + allocation.quantity, 0);

      return totalAllocated < resource.capacity;
    } catch (error) {
      logger.error('Failed to check resource availability', { error, resourceId, startTime, endTime });
      return false;
    }
  }

  private async getResourceAllocations(
    resourceId: string,
    startTime: Date,
    endTime: Date
  ): Promise<ResourceAllocation[]> {
    try {
      const { data, error } = await supabase
        .from('resource_allocations')
        .select('*')
        .eq('resource_id', resourceId)
        .in('status', ['allocated', 'confirmed'])
        .or(`start_time.lte.${endTime.toISOString()},end_time.gte.${startTime.toISOString()}`);

      if (error) throw error;

      return (data || []).map(this.mapDbToAllocation);
    } catch (error) {
      logger.error('Failed to get resource allocations', { error, resourceId });
      return [];
    }
  }

  private async allocateResource(
    request: AllocationRequest,
    requirement: ResourceRequirement
  ): Promise<ResourceAllocation | null> {
    try {
      // Find suitable resource
      const suitableResources = await this.findSuitableResources(requirement, request);

      if (suitableResources.length === 0) {
        return null;
      }

      // Select the best resource (first available for now, could be optimized)
      const selectedResource = suitableResources[0];

      // Create allocation
      const { data, error } = await supabase
        .from('resource_allocations')
        .insert({
          booking_id: request.bookingId,
          resource_id: selectedResource.id,
          resource_type: requirement.resourceType,
          quantity: requirement.quantity,
          start_time: request.startTime.toISOString(),
          end_time: request.endTime.toISOString(),
          status: 'allocated',
          allocated_at: new Date().toISOString(),
          metadata: {
            requirementId: requirement.id,
            isRequired: requirement.isRequired,
            priority: requirement.priority
          }
        })
        .select()
        .single();

      if (error) throw error;

      return this.mapDbToAllocation(data);
    } catch (error) {
      logger.error('Failed to allocate resource', { error, requirement });
      return null;
    }
  }

  private async findSuitableResources(
    requirement: ResourceRequirement,
    request: AllocationRequest
  ): Promise<Resource[]> {
    try {
      let query = supabase
        .from('resources')
        .select('*')
        .eq('type', requirement.resourceType)
        .eq('is_active', true);

      // Filter by preferred resources if specified
      if (request.preferredResources && request.preferredResources.length > 0) {
        query = query.in('id', request.preferredResources);
      }

      // Exclude specific resources if specified
      if (request.excludeResources && request.excludeResources.length > 0) {
        // Use proper parameterized query to prevent SQL injection
        query = query.not('id', 'in', request.excludeResources);
      }

      const { data, error } = await query;

      if (error) throw error;

      const resources = (data || []).map(this.mapDbToResource);

      // Filter by availability
      const availableResources = [];

      for (const resource of resources) {
        const isAvailable = await this.checkResourceAvailability(
          resource.id,
          request.startTime,
          request.endTime
        );

        if (isAvailable) {
          availableResources.push(resource);
        }
      }

      // Sort by priority (could be enhanced with more sophisticated sorting)
      return availableResources.sort((a, b) => {
        // Prefer resources that are in preferred list
        const aPreferred = request.preferredResources?.includes(a.id) ? 1 : 0;
        const bPreferred = request.preferredResources?.includes(b.id) ? 1 : 0;

        if (aPreferred !== bPreferred) {
          return bPreferred - aPreferred;
        }

        // Prefer resources with lower utilization
        return a.utilizationRate - b.utilizationRate;
      });
    } catch (error) {
      logger.error('Failed to find suitable resources', { error, requirement });
      return [];
    }
  }

  private async findAlternatives(
    request: AllocationRequest,
    conflictCheck: { conflicts: ResourceConflict[]; availableResources: string[] }
  ) {
    // This is a simplified alternative finding logic
    // In practice, this would be more sophisticated
    const alternatives = [];

    for (const requirement of request.requirements) {
      if (requirement.isRequired) {
        // Try to find alternative time slots
        const timeAlternatives = await this.findAlternativeTimeSlots(request, requirement);

        alternatives.push({
          requirement: `${requirement.resourceType} (${requirement.quantity})`,
          alternativeResources: conflictCheck.availableResources,
          alternativeTimeSlots: timeAlternatives
        });
      }
    }

    return alternatives;
  }

  private async findAlternativeTimeSlots(
    request: AllocationRequest,
    requirement: ResourceRequirement
  ): Promise<Array<{ startTime: Date; endTime: Date; availableResources: string[] }>> {
    const alternatives = [];
    const duration = request.endTime.getTime() - request.startTime.getTime();
    const searchDays = 7; // Search within next 7 days

    for (let dayOffset = 1; dayOffset <= searchDays; dayOffset++) {
      const alternativeDate = new Date(request.startTime);
      alternativeDate.setDate(alternativeDate.getDate() + dayOffset);

      // Try different time slots throughout the day
      const timeSlots = ['09:00', '11:00', '14:00', '16:00', '18:00'];

      for (const timeSlot of timeSlots) {
        const [hours, minutes] = timeSlot.split(':').map(Number);
        const alternativeStart = new Date(alternativeDate);
        alternativeStart.setHours(hours, minutes, 0, 0);

        const alternativeEnd = new Date(alternativeStart.getTime() + duration);

        // Check if this slot would work
        const tempRequest: AllocationRequest = {
          ...request,
          startTime: alternativeStart,
          endTime: alternativeEnd
        };

        const conflictCheck = await this.checkResourceConflicts(tempRequest);

        if (conflictCheck.availableResources.length > 0) {
          alternatives.push({
            startTime: alternativeStart,
            endTime: alternativeEnd,
            availableResources: conflictCheck.availableResources
          });
        }
      }
    }

    return alternatives.slice(0, 5); // Return top 5 alternatives
  }

  async releaseResources(bookingId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('resource_allocations')
        .update({
          status: 'released',
          released_at: new Date().toISOString()
        })
        .eq('booking_id', bookingId)
        .in('status', ['allocated', 'confirmed']);

      if (error) throw error;

      logger.info('Resources released', { bookingId });

      // Emit event
      bookingEvents.emit('resources_released', { bookingId });

      return true;
    } catch (error) {
      logger.error('Failed to release resources', { error, bookingId });
      return false;
    }
  }

  async getResourceUtilization(
    resourceId: string,
    dateRange?: { from: Date; to: Date }
  ): Promise<ResourceUtilization | null> {
    try {
      // Get resource details
      const resource = await this.getResourceById(resourceId);
      if (!resource) return null;

      // Get allocations for the time period
      let query = supabase
        .from('resource_allocations')
        .select('*')
        .eq('resource_id', resourceId)
        .in('status', ['allocated', 'confirmed']);

      if (dateRange) {
        query = query
          .gte('start_time', dateRange.from.toISOString())
          .lte('end_time', dateRange.to.toISOString());
      }

      const { data: allocations, error } = await query;

      if (error) throw error;

      // Calculate utilization metrics
      const utilization = this.calculateUtilization(resource, allocations || []);

      return {
        resourceId: resource.id,
        resourceName: resource.name,
        resourceType: resource.type,
        totalCapacity: resource.capacity,
        utilizedCapacity: utilization.averageUtilizedCapacity,
        utilizationRate: utilization.averageUtilizationRate,
        timeSlots: utilization.timeSlots,
        peakUtilization: utilization.peakUtilization,
        averageUtilization: utilization.averageUtilizationRate
      };
    } catch (error) {
      logger.error('Failed to get resource utilization', { error, resourceId });
      return null;
    }
  }

  private calculateUtilization(resource: Resource, allocations: any[]) {
    // Simplified utilization calculation
    const totalMinutes = 24 * 60; // Total minutes in a day
    const utilizedMinutes = allocations.reduce((sum, allocation) => {
      const start = new Date(allocation.start_time);
      const end = new Date(allocation.end_time);
      return sum + (end.getTime() - start.getTime()) / (1000 * 60);
    }, 0);

    const averageUtilizationRate = Math.min(100, (utilizedMinutes / totalMinutes) * 100);
    const averageUtilizedCapacity = (resource.capacity * averageUtilizationRate) / 100;
    const peakUtilization = Math.max(0, ...allocations.map(a => (a.quantity / resource.capacity) * 100));

    return {
      timeSlots: [], // Would be populated with actual time slot data
      peakUtilization,
      averageUtilizationRate,
      averageUtilizedCapacity
    };
  }

  private async getResourceById(resourceId: string): Promise<Resource | null> {
    try {
      const { data, error } = await supabase
        .from('resources')
        .select(`
          *,
          resource_schedules (*)
        `)
        .eq('id', resourceId)
        .single();

      if (error || !data) return null;

      return this.mapDbToResource(data);
    } catch (error) {
      logger.error('Failed to get resource by ID', { error, resourceId });
      return null;
    }
  }

  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Database mapping methods
  private mapDbToResource(dbResource: any): Resource {
    return {
      id: dbResource.id,
      name: dbResource.name,
      type: dbResource.type,
      description: dbResource.description,
      capacity: dbResource.capacity,
      location: dbResource.location,
      isActive: dbResource.is_active,
      schedule: dbResource.resource_schedules?.[0],
      metadata: dbResource.metadata,
      createdAt: new Date(dbResource.created_at),
      updatedAt: new Date(dbResource.updated_at),
      utilizationRate: 0 // Would be calculated separately
    };
  }

  private mapDbToRequirement(dbRequirement: any): ResourceRequirement {
    return {
      id: dbRequirement.id,
      serviceId: dbRequirement.service_id,
      resourceId: dbRequirement.resource_id,
      resourceType: dbRequirement.resource_type,
      quantity: dbRequirement.quantity,
      isRequired: dbRequirement.is_required,
      priority: dbRequirement.priority,
      flexibleTiming: dbRequirement.flexible_timing,
      alternativeResources: dbRequirement.alternative_resources || []
    };
  }

  private mapDbToAllocation(dbAllocation: any): ResourceAllocation {
    return {
      id: dbAllocation.id,
      bookingId: dbAllocation.booking_id,
      resourceId: dbAllocation.resource_id,
      resourceType: dbAllocation.resource_type,
      quantity: dbAllocation.quantity,
      allocatedAt: new Date(dbAllocation.allocated_at),
      startTime: new Date(dbAllocation.start_time),
      endTime: new Date(dbAllocation.end_time),
      status: dbAllocation.status,
      metadata: dbAllocation.metadata
    };
  }

  async getResourceConflicts(
    dateRange?: { from: Date; to: Date }
  ): Promise<ResourceConflict[]> {
    try {
      let query = supabase
        .from('resource_conflicts')
        .select('*')
        .is('resolved_at', null)
        .order('severity', { ascending: false });

      if (dateRange) {
        query = query
          .gte('detected_at', dateRange.from.toISOString())
          .lte('detected_at', dateRange.to.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(this.mapDbToConflict);
    } catch (error) {
      logger.error('Failed to get resource conflicts', { error });
      return [];
    }
  }

  private mapDbToConflict(dbConflict: any): ResourceConflict {
    return {
      id: dbConflict.id,
      resourceId: dbConflict.resource_id,
      bookingId1: dbConflict.booking_id_1,
      bookingId2: dbConflict.booking_id_2,
      conflictType: dbConflict.conflict_type,
      severity: dbConflict.severity,
      description: dbConflict.description,
      detectedAt: new Date(dbConflict.detected_at),
      resolvedAt: dbConflict.resolved_at ? new Date(dbConflict.resolved_at) : undefined,
      resolution: dbConflict.resolution
    };
  }
}

export const resourceAllocationService = new ResourceAllocationService();