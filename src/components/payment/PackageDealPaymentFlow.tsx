// Package Deal Payment Flow
// Comprehensive payment flow for package deals and bundled services

import React, { useState, useEffect } from 'react';
import {
  PackageIcon,
  CheckIcon,
  CalculatorIcon,
  CreditCardIcon,
  CalendarIcon,
  PercentIcon,
  InfoIcon,
  SparklesIcon,
  GiftIcon,
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { formatCurrency } from '@/lib/email-templates';
import { paymentSystemService } from '@/services/paymentSystemService';

interface PackageService {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  duration: number;
  category: 'beauty' | 'fitness' | 'lifestyle';
  image?: string;
  popular?: boolean;
}

interface PackageDeal {
  id: string;
  name: string;
  description: string;
  services: PackageService[];
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  totalOriginalPrice: number;
  finalPrice: number;
  currency: string;
  validityDays: number;
  maxUses?: number;
  terms: string[];
  benefits: string[];
}

interface PaymentPlan {
  id: string;
  name: string;
  installments: number;
  depositAmount: number;
  installmentAmount: number;
  totalAmount: number;
  description: string;
  recommended?: boolean;
}

export function PackageDealPaymentFlow({
  packageDeals,
  onComplete,
  onBack,
}: {
  packageDeals: PackageDeal[];
  onComplete: (data: any) => void;
  onBack: () => void;
}) {
  const [selectedPackage, setSelectedPackage] = useState<PackageDeal | null>(null);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [paymentPlan, setPaymentPlan] = useState<'full' | 'installments'>('full');
  const [selectedInstallmentPlan, setSelectedInstallmentPlan] = useState<PaymentPlan | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  // Calculate available installment plans
  const installmentPlans: PaymentPlan[] = [
    {
      id: '3-mo',
      name: '3 Monthly Payments',
      installments: 3,
      depositAmount: 0.3,
      installmentAmount: 0.233,
      totalAmount: 1,
      description: 'Pay 30% deposit, then 3 monthly installments',
    },
    {
      id: '6-mo',
      name: '6 Monthly Payments',
      installments: 6,
      depositAmount: 0.2,
      installmentAmount: 0.133,
      totalAmount: 1,
      description: 'Pay 20% deposit, then 6 monthly installments',
      recommended: true,
    },
    {
      id: '12-mo',
      name: '12 Monthly Payments',
      installments: 12,
      depositAmount: 0.1,
      installmentAmount: 0.075,
      totalAmount: 1,
      description: 'Pay 10% deposit, then 12 monthly installments',
    },
  ];

  // Handle custom package creation
  const [isCustomPackage, setIsCustomPackage] = useState(false);
  const [customServices, setCustomServices] = useState<PackageService[]>([]);

  useEffect(() => {
    if (isCustomPackage) {
      // Pre-select first 3 services for custom package
      setCustomServices(packageDeals[0]?.services.slice(0, 3) || []);
    }
  }, [isCustomPackage, packageDeals]);

  const calculateCustomPackagePrice = () => {
    if (!isCustomPackage || customServices.length === 0) return 0;

    const total = customServices.reduce((sum, service) => sum + service.price, 0);

    // Apply bulk discount based on number of services
    let discount = 0;
    if (customServices.length >= 3) discount = 0.1; // 10% for 3+ services
    if (customServices.length >= 5) discount = 0.15; // 15% for 5+ services
    if (customServices.length >= 7) discount = 0.2; // 20% for 7+ services

    return total * (1 - discount);
  };

  const handleServiceSelection = (serviceId: string) => {
    if (isCustomPackage) {
      setCustomServices(prev => {
        const service = packageDeals[0]?.services.find(s => s.id === serviceId);
        if (!service) return prev;

        const isSelected = prev.some(s => s.id === serviceId);
        if (isSelected) {
          return prev.filter(s => s.id !== serviceId);
        } else {
          return [...prev, service];
        }
      });
    } else {
      setSelectedServices(prev => {
        if (prev.includes(serviceId)) {
          return prev.filter(id => id !== serviceId);
        } else {
          return [...prev, serviceId];
        }
      });
    }
  };

  const getTotalPrice = () => {
    if (isCustomPackage) {
      return calculateCustomPackagePrice();
    }

    if (!selectedPackage) return 0;

    const basePrice = selectedPackage.finalPrice;
    if (selectedServices.length === 0) return basePrice;

    // Calculate prorated price for selected services
    const selectedServicesTotal = selectedPackage.services
      .filter(s => selectedServices.includes(s.id))
      .reduce((sum, s) => sum + s.price, 0);

    const allServicesTotal = selectedPackage.services.reduce((sum, s) => sum + s.price, 0);
    const discountMultiplier = selectedPackage.finalPrice / allServicesTotal;

    return selectedServicesTotal * discountMultiplier;
  };

  const handleProceed = async () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    } else {
      setLoading(true);
      try {
        const paymentData = {
          package: isCustomPackage ? {
            name: 'Custom Package',
            services: customServices,
            price: calculateCustomPackagePrice(),
          } : selectedPackage,
          selectedServices,
          paymentPlan,
          installmentPlan: selectedInstallmentPlan,
          totalPrice: getTotalPrice(),
        };

        await onComplete(paymentData);
      } catch (error) {
        console.error('Payment processing error:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Choose Your Package</h2>
        <p className="text-muted-foreground mt-2">
          Select a pre-designed package or create your own custom bundle
        </p>
      </div>

      <Tabs defaultValue="predefined" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="predefined">Pre-defined Packages</TabsTrigger>
          <TabsTrigger value="custom" onClick={() => setIsCustomPackage(true)}>
            Custom Package
          </TabsTrigger>
        </TabsList>

        <TabsContent value="predefined" className="space-y-4 mt-6">
          <div className="grid gap-4">
            {packageDeals.map((pkg) => (
              <Card
                key={pkg.id}
                className={`cursor-pointer transition-all ${
                  selectedPackage?.id === pkg.id
                    ? 'ring-2 ring-primary border-primary'
                    : 'hover:shadow-lg'
                }`}
                onClick={() => {
                  setSelectedPackage(pkg);
                  setIsCustomPackage(false);
                  setSelectedServices(pkg.services.map(s => s.id));
                }}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="flex items-center gap-2">
                        <PackageIcon className="w-5 h-5" />
                        {pkg.name}
                        {pkg.discountType === 'percentage' && (
                          <Badge variant="secondary" className="text-green-600">
                            <PercentIcon className="w-3 h-3 mr-1" />
                            {pkg.discountValue}% OFF
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{pkg.description}</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {formatCurrency(pkg.finalPrice, pkg.currency, 'en')}
                      </div>
                      {pkg.discountValue > 0 && (
                        <div className="text-sm text-muted-foreground line-through">
                          {formatCurrency(pkg.totalOriginalPrice, pkg.currency, 'en')}
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">Included Services:</p>
                      <div className="grid grid-cols-1 gap-2">
                        {pkg.services.map((service) => (
                          <div
                            key={service.id}
                            className="flex items-center justify-between p-2 rounded bg-muted"
                          >
                            <div className="flex items-center gap-2">
                              <CheckIcon className="w-4 h-4 text-green-500" />
                              <span className="text-sm">{service.name}</span>
                            </div>
                            <span className="text-sm font-medium">
                              {formatCurrency(service.price, service.currency, 'en')}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <p className="text-sm font-medium mb-2">Benefits:</p>
                      <ul className="space-y-1">
                        {pkg.benefits.map((benefit, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-sm">
                            <SparklesIcon className="w-4 h-4 text-yellow-500 mt-0.5" />
                            {benefit}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarIcon className="w-4 h-4" />
                      Valid for {pkg.validityDays} days
                      {pkg.maxUses && ` • ${pkg.maxUses} uses included`}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="custom" className="space-y-4 mt-6">
          <Alert>
            <InfoIcon className="w-4 h-4" />
            <AlertDescription>
              Create your own package by selecting services. Get up to 20% off when you choose 7 or more services!
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {packageDeals[0]?.services.map((service) => (
              <Card
                key={service.id}
                className={`cursor-pointer transition-all ${
                  customServices.some(s => s.id === service.id)
                    ? 'ring-2 ring-primary border-primary'
                    : 'hover:shadow-md'
                }`}
                onClick={() => handleServiceSelection(service.id)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <h4 className="font-medium">{service.name}</h4>
                      <p className="text-sm text-muted-foreground">{service.description}</p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-bold">
                        {formatCurrency(service.price, service.currency, 'en')}
                      </p>
                      {customServices.some(s => s.id === service.id) && (
                        <CheckIcon className="w-5 h-5 text-green-500 ml-auto" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {customServices.length > 0 && (
            <Card className="bg-primary/5">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">Custom Package Summary</p>
                    <p className="text-sm text-muted-foreground">
                      {customServices.length} services selected
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">
                      {formatCurrency(calculateCustomPackagePrice(), 'PLN', 'en')}
                    </p>
                    {customServices.length >= 3 && (
                      <Badge variant="secondary">
                        Save {Math.round((1 - calculateCustomPackagePrice() /
                          customServices.reduce((sum, s) => sum + s.price, 0)) * 100)}%
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Choose Payment Plan</h2>
        <p className="text-muted-foreground mt-2">
          Pay in full or choose an installment plan that works for you
        </p>
      </div>

      <RadioGroup value={paymentPlan} onValueChange={(value: any) => setPaymentPlan(value)}>
        <div className="space-y-4">
          <Card
            className={`cursor-pointer transition-all ${
              paymentPlan === 'full' ? 'ring-2 ring-primary border-primary' : ''
            }`}
          >
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <RadioGroupItem value="full" id="full" />
                <Label htmlFor="full" className="flex-1 cursor-pointer">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium flex items-center gap-2">
                        <CreditCardIcon className="w-5 h-5" />
                        Pay in Full
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Pay once and get your package immediately
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold">
                        {formatCurrency(getTotalPrice(), 'PLN', 'en')}
                      </p>
                      <Badge variant="secondary" className="mt-1">
                        Save 5%
                      </Badge>
                    </div>
                  </div>
                </Label>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">
              <CalculatorIcon className="w-4 h-4 inline mr-1" />
              Installment Plans
            </p>
            {installmentPlans.map((plan) => {
              const depositAmount = getTotalPrice() * plan.depositAmount;
              const installmentAmount = getTotalPrice() * plan.installmentAmount;

              return (
                <Card
                  key={plan.id}
                  className={`cursor-pointer transition-all ${
                    paymentPlan === 'installments' && selectedInstallmentPlan?.id === plan.id
                      ? 'ring-2 ring-primary border-primary'
                      : ''
                  }`}
                  onClick={() => {
                    setPaymentPlan('installments');
                    setSelectedInstallmentPlan(plan);
                  }}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="installments" id={plan.id} />
                      <Label htmlFor={plan.id} className="flex-1 cursor-pointer">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium flex items-center gap-2">
                              {plan.name}
                              {plan.recommended && (
                                <Badge variant="default" className="text-xs">
                                  Recommended
                                </Badge>
                              )}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {plan.description}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold">
                              {formatCurrency(installmentAmount, 'PLN', 'en')}/mo
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {plan.installments} payments
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex justify-between text-sm">
                            <span>Deposit due today:</span>
                            <span className="font-medium">
                              {formatCurrency(depositAmount, 'PLN', 'en')}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm mt-1">
                            <span>Monthly payments:</span>
                            <span className="font-medium">
                              {formatCurrency(installmentAmount, 'PLN', 'en')} × {plan.installments}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm mt-1 pt-1 border-t font-medium">
                            <span>Total:</span>
                            <span>{formatCurrency(getTotalPrice(), 'PLN', 'en')}</span>
                          </div>
                        </div>
                      </Label>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </RadioGroup>
    </div>
  );

  const renderStep3 = () => {
    const totalPrice = getTotalPrice();
    const depositAmount = paymentPlan === 'full'
      ? totalPrice
      : selectedInstallmentPlan
        ? totalPrice * selectedInstallmentPlan.depositAmount
        : 0;

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Review & Confirm</h2>
          <p className="text-muted-foreground mt-2">
            Please review your package selection and payment details
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GiftIcon className="w-5 h-5" />
              Package Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium">
                {isCustomPackage ? 'Custom Package' : selectedPackage?.name}
              </h3>
              {isCustomPackage ? (
                <ul className="mt-2 space-y-1">
                  {customServices.map((service) => (
                    <li key={service.id} className="flex justify-between text-sm">
                      <span>{service.name}</span>
                      <span>{formatCurrency(service.price, 'PLN', 'en')}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <ul className="mt-2 space-y-1">
                  {(isCustomPackage ? customServices : selectedPackage?.services || [])
                    .filter(s => selectedServices.includes(s.id))
                    .map((service) => (
                      <li key={service.id} className="flex justify-between text-sm">
                        <span>{service.name}</span>
                        <span>{formatCurrency(service.price, 'PLN', 'en')}</span>
                      </li>
                    ))}
                </ul>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Package Total:</span>
                <span>{formatCurrency(totalPrice, 'PLN', 'en')}</span>
              </div>
              {paymentPlan === 'full' && (
                <div className="flex justify-between text-green-600">
                  <span>Full Payment Discount (5%):</span>
                  <span>-{formatCurrency(totalPrice * 0.05, 'PLN', 'en')}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-lg">
                <span>Total Due:</span>
                <span>
                  {paymentPlan === 'full'
                    ? formatCurrency(totalPrice * 0.95, 'PLN', 'en')
                    : formatCurrency(depositAmount, 'PLN', 'en')
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Plan</CardTitle>
          </CardHeader>
          <CardContent>
            {paymentPlan === 'full' ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckIcon className="w-5 h-5" />
                  <span>Full payment - save 5%</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Pay {formatCurrency(totalPrice * 0.95, 'PLN', 'en')} today
                </p>
              </div>
            ) : selectedInstallmentPlan ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckIcon className="w-5 h-5" />
                  <span>{selectedInstallmentPlan.name}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Deposit: {formatCurrency(depositAmount, 'PLN', 'en')} due today
                </p>
                <p className="text-sm text-muted-foreground">
                  Then {formatCurrency(totalPrice * selectedInstallmentPlan.installmentAmount, 'PLN', 'en')} monthly for {selectedInstallmentPlan.installments} months
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <Checkbox
              id="terms"
              checked={agreedToTerms}
              onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
            />
            <Label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer">
              I agree to the terms and conditions of this package deal, including the
              validity period, cancellation policy, and payment terms. I understand that
              package deals are non-refundable once purchased.
            </Label>
          </div>

          <Alert>
            <InfoIcon className="w-4 h-4" />
            <AlertDescription>
              Package deals have a special cancellation policy. Please review the terms
              carefully before proceeding with your purchase.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Indicator */}
      <div className="mb-8">
        <Progress value={(currentStep / 3) * 100} className="mb-2" />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Select Package</span>
          <span>Payment Plan</span>
          <span>Review & Confirm</span>
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[400px]">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={loading}
        >
          Back
        </Button>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowSummary(true)}
          >
            Preview Summary
          </Button>

          <Button
            onClick={handleProceed}
            disabled={
              loading ||
              (currentStep === 1 && !isCustomPackage && !selectedPackage) ||
              (currentStep === 1 && isCustomPackage && customServices.length === 0) ||
              (currentStep === 2 && paymentPlan === 'installments' && !selectedInstallmentPlan) ||
              (currentStep === 3 && !agreedToTerms)
            }
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : currentStep === 3 ? (
              'Complete Purchase'
            ) : (
              'Continue'
            )}
          </Button>
        </div>
      </div>

      {/* Summary Dialog */}
      <Dialog open={showSummary} onOpenChange={setShowSummary}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Package Summary</DialogTitle>
            <DialogDescription>
              Review your selection before proceeding
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Package Type</p>
                  <p className="font-medium">
                    {isCustomPackage ? 'Custom Package' : selectedPackage?.name}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Services</p>
                  <p className="font-medium">
                    {isCustomPackage ? customServices.length : selectedServices.length} services
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Total Price</p>
                  <p className="font-medium">
                    {formatCurrency(getTotalPrice(), 'PLN', 'en')}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">Payment Method</p>
                  <p className="font-medium capitalize">
                    {paymentPlan === 'full' ? 'Full Payment' : 'Installments'}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PackageDealPaymentFlow;