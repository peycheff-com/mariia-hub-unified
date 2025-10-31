import { useState, useEffect } from 'react';
import { CreditCard, Smartphone, Wallet, Shield, Check, Apple, Google } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';
import { useMetaTracking } from '@/hooks/useMetaTracking';

interface PaymentMethodsProps {
  amount: number;
  currency: string;
  onPaymentComplete: (paymentData: any) => void;
  onBack: () => void;
}

export const PaymentMethods = ({
  amount,
  currency,
  onPaymentComplete,
  onBack
}: PaymentMethodsProps) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { trackCustomConversion } = useMetaTracking();

  const [selectedMethod, setSelectedMethod] = useState('');
  const [loading, setLoading] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: '',
  });

  const paymentMethods = [
    {
      id: 'apple-pay',
      name: 'Apple Pay',
      icon: Apple,
      description: 'Fast & secure payment',
      available: true,
      recommended: true,
      color: 'black',
    },
    {
      id: 'google-pay',
      name: 'Google Pay',
      icon: Google,
      description: 'One-click checkout',
      available: true,
      color: 'blue',
    },
    {
      id: 'card',
      name: 'Credit/Debit Card',
      icon: CreditCard,
      description: 'Visa, Mastercard, AMEX',
      available: true,
      color: 'gray',
    },
    {
      id: 'deposit',
      name: 'Pay Deposit',
      icon: Wallet,
      description: `Pay ${amount * 0.2} ${currency} now`,
      available: true,
      badge: '20%',
      color: 'green',
    },
  ];

  // Auto-detect available payment methods
  useEffect(() => {
    const checkApplePay = () => {
      if (window.ApplePaySession) {
        const availability = window.ApplePaySession.canMakePayments();
        if (availability) {
          setSelectedMethod('apple-pay');
        }
      }
    };

    const checkGooglePay = () => {
      // Check if Google Pay is available
      const paymentsClient = new (window as any).google?.payments?.api?.PaymentsClient({
        environment: 'TEST'
      });

      if (paymentsClient) {
        paymentsClient.isReadyToPay({
          allowedPaymentMethods: ['CARD', 'TOKENIZED_CARD']
        }).then((response: any) => {
          if (response.result) {
            // Google Pay is available
          }
        });
      }
    };

    checkApplePay();
    checkGooglePay();

    // Default to card if digital wallets aren't available
    if (!selectedMethod) {
      setSelectedMethod('card');
    }
  }, []);

  const handlePaymentMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
    setShowCardForm(methodId === 'card');

    trackCustomConversion('PaymentMethodSelected', {
      payment_method: methodId,
      payment_amount: amount,
      currency,
      selection_timestamp: new Date().toISOString(),
    });
  };

  const handleApplePay = async () => {
    setLoading(true);
    try {
      const paymentRequest = {
        countryCode: 'PL',
        currencyCode: currency,
        supportedNetworks: ['visa', 'masterCard', 'amex'],
        merchantCapabilities: ['supports3DS'],
        total: {
          label: 'Mariia Hub',
          amount: amount.toString(),
        },
      };

      const session = new window.ApplePaySession(1, paymentRequest);

      session.onvalidatemerchant = async (event) => {
        // Validate merchant with your payment processor
        try {
          const merchantSession = await fetch('/api/apple-pay/validate-merchant', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ validationUrl: event.validationURL }),
          }).then(res => res.json());

          session.completeMerchantValidation(merchantSession);
        } catch (error) {
          session.abort();
          throw error;
        }
      };

      session.onpaymentauthorized = async (event) => {
        // Process payment
        try {
          const paymentResult = await processPayment('apple-pay', event.payment);

          session.completePayment(window.ApplePaySession.STATUS_SUCCESS);
          onPaymentComplete({
            method: 'apple-pay',
            transactionId: paymentResult.id,
            status: 'completed',
          });

          trackCustomConversion('PaymentCompleted', {
            payment_method: 'apple-pay',
            payment_amount: amount,
            currency,
            transaction_id: paymentResult.id,
            completion_timestamp: new Date().toISOString(),
          });

        } catch (error) {
          session.completePayment(window.ApplePaySession.STATUS_FAILURE);
          throw error;
        }
      };

      session.begin();

    } catch (error) {
      toast({
        title: 'Apple Pay Error',
        description: 'Unable to process Apple Pay. Please try another method.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGooglePay = async () => {
    setLoading(true);
    try {
      const paymentsClient = new (window as any).google?.payments?.api?.PaymentsClient({
        environment: 'TEST',
        paymentDataCallbacks: {
          onPaymentDataChanged: () => ({}) // Handle dynamic pricing if needed
        }
      });

      const paymentDataRequest = {
        apiVersion: 2,
        apiVersionMinor: 0,
        merchantInfo: {
          merchantId: 'your-merchant-id',
          merchantName: 'Mariia Hub',
        },
        allowedPaymentMethods: [{
          type: 'CARD',
          parameters: {
            allowedAuthMethods: ['PAN_ONLY', 'CRYPTOGRAM_3DS'],
            allowedCardNetworks: ['VISA', 'MASTERCARD', 'AMEX'],
          },
          tokenizationSpecification: {
            type: 'PAYMENT_GATEWAY',
            parameters: {
              gateway: 'your-payment-gateway',
              gatewayMerchantId: 'your-merchant-id',
            },
          },
        }],
        transactionInfo: {
          totalPriceStatus: 'FINAL',
          totalPrice: amount.toString(),
          currencyCode: currency,
          countryCode: 'PL',
        },
      };

      const paymentData = await paymentsClient.loadPaymentData(paymentDataRequest);

      const paymentResult = await processPayment('google-pay', paymentData);

      onPaymentComplete({
        method: 'google-pay',
        transactionId: paymentResult.id,
        status: 'completed',
      });

      trackCustomConversion('PaymentCompleted', {
        payment_method: 'google-pay',
        payment_amount: amount,
        currency,
        transaction_id: paymentResult.id,
        completion_timestamp: new Date().toISOString(),
      });

    } catch (error) {
      toast({
        title: 'Google Pay Error',
        description: 'Unable to process Google Pay. Please try another method.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCardPayment = async () => {
    if (!cardData.number || !cardData.expiry || !cardData.cvv || !cardData.name) {
      toast({
        title: 'Missing Information',
        description: 'Please complete all card details.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const paymentResult = await processPayment('card', cardData);

      onPaymentComplete({
        method: 'card',
        transactionId: paymentResult.id,
        status: 'completed',
        last4: cardData.number.slice(-4),
      });

      trackCustomConversion('PaymentCompleted', {
        payment_method: 'card',
        payment_amount: amount,
        currency,
        transaction_id: paymentResult.id,
        completion_timestamp: new Date().toISOString(),
      });

    } catch (error) {
      toast({
        title: 'Payment Failed',
        description: 'Unable to process card payment. Please check your details.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDepositPayment = async () => {
    setLoading(true);
    try {
      const depositAmount = amount * 0.2;

      const paymentResult = await processPayment('deposit', {
        amount: depositAmount,
        totalAmount: amount,
      });

      onPaymentComplete({
        method: 'deposit',
        transactionId: paymentResult.id,
        status: 'completed',
        depositAmount,
        remainingAmount: amount - depositAmount,
      });

      trackCustomConversion('DepositPaymentCompleted', {
        payment_method: 'deposit',
        payment_amount: depositAmount,
        total_amount: amount,
        currency,
        transaction_id: paymentResult.id,
        completion_timestamp: new Date().toISOString(),
      });

    } catch (error) {
      toast({
        title: 'Payment Failed',
        description: 'Unable to process deposit. Please try another method.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Mock payment processing
  const processPayment = async (method: string, data: any) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock successful payment
    return {
      id: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      status: 'succeeded',
      method,
      amount,
    };
  };

  const handleSubmit = () => {
    switch (selectedMethod) {
      case 'apple-pay':
        handleApplePay();
        break;
      case 'google-pay':
        handleGooglePay();
        break;
      case 'card':
        handleCardPayment();
        break;
      case 'deposit':
        handleDepositPayment();
        break;
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold mb-2">Choose Payment Method</h2>
        <p className="text-gray-600">Secure and encrypted payment processing</p>
      </div>

      {/* Payment Methods Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {paymentMethods.map((method) => (
          <Card
            key={method.id}
            onClick={() => handlePaymentMethodSelect(method.id)}
            className={cn(
              "p-4 cursor-pointer transition-all border-2 hover:shadow-lg",
              selectedMethod === method.id
                ? "border-champagne-400 bg-champagne/5"
                : "border-gray-200 hover:border-gray-300"
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "p-2 rounded-lg",
                  method.color === 'black' && "bg-gray-900",
                  method.color === 'blue' && "bg-blue-600",
                  method.color === 'green' && "bg-green-600",
                  method.color === 'gray' && "bg-gray-600"
                )}>
                  <method.icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{method.name}</h3>
                    {method.recommended && (
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">
                        Recommended
                      </Badge>
                    )}
                    {method.badge && (
                      <Badge variant="outline" className="text-xs text-champagne-600 border-champagne-300">
                        {method.badge}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{method.description}</p>
                </div>
              </div>
              {selectedMethod === method.id && (
                <Check className="w-5 h-5 text-champagne-600" />
              )}
            </div>

            {/* Method-specific features */}
            {method.id === 'apple-pay' && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Shield className="w-3 h-3" />
                <span>Face ID & Touch ID</span>
              </div>
            )}

            {method.id === 'google-pay' && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Shield className="w-3 h-3" />
                <span>Google Account</span>
              </div>
            )}

            {method.id === 'card' && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Shield className="w-3 h-3" />
                <span>SSL Encrypted</span>
              </div>
            )}

            {method.id === 'deposit' && (
              <div className="text-xs text-gray-600 mt-1">
                <div>Pay {amount * 0.2} {currency} now</div>
                <div>Pay remaining {amount * 0.8} {currency} at visit</div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Card Form */}
      {showCardForm && selectedMethod === 'card' && (
        <div className="p-4 border-2 border-gray-200 rounded-xl">
          <h3 className="font-medium mb-4">Card Details</h3>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Card Number"
              value={cardData.number}
              onChange={(e) => setCardData(prev => ({ ...prev, number: e.target.value }))}
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-champagne-400 focus:outline-none"
              maxLength={16}
            />

            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="MM/YY"
                value={cardData.expiry}
                onChange={(e) => setCardData(prev => ({ ...prev, expiry: e.target.value }))}
                className="p-3 border-2 border-gray-200 rounded-lg focus:border-champagne-400 focus:outline-none"
                maxLength={5}
              />
              <input
                type="text"
                placeholder="CVV"
                value={cardData.cvv}
                onChange={(e) => setCardData(prev => ({ ...prev, cvv: e.target.value }))}
                className="p-3 border-2 border-gray-200 rounded-lg focus:border-champagne-400 focus:outline-none"
                maxLength={4}
              />
            </div>

            <input
              type="text"
              placeholder="Name on Card"
              value={cardData.name}
              onChange={(e) => setCardData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-champagne-400 focus:outline-none"
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex-1"
          disabled={loading}
        >
          Back
        </Button>

        <Button
          onClick={handleSubmit}
          disabled={!selectedMethod || loading}
          className="flex-1 bg-gradient-to-r from-champagne to-bronze text-white"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              Pay {amount} {currency}
              {selectedMethod === 'deposit' && ` (Deposit: ${(amount * 0.2).toFixed(2)} ${currency})`}
            </>
          )}
        </Button>
      </div>

      {/* Security Information */}
      <div className="text-center text-xs text-gray-500 space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Shield className="w-4 h-4 text-green-500" />
          <span>SSL Encrypted • PCI DSS Compliant</span>
        </div>
        <div>
          <span>Your payment information is secure and never stored</span>
        </div>
      </div>
    </div>
  );
};