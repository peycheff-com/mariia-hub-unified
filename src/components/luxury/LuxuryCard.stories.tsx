import type { Meta, StoryObj } from "@storybook/react";
import { LuxuryCard, LuxuryCardHeader, LuxuryCardContent, LuxuryCardFooter, LuxuryCardPricing } from "./LuxuryCard";

const meta: Meta<typeof LuxuryCard> = {
  title: "Luxury/Card",
  component: LuxuryCard,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component: `
Luxury Card component with premium glass morphism effects, hover animations, and versatile layouts.
Designed for showcasing content with elegance while maintaining performance and accessibility.

**Key Features:**
- Multiple glass morphism variants (luxury, elevated, minimal, accent, glass)
- Smooth hover animations with scale effects
- Corner accents for premium feel
- Interactive states with visual feedback
- Responsive design with mobile optimization
- WCAG AAA compliant color combinations
- Performance-optimized with hardware acceleration
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: { type: "select" },
      options: ["default", "elevated", "minimal", "accent", "glass", "luxury"],
      description: "Visual style variant of the card",
    },
    interactive: {
      control: { type: "boolean" },
      description: "Enable hover and click interactions",
    },
    hover: {
      control: { type: "boolean" },
      description: "Enable hover effects",
    },
    gradient: {
      control: { type: "boolean" },
      description: "Add gradient background overlay",
    },
  },
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Base card stories
export const Default: Story = {
  render: () => (
    <LuxuryCard className="w-80">
      <LuxuryCardHeader
        title="Premium Service"
        subtitle="Experience luxury redefined"
      />
      <LuxuryCardContent>
        <p className="text-cocoa-700 leading-relaxed">
          Our premium service offers unmatched quality and attention to detail,
          ensuring an exceptional experience for every client.
        </p>
      </LuxuryCardContent>
    </LuxuryCard>
  ),
};

export const Elevated: Story = {
  render: () => (
    <LuxuryCard variant="elevated" className="w-80">
      <LuxuryCardHeader
        title="Elevated Experience"
        subtitle="Premium quality service"
      />
      <LuxuryCardContent>
        <p className="text-cocoa-700 leading-relaxed">
          Enhanced visual prominence with elevated shadows and stronger glass effects.
        </p>
      </LuxuryCardContent>
    </LuxuryCard>
  ),
};

export const Minimal: Story = {
  render: () => (
    <LuxuryCard variant="minimal" className="w-80">
      <LuxuryCardHeader
        title="Minimal Design"
        subtitle="Clean and elegant"
      />
      <LuxuryCardContent>
        <p className="text-cocoa-700 leading-relaxed">
          Subtle styling with minimal visual distractions, perfect for content-focused layouts.
        </p>
      </LuxuryCardContent>
    </LuxuryCard>
  ),
};

export const Accent: Story = {
  render: () => (
    <LuxuryCard variant="accent" className="w-80">
      <LuxuryCardHeader
        title="Accent Style"
        subtitle="Champagne highlights"
      />
      <LuxuryCardContent>
        <p className="text-cocoa-700 leading-relaxed">
          Subtle champagne gradient overlay with enhanced border styling for emphasis.
        </p>
      </LuxuryCardContent>
    </LuxuryCard>
  ),
};

export const Glass: Story = {
  render: () => (
    <LuxuryCard variant="glass" className="w-80">
      <LuxuryCardHeader
        title="Glass Morphism"
        subtitle="Transparent elegance"
      />
      <LuxuryCardContent>
        <p className="text-cocoa-700 leading-relaxed">
          Pure glass morphism effect with backdrop blur and subtle transparency.
        </p>
      </LuxuryCardContent>
    </LuxuryCard>
  ),
};

// Card with avatar and actions
export const WithAvatar: Story = {
  render: () => {
    const Avatar = (
      <div className="w-12 h-12 rounded-full bg-gradient-champagne flex items-center justify-center text-cocoa-900 font-display font-bold">
        MH
      </div>
    );

    const Actions = (
      <div className="flex space-x-2">
        <button className="p-2 rounded-lg hover:bg-cocoa-100 transition-colors">
          <svg className="w-4 h-4 text-cocoa-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
        <button className="p-2 rounded-lg hover:bg-cocoa-100 transition-colors">
          <svg className="w-4 h-4 text-cocoa-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
          </svg>
        </button>
      </div>
    );

    return (
      <LuxuryCard variant="luxury" className="w-80">
        <LuxuryCardHeader
          title="Mariia Hub"
          subtitle="Premium Beauty Services"
          avatar={Avatar}
          actions={Actions}
        />
        <LuxuryCardContent>
          <p className="text-cocoa-700 leading-relaxed">
            Exclusive beauty treatments and personalized services tailored to your unique needs.
          </p>
        </LuxuryCardContent>
      </LuxuryCard>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Card with avatar and action buttons for interactive content.",
      },
    },
  },
};

// Pricing card
export const PricingCard: Story = {
  render: () => {
    const StarIcon = (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    );

    return (
      <div className="flex gap-6 flex-wrap">
        <LuxuryCardPricing className="w-80">
          <LuxuryCardHeader
            title="Basic"
            subtitle="Perfect for getting started"
          />
          <LuxuryCardContent>
            <div className="text-3xl font-bold text-cocoa-900 mb-4">
              $99<span className="text-lg text-cocoa-600">/month</span>
            </div>
            <ul className="space-y-3 text-cocoa-700">
              <li className="flex items-center">
                <span className="text-champagne-500 mr-2">✓</span>
                5 Services per month
              </li>
              <li className="flex items-center">
                <span className="text-champagne-500 mr-2">✓</span>
                Basic support
              </li>
              <li className="flex items-center">
                <span className="text-champagne-500 mr-2">✓</span>
                Online booking
              </li>
            </ul>
          </LuxuryCardContent>
          <LuxuryCardFooter>
            <button className="w-full py-3 px-4 rounded-xl border border-champagne-300 text-champagne-700 hover:bg-champagne-50 transition-colors">
              Get Started
            </button>
          </LuxuryCardFooter>
        </LuxuryCardPricing>

        <LuxuryCardPricing badge="POPULAR" featured className="w-80">
          <LuxuryCardHeader
            title="Premium"
            subtitle="Most popular choice"
          />
          <LuxuryCardContent>
            <div className="text-3xl font-bold text-cocoa-900 mb-4">
              $199<span className="text-lg text-cocoa-600">/month</span>
            </div>
            <ul className="space-y-3 text-cocoa-700">
              <li className="flex items-center">
                <StarIcon />
                <span className="ml-2">Unlimited services</span>
              </li>
              <li className="flex items-center">
                <StarIcon />
                <span className="ml-2">Priority support</span>
              </li>
              <li className="flex items-center">
                <StarIcon />
                <span className="ml-2">Exclusive treatments</span>
              </li>
              <li className="flex items-center">
                <StarIcon />
                <span className="ml-2">Mobile app access</span>
              </li>
            </ul>
          </LuxuryCardContent>
          <LuxuryCardFooter>
            <button className="w-full py-3 px-4 rounded-xl bg-gradient-champagne text-cocoa-900 font-medium hover:shadow-lg transition-all">
              Start Premium
            </button>
          </LuxuryCardFooter>
        </LuxuryCardPricing>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Pricing cards with featured badges and enhanced styling.",
      },
    },
  },
};

// Interactive card showcase
export const InteractiveShowcase: Story = {
  render: () => {
    const [selectedCard, setSelectedCard] = React.useState<number | null>(null);

    const cards = [
      { title: "Beauty Services", description: "Premium beauty treatments", color: "rose" },
      { title: "Fitness Programs", description: "Personalized fitness plans", color: "emerald" },
      { title: "Wellness Packages", description: "Complete wellness solutions", color: "violet" },
    ];

    return (
      <div className="p-8 glass-card rounded-3xl space-y-6">
        <div className="text-center">
          <h3 className="text-2xl font-display text-cocoa-900 mb-2">Interactive Card Selection</h3>
          <p className="text-cocoa-600">Click on any card to select it</p>
        </div>

        <div className="flex gap-6 flex-wrap justify-center">
          {cards.map((card, index) => (
            <LuxuryCard
              key={index}
              variant={selectedCard === index ? "accent" : "luxury"}
              hover
              interactive
              className={`w-64 cursor-pointer transition-all duration-300 ${
                selectedCard === index ? "ring-2 ring-champagne-400 scale-105" : ""
              }`}
              onClick={() => setSelectedCard(index)}
            >
              <LuxuryCardHeader title={card.title} subtitle={card.description} />
              <LuxuryCardContent>
                <div className={`w-full h-2 rounded-full bg-${card.color}-100 mb-4`}>
                  <div className={`w-3/4 h-full bg-${card.color}-500 rounded-full`} />
                </div>
                <p className="text-sm text-cocoa-600">
                  {selectedCard === index ? "✓ Selected" : "Click to select"}
                </p>
              </LuxuryCardContent>
            </LuxuryCard>
          ))}
        </div>

        {selectedCard !== null && (
          <div className="text-center p-4 glass-luxury rounded-xl">
            <p className="text-cocoa-700">
              You selected: <span className="font-semibold">{cards[selectedCard].title}</span>
            </p>
          </div>
        )}
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Interactive demonstration showing card selection and state management.",
      },
    },
  },
};

// Responsive grid
export const ResponsiveGrid: Story = {
  render: () => {
    const cards = Array.from({ length: 6 }, (_, i) => ({
      title: `Service ${i + 1}`,
      description: `Premium service option ${i + 1} with luxury features and exceptional quality.`,
      price: `$${99 + i * 50}`,
    }));

    return (
      <div className="w-full max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card, index) => (
            <LuxuryCard key={index} variant="luxury" hover>
              <LuxuryCardHeader title={card.title} />
              <LuxuryCardContent>
                <p className="text-cocoa-700 mb-4">{card.description}</p>
                <div className="text-2xl font-bold text-champagne-600">{card.price}</div>
              </LuxuryCardContent>
              <LuxuryCardFooter>
                <button className="flex-1 py-2 px-4 rounded-lg glass-card text-cocoa-700 hover:text-champagne-600 transition-colors">
                  View Details
                </button>
              </LuxuryCardFooter>
            </LuxuryCard>
          ))}
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: "Responsive grid layout showcasing multiple cards with consistent spacing and mobile optimization.",
      },
    },
  },
};