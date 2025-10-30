# Accessibility User Testing Recruitment Strategy

## Executive Summary

This document outlines the comprehensive recruitment strategy for conducting accessibility user testing with people with disabilities for the mariia-hub beauty and fitness booking platform. Our approach prioritizes ethical recruitment, diverse representation, and meaningful engagement with the disability community.

## Recruitment Objectives

### Primary Goals
- Recruit 15-20 participants with diverse disabilities for comprehensive testing
- Ensure representation across all major disability categories
- Maintain high ethical standards and fair compensation
- Build long-term relationships with the disability community
- Generate actionable insights for accessibility improvements

### Success Metrics
- 90% participant satisfaction rate
- 95% session completion rate
- Diverse disability representation (minimum 4 categories)
- 50% return rate for follow-up testing

## Target Participant Profiles

### Visual Impairments (4-5 participants)
**Screen Reader Users (2-3 participants)**
- **Experience Level**: 2+ years with screen readers
- **Primary Tools**: NVDA, JAWS, VoiceOver, TalkBack
- **Usage Frequency**: Daily computer/internet users
- **Age Range**: 25-65
- **Background**: Tech-savvy, familiar with booking platforms

**Low Vision Users (2 participants)**
- **Vision Range**: 20/70 to 20/200
- **Tools**: Screen magnification, high contrast, browser zoom
- **Experience**: Comfortable with accessibility features
- **Age Range**: 30-70
- **Background**: Regular internet users, beauty/fitness interest

### Motor Impairments (3-4 participants)
**Keyboard-Only Users (2 participants)**
- **Reason**: Motor limitations, RSI, preference
- **Skills**: Advanced keyboard navigation
- **Tools**: Keyboard shortcuts, alternative input devices
- **Age Range**: 25-60
- **Background**: Professional computer users

**Voice Control/Alternative Input Users (1-2 participants)**
- **Tools**: Dragon Naturally Speaking, switch navigation
- **Experience**: Regular alternative input usage
- **Age Range**: 35-65
- **Background**: Adapted technology users

### Cognitive Disabilities (3-4 participants)
**Learning Disabilities (2 participants)**
- **Types**: Dyslexia, processing disorders, ADHD
- **Challenges**: Reading comprehension, focus
- **Accommodations**: Clear layouts, multi-modal content
- **Age Range**: 22-50
- **Background**: Regular internet users, motivated to learn

**Memory/Attention Disorders (1-2 participants)**
- **Conditions**: ADHD, memory impairments
- **Needs**: Clear navigation, minimal distractions
- **Age Range**: 25-45
- **Background**: Task-oriented users

### Hearing Impairments (2-3 participants)
**Deaf/Hard-of-Hearing Users**
- **Communication**: Written communication, visual alerts
- **Technology**: Visual notification systems
- **Age Range**: 20-60
- **Background**: Video content consumers, caption users

### Age-Related Accessibility (2-3 participants)
**Elderly Users (65+)**
- **Challenges**: Vision, motor, cognitive changes
- **Experience**: Variable tech skills
- **Needs**: Simple navigation, clear instructions
- **Background**: Beauty/fitness service interest

## Recruitment Channels and Timeline

### Primary Recruitment Channels

#### 1. Disability Organizations (Timeline: 2-4 weeks)
**Polish Disability Organizations**
- Polska Organizacja Pracodawców Osób Niepełnosprawnych
- Fundacja Instytut Rozwoju Regionalnego
- Stowarzyszenie Pomocy Dzieciom Niepełnosprawnym

**Approach Strategy:**
- Formal partnership proposals
- Co-branded recruitment materials
- Donation to organization for participant recruitment
- Long-term collaboration opportunities

#### 2. Online Communities and Forums (Timeline: 1-2 weeks)
**Target Platforms:**
- Facebook Groups: "Niesłyszący w Polsce," "Osoby z Wadami Wzroku"
- Reddit: r/blind, r/deaf, r/disability
- LinkedIn: Disability advocacy groups
- Specialized forums: accessibility, assistive technology

**Engagement Strategy:**
- Personal outreach to community moderators
- Informative posts about testing purpose
- Clear compensation and accessibility information
- Respect community guidelines

#### 3. University Disability Services (Timeline: 3-6 weeks)
**Target Institutions:**
- University of Warsaw Disability Services
- Jagiellonian University Support Center
- Technical universities ( Warsaw University of Technology)

**Collaboration Benefits:**
- Student participant recruitment
- Research collaboration opportunities
- Academic credibility
- Access to diverse age groups

#### 4. Professional Testing Panels (Timeline: 1-2 weeks)
**Accessibility-Specific Agencies:**
- Fable (accessibility testing platform)
- Knowbility (non-profit accessibility organization)
- Local UX testing firms with disability focus

**Advantages:**
- Pre-screened participants
- Professional facilitation
- Established testing protocols
- Quick turnaround

### Secondary Recruitment Channels

#### 5. Customer Database Outreach (Timeline: 1 week)
- Email campaign to existing users
- Accessibility interest survey
- Self-identification option
- Incentive for participation

