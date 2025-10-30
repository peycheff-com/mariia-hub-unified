import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  useAccessibility,
  useHighContrastMode,
  useReducedMotion,
  FocusManager,
  ScreenReaderAnnouncer,
  setupFocusVisible,
} from "../accessibility";
import React from "react";

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe("Accessibility Utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  describe("useHighContrastMode", () => {
    it("detects high contrast mode preference", () => {
      // Mock high contrast mode
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === "(prefers-contrast: high)",
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const TestComponent = () => {
        const isHighContrast = useHighContrastMode();
        return <div data-testid="contrast-status">{isHighContrast ? "high" : "normal"}</div>;
      };

      render(<TestComponent />);
      expect(screen.getByTestId("contrast-status")).toHaveTextContent("high");
    });

    it("defaults to normal contrast mode", () => {
      const TestComponent = () => {
        const isHighContrast = useHighContrastMode();
        return <div data-testid="contrast-status">{isHighContrast ? "high" : "normal"}</div>;
      };

      render(<TestComponent />);
      expect(screen.getByTestId("contrast-status")).toHaveTextContent("normal");
    });

    it("listens for preference changes", () => {
      const addEventListener = vi.fn();
      window.matchMedia = vi.fn().mockImplementation(() => ({
        matches: false,
        media: "(prefers-contrast: high)",
        onchange: null,
        addEventListener,
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const TestComponent = () => {
        useHighContrastMode();
        return <div>Test</div>;
      };

      render(<TestComponent />);
      expect(addEventListener).toHaveBeenCalledWith("change", expect.any(Function));
    });
  });

  describe("useReducedMotion", () => {
    it("detects reduced motion preference", () => {
      // Mock reduced motion preference
      window.matchMedia = vi.fn().mockImplementation((query) => ({
        matches: query === "(prefers-reduced-motion: reduce)",
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));

      const TestComponent = () => {
        const prefersReducedMotion = useReducedMotion();
        return <div data-testid="motion-status">{prefersReducedMotion ? "reduced" : "normal"}</div>;
      };

      render(<TestComponent />);
      expect(screen.getByTestId("motion-status")).toHaveTextContent("reduced");
    });

    it("defaults to normal motion", () => {
      const TestComponent = () => {
        const prefersReducedMotion = useReducedMotion();
        return <div data-testid="motion-status">{prefersReducedMotion ? "reduced" : "normal"}</div>;
      };

      render(<TestComponent />);
      expect(screen.getByTestId("motion-status")).toHaveTextContent("normal");
    });
  });

  describe("FocusManager", () => {
    it("traps focus within container", () => {
      const container = document.createElement("div");
      container.innerHTML = `
        <button>Button 1</button>
        <button>Button 2</button>
        <button>Button 3</button>
      `;
      document.body.appendChild(container);

      const focusManager = new FocusManager();
      const cleanup = focusManager.trapFocus(container);

      const buttons = container.querySelectorAll("button");

      // Test focus trapping
      buttons[0].focus();
      expect(document.activeElement).toBe(buttons[0]);

      buttons[2].focus();
      expect(document.activeElement).toBe(buttons[2]);

      // Cleanup
      cleanup();
      document.body.removeChild(container);
    });

    it("restores original focus on cleanup", () => {
      const originalButton = document.createElement("button");
      originalButton.textContent = "Original";
      document.body.appendChild(originalButton);
      originalButton.focus();

      const container = document.createElement("div");
      container.innerHTML = "<button>Trapped</button>";
      document.body.appendChild(container);

      const focusManager = new FocusManager();
      const cleanup = focusManager.trapFocus(container);

      cleanup();
      expect(document.activeElement).toBe(originalButton);

      document.body.removeChild(originalButton);
      document.body.removeChild(container);
    });

    it("handles empty containers gracefully", () => {
      const container = document.createElement("div");
      document.body.appendChild(container);

      const focusManager = new FocusManager();
      const cleanup = focusManager.trapFocus(container);

      expect(cleanup).toBeUndefined();

      document.body.removeChild(container);
    });

    it("saves and restores focus history", () => {
      const button1 = document.createElement("button");
      const button2 = document.createElement("button");
      button1.textContent = "Button 1";
      button2.textContent = "Button 2";
      document.body.appendChild(button1);
      document.body.appendChild(button2);

      const focusManager = new FocusManager();

      button1.focus();
      focusManager.saveFocus(button1);

      button2.focus();
      focusManager.saveFocus(button2);

      focusManager.restoreFocus();
      expect(document.activeElement).toBe(button1);

      focusManager.clearHistory();
      expect(focusManager["focusHistory"]).toHaveLength(0);

      document.body.removeChild(button1);
      document.body.removeChild(button2);
    });
  });

  describe("ScreenReaderAnnouncer", () => {
    it("creates announcement element on first use", () => {
      const announcer = ScreenReaderAnnouncer.getInstance();
      const announcementElement = document.querySelector('[aria-live="polite"]');

      expect(announcementElement).toBeInTheDocument();
      expect(announcementElement).toHaveClass("sr-only");
    });

    it("announces messages politely", () => {
      const announcer = ScreenReaderAnnouncer.getInstance();
      announcer.announce("Test message");

      const announcementElement = document.querySelector('[aria-live="polite"]');
      expect(announcementElement).toBeInTheDocument();
    });

    it("announces errors assertively", () => {
      const announcer = ScreenReaderAnnouncer.getInstance();
      announcer.announceError("Test error");

      const announcementElement = document.querySelector('[aria-live="assertive"]');
      expect(announcementElement).toBeInTheDocument();
    });

    it("announces success messages", () => {
      const announcer = ScreenReaderAnnouncer.getInstance();
      announcer.announceSuccess("Operation completed");

      const announcementElement = document.querySelector('[aria-live="polite"]');
      expect(announcementElement).toBeInTheDocument();
    });

    it("announces loading messages", () => {
      const announcer = ScreenReaderAnnouncer.getInstance();
      announcer.announceLoading("Processing request");

      const announcementElement = document.querySelector('[aria-live="polite"]');
      expect(announcementElement).toBeInTheDocument();
    });

    it("returns singleton instance", () => {
      const announcer1 = ScreenReaderAnnouncer.getInstance();
      const announcer2 = ScreenReaderAnnouncer.getInstance();
      expect(announcer1).toBe(announcer2);
    });
  });

  describe("setupFocusVisible", () => {
    it("adds focus-visible class on keyboard focus", () => {
      const cleanup = setupFocusVisible();

      const button = document.createElement("button");
      button.textContent = "Test";
      document.body.appendChild(button);

      // Simulate keyboard navigation
      fireEvent.keyDown(document, { key: "Tab" });
      button.focus();

      expect(button).toHaveClass("focus-visible");

      cleanup();
      document.body.removeChild(button);
    });

    it("removes focus-visible class on mouse interaction", () => {
      const cleanup = setupFocusVisible();

      const button = document.createElement("button");
      button.textContent = "Test";
      document.body.appendChild(button);

      // Simulate mouse interaction
      fireEvent.mouseDown(document);
      button.focus();

      expect(button).not.toHaveClass("focus-visible");

      cleanup();
      document.body.removeChild(button);
    });

    it("handles blur events", () => {
      const cleanup = setupFocusVisible();

      const button = document.createElement("button");
      button.textContent = "Test";
      document.body.appendChild(button);

      // Add focus-visible class
      fireEvent.keyDown(document, { key: "Tab" });
      button.focus();
      expect(button).toHaveClass("focus-visible");

      // Blur the element
      button.blur();
      expect(button).not.toHaveClass("focus-visible");

      cleanup();
      document.body.removeChild(button);
    });

    it("returns cleanup function", () => {
      const cleanup = setupFocusVisible();
      expect(typeof cleanup).toBe("function");

      // Should not throw when called
      expect(() => cleanup()).not.toThrow();
    });
  });

  describe("Accessibility Colors", () => {
    it("provides WCAG AAA compliant color combinations", async () => {
      const { ACCESSIBILITY_COLORS } = await import("../accessibility");

      // Check primary text contrast
      expect(ACCESSIBILITY_COLORS.text.primary.contrast).toBeGreaterThanOrEqual(7);

      // Check secondary text contrast
      expect(ACCESSIBILITY_COLORS.text.secondary.contrast).toBeGreaterThanOrEqual(7);

      // Check interactive element contrast
      expect(ACCESSIBILITY_COLORS.interactive.primary.contrast).toBeGreaterThanOrEqual(7);
    });
  });

  describe("Keyboard Navigation", () => {
    it("creates keyboard event handlers", async () => {
      const { KEYBOARD_NAVIGATION } = await import("../accessibility");

      const mockHandler = vi.fn();
      const handler = KEYBOARD_NAVIGATION.createHandler({
        Enter: mockHandler,
        Escape: () => {},
      });

      const button = document.createElement("button");
      document.body.appendChild(button);

      fireEvent.keyDown(button, { key: "Enter" });
      expect(mockHandler).toHaveBeenCalled();

      document.body.removeChild(button);
    });

    it("creates menu navigation handlers", async () => {
      const { KEYBOARD_NAVIGATION } = await import("../accessibility");

      const items = [
        document.createElement("button"),
        document.createElement("button"),
        document.createElement("button"),
      ];

      items.forEach((item, index) => {
        item.textContent = `Item ${index + 1}`;
        document.body.appendChild(item);
      });

      const mockSelect = vi.fn();
      const handler = KEYBOARD_NAVIGATION.createMenuNavigation(items, mockSelect);

      // Test arrow navigation
      const firstItem = items[0];
      fireEvent.keyDown(firstItem, { key: "ArrowDown" });

      // Test selection
      fireEvent.keyDown(firstItem, { key: "Enter" });
      expect(mockSelect).toHaveBeenCalledWith(0);

      items.forEach(item => document.body.removeChild(item));
    });
  });

  describe("Touch Targets", () => {
    it("ensures minimum touch target size", async () => {
      const { TOUCH_TARGETS } = await import("../accessibility");

      const element = document.createElement("button");
      element.style.width = "20px";
      element.style.height = "20px";
      document.body.appendChild(element);

      TOUCH_TARGETS.ensureMinimumSize(element, 44);

      const computedStyle = window.getComputedStyle(element);
      const padding = parseInt(computedStyle.padding);
      expect(padding).toBeGreaterThan(0);

      document.body.removeChild(element);
    });

    it("provides minimum touch target sizes", async () => {
      const { TOUCH_TARGETS } = await import("../accessibility");

      expect(TOUCH_TARGETS.minimum).toBe(44);
      expect(TOUCH_TARGETS.comfortable).toBe(48);
    });
  });

  describe("ARIA Utilities", () => {
    it("generates unique IDs", async () => {
      const { ARIA_UTILS } = await import("../accessibility");

      const id1 = ARIA_UTILS.generateId("test");
      const id2 = ARIA_UTILS.generateId("test");

      expect(id1).toMatch(/^test-[a-z0-9]+$/);
      expect(id2).toMatch(/^test-[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });

    it("sets up ARIA relationships", async () => {
      const { ARIA_UTILS } = await import("../accessibility");

      const element = document.createElement("div");
      const target = document.createElement("div");
      target.textContent = "Target content";
      target.id = "target-id";

      ARIA_UTILS.setupRelationship(element, target, "labelledby");

      expect(element).toHaveAttribute("aria-labelledby", "target-id");
    });

    it("creates live regions", async () => {
      const { ARIA_UTILS } = await import("../accessibility");

      const liveRegion = ARIA_UTILS.createLiveRegion("polite");

      expect(liveRegion).toHaveAttribute("aria-live", "polite");
      expect(liveRegion).toHaveAttribute("aria-atomic", "true");
      expect(liveRegion).toHaveClass("sr-only");
    });
  });

  describe("useAccessibility Hook", () => {
    it("provides accessibility utilities", () => {
      const TestComponent = () => {
        const accessibility = useAccessibility();

        return (
          <div data-testid="accessibility-info">
            <span data-testid="high-contrast">{accessibility.isHighContrast.toString()}</span>
            <span data-testid="reduced-motion">{accessibility.prefersReducedMotion.toString()}</span>
          </div>
        );
      };

      render(<TestComponent />);

      expect(screen.getByTestId("accessibility-info")).toBeInTheDocument();
      expect(screen.getByTestId("high-contrast")).toBeInTheDocument();
      expect(screen.getByTestId("reduced-motion")).toBeInTheDocument();
    });

    it("initializes accessibility features on mount", () => {
      const TestComponent = () => {
        useAccessibility();
        return <div>Test</div>;
      };

      render(<TestComponent />);

      // Check if skip navigation link was created
      const skipLink = document.querySelector('a[href="#main-content"]');
      expect(skipLink).toBeInTheDocument();
    });

    it("provides announcer and focus manager instances", () => {
      const TestComponent = () => {
        const { announcer, focusManager } = useAccessibility();

        return (
          <div>
            <span data-testid="announcer-type">{typeof announcer.announce}</span>
            <span data-testid="focus-manager-type">{typeof focusManager.trapFocus}</span>
          </div>
        );
      };

      render(<TestComponent />);

      expect(screen.getByTestId("announcer-type")).toHaveTextContent("function");
      expect(screen.getByTestId("focus-manager-type")).toHaveTextContent("function");
    });
  });

  describe("Integration", () => {
    it("works with React components", () => {
      const AccessibleButton = () => {
        const accessibility = useAccessibility();

        const handleClick = () => {
          accessibility.announcer.announce("Button clicked");
        };

        return (
          <button
            onClick={handleClick}
            aria-label="Accessible button"
            className="focus-visible:ring-2 focus-visible:ring-champagne-400"
          >
            Click me
          </button>
        );
      };

      render(<AccessibleButton />);

      const button = screen.getByRole("button", { name: "Accessible button" });
      expect(button).toHaveAttribute("aria-label", "Accessible button");

      fireEvent.click(button);

      // Check if announcement was made
      const announcementElement = document.querySelector('[aria-live="polite"]');
      expect(announcementElement).toBeInTheDocument();
    });

    it("supports keyboard navigation patterns", () => {
      const KeyboardMenu = () => {
        const [selectedIndex, setSelectedIndex] = React.useState(0);
        const { announcer } = useAccessibility();

        const items = ["Item 1", "Item 2", "Item 3"];

        React.useEffect(() => {
          announcer.announce(`Item ${selectedIndex + 1} selected`);
        }, [selectedIndex, announcer]);

        return (
          <div role="menu">
            {items.map((item, index) => (
              <div
                key={index}
                role="menuitem"
                tabIndex={index === selectedIndex ? 0 : -1}
                onClick={() => setSelectedIndex(index)}
                className={index === selectedIndex ? "bg-champagne-100" : ""}
              >
                {item}
              </div>
            ))}
          </div>
        );
      };

      render(<KeyboardMenu />);

      const menuItems = screen.getAllByRole("menuitem");
      expect(menuItems).toHaveLength(3);
      expect(menuItems[0]).toHaveFocus();
    });
  });
});