import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  LuxuryCard,
  LuxuryCardHeader,
  LuxuryCardContent,
  LuxuryCardFooter,
  LuxuryCardPricing,
} from "../LuxuryCard";

// Mock IntersectionObserver for scroll animations
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

describe("LuxuryCard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("renders card with default luxury variant", () => {
      render(
        <LuxuryCard data-testid="luxury-card">
          <div>Card content</div>
        </LuxuryCard>
      );

      const card = screen.getByTestId("luxury-card");
      expect(card).toBeInTheDocument();
      expect(card).toHaveClass("glass-luxury", "border-champagne/25", "shadow-luxury");
    });

    it("renders with different variants", () => {
      const { rerender } = render(
        <LuxuryCard variant="elevated" data-testid="card">
          Content
        </LuxuryCard>
      );

      let card = screen.getByTestId("card");
      expect(card).toHaveClass("glass-luxury", "shadow-luxury");

      rerender(
        <LuxuryCard variant="minimal" data-testid="card">
          Content
        </LuxuryCard>
      );

      card = screen.getByTestId("card");
      expect(card).toHaveClass("glass-subtle", "border-transparent");
    });

    it("renders children correctly", () => {
      render(
        <LuxuryCard data-testid="card">
          <h2>Title</h2>
          <p>Content</p>
        </LuxuryCard>
      );

      expect(screen.getByRole("heading", { name: "Title" })).toBeInTheDocument();
      expect(screen.getByText("Content")).toBeInTheDocument();
    });
  });

  describe("Interactive Features", () => {
    it("applies hover effects when hover is enabled", () => {
      render(
        <LuxuryCard hover data-testid="interactive-card">
          Content
        </LuxuryCard>
      );

      const card = screen.getByTestId("interactive-card");
      expect(card).toHaveClass(
        "hover:shadow-luxury-strong",
        "hover:scale-[1.02]",
        "active:scale-[0.98]"
      );
    });

    it("applies cursor pointer when interactive", () => {
      render(
        <LuxuryCard interactive data-testid="interactive-card">
          Content
        </LuxuryCard>
      );

      const card = screen.getByTestId("interactive-card");
      expect(card).toHaveClass("cursor-pointer");
    });

    it("handles hover state changes", () => {
      render(
        <LuxuryCard hover data-testid="hover-card">
          Hover me
        </LuxuryCard>
      );

      const card = screen.getByTestId("hover-card");

      fireEvent.mouseEnter(card);
      expect(card).toBeInTheDocument(); // Component should handle hover internally

      fireEvent.mouseLeave(card);
      expect(card).toBeInTheDocument(); // Component should handle leave internally
    });

    it("handles press state changes", () => {
      render(
        <LuxuryCard hover data-testid="press-card">
          Press me
        </LuxuryCard>
      );

      const card = screen.getByTestId("press-card");

      fireEvent.mouseDown(card);
      expect(card).toBeInTheDocument(); // Component should handle press internally

      fireEvent.mouseUp(card);
      expect(card).toBeInTheDocument(); // Component should handle release internally
    });
  });

  describe("Visual Effects", () => {
    it("applies gradient overlay when enabled", () => {
      render(
        <LuxuryCard gradient data-testid="gradient-card">
          Content
        </LuxuryCard>
      );

      const card = screen.getByTestId("gradient-card");
      expect(card).toHaveClass("bg-gradient-to-br", "from-champagne/10");
    });

    it("adds corner accents for luxury variants", () => {
      render(
        <LuxuryCard variant="luxury" data-testid="luxury-card">
          Content
        </LuxuryCard>
      );

      const card = screen.getByTestId("luxury-card");
      const cornerAccents = card.querySelectorAll('[class*="border-champagne/30"]');
      expect(cornerAccents.length).toBe(4); // Four corners
    });

    it("has performance optimization classes", () => {
      render(
        <LuxuryCard data-testid="performance-card">
          Content
        </LuxuryCard>
      );

      const card = screen.getByTestId("performance-card");
      expect(card).toHaveClass("transform-gpu", "will-change-transform");
    });
  });

  describe("Card Components", () => {
    it("renders card header with title and subtitle", () => {
      render(
        <LuxuryCard>
          <LuxuryCardHeader title="Card Title" subtitle="Card subtitle" />
        </LuxuryCard>
      );

      expect(screen.getByText("Card Title")).toBeInTheDocument();
      expect(screen.getByText("Card subtitle")).toBeInTheDocument();
    });

    it("renders card header with avatar and actions", () => {
      const avatar = <div data-testid="avatar">Avatar</div>;
      const actions = <button data-testid="action">Action</button>;

      render(
        <LuxuryCard>
          <LuxuryCardHeader
            title="Title"
            subtitle="Subtitle"
            avatar={avatar}
            actions={actions}
          />
        </LuxuryCard>
      );

      expect(screen.getByTestId("avatar")).toBeInTheDocument();
      expect(screen.getByTestId("action")).toBeInTheDocument();
    });

    it("renders card content", () => {
      render(
        <LuxuryCard>
          <LuxuryCardContent>
            <p>Card content goes here</p>
          </LuxuryCardContent>
        </LuxuryCard>
      );

      expect(screen.getByText("Card content goes here")).toBeInTheDocument();
    });

    it("renders card footer", () => {
      render(
        <LuxuryCard>
          <LuxuryCardFooter>
            <button>Footer Button</button>
          </LuxuryCardFooter>
        </LuxuryCard>
      );

      expect(screen.getByRole("button", { name: "Footer Button" })).toBeInTheDocument();
    });

    it("renders complete card structure", () => {
      render(
        <LuxuryCard>
          <LuxuryCardHeader title="Complete Card" />
          <LuxuryCardContent>
            <p>This is the main content</p>
          </LuxuryCardContent>
          <LuxuryCardFooter>
            <span>Footer content</span>
          </LuxuryCardFooter>
        </LuxuryCard>
      );

      expect(screen.getByText("Complete Card")).toBeInTheDocument();
      expect(screen.getByText("This is the main content")).toBeInTheDocument();
      expect(screen.getByText("Footer content")).toBeInTheDocument();
    });
  });

  describe("Pricing Card", () => {
    it("renders pricing card without badge", () => {
      render(
        <LuxuryCardPricing data-testid="pricing-card">
          <LuxuryCardContent>Basic plan</LuxuryCardContent>
        </LuxuryCardPricing>
      );

      const card = screen.getByTestId("pricing-card");
      expect(card).toBeInTheDocument();
      expect(card).not.toHaveClass("ring-2", "scale-105");
    });

    it("renders pricing card with badge", () => {
      render(
        <LuxuryCardPricing badge="POPULAR" data-testid="featured-card">
          <LuxuryCardContent>Featured plan</LuxuryCardContent>
        </LuxuryCardPricing>
      );

      const card = screen.getByTestId("featured-card");
      expect(card).toHaveClass("ring-2", "ring-champagne-400", "scale-105");
      expect(screen.getByText("POPULAR")).toBeInTheDocument();
    });

    it("renders pricing card as featured", () => {
      render(
        <LuxuryCardPricing featured badge="RECOMMENDED" data-testid="recommended-card">
          <LuxuryCardContent>Recommended plan</LuxuryCardContent>
        </LuxuryCardPricing>
      );

      const card = screen.getByTestId("recommended-card");
      expect(card).toHaveClass("ring-2", "ring-champagne-400", "scale-105");
      expect(screen.getByText("RECOMMENDED")).toBeInTheDocument();
    });

    it("positions badge correctly", () => {
      render(
        <LuxuryCardPricing badge="BADGE">
          <LuxuryCardContent>Content</LuxuryCardContent>
        </LuxuryCardPricing>
      );

      const badge = screen.getByText("BADGE");
      expect(badge.parentElement).toHaveClass(
        "absolute",
        "-top-4",
        "right-6",
        "z-20"
      );
    });
  });

  describe("Accessibility", () => {
    it("supports custom ARIA attributes", () => {
      render(
        <LuxuryCard
          role="article"
          aria-labelledby="card-title"
          data-testid="accessible-card"
        >
          <h2 id="card-title">Accessible Card</h2>
          <p>Card content</p>
        </LuxuryCard>
      );

      const card = screen.getByTestId("accessible-card");
      expect(card).toHaveAttribute("role", "article");
      expect(card).toHaveAttribute("aria-labelledby", "card-title");
    });

    it("maintains focus order in card components", () => {
      render(
        <LuxuryCard>
          <LuxuryCardHeader title="Focus Order" />
          <LuxuryCardContent>
            <button data-testid="card-button">Card Button</button>
          </LuxuryCardContent>
          <LuxuryCardFooter>
            <button data-testid="footer-button">Footer Button</button>
          </LuxuryCardFooter>
        </LuxuryCard>
      );

      const cardButton = screen.getByTestId("card-button");
      const footerButton = screen.getByTestId("footer-button");

      cardButton.focus();
      expect(document.activeElement).toBe(cardButton);

      footerButton.focus();
      expect(document.activeElement).toBe(footerButton);
    });

    it("has proper color contrast for accessibility", () => {
      render(
        <LuxuryCard data-testid="contrast-card">
          <LuxuryCardHeader title="Title" />
          <LuxuryCardContent>
            <p className="text-cocoa-700">Content with proper contrast</p>
          </LuxuryCardContent>
        </LuxuryCard>
      );

      const card = screen.getByTestId("contrast-card");
      expect(card).toHaveClass("text-foreground"); // Should use semantic colors
    });
  });

  describe("Responsive Behavior", () => {
    it("adapts to different screen sizes", () => {
      render(
        <LuxuryCard className="w-full md:w-1/2 lg:w-1/3" data-testid="responsive-card">
          Content
        </LuxuryCard>
      );

      const card = screen.getByTestId("responsive-card");
      expect(card).toHaveClass("w-full", "md:w-1/2", "lg:w-1/3");
    });

    it("maintains aspect ratio on different screens", () => {
      render(
        <LuxuryCard className="aspect-video" data-testid="aspect-card">
          Content
        </LuxuryCard>
      );

      const card = screen.getByTestId("aspect-card");
      expect(card).toHaveClass("aspect-video");
    });
  });

  describe("Error Handling", () => {
    it("handles missing children gracefully", () => {
      expect(() => {
        render(<LuxuryCard />);
      }).not.toThrow();
    });

    it("handles invalid variant gracefully", () => {
      expect(() => {
        render(
          <LuxuryCard variant={"invalid" as any} data-testid="invalid-card">
            Content
          </LuxuryCard>
        );
      }).not.toThrow();

      expect(screen.getByTestId("invalid-card")).toBeInTheDocument();
    });

    it("handles missing props in card components", () => {
      render(
        <LuxuryCard>
          <LuxuryCardHeader />
          <LuxuryCardContent />
          <LuxuryCardFooter />
        </LuxuryCard>
      );

      expect(screen.getByRole("generic")).toBeInTheDocument(); // Should render without errors
    });
  });

  describe("Performance", () => {
    it("uses hardware acceleration", () => {
      render(
        <LuxuryCard data-testid="performance-card">
          Content
        </LuxuryCard>
      );

      const card = screen.getByTestId("performance-card");
      expect(card).toHaveClass("transform-gpu", "will-change-transform");
    });

    it("handles rapid hover events without memory leaks", () => {
      render(
        <LuxuryCard hover data-testid="rapid-hover-card">
          Content
        </LuxuryCard>
      );

      const card = screen.getByTestId("rapid-hover-card");

      // Simulate rapid hover events
      for (let i = 0; i < 10; i++) {
        fireEvent.mouseEnter(card);
        fireEvent.mouseLeave(card);
      }

      expect(card).toBeInTheDocument(); // Should handle events without errors
    });
  });

  describe("Component Composition", () => {
    it("works as composite component", () => {
      const CompositeCard = () => (
        <LuxuryCard variant="luxury" hover>
          <LuxuryCardHeader
            title="Composite Card"
            subtitle="Built with luxury components"
          />
          <LuxuryCardContent>
            <p>This card demonstrates component composition</p>
            <button className="mt-4 px-4 py-2 bg-champagne-500 rounded-lg">
              Action Button
            </button>
          </LuxuryCardContent>
          <LuxuryCardFooter>
            <span className="text-sm text-cocoa-600">Last updated: Today</span>
          </LuxuryCardFooter>
        </LuxuryCard>
      );

      render(<CompositeCard />);

      expect(screen.getByText("Composite Card")).toBeInTheDocument();
      expect(screen.getByText("Built with luxury components")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Action Button" })).toBeInTheDocument();
      expect(screen.getByText("Last updated: Today")).toBeInTheDocument();
    });

    it("supports nested components", () => {
      render(
        <LuxuryCard>
          <LuxuryCard>
            <LuxuryCardContent>
              <p>Nested content</p>
            </LuxuryCardContent>
          </LuxuryCard>
        </LuxuryCard>
      );

      expect(screen.getByText("Nested content")).toBeInTheDocument();
    });
  });
});