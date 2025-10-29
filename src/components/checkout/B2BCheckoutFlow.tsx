// B2B Company Checkout Flow
// Enhanced checkout for business customers with VAT compliance features

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, User, CreditCard, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useNIPValidation, NIPUtils } from '@/lib/vat/nip-validation';
import { useVATCalculator } from '@/lib/vat/vat-calculator';
import { useInvoiceGenerator } from '@/lib/invoice/invoice-generator';

export interface B2BCheckoutData {
  customerType: 'person' | 'company_polish' | 'company_eu' | 'company_non_eu';

  // Personal information
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };

  // Company information
  companyInfo: {
    companyName: string;
    nipNumber: string;
    regonNumber?: string;
    krsNumber?: string;
    industry?: string;
    website?: string;
  };

  // Address information
  billingAddress: {
    street: string;
    buildingNumber: string;
    apartmentNumber?: string;
    city: string;
    postalCode: string;
    country: string;
  };

  // Shipping/different address
  differentShippingAddress: boolean;
  shippingAddress?: {
    street: string;
    buildingNumber: string;
    apartmentNumber?: string;
    city: string;
    postalCode: string;
    country: string;
  };

  // Invoice preferences
  invoicePreferences: {
    invoiceType: 'faktura' | 'faktura_proforma';
    paymentTerms: number; // days
    requiresProforma: boolean;
    electronicInvoice: boolean;
    splitPayment: boolean;
  };

  // Additional information
  additionalInfo?: {
    notes?: string;
    referenceNumber?: string;
    department?: string;
    costCenter?: string;
  };

  // Agreements
  agreements: {
    termsAccepted: boolean;
    privacyAccepted: boolean;
    electronicInvoicesAccepted: boolean;
    dataProcessingAccepted: boolean;
  };
}

interface B2BCheckoutFlowProps {
  service: {
    id: string;
    title: string;
    priceFrom: number;
    durationMinutes: number;
    serviceType: 'beauty' | 'fitness' | 'lifestyle';
    serviceCategory: string;
  };
  bookingData: {
    date: Date;
    time: string;
    clientName?: string;
    clientEmail?: string;
    clientPhone?: string;
  };
  onComplete: (data: B2BCheckoutData) => void;
  onBack?: () => void;
  className?: string;
}

