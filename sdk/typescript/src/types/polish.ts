/**
 * Polish market specific types and utilities
 */

/**
 * Polish voivodeships (województwa)
 */
export type PolishVoivodeship =
  | 'dolnośląskie'
  | 'kujawsko-pomorskie'
  | 'lubelskie'
  | 'lubuskie'
  | 'łódzkie'
  | 'małopolskie'
  | 'mazowieckie'
  | 'opolskie'
  | 'podkarpackie'
  | 'podlaskie'
  | 'pomorskie'
  | 'śląskie'
  | 'świętokrzyskie'
  | 'warmińsko-mazurskie'
  | 'wielkopolskie'
  | 'zachodniopomorskie';

/**
 * Polish voivodeship data
 */
export interface PolishVoivodeshipInfo {
  code: string;
  name: string;
  namePl: string;
  capital: string;
  capitalPl: string;
  area: number; // in km²
  population: number;
  density: number; // people per km²
  districts: string[];
  cities: string[];
}

/**
 * Polish county (powiat)
 */
export interface PolishCounty {
  code: string;
  name: string;
  namePl: string;
  voivodeship: PolishVoivodeship;
  type: 'land_county' | 'city_county' | 'urban_county';
  seat: string;
  seatPl: string;
  area: number;
  population: number;
  municipalities: PolishMunicipality[];
}

/**
 * Polish municipality (gmina)
 */
export interface PolishMunicipality {
  code: string;
  name: string;
  namePl: string;
  county: string;
  type: 'urban' | 'rural' | 'urban_rural';
  seat: string;
  seatPl: string;
  area: number;
  population: number;
}

/**
 * Polish postal code format
 */
export interface PolishPostalCode {
  code: string;
  city: string;
  cityPl: string;
  county: string;
  voivodeship: PolishVoivodeship;
  valid: boolean;
}

/**
 * Polish phone number validation
 */
export interface PolishPhoneValidation {
  number: string;
  formatted: string;
  valid: boolean;
  type: 'mobile' | 'landline' | 'toll_free' | 'premium' | 'service';
  operator?: string;
  region?: string;
  areaCode?: string;
}

/**
 * Polish company types
 */
export type PolishCompanyType =
  | 'sole_proprietorship' // Jednoosobowa działalność gospodarcza
  | 'civil_law_partnership' // Spółka cywilna
  | 'professional_partnership' // Spółka jawna
  | 'limited_partnership' // Spółka komandytowa
  | 'limited_joint_stock_partnership' // Spółka komandytowo-akcyjna
  | 'limited_liability_company' // Spółka z ograniczoną odpowiedzialnością (Sp. z o.o.)
  | 'joint_stock_company' // Spółka akcyjna (S.A.)
  | 'european_cooperative' // Spółka europejska
  | 'european_economic_interest_grouping' // Europejskie zgrupowanie interesów gospodarczych;

/**
 * Polish company information
 */
export interface PolishCompany {
  name: string;
  namePl: string;
  type: PolishCompanyType;
  typePl: string;
  nip: NIP;
  regon?: REGON;
  krs?: KRS;
  address: PolishAddress;
  contactInfo: PolishContactInfo;
  registrationDate: string;
  status: 'active' | 'inactive' | 'in_liquidation' | 'in_bankruptcy' | 'dissolved';
  vatPayer: boolean;
  vatCertificate?: string;
  euVatId?: string;
  representatives: CompanyRepresentative[];
  shareCapital?: number;
  currency: 'PLN' | 'EUR';
  pkdCodes: PKDCode[];
  employees?: number;
  website?: string;
  email?: string;
  phone?: string;
}

/**
 * Polish contact information
 */
export interface PolishContactInfo {
  email: string;
  phone?: PolishPhoneNumber;
  website?: string;
  fax?: string;
}

/**
 * Company representative
 */
export interface CompanyRepresentative {
  name: string;
  position: string;
  positionPl: string;
  appointmentDate: string;
  endDate?: string;
}

/**
 * PKD (Polish Classification of Activities) code
 */
export interface PKDCode {
  code: string;
  name: string;
  namePl: string;
  category: string;
  categoryPl: string;
  description: string;
  descriptionPl: string;
  primary: boolean;
}

/**
 * Polish tax identification number (NIP) validation
 */
