// Enhanced Payment Step with Polish VAT Compliance and Deposit System
// Integrates all compliance features and deposit calculations into the booking flow

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CreditCard, Building2, User, FileText, CheckCircle, AlertCircle, Loader2, Info, Receipt, Shield, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCurrency } from '@/contexts/CurrencyContext';

// Import our services
import { useNIPValidation, NIPUtils } from '@/lib/vat/nip-validation';
import { useVATCalculator, VATUtils } from '@/lib/vat/vat-calculator';
import { useInvoiceGenerator } from '@/lib/invoice/invoice-generator';
import { depositService, DepositCalculation } from '@/services/depositService';

interface Service {
  id: string;
  title: string;
  price_from?: number;
  duration_minutes?: number;
  serviceType: 'beauty' | 'fitness' | 'lifestyle';
  serviceCategory?: string;
}

interface Step4CompliantProps {
  service: Service;
  date: Date;
  time: string;
  fullName: string;
  email: string;
  phone: string;
  onComplete: (data: {
    paymentMethod: 'card' | 'cash' | 'transfer';
    stripePaymentIntentId?: string;
    invoiceData?: any;
    complianceData?: any;
    depositData?: {
      required: boolean;
      amount: number;
      calculation: DepositCalculation;
      transactionId?: string;
    };
  }) => void;
  onBack?: () => void;
}

type CustomerType = 'person' | 'company_polish' | 'company_eu' | 'company_non_eu';
type InvoiceType = 'receipt' | 'faktura';

