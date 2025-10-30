import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Globe,
  MapPin,
  Calendar,
  Phone,
  Clock,
  Settings,
  Star,
  Building,
  Users,
  Palette,
  Heart,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Info
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface WarsawLocalizationSettings {
  businessHours: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
  contact: {
    phone: string;
    email: string;
    address: string;
    neighborhood: string;
    directions: string;
  };
  cultural: {
    dateFormat: 'european' | 'polish';
    timeFormat: '24h' | '12h';
    currencyDisplay: 'symbol' | 'code' | 'name';
    numberFormat: 'polish' | 'european';
    formalAddress: boolean;
    usePolishTitles: boolean;
  };
  seasonal: {
    holidaySchedule: boolean;
    summerHours: boolean;
    winterPromotions: boolean;
    localEvents: boolean;
  };
  luxuryPositioning: {
    emphasizeWarsawLocation: boolean;
    highlightPremiumQuality: boolean;
    showExclusivity: boolean;
    useSophisticatedLanguage: boolean;
  };
}

const PolishLocalizationManager: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [isPolishPrimary, setIsPolishPrimary] = useState(true);
  const [settings, setSettings] = useState<WarsawLocalizationSettings>({
    businessHours: {
      monday: '9:00 - 19:00',
      tuesday: '9:00 - 19:00',
      wednesday: '9:00 - 19:00',
      thursday: '9:00 - 19:00',
      friday: '9:00 - 19:00',
      saturday: '10:00 - 16:00',
      sunday: 'Zamknięte'
    },
    contact: {
      phone: '+48 536 200 573',
      email: 'kontakt@mariaborysevych.com',
      address: 'Smolna 8, 00-375 Warszawa, Śródmieście',
      neighborhood: 'Śródmieście',
      directions: 'Przystanek Metro Nowy Świat - 5 min spacerem'
    },
    cultural: {
      dateFormat: 'polish',
      timeFormat: '24h',
      currencyDisplay: 'symbol',
      numberFormat: 'polish',
      formalAddress: true,
      usePolishTitles: true
    },
    seasonal: {
      holidaySchedule: true,
      summerHours: true,
      winterPromotions: true,
      localEvents: true
    },
    luxuryPositioning: {
      emphasizeWarsawLocation: true,
      highlightPremiumQuality: true,
      showExclusivity: true,
      useSophisticatedLanguage: true
    }
  });

  const [polishBeautyTerms] = useState([
    { term: 'Makijaż permanentny', category: 'Procedura', importance: 'Krytyczne' },
    { term: 'Healed-first approach', category: 'Filozofia', importance: 'Wysokie' },
    { term: 'Pigmenty najwyższej jakości', category: 'Materiały', importance: 'Wysokie' },
    { term: 'Sterylność i bezpieczeństwo', category: 'Standardy', importance: 'Krytyczne' },
    { term: 'Naturalny efekt', category: 'Wynik', importance: 'Wysokie' },
    { term: 'Indywidualne podejście', category: 'Obsługa', importance: 'Średnie' },
    { term: 'Warszawski standard luksusu', category: 'Pozycjonowanie', importance: 'Wysokie' },
    { term: 'Sztuka i precyzja', category: 'Wartości', importance: 'Średnie' }
  ]);

  const [polishHolidays] = useState([
    { name: 'Nowy Rok', date: '1 stycznia', type: 'Święto państwowe' },
    { name: 'Trzech Króli', date: '6 stycznia', type: 'Święto państwowe' },
    { name: 'Wielkanoc', date: 'Ruchome', type: 'Święto chrześcijańskie' },
    { name: 'Święto Pracy', date: '1 maja', type: 'Święto państwowe' },
    { name: 'Constitution Day', date: '3 maja', type: 'Święto państwowe' },
    { name: 'Boże Ciało', date: 'Ruchome', type: 'Święto chrześcijańskie' },
    { name: 'Wszystkich Świętych', date: '1 listopada', type: 'Święto państwowe' },
    { name: 'Święto Niepodległości', date: '11 listopada', type: 'Święto państwowe' },
    { name: 'Boże Narodzenie', date: '25-26 grudnia', type: 'Święto chrześcijańskie' }
  ]);

  const updateSetting = (category: keyof WarsawLocalizationSettings, field: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: value
      }
    }));
  };

  const saveSettings = async () => {
    // Save to localStorage for now, later integrate with backend
    localStorage.setItem('polish-localization-settings', JSON.stringify(settings));

    // Show success message
    console.log('Polish localization settings saved:', settings);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-50 rounded-lg">
            <Globe className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Lokalizacja Polska</h1>
            <p className="text-gray-600">Zarządzanie lokalizacją dla polskiego rynku luksusowego</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isPolishPrimary ? "default" : "secondary"} className="gap-1">
            {isPolishPrimary ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            Główny język: Polski
          </Badge>
          <Button onClick={saveSettings} className="gap-2">
            <Settings className="w-4 h-4" />
            Zapisz Ustawienia
          </Button>
        </div>
      </div>

      <Tabs defaultValue="business" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="business" className="gap-2">
            <Building className="w-4 h-4" />
            Biznes
          </TabsTrigger>
          <TabsTrigger value="cultural" className="gap-2">
            <Heart className="w-4 h-4" />
            Kultura
          </TabsTrigger>
          <TabsTrigger value="seasonal" className="gap-2">
            <Calendar className="w-4 h-4" />
            Sezonowość
          </TabsTrigger>
          <TabsTrigger value="luxury" className="gap-2">
            <Sparkles className="w-4 h-4" />
            Luksus
          </TabsTrigger>
          <TabsTrigger value="terminology" className="gap-2">
            <Palette className="w-4 h-4" />
            Terminologia
          </TabsTrigger>
        </TabsList>

        {/* Business Settings */}
        <TabsContent value="business" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Godziny Pracy - Warszawa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(settings.businessHours).map(([day, hours]) => (
                  <div key={day} className="space-y-2">
                    <Label className="text-sm font-medium capitalize">
                      {day === 'monday' ? 'Poniedziałek' :
                       day === 'tuesday' ? 'Wtorek' :
                       day === 'wednesday' ? 'Środa' :
                       day === 'thursday' ? 'Czwartek' :
                       day === 'friday' ? 'Piątek' :
                       day === 'saturday' ? 'Sobota' : 'Niedziela'}
                    </Label>
                    <Input
                      value={hours}
                      onChange={(e) => updateSetting('businessHours', day, e.target.value)}
                      placeholder="np. 9:00 - 19:00"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Kontakt i Lokalizacja
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Telefon (format polski)</Label>
                  <Input
                    value={settings.contact.phone}
                    onChange={(e) => updateSetting('contact', 'phone', e.target.value)}
                    placeholder="+48 XXX XXX XXX"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    value={settings.contact.email}
                    onChange={(e) => updateSetting('contact', 'email', e.target.value)}
                    placeholder="kontakt@przyklad.pl"
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <Label>Adres (format polski)</Label>
                  <Input
                    value={settings.contact.address}
                    onChange={(e) => updateSetting('contact', 'address', e.target.value)}
                    placeholder="Ulica, numer, kod pocztowy, miasto, dzielnica"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Dzielnica</Label>
                  <Input
                    value={settings.contact.neighborhood}
                    onChange={(e) => updateSetting('contact', 'neighborhood', e.target.value)}
                    placeholder="np. Śródmieście"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Dojazd</Label>
                  <Input
                    value={settings.contact.directions}
                    onChange={(e) => updateSetting('contact', 'directions', e.target.value)}
                    placeholder="np. Metro, tramwaj, autobus"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cultural Settings */}
        <TabsContent value="cultural" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5" />
                Ustawienia Kulturowe
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Formalny adres (Pan/Pani)</Label>
                    <p className="text-sm text-gray-600">Używaj grzecznościowych form adresu</p>
                  </div>
                  <Switch
                    checked={settings.cultural.formalAddress}
                    onCheckedChange={(checked) => updateSetting('cultural', 'formalAddress', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Polskie tytuły zawodowe</Label>
                    <p className="text-sm text-gray-600">Mgr, Dr, Inż. itp.</p>
                  </div>
                  <Switch
                    checked={settings.cultural.usePolishTitles}
                    onCheckedChange={(checked) => updateSetting('cultural', 'usePolishTitles', checked)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Format daty</Label>
                    <select
                      value={settings.cultural.dateFormat}
                      onChange={(e) => updateSetting('cultural', 'dateFormat', e.target.value)}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="polish">Polski (DD.MM.RRRR)</option>
                      <option value="european">Europejski (DD/MM/RRRR)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Format czasu</Label>
                    <select
                      value={settings.cultural.timeFormat}
                      onChange={(e) => updateSetting('cultural', 'timeFormat', e.target.value)}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="24h">24-godzinny</option>
                      <option value="12h">12-godzinny</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Wyświetlanie waluty</Label>
                    <select
                      value={settings.cultural.currencyDisplay}
                      onChange={(e) => updateSetting('cultural', 'currencyDisplay', e.target.value)}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="symbol">Symbol (zł)</option>
                      <option value="code">Kod (PLN)</option>
                      <option value="name">Nazwa (złoty)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label>Format liczb</Label>
                    <select
                      value={settings.cultural.numberFormat}
                      onChange={(e) => updateSetting('cultural', 'numberFormat', e.target.value)}
                      className="w-full p-2 border rounded-md"
                    >
                      <option value="polish">Polski (przecinek dziesiętny)</option>
                      <option value="european">Europejski (kropka dziesiętna)</option>
                    </select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Seasonal Settings */}
        <TabsContent value="seasonal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Sezonowość i Święta
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Harmonogram świąt</Label>
                    <p className="text-sm text-gray-600">Automatyczne dostosowanie godzin w święta</p>
                  </div>
                  <Switch
                    checked={settings.seasonal.holidaySchedule}
                    onCheckedChange={(checked) => updateSetting('seasonal', 'holidaySchedule', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Godziny letnie</Label>
                    <p className="text-sm text-gray-600">Dłuższe godziny pracy latem</p>
                  </div>
                  <Switch
                    checked={settings.seasonal.summerHours}
                    onCheckedChange={(checked) => updateSetting('seasonal', 'summerHours', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Promocje zimowe</Label>
                    <p className="text-sm text-gray-600">Specjalne oferty zimowe</p>
                  </div>
                  <Switch
                    checked={settings.seasonal.winterPromotions}
                    onCheckedChange={(checked) => updateSetting('seasonal', 'winterPromotions', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Lokalne wydarzenia</Label>
                    <p className="text-sm text-gray-600">Integracja z wydarzeniami w Warszawie</p>
                  </div>
                  <Switch
                    checked={settings.seasonal.localEvents}
                    onCheckedChange={(checked) => updateSetting('seasonal', 'localEvents', checked)}
                  />
                </div>
              </div>

              <div className="mt-8">
                <h3 className="text-lg font-semibold mb-4">Polskie Święta 2024</h3>
                <div className="grid grid-cols-2 gap-3">
                  {polishHolidays.map((holiday, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{holiday.name}</p>
                        <p className="text-sm text-gray-600">{holiday.date}</p>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {holiday.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Luxury Positioning */}
        <TabsContent value="luxury" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Pozycjonowanie Luksusowe
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Lokalizacja w Warszawie</Label>
                    <p className="text-sm text-gray-600">Podkreślaj prestiżową lokalizację</p>
                  </div>
                  <Switch
                    checked={settings.luxuryPositioning.emphasizeWarsawLocation}
                    onCheckedChange={(checked) => updateSetting('luxuryPositioning', 'emphasizeWarsawLocation', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Jakość premium</Label>
                    <p className="text-sm text-gray-600">Akcentuj najwyższą jakość usług</p>
                  </div>
                  <Switch
                    checked={settings.luxuryPositioning.highlightPremiumQuality}
                    onCheckedChange={(checked) => updateSetting('luxuryPositioning', 'highlightPremiumQuality', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Ekskluzywność</Label>
                    <p className="text-sm text-gray-600">Komunikuj ograniczoną dostępność</p>
                  </div>
                  <Switch
                    checked={settings.luxuryPositioning.showExclusivity}
                    onCheckedChange={(checked) => updateSetting('luxuryPositioning', 'showExclusivity', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Język wyrafinowany</Label>
                    <p className="text-sm text-gray-600">Używaj eleganckiego języka</p>
                  </div>
                  <Switch
                    checked={settings.luxuryPositioning.useSophisticatedLanguage}
                    onCheckedChange={(checked) => updateSetting('luxuryPositioning', 'useSophisticatedLanguage', checked)}
                  />
                </div>
              </div>

              <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <Star className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div className="space-y-2">
                    <h4 className="font-semibold text-amber-900">Warszawski Standard Luksusu</h4>
                    <p className="text-sm text-amber-800">
                      Komunikuj wartości premium zgodne z oczekiwaniami warszawskich klientów:
                      jakość, dyskrecję, ekskluzywność i profesjonalizm.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Beauty Industry Terminology */}
        <TabsContent value="terminology" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Terminologia Branżowa
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="mb-6">
                <p className="text-gray-600">
                  Kluczowe terminy branżowe w języku polskim z odpowiednim kontekstem kulturowym.
                </p>
              </div>

              <div className="space-y-3">
                {polishBeautyTerms.map((term, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold">{term.term}</h4>
                        <Badge variant="outline">{term.category}</Badge>
                        <Badge
                          variant={
                            term.importance === 'Krytyczne' ? 'destructive' :
                            term.importance === 'Wysokie' ? 'default' : 'secondary'
                          }
                        >
                          {term.importance}
                        </Badge>
                      </div>
                    </div>
                    <Info className="w-4 h-4 text-gray-400" />
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Wskazówki kulturowe</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Używaj formalnego języka w komunikacji z klientami</li>
                  <li>• Podkreślaj jakość i bezpieczeństwo procedur</li>
                  <li>• Odwołuj się do polskich standardów branżowych</li>
                  <li>• Używaj polskich nazw produktów i procedur</li>
                  <li>• Dostosuj komunikację do warszawskiego rynku luksusowego</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PolishLocalizationManager;