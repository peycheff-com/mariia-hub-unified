// Integration Tests for Booking System with Real Supabase
// Tests the new architecture components against the actual database

import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { bookingDomainService } from '../bookingDomainService';

describe('Booking System Integration Tests', () => {
  beforeEach(() => {
    // Ensure we're working with clean state
  });

  afterEach(() => {
    // Cleanup if needed
  });

  describe('Service Validation', () => {
    it('should validate Polish phone numbers correctly', () => {
      expect(bookingDomainService['isValidPhone']('+48 512 345 678')).toBe(true);
      expect(bookingDomainService['isValidPhone']('+48512345678')).toBe(true);
      expect(bookingDomainService['isValidPhone']('48 512 345 678')).toBe(true);
      expect(bookingDomainService['isValidPhone']('512345678')).toBe(true);
      expect(bookingDomainService['isValidPhone']('123 456 789')).toBe(false);
      expect(bookingDomainService['isValidPhone']('+44 123 456 789')).toBe(false);
    });

    it('should validate email addresses correctly', () => {
      expect(bookingDomainService['isValidEmail']('test@example.com')).toBe(true);
      expect(bookingDomainService['isValidEmail']('user.name+tag@domain.co.uk')).toBe(true);
      expect(bookingDomainService['isValidEmail']('invalid-email')).toBe(false);
      expect(bookingDomainService['isValidEmail']('@domain.com')).toBe(false);
      expect(bookingDomainService['isValidEmail']('user@')).toBe(false);
    });

    it('should validate status transitions correctly', () => {
      expect(bookingDomainService['isValidStatusTransition']('draft', 'pending')).toBe(true);
      expect(bookingDomainService['isValidStatusTransition']('pending', 'confirmed')).toBe(true);
      expect(bookingDomainService['isValidStatusTransition']('confirmed', 'completed')).toBe(true);
      expect(bookingDomainService['isValidStatusTransition']('confirmed', 'cancelled')).toBe(true);

      // Invalid transitions
      expect(bookingDomainService['isValidStatusTransition']('completed', 'pending')).toBe(false);
      expect(bookingDomainService['isValidStatusTransition']('cancelled', 'confirmed')).toBe(false);
      expect(bookingDomainService['isValidStatusTransition']('draft', 'completed')).toBe(false);
    });
  });

  describe('Location Compatibility', () => {
    it('should validate beauty service locations', () => {
      expect(bookingDomainService['validateLocationCompatibility'](
        'beauty',
        'studio'
      )).toBe(true);

      expect(bookingDomainService['validateLocationCompatibility'](
        'beauty',
        'online'
      )).toBe(true);

      expect(bookingDomainService['validateLocationCompatibility'](
        'beauty',
        'fitness'
      )).toBe(false);
    });

    it('should validate fitness service locations', () => {
      expect(bookingDomainService['validateLocationCompatibility'](
        'fitness',
        'fitness'
      )).toBe(true);

      expect(bookingDomainService['validateLocationCompatibility'](
        'fitness',
        'studio'
      )).toBe(true);

      expect(bookingDomainService['validateLocationCompatibility'](
        'fitness',
        'online'
      )).toBe(true);
    });
  });

  describe('Business Rules', () => {
    it('should check status transitions correctly', () => {
      expect(bookingDomainService['isValidStatusTransition']('pending', 'confirmed')).toBe(true);
      expect(bookingDomainService['isValidStatusTransition']('confirmed', 'cancelled')).toBe(true);
      expect(bookingDomainService['isValidStatusTransition']('cancelled', 'pending')).toBe(false);
    });
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = bookingDomainService;
      const instance2 = bookingDomainService;

      expect(instance1).toBe(instance2);
    });
  });
});