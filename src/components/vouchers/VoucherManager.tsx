import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Gift,
  Plus,
  Edit,
  Trash2,
  Copy,
  Download,
  CalendarIcon,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Users,
  Percent,
  DollarSign,
  GiftIcon
} from 'lucide-react';
import { format } from 'date-fns';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { GiftCardService } from '@/services/giftCard.service';

import type { PromotionalVoucher, VoucherGenerationData, VoucherStats } from '@/types/gift-card';

export function VoucherManager() {
  const { t } = useTranslation();
  const [vouchers, setVouchers] = useState<PromotionalVoucher[]>([]);
  const [stats, setStats] = useState<VoucherStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<PromotionalVoucher | null>(null);
  const [selectedVouchers, setSelectedVouchers] = useState<string[]>([]);

  // Form state
  const [formData, setFormData] = useState<VoucherGenerationData>({
    name: '',
    description: '',
    discount_type: 'percentage',
    discount_value: 0,
    minimum_amount: undefined,
    maximum_discount: undefined,
    usage_limit: 1,
    user_usage_limit: 1,
    valid_from: undefined,
    valid_until: undefined,
    applicable_services: [],
    applicable_categories: [],
    first_time_customers: false,
    campaign_id: undefined,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [vouchersData, statsData] = await Promise.all([
        GiftCardService.getActiveVouchers(),
        GiftCardService.getVoucherStats(),
      ]);
      setVouchers(vouchersData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading voucher data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newVoucher = await GiftCardService.createVoucher(formData);
      setVouchers(prev => [newVoucher, ...prev]);
      setIsCreateDialogOpen(false);
      resetForm();
      await loadData(); // Refresh stats
    } catch (error) {
      console.error('Error creating voucher:', error);
    }
  };

  const handleUpdateVoucher = async () => {
    if (!editingVoucher) return;
    // Implementation for updating voucher
    console.log('Update voucher:', editingVoucher);
  };

  const handleDeactivateVoucher = async (voucherId: string) => {
    try {
      await GiftCardService.deactivateVoucher(voucherId);
      setVouchers(prev => prev.map(v =>
        v.id === voucherId ? { ...v, is_active: false } : v
      ));
    } catch (error) {
      console.error('Error deactivating voucher:', error);
    }
  };

  const handleBulkGenerate = async () => {
    try {
      const quantity = 10; // Default bulk quantity
      const newVouchers = await GiftCardService.generateBulkVouchers(formData, quantity);
      setVouchers(prev => [...newVouchers, ...prev]);
      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error generating bulk vouchers:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 0,
      minimum_amount: undefined,
      maximum_discount: undefined,
      usage_limit: 1,
      user_usage_limit: 1,
      valid_from: undefined,
      valid_until: undefined,
      applicable_services: [],
      applicable_categories: [],
      first_time_customers: false,
      campaign_id: undefined,
    });
    setEditingVoucher(null);
  };

  const copyVoucherCode = (code: string) => {
    navigator.clipboard.writeText(code);
  };

  const exportVouchers = () => {
    const csv = [
      ['Code', 'Name', 'Type', 'Value', 'Usage', 'Status'],
      ...vouchers.map(v => [
        v.code,
        v.name,
        v.discount_type,
        v.discount_value.toString(),
        `${v.usage_count}/${v.usage_limit}`,
        v.is_active ? 'Active' : 'Inactive',
      ]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vouchers.csv';
    a.click();
  };

  const getVoucherStatus = (voucher: PromotionalVoucher) => {
    const now = new Date();
    const validFrom = voucher.valid_from ? new Date(voucher.valid_from) : null;
    const validUntil = voucher.valid_until ? new Date(voucher.valid_until) : null;

    if (!voucher.is_active) return { status: 'inactive', label: 'Nieaktywny', color: 'bg-gray-500' };
    if (validFrom && now < validFrom) return { status: 'scheduled', label: 'Zaplanowany', color: 'bg-blue-500' };
    if (validUntil && now > validUntil) return { status: 'expired', label: 'Wygasł', color: 'bg-red-500' };
    if (voucher.usage_count >= voucher.usage_limit) return { status: 'used', label: 'Wykorzystany', color: 'bg-orange-500' };
    return { status: 'active', label: 'Aktywny', color: 'bg-green-500' };
  };

  if (isLoading) {
    return <div className="p-6">{t('common.loading', 'Ładowanie...')}</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{t('vouchers.title', 'Zarządzanie Kuponami Promocyjnymi')}</h1>
          <p className="text-muted-foreground">{t('vouchers.subtitle', 'Twórz i zarządzaj kodami promocyjnymi')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportVouchers}>
            <Download className="mr-2 h-4 w-4" />
            {t('vouchers.export', 'Eksportuj')}
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="mr-2 h-4 w-4" />
                {t('vouchers.create', 'Utwórz kupon')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingVoucher ? t('vouchers.edit', 'Edytuj kupon') : t('vouchers.createNew', 'Utwórz nowy kupon')}
                </DialogTitle>
              </DialogHeader>
              <VoucherForm
                formData={formData}
                setFormData={setFormData}
                onSubmit={editingVoucher ? handleUpdateVoucher : handleCreateVoucher}
                onBulkGenerate={!editingVoucher ? handleBulkGenerate : undefined}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Gift className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.total_vouchers_created}</p>
                  <p className="text-sm text-muted-foreground">{t('vouchers.stats.total', 'Wszystkie kupony')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.total_vouchers_used}</p>
                  <p className="text-sm text-muted-foreground">{t('vouchers.stats.used', 'Wykorzystane')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.usage_rate.toFixed(1)}%</p>
                  <p className="text-sm text-muted-foreground">{t('vouchers.stats.rate', 'Wskaźnik użycia')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{formatPrice(stats.total_discount_given)}</p>
                  <p className="text-sm text-muted-foreground">{t('vouchers.stats.discount', 'Całkowity rabat')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Vouchers Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('vouchers.list', 'Lista kuponów')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('vouchers.table.code', 'Kod')}</TableHead>
                <TableHead>{t('vouchers.table.name', 'Nazwa')}</TableHead>
                <TableHead>{t('vouchers.table.discount', 'Rabat')}</TableHead>
                <TableHead>{t('vouchers.table.usage', 'Użycie')}</TableHead>
                <TableHead>{t('vouchers.table.validity', 'Ważność')}</TableHead>
                <TableHead>{t('vouchers.table.status', 'Status')}</TableHead>
                <TableHead>{t('vouchers.table.actions', 'Akcje')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vouchers.map((voucher) => {
                const status = getVoucherStatus(voucher);
                return (
                  <TableRow key={voucher.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="bg-muted px-2 py-1 rounded text-sm">{voucher.code}</code>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyVoucherCode(voucher.code)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{voucher.name}</div>
                        {voucher.description && (
                          <div className="text-sm text-muted-foreground">{voucher.description}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {voucher.discount_type === 'percentage' ? (
                          <Percent className="h-4 w-4" />
                        ) : (
                          <DollarSign className="h-4 w-4" />
                        )}
                        <span>
                          {voucher.discount_type === 'percentage'
                            ? `${voucher.discount_value}%`
                            : formatPrice(voucher.discount_value)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {voucher.usage_count} / {voucher.usage_limit}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {voucher.valid_from && (
                          <div>{t('vouchers.from', 'Od')} {format(new Date(voucher.valid_from), 'PPP')}</div>
                        )}
                        {voucher.valid_until && (
                          <div>{t('vouchers.until', 'Do')} {format(new Date(voucher.valid_until), 'PPP')}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(status.color, 'text-white')}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingVoucher(voucher);
                            setIsCreateDialogOpen(true);
                          }}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        {voucher.is_active && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeactivateVoucher(voucher.id)}
                          >
                            <XCircle className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function VoucherForm({
  formData,
  setFormData,
  onSubmit,
  onBulkGenerate,
}: {
  formData: VoucherGenerationData;
  setFormData: (data: VoucherGenerationData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBulkGenerate?: () => void;
}) {
  const { t } = useTranslation();

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">{t('vouchers.form.name', 'Nazwa kuponu')}</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder={t('vouchers.form.namePlaceholder', 'Wpisz nazwę kuponu')}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="code">{t('vouchers.form.code', 'Kod')}</Label>
          <Input
            id="code"
            value={formData.name.toUpperCase().replace(/\s+/g, '_')}
            disabled
            placeholder={t('vouchers.form.autoGenerated', 'Generowany automatycznie')}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t('vouchers.form.description', 'Opis (opcjonalnie)')}</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder={t('vouchers.form.descriptionPlaceholder', 'Opis kuponu promocyjnego')}
          rows={3}
        />
      </div>

      <div className="space-y-4">
        <Label>{t('vouchers.form.discountType', 'Typ rabatu')}</Label>
        <RadioGroup
          value={formData.discount_type}
          onValueChange={(value: any) => setFormData({ ...formData, discount_type: value })}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="percentage" id="percentage" />
            <Label htmlFor="percentage">{t('vouchers.form.percentage', 'Procentowy')}</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="fixed_amount" id="fixed" />
            <Label htmlFor="fixed">{t('vouchers.form.fixed', 'Kwotowy')}</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="free_service" id="free" />
            <Label htmlFor="free">{t('vouchers.form.free', 'Darmowa usługa')}</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="discount-value">
            {formData.discount_type === 'percentage'
              ? t('vouchers.form.percentageValue', 'Wartość %')
              : t('vouchers.form.amountValue', 'Kwota')}
          </Label>
          <Input
            id="discount-value"
            type="number"
            value={formData.discount_value}
            onChange={(e) => setFormData({ ...formData, discount_value: parseFloat(e.target.value) || 0 })}
            min={0}
            max={formData.discount_type === 'percentage' ? 100 : undefined}
            step={formData.discount_type === 'percentage' ? 1 : 0.01}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="min-amount">{t('vouchers.form.minAmount', 'Minimalna kwota')}</Label>
          <Input
            id="min-amount"
            type="number"
            value={formData.minimum_amount || ''}
            onChange={(e) => setFormData({ ...formData, minimum_amount: parseFloat(e.target.value) || undefined })}
            min={0}
            step={0.01}
            placeholder={t('vouchers.form.noMin', 'Brak')}
          />
        </div>

        {formData.discount_type === 'percentage' && (
          <div className="space-y-2">
            <Label htmlFor="max-discount">{t('vouchers.form.maxDiscount', 'Maksymalny rabat')}</Label>
            <Input
              id="max-discount"
              type="number"
              value={formData.maximum_discount || ''}
              onChange={(e) => setFormData({ ...formData, maximum_discount: parseFloat(e.target.value) || undefined })}
              min={0}
              step={0.01}
              placeholder={t('vouchers.form.noMax', 'Brak')}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="usage-limit">{t('vouchers.form.usageLimit', 'Limit użycia')}</Label>
          <Input
            id="usage-limit"
            type="number"
            value={formData.usage_limit}
            onChange={(e) => setFormData({ ...formData, usage_limit: parseInt(e.target.value) || 1 })}
            min={1}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="user-limit">{t('vouchers.form.userLimit', 'Limit na użytkownika')}</Label>
          <Input
            id="user-limit"
            type="number"
            value={formData.user_usage_limit}
            onChange={(e) => setFormData({ ...formData, user_usage_limit: parseInt(e.target.value) || 1 })}
            min={1}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('vouchers.form.validFrom', 'Ważny od')}</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.valid_from && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.valid_from ? format(new Date(formData.valid_from), "PPP") : t('vouchers.form.pickDate', 'Wybierz datę')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.valid_from ? new Date(formData.valid_from) : undefined}
                onSelect={(date) => setFormData({ ...formData, valid_from: date?.toISOString() })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <div className="space-y-2">
          <Label>{t('vouchers.form.validUntil', 'Ważny do')}</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !formData.valid_until && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.valid_until ? format(new Date(formData.valid_until), "PPP") : t('vouchers.form.pickDate', 'Wybierz datę')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={formData.valid_until ? new Date(formData.valid_until) : undefined}
                onSelect={(date) => setFormData({ ...formData, valid_until: date?.toISOString() })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="first-time"
          checked={formData.first_time_customers}
          onCheckedChange={(checked) => setFormData({ ...formData, first_time_customers: checked as boolean })}
        />
        <Label htmlFor="first-time">
          {t('vouchers.form.firstTimeOnly', 'Tylko dla nowych klientów')}
        </Label>
      </div>

      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          {t('vouchers.form.create', 'Utwórz kupon')}
        </Button>
        {onBulkGenerate && (
          <Button type="button" variant="outline" onClick={onBulkGenerate}>
            {t('vouchers.form.bulk', 'Generuj 10 sztuk')}
          </Button>
        )}
      </div>
    </form>
  );
}

// Helper function for price formatting
function formatPrice(amount: number): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
  }).format(amount);
}