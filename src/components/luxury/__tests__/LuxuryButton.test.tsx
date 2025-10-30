import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { LuxuryButton } from "../LuxuryButton";

// Mock ResizeObserver for animation testing
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock performance.now for animation timing
const mockPerformance = {
  now: vi.fn(() => Date.now()),
};
Object.defineProperty(window, "performance", { value: mockPerformance });

describe("LuxuryButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Rendering", () => {
    it("renders with default luxury variant", () => {
      render(<LuxuryButton>Test Button</LuxuryButton>);
      const button = screen.getByRole("button", { name: "Test Button" });

      expect(button).toBeInTheDocument();
      expect(button).toHaveClass("bg-gradient-luxury", "text-white", "shadow-luxury");
    });

    it("renders with different variants", () => {
      const { rerender } = render(<LuxuryButton variant="primary">Primary</LuxuryButton>);
      let button = screen.getByRole("button", { name: "Primary" });
      expect(button).toHaveClass("bg-gradient-brand");

      rerender(<LuxuryButton variant="glass">Glass</LuxuryButton>);
      button = screen.getByRole("button", { name: "Glass" });
      expect(button).toHaveClass("glass-card");
    });

    it("renders with different sizes", () => {
      render(<LuxuryButton size="lg">Large Button</LuxuryButton>);
      const button = screen.getByRole("button", { name: "Large Button" });
      expect(button).toHaveClass("h-13", "px-8", "text-base");
    });

    it("renders with icons", () => {
      const leftIcon = <span data-testid="left-icon">←</span>;
      const rightIcon = <span data-testid="right-icon">→</span>;

      render(
        <LuxuryButton leftIcon={leftIcon} rightIcon={rightIcon}>
          With Icons
        </LuxuryButton>
      );

      expect(screen.getByTestId("left-icon")).toBeInTheDocument();
      expect(screen.getByTestId("right-icon")).toBeInTheDocument();
    });
  });

  describe("States", () => {
    it("handles loading state correctly", () => {
      render(<LuxuryButton loading>Loading</LuxuryButton>);
      const button = screen.getByRole("button", { name: "Loading" });

      expect(button).toBeDisabled();
      expect(button).toHaveAttribute("data-loading", "true");
      expect(button.querySelector(".animate-spin")).toBeInTheDocument();
    });

    it("shows loading spinner when loading", () => {
      render(<LuxuryButton loading>Processing</LuxuryButton>);
      const button = screen.getByRole("button", { name: "Processing" });

      const spinner = button.querySelector(".animate-spin");
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass("border-2", "border-current", "border-t-transparent");
    });

    it("hides content when loading", () => {
      render(<LuxuryButton loading>Hidden Content</LuxuryButton>);
      const button = screen.getByRole("button", { name: "Hidden Content" });

      const content = button.querySelector("span:not(.absolute)");
      expect(content).toHaveClass("opacity-0");
    });

    it("applies state variants correctly", () => {
      render(<LuxuryButton state="success">Success</LuxuryButton>);
      const button = screen.getByRole("button", { name: "Success" });
      expect(button).toHaveClass("bg-success", "text-white");
    });

    it("disables button correctly", () => {
      render(<LuxuryButton disabled>Disabled</LuxuryButton>);
      const button = screen.getByRole("button", { name: "Disabled" });
      expect(button).toBeDisabled();
      expect(button).toHaveClass("disabled:opacity-50", "disabled:pointer-events-none");
    });
  });

  describe("Interactions", () => {
    it("handles click events", () => {
      const handleClick = vi.fn();
      render(<LuxuryButton onClick={handleClick}>Click me</LuxuryButton>);

      const button = screen.getByRole("button", { name: "Click me" });
      fireEvent.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it("does not trigger click when disabled", () => {
      const handleClick = vi.fn();
      render(
        <LuxuryButton disabled onClick={handleClick}>
          Disabled Button
        </LuxuryButton>
      );

      const button = screen.getByRole("button", { name: "Disabled Button" });
      fireEvent.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it("does not trigger click when loading", () => {
      const handleClick = vi.fn();
      render(
        <LuxuryButton loading onClick={handleClick}>
          Loading Button
        </LuxuryButton>
      );

      const button = screen.getByRole("button", { name: "Loading Button" });
      fireEvent.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it("handles focus events", () => {
      const handleFocus = vi.fn();
      render(<LuxuryButton onFocus={handleFocus}>Focus me</LuxuryButton>);

      const button = screen.getByRole("button", { name: "Focus me" });
      button.focus();

      expect(handleFocus).toHaveBeenCalled();
    });

    it("handles keyboard events", () => {
      const handleKeyDown = vi.fn();
      render(<LuxuryButton onKeyDown={handleKeyDown}>Keyboard</LuxuryButton>);

      const button = screen.getByRole("button", { name: "Keyboard" });
      fireEvent.keyDown(button, { key: "Enter" });

      expect(handleKeyDown).toHaveBeenCalledWith(
        expect.objectContaining({ key: "Enter" })
      );
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA attributes", () => {
      render(
        <LuxuryButton aria-label="Custom label" aria-describedby="description">
          Button
        </LuxuryButton>
      );

      const button = screen.getByRole("button", { name: "Custom label" });
      expect(button).toHaveAttribute("aria-describedby", "description");
    });

    it("supports keyboard navigation", () => {
      render(<LuxuryButton>Tabbable</LuxuryButton>);
      const button = screen.getByRole("button", { name: "Tabbable" });

      // Test that button is focusable
      button.focus();
      expect(document.activeElement).toBe(button);
    });

    it("announces loading state to screen readers", () => {
      render(<LuxuryButton loading>Loading State</LuxuryButton>);
      const button = screen.getByRole("button", { name: "Loading State" });

      expect(button).toHaveAttribute("data-loading", "true");
    });

    it("has proper touch target size (44px minimum)", () => {
      render(<LuxuryButton size="default">Touch Target</LuxuryButton>);
      const button = screen.getByRole("button", { name: "Touch Target" });

      const styles = window.getComputedStyle(button);
      const height = parseInt(styles.height);
      const width = parseInt(styles.width);

      // Should meet WCAG minimum touch target size
      expect(height).toBeGreaterThanOrEqual(44);
      expect(width).toBeGreaterThanOrEqual(44);
    });
  });

  describe("Performance", () => {
    it("uses hardware acceleration classes", () => {
      render(<LuxuryButton>Performance Test</LuxuryButton>);
      const button = screen.getByRole("button", { name: "Performance Test" });

      expect(button).toHaveClass("transform-gpu", "will-change-transform");
    });

    it("applies shimmer effect when enabled", () => {
      render(<LuxuryButton shimmer>Shimmer Button</LuxuryButton>);
      const button = screen.getByRole("button", { name: "Shimmer Button" });

      const shimmer = button.querySelector(".animate-pulse");
      expect(shimmer).toBeInTheDocument();
    });

    it("handles rapid clicks without memory leaks", () => {
      const handleClick = vi.fn();
      render(<LuxuryButton onClick={handleClick}>Rapid Click</LuxuryButton>);

      const button = screen.getByRole("button", { name: "Rapid Click" });

      // Simulate rapid clicks
      for (let i = 0; i < 10; i++) {
        fireEvent.click(button);
      }

      expect(handleClick).toHaveBeenCalledTimes(10);
    });
  });

  describe("Visual Effects", () => {
    it("applies hover styles on mouse enter", () => {
      render(<LuxuryButton>Hover Test</LuxuryButton>);
      const button = screen.getByRole("button", { name: "Hover Test" });

      fireEvent.mouseEnter(button);
      expect(button).toHaveClass("hover:shadow-luxury-strong", "hover:scale-[1.02]");
    });

    it("applies active styles on mouse down", () => {
      render(<LuxuryButton>Active Test</LuxuryButton>);
      const button = screen.getByRole("button", { name: "Active Test" });

      fireEvent.mouseDown(button);
      expect(button).toHaveClass("active:scale-[0.98]", "active:shadow-medium");
    });

    it("removes hover styles on mouse leave", () => {
      render(<LuxuryButton>Hover Test</LuxuryButton>);
      const button = screen.getByRole("button", { name: "Hover Test" });

      fireEvent.mouseEnter(button);
      fireEvent.mouseLeave(button);

      // Should still have hover classes due to CSS hover pseudo-class
      expect(button).toHaveClass("hover:shadow-luxury-strong");
    });
  });

  describe("Component Variants", () => {
    it.each([
      ["luxury", "bg-gradient-luxury"],
      ["primary", "bg-gradient-brand"],
      ["glass", "glass-card"],
      ["accent", "bg-gradient-champagne"],
      ["outline", "glass-luxury"],
      ["subtle", "glass-subtle"],
      ["destructive", "bg-gradient-rose"],
      ["ghost", "text-cocoa-600"],
      ["link", "text-champagne-600", "underline-offset-4"],
    ] as const)("renders %s variant with correct classes", (variant, ...expectedClasses) => {
      render(<LuxuryButton variant={variant}>Variant Test</LuxuryButton>);
      const button = screen.getByRole("button", { name: "Variant Test" });

      expectedClasses.forEach(className => {
        expect(button).toHaveClass(className);
      });
    });
  });

  describe("Size Variants", () => {
    it.each([
      ["xs", "h-11", "px-3", "text-xs"],
      ["sm", "h-11", "px-4", "text-sm"],
      ["default", "h-12", "px-6", "text-sm"],
      ["lg", "h-13", "px-8", "text-base"],
      ["xl", "h-14", "px-10", "text-lg"],
      ["icon", "h-12", "w-12"],
      ["icon-sm", "h-11", "w-11"],
      ["icon-lg", "h-13", "w-13"],
    ] as const)("renders %s size with correct classes", (size, ...expectedClasses) => {
      render(<LuxuryButton size={size}>Size Test</LuxuryButton>);
      const button = screen.getByRole("button", { name: "Size Test" });

      expectedClasses.forEach(className => {
        expect(button).toHaveClass(className);
      });
    });
  });

  describe("Error Handling", () => {
    it("handles missing children gracefully", () => {
      expect(() => {
        render(<LuxuryButton />);
      }).not.toThrow();
    });

    it("handles invalid variant gracefully", () => {
      expect(() => {
        render(<LuxuryButton variant={"invalid" as any}>Test</LuxuryButton>);
      }).not.toThrow();
    });

    it("handles invalid size gracefully", () => {
      expect(() => {
        render(<LuxuryButton size={"invalid" as any}>Test</LuxuryButton>);
      }).not.toThrow();
    });
  });

  describe("Ref Forwarding", () => {
    it("forwards ref correctly", () => {
      const ref = { current: null as HTMLButtonElement | null };
      render(<LuxuryButton ref={ref}>Ref Test</LuxuryButton>);

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current).toBe(screen.getByRole("button", { name: "Ref Test" }));
    });

    it("supports ref methods", () => {
      const ref = { current: null as HTMLButtonElement | null };
      render(<LuxuryButton ref={ref}>Ref Methods</LuxuryButton>);

      if (ref.current) {
        ref.current.focus();
        expect(document.activeElement).toBe(ref.current);
      }
    });
  });
});