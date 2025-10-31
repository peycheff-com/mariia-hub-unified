import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Home,
  Building,
  Navigation,
  Star,
  Search,
  Globe,
  Phone
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { UserAddress } from '@/types/user';
import { addressService } from '@/services/address.service';

const addressSchema = z.object({
  label: z.enum(['home', 'work', 'other']),
  address: z.object({
    street: z.string().min(1, 'Street address is required'),
    city: z.string().min(1, 'City is required'),
    postal_code: z.string().min(1, 'Postal code is required'),
    country: z.string().optional(),
  }),
  is_default: z.boolean().default(false),
});

type AddressFormData = z.infer<typeof addressSchema>;

const AddressBook: React.FC = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<UserAddress | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch addresses
  const { data: addresses, isLoading } = useQuery({
    queryKey: ['user-addresses'],
    queryFn: () => addressService.getUserAddresses(),
    staleTime: 5 * 60 * 1000,
  });

  // Add address mutation
  const addAddressMutation = useMutation({
    mutationFn: (data: AddressFormData) => addressService.addAddress(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-addresses'] });
      setIsAddDialogOpen(false);
      toast.success(t('user.addressBook.addSuccess'));
    },
    onError: () => {
      toast.error(t('user.addressBook.addError'));
    },
  });

  // Update address mutation
  const updateAddressMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AddressFormData }) =>
      addressService.updateAddress(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-addresses'] });
      setEditingAddress(null);
      toast.success(t('user.addressBook.updateSuccess'));
    },
    onError: () => {
      toast.error(t('user.addressBook.updateError'));
    },
  });

  // Delete address mutation
  const deleteAddressMutation = useMutation({
    mutationFn: (id: string) => addressService.deleteAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-addresses'] });
      toast.success(t('user.addressBook.deleteSuccess'));
    },
    onError: () => {
      toast.error(t('user.addressBook.deleteError'));
    },
  });

  // Set default address mutation
  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => addressService.setDefaultAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-addresses'] });
      toast.success(t('user.addressBook.setDefaultSuccess'));
    },
    onError: () => {
      toast.error(t('user.addressBook.setDefaultError'));
    },
  });

  const form = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: 'home',
      address: {
        street: '',
        city: '',
        postal_code: '',
        country: 'Poland',
      },
      is_default: false,
    },
  });

  const handleEdit = (address: UserAddress) => {
    setEditingAddress(address);
    form.reset({
      label: address.label,
      address: {
        street: address.address.street,
        city: address.address.city,
        postal_code: address.address.postal_code,
        country: address.address.country || 'Poland',
      },
      is_default: address.is_default,
    });
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t('user.addressBook.deleteConfirm'))) {
      deleteAddressMutation.mutate(id);
    }
  };

  const handleSetDefault = (id: string) => {
    setDefaultMutation.mutate(id);
  };

  const onSubmit = (data: AddressFormData) => {
    if (editingAddress) {
      updateAddressMutation.mutate({ id: editingAddress.id, data });
    } else {
      addAddressMutation.mutate(data);
    }
  };

  const filteredAddresses = addresses?.filter((address: UserAddress) =>
    address.address.street.toLowerCase().includes(searchQuery.toLowerCase()) ||
    address.address.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    address.address.postal_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getAddressIcon = (label: string) => {
    switch (label) {
      case 'home':
        return <Home className="h-5 w-5" />;
      case 'work':
        return <Building className="h-5 w-5" />;
      default:
        return <Navigation className="h-5 w-5" />;
    }
  };

  const getAddressLabelColor = (label: string) => {
    switch (label) {
      case 'home':
        return 'bg-blue-100 text-blue-800';
      case 'work':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <AddressBookSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {t('user.addressBook.title')}
          </h2>
          <p className="text-gray-600 mt-1">
            {t('user.addressBook.description')}
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="shrink-0">
              <Plus className="h-4 w-4 mr-2" />
              {t('user.addressBook.addNew')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{t('user.addressBook.addAddress')}</DialogTitle>
              <DialogDescription>
                {t('user.addressBook.addAddressDesc')}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="label"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('user.addressBook.fields.label')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="home">{t('user.addressBook.labels.home')}</SelectItem>
                          <SelectItem value="work">{t('user.addressBook.labels.work')}</SelectItem>
                          <SelectItem value="other">{t('user.addressBook.labels.other')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address.street"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('user.addressBook.fields.street')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('user.addressBook.placeholders.street')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="address.city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('user.addressBook.fields.city')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('user.addressBook.placeholders.city')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address.postal_code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('user.addressBook.fields.postalCode')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('user.addressBook.placeholders.postalCode')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="address.country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('user.addressBook.fields.country')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('user.addressBook.placeholders.country')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    type="submit"
                    disabled={addAddressMutation.isPending}
                  >
                    {addAddressMutation.isPending ? t('common.saving') : t('common.save')}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder={t('user.addressBook.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Addresses List */}
      {filteredAddresses && filteredAddresses.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAddresses.map((address: UserAddress) => (
            <Card key={address.id} className={cn(
              'relative transition-all duration-200 hover:shadow-md',
              address.is_default && 'ring-2 ring-amber-500 ring-offset-2'
            )}>
              {address.is_default && (
                <div className="absolute -top-2 -right-2">
                  <Badge className="bg-amber-500 text-white">
                    <Star className="h-3 w-3 mr-1" />
                    {t('user.addressBook.default')}
                  </Badge>
                </div>
              )}
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={cn(
                      'p-2 rounded-lg',
                      getAddressLabelColor(address.label)
                    )}>
                      {getAddressIcon(address.label)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {t(`user.addressBook.labels.${address.label}`)}
                      </CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <MapPin className="h-3 w-3 mr-1" />
                        {address.address.city}, {address.address.country}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-900">
                    {address.address.street}
                  </p>
                  <p className="text-sm text-gray-600">
                    {address.address.postal_code} {address.address.city}
                  </p>
                  {address.address.country && (
                    <p className="text-sm text-gray-600">
                      {address.address.country}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="flex items-center space-x-2">
                    {!address.is_default && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleSetDefault(address.id)}
                        disabled={setDefaultMutation.isPending}
                      >
                        <Star className="h-4 w-4 mr-1" />
                        {t('user.addressBook.setAsDefault')}
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(address)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(address.id)}
                      disabled={deleteAddressMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MapPin className="h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? t('user.addressBook.noSearchResults') : t('user.addressBook.noAddresses')}
            </h3>
            <p className="text-gray-600 text-center mb-4">
              {searchQuery
                ? t('user.addressBook.tryDifferentSearch')
                : t('user.addressBook.addFirstAddressDesc')
              }
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                {t('user.addressBook.addFirstAddress')}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Address Dialog */}
      <Dialog open={!!editingAddress} onOpenChange={() => setEditingAddress(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{t('user.addressBook.editAddress')}</DialogTitle>
            <DialogDescription>
              {t('user.addressBook.editAddressDesc')}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="label"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('user.addressBook.fields.label')}</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="home">{t('user.addressBook.labels.home')}</SelectItem>
                        <SelectItem value="work">{t('user.addressBook.labels.work')}</SelectItem>
                        <SelectItem value="other">{t('user.addressBook.labels.other')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address.street"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('user.addressBook.fields.street')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('user.addressBook.placeholders.street')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="address.city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('user.addressBook.fields.city')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('user.addressBook.placeholders.city')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address.postal_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('user.addressBook.fields.postalCode')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('user.addressBook.placeholders.postalCode')} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="address.country"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('user.addressBook.fields.country')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('user.addressBook.placeholders.country')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingAddress(null)}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={updateAddressMutation.isPending}
                >
                  {updateAddressMutation.isPending ? t('common.saving') : t('common.save')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Skeleton loader
const AddressBookSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-10 w-full" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-32 mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-4 w-3/4 mb-4" />
              <div className="flex justify-between">
                <Skeleton className="h-8 w-24" />
                <div className="flex space-x-2">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AddressBook;