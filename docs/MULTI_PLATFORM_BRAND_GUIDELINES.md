# Multi-Platform Brand Consistency Guidelines: Mariia Hub

**Date:** October 30, 2025
**Scope:** Comprehensive brand consistency across all digital and print platforms
**Target Market:** Premium Warsaw beauty and fitness services
**Brand Positioning:** Definitive luxury choice in Warsaw market

## Executive Overview

These guidelines ensure the mariia-hub brand maintains consistent visual identity, messaging, and user experience across all customer touchpoints. Consistency builds trust, reinforces luxury positioning, and creates seamless customer journeys from discovery to loyal advocacy.

---

## 1. Brand Architecture Overview

### 1.1 Visual Identity Hierarchy

**Primary Brand Elements:**
- Logo: Mariia Hub wordmark with Polish crown accent
- Color Palette: Cocoa/Champagne/Bronze luxury system
- Typography: Modern serif display with clean sans-serif body
- Visual Style: Liquid glass morphism with Polish cultural elements

**Secondary Brand Elements:**
- Icon Library: Custom luxury icons for beauty and fitness
- Pattern System: Polish folk-inspired geometric patterns
- Illustration Style: Editorial luxury with modern Polish aesthetics
- Photography Style: Warm, sophisticated, professional lighting

**Tertiary Brand Elements:**
- Motion Graphics: Smooth, elegant animations
- Video Style: Cinematic with warm color grading
- Audio Identity: Sophisticated instrumental with Polish classical influences
- Packaging Design: Minimalist luxury with premium materials

### 1.2 Platform Priority Matrix

| Platform | Priority | Usage | Consistency Level |
|----------|----------|-------|------------------|
| Website | Critical | Primary booking & information | 100% |
| Mobile App | Critical | On-the-go booking & management | 100% |
| Instagram | High | Social engagement & visual storytelling | 95% |
| Facebook | High | Community building & business communication | 95% |
| Email | High | Customer communication & marketing | 95% |
| Print Materials | Medium | Physical marketing & premium materials | 90% |
| LinkedIn | Medium | Professional networking | 85% |
| TikTok | Low | Trending content & brand awareness | 80% |

---

## 2. Website Platform Guidelines

### 2.1 Visual Consistency Standards

**Color Application:**
```css
/* Primary color usage */
:root {
  --primary-cocoa: #8b633c;
  --accent-champagne: #d4a574;
  --support-bronze: #c19c31;
  --neutral-dark: #2c1810;
  --neutral-light: #fefcf8;
}

/* Contextual color application */
.cta-primary { background: var(--accent-champagne); }
.cta-secondary { background: var(--primary-cocoa); }
.accent-elements { color: var(--support-bronze); }
.background-primary { background: var(--neutral-light); }
.text-primary { color: var(--neutral-dark); }
```

**Typography System:**
```css
/* Display typography for luxury appeal */
.typography-hero {
  font-family: 'Playfair Display', serif;
  font-size: clamp(2.5rem, 5vw, 4rem);
  font-weight: 300;
  line-height: 1.1;
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, #8b633c, #d4a574);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

/* Body typography for readability */
.typography-body {
  font-family: 'Inter', system-ui, sans-serif;
  font-size: clamp(1rem, 2vw, 1.125rem);
  font-weight: 400;
  line-height: 1.6;
  color: var(--neutral-dark);
}

/* Polish language optimization */
.typography-polish {
  font-family: 'Poppins', 'Inter', sans-serif;
  letter-spacing: 0.01em;
  line-height: 1.5;
}
```

### 2.2 Component Consistency

