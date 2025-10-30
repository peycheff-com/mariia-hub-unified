import type { Meta, StoryObj } from "@storybook/react";
import { LuxuryButton } from "./LuxuryButton";

const meta: Meta<typeof LuxuryButton> = {
  title: "Luxury/Button",
  component: LuxuryButton,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
Luxury Button component with premium styling, glass morphism effects, and smooth animations.
Features multiple variants, sizes, and states while maintaining 60fps performance and WCAG AAA accessibility.

**Key Features:**
- Glass morphism effects with backdrop blur
- Multiple luxury variants (luxury, primary, glass, accent, outline, subtle)
- Performance-optimized animations using CSS transforms
- WCAG AAA compliant color contrast
- Touch-friendly minimum 44px targets
- Loading states with spinners
- Shimmer effects and micro-interactions
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: { type: "select" },
      options: ["luxury", "primary", "glass", "accent", "outline", "subtle", "destructive", "ghost", "link"],
      description: "Visual style variant of the button",
    },
    size: {
      control: { type: "select" },
      options: ["xs", "sm", "default", "lg", "xl", "icon", "icon-sm", "icon-lg"],
      description: "Size of the button",
    },
    state: {
      control: { type: "select" },
      options: ["default", "loading", "success", "error"],
      description: "State of the button",
    },
    loading: {
      control: { type: "boolean" },
      description: "Show loading state with spinner",
    },
    shimmer: {
      control: { type: "boolean" },
      description: "Add shimmer effect for loading actions",
    },
    disabled: {
      control: { type: "boolean" },
      description: "Disable the button",
    },
    leftIcon: {
      control: { type: "text" },
      description: "Icon to display on the left (pass as JSX)",
    },
    rightIcon: {
      control: { type: "text" },
      description: "Icon to display on the right (pass as JSX)",
    },
    children: {
      control: { type: "text" },
      description: "Button content",
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Base stories
export const Default: Story = {
  args: {
    children: "Luxury Button",
    variant: "luxury",
    size: "default",
  },
};

export const Primary: Story = {
  args: {
    children: "Primary Action",
    variant: "primary",
    size: "default",
  },
};

export const Glass: Story = {
  args: {
    children: "Glass Effect",
    variant: "glass",
    size: "default",
  },
};

export const Accent: Story = {
  args: {
    children: "Accent Style",
    variant: "accent",
    size: "default",
  },
};

export const Outline: Story = {
  args: {
    children: "Outline Style",
    variant: "outline",
    size: "default",
  },
};

export const Subtle: Story = {
  args: {
    children: "Subtle Style",
    variant: "subtle",
    size: "default",
  },
};

export const Destructive: Story = {
  args: {
    children: "Delete Action",
    variant: "destructive",
    size: "default",
  },
};

// Size variations
export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <LuxuryButton size="xs">Extra Small</LuxuryButton>
      <LuxuryButton size="sm">Small</LuxuryButton>
      <LuxuryButton size="default">Default</LuxuryButton>
      <LuxuryButton size="lg">Large</LuxuryButton>
      <LuxuryButton size="xl">Extra Large</LuxuryButton>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "All available button sizes with proper touch targets (minimum 44px).",
      },
    },
  },
};

// Icon buttons
export const WithIcons: Story = {
  render: () => {
    const StarIcon = (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    );

    const ArrowIcon = (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
      </svg>
    );

    return (
      <div className="flex flex-wrap items-center gap-4">
        <LuxuryButton leftIcon={StarIcon} variant="luxury">
          With Left Icon
        </LuxuryButton>
        <LuxuryButton rightIcon={ArrowIcon} variant="primary">
          With Right Icon
        </LuxuryButton>
        <LuxuryButton leftIcon={StarIcon} rightIcon={ArrowIcon} variant="glass">
          Both Icons
        </LuxuryButton>
        <LuxuryButton size="icon" variant="accent">
          {StarIcon}
        </LuxuryButton>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Buttons with icons for enhanced visual communication.",
      },
    },
  },
};

// Loading states
export const LoadingStates: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <LuxuryButton loading variant="luxury">
        Loading...
      </LuxuryButton>
      <LuxuryButton loading variant="primary">
        Processing
      </LuxuryButton>
      <LuxuryButton loading shimmer variant="glass">
        Loading with Shimmer
      </LuxuryButton>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Loading states with animated spinners and optional shimmer effects.",
      },
    },
  },
};

// State variations
export const States: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <LuxuryButton state="success" variant="default">
        Success
      </LuxuryButton>
      <LuxuryButton state="error" variant="default">
        Error
      </LuxuryButton>
      <LuxuryButton disabled variant="luxury">
        Disabled
      </LuxuryButton>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Different button states for various user feedback scenarios.",
      },
    },
  },
};

// Interactive showcase
export const InteractiveShowcase: Story = {
  render: () => {
    const [count, setCount] = React.useState(0);

    return (
      <div className="p-8 glass-card rounded-3xl space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-display text-cocoa-900 mb-2">Interactive Button Demo</h3>
          <p className="text-cocoa-600">Click count: {count}</p>
        </div>

        <div className="flex flex-wrap justify-center gap-4">
          <LuxuryButton
            onClick={() => setCount(count + 1)}
            shimmer
            variant="luxury"
          >
            Increment Counter
          </LuxuryButton>

          <LuxuryButton
            onClick={() => setCount(0)}
            variant="outline"
          >
            Reset
          </LuxuryButton>

          <LuxuryButton
            loading={count > 0}
            onClick={() => setTimeout(() => setCount(count + 1), 2000)}
            variant="glass"
          >
            {count > 0 ? 'Processing...' : 'Process with Delay'}
          </LuxuryButton>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Interactive demonstration showing button states and animations in action.",
      },
    },
  },
};

// Accessibility demo
export const Accessibility: Story = {
  render: () => (
    <div className="p-8 space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h4 className="font-semibold text-blue-900 mb-2">♿ Accessibility Features</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• All buttons meet WCAG AAA contrast requirements (7:1 minimum)</li>
          <li>• Minimum touch target size of 44px for mobile accessibility</li>
          <li>• Proper keyboard navigation support</li>
          <li>• Screen reader compatible with ARIA labels</li>
          <li>• High contrast mode support</li>
          <li>• Reduced motion support for users with vestibular disorders</li>
        </ul>
      </div>

      <div className="flex flex-wrap gap-4">
        <LuxuryButton
          variant="luxury"
          aria-label="Primary action button"
        >
          Accessible Button
        </LuxuryButton>

        <LuxuryButton
          variant="glass"
          aria-describedby="button-help"
        >
          With Description
        </LuxuryButton>

        <p id="button-help" className="text-sm text-cocoa-600 sr-only">
          This button performs the primary action for the current context
        </p>
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: "Demonstration of accessibility features built into the luxury button component.",
      },
    },
  },
};