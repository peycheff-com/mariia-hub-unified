import React from 'react';
import { useTranslation } from 'react-i18next';
import { Clock, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CancellationPolicy } from '@/services/cancellationPolicy.service';

interface CancellationPolicyDisplayProps {
  policy: CancellationPolicy;
  bookingDate: Date;
  currentTime?: Date;
  compact?: boolean;
  showRefundCalculator?: boolean;
}

export const CancellationPolicyDisplay: React.FC<CancellationPolicyDisplayProps> = ({
  policy,
  bookingDate,
  currentTime = new Date(),
  compact = false,
  showRefundCalculator = false
}) => {
  const { t } = useTranslation();

  // Calculate hours until appointment
  const hoursUntilAppointment = (bookingDate.getTime() - currentTime.getTime()) / (1000 * 60 * 60);

  // Determine applicable refund policy
  const applicablePolicy = policy.noticePeriods
    .sort((a, b) => b.hoursBeforeAppointment - a.hoursBeforeAppointment)
    .find(period => hoursUntilAppointment >= period.hoursBeforeAppointment);

  const refundPercentage = applicablePolicy?.refundPercentage || 0;
  const isEligibleForRefund = refundPercentage > 0;

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Cancellation Policy</span>
          <Badge variant={isEligibleForRefund ? "secondary" : "destructive"}>
            {refundPercentage}% refund
          </Badge>
        </div>
        {applicablePolicy && (
          <p className="text-xs text-gray-600">{applicablePolicy.description}</p>
        )}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          {t('booking.cancellation.policy', 'Cancellation Policy')}
        </CardTitle>
        <CardDescription>
          {t('booking.cancellation.description', 'Review the cancellation terms for your appointment')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">Current Status</span>
            <Badge variant={isEligibleForRefund ? "secondary" : "destructive"}>
              {isEligibleForRefund ? 'Refund Eligible' : 'No Refund'}
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Hours until appointment:</span>
              <span className="font-medium">{Math.max(0, Math.round(hoursUntilAppointment))}h</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Refund percentage:</span>
              <span className="font-medium">{refundPercentage}%</span>
            </div>
            {policy.processingFee && policy.processingFee > 0 && (
              <div className="flex justify-between text-sm">
                <span>Processing fee:</span>
                <span className="font-medium">${policy.processingFee}</span>
              </div>
            )}
          </div>
        </div>

        {/* Notice Periods */}
        <div className="space-y-3">
          <h4 className="font-medium flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Refund Policy
          </h4>
          <div className="space-y-2">
            {policy.noticePeriods
              .sort((a, b) => b.hoursBeforeAppointment - a.hoursBeforeAppointment)
              .map((period, index) => {
                const isApplicable = hoursUntilAppointment >= period.hoursBeforeAppointment;
                return (
                  <div
                    key={index}
                    className={`p-3 border rounded-lg ${
                      isApplicable ? 'border-green-200 bg-green-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isApplicable ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-gray-400" />
                        )}
                        <span className="font-medium">{period.refundPercentage}% refund</span>
                      </div>
                      {period.feeAmount && (
                        <Badge variant="outline">
                          Fee: ${period.feeAmount}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{period.description}</p>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Special Conditions */}
        {policy.specialConditions && policy.specialConditions.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Special Conditions
            </h4>
            <div className="space-y-2">
              {policy.specialConditions.map((condition, index) => (
                <Alert key={index}>
                  <AlertDescription>
                    <div className="flex items-start gap-2">
                      <div className="mt-0.5">
                        {condition.waiverType === 'full_refund' && <CheckCircle className="h-4 w-4 text-green-600" />}
                        {condition.waiverType === 'partial_refund' && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                        {condition.waiverType === 'no_fee' && <CheckCircle className="h-4 w-4 text-blue-600" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{condition.description}</p>
                        {condition.documentation && (
                          <p className="text-sm text-gray-600 mt-1">
                            Documentation required
                          </p>
                        )}
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </div>
        )}

        {/* Cancellation Limits */}
        {policy.maxCancellationsPerPeriod && (
          <div className="space-y-3">
            <h4 className="font-medium">Cancellation Limits</h4>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                Maximum {policy.maxCancellationsPerPeriod.maxCancellations} cancellations per {policy.maxCancellationsPerPeriod.period}
              </p>
            </div>
          </div>
        )}

        {/* Refund Calculator */}
        {showRefundCalculator && (
          <div className="space-y-3">
            <h4 className="font-medium">Refund Calculator</h4>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Original amount:</span>
                  <span className="font-medium">$100.00</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Refund ({refundPercentage}%):</span>
                  <span className="font-medium text-green-600">${(100 * refundPercentage / 100).toFixed(2)}</span>
                </div>
                {policy.processingFee && policy.processingFee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Processing fee:</span>
                    <span className="font-medium text-red-600">-${policy.processingFee.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t pt-2">
                  <div className="flex justify-between font-medium">
                    <span>Total refund:</span>
                    <span className="text-green-600">
                      ${(Math.max(0, (100 * refundPercentage / 100) - (policy.processingFee || 0))).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Auto Refund Status */}
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          {policy.autoRefund ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-800">
                {t('booking.cancellation.autoRefund', 'Automatic refund will be processed to your original payment method')}
              </span>
            </>
          ) : (
            <>
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">
                {t('booking.cancellation.manualRefund', 'Refund will be processed manually within 3-5 business days')}
              </span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};