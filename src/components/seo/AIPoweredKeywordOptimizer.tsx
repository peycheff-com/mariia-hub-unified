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
  Brain,
  TrendingUp,
  Target,
  Zap,
  BarChart3,
  Globe,
  Users,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Download,
  RefreshCw,
  Star
} from 'lucide-react';

interface KeywordData {
  keyword: string;
  volume: number;
  difficulty: number;
  intent: 'informational' | 'commercial' | 'transactional';
  trend: 'rising' | 'stable' | 'declining';
  competition: number;
  opportunity: number;
  related: string[];
  suggestions: string[];
}

interface ContentOpportunity {
  title: string;
  targetKeyword: string;
  content: string;
  estimatedTraffic: number;
  difficulty: number;
  wordCount: number;
  relatedTopics: string[];
}

interface CompetitorAnalysis {
  competitor: string;
  keywords: string[];
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
}

const AIPoweredKeywordOptimizer: React.FC = () => {
  const [analysisQuery, setAnalysisQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'beauty' | 'fitness' | 'both'>('beauty');
  const [selectedLanguage, setSelectedLanguage] = useState<'pl' | 'en'>('pl');
  const [keywords, setKeywords] = useState<KeywordData[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [contentOpportunities, setContentOpportunities] = useState<ContentOpportunity[]>([]);
  const [competitorAnalysis, setCompetitorAnalysis] = useState<CompetitorAnalysis[]>([]);

  // Simulated AI keyword database
  const keywordDatabase: Record<string, KeywordData[]> = {
    beauty: [
      {
        keyword: 'makijaż permanentny Warszawa',
        volume: 4800,
        difficulty: 72,
        intent: 'transactional',
        trend: 'rising',
        competition: 85,
        opportunity: 65,
        related: ['PMU Warszawa', 'permanent makeup Warszawa', 'makijaż permanentny cena'],
        suggestions: ['makijaż permanentny Śródmieście', 'naturalny PMU Warszawa', 'makijaż permanentny brwi']
      },
      {
        keyword: 'brwi permanentne Warszawa',
        volume: 3200,
        difficulty: 68,
        intent: 'commercial',
        trend: 'rising',
        competition: 78,
        opportunity: 70,
        related: ['stylizacja brwi Warszawa', 'laminacja brwi Warszawa', 'henna brwi Warszawa'],
        suggestions: ['microblading Warszawa', 'ombre brwi Warszawa', 'powder brows Warszawa']
      },
      {
        keyword: 'usta permanentne Warszawa',
        volume: 2400,
        difficulty: 64,
        intent: 'commercial',
        trend: 'stable',
        competition: 72,
        opportunity: 75,
        related: ['lip blush Warszawa', 'konturówka ust Warszawa', 'makijaż permanentny ust'],
        suggestions: ['naturalne usta permanentne', 'lip blush cena Warszawa', 'makijaż permanentny korekta']
      },
      {
        keyword: 'eyeliner permanentny Warszawa',
        volume: 1600,
        difficulty: 58,
        intent: 'transactional',
        trend: 'stable',
        competition: 65,
        opportunity: 80,
        related: ['kreska permanentna Warszawa', 'eyeliner tattoo Warszawa', 'makijaż oczu permanentny'],
        suggestions: ['delikatny eyeliner permanentny', 'winged eyeliner permanentny', 'eyeliner górna linia']
      },
      {
        keyword: 'jak dbać o PMU',
        volume: 1400,
        difficulty: 42,
        intent: 'informational',
        trend: 'rising',
        competition: 55,
        opportunity: 85,
        related: ['pielęgnacja PMU', 'gojenie makijażu permanentnego', 'po zabiegu PMU'],
        suggestions: ['produkty do PMU', 'jak przyspieszyć gojenie PMU', 'problemy po PMU']
      },
      {
        keyword: 'PMU cena Warszawa',
        volume: 2200,
        difficulty: 61,
        intent: 'commercial',
        trend: 'stable',
        competition: 70,
        opportunity: 72,
        related: ['cena makijażu permanentnego', 'PMU promocja', 'ile kosztuje PMU'],
        suggestions: ['tanie PMU Warszawa', 'PMU pakiet cena', 'koszt makijażu permanentnego']
      }
    ],
    fitness: [
      {
        keyword: 'trening personalny Warszawa',
        volume: 3600,
        difficulty: 75,
        intent: 'transactional',
        trend: 'rising',
        competition: 82,
        opportunity: 60,
        related: ['trener personalny Warszawa', 'personal training Warsaw', 'fitness personalny'],
        suggestions: ['trening personalny dla kobiet', 'trening personalny cena', 'trening personalny w domu']
      },
      {
        keyword: 'fitness Warszawa Śródmieście',
        volume: 2400,
        difficulty: 67,
        intent: 'transactional',
        trend: 'stable',
        competition: 78,
        opportunity: 65,
        related: ['siłownia Warszawa centrum', 'klub fitness Śródmieście', 'fitness Warszawa'],
        suggestions: ['fitness dla początkujących Warszawa', 'siłownia bez umowy Warszawa', 'fitness 24h Warszawa']
      },
      {
        keyword: 'trening na pośladki',
        volume: 3200,
        difficulty: 55,
        intent: 'informational',
        trend: 'rising',
        competition: 60,
        opportunity: 75,
        related: ['ćwiczenia na pośladki', 'joga na pośladki', 'siłownia na pośladki'],
        suggestions: ['trening glutes', 'jędrne pośladki ćwiczenia', 'trening na pupę w domu']
      },
      {
        keyword: 'odchudzanie Warszawa',
        volume: 2900,
        difficulty: 62,
        intent: 'commercial',
        trend: 'stable',
        competition: 75,
        opportunity: 68,
        related: ['dieta Warszawa', 'trening odchudzający', 'konsultacja dietetyczna'],
        suggestions: ['skuteczne odchudzanie', 'dieta odchudzająca', 'plan treningowy odchudzanie']
      },
      {
        keyword: 'joga Warszawa',
        volume: 1800,
        difficulty: 58,
        intent: 'transactional',
        trend: 'rising',
        competition: 68,
        opportunity: 70,
        related: ['joga dla początkujących', 'joga Śródmieście', 'studio jogi Warszawa'],
        suggestions: ['joga w parku Warszawa', 'joga online Warszawa', 'joga dla kobiet']
      },
      {
        keyword: 'trening funkcjonalny',
        volume: 1400,
        difficulty: 52,
        intent: 'informational',
        trend: 'rising',
        competition: 58,
        opportunity: 78,
        related: ['crossfit Warszawa', 'trening siłowy', 'ćwiczenia funkcjonalne'],
        suggestions: ['trening funkcjonalny w domu', 'przybory do treningu funkcjonalnego', 'plan treningowy funkcjonalny']
      }
    ]
  };

  const contentOpportunitiesDatabase: ContentOpportunity[] = [
    {
      title: 'Kompleksowy Poradnik: Makijaż Permanentny Brwi 2024',
      targetKeyword: 'makijaż permanentny brwi',
      content: 'Przewodnik po najnowszych technikach makijażu permanentnego brwi w Warszawie.',
      estimatedTraffic: 1200,
      difficulty: 68,
      wordCount: 2000,
      relatedTopics: ['Techniki PMU', 'Pielęgnacja po zabiegu', 'Ceny i czas trwania']
    },
    {
      title: 'Jak Wybrać Najlepszego Trenera Personalnego w Warszawie',
      targetKeyword: 'trening personalny Warszawa',
      content: 'Poradnik wyboru trenera personalnego dopasowanego do Twoich celów.',
      estimatedTraffic: 800,
      difficulty: 75,
      wordCount: 1500,
      relatedTopics: ['Certyfikacje trenerów', 'Metody treningowe', 'Ceny usług']
    },
    {
      title: 'Naturalny Lip Blush: Trend w Makijażu Permanentnym',
      targetKeyword: 'usta permanentne',
      content: 'Wszystko o naturalnym efekcie lip blush w Warszawie.',
      estimatedTraffic: 600,
      difficulty: 64,
      wordCount: 1200,
      relatedTopics: ['Przed i po', 'Gojenie', 'Trwałość']
    },
    {
      title: '5 Błędów w Pielęgnacji PMU, Których Musisz Unikać',
      targetKeyword: 'jak dbać o PMU',
      content: 'Najczęstsze błędy w pielęgnacji makijażu permanentnego i jak ich unikać.',
      estimatedTraffic: 900,
      difficulty: 42,
      wordCount: 1000,
      relatedTopics: ['Produkty pielęgnacyjne', 'Gojenie', 'Problemy skórne']
    },
    {
      title: 'Trening Na Jędre Pośladki: Kompleksowy Plan',
      targetKeyword: 'trening na pośladki',
      content: 'Skuteczny plan treningowy na jędre pośladki z przykładami ćwiczeń.',
      estimatedTraffic: 1000,
      difficulty: 55,
      wordCount: 1800,
      relatedTopics: ['Dieta', 'Suplementacja', 'Sprzęt']
    }
  ];

  const competitorDatabase: CompetitorAnalysis[] = [
    {
      competitor: 'Warsaw Beauty Clinic',
      keywords: ['beauty clinic Warsaw', 'PMU Warsaw', 'kosmetyka Warszawa'],
      strengths: ['Lokalizacja centrum', 'Duży zasięg na Instagramie', 'Wysokie oceny'],
      weaknesses: ['Mniej personalizacja', 'Wyższe ceny', 'Ograniczone usługi fitness'],
      opportunities: ['Wprowadzenie usług fitness', 'Programy lojalnościowe', 'Content marketing']
    },
    {
      competitor: 'Elite Fitness Center',
      keywords: ['fitness Warsaw', 'personal training Warsaw', 'siłownia Warszawa'],
      strengths: ['Nowoczesny sprzęt', 'Duża przestrzeń', 'Zróżnicowane zajęcia'],
      weaknesses: ['Brak usług beauty', 'Wysokie członkostwo', 'Tłumy w godzinach szczytu'],
      opportunities: ['Wprowadzenie strefy beauty', 'Programy dla firm', 'Online coaching']
    },
    {
      competitor: 'Luxury PMU Studio',
      keywords: ['PMU studio Warsaw', 'permanent makeup luxury', 'makijaż permanentny premium'],
      strengths: ['Luksusowe wnętrze', 'Specjalizacja PMU', 'Doświadczenie'],
      weaknesses: ['Ograniczone usługi', 'Wysokie ceny', 'Lokalizacja peryferyjna'],
      opportunities: ['Rozszerzenie usług', 'Lokalizacje centralne', 'Pakiety VIP']
    }
  ];

  const analyzeKeywords = () => {
    setIsAnalyzing(true);

    // Simulate AI analysis
    setTimeout(() => {
      const baseKeywords = keywordDatabase[selectedCategory];
      const filteredKeywords = baseKeywords.filter(keyword =>
        keyword.keyword.toLowerCase().includes(analysisQuery.toLowerCase()) ||
        analysisQuery === ''
      );

      setKeywords(filteredKeywords);
      setContentOpportunities(contentOpportunitiesDatabase);
      setCompetitorAnalysis(competitorDatabase);
      setIsAnalyzing(false);
    }, 2000);
  };

  const generateContentIdeas = (keyword: KeywordData) => {
    return [
      `Kompleksowy poradnik: ${keyword.keyword}`,
      `10 pytań o ${keyword.keyword}`,
      `Błędy w ${keyword.keyword}, których unikać`,
      `Cena ${keyword.keyword} - czy warto?`,
      `${keyword.keyword} - przed i po efekty`
    ];
  };

  const calculateOpportunityScore = (keyword: KeywordData) => {
    const volumeScore = (keyword.volume / 100) * 0.3;
    const difficultyScore = ((100 - keyword.difficulty) / 100) * 0.3;
    const competitionScore = ((100 - keyword.competition) / 100) * 0.2;
    const trendScore = keyword.trend === 'rising' ? 0.2 : keyword.trend === 'stable' ? 0.1 : 0;

    return Math.round((volumeScore + difficultyScore + competitionScore + trendScore) * 100);
  };

  useEffect(() => {
    analyzeKeywords();
  }, [selectedCategory]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-50 rounded-lg">
            <Brain className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Keyword Optimizer</h1>
            <p className="text-gray-600">Inteligentna optymalizacja słów kluczowych dla beauty & fitness</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="default" className="gap-1">
            <Zap className="w-4 h-4" />
            AI Powered
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Globe className="w-4 h-4" />
            {selectedLanguage.toUpperCase()}
          </Badge>
        </div>
      </div>

      {/* Analysis Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Analiza Słów Kluczowych
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="flex-1">
              <Label>Słowo kluczowe lub fraza:</Label>
              <Input
                placeholder="np. makijaż permanentny Warszawa"
                value={analysisQuery}
                onChange={(e) => setAnalysisQuery(e.target.value)}
              />
            </div>
            <div>
              <Label>Kategoria:</Label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as 'beauty' | 'fitness' | 'both')}
                className="px-3 py-2 border rounded-md"
              >
                <option value="beauty">Beauty</option>
                <option value="fitness">Fitness</option>
                <option value="both">Obie</option>
              </select>
            </div>
            <div>
              <Label>Język:</Label>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value as 'pl' | 'en')}
                className="px-3 py-2 border rounded-md"
              >
                <option value="pl">Polski</option>
                <option value="en">English</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={analyzeKeywords} disabled={isAnalyzing}>
                {isAnalyzing ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Analizowanie...
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4 mr-2" />
                    Analizuj
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="keywords" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="keywords" className="gap-2">
            <Search className="w-4 h-4" />
            Słowa Kluczowe
          </TabsTrigger>
          <TabsTrigger value="opportunities" className="gap-2">
            <Lightbulb className="w-4 h-4" />
            Możliwości
          </TabsTrigger>
          <TabsTrigger value="competitors" className="gap-2">
            <BarChart3 className="w-4 h-4" />
            Konkurencja
          </TabsTrigger>
          <TabsTrigger value="content" className="gap-2">
            <TrendingUp className="w-4 h-4" />
            Content Strategy
          </TabsTrigger>
        </TabsList>

        {/* Keywords Analysis */}
        <TabsContent value="keywords" className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {keywords.map((keyword, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="text-lg">{keyword.keyword}</span>
                    <Badge variant={
                      calculateOpportunityScore(keyword) > 75 ? 'default' :
                      calculateOpportunityScore(keyword) > 50 ? 'secondary' : 'outline'
                    }>
                      Score: {calculateOpportunityScore(keyword)}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-600">Wolumen</div>
                        <div className="font-semibold">{keyword.volume.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Trudność</div>
                        <div className="font-semibold">{keyword.difficulty}/100</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Konkurencja</div>
                        <div className="font-semibold">{keyword.competition}/100</div>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600">Trend</div>
                        <Badge variant={
                          keyword.trend === 'rising' ? 'default' :
                          keyword.trend === 'stable' ? 'secondary' : 'outline'
                        }>
                          {keyword.trend}
                        </Badge>
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-600 mb-2">Intent:</div>
                      <Badge variant="outline">{keyword.intent}</Badge>
                    </div>

                    <div>
                      <div className="text-sm text-gray-600 mb-2">Powiązane słowa:</div>
                      <div className="flex flex-wrap gap-1">
                        {keyword.related.slice(0, 5).map((related, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {related}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-sm text-gray-600 mb-2">AI Sugestie:</div>
                      <div className="space-y-1">
                        {keyword.suggestions.slice(0, 3).map((suggestion, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            <Lightbulb className="w-3 h-3 text-yellow-500" />
                            {suggestion}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Content Opportunities */}
        <TabsContent value="opportunities" className="space-y-6">
          <div className="space-y-4">
            {contentOpportunities.map((opportunity, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {opportunity.title}
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{opportunity.estimatedTraffic} traffic</Badge>
                      <Badge variant="outline">Difficulty: {opportunity.difficulty}</Badge>
                      <Badge variant="outline">{opportunity.wordCount} words</Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-gray-600 mb-2">Target Keyword:</div>
                      <Badge variant="default">{opportunity.targetKeyword}</Badge>
                    </div>

                    <div>
                      <div className="text-sm text-gray-600 mb-2">Content Summary:</div>
                      <p className="text-sm">{opportunity.content}</p>
                    </div>

                    <div>
                      <div className="text-sm text-gray-600 mb-2">Related Topics:</div>
                      <div className="flex flex-wrap gap-2">
                        {opportunity.relatedTopics.map((topic, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Generate Content
                      </Button>
                      <Button size="sm" variant="outline">
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Save Opportunity
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Competitor Analysis */}
        <TabsContent value="competitors" className="space-y-6">
          <div className="space-y-4">
            {competitorAnalysis.map((competitor, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    {competitor.competitor}
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
                    <h4 className="font-semibold text-blue-600 mb-2">Możliwości dla Ciebie:</h4>
                    <div className="grid grid-cols-3 gap-3">
                      {competitor.opportunities.map((opportunity, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 bg-blue-50 rounded">
                          <Star className="w-4 h-4 text-blue-600" />
                          <span className="text-sm">{opportunity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">Słowa kluczowe konkurenta:</h4>
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
          <Card>
            <CardHeader>
              <CardTitle>AI Content Strategy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Strategia Contentowa na 3 Miesiące:</h4>
                  <div className="space-y-4">
                    <div className="p-4 border rounded-lg">
                      <h5 className="font-semibold mb-2">Miesiąc 1: Fundamenty</h5>
                      <ul className="space-y-1 text-sm">
                        <li>• 4 artykuły poradnikowe (how-to)</li>
                        <li>• 2 artykuły komercyjne (porównania)</li>
                        <li>• 1 artykuł lokalny (Warszawa)</li>
                        <li>• 2 posty na blogu o zabiegach</li>
                      </ul>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h5 className="font-semibold mb-2">Miesiąc 2: Ekspansja</h5>
                      <ul className="space-y-1 text-sm">
                        <li>• 3 artykuły trendów (2024)</li>
                        <li>• 2 artykuły case studies</li>
                        <li>• 1 artykuł gościnny</li>
                        <li>• 3 posty na social media</li>
                      </ul>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h5 className="font-semibold mb-2">Miesiąc 3: Dominacja</h5>
                      <ul className="space-y-1 text-sm">
                        <li>• 2 artykuły eksperckie</li>
                        <li>• 1 artykuł wideo</li>
                        <li>• 1 infografika</li>
                        <li>• 4 posty interaktywne</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Kalendarz Publikacji:</h4>
                  <div className="grid grid-cols-7 gap-2">
                    {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb', 'Nd'].map((day, index) => (
                      <div key={index} className="text-center font-semibold text-sm">
                        {day}
                      </div>
                    ))}
                    {Array.from({ length: 28 }, (_, index) => (
                      <div
                        key={index}
                        className={`p-2 border rounded text-xs ${
                          index % 7 === 2 ? 'bg-blue-100' :
                          index % 7 === 5 ? 'bg-green-100' :
                          index % 7 === 0 ? 'bg-purple-100' :
                          'bg-gray-50'
                        }`}
                      >
                        {index + 1}
                        {index % 7 === 2 && '📝'}
                        {index % 7 === 5 && '📱'}
                        {index % 7 === 0 && '🎥'}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-4 mt-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-100 rounded"></div>
                      <span>Blog post</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-100 rounded"></div>
                      <span>Social media</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-purple-100 rounded"></div>
                      <span>Wideo</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Sugerowane Tematy Contentowe:</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      'Najnowsze techniki PMU 2024',
                      'Jak przygotować się do zabiegu',
                      'Pielęgnacja po makijażu permanentnym',
                      'Częste pytania o PMU',
                      'Trening personalny vs siłownia',
                      'Dieta wspierająca efekty fitness'
                    ].map((topic, index) => (
                      <div key={index} className="flex items-center gap-2 p-3 border rounded-lg">
                        <Lightbulb className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm">{topic}</span>
                      </div>
                    ))}
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

export default AIPoweredKeywordOptimizer;