**Button System:**
```typescript
// Consistent button implementation across all pages
interface LuxuryButtonProps {
  variant: 'primary' | 'secondary' | 'outline' | 'glass';
  size: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  onClick?: () => void;
}

const LuxuryButton: React.FC<LuxuryButtonProps> = ({
  variant,
  size,
  children,
  onClick
}) => {
  const variantClasses = {
    primary: 'bg-champagne-500 text-white hover:bg-champagne-600',
    secondary: 'bg-cocoa-600 text-white hover:bg-cocoa-700',
    outline: 'border-2 border-champagne-500 text-champagne-500 hover:bg-champagne-50',
    glass: 'glass-card hover:bg-champagne/10'
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
    xl: 'px-12 py-6 text-xl'
  };

  return (
    <button
      className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        rounded-xl
        transition-all duration-300
        hover:scale-105
        active:scale-95
        font-medium
        touch-manipulation
      `}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
```

**Card System:**
```typescript
// Consistent card implementation
interface LuxuryCardProps {
  variant: 'standard' | 'elevated' | 'glass' | 'accent';
  children: React.ReactNode;
  hover?: boolean;
}

const LuxuryCard: React.FC<LuxuryCardProps> = ({
  variant,
  children,
  hover = true
}) => {
  const variantClasses = {
    standard: 'bg-white border border-cocoa-200',
    elevated: 'bg-white shadow-luxury',
    glass: 'glass-card',
    accent: 'bg-champagne-50 border border-champagne-200'
  };

  const hoverClasses = hover ? 'hover:shadow-luxury-strong hover:scale-[1.02] transition-all duration-300' : '';

  return (
    <div className={`
      ${variantClasses[variant]}
      ${hoverClasses}
      rounded-2xl
      p-6
    `}>
      {children}
    </div>
  );
};
```

### 2.3 Responsive Consistency

**Breakpoint System:**
```css
/* Consistent breakpoint system */
:root {
  --breakpoint-xs: 375px;   /* Small phones */
  --breakpoint-sm: 640px;   /* Large phones */
  --breakpoint-md: 768px;   /* Tablets */
  --breakpoint-lg: 1024px;  /* Laptops */
  --breakpoint-xl: 1280px;  /* Desktop */
  --breakpoint-2xl: 1536px; /* Large desktop */
}

/* Consistent spacing across breakpoints */
.container {
  padding-left: clamp(1rem, 5vw, 2rem);
  padding-right: clamp(1rem, 5vw, 2rem);
}

/* Typography scaling */
@media (min-width: 768px) {
  .text-responsive {
    font-size: 1.125rem;
    line-height: 1.7;
  }
}

@media (min-width: 1024px) {
  .text-responsive {
    font-size: 1.25rem;
    line-height: 1.8;
  }
}
```

---

## 3. Mobile Application Guidelines

### 3.1 Native App Consistency

**iOS Implementation:**
```swift
// Consistent color system for iOS
extension UIColor {
    static let brandCocoa = UIColor(red: 0.545, green: 0.388, blue: 0.235, alpha: 1.0)
    static let brandChampagne = UIColor(red: 0.831, green: 0.647, blue: 0.455, alpha: 1.0)
    static let brandBronze = UIColor(red: 0.757, green: 0.612, blue: 0.192, alpha: 1.0)
}

// Consistent typography for iOS
extension UIFont {
    static let brandDisplay = UIFont(name: "PlayfairDisplay-Regular", size: 28)!
    static let brandBody = UIFont.systemFont(ofSize: 16, weight: .regular)
    static let brandCaption = UIFont.systemFont(ofSize: 12, weight: .medium)
}
```

**Android Implementation:**
```kotlin
// Consistent color system for Android
object BrandColors {
    val Cocoa = Color(0xFF8B633C)
    val Champagne = Color(0xFFD4A574)
    val Bronze = Color(0xFFC19C31)
    val NeutralDark = Color(0xFF2C1810)
    val NeutralLight = Color(0xFFFEFCF8)
}

// Consistent typography for Android
object BrandTypography {
    val Display = TextStyle(
        fontFamily = FontFamily.Default,
        fontSize = 28.sp,
        fontWeight = FontWeight.Normal,
        lineHeight = 34.sp
    )