#### 6. Social Media Campaign (Timeline: 2 weeks)
- Instagram/Facebook posts about accessibility testing
- Targeted ads to disability communities
- Influencer partnerships
- Shareable graphics and videos

## Screening and Selection Process

### Initial Screening Questionnaire

#### Basic Information
```typescript
interface ScreeningQuestionnaire {
  personalInfo: {
    age: string
    location: string
    primaryLanguage: string
    englishProficiency: string
  }

  disabilityInfo: {
    primaryDisability: string
    secondaryDisabilities?: string[]
    assistiveTechnologyUsed: string[]
    techExperience: string
    dailyTechUsage: string
  }

  participationDetails: {
    availability: string[]
    deviceAccess: string[]
    internetQuality: string
    testingPreference: string
    accommodationNeeds: string[]
  }

  motivationAndFit: {
    beautyFitnessInterest: string
    bookingExperience: string
    testingMotivation: string
    previousTesting: string
  }
}
```

#### Screening Criteria

**Inclusion Requirements:**
- Age 18-75 (primary service demographic)
- Regular internet usage (3+ times weekly)
- 6+ months experience with assistive technology
- Interest in beauty/fitness services (or willingness to learn)
- Ability to provide informed consent
- Available during testing window
- Reliable internet connection for remote testing

**Exclusion Criteria:**
- Mariia Hub employees or immediate family
- Participation in accessibility testing (any platform) in last 6 months
- Severe technical limitations preventing remote participation
- Cognitive impairment affecting informed consent
- Conflict of interest with beauty/fitness industry

### Selection Scoring System

#### Participant Ranking Criteria
```typescript
interface ScoringSystem {
  disabilityRepresentation: number // 0-20 points
  assistiveTechDiversity: number  // 0-15 points
  experienceLevel: number         // 0-15 points
  demographicDiversity: number    // 0-15 points
  schedulingFlexibility: number   // 0-10 points
  technicalSetup: number          // 0-10 points
  communicationSkills: number     // 0-10 points
  motivationQuality: number       // 0-5 points

  totalScore: number              // 0-100 points
}
```

#### Selection Priorities
1. **Disability Diversity**: Ensure representation across all target categories
2. **Assistive Technology Coverage**: Multiple tools within each category
3. **Experience Level**: Mix of expert and intermediate users
4. **Demographic Balance**: Age, gender, geographic diversity
5. **Scheduling Compatibility**: Availability during testing windows

## Compensation Structure

### Base Compensation Tiers

#### Screen Reader Users
- **Base Payment**: 150 PLN (≈ $40 USD)
- **Complexity Bonus**: 50 PLN (≈ $13 USD)
- **Technical Reimbursement**: 25 PLN (≈ $7 USD)
- **Gift Value**: 50 PLN (≈ $13 USD) service credit
- **Total Value**: 275 PLN (≈ $73 USD)

#### Motor Impairment Users
- **Base Payment**: 125 PLN (≈ $33 USD)
- **Complexity Bonus**: 40 PLN (≈ $11 USD)
- **Technical Reimbursement**: 20 PLN (≈ $5 USD)
- **Gift Value**: 40 PLN (≈ $11 USD) service credit
- **Total Value**: 225 PLN (≈ $60 USD)

#### Cognitive Disability Users
- **Base Payment**: 100 PLN (≈ $27 USD)
- **Complexity Bonus**: 30 PLN (≈ $8 USD)
- **Technical Reimbursement**: 15 PLN (≈ $4 USD)
- **Gift Value**: 30 PLN (≈ $8 USD) service credit
- **Total Value**: 175 PLN (≈ $47 USD)

#### Low Vision Users
- **Base Payment**: 125 PLN (≈ $33 USD)
- **Complexity Bonus**: 40 PLN (≈ $11 USD)
- **Technical Reimbursement**: 20 PLN (≈ $5 USD)
- **Gift Value**: 40 PLN (≈ $11 USD) service credit
- **Total Value**: 225 PLN (≈ $60 USD)

### Additional Compensation Elements

#### Session Length Adjustments
- **Standard Session (60 minutes)**: Base compensation
- **Extended Session (90 minutes)**: +25% compensation
- **Technical Setup Time**: +15% compensation
- **Follow-up Participation**: +30 PLN (≈ $8 USD)

#### Payment Methods
- **Bank Transfer**: Preferred method (PLN/USD/EUR)
- **PayPal**: Alternative option
- **Gift Cards**: Mariia Hub service credits
- **Digital Wallets**: Revolut, PayU (Poland-specific)

#### Reimbursement Policy
- **Internet Costs**: Up to 25 PLN for remote sessions
- **Phone Costs**: For technical support calls
- **Software/Equipment**: If specific tools needed
- **Travel**: For in-person testing (if applicable)

## Ethical Considerations

### Participant Rights and Protections

#### Informed Consent Process
- **Clear Communication**: Plain language consent forms
- **Accessible Formats**: Screen reader compatible, large print
- **Voluntary Participation**: Emphasis on right to withdraw
- **Data Privacy**: GDPR-compliant data handling
- **Compensation Transparency**: Clear payment terms

