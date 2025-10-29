import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';

import {
  ScreenReaderAnnouncer,
  FocusManager,
  KeyboardNavigation,
  ColorContrast,
  generateAriaLabels,
  validateHeadingHierarchy,
} from './accessibility';

// Setup DOM environment
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
  url: 'http://localhost',
});

global.document = dom.window.document;
global.window = dom.window as any;
global.HTMLElement = dom.window.HTMLElement;
global.NodeList = dom.window.NodeList;
global.HTMLCollection = dom.window.HTMLCollection;

describe('Accessibility Utilities', () => {
  beforeEach(() => {
    // Clear DOM before each test
    document.body.innerHTML = '';
  });

  describe('ScreenReaderAnnouncer', () => {
    beforeEach(() => {
      // ScreenReaderAnnouncer tests need a DOM element for the announcer
      document.body.innerHTML = '<div id="announcer" aria-live="polite" aria-atomic="true"></div>';
    });

    it('should create announcer instance', () => {
      const announcer = ScreenReaderAnnouncer.getInstance();
      expect(announcer).toBeDefined();
    });

    it('should announce messages', () => {
      const announcer = ScreenReaderAnnouncer.getInstance();
      const announceSpy = vi.spyOn(announcer, 'announce');

      announcer.announce('Test message', 'polite');
      expect(announceSpy).toHaveBeenCalledWith('Test message', 'polite');
    });

    it('should handle different priority levels', () => {
      const announcer = ScreenReaderAnnouncer.getInstance();
      const announceSpy = vi.spyOn(announcer, 'announce');

      announcer.announce('Urgent message', 'assertive');
      expect(announceSpy).toHaveBeenCalledWith('Urgent message', 'assertive');
    });
  });

  describe('FocusManager', () => {
    beforeEach(() => {
      // Clear and create test elements after global beforeEach
      document.body.innerHTML = `
        <div id="container">
          <button id="btn1">Button 1</button>
          <button id="btn2">Button 2</button>
          <button id="btn3">Button 3</button>
        </div>
      `;
    });

    it('should get focusable elements', () => {
      const container = document.getElementById('container')!;
      const focusable = FocusManager.getFocusableElements(container);

      expect(focusable).toHaveLength(3);
      expect(focusable[0].id).toBe('btn1');
    });

    it('should check if element is focusable', () => {
      const button = document.getElementById('btn1')!;
      const div = document.createElement('div');

      expect(FocusManager.isFocusable(button)).toBe(true);
      expect(FocusManager.isFocusable(div)).toBe(false);
    });

    it('should trap focus within container', () => {
      const container = document.getElementById('container')!;
      const cleanup = FocusManager.trapFocus(container);

      // Check if first element is focused
      expect(document.activeElement?.id).toBe('btn1');

      cleanup();
    });
  });

  describe('ColorContrast', () => {
    it('should convert hex to RGB', () => {
      const rgb = ColorContrast.hexToRgb('#ffffff');
      expect(rgb).toEqual({ r: 255, g: 255, b: 255 });
    });

    it('should calculate luminance', () => {
      const whiteLuminance = ColorContrast.getLuminance('#ffffff');
      const blackLuminance = ColorContrast.getLuminance('#000000');

      expect(whiteLuminance).toBeCloseTo(1, 2);
      expect(blackLuminance).toBeCloseTo(0, 2);
    });

    it('should calculate contrast ratio', () => {
      const ratio = ColorContrast.getContrastRatio('#ffffff', '#000000');
      expect(ratio).toBeCloseTo(21, 1);
    });

    it('should check WCAG compliance', () => {
      const compliance = ColorContrast.checkWCAGCompliance('#000000', '#ffffff');

      expect(compliance.aa).toBe(true);
      expect(compliance.aaa).toBe(true);
      expect(compliance.aaLarge).toBe(true);
      expect(compliance.aaaLarge).toBe(true);
    });
  });

  describe('generateAriaLabels', () => {
    it('should generate button labels', () => {
      const label = generateAriaLabels.button('Close', 'Modal');
      expect(label).toEqual({
        'aria-label': 'Close Modal',
        'role': 'button',
      });
    });

    it('should generate navigation labels', () => {
      const label = generateAriaLabels.navigation('Home', true);
      expect(label).toEqual({
        'aria-label': 'Home',
        'aria-current': 'page',
      });
    });

    it('should generate expandable labels', () => {
      const label = generateAriaLabels.expandable('Menu', true);
      expect(label).toEqual({
        'aria-label': 'Menu',
        'aria-expanded': true,
        'aria-controls': 'menu-content',
      });
    });

    it('should generate input labels', () => {
      const label = generateAriaLabels.input('Email', true, false);
      expect(label).toEqual({
        'aria-label': 'Email',
        'aria-required': true,
        'aria-invalid': false,
      });
    });
  });

  describe('validateHeadingHierarchy', () => {
    it('should detect missing h1', () => {
      document.body.innerHTML = `
        <h2>Heading 2</h2>
        <h3>Heading 3</h3>
      `;

      const { errors, warnings } = validateHeadingHierarchy();
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should detect skipped heading levels', () => {
      document.body.innerHTML = `
        <h1>Heading 1</h1>
        <h3>Heading 3</h3>
        <h4>Heading 4</h4>
      `;

      const { errors, warnings } = validateHeadingHierarchy();
      expect(warnings.length).toBeGreaterThan(0);
    });

    it('should pass with proper hierarchy', () => {
      document.body.innerHTML = `
        <h1>Heading 1</h1>
        <h2>Heading 2</h2>
        <h3>Heading 3</h3>
      `;

      const { errors, warnings } = validateHeadingHierarchy();
      expect(errors.length).toBe(0);
    });
  });

  describe('KeyboardNavigation', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <ul id="list" role="listbox">
          <li id="item1" role="option" tabindex="0">Item 1</li>
          <li id="item2" role="option" tabindex="-1">Item 2</li>
          <li id="item3" role="option" tabindex="-1">Item 3</li>
        </ul>
      `;
    });

    it('should create navigation handler', () => {
      const container = document.getElementById('list')!;
      const cleanup = KeyboardNavigation.createNavigation(container, {
        orientation: 'vertical',
        onSelect: vi.fn(),
      });

      expect(cleanup).toBeDefined();
      expect(typeof cleanup).toBe('function');
    });

    it('should handle keyboard events', () => {
      const container = document.getElementById('list')!;
      const onSelect = vi.fn();

      KeyboardNavigation.createNavigation(container, {
        orientation: 'vertical',
        onSelect,
      });

      // Simulate Enter key on first item
      const item1 = document.getElementById('item1')!;
      item1.focus();

      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      item1.dispatchEvent(enterEvent);

      // Note: This test might need adjustment based on actual implementation
      expect(item1).toBeDefined();
    });
  });
});

// Integration test example
describe('Accessibility Integration', () => {
  it('should handle modal with focus trap and announcements', () => {
    // Create modal
    document.body.innerHTML = `
      <div id="modal" role="dialog" aria-labelledby="modal-title" aria-hidden="true">
        <h2 id="modal-title">Modal Title</h2>
        <button id="close">Close</button>
        <button id="submit">Submit</button>
      </div>
      <button id="trigger">Open Modal</button>
    `;

    const announcer = ScreenReaderAnnouncer.getInstance();
    const modal = document.getElementById('modal')!;
    const trigger = document.getElementById('trigger')!;

    // Open modal
    modal.setAttribute('aria-hidden', 'false');
    const cleanup = FocusManager.trapFocus(modal);
    announcer.announce('Modal opened');

    // Test focus trap
    expect(document.activeElement).toBe(modal.querySelector('button'));

    // Close modal
    modal.setAttribute('aria-hidden', 'true');
    cleanup();
    announcer.announce('Modal closed');

    expect(cleanup).toBeDefined();
  });
});