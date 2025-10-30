import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Camera, CameraOff, CheckCircle, XCircle, Clock, MapPin, User, Calendar, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast aria-live="polite" aria-atomic="true"';
import { supabase } from '@/integrations/supabase/client';


interface QRCheckInProps {
  bookingId: string;
  onCheckInComplete?: (success: boolean) => void;
}

interface CheckInData {
  bookingId: string;
  clientId?: string;
  timestamp: number;
  signature: string;
}

interface BookingDetails {
  id: string;
  service_name: string;
  client_name: string;
  appointment_time: string;
  status: string;
  location?: string;
}

export function QRCheckIn({ bookingId, onCheckInComplete }: QRCheckInProps) {
  const { t } = useTranslation();
  const { toast aria-live="polite" aria-atomic="true" } = useToast();
  const [qrData, setQrData] = useState<string>('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [checkInStatus, setCheckInStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
  const [bookingDetails, setBookingDetails] = useState<BookingDetails | null>(null);
  const [lastScanResult, setLastScanResult] = useState<string>('');
  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    generateQRCode();
    fetchBookingDetails();
    checkCameraPermission();

    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch (error) {
          console.error('Error clearing scanner:', error);
        }
      }
    };
  }, [bookingId]);

  const generateQRCode = async () => {
    const checkInData: CheckInData = {
      bookingId,
      timestamp: Date.now(),
      signature: generateSignature(bookingId),
    };

    const qrString = JSON.stringify(checkInData);
    setQrData(qrString);
  };

  const generateSignature = (id: string): string => {
    // Simple signature - in production, use proper HMAC
    const secret = import.meta.env.VITE_QR_SECRET || 'default-secret';
    const timestamp = Date.now().toString();
    return btoa(`${id}-${timestamp}-${secret}`);
  };

  const fetchBookingDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          status,
          appointment_time,
          services!inner(name),
          profiles!inner(name)
        `)
        .eq('id', bookingId)
        .single();

      if (error) throw error;

      setBookingDetails({
        id: data.id,
        service_name: data.services.name,
        client_name: data.profiles.name,
        appointment_time: data.appointment_time,
        status: data.status,
      });
    } catch (error) {
      console.error('Error fetching booking details:', error);
    }
  };

  const checkCameraPermission = async () => {
    try {
      const result = await navigator.permissions.query({ name: 'camera' as PermissionName });
      setCameraPermission(result.state === 'granted');
      result.addEventListener('change', () => {
        setCameraPermission(result.state === 'granted');
      });
    } catch (error) {
      console.error('Camera permission check failed:', error);
      setCameraPermission(null);
    }
  };

  const startScanner = async () => {
    setScanning(true);
    setScannerOpen(true);

    try {
      const scanner = new Html5QrcodeScanner(
        'qr-reader',
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        },
        false
      );

      scannerRef.current = scanner;

      scanner.render(
        async (decodedText) => {
          await handleScanSuccess(decodedText);
        },
        (errorMessage) => {
          // Handle scan error silently
        }
      );
    } catch (error) {
      console.error('Error starting scanner:', error);
      setScanning(false);
      setScannerOpen(false);
      toast aria-live="polite" aria-atomic="true"({
        title: t('qr.scanError'),
        description: t('qr.scanErrorDesc'),
        variant: 'destructive',
      });
    }
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
      } catch (error) {
        console.error('Error stopping scanner:', error);
      }
    }
    setScanning(false);
    setScannerOpen(false);
  };

  const handleScanSuccess = async (decodedText: string) => {
    setLastScanResult(decodedText);
    setCheckInStatus('scanning');
    stopScanner();

    try {
      const data: CheckInData = JSON.parse(decodedText);

      // Verify the QR code is for this booking
      if (data.bookingId !== bookingId) {
        throw new Error('Invalid booking ID');
      }

      // Verify signature (simplified)
      const expectedSignature = generateSignature(data.bookingId);
      if (data.signature !== expectedSignature) {
        throw new Error('Invalid signature');
      }

      // Check if not too old (5 minutes)
      const age = Date.now() - data.timestamp;
      if (age > 5 * 60 * 1000) {
        throw new Error('QR code expired');
      }

      // Process check-in
      await processCheckIn(data.bookingId);
      setCheckInStatus('success');

      toast aria-live="polite" aria-atomic="true"({
        title: t('qr.checkInSuccess'),
        description: t('qr.checkInSuccessDesc'),
      });

      onCheckInComplete?.(true);
    } catch (error) {
      console.error('Check-in error:', error);
      setCheckInStatus('error');

      toast aria-live="polite" aria-atomic="true"({
        title: t('qr.checkInError'),
        description: error instanceof Error ? error.message : t('qr.checkInErrorDesc'),
        variant: 'destructive',
      });

      onCheckInComplete?.(false);
    }
  };

  const processCheckIn = async (bookingId: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          status: 'checked_in',
          checked_in_at: new Date().toISOString(),
          check_in_method: 'qr_code',
        })
        .eq('id', bookingId);

      if (error) throw error;

      // Log the check-in for analytics
      await supabase.from('check_ins').insert({
        booking_id: bookingId,
        method: 'qr_code',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error processing check-in:', error);
      throw error;
    }
  };

  const refreshQR = () => {
    generateQRCode();
    setCheckInStatus('idle');
    setLastScanResult('');
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          {t('qr.checkInTitle')}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {bookingDetails && (
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span>{bookingDetails.client_name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{new Date(bookingDetails.appointment_time).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={bookingDetails.status === 'confirmed' ? 'default' : 'secondary'}>
                {bookingDetails.status}
              </Badge>
            </div>
          </div>
        )}

        {qrData && (
          <div className="flex flex-col items-center space-y-4">
            <div className="p-4 bg-white rounded-lg border">
              <QRCodeSVG
                value={qrData}
                size={200}
                level="H"
                includeMargin={true}
              />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              {t('qr.qrInstructions')}
            </p>
            <Button variant="outline" size="sm" onClick={refreshQR}>
              <RefreshCw className="h-4 w-4 mr-2" />
              {t('qr.refreshQR')}
            </Button>
          </div>
        )}

        <div className="flex items-center justify-center">
          <Dialog open={scannerOpen} onOpenChange={setScannerOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={startScanner}
                disabled={scanning || cameraPermission === false}
                className="w-full"
              >
                {cameraPermission === false ? (
                  <>
                    <CameraOff className="h-4 w-4 mr-2" />
                    {t('qr.cameraBlocked')}
                  </>
                ) : (
                  <>
                    <Camera className="h-4 w-4 mr-2" />
                    {t('qr.scanQR')}
                  </>
                )}
              </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{t('qr.scanQRTitle')}</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div id="qr-reader" className="w-full" />
                <div className="flex justify-center">
                  <Button variant="outline" onClick={stopScanner}>
                    {t('qr.cancelScan')}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {checkInStatus === 'success' && (
          <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              {t('qr.checkInComplete')}
            </AlertDescription>
          </Alert>
        )}

        {checkInStatus === 'error' && (
          <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              {t('qr.checkInFailed')}
            </AlertDescription>
          </Alert>
        )}

        {lastScanResult && checkInStatus === 'idle' && (
          <div className="text-xs text-muted-foreground">
            {t('qr.lastScan')}: {lastScanResult.substring(0, 50)}...
          </div>
        )}

        <Alert>
          <Clock className="h-4 w-4" />
          <AlertDescription>
            {t('qr.validityInfo')}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}