export interface NIPValidation {
  nip: string;
  formatted: string;
  valid: boolean;
  company?: PolishCompanyInfo;
  checkDigit: string;
  error?: string;
}

/**
 * Polish company basic info
 */
export interface PolishCompanyInfo {
  name: string;
  address: string;
  registrationDate: string;
  status: string;
  vatPayer: boolean;
  suspensionDate?: string;
  residenceDate?: string;
}

/**
 * REGON validation
 */
export interface REGONValidation {
  regon: string;
  formatted: string;
  valid: boolean;
  type: 'short' | 'long'; // 9 or 14 digits
  checkDigits: string;
  error?: string;
}

/**
 * KRS (National Court Register) validation
 */
export interface KRSValidation {
  krs: string;
  formatted: string;
  valid: boolean;
  company?: PolishCompanyInfo;
  registrationCourt: string;
  registrationNumber: string;
  error?: string;
}

/**
 * Polish bank account validation
 */
export interface PolishBankAccountValidation {
  accountNumber: string;
  iban: string;
  formatted: string;
  valid: boolean;
  bankName?: string;
  bankCode?: string;
  checkDigits?: string;
  error?: string;
}

/**
 * Polish banks
 */
export interface PolishBank {
  code: string;
  name: string;
  namePl: string;
  shortName: string;
  shortNamePl: string;
  logoUrl?: string;
  website?: string;
  swift?: string;
  headquarters: PolishAddress;
  foundedYear?: number;
  type: 'commercial' | 'cooperative' | 'state' | 'foreign';
  services: PolishBankService[];
}

/**
 * Polish bank services
 */
export interface PolishBankService {
  service: string;
  servicePl: string;
  available: boolean;
  requiresBusinessAccount: boolean;
}

/**
 * Polish payment methods
 */
export interface PolishPaymentMethod {
  type: PolishPaymentMethodType;
  name: string;
  namePl: string;
  description: string;
  descriptionPl: string;
  iconUrl?: string;
  enabled: boolean;
  fees: PaymentFee[];
  limits: PaymentLimit[];
  supportedBanks?: string[];
  requirements?: string[];
  requirementsPl?: string[];
}

/**
 * Polish payment method types
 */
export type PolishPaymentMethodType =
  | 'blik' // BLIK instant payments
  | 'przelewy24' // Przelewy24 payment gateway
  | 'pbl' // Pay by Link (online banking)
  | 'card' // Credit/debit cards
  | 'bank_transfer' // Traditional bank transfer
  | 'installment' // Installment payments
  | 'paypo' // PayPo "buy now pay later"
  | 'twisto' // Twisto payment service
  | 'cash' // Cash payments
  | 'paypal' // PayPal (for international clients);

/**
 * Payment fee
 */
export interface PaymentFee {
  type: 'fixed' | 'percentage';
  value: number;
  currency: 'PLN' | 'EUR';
  condition?: string;
  conditionPl?: string;
}

/**
 * Payment limit
 */
export interface PaymentLimit {
  type: 'minimum' | 'maximum';
  amount: number;
  currency: 'PLN' | 'EUR';
}

/**
 * Polish invoice types
 */
export type PolishInvoiceType =
  | 'vat' // Faktura VAT
  | 'proforma' // Faktura pro forma
  | 'corrective' // Faktura korygująca
  | 'advance' // Faktura zaliczkowa
  | 'final' // Faktura końcowa
  | 'margin' // Faktura marża
  | 'internal' // Faktura wewnętrzna
  | 'not_vat' // Rachunek (dla zwolnionych z VAT);

/**
 * Polish VAT rates
 */
export type PolishVATRate =
  | 23 // Standard rate
  | 8  // Reduced rate for books, restaurant services, etc.
  | 5  // Reduced rate for certain foodstuffs, construction services, etc.
  | 0  // Zero rate for export, international transport, etc.
  | 'zw'; // VAT exempt (zwolniony)

/**
 * Polish invoice
 */
export interface PolishInvoice {
  id: string;
  number: string;
  type: PolishInvoiceType;
  typePl: string;
  status: 'draft' | 'issued' | 'sent' | 'paid' | 'overdue' | 'cancelled';

  // Dates
  issueDate: string;
  saleDate?: string;
  dueDate?: string;
  paymentDate?: string;

  // Parties
  seller: PolishCompany;
  buyer: PolishCompany | PolishIndividual;

  // Items
  items: PolishInvoiceItem[];

  // Totals
  totalNet: number;
  totalVat: number;
  totalGross: number;
  currency: 'PLN' | 'EUR';

  // Payment
  paymentMethod?: PolishPaymentMethodType;
  paymentAccount?: string;
  paidAmount?: number;

  // Additional info
  notes?: string;
  notesPl?: string;
  paymentTerms?: string;
  paymentTermsPl?: string;

  // Legal info
  taxExemptionReason?: string;
  taxExemptionReasonPl?: string;
  reverseCharge: boolean;
  splitPayment: boolean;

  // Metadata
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  downloadUrl?: string;
  corrections?: string[]; // IDs of corrective invoices
}

/**
 * Polish individual person (for invoices)
 */
export interface PolishIndividual {
  firstName: string;
  lastName: string;
  address: PolishAddress;
  pesel?: PESEL;
  nip?: NIP;
  email?: string;
  phone?: PolishPhoneNumber;
}

/**
 * Polish invoice item
 */
export interface PolishInvoiceItem {
  name: string;
  namePl?: string;
  description?: string;
  descriptionPl?: string;
  pkdCode?: string;
  quantity: number;
  unit: string;
  unitPl: string;
  unitPriceNet: number;
  unitPriceGross: number;
  totalNet: number;
  totalGross: number;
  vatRate: PolishVATRate;
  vatAmount: number;
  discount?: number;
  discountType?: 'percentage' | 'fixed';
}

/**
 * Polish holidays
 */
export interface PolishHoliday {
  date: string;
  name: string;
  namePl: string;
  type: 'public' | 'observance' | 'religious';
  national: boolean;
  workday: boolean;
}

/**
 * Polish business hours
 */
export interface PolishBusinessHours {
  monday: DayBusinessHours;
  tuesday: DayBusinessHours;
  wednesday: DayBusinessHours;
  thursday: DayBusinessHours;
  friday: DayBusinessHours;
  saturday: DayBusinessHours;
  sunday: DayBusinessHours;
  holidays: PolishHolidaySchedule[];
  specialDays: SpecialBusinessDay[];
}

/**
 * Day business hours
 */
export interface DayBusinessHours {
  isOpen: boolean;
  openTime?: string;
  closeTime?: string;
  breakStart?: string;
  breakEnd?: string;
  appointmentsOnly?: boolean;
  specialConditions?: string[];
  specialConditionsPl?: string[];
}

/**
 * Polish holiday schedule
 */
export interface PolishHolidaySchedule {
  holiday: string;
  isClosed: boolean;
  specialHours?: DayBusinessHours;
  requireAdvanceBooking?: boolean;
  minimumAdvanceHours?: number;
}

/**
 * Special business day
 */
export interface SpecialBusinessDay {
  date: string;
  name: string;
  namePl: string;
  businessHours: DayBusinessHours;
  priceAdjustment?: PriceAdjustment;
}

/**
 * Price adjustment
 */
export interface PriceAdjustment {
  type: 'percentage' | 'fixed';
  value: number;
  reason?: string;
  reasonPl?: string;
}

/**
 * Polish business regulations
 */
export interface PolishBusinessRegulations {
  act?: string;
  actPl?: string;
  regulations: BusinessRegulation[];
  licenses: BusinessLicense[];
  permits: BusinessPermit[];
  certifications: BusinessCertification[];
}

/**
 * Business regulation
 */
export interface BusinessRegulation {
  name: string;
  namePl: string;
  description: string;
  descriptionPl: string;
  applicable: boolean;
  authority: string;
  authorityPl: string;
  url?: string;
  lastUpdated: string;
}

/**
 * Business license
 */
export interface BusinessLicense {
  name: string;
  namePl: string;
  number?: string;
  issuedBy: string;
  issuedByPl: string;
  issueDate: string;
  expiryDate?: string;
  status: 'active' | 'expired' | 'suspended' | 'revoked';
  documentUrl?: string;
}

/**
 * Business permit
 */
export interface BusinessPermit {
  name: string;
  namePl: string;
  number: string;
  type: string;
  typePl: string;
  issuedBy: string;
  issuedByPl: string;
  issueDate: string;
  expiryDate?: string;
  status: 'active' | 'expired' | 'suspended' | 'revoked';
  documentUrl?: string;
}

/**
 * Business certification
 */
