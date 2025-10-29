---
name: Comprehensive Repository Review
description: Perform a complete end-to-end review of the entire repository using multiple specialized agents simultaneously
category: Analysis
tags: [review, audit, comprehensive, multi-agent]
---

## Comprehensive Repository Review Prompt

You are tasked with conducting a thorough, end-to-end review of this entire repository using multiple specialized agents working simultaneously. This is a luxury beauty and fitness booking platform targeting the Warsaw market.

### Review Objectives

1. **Code Quality Assessment**: Evaluate overall code quality, architecture, and maintainability
2. **Security Audit**: Identify security vulnerabilities, compliance issues, and data protection gaps
3. **Performance Analysis**: Assess performance bottlenecks, optimization opportunities, and scaling readiness
4. **Architecture Review**: Evaluate system architecture, patterns, and technical decisions
5. **Testing Coverage**: Analyze test coverage, quality, and testing strategy effectiveness
6. **Documentation Audit**: Review documentation completeness, accuracy, and accessibility
7. **DevOps & Infrastructure**: Assess deployment processes, CI/CD, and infrastructure readiness
8. **User Experience**: Evaluate UX/UI implementation, accessibility, and mobile optimization
9. **Business Logic Validation**: Verify booking workflows, payment integration, and business rules
10. **Internationalization**: Review multi-language support and localization implementation

### Multi-Agent Strategy

Deploy the following specialized agents simultaneously to maximize coverage and expertise:

#### **Agent 1: Security & Compliance Specialist**
- Focus: Security vulnerabilities, GDPR compliance, data protection
- Tools: Security audit scripts, dependency analysis, credential scanning
- Deliverables: Security report with risk assessment and remediation priorities

#### **Agent 2: Performance & Scalability Expert**
- Focus: Bundle analysis, runtime performance, database optimization
- Tools: Lighthouse audits, bundle analyzers, database query analysis
- Deliverables: Performance metrics report and optimization roadmap

#### **Agent 3: Architecture & Code Quality Reviewer**
- Focus: Code architecture, patterns, maintainability, technical debt
- Tools: Code analysis tools, dependency mapping, complexity analysis
- Deliverables: Architecture assessment and refactoring recommendations

#### **Agent 4: Testing & Quality Assurance Analyst**
- Focus: Test coverage, test quality, testing strategy
- Tools: Test coverage analysis, test runner audits, mocking strategy review
- Deliverables: Testing strategy assessment and improvement plan

#### **Agent 5: Documentation & Knowledge Management Reviewer**
- Focus: Documentation completeness, developer experience, onboarding
- Tools: Documentation analysis, README reviews, API documentation audit
- Deliverables: Documentation quality report and improvement recommendations

#### **Agent 6: Business Logic & Domain Expert**
- Focus: Booking workflows, payment integration, business rule validation
- Tools: Workflow analysis, integration testing, business logic verification
- Deliverables: Business logic validation report and integration assessment

### Key Areas to Investigate

#### **Core Application Structure**
- React 18 + TypeScript + Vite setup
- shadcn/ui + Tailwind CSS implementation
- Supabase integration and database schema
- State management patterns (Context + React Query)
- Routing and navigation architecture

#### **Business Critical Features**
- 4-step booking wizard with session persistence
- Real-time availability and hold system
- Stripe payment integration
- Booksy API synchronization
- Multi-language support (EN/PL)
- Admin dashboard and CMS functionality

#### **Technical Infrastructure**
- Build optimization and bundle splitting
- Service worker and PWA implementation
- Error handling and monitoring
- Testing setup and coverage
- CI/CD pipeline and deployment process

#### **Security & Compliance**
- Authentication and authorization
- Data encryption and secure storage
- GDPR compliance and consent management
- Input validation and XSS protection
- API security and rate limiting

#### **Performance & Optimization**
- Bundle size optimization
- Image optimization and CDN usage
- Database query optimization
- Caching strategies
- Mobile performance optimization

### Deliverables Format

Each agent should provide:

1. **Executive Summary** (1-2 paragraphs)
2. **Detailed Findings** with:
   - Severity levels (Critical/High/Medium/Low)
   - Specific file references (file.ts:line format)
   - Code examples where applicable
   - Impact assessment

3. **Recommendations** with:
   - Prioritized action items
   - Implementation effort estimates
   - Dependencies between tasks

4. **Metrics & KPIs**:
   - Quantitative measurements
   - Benchmark comparisons
   - Progress tracking suggestions

### Coordination Instructions

1. **Parallel Execution**: All agents should work simultaneously on different aspects
2. **Cross-Referencing**: Agents should identify and note interdependencies between findings
3. **Consolidation**: Prepare for a final synthesis session to combine all findings
4. **Prioritization**: Focus on business-critical issues and user-impacting problems

### Success Criteria

- Comprehensive coverage of all 10 review objectives
- Identification of critical security and performance issues
- Actionable roadmap with clear priorities
- Consistent findings across agents where areas overlap
- Practical recommendations considering business constraints

### Timeline & Process

1. **Initial Reconnaissance** (30 min): Each agent scans their domain
2. **Deep Analysis** (2-3 hours): Detailed investigation and documentation
3. **Cross-Agent Review** (30 min): Identify overlaps and contradictions
4. **Final Synthesis** (30 min): Consolidate findings and create unified report

### Special Instructions

- **Use multiple tools in parallel** when investigating different aspects
- **Focus on actionable insights** rather than just identifying problems
- **Consider the luxury beauty/fitness context** when evaluating UX and business logic
- **Prioritize security and payment-related issues** given the e-commerce nature
- **Document assumptions** and areas needing further investigation

This review should provide a complete 360-degree assessment of the repository's current state and a clear roadmap for improvements.