export const B2BCheckoutFlow: React.FC<B2BCheckoutFlowProps> = ({
  service,
  bookingData,
  onComplete,
  onBack,
  className
}) => {
  const { t } = useTranslation();
  const { validateNIP, validateAndFormatNIP, isValidFormat } = useNIPValidation();
  const { calculateVAT } = useVATCalculator();
  const { generateInvoice } = useInvoiceGenerator();

  // State management
  const [currentStep, setCurrentStep] = useState(1);
  const [checkoutData, setCheckoutData] = useState<B2BCheckoutData>({
    customerType: 'company_polish',
    personalInfo: {
      firstName: '',
      lastName: '',
      email: bookingData.clientEmail || '',
      phone: bookingData.clientPhone || ''
    },
    companyInfo: {
      companyName: '',
      nipNumber: ''
    },
    billingAddress: {
      street: '',
      buildingNumber: '',
      city: '',
      postalCode: '',
      country: 'Polska'
    },
    differentShippingAddress: false,
    invoicePreferences: {
      invoiceType: 'faktura',
      paymentTerms: 14,
      requiresProforma: false,
      electronicInvoice: true,
      splitPayment: false
    },
    agreements: {
      termsAccepted: false,
      privacyAccepted: false,
      electronicInvoicesAccepted: true,
      dataProcessingAccepted: false
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [nipValidation, setNipValidation] = useState<any>(null);
  const [vatCalculation, setVatCalculation] = useState<any>(null);

  const totalSteps = 5;

  // Calculate VAT when company info changes
  useEffect(() => {
    if (checkoutData.companyInfo.nipNumber && checkoutData.customerType) {
      calculateVATForService();
    }
  }, [checkoutData.companyInfo.nipNumber, checkoutData.customerType, service]);

  // Validate NIP when it changes
  useEffect(() => {
    if (checkoutData.companyInfo.nipNumber && isValidFormat(checkoutData.companyInfo.nipNumber)) {
      validateNIPNumber();
    }
  }, [checkoutData.companyInfo.nipNumber]);

  const validateNIPNumber = async () => {
    try {
      const validation = await validateAndFormatNIP(checkoutData.companyInfo.nipNumber);
      setNipValidation(validation);

      if (!validation.validation.isValid) {
        setErrors(prev => ({
          ...prev,
          nipNumber: 'Numer NIP jest nieprawidłowy'
        }));
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.nipNumber;
          return newErrors;
        });
      }
    } catch (error) {
      console.error('NIP validation failed:', error);
    }
  };

  const calculateVATForService = async () => {
    try {
      const calculation = await calculateVAT({
        amount: service.priceFrom,
        serviceType: service.serviceType,
        serviceCategory: service.serviceCategory,
        customerType: checkoutData.customerType,
        customerCountry: checkoutData.customerType.includes('eu') ?
          checkoutData.billingAddress.country : 'Polska'
      });

      setVatCalculation(calculation);
    } catch (error) {
      console.error('VAT calculation failed:', error);
    }
  };

  const updateCheckoutData = (section: keyof B2BCheckoutData, data: any) => {
    setCheckoutData(prev => ({
      ...prev,
      [section]: { ...prev[section], ...data }
    }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1: // Customer type and personal info
        if (!checkoutData.personalInfo.firstName) {
          newErrors.firstName = 'Imię jest wymagane';
        }
        if (!checkoutData.personalInfo.lastName) {
          newErrors.lastName = 'Nazwisko jest wymagane';
        }
        if (!checkoutData.personalInfo.email) {
          newErrors.email = 'Email jest wymagany';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(checkoutData.personalInfo.email)) {
          newErrors.email = 'Nieprawidłowy format email';
        }
        if (!checkoutData.personalInfo.phone) {
          newErrors.phone = 'Telefon jest wymagany';
        }
        break;

      case 2: // Company information
        if (!checkoutData.companyInfo.companyName) {
          newErrors.companyName = 'Nazwa firmy jest wymagana';
        }
        if (checkoutData.customerType !== 'person') {
          if (!checkoutData.companyInfo.nipNumber) {
            newErrors.nipNumber = 'Numer NIP jest wymagany';
          } else if (!isValidFormat(checkoutData.companyInfo.nipNumber)) {
            newErrors.nipNumber = 'Nieprawidłowy format numeru NIP';
          } else if (nipValidation && !nipValidation.validation.isValid) {
            newErrors.nipNumber = 'Numer NIP jest nieprawidłowy';
          }
        }
        break;

      case 3: // Address information
        if (!checkoutData.billingAddress.street) {
          newErrors.street = 'Ulica jest wymagana';
        }
        if (!checkoutData.billingAddress.buildingNumber) {
          newErrors.buildingNumber = 'Numer budynku jest wymagany';
        }
        if (!checkoutData.billingAddress.city) {
          newErrors.city = 'Miasto jest wymagane';
        }
        if (!checkoutData.billingAddress.postalCode) {
          newErrors.postalCode = 'Kod pocztowy jest wymagany';
        } else if (!/^\d{2}-\d{3}$/.test(checkoutData.billingAddress.postalCode)) {
          newErrors.postalCode = 'Nieprawidłowy format kodu pocztowego (XX-XXX)';
        }
        break;

      case 4: // Invoice preferences
        if (!checkoutData.invoicePreferences.invoiceType) {
          newErrors.invoiceType = 'Typ faktury jest wymagany';
        }
        break;

      case 5: // Agreements
        if (!checkoutData.agreements.termsAccepted) {
          newErrors.termsAccepted = 'Akceptacja regulaminu jest wymagana';
        }
        if (!checkoutData.agreements.privacyAccepted) {
          newErrors.privacyAccepted = 'Akceptacja polityki prywatności jest wymagana';
        }
        if (checkoutData.invoicePreferences.electronicInvoice &&
            !checkoutData.agreements.electronicInvoicesAccepted) {
          newErrors.electronicInvoicesAccepted = 'Zgoda na faktury elektroniczne jest wymagana';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < totalSteps) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    setIsProcessing(true);

    try {
      // Generate invoice
      const invoiceData = {
        invoiceType: checkoutData.invoicePreferences.invoiceType,
        issueDate: new Date(),
        saleDate: bookingData.date,
        dueDate: new Date(bookingData.date.getTime() + checkoutData.invoicePreferences.paymentTerms * 24 * 60 * 60 * 1000),
        customerType: checkoutData.customerType,
        customerName: checkoutData.customerType === 'person'
          ? `${checkoutData.personalInfo.firstName} ${checkoutData.personalInfo.lastName}`
          : checkoutData.companyInfo.companyName,
        customerAddress: {
          street: checkoutData.billingAddress.street,
          buildingNumber: checkoutData.billingAddress.buildingNumber,
          apartmentNumber: checkoutData.billingAddress.apartmentNumber,
          city: checkoutData.billingAddress.city,
          postalCode: checkoutData.billingAddress.postalCode,
          country: checkoutData.billingAddress.country
        },
        customerNIP: checkoutData.companyInfo.nipNumber,
        customerEmail: checkoutData.personalInfo.email,
        customerPhone: checkoutData.personalInfo.phone,
        items: [{
          name: service.title,
          description: `${service.serviceType === 'beauty' ? 'Zabieg' : 'Trening'} - ${service.title}`,
          quantity: 1,
          unit: 'szt.',
          unitPrice: service.priceFrom,
          vatRate: vatCalculation?.vatRate || '23',
          vatAmount: vatCalculation?.vatAmount || (service.priceFrom * 0.23),
          totalAmount: vatCalculation?.grossTotal || (service.priceFrom * 1.23),
          serviceType: service.serviceType,
          pkwiuCode: '96.02.Z' // Beauty treatment code
        }],
        paymentMethod: 'transfer',
        paymentStatus: 'unpaid',
        currency: 'PLN',
        reverseCharge: vatCalculation?.isReverseCharge,
        splitPayment: checkoutData.invoicePreferences.splitPayment,
        exemptFromVAT: vatCalculation?.isExempt,
        notes: checkoutData.additionalInfo?.notes,
        legalBasis: vatCalculation?.legalBasis
      };

      const invoice = await generateInvoice(invoiceData);

      onComplete(checkoutData);
    } catch (error) {
      console.error('Checkout failed:', error);
      setErrors(prev => ({
        ...prev,
        submit: 'Wystąpił błąd podczas przetwarzania zamówienia'
      }));
    } finally {
      setIsProcessing(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <CustomerTypeStep />;
      case 2:
        return <CompanyInfoStep />;
      case 3:
        return <AddressStep />;
      case 4:
        return <InvoicePreferencesStep />;
      case 5:
        return <AgreementsStep />;
      default:
        return null;
    }
  };

  const CustomerTypeStep = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium">Typ klienta</Label>
        <Select
          value={checkoutData.customerType}
          onValueChange={(value) => updateCheckoutData('customerType', { customerType: value })}
        >
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="Wybierz typ klienta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="person">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Osoba prywatna
              </div>
            </SelectItem>
            <SelectItem value="company_polish">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Firma polska
              </div>
            </SelectItem>
            <SelectItem value="company_eu">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Firma z UE
              </div>
            </SelectItem>
            <SelectItem value="company_non_eu">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Firma spoza UE
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">Imię *</Label>
          <Input
            id="firstName"
            value={checkoutData.personalInfo.firstName}
            onChange={(e) => updateCheckoutData('personalInfo', { firstName: e.target.value })}
            className={errors.firstName ? 'border-red-500' : ''}
          />
          {errors.firstName && <p className="text-sm text-red-500 mt-1">{errors.firstName}</p>}
        </div>

        <div>
          <Label htmlFor="lastName">Nazwisko *</Label>
          <Input
            id="lastName"
            value={checkoutData.personalInfo.lastName}
            onChange={(e) => updateCheckoutData('personalInfo', { lastName: e.target.value })}
            className={errors.lastName ? 'border-red-500' : ''}
          />
          {errors.lastName && <p className="text-sm text-red-500 mt-1">{errors.lastName}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={checkoutData.personalInfo.email}
            onChange={(e) => updateCheckoutData('personalInfo', { email: e.target.value })}
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
        </div>

        <div>
          <Label htmlFor="phone">Telefon *</Label>
          <Input
            id="phone"
            type="tel"
            value={checkoutData.personalInfo.phone}
            onChange={(e) => updateCheckoutData('personalInfo', { phone: e.target.value })}
            className={errors.phone ? 'border-red-500' : ''}
          />
          {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
        </div>
      </div>
    </div>
  );

  const CompanyInfoStep = () => (
    <div className="space-y-6">
      {checkoutData.customerType !== 'person' && (
        <>
          <div>
            <Label htmlFor="companyName">Nazwa firmy *</Label>
            <Input
              id="companyName"
              value={checkoutData.companyInfo.companyName}
              onChange={(e) => updateCheckoutData('companyInfo', { companyName: e.target.value })}
              className={errors.companyName ? 'border-red-500' : ''}
            />
            {errors.companyName && <p className="text-sm text-red-500 mt-1">{errors.companyName}</p>}
          </div>

          <div>
            <Label htmlFor="nipNumber">Numer NIP *</Label>
            <Input
              id="nipNumber"
              value={checkoutData.companyInfo.nipNumber}
              onChange={(e) => updateCheckoutData('companyInfo', { nipNumber: e.target.value })}
              placeholder="Format: 123-456-78-90"
              className={errors.nipNumber ? 'border-red-500' : ''}
            />
            {errors.nipNumber && <p className="text-sm text-red-500 mt-1">{errors.nipNumber}</p>}

            {nipValidation && (
              <div className={cn(
                "flex items-center gap-2 mt-2 p-2 rounded-md text-sm",
                nipValidation.validation.isValid ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
              )}>
                {nipValidation.validation.isValid ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <AlertCircle className="w-4 h-4" />
                )}
                <span>
                  {nipValidation.validation.isValid
                    ? `NIP jest poprawny${nipValidation.validation.companyName ? ` - ${nipValidation.validation.companyName}` : ''}`
                    : 'NIP jest nieprawidłowy'
                  }
                </span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="regonNumber">Numer REGON</Label>
              <Input
                id="regonNumber"
                value={checkoutData.companyInfo.regonNumber || ''}
                onChange={(e) => updateCheckoutData('companyInfo', { regonNumber: e.target.value })}
                placeholder="Opcjonalnie"
              />
            </div>

            <div>
              <Label htmlFor="krsNumber">Numer KRS</Label>
              <Input
                id="krsNumber"
                value={checkoutData.companyInfo.krsNumber || ''}
                onChange={(e) => updateCheckoutData('companyInfo', { krsNumber: e.target.value })}
                placeholder="Opcjonalnie"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="industry">Branża</Label>
              <Select
                value={checkoutData.companyInfo.industry || ''}
                onValueChange={(value) => updateCheckoutData('companyInfo', { industry: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz branżę" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="it">IT / Technologia</SelectItem>
                  <SelectItem value="finance">Finanse / Bankowość</SelectItem>
                  <SelectItem value="consulting">Konsulting</SelectItem>
                  <SelectItem value="healthcare">Opieka zdrowotna</SelectItem>
                  <SelectItem value="education">Edukacja</SelectItem>
                  <SelectItem value="retail">Handel detaliczny</SelectItem>
                  <SelectItem value="manufacturing">Produkcja</SelectItem>
                  <SelectItem value="other">Inna</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="website">Strona internetowa</Label>
              <Input
                id="website"
                value={checkoutData.companyInfo.website || ''}
                onChange={(e) => updateCheckoutData('companyInfo', { website: e.target.value })}
                placeholder="https://www.przyklad.pl"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );

  const AddressStep = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Adres rozliczeniowy</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="street">Ulica *</Label>
          <Input
            id="street"
            value={checkoutData.billingAddress.street}
            onChange={(e) => updateCheckoutData('billingAddress', { street: e.target.value })}
            className={errors.street ? 'border-red-500' : ''}
          />
          {errors.street && <p className="text-sm text-red-500 mt-1">{errors.street}</p>}
        </div>

        <div>
          <Label htmlFor="buildingNumber">Numer budynku *</Label>
          <Input
            id="buildingNumber"
            value={checkoutData.billingAddress.buildingNumber}
            onChange={(e) => updateCheckoutData('billingAddress', { buildingNumber: e.target.value })}
            className={errors.buildingNumber ? 'border-red-500' : ''}
          />
          {errors.buildingNumber && <p className="text-sm text-red-500 mt-1">{errors.buildingNumber}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="apartmentNumber">Numer lokalu</Label>
          <Input
            id="apartmentNumber"
            value={checkoutData.billingAddress.apartmentNumber || ''}
            onChange={(e) => updateCheckoutData('billingAddress', { apartmentNumber: e.target.value })}
            placeholder="Opcjonalnie"
          />
        </div>

        <div>
          <Label htmlFor="postalCode">Kod pocztowy *</Label>
          <Input
            id="postalCode"
            value={checkoutData.billingAddress.postalCode}
            onChange={(e) => updateCheckoutData('billingAddress', { postalCode: e.target.value })}
            placeholder="00-001"
            className={errors.postalCode ? 'border-red-500' : ''}
          />
          {errors.postalCode && <p className="text-sm text-red-500 mt-1">{errors.postalCode}</p>}
        </div>

        <div>
          <Label htmlFor="city">Miasto *</Label>
          <Input
            id="city"
            value={checkoutData.billingAddress.city}
            onChange={(e) => updateCheckoutData('billingAddress', { city: e.target.value })}
            className={errors.city ? 'border-red-500' : ''}
          />
          {errors.city && <p className="text-sm text-red-500 mt-1">{errors.city}</p>}
        </div>
      </div>

      <div>
        <Label htmlFor="country">Kraj *</Label>
        <Select
          value={checkoutData.billingAddress.country}
          onValueChange={(value) => updateCheckoutData('billingAddress', { country: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Polska">Polska</SelectItem>
            <SelectItem value="Niemcy">Niemcy</SelectItem>
            <SelectItem value="Czechy">Czechy</SelectItem>
            <SelectItem value="Słowacja">Słowacja</SelectItem>
            <SelectItem value="Wielka Brytania">Wielka Brytania</SelectItem>
            <SelectItem value="Francja">Francja</SelectItem>
            <SelectItem value="Włochy">Włochy</SelectItem>
            <SelectItem value="Hiszpania">Hiszpania</SelectItem>
            <SelectItem value="Inny">Inny</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="differentShippingAddress"
            checked={checkoutData.differentShippingAddress}
            onCheckedChange={(checked) =>
              updateCheckoutData('differentShippingAddress', { differentShippingAddress: checked })
            }
          />
          <Label htmlFor="differentShippingAddress">
            Inny adres dostawy
          </Label>
        </div>

        {checkoutData.differentShippingAddress && (
          <div className="pl-6 space-y-4 p-4 bg-gray-50 rounded-lg">
            {/* Shipping address fields would go here */}
            <p className="text-sm text-gray-600">Formularz adresu dostawy</p>
          </div>
        )}
      </div>
    </div>
  );

  const InvoicePreferencesStep = () => (
    <div className="space-y-6">
      <div>
        <Label className="text-base font-medium">Preferencje faktury</Label>
        <Select
          value={checkoutData.invoicePreferences.invoiceType}
          onValueChange={(value) => updateCheckoutData('invoicePreferences', {
            invoiceType: value as 'faktura' | 'faktura_proforma'
          })}
        >
          <SelectTrigger className="mt-2">
            <SelectValue placeholder="Wybierz typ faktury" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="faktura">Faktura VAT</SelectItem>
            <SelectItem value="faktura_proforma">Faktura pro forma</SelectItem>
          </SelectContent>
        </Select>
        {errors.invoiceType && <p className="text-sm text-red-500 mt-1">{errors.invoiceType}</p>}
      </div>

      <div>
        <Label htmlFor="paymentTerms">Termin płatności (dni)</Label>
        <Select
          value={checkoutData.invoicePreferences.paymentTerms.toString()}
          onValueChange={(value) => updateCheckoutData('invoicePreferences', {
            paymentTerms: parseInt(value)
          })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">Płatność przy odbiorze</SelectItem>
            <SelectItem value="7">7 dni</SelectItem>
            <SelectItem value="14">14 dni</SelectItem>
            <SelectItem value="21">21 dni</SelectItem>
            <SelectItem value="30">30 dni</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="electronicInvoice"
            checked={checkoutData.invoicePreferences.electronicInvoice}
            onCheckedChange={(checked) =>
              updateCheckoutData('invoicePreferences', { electronicInvoice: checked })
            }
          />
          <Label htmlFor="electronicInvoice">
            Faktura elektroniczna (PDF)
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="requiresProforma"
            checked={checkoutData.invoicePreferences.requiresProforma}
            onCheckedChange={(checked) =>
              updateCheckoutData('invoicePreferences', { requiresProforma: checked })
            }
          />
          <Label htmlFor="requiresProforma">
            Wymagaj faktury pro forma
          </Label>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox
            id="splitPayment"
            checked={checkoutData.invoicePreferences.splitPayment}
            onCheckedChange={(checked) =>
              updateCheckoutData('invoicePreferences', { splitPayment: checked })
            }
          />
          <Label htmlFor="splitPayment">
            Mechanizm podzielonej płatności (MPP)
          </Label>
        </div>
      </div>

      {vatCalculation && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Podsumowanie VAT</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>Kwota netto:</span>
              <span>{vatCalculation.netAmount.toFixed(2)} PLN</span>
            </div>
            <div className="flex justify-between">
              <span>Stawka VAT:</span>
              <span>{vatCalculation.vatRate}%</span>
            </div>
            <div className="flex justify-between">
              <span>Kwota VAT:</span>
              <span>{vatCalculation.vatAmount.toFixed(2)} PLN</span>
            </div>
            <div className="flex justify-between">
              <span>Kwota brutto:</span>
              <span className="font-semibold">{vatCalculation.grossAmount.toFixed(2)} PLN</span>
            </div>

            {vatCalculation.notes && vatCalculation.notes.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900">Informacje VAT:</p>
                <ul className="text-sm text-blue-800 mt-1 space-y-1">
                  {vatCalculation.notes.map((note: string, index: number) => (
                    <li key={index}>• {note}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );

  const AgreementsStep = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Zgody i oświadczenia</h3>

      <div className="space-y-4">
        <div className="flex items-start space-x-3">
          <Checkbox
            id="termsAccepted"
            checked={checkoutData.agreements.termsAccepted}
            onCheckedChange={(checked) =>
              updateCheckoutData('agreements', { termsAccepted: checked })
            }
            className="mt-1"
          />
          <Label htmlFor="termsAccepted" className="text-sm leading-relaxed">
            Oświadczam, że zapoznałem/am się z
            <a href="/regulamin" target="_blank" className="text-blue-600 hover:underline ml-1">
              regulaminem
            </a>
            {' '}i akceptuję jego warunki *
          </Label>
        </div>
        {errors.termsAccepted && <p className="text-sm text-red-500">{errors.termsAccepted}</p>}

        <div className="flex items-start space-x-3">
          <Checkbox
            id="privacyAccepted"
            checked={checkoutData.agreements.privacyAccepted}
            onCheckedChange={(checked) =>
              updateCheckoutData('agreements', { privacyAccepted: checked })
            }
            className="mt-1"
          />
          <Label htmlFor="privacyAccepted" className="text-sm leading-relaxed">
            Oświadczam, że zapoznałem/am się z
            <a href="/polityka-prywatnosci" target="_blank" className="text-blue-600 hover:underline ml-1">
              polityką prywatności
            </a>
            {' '}i wyrażam zgodę na przetwarzanie moich danych osobowych *
          </Label>
        </div>
        {errors.privacyAccepted && <p className="text-sm text-red-500">{errors.privacyAccepted}</p>}

        {checkoutData.invoicePreferences.electronicInvoice && (
          <div className="flex items-start space-x-3">
            <Checkbox
              id="electronicInvoicesAccepted"
              checked={checkoutData.agreements.electronicInvoicesAccepted}
              onCheckedChange={(checked) =>
                updateCheckoutData('agreements', { electronicInvoicesAccepted: checked })
              }
              className="mt-1"
            />
            <Label htmlFor="electronicInvoicesAccepted" className="text-sm leading-relaxed">
              Wyrażam zgodę na otrzymywanie faktur w formie elektronicznej *
            </Label>
          </div>
        )}
        {errors.electronicInvoicesAccepted && <p className="text-sm text-red-500">{errors.electronicInvoicesAccepted}</p>}

        <div className="flex items-start space-x-3">
          <Checkbox
            id="dataProcessingAccepted"
            checked={checkoutData.agreements.dataProcessingAccepted}
            onCheckedChange={(checked) =>
              updateCheckoutData('agreements', { dataProcessingAccepted: checked })
            }
            className="mt-1"
          />
          <Label htmlFor="dataProcessingAccepted" className="text-sm leading-relaxed">
            Wyrażam zgodę na przetwarzanie moich danych w celach marketingowych i handlowych
          </Label>
        </div>
      </div>

      {/* Additional information */}
      <div>
        <Label htmlFor="notes">Dodatkowe uwagi (opcjonalnie)</Label>
        <Textarea
          id="notes"
          value={checkoutData.additionalInfo?.notes || ''}
          onChange={(e) => updateCheckoutData('additionalInfo', { notes: e.target.value })}
          placeholder="Wprowadź dodatkowe informacje lub uwagi..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="referenceNumber">Numer referencyjny</Label>
          <Input
            id="referenceNumber"
            value={checkoutData.additionalInfo?.referenceNumber || ''}
            onChange={(e) => updateCheckoutData('additionalInfo', { referenceNumber: e.target.value })}
            placeholder="Numer zamówienia, projekt itp."
          />
        </div>

        <div>
          <Label htmlFor="department">Dział</Label>
          <Input
            id="department"
            value={checkoutData.additionalInfo?.department || ''}
            onChange={(e) => updateCheckoutData('additionalInfo', { department: e.target.value })}
            placeholder="Dział w firmie"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className={cn("w-full max-w-4xl mx-auto", className)}>
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-700">
            Krok {currentStep} z {totalSteps}
          </span>
          <span className="text-sm text-gray-500">
            {Math.round((currentStep / totalSteps) * 100)}% zakończone
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Step titles */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {currentStep === 1 && 'Dane klienta'}
          {currentStep === 2 && 'Informacje o firmie'}
          {currentStep === 3 && 'Adres'}
          {currentStep === 4 && 'Preferencje faktury'}
          {currentStep === 5 && 'Zgody i oświadczenia'}
        </h2>
      </div>

      {/* Form content */}
      <Card>
        <CardContent className="p-6">
          {renderStep()}
        </CardContent>
      </Card>

      {/* Error display */}
      {errors.submit && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <span>{errors.submit}</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <div>
          {currentStep > 1 && (
            <Button
              variant="outline"
              onClick={handlePrevStep}
              disabled={isProcessing}
            >
              Wstecz
            </Button>
          )}
          {currentStep === 1 && onBack && (
            <Button
              variant="outline"
              onClick={onBack}
              disabled={isProcessing}
            >
              Anuluj
            </Button>
          )}
        </div>

        <div>
          {currentStep < totalSteps && (
            <Button
              onClick={handleNextStep}
              disabled={isProcessing}
            >
              Dalej
            </Button>
          )}

          {currentStep === totalSteps && (
            <Button
              onClick={handleSubmit}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Przetwarzanie...
                </>
              ) : (
                'Złóż zamówienie'
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};