export interface BusinessCertification {
  name: string;
  namePl: string;
  certificationBody: string;
  certificationBodyPl: string;
  certificationNumber?: string;
  issueDate: string;
  expiryDate?: string;
  status: 'active' | 'expired' | 'suspended' | 'revoked';
  scope?: string;
  scopePl?: string;
  documentUrl?: string;
}

/**
 * Polish consumer rights
 */
export interface PolishConsumerRights {
  rightToWithdrawal: boolean;
  withdrawalPeriod: number; // in days
  rightToComplaint: boolean;
  complaintPeriod: number; // in days
  rightToRepair: boolean;
  repairPeriod: number; // in days
  rightToReplacement: boolean;
  specialConditions?: string[];
  specialConditionsPl?: string[];
}

/**
 * Polish data protection (GDPR/RODO)
 */
export interface PolishDataProtection {
  dataController: string;
  dataControllerPl: string;
  legalBasis: string[];
  legalBasisPl: string[];
  dataProcessingPurposes: string[];
  dataProcessingPurposesPl: string[];
  dataRetentionPeriod: string;
  dataRetentionPeriodPl: string;
  dataSubjectRights: string[];
  dataSubjectRightsPl: string[];
  gdpoContact: GDPRContact;
  internationalTransfers: boolean;
  securityMeasures: string[];
  securityMeasuresPl: string[];
}

/**
 * GDPR contact information
 */
export interface GDPRContact {
  name: string;
  email: string;
  phone?: PolishPhoneNumber;
  address: PolishAddress;
}

/**
 * Polish market analytics
 */
export interface PolishMarketAnalytics {
  totalPolishUsers: number;
  polishLanguageUsage: number;
  plnTransactions: number;
  polishPaymentMethodsUsage: Record<PolishPaymentMethodType, number>;
  polishBusinessAccounts: number;
  verifiedPolishBusinesses: number;
  polishRegions: Record<PolishVoivodeship, PolishRegionStats>;
  polishBusinessTypes: Record<PolishCompanyType, number>;
  polishComplianceRate: number;
  averagePolishTransactionValue: number;
  polishCustomerSatisfaction: number;
}

/**
 * Polish region statistics
 */
export interface PolishRegionStats {
  users: number;
  businesses: number;
  transactions: number;
  revenue: number;
  averageTransactionValue: number;
  growthRate: number;
}

/**
 * Type aliases for Polish identifiers
 */
export type NIP = string; // 10 digits, format: XXX-XXX-XX-XX
export type REGON = string; // 9 or 14 digits
export type KRS = string; // 10 digits
export type PESEL = string; // 11 digits
export type PolishPhoneNumber = string;
export type PolishPostalCode = string; // Format: XX-XXX

/**
 * Polish validation utilities
 */
export interface PolishValidationUtils {
  /**
   * Validate NIP (Tax Identification Number)
   */
  validateNIP(nip: string): NIPValidation;

  /**
   * Validate REGON (Statistical Identification Number)
   */
  validateREGON(regon: string): REGONValidation;

  /**
   * Validate KRS (National Court Register)
   */
  validateKRS(krs: string): KRSValidation;

  /**
   * Validate PESEL (Universal Electronic System for Registration)
   */
  validatePESEL(pesel: string): PESELValidation;

  /**
   * Validate Polish postal code
   */
  validatePostalCode(postalCode: string): PolishPostalCodeValidation;

  /**
   * Validate Polish phone number
   */
  validatePhoneNumber(phoneNumber: string): PolishPhoneValidation;

  /**
   * Validate Polish bank account
   */
  validateBankAccount(accountNumber: string): PolishBankAccountValidation;

  /**
   * Format NIP with dashes
   */
  formatNIP(nip: string): string;

  /**
   * Format Polish phone number
   */
  formatPhoneNumber(phoneNumber: string): string;

  /**
   * Format Polish postal code
   */
  formatPostalCode(postalCode: string): string;
}

/**
 * PESEL validation
 */
export interface PESELValidation {
  pesel: string;
  valid: boolean;
  birthDate: string;
  gender: 'male' | 'female';
  checkDigit: string;
  error?: string;
}

/**
 * Polish postal code validation
 */
export interface PolishPostalCodeValidation {
  postalCode: string;
  formatted: string;
  valid: boolean;
  city?: string;
  cityPl?: string;
  error?: string;
}