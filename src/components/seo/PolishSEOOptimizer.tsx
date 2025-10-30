import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Globe,
  MapPin,
  TrendingUp,
  Users,
  Target,
  CheckCircle2,
  AlertCircle,
  Info,
  ExternalLink,
  Star,
  Award,
  Building
} from 'lucide-react';

interface WarsawSEOData {
  localKeywords: {
    primary: string[];
    secondary: string[];
    longTail: string[];
  };
  localBusiness: {
    name: string;
    category: string;
    address: string;
    phone: string;
    website: string;
    hours: string[];
  };
  competitors: {
    name: string;
    strengths: string[];
    weaknesses: string[];
    keywords: string[];
  }[];
  contentStrategy: {
    blogTopics: string[];
    localEvents: string[];
    seasonalContent: string[];
  };
}

const PolishSEOOptimizer: React.FC = () => {
  const [seoData, setSeoData] = useState<WarsawSEOData>({
    localKeywords: {
      primary: [
        'makijaż permanentny Warszawa',
        'permanent makeup Warsaw',
        'brwi permanentne Warszawa',
        'usta permanentne Warszawa',
        'linijka permanentna Warszawa',
        'PMU Warszawa',
        'trening personalny Warszawa',
        'fitness Warszawa Śródmieście'
      ],
      secondary: [
        'salon piękności Warszawa',
        'studio urody Warszawa',
        'kosmetyczka Warszawa centrum',
        'trener personalny Warszawa',
        'siłownia Warszawa Śródmieście',
        'makijaż permanentny cena Warszawa',
        'PMU cena Warszawa',
        'permanent makeup studio Warsaw'
      ],
      longTail: [
        'makijaż permanentny brwi Warszawa Śródmieście',
        'najlepszy makijaż permanentny Warszawa',
        'permanent makeup Warsaw old town',
        'delikatny makijaż permanentny Warszawa',
        'naturalne brwi permanentne Warszawa',
        'certyfikowany trener personalny Warszawa',
        'personal training Warsaw Poland',
        'luxury beauty salon Warsaw'
      ]
    },
    localBusiness: {
      name: 'Mariia Beauty & Fitness',
      category: 'Beauty Salon & Personal Training',
      address: 'Smolna 8, 00-375 Warszawa, Polska',
      phone: '+48 536 200 573',
      website: 'https://mariaborysevych.com',
      hours: [
        'Poniedziałek-Piątek: 9:00-19:00',
        'Sobota: 10:00-16:00',
        'Niedziela: Zamknięte'
      ]
    },
    competitors: [
      {
        name: 'Warsaw Beauty Studio',
        strengths: ['Lokalizacja centrum', 'Duży marketing'],
        weaknesses: ['Mniej personalizacja', 'Wyższe ceny'],
        keywords: ['beauty salon Warsaw', 'makijaż Warszawa']
      },
      {
        name: 'Elite PMU Studio',
        strengths: ['Specjalizacja PMU', 'Doświadczenie'],
        weaknesses: ['Ograniczone usługi', 'Lokalizacja'],
        keywords: ['PMU Warsaw', 'permanent makeup']
      },
      {
        name: 'Premium Fitness Club',
        strengths: ['Nowoczesny sprzęt', 'Duża przestrzeń'],
        weaknesses: ['Tłumy', 'Brak personalizacji'],
        keywords: ['fitness club Warsaw', 'gym Warsaw center']
      }
    ],
    contentStrategy: {
      blogTopics: [
        'Trendy w makijażu permanentnym 2024 w Warszawie',
        'Jak dbać o brwi po zabiegu permanentnym - poradnik warszawski',
        'Najlepsze zabiegi piękności w Śródmieściu',
        'Trening personalny vs siłownia - co wybrać w Warszawie',
        'Warszawski styl życia: fitness i piękno',
        'Pielęgnacja zimą - porady eksperta z Warszawy',
        'Makijaż permanentny dla profesjonalistek - Warsaw business',
        'Najlepsze salony piękności według opinii klientów Warszawa'
      ],
      localEvents: [
        'Warsaw Fashion Week',
        'Warsaw Beauty Expo',
        'Dni Otwarte Studio',
        'Warsaw Marathon',
        'Lokalne targi wellness',
        'Festiwal urody w Warszawie'
      ],
      seasonalContent: [
        'Wiosenne odświeżenie wyglądu -Warszawa 2024',
        'Letnia pielęgnacja - poradnik na upały w mieście',
        'Jesienny detoks beauty w Warszawie',
        'Zimowe zabiegi regenerujące - Warsaw special',
        'Przygotowania na sezon świąteczny - beauty tips',
        'Noworoczne postanowienia fitness z trenerem Warszawa'
      ]
    }
  });

  const [currentPage, setCurrentPage] = useState('home');
  const [customKeywords, setCustomKeywords] = useState<string[]>([]);

  const localSEOChecklist = [
    { item: 'Google Business Profile zaktualizowany', completed: true, priority: 'high' },
    { item: 'NAP consistency (Name, Address, Phone)', completed: true, priority: 'high' },
    { item: 'Polskie słowa kluczowe w tytułach', completed: true, priority: 'high' },
    { item: 'Lokalizacja w meta description', completed: true, priority: 'medium' },
    { item: 'Opinie klientów w języku polskim', completed: false, priority: 'high' },
    { item: 'Zdjęcia z geotaggingiem Warszawa', completed: false, priority: 'medium' },
    { item: 'Lokalne backlinki z warszawskich stron', completed: false, priority: 'medium' },
    { item: 'Schema markup dla lokalnego biznesu', completed: true, priority: 'high' },
    { item: 'Hreflang tags dla PL/EN', completed: true, priority: 'medium' },
    { item: 'Content w języku polskim', completed: true, priority: 'high' }
  ];

  const warsawNeighborhoods = [
    'Śródmieście', 'Mokotów', 'Wola', 'Praga-Południe', 'Ursynów',
    'Bemowo', 'Białołęka', 'Targówek', 'Ochota', 'Żoliborz',
    'Bielany', 'Wawer', 'Praga-Północ', 'Rembertów', 'Wesoła'
  ];

  const addCustomKeyword = (keyword: string) => {
    if (keyword && !customKeywords.includes(keyword)) {
      setCustomKeywords([...customKeywords, keyword]);
    }
  };

  const removeCustomKeyword = (keyword: string) => {
    setCustomKeywords(customKeywords.filter(k => k !== keyword));
  };

  const generateSchemaMarkup = () => {
    return {
      "@context": "https://schema.org",
      "@type": "BeautySalon",
      "name": seoData.localBusiness.name,
      "description": "Professional permanent makeup and personal training services in Warsaw city center",
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Smolna 8",
        "addressLocality": "Warszawa",
        "addressRegion": "Mazowieckie",
        "postalCode": "00-375",
        "addressCountry": "PL"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": 52.2297,
        "longitude": 21.0122
      },
      "telephone": seoData.localBusiness.phone,
      "url": seoData.localBusiness.website,
      "openingHours": [
        "Mo-Fr 09:00-19:00",
        "Sa 10:00-16:00"
      ],
      "priceRange": "$$$$",
      "paymentAccepted": "Cash, Credit Card, Bank Transfer",
      "languagesSpoken": ["Polish", "English", "Ukrainian", "Russian"],
      "serviceArea": {
        "@type": "GeoCircle",
        "geoMidpoint": {
          "@type": "GeoCoordinates",
          "latitude": 52.2297,
          "longitude": 21.0122
        },
        "geoRadius": "5000"
      }
    };
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Search className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Polskie SEO - Warszawa</h1>
            <p className="text-gray-600">Optymalizacja dla polskiego rynku luksusowego</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="default" className="gap-1">
            <MapPin className="w-4 h-4" />
            Warszawa
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Globe className="w-4 h-4" />
            PL
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="keywords" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="keywords" className="gap-2">
            <Target className="w-4 h-4" />
            Słowa kluczowe
          </TabsTrigger>
          <TabsTrigger value="local" className="gap-2">
            <MapPin className="w-4 h-4" />
            Lokalne SEO
          </TabsTrigger>
          <TabsTrigger value="competitors" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            Konkurencja
          </TabsTrigger>
          <TabsTrigger value="content" className="gap-2">
            <Users className="w-4 h-4" />
            Content
          </TabsTrigger>
          <TabsTrigger value="technical" className="gap-2">
            <Award className="w-4 h-4" />
            Techniczne
          </TabsTrigger>
        </TabsList>

        {/* Keywords */}
        <TabsContent value="keywords" className="space-y-6">
          <div className="grid grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Słowa kluczowe podstawowe</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {seoData.localKeywords.primary.map((keyword, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-green-50 rounded">
                      <span className="text-sm">{keyword}</span>
                      <Badge variant="secondary" className="text-xs">Wysoka</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Słowa kluczowe dodatkowe</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {seoData.localKeywords.secondary.map((keyword, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                      <span className="text-sm">{keyword}</span>
                      <Badge variant="outline" className="text-xs">Średnia</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Long-tail keywords</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {seoData.localKeywords.longTail.map((keyword, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-purple-50 rounded">
                      <span className="text-sm">{keyword}</span>
                      <Badge variant="outline" className="text-xs">Niska</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Custom Keywords */}
          <Card>
            <CardHeader>
              <CardTitle>Własne słowa kluczowe</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Dodaj słowo kluczowe..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      addCustomKeyword((e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
                <Button onClick={() => {
                  const input = document.querySelector('input[placeholder="Dodaj słowo kluczowe..."]') as HTMLInputElement;
                  if (input) {
                    addCustomKeyword(input.value);
                    input.value = '';
                  }
                }}>
                  Dodaj
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {customKeywords.map((keyword, index) => (
                  <Badge key={index} variant="secondary" className="cursor-pointer" onClick={() => removeCustomKeyword(keyword)}>
                    {keyword} ×
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Warsaw Neighborhoods */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="w-5 h-5" />
                Dzielnice Warszawy - Lokalne Targetowanie
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-2">
                {warsawNeighborhoods.map((neighborhood, index) => (
                  <Badge key={index} variant="outline" className="cursor-pointer hover:bg-gray-100">
                    {neighborhood}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Local SEO */}
        <TabsContent value="local" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Local SEO Checklist</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {localSEOChecklist.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {item.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                      )}
                      <span className={item.completed ? 'line-through text-gray-500' : ''}>
                        {item.item}
                      </span>
                    </div>
                    <Badge
                      variant={
                        item.priority === 'high' ? 'destructive' :
                        item.priority === 'medium' ? 'default' : 'secondary'
                      }
                    >
                      {item.priority === 'high' ? 'Wysoki' :
                       item.priority === 'medium' ? 'Średni' : 'Niski'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Google Business Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nazwa firmy</Label>
                  <Input value={seoData.localBusiness.name} readOnly />
                </div>
                <div>
                  <Label>Kategoria</Label>
                  <Input value={seoData.localBusiness.category} readOnly />
                </div>
                <div className="col-span-2">
                  <Label>Adres</Label>
                  <Input value={seoData.localBusiness.address} readOnly />
                </div>
                <div>
                  <Label>Telefon</Label>
                  <Input value={seoData.localBusiness.phone} readOnly />
                </div>
                <div>
                  <Label>Strona internetowa</Label>
                  <Input value={seoData.localBusiness.website} readOnly />
                </div>
              </div>
              <div>
                <Label>Godziny pracy</Label>
                <div className="mt-2 space-y-1">
                  {seoData.localBusiness.hours.map((hour, index) => (
                    <div key={index} className="text-sm text-gray-600">{hour}</div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Competitors */}
        <TabsContent value="competitors" className="space-y-6">
          <div className="space-y-4">
            {seoData.competitors.map((competitor, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {competitor.name}
                    <Badge variant="outline">Konkurent</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-green-600 mb-2">Mocne strony</h4>
                      <ul className="space-y-1">
                        {competitor.strengths.map((strength, idx) => (
                          <li key={idx} className="text-sm flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            {strength}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-red-600 mb-2">Słabe strony</h4>
                      <ul className="space-y-1">
                        {competitor.weaknesses.map((weakness, idx) => (
                          <li key={idx} className="text-sm flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-600" />
                            {weakness}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">Słowa kluczowe konkurencji:</h4>
                    <div className="flex flex-wrap gap-2">
                      {competitor.keywords.map((keyword, idx) => (
                        <Badge key={idx} variant="secondary">{keyword}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Content Strategy */}
        <TabsContent value="content" className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tematy blogowe</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {seoData.contentStrategy.blogTopics.map((topic, index) => (
                    <div key={index} className="p-2 border rounded text-sm">
                      {topic}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lokalne wydarzenia</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {seoData.contentStrategy.localEvents.map((event, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded text-sm">
                      {event}
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Content sezonowy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {seoData.contentStrategy.seasonalContent.map((content, index) => (
                  <div key={index} className="p-3 border rounded-lg text-sm">
                    {content}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Technical SEO */}
        <TabsContent value="technical" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Schema Markup - Strukturalne dane</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <pre className="text-sm overflow-x-auto">
                    {JSON.stringify(generateSchemaMarkup(), null, 2)}
                  </pre>
                </div>
                <Button className="gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Test Schema Markup
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Hreflang Implementation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-gray-600">
                  Implementacja hreflang dla wersji polskiej i angielskiej:
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <code className="text-sm">
                    {`<link rel="alternate" hreflang="pl" href="https://mariaborysevych.com/pl" />
<link rel="alternate" hreflang="en" href="https://mariaborysevych.com/en" />
<link rel="alternate" hreflang="x-default" href="https://mariaborysevych.com" />`}
                  </code>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PolishSEOOptimizer;