export const Step4PaymentCompliant: React.FC<Step4CompliantProps> = ({
  service,
  date,
  time,
  fullName,
  email,
  phone,
  onComplete,
  onBack,
}) => {
  const { t } = useTranslation();
  const { convertPrice, formatPrice } = useCurrency();
  const { validateNIP, validateAndFormatNIP, formatNIP } = useNIPValidation();
  const { calculateVAT } = useVATCalculator();
  const { generateInvoice } = useInvoiceGenerator();

  // State management
  const [customerType, setCustomerType] = useState<CustomerType>('person');
  const [invoiceType, setInvoiceType] = useState<InvoiceType>('receipt');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash' | 'transfer'>('card');
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Company information
  const [companyName, setCompanyName] = useState('');
  const [nipNumber, setNipNumber] = useState('');
  const [nipValidation, setNipValidation] = useState<any>(null);
  const [validatingNIP, setValidatingNIP] = useState(false);

  // Address information
  const [billingAddress, setBillingAddress] = useState({
    street: '',
    buildingNumber: '',
    apartmentNumber: '',
    city: '',
    postalCode: '',
    country: 'Polska'
  });

  // Invoice preferences
  const [electronicInvoice, setElectronicInvoice] = useState(true);
  const [splitPayment, setSplitPayment] = useState(false);

  // Agreements
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [electronicInvoiceConsent, setElectronicInvoiceConsent] = useState(true);

  // VAT calculation
  const [vatCalculation, setVatCalculation] = useState<any>(null);
  const [calculatingVAT, setCalculatingVAT] = useState(false);

  // Deposit calculation
  const [depositCalculation, setDepositCalculation] = useState<DepositCalculation | null>(null);
  const [calculatingDeposit, setCalculatingDeposit] = useState(false);

  const basePrice = service.price_from || 0;
  const convertedPrice = convertPrice(basePrice);
  const formattedPrice = formatPrice(basePrice);
  const depositAmount = depositCalculation?.deposit_amount || 0;
  const remainingBalance = basePrice - depositAmount;

  // Calculate VAT when dependencies change
  useEffect(() => {
    if (service.serviceCategory && customerType) {
      calculateVATAmount();
    }
  }, [service.serviceCategory, customerType, nipNumber]);

  // Calculate deposit when service or date changes
  useEffect(() => {
    if (service.id && service.serviceType && basePrice > 0) {
      calculateDepositAmount();
    }
  }, [service.id, service.serviceType, basePrice, date]);

  // Validate NIP when it changes
  useEffect(() => {
    if (nipNumber && NIPUtils.isValidFormat(nipNumber) && customerType !== 'person') {
      handleNIPValidation();
    } else {
      setNipValidation(null);
    }
  }, [nipNumber, customerType]);

  const calculateVATAmount = async () => {
    if (!service.serviceCategory) return;

    setCalculatingVAT(true);
    try {
      const calculation = await calculateVAT({
        amount: basePrice,
        serviceType: service.serviceType,
        serviceCategory: service.serviceCategory,
        customerType,
        customerCountry: customerType === 'person' || customerType === 'company_polish' ? 'Polska' : billingAddress.country,
        isReverseCharge: customerType !== 'person' && customerType !== 'company_polish'
      });

      setVatCalculation(calculation);
    } catch (error) {
      console.error('VAT calculation failed:', error);
    } finally {
      setCalculatingVAT(false);
    }
  };

  const calculateDepositAmount = async () => {
    setCalculatingDeposit(true);
    try {
      const calculation = await depositService.calculateDepositAmount(
        service.id,
        service.serviceType,
        basePrice,
        {
          bookingDate: date,
          category: service.serviceCategory
        }
      );

      setDepositCalculation(calculation);
    } catch (error) {
      console.error('Deposit calculation failed:', error);
      // Set default no deposit calculation on error
      setDepositCalculation({
        deposit_required: false,
        deposit_amount: 0,
        breakdown: { base_price: basePrice }
      });
    } finally {
      setCalculatingDeposit(false);
    }
  };

  const handleNIPValidation = async () => {
    if (!nipNumber || !NIPUtils.isValidFormat(nipNumber)) {
      return;
    }

    setValidatingNIP(true);
    try {
      const validation = await validateAndFormatNIP(nipNumber);
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
    } finally {
      setValidatingNIP(false);
    }
  };

  const handleNIPChange = async (value: string) => {
    const cleanNIP = NIPUtils.cleanNIP(value);
    setNipNumber(cleanNIP);

    // Format NIP with hyphens
    if (NIPUtils.isValidFormat(cleanNIP)) {
      setNipNumber(NIPUtils.formatNIP(cleanNIP));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Basic validation
    if (!fullName.trim()) {
      newErrors.fullName = 'Imię i nazwisko jest wymagane';
    }

    if (!email.trim()) {
      newErrors.email = 'Email jest wymagany';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Nieprawidłowy format email';
    }

    if (!phone.trim()) {
      newErrors.phone = 'Telefon jest wymagany';
    }

    // Invoice-specific validation
    if (invoiceType === 'faktura' && customerType !== 'person') {
      if (!companyName.trim()) {
        newErrors.companyName = 'Nazwa firmy jest wymagana';
      }

      if (!nipNumber.trim()) {
        newErrors.nipNumber = 'Numer NIP jest wymagany';
      } else if (!NIPUtils.isValidFormat(nipNumber)) {
        newErrors.nipNumber = 'Nieprawidłowy format numeru NIP';
      } else if (nipValidation && !nipValidation.validation.isValid) {
        newErrors.nipNumber = 'Numer NIP jest nieprawidłowy';
      }

      if (!billingAddress.street.trim()) {
        newErrors.street = 'Ulica jest wymagana';
      }

      if (!billingAddress.buildingNumber.trim()) {
        newErrors.buildingNumber = 'Numer budynku jest wymagany';
      }

      if (!billingAddress.city.trim()) {
        newErrors.city = 'Miasto jest wymagane';
      }

      if (!billingAddress.postalCode.trim()) {
        newErrors.postalCode = 'Kod pocztowy jest wymagany';
      } else if (!/^\d{2}-\d{3}$/.test(billingAddress.postalCode)) {
        newErrors.postalCode = 'Nieprawidłowy format kodu pocztowego (XX-XXX)';
      }
    }

    // Agreement validation
    if (!termsAccepted) {
      newErrors.termsAccepted = 'Akceptacja regulaminu jest wymagana';
    }

    if (!privacyAccepted) {
      newErrors.privacyAccepted = 'Akceptacja polityki prywatności jest wymagana';
    }

    if (electronicInvoice && !electronicInvoiceConsent) {
      newErrors.electronicInvoiceConsent = 'Zgoda na faktury elektroniczne jest wymagana';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setProcessing(true);

    try {
      let invoiceData;
      let complianceData;

      // Generate invoice if requested
      if (invoiceType === 'faktura') {
        try {
          invoiceData = await generateInvoice({
            invoiceType: 'faktura',
            issueDate: new Date(),
            saleDate: date,
            dueDate: new Date(date.getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days
            customerType,
            customerName: customerType === 'person' ? fullName : companyName,
            customerAddress: customerType === 'person' ? {
              street: 'ul. Klienta',
              buildingNumber: '1',
              city: 'Warszawa',
              postalCode: '00-001',
              country: 'Polska'
            } : billingAddress,
            customerNIP: customerType !== 'person' ? nipNumber : undefined,
            customerEmail: email,
            customerPhone: phone,
            items: [{
              name: service.title,
              description: `${service.serviceType === 'beauty' ? 'Zabieg' : 'Trening'} - ${service.title}`,
              quantity: 1,
              unit: 'szt.',
              unitPrice: basePrice,
              vatRate: vatCalculation?.vatRate || '23',
              vatAmount: vatCalculation?.vatAmount || (basePrice * 0.23),
              totalAmount: vatCalculation?.grossTotal || (basePrice * 1.23),
              serviceType: service.serviceType,
              pkwiuCode: '96.02.Z' // Beauty treatment code
            }],
            paymentMethod,
            paymentStatus: 'unpaid',
            currency: 'PLN',
            reverseCharge: vatCalculation?.isReverseCharge,
            splitPayment: splitPayment,
            exemptFromVAT: vatCalculation?.isExempt,
            notes: electronicInvoice ? 'Faktura elektroniczna' : 'Faktura papierowa',
            legalBasis: vatCalculation?.legalBasis
          });

          complianceData = {
            customerType,
            companyName,
            nipNumber,
            nipValidation: nipValidation?.validation,
            vatCalculation,
            electronicInvoice,
            splitPayment
          };
        } catch (error) {
          console.error('Invoice generation failed:', error);
          // Continue without invoice
        }
      }

      // Create deposit transaction if deposit is required
      let depositData;
      if (depositCalculation?.deposit_required && depositCalculation.deposit_amount > 0) {
        try {
          const transaction = await depositService.createDepositTransaction(
            'temp_booking_id_' + Date.now(), // This would be replaced with actual booking ID
            depositCalculation,
            {
              customerName: fullName,
              customerEmail: email,
              serviceName: service.title,
              bookingDate: date.toISOString(),
              paymentMethod
            }
          );
          depositData = {
            required: true,
            amount: depositCalculation.deposit_amount,
            calculation: depositCalculation,
            transactionId: transaction.id
          };
        } catch (error) {
          console.error('Failed to create deposit transaction:', error);
        }
      }

      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 1500));

      onComplete({
        paymentMethod,
        stripePaymentIntentId: paymentMethod === 'card' ? 'pi_simulated_' + Date.now() : undefined,
        invoiceData,
        complianceData,
        depositData
      });

    } catch (error) {
      console.error('Payment processing failed:', error);
      setErrors(prev => ({
        ...prev,
        submit: 'Wystąpił błąd podczas przetwarzania płatności'
      }));
    } finally {
      setProcessing(false);
    }
  };

  const renderCustomerInfo = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-pearl">Dane klienta</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fullName">Imię i nazwisko *</Label>
          <Input
            id="fullName"
            value={fullName}
            disabled
            className={errors.fullName ? 'border-red-500' : ''}
          />
          {errors.fullName && <p className="text-sm text-red-500 mt-1">{errors.fullName}</p>}
        </div>

        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={email}
            disabled
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && <p className="text-sm text-red-500 mt-1">{errors.email}</p>}
        </div>

        <div>
          <Label htmlFor="phone">Telefon *</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            disabled
            className={errors.phone ? 'border-red-500' : ''}
          />
          {errors.phone && <p className="text-sm text-red-500 mt-1">{errors.phone}</p>}
        </div>

        <div>
          <Label>Typ klienta</Label>
          <RadioGroup
            value={customerType}
            onValueChange={(value) => setCustomerType(value as CustomerType)}
            className="flex flex-col space-y-2 mt-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="person" id="person" />
              <Label htmlFor="person" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Osoba prywatna
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="company_polish" id="company_polish" />
              <Label htmlFor="company_polish" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Firma polska
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="company_eu" id="company_eu" />
              <Label htmlFor="company_eu" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Firma z UE
              </Label>
            </div>
          </RadioGroup>
        </div>
      </div>
    </div>
  );

  const renderCompanyInfo = () => {
    if (customerType === 'person') {
      return null;
    }

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-pearl">Dane firmy</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="companyName">Nazwa firmy *</Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Nazwa Twojej firmy"
              className={errors.companyName ? 'border-red-500' : ''}
            />
            {errors.companyName && <p className="text-sm text-red-500 mt-1">{errors.companyName}</p>}
          </div>

          <div>
            <Label htmlFor="nipNumber">Numer NIP *</Label>
            <Input
              id="nipNumber"
              value={nipNumber}
              onChange={(e) => handleNIPChange(e.target.value)}
              placeholder="Format: 123-456-78-90"
              className={errors.nipNumber ? 'border-red-500' : ''}
              disabled={validatingNIP}
            />
            {errors.nipNumber && <p className="text-sm text-red-500 mt-1">{errors.nipNumber}</p>}

            {validatingNIP && (
              <div className="flex items-center gap-2 mt-2 text-sm text-blue-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                Walidacja NIP...
              </div>
            )}

            {nipValidation && !validatingNIP && (
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

          <div className="md:col-span-2">
            <Label htmlFor="street">Ulica *</Label>
            <Input
              id="street"
              value={billingAddress.street}
              onChange={(e) => setBillingAddress(prev => ({ ...prev, street: e.target.value }))}
              placeholder="Ulica"
              className={errors.street ? 'border-red-500' : ''}
            />
            {errors.street && <p className="text-sm text-red-500 mt-1">{errors.street}</p>}
          </div>

          <div>
            <Label htmlFor="buildingNumber">Numer budynku *</Label>
            <Input
              id="buildingNumber"
              value={billingAddress.buildingNumber}
              onChange={(e) => setBillingAddress(prev => ({ ...prev, buildingNumber: e.target.value }))}
              placeholder="Nr budynku"
              className={errors.buildingNumber ? 'border-red-500' : ''}
            />
            {errors.buildingNumber && <p className="text-sm text-red-500 mt-1">{errors.buildingNumber}</p>}
          </div>

          <div>
            <Label htmlFor="apartmentNumber">Numer lokalu</Label>
            <Input
              id="apartmentNumber"
              value={billingAddress.apartmentNumber}
              onChange={(e) => setBillingAddress(prev => ({ ...prev, apartmentNumber: e.target.value }))}
              placeholder="Nr lokalu (opcjonalnie)"
            />
          </div>

          <div>
            <Label htmlFor="city">Miasto *</Label>
            <Input
              id="city"
              value={billingAddress.city}
              onChange={(e) => setBillingAddress(prev => ({ ...prev, city: e.target.value }))}
              placeholder="Miasto"
              className={errors.city ? 'border-red-500' : ''}
            />
            {errors.city && <p className="text-sm text-red-500 mt-1">{errors.city}</p>}
          </div>

          <div>
            <Label htmlFor="postalCode">Kod pocztowy *</Label>
            <Input
              id="postalCode"
              value={billingAddress.postalCode}
              onChange={(e) => setBillingAddress(prev => ({ ...prev, postalCode: e.target.value }))}
              placeholder="00-001"
              className={errors.postalCode ? 'border-red-500' : ''}
            />
            {errors.postalCode && <p className="text-sm text-red-500 mt-1">{errors.postalCode}</p>}
          </div>
        </div>
      </div>
    );
  };

  const renderVATInformation = () => {
    if (!vatCalculation || calculatingVAT) {
      return null;
    }

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-pearl">Informacje podatkowe</h3>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Kwota netto:</span>
                <span>{VATUtils.formatVATAmount(vatCalculation.netAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Stawka VAT:</span>
                <Badge variant="secondary">{VATUtils.formatVATRate(vatCalculation.vatRate)}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Kwota VAT:</span>
                <span>{VATUtils.formatVATAmount(vatCalculation.vatAmount)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Kwota brutto:</span>
                <span className="text-lg">{VATUtils.formatVATAmount(vatCalculation.grossAmount)}</span>
              </div>
            </div>

            {vatCalculation.notes && vatCalculation.notes.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-2">Informacje VAT:</p>
                <ul className="text-sm text-blue-800 space-y-1">
                  {vatCalculation.notes.map((note: string, index: number) => (
                    <li key={index} className="flex items-start gap-2">
                      <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderInvoicePreferences = () => {
    if (customerType === 'person') {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-pearl">Preferencje</h3>

          <RadioGroup
            value={invoiceType}
            onValueChange={(value) => setInvoiceType(value as InvoiceType)}
            className="flex flex-col space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="receipt" id="receipt" />
              <Label htmlFor="receipt" className="flex items-center gap-2">
                <Receipt className="w-4 h-4" />
                Paragon (dla osoby prywatnej)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="faktura" id="faktura" />
              <Label htmlFor="faktura" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Faktura VAT
              </Label>
            </div>
          </RadioGroup>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-pearl">Preferencje faktury</h3>

        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="electronicInvoice"
              checked={electronicInvoice}
              onCheckedChange={(checked) => setElectronicInvoice(checked as boolean)}
            />
            <Label htmlFor="electronicInvoice">
              Faktura elektroniczna (PDF)
            </Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="splitPayment"
              checked={splitPayment}
              onCheckedChange={(checked) => setSplitPayment(checked as boolean)}
            />
            <Label htmlFor="splitPayment">
              Mechanizm podzielonej płatności (MPP)
            </Label>
          </div>
        </div>
      </div>
    );
  };

  const renderAgreements = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-pearl">Zgody i oświadczenia</h3>

      <div className="space-y-3">
        <div className="flex items-start space-x-3">
          <Checkbox
            id="termsAccepted"
            checked={termsAccepted}
            onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
            className="mt-1"
          />
          <Label htmlFor="termsAccepted" className="text-sm leading-relaxed">
            Oświadczam, że zapoznałem/am się z{' '}
            <a href="/regulamin" target="_blank" className="text-blue-600 hover:underline">
              regulaminem
            </a>
            {' '}i akceptuję jego warunki *
          </Label>
        </div>
        {errors.termsAccepted && <p className="text-sm text-red-500">{errors.termsAccepted}</p>}

        <div className="flex items-start space-x-3">
          <Checkbox
            id="privacyAccepted"
            checked={privacyAccepted}
            onCheckedChange={(checked) => setPrivacyAccepted(checked as boolean)}
            className="mt-1"
          />
          <Label htmlFor="privacyAccepted" className="text-sm leading-relaxed">
            Oświadczam, że zapoznałem/am się z{' '}
            <a href="/polityka-prywatnosci" target="_blank" className="text-blue-600 hover:underline">
              polityką prywatności
            </a>
            {' '}i wyrażam zgodę na przetwarzanie moich danych osobowych *
          </Label>
        </div>
        {errors.privacyAccepted && <p className="text-sm text-red-500">{errors.privacyAccepted}</p>}

        {electronicInvoice && (
          <div className="flex items-start space-x-3">
            <Checkbox
              id="electronicInvoiceConsent"
              checked={electronicInvoiceConsent}
              onCheckedChange={(checked) => setElectronicInvoiceConsent(checked as boolean)}
              className="mt-1"
            />
            <Label htmlFor="electronicInvoiceConsent" className="text-sm leading-relaxed">
              Wyrażam zgodę na otrzymywanie faktur w formie elektronicznej *
            </Label>
          </div>
        )}
        {errors.electronicInvoiceConsent && <p className="text-sm text-red-500">{errors.electronicInvoiceConsent}</p>}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Booking Summary */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-pearl">Podsumowanie rezerwacji</h3>

        <Card>
          <CardContent className="p-4 space-y-3">
            {/* Service */}
            <div className="flex justify-between items-start">
              <div>
                <div className="text-pearl font-medium">{service.title}</div>
                <div className="text-pearl/60 text-sm">{service.duration_minutes || 60} minut</div>
              </div>
              <div className="text-pearl font-semibold">{formattedPrice}</div>
            </div>

            {/* Date & Time */}
            <div className="pt-3 border-t border-pearl/10">
              <div className="flex justify-between text-sm">
                <span className="text-pearl/60">Data</span>
                <span className="text-pearl">
                  {format(date, 'EEEE, d MMMM yyyy', { locale: pl })}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-pearl/60">Godzina</span>
                <span className="text-pearl">{time}</span>
              </div>
            </div>

            {/* Client */}
            <div className="pt-3 border-t border-pearl/10">
              <div className="flex justify-between text-sm">
                <span className="text-pearl/60">Klient</span>
                <span className="text-pearl">{fullName}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-pearl/60">Kontakt</span>
                <span className="text-pearl">{phone}</span>
              </div>
            </div>

            {/* Deposit Information */}
            {depositCalculation && (
              <div className="pt-3 border-t border-pearl/10">
                {calculatingDeposit ? (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Obliczanie warunków kaucji...
                  </div>
                ) : depositCalculation.deposit_required && depositCalculation.deposit_amount > 0 ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-champagne">
                      <Shield className="w-4 h-4" />
                      <span className="font-medium">Wymagana kaucja</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-pearl/60">Kaucja:</span>
                        <div className="font-semibold text-champagne">
                          {formatPrice(depositCalculation.deposit_amount)}
                        </div>
                      </div>
                      <div>
                        <span className="text-pearl/60">Pozostała kwota:</span>
                        <div className="font-semibold text-pearl">
                          {formatPrice(remainingBalance)}
                        </div>
                      </div>
                    </div>

                    {/* Deposit breakdown */}
                    <div className="mt-2 p-3 rounded-lg bg-champagne/5 border border-champagne/20">
                      <div className="text-xs space-y-1">
                        {depositService.generateDepositBreakdown(depositCalculation).map((line, index) => (
                          <div key={index} className="text-pearl/70">
                            {line}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span>Brak wymaganej kaucji dla tej rezerwacji</span>
                  </div>
                )}
              </div>
            )}

            {/* Final Total */}
            <div className="pt-3 border-t border-pearl/10">
              <div className="flex justify-between items-center">
                <span className="text-pearl font-semibold">Całkowita kwota</span>
                <span className="text-xl font-bold text-champagne">
                  {vatCalculation ? VATUtils.formatVATAmount(vatCalculation.grossAmount) : formattedPrice}
                </span>
              </div>
              {depositCalculation?.deposit_required && depositCalculation.deposit_amount > 0 && (
                <div className="mt-1 text-xs text-pearl/60">
                  W tym kaucja: {formatPrice(depositCalculation.deposit_amount)}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Method */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-pearl">Sposób płatności</h3>

        <RadioGroup
          value={paymentMethod}
          onValueChange={(value) => setPaymentMethod(value as any)}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div className="flex items-center space-x-2 p-4 rounded-2xl border-2 border-champagne/15 glass-subtle cursor-pointer hover:border-champagne/30 transition-colors">
            <RadioGroupItem value="card" id="card" className="sr-only" />
            <Label htmlFor="card" className="flex flex-col items-center gap-2 cursor-pointer flex-1">
              <CreditCard className="w-8 h-8" />
              <div className="text-sm font-medium">Płatność online</div>
              <div className="text-xs opacity-60">Karta lub BLIK</div>
            </Label>
          </div>

          <div className="flex items-center space-x-2 p-4 rounded-2xl border-2 border-champagne/15 glass-subtle cursor-pointer hover:border-champagne/30 transition-colors">
            <RadioGroupItem value="transfer" id="transfer" className="sr-only" />
            <Label htmlFor="transfer" className="flex flex-col items-center gap-2 cursor-pointer flex-1">
              <FileText className="w-8 h-8" />
              <div className="text-sm font-medium">Przelew</div>
              <div className="text-xs opacity-60">Tradycyjny przelew</div>
            </Label>
          </div>

          <div className="flex items-center space-x-2 p-4 rounded-2xl border-2 border-champagne/15 glass-subtle cursor-pointer hover:border-champagne/30 transition-colors">
            <RadioGroupItem value="cash" id="cash" className="sr-only" />
            <Label htmlFor="cash" className="flex flex-col items-center gap-2 cursor-pointer flex-1">
              <div className="text-2xl">💵</div>
              <div className="text-sm font-medium">Gotówka</div>
              <div className="text-xs opacity-60">Na miejscu</div>
            </Label>
          </div>
        </RadioGroup>

        {/* Payment info */}
        {paymentMethod === 'card' && (
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <div className="flex items-start gap-3">
              <Info className="w-4 h-4 text-blue-400 mt-0.5" />
              <div className="text-sm text-pearl/80">
                {depositCalculation?.deposit_required && depositCalculation.deposit_amount > 0 ? (
                  <>
                    Obecnie pobierzemy tylko kaucję w wysokości <strong>{formatPrice(depositCalculation.deposit_amount)}</strong>.
                    Pozostała kwota ({formatPrice(remainingBalance)}) zostanie pobrana przy wizycie.
                  </>
                ) : (
                  <>
                    Płatność zostanie przetworzona przez naszego bezpiecznego partnera płatniczego.
                    Twoje dane płatnicze są chronione zgodnie ze standardami PCI DSS.
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {paymentMethod === 'transfer' && (
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
            <div className="flex items-start gap-3">
              <Info className="w-4 h-4 text-green-400 mt-0.5" />
              <div className="text-sm text-pearl/80">
                {depositCalculation?.deposit_required && depositCalculation.deposit_amount > 0 ? (
                  <>
                    Wymagana kaucja: <strong>{formatPrice(depositCalculation.deposit_amount)}</strong> do zapłaty przelewem.
                    Po potwierdzeniu rezerwacji otrzymasz dane do przelewu. Kaucja musi zostać wpłacona w ciągu 24h,
                    w przeciwnym razie rezerwacja zostanie anulowana.
                  </>
                ) : (
                  <>
                    Po potwierdzeniu rezerwacji otrzymasz dane do przelewu. Płatność należy zrealizować
                    przed wizytą. Rezerwacja zostanie potwierdzona po zaksięgowaniu wpłaty.
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {paymentMethod === 'cash' && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-start gap-3">
              <Info className="w-4 h-4 text-amber-400 mt-0.5" />
              <div className="text-sm text-pearl/80">
                {depositCalculation?.deposit_required && depositCalculation.deposit_amount > 0 ? (
                  <>
                    Kaucja w wysokości <strong>{formatPrice(depositCalculation.deposit_amount)}</strong> wymagana
                    przy potwierdzeniu rezerwacji. Pozostałą kwotę ({formatPrice(remainingBalance)}) zapłacisz gotówką przy wizycie.
                  </>
                ) : (
                  <>
                    Płatność gotówką w rejestracji przed wizytą. Prosimy o przygotowanie odliczonej kwoty.
                    Opłata rezygnacyjna 50 PLN obowiązuje przy braku odwołania (poniżej 24h).
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Compliance Information */}
      <Tabs defaultValue="customer" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="customer">Dane klienta</TabsTrigger>
          {(customerType !== 'person' || invoiceType === 'faktura') && (
            <TabsTrigger value="company">
              {customerType === 'person' ? 'Faktura' : 'Firma'}
            </TabsTrigger>
          )}
          {(vatCalculation || calculatingVAT) && (
            <TabsTrigger value="vat">VAT</TabsTrigger>
          )}
          <TabsTrigger value="agreements">Zgody</TabsTrigger>
        </TabsList>

        <TabsContent value="customer" className="mt-4">
          {renderCustomerInfo()}
        </TabsContent>

        {(customerType !== 'person' || invoiceType === 'faktura') && (
          <TabsContent value="company" className="mt-4">
            {customerType !== 'person' ? renderCompanyInfo() : renderInvoicePreferences()}
          </TabsContent>
        )}

        {(vatCalculation || calculatingVAT) && (
          <TabsContent value="vat" className="mt-4">
            {calculatingVAT ? (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                Obliczanie VAT...
              </div>
            ) : (
              renderVATInformation()
            )}
          </TabsContent>
        )}

        <TabsContent value="agreements" className="mt-4">
          {renderAgreements()}
        </TabsContent>
      </Tabs>

      {/* Error display */}
      {errors.submit && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle className="w-5 h-5" />
            <span>{errors.submit}</span>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-between gap-4">
        {onBack && (
          <Button
            variant="outline"
            onClick={onBack}
            disabled={processing}
            size="lg"
          >
            Wstecz
          </Button>
        )}

        <Button
          onClick={handleSubmit}
          disabled={processing}
          size="lg"
          className="flex-1 bg-gradient-brand text-white"
        >
          {processing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Przetwarzanie...
            </>
          ) : paymentMethod === 'card' ? (
            depositCalculation?.deposit_required && depositCalculation.deposit_amount > 0 ? (
              `Zapłać kaucję ${formatPrice(depositCalculation.deposit_amount)}`
            ) : (
              `Zapłać ${vatCalculation ? VATUtils.formatVATAmount(vatCalculation.grossAmount) : formattedPrice}`
            )
          ) : (
            depositCalculation?.deposit_required && depositCalculation.deposit_amount > 0 ? (
              'Potwierdź rezerwację z kaucją'
            ) : (
              'Potwierdź rezerwację'
            )
          )}
        </Button>
      </div>
    </div>
  );
};