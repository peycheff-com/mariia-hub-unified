import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  MapPin,
  Building,
  Users,
  TrendingUp,
  Search,
  Globe,
  Target,
  Star,
  Award,
  Navigation,
  Clock,
  Phone,
  Mail,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface WarsawDistrict {
  name: string;
  keywords: string[];
  population: string;
  demographics: string[];
  landmarks: string[];
  competitors: string[];
  opportunities: string[];
}

interface LocalSearchTerm {
  term: string;
  volume: 'high' | 'medium' | 'low';
  competition: 'high' | 'medium' | 'low';
  difficulty: number;
  intent: 'informational' | 'commercial' | 'transactional';
  districts: string[];
}

const HyperlocalWarsawSEO: React.FC = () => {
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Śródmieście');
  const [customKeywords, setCustomKeywords] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [generatedContent, setGeneratedContent] = useState<string>('');

  // Comprehensive Warsaw districts data
  const warsawDistricts: WarsawDistrict[] = [
    {
      name: 'Śródmieście',
      keywords: [
        'makijaż permanentny Śródmieście',
        'PMU Warszawa centrum',
        'beauty salon Warsaw center',
        'kosmetyczka Warszawa Śródmieście',
        'trening personalny centrum Warszawy',
        'fitness Warszawa Stare Miasto',
        'salon urody ul. Marszałkowska',
        'PMU przy ul. Złotej'
      ],
      population: '121,000',
      demographics: ['Profesjonaliści', 'Managerowie', 'Przedsiębiorcy', 'Expats'],
      landmarks: ['Pałac Kultury', 'Stare Miasto', 'Rynek', 'Złote Tarasy', 'Palac Belwederski'],
      competitors: ['Chanel Beauty', 'Estée Lauder Studio', 'L\'Oréal Professional', 'Premium Fitness'],
      opportunities: ['Luksusowe usługi', 'Express treatments', 'After-work appointments', 'Weekend packages']
    },
    {
      name: 'Mokotów',
      keywords: [
        'makijaż permanentny Mokotów',
        'PMU Warszawa Mokotów',
        'beauty salon Mokotów',
        'kosmetyczka ul. Puławska',
        'trening personalny Mokotów',
        'fitness Mokotów Służewiec',
        'salon urody Ursynów',
        'PMU przy metro Wilanowska'
      ],
      population: '216,000',
      demographics: ['Firmy', 'Korporacje', 'Nowoczesne rodziny', 'Młodzi profesjonaliści'],
      landmarks: ['Pole Mokotowskie', 'Służewiec Biznesowy', 'Gal Mokotów', 'Fort Mokotów'],
      competitors: ['Zdrofit Mokotów', 'Pure Fitness', 'Beauty Avenue', 'Wellness Center'],
      opportunities: ['Corporate packages', 'Lunch break treatments', 'Early morning sessions', 'Corporate wellness']
    },
    {
      name: 'Wola',
      keywords: [
        'makijaż permanentny Wola',
        'PMU Warszawa Wola',
        'beauty salon Wola',
        'kosmetyczka ul. Wolska',
        'trening personalny Wola',
        'fitness Wola Rondo Daszyńskiego',
        'salon urody ul. Prosta',
        'PMU near Warsaw Spire'
      ],
      population: '140,000',
      demographics: ['Pracownicy biurowi', 'Młodzi dorośli', 'Nowi mieszkańcy', 'International expats'],
      landmarks: ['Warsaw Spire', 'Rondo Daszyńskiego', 'Cmentarz Powązkowski', 'Muzeum Powstania'],
      competitors: ['Fit Fabric', 'The Body Lab', 'Urban Beauty', 'Office Wellness'],
      opportunities: ['Before/after work services', 'Corporate memberships', 'Express beauty packages', 'Lunch time fitness']
    },
    {
      name: 'Praga-Południe',
      keywords: [
        'makijaż permanentny Praga',
        'PMU Warszawa Praga',
        'beauty salon Praga Południe',
        'kosmetyczka ul. Grochowska',
        'trening personalny Praga',
        'fitness Saski Kępa',
        'salon urody Gocław',
        'PMU ul. Wiatraczna'
      ],
      population: '180,000',
      demographics: ['Artyści', 'Kreatywni profesjonaliści', 'Rodziny', 'Tradycyjni mieszkańcy'],
      landmarks: ['Stadion Narodowy', 'Park Skaryszewski', 'Saska Kępa', 'ZOO Warszawa'],
      competitors: ['Artistic Beauty', 'Creative Fitness', 'Boho Studio', 'Wellness Praga'],
      opportunities: ['Artistic approach', 'Alternative beauty concepts', 'Creative fitness programs', 'Community events']
    },
    {
      name: 'Żoliborz',
      keywords: [
        'makijaż permanentny Żoliborz',
        'PMU Warszawa Żoliborz',
        'beauty salon Żoliborz',
        'kosmetyczka ul. Wilsona',
        'trening personalny Żoliborz',
        'fitness Żoliborz Politechnika',
        'salon urody ul. Mickiewicza',
        'PMU Plac Wilsona'
      ],
      population: '50,000',
      demographics: ['Inteligencja', 'Profesorowie', 'Akademicy', 'Wykształcone rodziny'],
      landmarks: ['Park Żeromskiego', 'Plac Wilsona', 'Muzeum Niepodległości', 'Stara Papiernia'],
      competitors: ['Academic Beauty', 'Scholar Fitness', 'Intellectual Wellness', 'Campus Beauty'],
      opportunities: ['Intellectual approach', 'Educational content', 'Scientific methods', 'Academic packages']
    },
    {
      name: 'Ursynów',
      keywords: [
        'makijaż permanentny Ursynów',
        'PMU Warszawa Ursynów',
        'beauty salon Ursynów',
        'kosmetyczka ul. Kabacki',
        'trening personalny Ursynów',
        'fitness Ursynów Natolin',
        'salon urody metro Ursynów',
        'PMU Imielin'
      ],
      population: '150,000',
      demographics: ['Rodziny z dziećmi', 'Młodzi profesjonaliści', 'Studentki', 'Nowi mieszkańcy'],
      landmarks: ['Kampus UW', 'Las Kabacki', 'Metro Imielin', 'Park Natoliński'],
      competitors: ['Family Fitness', 'Kids Beauty', 'Urban Wellness Ursynów', 'Active Life'],
      opportunities: ['Family packages', 'Mother-daughter treatments', 'Student discounts', 'Weekend family programs']
    }
  ];

  // Advanced local search terms
  const localSearchTerms: LocalSearchTerm[] = [
    {
      term: 'makijaż permanentny Warszawa Śródmieście',
      volume: 'high',
      competition: 'high',
      difficulty: 75,
      intent: 'transactional',
      districts: ['Śródmieście']
    },
    {
      term: 'najlepszy PMU Warszawa',
      volume: 'high',
      competition: 'high',
      difficulty: 85,
      intent: 'commercial',
      districts: ['Śródmieście', 'Mokotów', 'Wola']
    },
    {
      term: 'makijaż permanentny brwi cena',
      volume: 'medium',
      competition: 'medium',
      difficulty: 60,
      intent: 'commercial',
      districts: ['All districts']
    },
    {
      term: 'naturalny makijaż permanentny ust',
      volume: 'medium',
      competition: 'medium',
      difficulty: 55,
      intent: 'informational',
      districts: ['All districts']
    },
    {
      term: 'trening personalny Warszawa cena',
      volume: 'high',
      competition: 'high',
      difficulty: 70,
      intent: 'commercial',
      districts: ['All districts']
    },
    {
      term: 'fitness dla kobiet Warszawa',
      volume: 'medium',
      competition: 'medium',
      difficulty: 50,
      intent: 'transactional',
      districts: ['Mokotów', 'Praga-Południe', 'Ursynów']
    },
    {
      term: 'beauty salon weekend Warszawa',
      volume: 'medium',
      competition: 'low',
      difficulty: 40,
      intent: 'transactional',
      districts: ['Śródmieście', 'Wola']
    },
    {
      term: 'makijaż permanentny po 40 Warszawa',
      volume: 'low',
      competition: 'low',
      difficulty: 30,
      intent: 'commercial',
      districts: ['Żoliborz', 'Mokotów']
    }
  ];

  const selectedDistrictData = warsawDistricts.find(d => d.name === selectedDistrict);

  const generateHyperlocalContent = (district: WarsawDistrict) => {
    const content = `
# Makijaż Permanentny w Dzielnicy ${district.name} - Profesjonalne Usługi Beauty

Szukasz najlepszego studia makijażu permanentnego w dzielnicy ${district.name}?
Odkryj luksusowe usługi BM BEAUTY STUDIO w sercu Warszawy.
Specjalizujemy się w naturalnym makijażu permanentnym ust, brwi i eyelinera
dla wymagających klientek z dzielnicy ${district.name}.

## Nasze Usługi w Dzielnicy ${district.name}

### Makijaż Permanentny Brwi ${district.name}
- Precyzyjne modelowanie brwi metodą healed-first
- Techniki: powder brows, microblading, ombre
- Czas trwania: 2-3 godziny
- Efekt utrzymuje się: 1-3 lata

### Makijaż Permanentny Ust ${district.name}
- Delikatny lip blush dla naturalnego efektu
- Korekta asymetrii i powiększenie ust
- Czas trwania: 2 godziny
- Gojenie: 7-14 dni

### Eyeliner Permanentny ${district.name}
- Precyzyjna kreska, która nie rozmazuje się
- Opcje: subtelna lub wyrazista linia
- Idealna dla aktywnych kobiet z ${district.name}

## Dlaczego Klientki z ${district.name} Wybierają BM BEAUTY?

### Lokalizacja
Nasze studio znajduje się w centrum Warszawy, łatwo dostępne z ${district.name}.
Dogodny dojazd komunikacją publiczną i samochodem.

### Doświadczenie
 ponad 5 lat doświadczenia w makijażu permanentnym
 setki zadowolonych klientek z dzielnicy ${district.name}
 certyfikaty i szkolenia międzynarodowe

### Luksusowe Podejście
 indywidualne podejście do każdej klientki
 najwyższej jakości pigmenty
 sterylne i bezpieczne warunki
 luksusowe wnętrze studio

## ${district.name} - Specjalne Pakiety dla Mieszkanek

**Pakiet Biznesowy ${district.name}**
- Makijaż permanentny brwi + ust
- Touch-up po 4 tygodniach
- 10% zniżki dla mieszkańców ${district.name}

**Pakiet Princess ${district.name}**
- Konsultacja + próbny rysunek
- Makijaż permanentny wybranych partii
- Produkty do pielęgnacji po zabiegu

## Umów Wizytę z ${district.name}

Skontaktuj się z nami i umów na bezpłatną konsultację:

📞 Telefon: +48 536 200 573
📍 Adres: Smolna 8/254, 00-375 Warszawa
🌐 Online: https://mariaborysevych.com/book

**Dojazd z ${district.name}:**
${district.landmarks.slice(0, 3).map(landmark => `- ${landmark} - 15-20 min`).join('\n')}

## Opinie Klientek z ${district.name}

"Jestem z ${district.name} i dojeżdżam do BM BEAUTY na wszystkie zabiegi.
Warto każdego kilometra! Profesjonalizm i efekty wow!" - Anna, ${district.name}

"Najlepszy makijaż permanentny w Warszawie! Polecam każdej kobiecie z ${district.name}." - Karolina, ${district.name}
    `;
    return content;
  };

  const generateDistrictLandingPage = (district: WarsawDistrict) => {
    const content = generateHyperlocalContent(district);
    setGeneratedContent(content);
  };

  const getDistrictSEOKeywords = (district: WarsawDistrict) => {
    return [
      ...district.keywords,
      `PMU ${district.name}`,
      `permanent makeup ${district.name}`,
      `beauty salon ${district.name}`,
      `kosmetyczka ${district.name}`,
      `makijaż ${district.name} cena`,
      `najlepszy makijaż permanentny ${district.name}`,
      `naturalny PMU ${district.name}`
    ];
  };

  const addCustomKeyword = (keyword: string) => {
    if (keyword && !customKeywords.includes(keyword)) {
      setCustomKeywords([...customKeywords, keyword]);
    }
  };

  const removeCustomKeyword = (keyword: string) => {
    setCustomKeywords(customKeywords.filter(k => k !== keyword));
  };

  useEffect(() => {
    if (selectedDistrictData) {
      generateDistrictLandingPage(selectedDistrictData);
    }
  }, [selectedDistrict]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <MapPin className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Hyperlocal SEO - Warszawa</h1>
            <p className="text-gray-600">Zdominuj lokalny rynek w każdej dzielnicy Warszawy</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="default" className="gap-1">
            <Target className="w-4 h-4" />
            {selectedDistrict}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Globe className="w-4 h-4" />
            PL
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="districts" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="districts" className="gap-2">
            <Building className="w-4 h-4" />
            Dzielnice
          </TabsTrigger>
          <TabsTrigger value="keywords" className="gap-2">
            <Search className="w-4 h-4" />
            Słowa kluczowe
          </TabsTrigger>
          <TabsTrigger value="content" className="gap-2">
            <Users className="w-4 h-4" />
            Content
          </TabsTrigger>
          <TabsTrigger value="competitors" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            Konkurencja
          </TabsTrigger>
          <TabsTrigger value="strategy" className="gap-2">
            <Award className="w-4 h-4" />
            Strategia
          </TabsTrigger>
        </TabsList>

        {/* Districts */}
        <TabsContent value="districts" className="space-y-6">
          <div className="grid grid-cols-3 gap-6">
            {warsawDistricts.map((district) => (
              <Card
                key={district.name}
                className={`cursor-pointer transition-all hover:shadow-lg ${
                  selectedDistrict === district.name ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedDistrict(district.name)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {district.name}
                    <Badge variant="outline">{district.population}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Demografia:</h4>
                      <div className="flex flex-wrap gap-1">
                        {district.demographics.slice(0, 3).map((demo, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {demo}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Top 3 słowa kluczowe:</h4>
                      <div className="space-y-1">
                        {district.keywords.slice(0, 3).map((keyword, index) => (
                          <div key={index} className="text-xs text-gray-600 truncate">
                            {keyword}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedDistrictData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Navigation className="w-5 h-5" />
                  Szczegóły Dzielnicy: {selectedDistrictData.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Lokalne atrakcje:</h4>
                    <div className="space-y-1">
                      {selectedDistrictData.landmarks.map((landmark, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <Star className="w-4 h-4 text-yellow-500" />
                          {landmark}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3">Słowa kluczowe:</h4>
                    <div className="flex flex-wrap gap-2">
                      {getDistrictSEOKeywords(selectedDistrictData).map((keyword, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Keywords Analysis */}
        <TabsContent value="keywords" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Lokalne Terminy Wyszukiwania</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {localSearchTerms.map((term, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold">{term.term}</h4>
                      <div className="flex items-center gap-4 mt-2">
                        <Badge variant={
                          term.volume === 'high' ? 'default' :
                          term.volume === 'medium' ? 'secondary' : 'outline'
                        }>
                          Wolumen: {term.volume}
                        </Badge>
                        <Badge variant={
                          term.competition === 'high' ? 'destructive' :
                          term.competition === 'medium' ? 'default' : 'secondary'
                        }>
                          Konkurencja: {term.competition}
                        </Badge>
                        <Badge variant="outline">
                          Trudność: {term.difficulty}/100
                        </Badge>
                        <Badge variant="outline">
                          Intent: {term.intent}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {term.districts.map((district, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {district}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Własne Słowa Kluczowe</CardTitle>
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
        </TabsContent>

        {/* Content Generation */}
        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Generator Contentu dla Dzielnicy
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Label>Wybierz dzielnicę:</Label>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="px-3 py-2 border rounded-md"
                  >
                    {warsawDistricts.map((district) => (
                      <option key={district.name} value={district.name}>
                        {district.name}
                      </option>
                    ))}
                  </select>
                  <Button onClick={() => selectedDistrictData && generateDistrictLandingPage(selectedDistrictData)}>
                    Generuj Content
                  </Button>
                </div>

                {generatedContent && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Wygenerowany content dla {selectedDistrict}:</h4>
                      <Button
                        variant="outline"
                        onClick={() => navigator.clipboard.writeText(generatedContent)}
                      >
                        Kopiuj
                      </Button>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg max-h-96 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm">{generatedContent}</pre>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Competitors */}
        <TabsContent value="competitors" className="space-y-6">
          {selectedDistrictData && (
            <Card>
              <CardHeader>
                <CardTitle>Konkurencja w Dzielnicy {selectedDistrictData.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Główni konkurenci:</h4>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedDistrictData.competitors.map((competitor, index) => (
                        <div key={index} className="p-3 border rounded-lg">
                          <h5 className="font-semibold">{competitor}</h5>
                          <p className="text-sm text-gray-600 mt-1">
                            Analiza konkurencji dla {selectedDistrictData.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Możliwości:</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedDistrictData.opportunities.map((opportunity, index) => (
                        <div key={index} className="flex items-center gap-2 p-2 bg-green-50 rounded">
                          <CheckCircle2 className="w-4 h-4 text-green-600" />
                          <span className="text-sm">{opportunity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Strategy */}
        <TabsContent value="strategy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Strategia Hyperlocal SEO dla Warszawy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Krótkoterminowe cele (1-3 miesiące):</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span>Stworzenie landing pages dla każdej dzielnicy</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span>Optymalizacja Google Business Profile dla lokalnych zapytań</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      <span>Budowanie lokalnych backlinków z warszawskich portali</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Średnioterminowe cele (3-6 miesięcy):</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <span>Tworzenie contentu skierowanego na konkretne dzielnice</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <span>Kampanie lokalne w mediach społecznościowych</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <span>Współpraca z lokalnymi influencerami z Warszawy</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Długoterminowe cele (6-12 miesięcy):</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-purple-600" />
                      <span>Zdominowanie lokalnych wyników wyszukiwania</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-purple-600" />
                      <span>Pozycjonowanie lidera opinii w każdej dzielnicy</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Award className="w-5 h-5 text-purple-600" />
                      <span>Rozbudowa marki na cały rynek warszawski</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HyperlocalWarsawSEO;