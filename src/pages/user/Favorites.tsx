import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Heart,
  Search,
  Filter,
  Grid,
  List,
  Calendar,
  MapPin,
  Clock,
  Star,
  MessageSquare,
  Bell,
  X,
  Edit2,
  ArrowRight,
  AlertCircle,
  Check
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { UserFavorite, Service } from '@/types/user';
import { favoritesService } from '@/services/favorites.service';

const UserFavorites: React.FC = () => {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingNotes, setEditingNotes] = useState<UserFavorite | null>(null);
  const [notesDialogOpen, setNotesDialogOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState<Record<string, boolean>>({});

  // Fetch favorites
  const { data: favorites, isLoading } = useQuery({
    queryKey: ['user-favorites'],
    queryFn: () => favoritesService.getUserFavorites(),
    staleTime: 5 * 60 * 1000,
  });

  // Remove favorite mutation
  const removeFavoriteMutation = useMutation({
    mutationFn: (favoriteId: string) => favoritesService.removeFavorite(favoriteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-favorites'] });
      toast.success(t('user.favorites.removeSuccess'));
    },
    onError: () => {
      toast.error(t('user.favorites.removeError'));
    },
  });

  // Update notes mutation
  const updateNotesMutation = useMutation({
    mutationFn: ({ favoriteId, notes }: { favoriteId: string; notes: string }) =>
      favoritesService.updateFavoriteNotes(favoriteId, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-favorites'] });
      setNotesDialogOpen(false);
      setEditingNotes(null);
      toast.success(t('user.favorites.notesUpdateSuccess'));
    },
    onError: () => {
      toast.error(t('user.favorites.notesUpdateError'));
    },
  });

  // Update notification preference mutation
  const updateNotificationMutation = useMutation({
    mutationFn: ({ favoriteId, enabled }: { favoriteId: string; enabled: boolean }) =>
      favoritesService.updateNotificationPreference(favoriteId, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-favorites'] });
      toast.success(t('user.favorites.notificationUpdateSuccess'));
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(i18n.language === 'pl' ? 'pl-PL' : 'en-US', {
      style: 'currency',
      currency: 'PLN',
    }).format(amount);
  };

  const handleRemoveFavorite = (favoriteId: string) => {
    if (window.confirm(t('user.favorites.removeConfirm'))) {
      removeFavoriteMutation.mutate(favoriteId);
    }
  };

  const handleEditNotes = (favorite: UserFavorite) => {
    setEditingNotes(favorite);
    setNotesDialogOpen(true);
  };

  const handleNotesSubmit = (notes: string) => {
    if (editingNotes) {
      updateNotesMutation.mutate({
        favoriteId: editingNotes.id,
        notes,
      });
    }
  };

  const toggleNotifications = (favoriteId: string, enabled: boolean) => {
    setNotificationsEnabled(prev => ({ ...prev, [favoriteId]: enabled }));
    updateNotificationMutation.mutate({ favoriteId, enabled });
  };

  const filteredFavorites = favorites?.filter((favorite: UserFavorite) => {
    const matchesSearch = searchQuery === '' ||
      favorite.service?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      favorite.service?.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' ||
      favorite.service?.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = favorites?.reduce((acc: string[], favorite: UserFavorite) => {
    if (favorite.service?.category && !acc.includes(favorite.service.category)) {
      acc.push(favorite.service.category);
    }
    return acc;
  }, []);

  if (isLoading) {
    return <FavoritesSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {t('user.favorites.title')}
          </h1>
          <p className="text-lg text-gray-600">
            {t('user.favorites.subtitle')}
          </p>
        </div>

        {/* Filters and Controls */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder={t('user.favorites.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full lg:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('user.favorites.allCategories')}</SelectItem>
                  {categories?.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('list')}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Favorites List */}
        {filteredFavorites && filteredFavorites.length > 0 ? (
          <div className={cn(
            'space-y-4',
            viewMode === 'grid' && 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          )}>
            {filteredFavorites.map((favorite: UserFavorite) => (
              <Card key={favorite.id} className="group hover:shadow-lg transition-all duration-200">
                <CardHeader className="pb-3">
                  <div className="relative">
                    {favorite.service?.image_url && (
                      <div className="aspect-video bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg overflow-hidden mb-3">
                        <img
                          src={favorite.service.image_url}
                          alt={favorite.service.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                      onClick={() => handleRemoveFavorite(favorite.id)}
                      disabled={removeFavoriteMutation.isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardTitle className="text-lg">{favorite.service?.name}</CardTitle>
                  <CardDescription>{favorite.service?.category}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-3">
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {favorite.service?.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-gray-900">
                      {formatCurrency(favorite.service?.price || 0)}
                    </span>
                    <Badge variant="outline">
                      {favorite.service?.duration} {t('common.minutes')}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <MapPin className="h-4 w-4" />
                    <span>Warsaw, City Center</span>
                  </div>

                  {favorite.notes && (
                    <div className="p-3 bg-amber-50 rounded-lg">
                      <p className="text-sm text-amber-800">
                        <span className="font-medium">{t('user.favorites.notes')}:</span> {favorite.notes}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-600">{t('user.favorites.notifications')}</span>
                    </div>
                    <Switch
                      checked={notificationsEnabled[favorite.id] ?? true}
                      onCheckedChange={(enabled) => toggleNotifications(favorite.id, enabled)}
                      size="sm"
                    />
                  </div>
                </CardContent>

                <CardFooter className="pt-3">
                  <div className="flex gap-2 w-full">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditNotes(favorite)}
                      className="flex-1"
                    >
                      <Edit2 className="h-4 w-4 mr-1" />
                      {t('user.favorites.editNotes')}
                    </Button>
                    <Button size="sm" className="flex-1" asChild>
                      <a href={`/booking?service=${favorite.service_id}`}>
                        {t('common.book')}
                        <ArrowRight className="h-4 w-4 ml-1" />
                      </a>
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Heart className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery || selectedCategory !== 'all'
                  ? t('user.favorites.noSearchResults')
                  : t('user.favorites.noFavorites')
                }
              </h3>
              <p className="text-gray-600 text-center mb-4">
                {searchQuery || selectedCategory !== 'all'
                  ? t('user.favorites.tryDifferentFilters')
                  : t('user.favorites.startAdding')
                }
              </p>
              {!searchQuery && selectedCategory === 'all' && (
                <Button asChild>
                  <a href="/services">
                    {t('user.favorites.browseServices')}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </a>
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Notes Dialog */}
        <Dialog open={notesDialogOpen} onOpenChange={setNotesDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{t('user.favorites.editNotes')}</DialogTitle>
              <DialogDescription>
                {t('user.favorites.notesDescription')}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="notes">{t('user.favorites.notes')}</Label>
                <Textarea
                  id="notes"
                  placeholder={t('user.favorites.notesPlaceholder')}
                  defaultValue={editingNotes?.notes || ''}
                  rows={4}
                  className="mt-2"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setNotesDialogOpen(false)}
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={() => {
                  const textarea = document.getElementById('notes') as HTMLTextAreaElement;
                  handleNotesSubmit(textarea.value);
                }}
                disabled={updateNotesMutation.isPending}
              >
                {updateNotesMutation.isPending ? t('common.saving') : t('common.save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Tips Section */}
        <Alert className="mt-8 border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <strong>{t('user.favorites.tipTitle')}</strong> {t('user.favorites.tipDescription')}
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
};

// Skeleton loader
const FavoritesSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="mb-8">
          <Skeleton className="h-12 w-64 mb-2" />
          <Skeleton className="h-6 w-96" />
        </div>
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-48" />
              <div className="flex gap-2">
                <Skeleton className="h-10 w-10" />
                <Skeleton className="h-10 w-10" />
              </div>
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="aspect-video w-full mb-3" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="flex justify-between">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardContent>
              <CardFooter>
                <div className="flex gap-2 w-full">
                  <Skeleton className="h-9 flex-1" />
                  <Skeleton className="h-9 flex-1" />
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default UserFavorites;