    val Body = TextStyle(
        fontFamily = FontFamily.Default,
        fontSize = 16.sp,
        fontWeight = FontWeight.Normal,
        lineHeight = 24.sp
    )
}
```

### 3.2 Cross-Platform Component Library

**React Native Components:**
```typescript
// Consistent button component for React Native
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

interface RNButtonProps {
  variant: 'primary' | 'secondary' | 'outline';
  size: 'sm' | 'md' | 'lg';
  title: string;
  onPress: () => void;
}

const RNButton: React.FC<RNButtonProps> = ({
  variant,
  size,
  title,
  onPress
}) => {
  const getButtonStyle = () => {
    const baseStyle = {
      borderRadius: 12,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    };

    const variantStyle = {
      primary: { backgroundColor: '#D4A574' },
      secondary: { backgroundColor: '#8B633C' },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#D4A574'
      }
    };

    const sizeStyle = {
      sm: { paddingHorizontal: 16, paddingVertical: 8 },
      md: { paddingHorizontal: 24, paddingVertical: 12 },
      lg: { paddingHorizontal: 32, paddingVertical: 16 }
    };

    return StyleSheet.flatten([baseStyle, variantStyle[variant], sizeStyle[size]]);
  };

  return (
    <TouchableOpacity style={getButtonStyle()} onPress={onPress}>
      <Text style={{
        color: variant === 'outline' ? '#D4A574' : '#FFFFFF',
        fontSize: size === 'sm' ? 14 : size === 'md' ? 16 : 18,
        fontWeight: '600'
      }}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};
