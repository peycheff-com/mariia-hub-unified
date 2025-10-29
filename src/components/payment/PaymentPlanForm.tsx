import React, { useState } from 'react';
import { CalendarIcon, Calculator, CreditCard, Info } from 'lucide-react';
import { format } from 'date-fns';
import { pl } from 'date-fns/locale';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { usePaymentPlanForm, useCreatePaymentPlan } from '@/hooks/usePaymentSystem';
import { PaymentPlan } from '@/types/payment-loyalty';

interface PaymentPlanFormProps {
  bookingId: string;
  totalAmount: number;
  currency?: string;
  onSuccess?: (paymentPlan: PaymentPlan) => void;
  onCancel?: () => void;
}

export function PaymentPlanForm({
  bookingId,
  totalAmount,
  currency = 'PLN',
  onSuccess,
  onCancel
}: PaymentPlanFormProps) {
  const { formData, errors, validateForm, updateField } = usePaymentPlanForm();
  const createPaymentPlan = useCreatePaymentPlan();

  const [showSchedule, setShowSchedule] = useState(false);

  // Calculate installment details
  const depositAmount = formData.depositAmount;
  const financedAmount = totalAmount - depositAmount;
  const installmentAmount = financedAmount / formData.numberOfInstallments;
  const totalInterest = financedAmount * 0.05; // 5% interest for payment plans
  const totalWithInterest = financedAmount + totalInterest;
  const monthlyInstallment = totalWithInterest / formData.numberOfInstallments;

  // Generate installment schedule
  const generateInstallmentSchedule = () => {
    const schedule = [];
    const startDate = new Date();

    for (let i = 1; i <= formData.numberOfInstallments; i++) {
      const dueDate = new Date(startDate);
      dueDate.setMonth(dueDate.getMonth() + i);

      schedule.push({
        installmentNumber: i,
        dueDate,
        amount: monthlyInstallment
      });
    }

    return schedule;
  };

  const installmentSchedule = generateInstallmentSchedule();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm(totalAmount)) {
      return;
    }

    const result = await createPaymentPlan.mutateAsync({
      bookingId,
      totalAmount,
      numberOfInstallments: formData.numberOfInstallments,
      depositAmount: formData.depositAmount,
      installmentSchedule: installmentSchedule
    });

    if (result.success && result.data) {
      onSuccess?.(result.data);
    }
  };

  if (createPaymentPlan.isPending) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Creating payment plan...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Plan
        </CardTitle>
        <CardDescription>
          Split your payment into manageable installments with a small interest fee
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {createPaymentPlan.error && (
          <Alert variant="destructive">
            <AlertDescription>
              {createPaymentPlan.error.message}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Total Amount</Label>
            <div className="text-2xl font-bold">
              {totalAmount.toFixed(2)} {currency}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Financed Amount</Label>
            <div className="text-2xl font-bold text-primary">
              {financedAmount.toFixed(2)} {currency}
            </div>
          </div>
        </div>

        <Separator />

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numberOfInstallments">
                Number of Installments
              </Label>
              <Select
                value={formData.numberOfInstallments.toString()}
                onValueChange={(value) => updateField('numberOfInstallments', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2, 3, 4, 6, 9, 12].map(num => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} {num === 1 ? 'month' : 'months'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.numberOfInstallments && (
                <p className="text-sm text-destructive">{errors.numberOfInstallments}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="depositAmount">
                Optional Deposit
              </Label>
              <Input
                id="depositAmount"
                type="number"
                min="0"
                max={totalAmount * 0.5}
                step="10"
                value={formData.depositAmount}
                onChange={(e) => updateField('depositAmount', parseFloat(e.target.value) || 0)}
              />
              {errors.depositAmount && (
                <p className="text-sm text-destructive">{errors.depositAmount}</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Payment Method</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value) => updateField('paymentMethod', value)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="card">Credit Card</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                  <SelectItem value="online">Online Payment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {errors.paymentMethod && (
              <p className="text-sm text-destructive">{errors.paymentMethod}</p>
            )}
          </div>

          {/* Payment Summary */}
          <Card className="bg-muted/30">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Financed Amount:</span>
                  <span>{financedAmount.toFixed(2)} {currency}</span>
                </div>
                <div className="flex justify-between">
                  <span>Interest (5%):</span>
                  <span>{totalInterest.toFixed(2)} {currency}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total with Interest:</span>
                  <span>{totalWithInterest.toFixed(2)} {currency}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-primary">
                  <span>Monthly Installment:</span>
                  <span>{monthlyInstallment.toFixed(2)} {currency}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Installment Schedule Preview */}
          <div className="space-y-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowSchedule(!showSchedule)}
              className="w-full"
            >
              <Calculator className="h-4 w-4 mr-2" />
              {showSchedule ? 'Hide' : 'Show'} Installment Schedule
            </Button>

            {showSchedule && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Payment Schedule</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {installmentSchedule.map((installment) => (
                    <div
                      key={installment.installmentNumber}
                      className="flex items-center justify-between p-2 rounded-lg border"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          #{installment.installmentNumber}
                        </Badge>
                        <span className="text-sm">
                          {format(installment.dueDate, 'MMMM yyyy', { locale: pl })}
                        </span>
                      </div>
                      <span className="font-medium">
                        {installment.amount.toFixed(2)} {currency}
                      </span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Terms and Conditions */}
          <div className="space-y-3">
            <div className="flex items-start space-x-2">
              <Checkbox
                id="agreeToTerms"
                checked={formData.agreeToTerms}
                onCheckedChange={(checked) => updateField('agreeToTerms', checked)}
              />
              <div className="grid gap-1.5 leading-none">
                <Label
                  htmlFor="agreeToTerms"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  I agree to the payment plan terms and conditions
                </Label>
                <p className="text-xs text-muted-foreground">
                  By agreeing, you commit to paying all installments on time.
                  Late payments may incur additional fees.
                  The payment plan is subject to a 5% interest rate.
                </p>
              </div>
            </div>
            {errors.agreeToTerms && (
              <p className="text-sm text-destructive">{errors.agreeToTerms}</p>
            )}
          </div>

          {/* Info Alert */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              The first installment will be charged immediately.
              Subsequent installments will be automatically charged on the due dates.
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
              disabled={createPaymentPlan.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={createPaymentPlan.isPending}
            >
              Create Payment Plan
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}