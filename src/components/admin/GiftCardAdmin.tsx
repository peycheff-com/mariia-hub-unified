import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Gift,
  Search,
  Download,
  Eye,
  Mail,
  Calendar,
  CreditCard,
  TrendingUp,
  Users,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { GiftCardService } from '@/services/giftCard.service';
import type { GiftCard, GiftCardStats, GiftCardTransaction } from '@/types/gift-card';
import { useCurrency } from '@/contexts/CurrencyContext';

export function GiftCardAdmin() {
  const { t } = useTranslation();
  const { formatPrice } = useCurrency();
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [selectedGiftCard, setSelectedGiftCard] = useState<GiftCard | null>(null);
  const [transactions, setTransactions] = useState<GiftCardTransaction[]>([]);
  const [stats, setStats] = useState<GiftCardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  const itemsPerPage = 10;

  useEffect(() => {
    loadData();
  }, [currentPage, statusFilter]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [giftCardsData, statsData] = await Promise.all([
        GiftCardService.getAllGiftCards({
          page: currentPage,
          limit: itemsPerPage,
          status: statusFilter === 'all' ? undefined : statusFilter,
          sortBy: 'created_at',
          sortOrder: 'desc',
        }),
        GiftCardService.getGiftCardStats(),
      ]);

      setGiftCards(giftCardsData.data);
      setStats(statsData);
      setTotalPages(Math.ceil(giftCardsData.total / itemsPerPage));
    } catch (error) {
      console.error('Error loading gift card data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTransactions = async (giftCardId: string) => {
    try {
      const transactionsData = await GiftCardService.getGiftCardTransactions(giftCardId);
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  };

  const handleViewDetails = async (giftCard: GiftCard) => {
    setSelectedGiftCard(giftCard);
    await loadTransactions(giftCard.id);
    setIsDetailsDialogOpen(true);
  };

  const handleStatusUpdate = async (giftCardId: string, isActive: boolean) => {
    try {
      await GiftCardService.updateGiftCardStatus(giftCardId, isActive);
      await loadData();
    } catch (error) {
      console.error('Error updating gift card status:', error);
    }
  };

  const handleResendEmail = async (giftCardId: string) => {
    try {
      // Implementation for resending gift card email
      console.log('Resend email for gift card:', giftCardId);
    } catch (error) {
      console.error('Error resending email:', error);
    }
  };

  const exportGiftCards = () => {
    const csv = [
      ['Code', 'Recipient', 'Email', 'Initial Balance', 'Current Balance', 'Status', 'Created', 'Expires'],
      ...giftCards.map(g => [
        g.card_code,
        g.recipient_name || 'N/A',
        g.recipient_email || 'N/A',
        formatPrice(g.initial_balance),
        formatPrice(g.current_balance),
        g.is_active ? 'Active' : 'Inactive',
        format(new Date(g.created_at), 'yyyy-MM-dd'),
        g.expiry_date ? format(new Date(g.expiry_date), 'yyyy-MM-dd') : 'Never',
      ]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gift-cards.csv';
    a.click();
  };

  const getGiftCardStatus = (giftCard: GiftCard) => {
    const now = new Date();
    const expiryDate = giftCard.expiry_date ? new Date(giftCard.expiry_date) : null;

    if (!giftCard.is_active) return { status: 'inactive', label: 'Nieaktywna', color: 'bg-gray-500' };
    if (expiryDate && now > expiryDate) return { status: 'expired', label: 'Wygasła', color: 'bg-red-500' };
    if (giftCard.current_balance === 0) return { status: 'empty', label: 'Wykorzystana', color: 'bg-orange-500' };
    return { status: 'active', label: 'Aktywna', color: 'bg-green-500' };
  };

  const filteredGiftCards = giftCards.filter(giftCard =>
    giftCard.card_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    giftCard.recipient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    giftCard.recipient_email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return <div className="p-6">{t('common.loading', 'Ładowanie...')}</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{t('admin.giftCards.title', 'Zarządzanie Voucherami Podarunkowymi')}</h1>
          <p className="text-muted-foreground">{t('admin.giftCards.subtitle', 'Przeglądaj i zarządzaj voucherami podarunkowymi')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportGiftCards}>
            <Download className="mr-2 h-4 w-4" />
            {t('admin.giftCards.export', 'Eksportuj')}
          </Button>
          <Button onClick={loadData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            {t('admin.giftCards.refresh', 'Odśwież')}
          </Button>
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
                  <p className="text-2xl font-bold">{stats.total_cards_sold}</p>
                  <p className="text-sm text-muted-foreground">{t('admin.giftCards.stats.total', 'Wszystkie vouchery')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold">{formatPrice(stats.total_revenue)}</p>
                  <p className="text-sm text-muted-foreground">{t('admin.giftCards.stats.revenue', 'Przychód')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <CreditCard className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold">{formatPrice(stats.total_active_balance)}</p>
                  <p className="text-sm text-muted-foreground">{t('admin.giftCards.stats.activeBalance', 'Aktywne saldo')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-8 w-8 text-purple-500" />
                <div>
                  <p className="text-2xl font-bold">{stats.redemption_rate.toFixed(1)}%</p>
                  <p className="text-sm text-muted-foreground">{t('admin.giftCards.stats.redemptionRate', 'Wskaźnik realizacji')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="search">{t('admin.giftCards.search', 'Szukaj')}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder={t('admin.giftCards.searchPlaceholder', 'Kod, email, nazwisko...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-48">
              <Label htmlFor="status">{t('admin.giftCards.status', 'Status')}</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('admin.giftCards.allStatuses', 'Wszystkie')}</SelectItem>
                  <SelectItem value="active">{t('admin.giftCards.active', 'Aktywne')}</SelectItem>
                  <SelectItem value="inactive">{t('admin.giftCards.inactive', 'Nieaktywne')}</SelectItem>
                </Select>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gift Cards Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin.giftCards.list', 'Lista voucherów')}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('admin.giftCards.table.code', 'Kod')}</TableHead>
                <TableHead>{t('admin.giftCards.table.recipient', 'Odbiorca')}</TableHead>
                <TableHead>{t('admin.giftCards.table.balance', 'Saldo')}</TableHead>
                <TableHead>{t('admin.giftCards.table.status', 'Status')}</TableHead>
                <TableHead>{t('admin.giftCards.table.created', 'Utworzono')}</TableHead>
                <TableHead>{t('admin.giftCards.table.actions', 'Akcje')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGiftCards.map((giftCard) => {
                const status = getGiftCardStatus(giftCard);
                return (
                  <TableRow key={giftCard.id}>
                    <TableCell>
                      <code className="bg-muted px-2 py-1 rounded text-sm">{giftCard.card_code}</code>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{giftCard.recipient_name || 'N/A'}</div>
                        <div className="text-sm text-muted-foreground">{giftCard.recipient_email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{formatPrice(giftCard.current_balance)}</div>
                        <div className="text-xs text-muted-foreground">
                          z {formatPrice(giftCard.initial_balance)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(status.color, 'text-white')}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{format(new Date(giftCard.created_at), 'dd MMM yyyy')}</div>
                        {giftCard.expiry_date && (
                          <div className="text-muted-foreground">
                            {t('admin.giftCards.expires', 'Wygasa')} {format(new Date(giftCard.expiry_date), 'dd MMM yyyy')}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDetails(giftCard)}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        {giftCard.is_active && giftCard.delivery_status !== 'delivered' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleResendEmail(giftCard.id)}
                          >
                            <Mail className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleStatusUpdate(giftCard.id, !giftCard.is_active)}
                        >
                          {giftCard.is_active ? (
                            <XCircle className="h-3 w-3" />
                          ) : (
                            <CheckCircle className="h-3 w-3" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                {t('common.previous', 'Poprzednia')}
              </Button>
              <span className="flex items-center px-3 text-sm text-muted-foreground">
                {t('admin.giftCards.pagination', 'Strona {{current}} z {{total}}', {
                  current: currentPage,
                  total: totalPages,
                })}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                {t('common.next', 'Następna')}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Gift Card Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('admin.giftCards.details', 'Szczegóły vouchera')}</DialogTitle>
          </DialogHeader>
          {selectedGiftCard && (
            <Tabs defaultValue="details" className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="details">{t('admin.giftCards.tabs.details', 'Szczegóły')}</TabsTrigger>
                <TabsTrigger value="transactions">{t('admin.giftCards.tabs.transactions', 'Transakcje')}</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>{t('admin.giftCards.code', 'Kod vouchera')}</Label>
                    <p className="font-mono text-lg">{selectedGiftCard.card_code}</p>
                  </div>
                  <div>
                    <Label>{t('admin.giftCards.status', 'Status')}</Label>
                    <Badge className={cn(getGiftCardStatus(selectedGiftCard).color, 'text-white')}>
                      {getGiftCardStatus(selectedGiftCard).label}
                    </Badge>
                  </div>
                  <div>
                    <Label>{t('admin.giftCards.recipient', 'Odbiorca')}</Label>
                    <p>{selectedGiftCard.recipient_name || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">{selectedGiftCard.recipient_email}</p>
                  </div>
                  <div>
                    <Label>{t('admin.giftCards.deliveryStatus', 'Status dostawy')}</Label>
                    <p>{selectedGiftCard.delivery_status}</p>
                  </div>
                  <div>
                    <Label>{t('admin.giftCards.initialBalance', 'Saldo początkowe')}</Label>
                    <p className="font-semibold">{formatPrice(selectedGiftCard.initial_balance)}</p>
                  </div>
                  <div>
                    <Label>{t('admin.giftCards.currentBalance', 'Aktualne saldo')}</Label>
                    <p className="font-semibold text-lg">{formatPrice(selectedGiftCard.current_balance)}</p>
                  </div>
                  <div>
                    <Label>{t('admin.giftCards.purchaseDate', 'Data zakupu')}</Label>
                    <p>{format(new Date(selectedGiftCard.purchase_date), 'PPP')}</p>
                  </div>
                  <div>
                    <Label>{t('admin.giftCards.expiryDate', 'Data ważności')}</Label>
                    <p>
                      {selectedGiftCard.expiry_date
                        ? format(new Date(selectedGiftCard.expiry_date), 'PPP')
                        : t('admin.giftCards.never', 'Nigdy')}
                    </p>
                  </div>
                </div>

                {selectedGiftCard.message && (
                  <div>
                    <Label>{t('admin.giftCards.message', 'Wiadomość')}</Label>
                    <p className="text-sm bg-muted p-3 rounded">{selectedGiftCard.message}</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="transactions" className="space-y-4">
                {transactions.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('admin.giftCards.transactions.date', 'Data')}</TableHead>
                        <TableHead>{t('admin.giftCards.transactions.type', 'Typ')}</TableHead>
                        <TableHead>{t('admin.giftCards.transactions.amount', 'Kwota')}</TableHead>
                        <TableHead>{t('admin.giftCards.transactions.description', 'Opis')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            {format(new Date(transaction.created_at), 'dd MMM yyyy HH:mm')}
                          </TableCell>
                          <TableCell>
                            <Badge variant={transaction.transaction_type === 'redemption' ? 'default' : 'secondary'}>
                              {transaction.transaction_type}
                            </Badge>
                          </TableCell>
                          <TableCell className={cn(
                            'font-medium',
                            transaction.transaction_type === 'redemption' ? 'text-red-600' : 'text-green-600'
                          )}>
                            {transaction.transaction_type === 'redemption' ? '-' : '+'}
                            {formatPrice(transaction.amount)}
                          </TableCell>
                          <TableCell className="text-sm">{transaction.description || '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {t('admin.giftCards.noTransactions', 'Brak transakcji')}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}