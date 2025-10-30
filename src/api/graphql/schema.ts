/**
 * GraphQL Schema Definition
 * Complete GraphQL schema for the beauty and fitness booking platform
 */

import { gql } from 'apollo-server-express';

export const graphqlSchema = gql`
  # Scalars
  scalar DateTime
  scalar Upload
  scalar JSON

  # Enums
  enum ServiceType {
    BEAUTY
    FITNESS
    LIFESTYLE
  }

  enum BookingStatus {
    DRAFT
    PENDING
    CONFIRMED
    CANCELLED
    COMPLETED
    NO_SHOW
    RESCHEDULED
  }

  enum PaymentStatus {
    PENDING
    PAID
    REFUNDED
    PARTIALLY_REFUNDED
    FAILED
  }

  enum LocationType {
    STUDIO
    MOBILE
    ONLINE
    SALON
  }

  enum UserRole {
    ADMIN
    STAFF
    CUSTOMER
    USER
  }

  enum SortOrder {
    ASC
    DESC
  }

  # Types
  type User {
    id: ID!
    email: String!
    role: UserRole!
    profile: UserProfile
    permissions: [String!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type UserProfile {
    fullName: String!
    phone: String
    avatar: String
    preferences: JSON
  }

  type Service {
    id: ID!
    title: String!
    description: String
    serviceType: ServiceType!
    category: String
    price: Float!
    currency: String!
    durationMinutes: Int!
    isActive: Boolean!
    images: [String!]
    tags: [String!]
    locationType: LocationType
    maxCapacity: Int
    requiresDeposit: Boolean
    depositPercentage: Float
    bufferMinutes: Int
    metadata: JSON
    content: [ServiceContent!]
    gallery: [ServiceGallery!]
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type ServiceContent {
    id: ID!
    title: String!
    content: String!
    contentType: String!
    orderIndex: Int
    serviceId: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type ServiceGallery {
    id: ID!
    imageUrl: String!
    caption: String
    isActive: Boolean!
    orderIndex: Int
    serviceId: ID!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type AvailabilitySlot {
    id: ID!
    serviceId: ID!
    date: String!
    startTime: String!
    endTime: String!
    capacity: Int
    currentBookings: Int
    isAvailable: Boolean!
    locationType: LocationType
    notes: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Booking {
    id: ID!
    serviceId: ID!
    service: Service!
    userId: ID
    user: User
    bookingDate: String!
    startTime: String!
    endTime: String!
    clientName: String!
    clientEmail: String!
    clientPhone: String
    status: BookingStatus!
    paymentStatus: PaymentStatus
    totalAmount: Float!
    currency: String!
    depositAmount: Float
    stripePaymentIntentId: String
    externalBookingId: String
    externalSource: String
    locationType: LocationType
    notes: String
    preferences: JSON
    metadata: JSON
    bookingData: JSON
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type PaymentIntent {
    id: ID!
    clientSecret: String!
    amount: Float!
    currency: String!
    status: String!
    customerId: String
    metadata: JSON
    createdAt: DateTime!
    completedAt: DateTime
  }

  type Review {
    id: ID!
    serviceId: ID!
    service: Service!
    userId: ID
    user: User
    bookingId: ID
    rating: Int!
    title: String
    content: String
    isPublic: Boolean!
    isVerified: Boolean!
    helpfulCount: Int!
    respondedAt: DateTime
    responseText: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  # Input Types
  input RegisterInput {
    email: String!
    password: String!
    fullName: String!
    phone: String
    acceptTerms: Boolean!
    acceptMarketing: Boolean
  }

  input LoginInput {
    email: String!
    password: String!
    rememberMe: Boolean
  }

  input CreateBookingInput {
    serviceId: ID!
    date: String!
    timeSlot: String!
    clientInfo: ClientInfoInput!
    notes: String
    preferences: JSON
  }

  input ClientInfoInput {
    name: String!
    email: String!
    phone: String
  }

  input UpdateBookingInput {
    notes: String
    preferences: JSON
  }

  input CancelBookingInput {
    reason: String
    refundRequested: Boolean
  }

  input RescheduleBookingInput {
    newDate: String!
    newTimeSlot: String!
    reason: String
  }

  input CreateServiceInput {
    title: String!
    description: String
    serviceType: ServiceType!
    category: String
    price: Float!
    currency: String!
    durationMinutes: Int!
    isActive: Boolean
    images: [String!]
    tags: [String!]
    locationType: LocationType
    maxCapacity: Int
    requiresDeposit: Boolean
    depositPercentage: Float
    bufferMinutes: Int
    metadata: JSON
  }

  input UpdateServiceInput {
    title: String
    description: String
    category: String
    price: Float
    currency: String
    durationMinutes: Int
    isActive: Boolean
    images: [String!]
    tags: [String!]
    locationType: LocationType
    maxCapacity: Int
    requiresDeposit: Boolean
    depositPercentage: Float
    bufferMinutes: Int
    metadata: JSON
  }

  input ServiceFilterInput {
    serviceType: ServiceType
    category: String
    isActive: Boolean
    locationType: LocationType
    minPrice: Float
    maxPrice: Float
    minDuration: Int
    maxDuration: Int
    tags: [String!]
    search: String
  }

  input BookingFilterInput {
    status: BookingStatus
    paymentStatus: PaymentStatus
    serviceType: ServiceType
    startDate: String
    endDate: String
    userId: ID
  }

  input SortInput {
    field: String!
    order: SortOrder = ASC
  }

  input PaginationInput {
    page: Int = 1
    limit: Int = 20
  }

  # Response Types
  type AuthResponse {
    success: Boolean!
    user: User
    accessToken: String!
    refreshToken: String!
    expiresIn: Int!
    message: String
  }

  type BookingResponse {
    success: Boolean!
    booking: Booking
    message: String
  }

  type ServiceResponse {
    success: Boolean!
    service: Service
    message: String
  }

  type AvailabilityResponse {
    success: Boolean!
    date: String!
    serviceId: ID!
    availableSlots: [AvailabilitySlot!]!
  }

  type PaginatedResponse {
    success: Boolean!
    data: [JSON!]!
    pagination: PaginationInfo!
  }

  type PaginationInfo {
    page: Int!
    limit: Int!
    total: Int!
    totalPages: Int!
    hasNext: Boolean!
    hasPrev: Boolean!
  }

  type AnalyticsData {
    totalBookings: Int!
    totalRevenue: Float!
    averageBookingValue: Float!
    bookingsByStatus: JSON!
    bookingsByServiceType: JSON!
    revenueByMonth: JSON!
    topServices: JSON!
    customerMetrics: JSON!
  }

  # Union Types for Error Handling
  union AuthResult = AuthResponse | Error
  union BookingResult = BookingResponse | Error
  union ServiceResult = ServiceResponse | Error

  # Queries
  type Query {
    # User queries
    me: User
    users(filter: JSON, pagination: PaginationInput, sort: SortInput): PaginatedResponse!

    # Service queries
    services(
      filter: ServiceFilterInput
      pagination: PaginationInput
      sort: SortInput
    ): PaginatedResponse!
    service(id: ID!): Service
    featuredServices(limit: Int = 6): [Service!]!
    servicesByCategory(category: String!, limit: Int = 10): [Service!]!

    # Booking queries
    bookings(
      filter: BookingFilterInput
      pagination: PaginationInput
      sort: SortInput
    ): PaginatedResponse!
    booking(id: ID!): Booking
    myBookings(
      status: BookingStatus
      pagination: PaginationInput
      sort: SortInput
    ): PaginatedResponse!

    # Availability queries
    availability(serviceId: ID!, date: String!, timezone: String = "Europe/Warsaw"): AvailabilityResponse!
    availableSlots(serviceId: ID!, startDate: String!, endDate: String!): [AvailabilitySlot!]!

    # Review queries
    reviews(serviceId: ID, pagination: PaginationInput, sort: SortInput): PaginatedResponse!
    review(id: ID!): Review
    myReviews(pagination: PaginationInput): [Review!]!

    # Analytics queries
    analytics(startDate: String!, endDate: String!, filters: JSON): AnalyticsData!
    bookingStats(serviceId: ID, startDate: String!, endDate: String!): JSON!
    revenueStats(startDate: String!, endDate: String!, groupBy: String = "day"): JSON!

    # Search queries
    searchServices(query: String!, pagination: PaginationInput): PaginatedResponse!
    searchBookings(query: String!, pagination: PaginationInput): PaginatedResponse!
  }

  # Mutations
  type Mutation {
    # Authentication mutations
    register(input: RegisterInput!): AuthResponse!
    login(input: LoginInput!): AuthResponse!
    logout: Boolean!
    refreshToken(refreshToken: String!): AuthResponse!
    changePassword(currentPassword: String!, newPassword: String!): Boolean!
    forgotPassword(email: String!): Boolean!
    resetPassword(token: String!, newPassword: String!): Boolean!
    verifyEmail(token: String!): Boolean!
    resendVerification: Boolean!

    # Profile mutations
    updateProfile(input: JSON!): User!
    updatePreferences(preferences: JSON!): Boolean!

    # Booking mutations
    createBooking(input: CreateBookingInput!): BookingResponse!
    updateBooking(id: ID!, input: UpdateBookingInput!): BookingResponse!
    cancelBooking(id: ID!, input: CancelBookingInput): BookingResponse!
    rescheduleBooking(id: ID!, input: RescheduleBookingInput!): BookingResponse!
    confirmBooking(id: ID!): BookingResponse!
    completeBooking(id: ID!): BookingResponse!

    # Service mutations (Admin/Staff only)
    createService(input: CreateServiceInput!): ServiceResponse!
    updateService(id: ID!, input: UpdateServiceInput!): ServiceResponse!
    deleteService(id: ID!): Boolean!
    activateService(id: ID!): Boolean!
    deactivateService(id: ID!): Boolean!

    # Service content mutations
    addServiceContent(serviceId: ID!, input: JSON!): ServiceContent!
    updateServiceContent(id: ID!, input: JSON!): ServiceContent!
    deleteServiceContent(id: ID!): Boolean!

    # Service gallery mutations
    addServiceImage(serviceId: ID!, image: Upload!, caption: String): ServiceGallery!
    updateServiceImage(id: ID!, caption: String): ServiceGallery!
    deleteServiceImage(id: ID!): Boolean!
    reorderServiceImages(serviceId: ID!, imageIds: [ID!]!): Boolean!

    # Availability mutations
    createAvailabilitySlots(serviceId: ID!, slots: [JSON!]!): [AvailabilitySlot!]!
    updateAvailabilitySlot(id: ID!, input: JSON!): AvailabilitySlot!
    deleteAvailabilitySlot(id: ID!): Boolean!

    # Review mutations
    createReview(serviceId: ID!, bookingId: ID, input: JSON!): Review!
    updateReview(id: ID!, input: JSON!): Review!
    deleteReview(id: ID!): Boolean!
    reportReview(id: ID!, reason: String!): Boolean!

    # Payment mutations
    createPaymentIntent(amount: Float!, currency: String!, metadata: JSON): PaymentIntent!
    confirmPayment(paymentIntentId: String!): Boolean!
    refundPayment(paymentIntentId: String!, amount: Float, reason: String): Boolean!

    # Utility mutations
    holdTimeSlot(serviceId: ID!, date: String!, timeSlot: String!): String! # Returns hold ID
    releaseHold(holdId: String!): Boolean!
    cleanupExpiredHolds: Int! # Returns number of cleaned holds
  }

  # Subscriptions
  type Subscription {
    # Booking notifications
    bookingUpdated(userId: ID): Booking!
    bookingCreated(userId: ID): Booking!
    bookingCancelled(userId: ID): Booking!

    # Availability updates
    availabilityUpdated(serviceId: ID!, date: String!): [AvailabilitySlot!]!

    # System notifications
    systemAnnouncement: String!
    maintenanceMode: Boolean!

    # Real-time updates for admin
    newBooking: Booking!
    newReview: Review!
    paymentReceived: PaymentIntent!
  }
`;