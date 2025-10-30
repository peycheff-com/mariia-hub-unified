import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Mic,
  Search,
  MessageSquare,
  Volume2,
  Smartphone,
  Clock,
  MapPin,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Globe,
  Users,
  Zap,
  Target,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';

interface VoiceQuery {
  query: string;
  intent: 'question' | 'navigation' | 'transactional' | 'informational';
  category: 'beauty' | 'fitness' | 'general';
  volume: number;
  difficulty: number;
  answer: string;
  keywords: string[];
  relatedQueries: string[];
}

interface VoiceSearchOptimization {
  type: 'faq' | 'howto' | 'definition' | 'comparison';
  query: string;
  answer: string;
  keywords: string[];
  featured: boolean;
  wordCount: number;
}

interface LocalVoiceQuery {
  query: string;
  location: string;
  distance: string;
  intent: string;
  result: string;
  confidence: number;
}

const VoiceSearchOptimizer: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'beauty' | 'fitness' | 'all'>('all');
  const [voiceQueries, setVoiceQueries] = useState<VoiceQuery[]>([]);
  const [optimizations, setOptimizations] = useState<VoiceSearchOptimization[]>([]);
  const [localQueries, setLocalQueries] = useState<LocalVoiceQuery[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Voice search query database
  const voiceQueryDatabase: VoiceQuery[] = [
    {
      query: 'Gdzie mogę zrobić makijaż permanentny w Warszawie?',
      intent: 'navigation',
      category: 'beauty',
      volume: 3200,
      difficulty: 65,
      answer: 'BM BEAUTY STUDIO w Śródmieściu Warszawy oferuje profesjonalny makijaż permanentny brwi, ust i eyelinera. Znajdujemy się przy ul. Smolna 8/254, 00-375 Warszawa.',
      keywords: ['makijaż permanentny Warszawa', 'PMU Warszawa', 'beauty salon Warszawa'],
      relatedQueries: [
        'Jakie studio makijażu permanentnego polecają?',
        'Ile kosztuje makijaż permanentny w Warszawie?',
        'Kto jest najlepszym specjalistą od PMU w Warszawie?'
      ]
    },
    {
      query: 'Jak dbać o skórę po makijażu permanentnym?',
      intent: 'informational',
      category: 'beauty',
      volume: 1800,
      difficulty: 45,
      answer: 'Po makijażu permanentnym należy unikać wilgoci przez 7 dni, stosować specjalne kremy gojące, nie zdrapać naskórka i unikać słońca przez 4 tygodnie.',
      keywords: ['pielęgnacja PMU', 'gojenie makijażu permanentnego', 'care after permanent makeup'],
      relatedQueries: [
        'Co można jeść po PMU?',
        'Jak przyspieszyć gojenie po makijażu permanentnym?',
        'Kiedy mogę wrócić do pracy po PMU?'
      ]
    },
    {
      query: 'Który trening personalny jest najlepszy na odchudzanie?',
      intent: 'informational',
      category: 'fitness',
      volume: 2400,
      difficulty: 55,
      answer: 'Na odchudzanie najlepsze są treningi interwałowe (HIIT), trening siłowy z dużą liczbą powtórzeń oraz trening cardio połączony z dietą kaloryczną.',
      keywords: ['trening odchudzający', 'personal training weight loss', 'fitness na odchudzanie'],
      relatedQueries: [
        'Jak często ćwiczyć żeby schudnąć?',
        'Ile czasu schudnąć 10 kg?',
        'Jaki trening jest najlepszy na spalanie tłuszczu?'
      ]
    },
    {
      query: 'Gdzie w Warszawie mogę znaleźć trenera personalnego?',
      intent: 'navigation',
      category: 'fitness',
      volume: 2800,
      difficulty: 70,
      answer: 'Mariia Borysevych oferuje profesjonalny trening personalny w Warszawie. Specjalizuje się w treningach holistycznych w Zdrofit oraz treningach personalnych dla kobiet.',
      keywords: ['trener personalny Warszawa', 'personal training Warsaw', 'fitness Warszawa'],
      relatedQueries: [
        'Ile kosztuje trener personalny w Warszawie?',
        'Jak wybrać dobrego trenera personalnego?',
        'Czy warto zainwestować w trenera personalnego?'
      ]
    },
    {
      query: 'Jak długo utrzymuje się makijaż permanentny?',
      intent: 'informational',
      category: 'beauty',
      volume: 1600,
      difficulty: 40,
      answer: 'Makijaż permanentny utrzymuje się od 1 do 3 lat, w zależności od partii twarzy, techniki i pielęgnacji. Brwi i eyeliner najdłużej, usta najkrócej.',
      keywords: ['trwałość PMU', 'how long permanent makeup lasts', 'PMU longevity'],
      relatedQueries: [
        'Jak często robić poprawki PMU?',
        'Czy makijaż permanentny się zmywa?',
        'Co wpływa na trwałość makijażu permanentnego?'
      ]
    },
    {
      query: 'Jakie ćwiczenia na jędrne pośladki?',
      intent: 'informational',
      category: 'fitness',
      volume: 3000,
      difficulty: 50,
      answer: 'Najlepsze ćwiczenia na jędrne pośladki to przysiady, wykroki, martwy ciąg, hip thrusty oraz mostki. Ważna jest regularność i progresja obciążenia.',
      keywords: ['ćwiczenia na pośladki', 'glutes exercises', 'jędre pośladki trening'],
      relatedQueries: [
        'Ile ćwiczyć żeby mieć jędrne pośladki?',
        'Jak szybko wzmocnić pośladki?',
        'Czy joga pomaga na jędrne pośladki?'
      ]
    }
  ];

  // Voice search optimizations
  const voiceOptimizations: VoiceSearchOptimization[] = [
    {
      type: 'faq',
      query: 'Jak wygląda zabieg makijażu permanentnego?',
      answer: 'Zabieg makijażu permanentnego trwa 2-3 godziny. Zaczyna się od konsultacji i projektu, następnie aplikacja znieczulenia, a na końcu wykonanie makijażu.',
      keywords: ['zabieg PMU', 'jak wygląda makijaż permanentny', 'permanent makeup procedure'],
      featured: true,
      wordCount: 45
    },
    {
      type: 'howto',
      query: 'Jak przygotować się do makijażu permanentnego?',
      answer: 'Przed zabiegiem unikaj alkoholu przez 24h, kofeiny przez 4h, przyjmuj preparaty witaminy K przez 3 dni, nie opalaj skóry przez 2 tygodnie.',
      keywords: ['przygotowanie do PMU', 'how to prepare for permanent makeup', 'PMU preparation'],
      featured: true,
      wordCount: 52
    },
    {
      type: 'definition',
      query: 'Czym jest makijaż permanentny?',
      answer: 'Makijaż permanentny to zabieg kosmetyczny polegający na wprowadzaniu hipoalergicznych pigmentów pod skórę w celu trwałego podkreślenia rysów twarzy.',
      keywords: ['co to jest PMU', 'definition permanent makeup', 'makijaż permanentny definicja'],
      featured: true,
      wordCount: 38
    },
    {
      type: 'comparison',
      query: 'Makijaż permanentny vs microblading',
      answer: 'Microblading to technika makijażu permanentnego wykonywana ręcznie, tworząca naturalne włoski. Makijaż permanentny może być wykonany maszynowo, trwa dłużej.',
      keywords: ['microblading vs PMU', 'permanent makeup vs microblading', 'różnica technik PMU'],
      featured: true,
      wordCount: 58
    },
    {
      type: 'faq',
      query: 'Czy makijaż permanentny boli?',
      answer: 'Zabieg może być lekko bolesny, ale stosowane jest znieczulenie miejscowe. Ból jest porównywalny do igłowania lub depilacji woskiem.',
      keywords: ['czy PMU boli', 'permanent makeup pain', 'ból podczas makijażu permanentnego'],
      featured: true,
      wordCount: 42
    },
    {
      type: 'howto',
      query: 'Jak ćwiczyć w domu na pośladki?',
      answer: 'W domu możesz wykonywać przysiady klasyczne, przysiady sumo, wykroki boczne i przednie, mostki pośladkowe oraz donkey kicks.',
      keywords: ['ćwiczenia domowe pośladki', 'home glutes workout', 'trening pośladków w domu'],
      featured: true,
      wordCount: 48
    }
  ];

  // Local voice search queries
  const localVoiceQueries: LocalVoiceQuery[] = [
    {
      query: 'Najbliższy salon piękności Warszawa',
      location: 'Warszawa Śródmieście',
      distance: '0.5 km',
      intent: 'near me',
      result: 'BM BEAUTY STUDIO - Smolna 8/254',
      confidence: 92
    },
    {
      query: 'Gdzie zrobę makijaż permanentny w centrum',
      location: 'Warszawa centrum',
      distance: '1.2 km',
      intent: 'local search',
      result: 'BM BEAUTY STUDIO - profesjonalny PMU',
      confidence: 88
    },
    {
      query: 'Siłownia blisko mnie Warszawa Mokotów',
      location: 'Warszawa Mokotów',
      distance: '2.1 km',
      intent: 'fitness nearby',
      result: 'Zdrofit Mokotów - trening personalny',
      confidence: 85
    },
    {
      query: 'Jaki kosmetyczka poleca w Warszawie',
      location: 'Warszawa',
      distance: 'dookoła',
      intent: 'recommendation',
      result: 'Mariia Borysevych - specjalista PMU',
      confidence: 79
    },
    {
      query: 'Trener personalny w pobliżu',
      location: 'Warszawa',
      distance: '3 km',
      intent: 'local service',
      result: 'Treningi personalne Mariia Borysevych',
      confidence: 76
    }
  ];

  useEffect(() => {
    const filteredQueries = voiceQueryDatabase.filter(query =>
      selectedCategory === 'all' || query.category === selectedCategory
    );
    setVoiceQueries(filteredQueries);
    setOptimizations(voiceOptimizations);
    setLocalQueries(localVoiceQueries);
  }, [selectedCategory]);

  const startRecording = () => {
    setIsRecording(true);
    setTranscribedText('');

    // Simulate voice recording
    setTimeout(() => {
      const simulatedQueries = [
        'Gdzie mogę zrobić makijaż permanentny w Warszawie?',
        'Jakie ćwiczenia na jędrne pośladki?',
        'Ile kosztuje trener personalny?',
        'Jak dbać o brwi po laminacji?'
      ];
      const randomQuery = simulatedQueries[Math.floor(Math.random() * simulatedQueries.length)];
      setTranscribedText(randomQuery);
      setIsRecording(false);
    }, 3000);
  };

  const stopRecording = () => {
    setIsRecording(false);
  };

  const generateVoiceOptimizedContent = (query: VoiceQuery) => {
    return `
## ${query.query}

### Odpowiedź:
${query.answer}

### Rozwinięcie:
${query.answer} To pytanie jest często zadawane przez klientki z Warszawy poszukujących profesjonalnych usług beauty. Nasze studio BM BEAUTY specjalizuje się w ${query.keywords.join(', ')} i oferuje najwyższą jakość usług w centrum Warszawy.

### Dodatkowe informacje:
- Lokalizacja: ul. Smolna 8/254, 00-375 Warszawa
- Kontakt: +48 536 200 573
- Rezerwacja online: https://mariaborysevych.com/book

### Powiązane pytania:
${query.relatedQueries.map(q => `- ${q}`).join('\n')}

### Słowa kluczowe:
${query.keywords.join(', ')}
    `;
  };

  const calculateVoiceSearchScore = (query: VoiceQuery) => {
    const conversationalScore = query.query.includes('?') ? 20 : 0;
    const naturalLanguageScore = query.query.split(' ').length > 6 ? 15 : 0;
    const localIntentScore = query.query.toLowerCase().includes('warszawa') ? 25 : 10;
    const intentScore = query.intent === 'question' ? 20 : 10;
    const volumeScore = Math.min(query.volume / 100, 15);

    return conversationalScore + naturalLanguageScore + localIntentScore + intentScore + volumeScore;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-50 rounded-lg">
            <Mic className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Voice Search Optimizer</h1>
            <p className="text-gray-600">Optymalizacja dla wyszukiwania głosowego i asystentów AI</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="default" className="gap-1">
            <Volume2 className="w-4 h-4" />
            Voice Ready
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Smartphone className="w-4 h-4" />
            Mobile First
          </Badge>
        </div>
      </div>

      {/* Voice Recording Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="w-5 h-5" />
            Test Wyszukiwania Głosowego
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-center">
              <Button
                size="lg"
                variant={isRecording ? "destructive" : "default"}
                onClick={isRecording ? stopRecording : startRecording}
                className="w-24 h-24 rounded-full"
              >
                {isRecording ? (
                  <Pause className="w-8 h-8" />
                ) : (
                  <Play className="w-8 h-8" />
                )}
              </Button>
            </div>

            {isRecording && (
              <div className="text-center">
                <div className="inline-flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-red-600">Nagrywanie...</span>
                </div>
                <div className="mt-2 flex justify-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="w-1 bg-green-500 animate-pulse"
                      style={{
                        height: `${Math.random() * 30 + 10}px`,
                        animationDelay: `${i * 0.1}s`
                      }}
                    ></div>
                  ))}
                </div>
              </div>
            )}

            {transcribedText && (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <Label className="text-sm text-gray-600">Rozpoznana fraza:</Label>
                  <p className="text-lg font-semibold">{transcribedText}</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setSearchQuery(transcribedText)}>
                    <Search className="w-4 h-4 mr-2" />
                    Analizuj
                  </Button>
                  <Button variant="outline">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Nagrywaj ponownie
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="queries" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="queries" className="gap-2">
            <Search className="w-4 h-4" />
            Zapytania
          </TabsTrigger>
          <TabsTrigger value="optimization" className="gap-2">
            <Target className="w-4 h-4" />
            Optymalizacja
          </TabsTrigger>
          <TabsTrigger value="local" className="gap-2">
            <MapPin className="w-4 h-4" />
            Lokalne
          </TabsTrigger>
          <TabsTrigger value="assistant" className="gap-2">
            <MessageSquare className="w-4 h-4" />
            Asystenci
          </TabsTrigger>
        </TabsList>

        {/* Voice Queries Analysis */}
        <TabsContent value="queries" className="space-y-6">
          <div className="flex items-center gap-4 mb-6">
            <Label>Kategoria:</Label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as 'beauty' | 'fitness' | 'all')}
              className="px-3 py-2 border rounded-md"
            >
              <option value="all">Wszystkie</option>
              <option value="beauty">Beauty</option>
              <option value="fitness">Fitness</option>
            </select>
            <div className="flex-1">
              <Input
                placeholder="Szukaj zapytań..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {voiceQueries
              .filter(query =>
                searchQuery === '' ||
                query.query.toLowerCase().includes(searchQuery.toLowerCase()) ||
                query.answer.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((query, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="text-lg">{query.query}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">Score: {calculateVoiceSearchScore(query)}</Badge>
                      <Badge variant={
                        query.intent === 'question' ? 'default' :
                        query.intent === 'navigation' ? 'secondary' : 'outline'
                      }>
                        {query.intent}
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-gray-600 mb-2">Idealna odpowiedź (29 słów):</div>
                      <p className="text-sm font-medium">{query.answer}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Wolumen</div>
                        <div className="font-semibold">{query.volume.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Trudność</div>
                        <div className="font-semibold">{query.difficulty}/100</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-600 mb-2">Słowa kluczowe:</div>
                      <div className="flex flex-wrap gap-1">
                        {query.keywords.map((keyword, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-600 mb-2">Powiązane zapytania:</div>
                      <div className="space-y-1">
                        {query.relatedQueries.slice(0, 2).map((related, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            <MessageSquare className="w-3 h-3 text-blue-500" />
                            {related}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button size="sm">
                        <Target className="w-4 h-4 mr-2" />
                        Optymalizuj
                      </Button>
                      <Button size="sm" variant="outline">
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Implementuj
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Voice Search Optimization */}
        <TabsContent value="optimization" className="space-y-6">
          <div className="space-y-4">
            {optimizations.map((opt, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="text-lg">{opt.query}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        opt.type === 'faq' ? 'default' :
                        opt.type === 'howto' ? 'secondary' : 'outline'
                      }>
                        {opt.type}
                      </Badge>
                      {opt.featured && (
                        <Badge variant="default" className="gap-1">
                          <Star className="w-3 h-3" />
                          Featured
                        </Badge>
                      )}
                      <Badge variant="outline">{opt.wordCount} słów</Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-gray-600 mb-2">Optymalizowana odpowiedź:</div>
                      <p className="text-sm">{opt.answer}</p>
                    </div>

                    <div>
                      <div className="text-sm text-gray-600 mb-2">Słowa kluczowe:</div>
                      <div className="flex flex-wrap gap-1">
                        {opt.keywords.map((keyword, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span>Długość idealna</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span>Język naturalny</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span>Direct answer</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button size="sm">
                        <Play className="w-4 h-4 mr-2" />
                        Test Voice
                      </Button>
                      <Button size="sm" variant="outline">
                        <Target className="w-4 h-4 mr-2" />
                        Implement
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Local Voice Search */}
        <TabsContent value="local" className="space-y-6">
          <div className="space-y-4">
            {localQueries.map((query, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="text-lg">{query.query}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{query.distance}</Badge>
                      <Badge variant={
                        query.confidence > 80 ? 'default' :
                        query.confidence > 60 ? 'secondary' : 'outline'
                      }>
                        {query.confidence}% confidence
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Lokalizacja:</div>
                        <div className="font-semibold flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-blue-600" />
                          {query.location}
                        </div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Intent:</div>
                        <div className="font-semibold">{query.intent}</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-600 mb-2">Rekomendowany wynik:</div>
                      <p className="text-sm font-medium">{query.result}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button size="sm">
                        <MapPin className="w-4 h-4 mr-2" />
                        Optymalizuj lokalnie
                      </Button>
                      <Button size="sm" variant="outline">
                        <Smartphone className="w-4 h-4 mr-2" />
                        Test mobile
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Voice Assistant Optimization */}
        <TabsContent value="assistant" className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Google Assistant
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold">Optymalizacja dla Google Assistant:</h4>
                    <ul className="space-y-1 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        Odpowiedzi w 29 słów
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        Struktura Question-Answer
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        FAQ schema markup
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        Naturalny język
                      </li>
                    </ul>
                  </div>
                  <Button size="sm" className="w-full">
                    <Target className="w-4 h-4 mr-2" />
                    Test Google Assistant
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Siri & Alexa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold">Optymalizacja dla Siri & Alexa:</h4>
                    <ul className="space-y-1 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        Short answers
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        Local business info
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        Contact details
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        Business hours
                      </li>
                    </ul>
                  </div>
                  <Button size="sm" className="w-full">
                    <Target className="w-4 h-4 mr-2" />
                    Test Siri & Alexa
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Voice Search Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold">Trendy w wyszukiwaniu głosowym:</h4>
                    <ul className="space-y-1 text-sm">
                      <li className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                        +76% wzrost zapytań lokalnych
                      </li>
                      <li className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                        +52% zapytań o usługi
                      </li>
                      <li className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                        +48% zapytań jak zrobić coś
                      </li>
                      <li className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-600" />
                        +35% zapytań porównawczych
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5" />
                  Mobile Voice Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-semibold">Statystyki mobilnego wyszukiwania:</h4>
                    <ul className="space-y-1 text-sm">
                      <li>27% globalnej populacji używa voice search na mobile</li>
                      <li>52% użytkowników smartwatchów używa voice search</li>
                      <li>71% prefers voice search over typing</li>
                      <li>62% użytkowników voice search szuka lokalnych biznesów</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VoiceSearchOptimizer;