```

---

## 4. Social Media Platform Guidelines

### 4.1 Instagram Brand Consistency

**Visual Grid Strategy:**
```
Grid Pattern (3x3):
[1] Hero Shot      [2] Beauty Service [3] Polish Culture
[4] Behind Scenes [5] Fitness Service [6] Client Testimonial
[7] Educational    [8] Luxury Lifestyle [9] Call-to-Action
```

**Content Pillars:**
1. **Beauty Services (30%)**: PMU treatments, brow services, lash extensions
2. **Fitness Services (30%)**: Personal training, group classes, glutes programs
3. **Polish Culture (20%)**: Warsaw locations, cultural elements, local pride
4. **Educational Content (10%)**: Tips, tutorials, industry insights
5. **Luxury Lifestyle (10%)**: Premium experiences, behind-the-scenes

**Visual Consistency Rules:**
```css
/* Instagram post template */
.instagram-post {
  /* Consistent dimensions */
  width: 1080px;
  height: 1350px; /* 4:5 ratio */

  /* Brand colors */
  background: linear-gradient(135deg, #8B633C, #D4A574);

  /* Typography */
  font-family: 'Poppins', sans-serif;
  color: #FFFFFF;

  /* Logo placement */
  logo-position: top-right;
  logo-size: 80px;
}

/* Instagram story template */
.instagram-story {
  /* Consistent dimensions */
  width: 1080px;
  height: 1920px; /* 9:16 ratio */

  /* Brand gradient overlay */
  overlay: linear-gradient(180deg,
    rgba(139, 99, 60, 0.1) 0%,
    rgba(212, 165, 116, 0.1) 100%);
}
```

### 4.2 Facebook Brand Guidelines

**Page Structure:**
```
Cover Photo: 851x315px
- Hero image with luxury aesthetic
- Brand colors prominent
- Value proposition clear

Profile Picture: 180x180px
- Clean logo on transparent background
- Recognizable at small size

Post Templates:
- Educational posts: 1200x630px
- Service promotions: 1080x1080px
- Behind-the-scenes: 1080x1350px
```

**Content Strategy:**
- **Monday**: Educational content (beauty tips, fitness advice)
- **Tuesday**: Service spotlights (detailed service information)
- **Wednesday**: Client testimonials (social proof)
- **Thursday**: Polish culture features (local pride)
- **Friday**: Lifestyle content (luxury experiences)
- **Saturday**: Behind-the-scenes (authentic connection)
- **Sunday**: Inspirational content (motivation, goals)

### 4.3 LinkedIn Professional Guidelines

**Corporate Voice:**
- Professional yet approachable tone
- Industry expertise and thought leadership
- Polish business community engagement
- Luxury market insights

**Visual Standards:**
```
Banner Image: 1584x396px
- Professional office/studio shots
- Team photos with brand colors
- Professional achievements

Profile Picture: 400x400px
- Professional headshot
- Consistent with brand style

Post Images: 1200x627px
- Professional service photography
- Industry statistics and infographics
- Team achievements and milestones
```

---

## 5. Email Marketing Guidelines

### 5.1 Email Template System

**Header Structure:**
```html
<!-- Consistent email header -->
<table width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td bgcolor="#FEFCF8" style="padding: 20px 0;">
      <table width="600" align="center" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td width="200">
            <!-- Logo -->
            <img src="logo.png" alt="Mariia Hub" width="150" style="display: block;">
          </td>
          <td width="400" align="right">
            <!-- Navigation -->
            <a href="#" style="color: #8B633C; text-decoration: none; margin: 0 10px;">Services</a>
            <a href="#" style="color: #8B633C; text-decoration: none; margin: 0 10px;">Booking</a>
            <a href="#" style="color: #8B633C; text-decoration: none; margin: 0 10px;">Contact</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
```

**Button System:**
```html
<!-- Consistent CTA button -->
<table cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td align="center" style="border-radius: 12px; background: #D4A574;">
      <a href="#"
         style="font-size: 16px; font-family: 'Poppins', sans-serif; color: #FFFFFF;
                text-decoration: none; border-radius: 12px; padding: 15px 30px;
                display: inline-block; font-weight: 600;">
        Book Now
      </a>
    </td>
  </tr>
</table>
```

### 5.2 Email Content Strategy

**Email Types and Guidelines:**

**Welcome Series:**
- **Email 1**: Welcome + Brand Story (Polish heritage)
- **Email 2**: Service Overview + Special Offer
- **Email 3**: Polish Beauty Culture + Booking CTA
- **Email 4**: Client Testimonials + Social Proof

**Newsletter Content:**
- Monthly beauty and fitness tips
- Polish culture highlights
- Client success stories
- Service updates and promotions

**Transactional Emails:**
- Booking confirmations with Polish cultural elements
- Appointment reminders with preparation tips
- Follow-up emails with aftercare instructions
- Payment receipts with luxury branding

---

## 6. Print Media Guidelines

### 6.1 Business Stationery

**Business Cards:**
```
Dimensions: 90mm x 50mm
Paper: 350gsm premium card stock with matte finish
Colors: Cocoa (#8B633C), Champagne (#D4A574)
Typography: Playfair Display + Inter

Layout:
Front: Logo, name, title, contact info
Back: Polish cultural element, QR code to website
```

**Letterhead:**
```
Dimensions: A4 (210mm x 297mm)
Paper: 120gsm premium paper with subtle texture
Colors: Full brand palette
Typography: Consistent with digital platforms

Elements:
- Header with logo and contact info
- Subtle Polish pattern watermark
- Footer with social media links
```

### 6.2 Marketing Materials

**Brochures:**
```
Format: Tri-fold A4 (297mm x 210mm)
Paper: 170gsm gloss paper
Colors: Full brand palette
Photography: Professional service and lifestyle shots

Content Sections:
1. Cover: Hero image with logo
2. About: Brand story + Polish heritage
3. Services: Beauty + Fitness offerings
4. Testimonials: Client success stories
5. Contact: Booking information
6. Back: Polish cultural element + QR code
```

**Posters:**
```
Sizes: A3 (297mm x 420mm), A2 (420mm x 594mm)
Paper: 200gsm premium poster paper
Style: Minimalist luxury with strong typography

Elements:
- Hero image
- Service promotion
- Contact information
- Brand logo
- Polish cultural accent
```

---

## 7. Video Content Guidelines

### 7.1 Video Style Guide

**Technical Specifications:**
- **Resolution**: 1920x1080 (Full HD) / 3840x2160 (4K for hero content)
- **Frame Rate**: 30fps (smooth luxury feel)
- **Codec**: H.264 for web, ProRes for professional use
- **Audio**: 48kHz, stereo, professional voiceover
- **Duration**: 15-60 seconds depending on platform

**Color Grading:**
```
Primary Color Grade:
- Warm temperature (3200K-3500K)
- Increased saturation in mid-tones
- Subtle champagne highlights
- Cocoa shadows for depth
- Professional skin tone preservation

LUT Presets:
- "Mariia Hub Warm" - Standard look
- "Mariia Hub Luxury" - Enhanced for premium content
- "Mariia Hub Polish" - Cultural content emphasis
```

**Motion Graphics:**
```css
/* Consistent motion graphics */
.motion-logo {
  animation: logoReveal 2s ease-out;
  transform-origin: center;
}

@keyframes logoReveal {
  0% {
    opacity: 0;
    transform: scale(0.8) rotate(-10deg);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05) rotate(2deg);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

.motion-text {
  animation: textReveal 1.5s ease-out;
  transform-origin: left center;
}

@keyframes textReveal {
  0% {
    opacity: 0;
    transform: translateX(-50px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}
```

### 7.2 Platform-Specific Video Guidelines

**Instagram Reels (15-30 seconds):**
- Vertical format (1080x1920)
- Fast-paced editing with smooth transitions
- Trending audio with brand-appropriate selection
- Text overlays in Polish and English
- Strong hook in first 3 seconds

**TikTok Content (15-60 seconds):**
- Educational content: Beauty tips, fitness advice
- Behind-the-scenes: Treatment processes
- Cultural content: Polish beauty traditions
- Trend participation with luxury adaptation

**YouTube Content (2-10 minutes):**
- Professional service demonstrations
- Client transformation stories
- Polish beauty culture education
- Fitness tutorial series

---

## 8. Implementation Strategy

### 8.1 Rollout Timeline

**Phase 1: Foundation (Weeks 1-4)**
- Complete asset library development
- Implement website consistency updates
- Create social media templates
- Establish email template system

**Phase 2: Mobile & Social (Weeks 5-8)**
- Launch mobile app updates
- Implement social media guidelines
- Create video content templates
- Establish content calendar

**Phase 3: Advanced Platforms (Weeks 9-12)**
- Develop print materials
- Create video content library
- Implement LinkedIn strategy
- Launch email campaigns

**Phase 4: Optimization (Weeks 13-16)**
- Performance monitoring
- User feedback collection
- Platform-specific optimization
- Guidelines refinement

### 8.2 Quality Assurance Process

**Consistency Checklist:**
```typescript
interface BrandConsistencyChecklist {
  platform: string;
  elements: {
    logo: boolean;
    colors: boolean;
    typography: boolean;
    imagery: boolean;
    messaging: boolean;
  };
  reviewedBy: string;
  approved: boolean;
  date: Date;
}

const consistencyChecker = (platform: string): BrandConsistencyChecklist => {
  return {
    platform,
    elements: {
      logo: checkLogoConsistency(platform),
      colors: checkColorConsistency(platform),
      typography: checkTypographyConsistency(platform),
      imagery: checkImageryConsistency(platform),
      messaging: checkMessagingConsistency(platform)
    },
    reviewedBy: '',
    approved: false,
    date: new Date()
  };
};
```

**Testing Protocol:**
1. **Visual Testing**: Cross-platform visual comparison
2. **User Testing**: Brand recognition and consistency feedback
3. **Performance Testing**: Loading times and user experience
4. **Accessibility Testing**: WCAG compliance across platforms
5. **Cultural Testing**: Polish cultural appropriateness and resonance

### 8.3 Monitoring & Maintenance

**Brand Health Metrics:**
- Brand recognition scores
- Cross-platform engagement rates
- Visual consistency audit results
- User feedback on brand experience
- Cultural relevance indicators

**Maintenance Schedule:**
- **Daily**: Social media content review
- **Weekly**: Brand consistency audit
- **Monthly**: Asset library updates
- **Quarterly**: Guidelines review and updates
- **Annually**: Complete brand refresh assessment

---

## 9. Crisis Management & Adaptation

### 9.1 Brand Protection Protocols

**Digital Asset Protection:**
- Watermark all visual content
- Monitor unauthorized brand usage
- Implement brand usage guidelines for partners
- Establish legal protection for brand elements

**Reputation Management:**
- Monitor brand mentions across platforms
- Respond to feedback within 24 hours
- Maintain consistent brand voice during crises
- Prepare contingency messaging templates

### 9.2 Platform-Specific Adaptations

**Cultural Sensitivity:**
- Polish holidays and cultural events
- Local Warsaw community engagement
- Seasonal adaptations for Polish climate
- Cultural trend integration

**Platform Algorithm Adaptation:**
- Instagram algorithm optimization
- Facebook engagement strategies
- LinkedIn professional networking
- TikTok trend participation

---

## 10. Success Metrics & KPIs

### 10.1 Brand Consistency Metrics

**Visual Consistency Score:**
```
Scoring System (0-100):
- Logo Usage: 20 points
- Color Consistency: 20 points
- Typography: 15 points
- Imagery Style: 15 points
- Messaging Tone: 15 points
- Cultural Elements: 15 points

Target Score: 95+ across all platforms
```

**Cross-Platform Engagement:**
- **Website**: 25% of total engagement
- **Instagram**: 35% of total engagement
- **Facebook**: 20% of total engagement
- **Email**: 15% of total engagement
- **Other Platforms**: 5% of total engagement

### 10.2 Business Impact Metrics

**Brand Recognition:**
- Unaided brand awareness: Target 60% in Warsaw market
- Brand recall rate: Target 80% among target audience
- Social media reach: Target 100K+ monthly impressions
- Website direct traffic: Target 40% of total traffic

**Conversion Metrics:**
- Cross-platform conversion rate: Target 3.5%
- Brand attribution rate: Target 25%
- Customer acquisition cost: Optimize through brand consistency
- Customer lifetime value: Increase through brand loyalty

---

## 11. Conclusion

These multi-platform brand consistency guidelines provide a comprehensive framework for maintaining the mariia-hub brand's luxury positioning across all customer touchpoints. By implementing these standards, mariia-hub will establish itself as the definitive premium beauty and fitness brand in Warsaw's luxury market.

The consistent application of these guidelines will create:
- **Strong Brand Recognition**: Immediate brand identification across platforms
- **Enhanced Customer Trust**: Consistent experience builds reliability
- **Premium Market Positioning**: Luxury presentation reinforces premium pricing
- **Cultural Connection**: Polish heritage elements create authentic connection
- **Competitive Advantage**: Cohesive brand identity stands out in market

**Next Steps:**
1. Implement guidelines across all platforms
2. Establish brand consistency monitoring
3. Train team members on brand standards
4. Create feedback loops for continuous improvement
5. Regularly review and update guidelines

**Success Criteria:**
- 95%+ brand consistency score across all platforms
- Increased brand recognition in Warsaw market
- Improved customer engagement and conversion rates
- Strong competitive position in luxury segment
- Authentic cultural connection with Polish audience

---

**Document Version:** 1.0
**Last Updated:** October 30, 2025
**Next Review:** January 30, 2026
**Implementation Timeline:** 16 weeks
**Success Measurement:** Quarterly reviews