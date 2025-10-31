import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Camera,
  Save,
  Eye,
  EyeOff,
  Check,
  AlertCircle,
  Shield,
  CreditCard,
  Bell,
  Globe,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { cn } from '@/lib/utils';
import { UserProfile } from '@/types/user';
import { profileService } from '@/services/profile.service';

const profileSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  bio: z.string().max(500).optional(),
  preferences: z.object({
    language: z.string(),
    currency: z.string(),
    timezone: z.string(),
  }),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const UserEditProfile: React.FC = () => {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('personal');
  const [showPassword, setShowPassword] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Fetch user profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => profileService.getUserProfile(),
    staleTime: 5 * 60 * 1000,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: ProfileFormData) => profileService.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      toast.success(t('user.profile.updateSuccess'));
    },
    onError: (error) => {
      toast.error(t('user.profile.updateError'));
      console.error(error);
    },
  });

  // Upload avatar mutation
  const uploadAvatarMutation = useMutation({
    mutationFn: (file: File) => profileService.uploadAvatar(file),
    onSuccess: (url) => {
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      setAvatarPreview(url);
      toast.success(t('user.profile.avatarUpdateSuccess'));
    },
    onError: () => {
      toast.error(t('user.profile.avatarUpdateError'));
    },
  });

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      date_of_birth: '',
      gender: 'prefer_not_to_say',
      bio: '',
      preferences: {
        language: 'en',
        currency: 'PLN',
        timezone: 'Europe/Warsaw',
      },
    },
  });

  // Set form values when profile is loaded
  useEffect(() => {
    if (profile) {
      form.reset({
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        phone: profile.phone || '',
        date_of_birth: profile.date_of_birth || '',
        gender: profile.gender || 'prefer_not_to_say',
        bio: profile.bio || '',
        preferences: {
          language: profile.preferences.language,
          currency: profile.preferences.currency,
          timezone: profile.preferences.timezone,
        },
      });
      setAvatarPreview(profile.avatar_url);
    }
  }, [profile, form]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(t('user.profile.avatarSizeError'));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      uploadAvatarMutation.mutate(file);
    }
  };

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const languages = [
    { value: 'en', label: 'English' },
    { value: 'pl', label: 'Polski' },
    { value: 'ua', label: 'Українська' },
  ];

  const currencies = [
    { value: 'PLN', label: 'PLN - Polish Złoty' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'USD', label: 'USD - US Dollar' },
  ];

  const timezones = [
    { value: 'Europe/Warsaw', label: 'Warsaw (CET)' },
    { value: 'Europe/Kyiv', label: 'Kyiv (EET)' },
    { value: 'Europe/London', label: 'London (GMT)' },
    { value: 'Europe/Paris', label: 'Paris (CET)' },
    { value: 'America/New_York', label: 'New York (EST)' },
  ];

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {t('user.profile.title')}
            </h1>
            <p className="text-lg text-gray-600">
              {t('user.profile.subtitle')}
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="personal" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {t('user.profile.tabs.personal')}
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                {t('user.profile.tabs.security')}
              </TabsTrigger>
              <TabsTrigger value="preferences" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                {t('user.profile.tabs.preferences')}
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                {t('user.profile.tabs.notifications')}
              </TabsTrigger>
            </TabsList>

            {/* Personal Information Tab */}
            <TabsContent value="personal">
              <Card>
                <CardHeader>
                  <CardTitle>{t('user.profile.personal.title')}</CardTitle>
                  <CardDescription>
                    {t('user.profile.personal.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar Upload */}
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={avatarPreview || ''} />
                        <AvatarFallback className="text-2xl bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                          {profile?.first_name?.[0]}{profile?.last_name?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <label
                        htmlFor="avatar-upload"
                        className="absolute bottom-0 right-0 bg-amber-500 text-white p-2 rounded-full cursor-pointer hover:bg-amber-600 transition-colors"
                      >
                        <Camera className="h-4 w-4" />
                        <input
                          id="avatar-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarChange}
                        />
                      </label>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {t('user.profile.avatar.title')}
                      </p>
                      <p className="text-sm text-gray-600">
                        {t('user.profile.avatar.description')}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {t('user.profile.avatar.formatHint')}
                      </p>
                    </div>
                  </div>

                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="first_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('user.profile.fields.firstName')}</FormLabel>
                              <FormControl>
                                <Input placeholder={t('user.profile.fields.firstNamePlaceholder')} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="last_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('user.profile.fields.lastName')}</FormLabel>
                              <FormControl>
                                <Input placeholder={t('user.profile.fields.lastNamePlaceholder')} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('user.profile.fields.email')}</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="email@example.com" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('user.profile.fields.phone')}</FormLabel>
                              <FormControl>
                                <Input placeholder="+48 123 456 789" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="date_of_birth"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('user.profile.fields.dateOfBirth')}</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="gender"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('user.profile.fields.gender')}</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder={t('user.profile.fields.selectGender')} />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="male">{t('user.profile.fields.gender.male')}</SelectItem>
                                  <SelectItem value="female">{t('user.profile.fields.gender.female')}</SelectItem>
                                  <SelectItem value="other">{t('user.profile.fields.gender.other')}</SelectItem>
                                  <SelectItem value="prefer_not_to_say">
                                    {t('user.profile.fields.gender.preferNotToSay')}
                                  </SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="bio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('user.profile.fields.bio')}</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder={t('user.profile.fields.bioPlaceholder')}
                                className="resize-none"
                                rows={4}
                                {...field}
                              />
                            </FormControl>
                            <FormDescription>
                              {t('user.profile.fields.bioDescription')}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end">
                        <Button
                          type="submit"
                          disabled={updateProfileMutation.isPending}
                          className="min-w-[120px]"
                        >
                          {updateProfileMutation.isPending ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              {t('common.saving')}
                            </div>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              {t('common.save')}
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('user.profile.security.password')}</CardTitle>
                    <CardDescription>
                      {t('user.profile.security.passwordDescription')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="current-password">{t('user.profile.security.currentPassword')}</Label>
                        <div className="relative">
                          <Input
                            id="current-password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="new-password">{t('user.profile.security.newPassword')}</Label>
                        <Input
                          id="new-password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                        />
                      </div>
                    </div>
                    <Button className="w-full md:w-auto">
                      {t('user.profile.security.updatePassword')}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t('user.profile.security.twoFactor')}</CardTitle>
                    <CardDescription>
                      {t('user.profile.security.twoFactorDescription')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Shield className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="font-medium">{t('user.profile.security.twoFactorTitle')}</p>
                          <p className="text-sm text-gray-600">
                            {t('user.profile.security.twoFactorStatus')}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline">
                        {t('user.profile.security.enable')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Preferences Tab */}
            <TabsContent value="preferences">
              <Card>
                <CardHeader>
                  <CardTitle>{t('user.profile.preferences.title')}</CardTitle>
                  <CardDescription>
                    {t('user.profile.preferences.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="preferences.language"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('user.profile.preferences.language')}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {languages.map((lang) => (
                                <SelectItem key={lang.value} value={lang.value}>
                                  {lang.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="preferences.currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('user.profile.preferences.currency')}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {currencies.map((currency) => (
                                <SelectItem key={currency.value} value={currency.value}>
                                  {currency.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="preferences.timezone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('user.profile.preferences.timezone')}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {timezones.map((tz) => (
                                <SelectItem key={tz.value} value={tz.value}>
                                  {tz.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Tab */}
            <TabsContent value="notification s">
              <Card>
                <CardHeader>
                  <CardTitle>{t('user.profile.notifications.title')}</CardTitle>
                  <CardDescription>
                    {t('user.profile.notifications.description')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {[
                    { key: 'booking_reminder', label: t('user.profile.notifications.bookingReminder'), description: t('user.profile.notifications.bookingReminderDesc') },
                    { key: 'booking_confirmation', label: t('user.profile.notifications.bookingConfirmation'), description: t('user.profile.notifications.bookingConfirmationDesc') },
                    { key: 'promotional', label: t('user.profile.notifications.promotional'), description: t('user.profile.notifications.promotionalDesc') },
                    { key: 'review_request', label: t('user.profile.notifications.reviewRequest'), description: t('user.profile.notifications.reviewRequestDesc') },
                  ].map((notification) => (
                    <div key={notification.key} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="font-medium">{notification.label}</p>
                        <p className="text-sm text-gray-600">{notification.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          Email
                        </Badge>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  ))}

                  <Separator />

                  <div>
                    <Label className="text-base font-medium">{t('user.profile.notifications.quietHours')}</Label>
                    <p className="text-sm text-gray-600 mb-4">
                      {t('user.profile.notifications.quietHoursDesc')}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="quiet-start">{t('user.profile.notifications.quietStart')}</Label>
                        <Input id="quiet-start" type="time" defaultValue="22:00" />
                      </div>
                      <div>
                        <Label htmlFor="quiet-end">{t('user.profile.notifications.quietEnd')}</Label>
                        <Input id="quiet-end" type="time" defaultValue="08:00" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

// Skeleton loader
const ProfileSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6 md:py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <Skeleton className="h-12 w-64 mb-2" />
            <Skeleton className="h-6 w-96" />
          </div>
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
};

export default UserEditProfile;