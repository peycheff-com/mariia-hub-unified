import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  Settings,
  Sparkles,
  Bell,
  Shield,
  Globe,
  Zap,
  Info,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Button,
} from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Badge,
} from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Alert,
  AlertDescription,
} from '@/components/ui/alert';

// Import the split components
import { ContentList } from './components/ContentList';
import { ContentForm } from './components/ContentForm';
import { ContentCalendar } from './components/ContentCalendar';
import { ContentAnalytics } from './components/ContentAnalytics';

interface AIContentManagerProps {
  className?: string;
}

type SupportedLanguage = {
  code: string;
  name: string;
  flag: string;
};

const supportedLanguages: SupportedLanguage[] = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'pl', name: 'Polski', flag: '🇵🇱' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'uk', name: 'Українська', flag: '🇺🇦' },
];

export const AIContentManager = ({ className }: AIContentManagerProps) => {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState('content');
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);
  const [showSettings, setShowSettings] = useState(false);

  // Sync language with i18n
  useEffect(() => {
    setSelectedLanguage(i18n.language);
  }, [i18n.language]);

  const handleLanguageChange = (languageCode: string) => {
    setSelectedLanguage(languageCode);
    i18n.changeLanguage(languageCode);
    toast.success(t('admin.ai.contentManager.languageChanged'));
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-primary" />
            {t('admin.ai.contentManager.title')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('admin.ai.contentManager.description')}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {supportedLanguages.map((lang) => (
                <SelectItem key={lang.code} value={lang.code}>
                  <span className="flex items-center gap-2">
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            {t('admin.ai.contentManager.settings')}
          </Button>
        </div>
      </div>

      {/* AI Status Alert */}
      <Alert className="border-primary/20 bg-primary/5">
        <Zap className="h-4 w-4 text-primary" />
        <AlertDescription className="flex items-center justify-between">
          <span>{t('admin.ai.contentManager.aiStatus')}</span>
          <Badge variant="outline" className="text-primary">
            {t('admin.ai.contentManager.active')}
          </Badge>
        </AlertDescription>
      </Alert>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="content" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            {t('admin.ai.contentManager.content')}
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            {t('admin.ai.contentManager.create')}
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            {t('admin.ai.contentManager.calendar')}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <Info className="w-4 h-4" />
            {t('admin.ai.contentManager.analytics')}
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            {t('admin.ai.contentManager.settings')}
          </TabsTrigger>
        </TabsList>

        {/* Content List Tab */}
        <TabsContent value="content" className="space-y-6">
          <ContentList language={selectedLanguage} />
        </TabsContent>

        {/* Create Content Tab */}
        <TabsContent value="create" className="space-y-6">
          <ContentForm language={selectedLanguage} />
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="space-y-6">
          <ContentCalendar language={selectedLanguage} />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <ContentAnalytics language={selectedLanguage} />
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                {t('admin.ai.contentManager.aiSettings')}
              </CardTitle>
              <CardDescription>
                {t('admin.ai.contentManager.aiSettingsDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">{t('admin.ai.contentManager.modelSettings')}</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm font-medium">GPT-4 Model</span>
                      <Badge variant="outline">Active</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm font-medium">Temperature</span>
                      <span className="text-sm text-muted-foreground">0.7</span>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm font-medium">Max Tokens</span>
                      <span className="text-sm text-muted-foreground">2000</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">{t('admin.ai.contentManager.automationSettings')}</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm font-medium">Auto-translate</span>
                      <Badge variant="outline">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm font-medium">SEO Optimization</span>
                      <Badge variant="outline">Enabled</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <span className="text-sm font-medium">Auto-scheduling</span>
                      <Badge variant="outline">Disabled</Badge>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">
                      {t('admin.ai.contentManager.dataPrivacy')}
                    </span>
                  </div>
                  <Badge variant="outline" className="text-green-600">
                    {t('admin.ai.contentManager.compliant')}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {t('admin.ai.contentManager.dataPrivacyDesc')}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('admin.ai.contentManager.quickSettings')}</DialogTitle>
            <DialogDescription>
              {t('admin.ai.contentManager.quickSettingsDesc')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <span className="text-sm font-medium">AI Model</span>
              <Select defaultValue="gpt-4">
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="gpt-3.5">GPT-3.5</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSettings(false)}>
                {t('common.cancel')}
              </Button>
              <Button onClick={() => setShowSettings(false)}>
                {t('common.save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AIContentManager;