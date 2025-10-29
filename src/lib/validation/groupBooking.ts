import { GroupBookingData, GroupParticipant } from '@/types/booking';

export interface GroupBookingValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
  }>;
  warnings: Array<{
    field: string;
    message: string;
  }>;
}

export class GroupBookingValidator {
  /**
   * Validate complete group booking data
   */
  static validateGroupBooking(data: GroupBookingData): GroupBookingValidationResult {
    const errors: Array<{ field: string; message: string }> = [];
    const warnings: Array<{ field: string; message: string }> = [];

    // Validate group details
    this.validateGroupDetails(data, errors, warnings);

    // Validate participants
    this.validateParticipants(data, errors, warnings);

    // Validate primary contact
    this.validatePrimaryContact(data, errors, warnings);

    // Validate scheduling
    this.validateScheduling(data, errors, warnings);

    // Validate payment
    this.validatePayment(data, errors, warnings);

    // Validate consents
    this.validateConsents(data, errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate group details
   */
  private static validateGroupDetails(
    data: GroupBookingData,
    errors: Array<{ field: string; message: string }>,
    warnings: Array<{ field: string; message: string }>
  ): void {
    // Group name validation
    if (!data.groupName || data.groupName.trim().length === 0) {
      errors.push({
        field: 'groupName',
        message: 'Group name is required',
      });
    } else if (data.groupName.trim().length < 2) {
      errors.push({
        field: 'groupName',
        message: 'Group name must be at least 2 characters',
      });
    } else if (data.groupName.trim().length > 100) {
      errors.push({
        field: 'groupName',
        message: 'Group name cannot exceed 100 characters',
      });
    }

    // Group size validation
    if (!data.groupSize || data.groupSize < 2) {
      errors.push({
        field: 'groupSize',
        message: 'Group size must be at least 2',
      });
    } else if (data.groupSize > 20) {
      errors.push({
        field: 'groupSize',
        message: 'Group size cannot exceed 20 participants',
      });
    }

    // Warnings for large groups
    if (data.groupSize >= 15) {
      warnings.push({
        field: 'groupSize',
        message: 'Large groups (15+) may require additional coordination time',
      });
    }

    // Special requests validation
    if (data.specialRequests && data.specialRequests.length > 500) {
      errors.push({
        field: 'specialRequests',
        message: 'Special requests cannot exceed 500 characters',
      });
    }
  }

  /**
   * Validate participants data
   */
  private static validateParticipants(
    data: GroupBookingData,
    errors: Array<{ field: string; message: string }>,
    warnings: Array<{ field: string; message: string }>
  ): void {
    if (!data.participants || data.participants.length === 0) {
      errors.push({
        field: 'participants',
        message: 'At least one participant is required',
      });
      return;
    }

    // Check participant count matches group size
    if (data.participants.length !== data.groupSize) {
      errors.push({
        field: 'participants',
        message: `Number of participants (${data.participants.length}) must match group size (${data.groupSize})`,
      });
    }

    // Validate each participant
    const emails = new Set<string>();
    const phoneNumbers = new Set<string>();

    data.participants.forEach((participant, index) => {
      const prefix = `participants[${index}]`;

      // Name validation
      if (!participant.firstName || participant.firstName.trim().length === 0) {
        errors.push({
          field: `${prefix}.firstName`,
          message: `First name is required for participant ${index + 1}`,
        });
      } else if (participant.firstName.trim().length > 50) {
        errors.push({
          field: `${prefix}.firstName`,
          message: `First name cannot exceed 50 characters for participant ${index + 1}`,
        });
      }

      if (!participant.lastName || participant.lastName.trim().length === 0) {
        errors.push({
          field: `${prefix}.lastName`,
          message: `Last name is required for participant ${index + 1}`,
        });
      } else if (participant.lastName.trim().length > 50) {
        errors.push({
          field: `${prefix}.lastName`,
          message: `Last name cannot exceed 50 characters for participant ${index + 1}`,
        });
      }

      // Email validation
      if (participant.email && participant.email.trim().length > 0) {
        const emailErrors = this.validateEmail(participant.email);
        if (emailErrors.length > 0) {
          errors.push({
            field: `${prefix}.email`,
            message: `Invalid email for participant ${index + 1}: ${emailErrors.join(', ')}`,
          });
        } else {
          // Check for duplicate emails
          if (emails.has(participant.email.toLowerCase())) {
            warnings.push({
              field: `${prefix}.email`,
              message: `Duplicate email address for participant ${index + 1}`,
            });
          }
          emails.add(participant.email.toLowerCase());
        }
      }

      // Phone validation
      if (participant.phone && participant.phone.trim().length > 0) {
        const phoneErrors = this.validatePhone(participant.phone);
        if (phoneErrors.length > 0) {
          errors.push({
            field: `${prefix}.phone`,
            message: `Invalid phone number for participant ${index + 1}: ${phoneErrors.join(', ')}`,
          });
        } else {
          // Check for duplicate phone numbers
          if (phoneNumbers.has(participant.phone)) {
            warnings.push({
              field: `${prefix}.phone`,
              message: `Duplicate phone number for participant ${index + 1}`,
            });
          }
          phoneNumbers.add(participant.phone);
        }
      }

      // Notes validation
      if (participant.notes && participant.notes.length > 200) {
        errors.push({
          field: `${prefix}.notes`,
          message: `Notes cannot exceed 200 characters for participant ${index + 1}`,
        });
      }
    });
  }

  /**
   * Validate primary contact information
   */
  private static validatePrimaryContact(
    data: GroupBookingData,
    errors: Array<{ field: string; message: string }>,
    warnings: Array<{ field: string; message: string }>
  ): void {
    // Name validation
    if (!data.primaryContact.name || data.primaryContact.name.trim().length === 0) {
      errors.push({
        field: 'primaryContact.name',
        message: 'Primary contact name is required',
      });
    } else if (data.primaryContact.name.trim().length < 2) {
      errors.push({
        field: 'primaryContact.name',
        message: 'Primary contact name must be at least 2 characters',
      });
    } else if (data.primaryContact.name.trim().length > 100) {
      errors.push({
        field: 'primaryContact.name',
        message: 'Primary contact name cannot exceed 100 characters',
      });
    }

    // Email validation
    if (!data.primaryContact.email || data.primaryContact.email.trim().length === 0) {
      errors.push({
        field: 'primaryContact.email',
        message: 'Primary contact email is required',
      });
    } else {
      const emailErrors = this.validateEmail(data.primaryContact.email);
      if (emailErrors.length > 0) {
        errors.push({
          field: 'primaryContact.email',
          message: `Invalid primary contact email: ${emailErrors.join(', ')}`,
        });
      }
    }

    // Phone validation
    if (!data.primaryContact.phone || data.primaryContact.phone.trim().length === 0) {
      warnings.push({
        field: 'primaryContact.phone',
        message: 'Providing a phone number is recommended for urgent updates',
      });
    } else {
      const phoneErrors = this.validatePhone(data.primaryContact.phone);
      if (phoneErrors.length > 0) {
        errors.push({
          field: 'primaryContact.phone',
          message: `Invalid primary contact phone: ${phoneErrors.join(', ')}`,
        });
      }
    }
  }

  /**
   * Validate scheduling information
   */
  private static validateScheduling(
    data: GroupBookingData,
    errors: Array<{ field: string; message: string }>,
    warnings: Array<{ field: string; message: string }>
  ): void {
    // Date validation
    if (!data.selectedSlot.date) {
      errors.push({
        field: 'selectedSlot.date',
        message: 'Booking date is required',
      });
    } else {
      const bookingDate = new Date(data.selectedSlot.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (bookingDate < today) {
        errors.push({
          field: 'selectedSlot.date',
          message: 'Booking date cannot be in the past',
        });
      }

      // Warning for bookings far in advance
      const maxAdvanceDays = 365;
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + maxAdvanceDays);

      if (bookingDate > maxDate) {
        warnings.push({
          field: 'selectedSlot.date',
          message: 'Booking date is more than a year in advance',
        });
      }
    }

    // Time validation
    if (!data.selectedSlot.time) {
      errors.push({
        field: 'selectedSlot.time',
        message: 'Booking time is required',
      });
    }

    // Location type validation
    if (!data.locationType) {
      errors.push({
        field: 'locationType',
        message: 'Location type is required',
      });
    } else if (!['studio', 'fitness', 'online'].includes(data.locationType)) {
      errors.push({
        field: 'locationType',
        message: 'Invalid location type',
      });
    }
  }

  /**
   * Validate payment information
   */
  private static validatePayment(
    data: GroupBookingData,
    errors: Array<{ field: string; message: string }>,
    warnings: Array<{ field: string; message: string }>
  ): void {
    // Payment method validation
    if (!data.paymentMethod) {
      errors.push({
        field: 'paymentMethod',
        message: 'Payment method is required',
      });
    } else if (!['card', 'cash', 'deposit'].includes(data.paymentMethod)) {
      errors.push({
        field: 'paymentMethod',
        message: 'Invalid payment method',
      });
    }

    // Deposit amount validation
    if (data.paymentMethod === 'deposit') {
      if (!data.depositAmount || data.depositAmount <= 0) {
        errors.push({
          field: 'depositAmount',
          message: 'Deposit amount is required when paying by deposit',
        });
      } else if (data.depositAmount && data.depositAmount > 10000) {
        warnings.push({
          field: 'depositAmount',
          message: 'Large deposit amount detected',
        });
      }
    }
  }

  /**
   * Validate consent information
   */
  private static validateConsents(
    data: GroupBookingData,
    errors: Array<{ field: string; message: string }>,
    warnings: Array<{ field: string; message: string }>
  ): void {
    // Terms consent is mandatory
    if (!data.consentTerms) {
      errors.push({
        field: 'consentTerms',
        message: 'You must accept the terms and conditions to proceed',
      });
    }

    // Marketing consent is optional but should be explicitly set
    if (data.consentMarketing === undefined) {
      warnings.push({
        field: 'consentMarketing',
        message: 'Please specify your marketing preferences',
      });
    }
  }

  /**
   * Validate email format
   */
  private static validateEmail(email: string): string[] {
    const errors: string[] = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      errors.push('Invalid email format');
    }

    if (email.length > 254) {
      errors.push('Email address too long');
    }

    const localPart = email.split('@')[0];
    if (localPart.length > 64) {
      errors.push('Local part of email too long');
    }

    return errors;
  }

  /**
   * Validate phone number format
   */
  private static validatePhone(phone: string): string[] {
    const errors: string[] = [];

    // Remove common formatting characters
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');

    // Check if phone contains only digits (and optional + at start)
    const phoneRegex = /^\+?[0-9]+$/;
    if (!phoneRegex.test(cleanPhone)) {
      errors.push('Phone number should contain only digits and optional + at the beginning');
    }

    // Check minimum length (excluding +)
    const digitsOnly = cleanPhone.replace(/^\+/, '');
    if (digitsOnly.length < 9) {
      errors.push('Phone number too short (minimum 9 digits)');
    }

    if (digitsOnly.length > 15) {
      errors.push('Phone number too long (maximum 15 digits)');
    }

    return errors;
  }

  /**
   * Validate group size against service limits
   */
  static validateGroupSizeForService(
    groupSize: number,
    service: {
      max_group_size?: number;
      allows_groups?: boolean;
    }
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!service.allows_groups && groupSize > 1) {
      errors.push('This service does not support group bookings');
    }

    if (service.max_group_size && groupSize > service.max_group_size) {
      errors.push(`Group size exceeds maximum for this service (${service.max_group_size})`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate availability for group booking
   */
  static validateAvailability(
    groupSize: number,
    availableSlots: Array<{
      date: string;
      time: string;
      remainingCapacity: number;
    }>
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check if any slot can accommodate the group
    const canAccommodate = availableSlots.some(
      slot => slot.remainingCapacity >= groupSize
    );

    if (!canAccommodate) {
      errors.push(`No available time slots can accommodate a group of ${groupSize}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export default GroupBookingValidator;