#### Privacy and Confidentiality
- **Data Anonymization**: Remove personal identifiers
- **Secure Storage**: Encrypted data storage
- **Limited Access**: Only essential team members
- **Data Retention**: 90-day retention policy
- **Right to Deletion**: On-demand data removal

### Accessibility of Testing Process

#### Communication Accessibility
- **Multiple Formats**: Email, phone, video chat
- **Assistive Technology Support**: Compatible with participant tools
- **Flexible Scheduling**: Multiple time options
- **Break Options**: Regular rest periods during sessions

#### Technical Accessibility
- **Platform Compatibility**: Works with assistive technologies
- **Alternative Formats**: Multiple testing methods available
- **Technical Support**: Dedicated accessibility support
- **Backup Plans**: Alternative approaches if issues arise

## Recruitment Timeline and Milestones

### Phase 1: Preparation (Week 1)
- [ ] Finalize recruitment materials
- [ ] Establish partnerships with disability organizations
- [ ] Set up screening questionnaire system
- [ ] Prepare compensation structure
- [ ] Create communication templates

### Phase 2: Initial Outreach (Weeks 2-3)
- [ ] Contact disability organizations
- [ ] Post in online communities
- [ ] Reach out to university disability services
- [ ] Begin professional panel recruitment
- [ ] Send initial screening invitations

### Phase 3: Screening and Selection (Weeks 4-5)
- [ ] Review screening questionnaires
- [ ] Conduct brief screening calls (if needed)
- [ ] Score and rank candidates
- [ ] Select final participant pool
- [ ] Send acceptance notifications

### Phase 4: Confirmation and Preparation (Week 6)
- [ ] Confirm participation and schedule sessions
- [ ] Send detailed session information
- [ ] Conduct technical setup checks
- [ ] Prepare accessibility accommodations
- [ ] Finalize testing materials

### Phase 5: Testing Execution (Weeks 7-8)
- [ ] Conduct user testing sessions
- [ ] Monitor participant experience
- [ ] Address technical issues promptly
- [ ] Collect immediate feedback
- [ ] Process compensation payments

## Quality Assurance Measures

### Recruitment Quality Metrics
- **Response Rate**: Track outreach effectiveness
- **Screening Completion**: Monitor questionnaire completion
- **Drop-off Rate**: Identify bottlenecks in process
- **Participant Satisfaction**: Post-recruitment feedback
- **Diversity Metrics**: Ensure representation goals

### Risk Mitigation Strategies
- **Backup Participant Pool**: 25% over-recruitment
- **Contingency Scheduling**: Flexible time slots
- **Technical Support**: Dedicated troubleshooting team
- **Alternative Testing Methods**: Multiple approaches available
- **Participant Support**: Continuous assistance available

## Budget Allocation

### Recruitment Budget Breakdown
```typescript
interface RecruitmentBudget {
  participantCompensation: number    // 4,000 PLN (≈ $1,060 USD)
  organizationalPartnerships: number // 1,500 PLN (≈ $400 USD)
  advertisingOutreach: number       // 800 PLN (≈ $215 USD)
  technicalSupport: number          // 600 PLN (≈ $160 USD)
  contingencyFund: number           // 1,000 PLN (≈ $265 USD)

  totalBudget: number               // 7,900 PLN (≈ $2,100 USD)
}
```

### Cost Optimization Strategies
- **Partnership Leverage**: Utilize free organizational channels
- **Digital Outreach**: Cost-effective social media campaigns
- **Volunteer Support**: Utilize accessibility community volunteers
- **In-kind Compensation**: Service credits vs. cash payments
- **Group Sessions**: Where appropriate for efficiency

## Success Metrics and Evaluation

### Recruitment Success Indicators
- **Target Achievement**: 15-20 confirmed participants
- **Diversity Metrics**: Minimum 4 disability categories represented
- **Timeline Adherence**: All participants confirmed by Week 6
- **Budget Compliance**: Within allocated recruitment budget
- **Quality Score**: Average participant rating 8/10+

### Post-Recruitment Evaluation
- **Process Efficiency**: Time-to-hire metrics
- **Channel Effectiveness**: ROI analysis by recruitment channel
- **Participant Feedback**: Recruitment experience satisfaction
- **Diversity Assessment**: Representation quality review
- **Lessons Learned**: Process improvement documentation

## Long-term Community Engagement

### Building Lasting Relationships
- **Participant Community**: Create ongoing feedback panel
- **Advisory Board**: Establish disability advisory council
- **Educational Content**: Share accessibility insights with community
- **Events and Webinars**: Host accessibility-focused events
- **Continuous Testing**: Regular testing opportunities

### Industry Collaboration
- **Knowledge Sharing**: Contribute to accessibility best practices
- **Conference Presentations**: Share testing insights
- **Research Partnerships**: Collaborate with academic institutions
- **Open Source Contributions**: Share testing tools and methods
- **Accessibility Advocacy**: Support broader accessibility initiatives

This comprehensive recruitment strategy ensures that mariia-hub can conduct meaningful accessibility user testing with diverse participants while maintaining high ethical standards and building lasting relationships with the disability community.