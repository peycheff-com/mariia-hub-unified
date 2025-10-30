import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  TrendingUp,
  TrendingDown,
  Search,
  Globe,
  Target,
  BarChart3,
  Filter,
  Download,
  Eye,
  MousePointer,
  Calendar
} from 'lucide-react';

import { polishSEOKeywords, generateKeywordCombinations, polishMetaTemplates, englishMetaTemplates } from '@/lib/polish-seo-keywords';

interface KeywordData {
  keyword: string;
  language: 'pl' | 'en';
  category: string;
  searchVolume: number;
  competition: 'low' | 'medium' | 'high';
  difficulty: number;
  cpc: number;
  trend: 'up' | 'down' | 'stable';
  lastUpdated: string;
  searchIntent: 'informational' | 'commercial' | 'transactional' | 'navigational';
  localVolume?: number;
  position?: number;
  url?: string;
}

interface PolishKeywordAnalyzerProps {
  currentKeywords?: string[];
}

export const PolishKeywordAnalyzer: React.FC<PolishKeywordAnalyzerProps> = ({
  currentKeywords = []
}) => {
  const [selectedLanguage, setSelectedLanguage] = useState<'pl' | 'en' | 'all'>('pl');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedIntent, setSelectedIntent] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'volume' | 'difficulty' | 'competition'>('volume');

  // Mock keyword data - in production, this would come from API
  const keywordData: KeywordData[] = useMemo(() => {
    const mockData: KeywordData[] = [];

    polishSEOKeywords.forEach(category => {
      category.polishKeywords.forEach(keyword => {
        mockData.push({
          keyword,
          language: 'pl',
          category: category.category,
          searchVolume: Math.floor(Math.random() * 10000) + 100,
          competition: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
          difficulty: Math.floor(Math.random() * 100),
          cpc: Math.random() * 10 + 0.5,
          trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as any,
          lastUpdated: new Date().toISOString(),
          searchIntent: category.searchIntent,
          localVolume: Math.floor(Math.random() * 5000) + 50,
          position: Math.floor(Math.random() * 50) + 1,
          url: `https://mariaborysevych.com`
        });
      });

      category.englishKeywords.forEach(keyword => {
        mockData.push({
          keyword,
          language: 'en',
          category: category.category,
          searchVolume: Math.floor(Math.random() * 5000) + 50,
          competition: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
          difficulty: Math.floor(Math.random() * 100),
          cpc: Math.random() * 8 + 0.3,
          trend: ['up', 'down', 'stable'][Math.floor(Math.random() * 3)] as any,
          lastUpdated: new Date().toISOString(),
          searchIntent: category.searchIntent,
          localVolume: Math.floor(Math.random() * 1000) + 10
        });
      });
    });

    return mockData;
  }, []);

  const filteredKeywords = useMemo(() => {
    let filtered = keywordData;

    if (selectedLanguage !== 'all') {
      filtered = filtered.filter(k => k.language === selectedLanguage);
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(k => k.category === selectedCategory);
    }

    if (selectedIntent !== 'all') {
      filtered = filtered.filter(k => k.searchIntent === selectedIntent);
    }

    if (searchTerm) {
      filtered = filtered.filter(k =>
        k.keyword.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort by selected criteria
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'volume':
          return b.searchVolume - a.searchVolume;
        case 'difficulty':
          return a.difficulty - b.difficulty;
        case 'competition':
          const competitionOrder = { low: 1, medium: 2, high: 3 };
          return competitionOrder[a.competition] - competitionOrder[b.competition];
        default:
          return 0;
      }
    });

    return filtered;
  }, [keywordData, selectedLanguage, selectedCategory, selectedIntent, searchTerm, sortBy]);

  const categories = Array.from(new Set(keywordData.map(k => k.category)));
  const totalVolume = filteredKeywords.reduce((sum, k) => sum + k.searchVolume, 0);
  const avgDifficulty = Math.round(
    filteredKeywords.reduce((sum, k) => sum + k.difficulty, 0) / filteredKeywords.length
  );

  const getCompetitionColor = (competition: string) => {
    switch (competition) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getIntentIcon = (intent: string) => {
    switch (intent) {
      case 'informational': return <Eye className="w-4 h-4" />;
      case 'commercial': return <BarChart3 className="w-4 h-4" />;
      case 'transactional': return <MousePointer className="w-4 h-4" />;
      case 'navigational': return <Globe className="w-4 h-4" />;
      default: return <Search className="w-4 h-4" />;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <div className="w-4 h-4 bg-gray-400 rounded-full" />;
    }
  };

  const generateMetaDescription = (keyword: KeywordData) => {
    if (keyword.language === 'pl') {
      return polishMetaTemplates.service(
        keyword.category.toLowerCase(),
        'Warszawa',
        `${Math.floor(Math.random() * 500) + 200} PLN`
      );
    } else {
      return englishMetaTemplates.service(
        keyword.category.toLowerCase(),
        'Warsaw',
        `${Math.floor(Math.random() * 100) + 50} EUR`
      );
    }
  };

  const exportToCSV = () => {
    const headers = ['Keyword', 'Language', 'Category', 'Volume', 'Competition', 'Difficulty', 'CPC', 'Trend', 'Intent'];
    const rows = filteredKeywords.map(k => [
      k.keyword,
      k.language,
      k.category,
      k.searchVolume.toString(),
      k.competition,
      k.difficulty.toString(),
      k.cpc.toFixed(2),
      k.trend,
      k.searchIntent
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `warsaw-beauty-keywords-${selectedLanguage}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Polish Keyword Strategy Analyzer</h2>
        <p className="text-gray-600">
          Analyze and optimize your Polish and English keywords for Warsaw beauty and fitness market
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Keywords</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredKeywords.length}</div>
            <p className="text-xs text-gray-500 mt-1">
              {filteredKeywords.filter(k => k.language === 'pl').length} Polish,
              {filteredKeywords.filter(k => k.language === 'en').length} English
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Search Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalVolume.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">
              Monthly searches
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg. Difficulty</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgDifficulty}%</div>
            <Progress value={avgDifficulty} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Low Competition</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredKeywords.filter(k => k.competition === 'low').length}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Easy to rank keywords
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Input
              placeholder="Search keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <Select value={selectedLanguage} onValueChange={(value: any) => setSelectedLanguage(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Languages</SelectItem>
                <SelectItem value="pl">Polish</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedIntent} onValueChange={setSelectedIntent}>
              <SelectTrigger>
                <SelectValue placeholder="Search Intent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Intents</SelectItem>
                <SelectItem value="informational">Informational</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
                <SelectItem value="transactional">Transactional</SelectItem>
                <SelectItem value="navigational">Navigational</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="volume">Search Volume</SelectItem>
                <SelectItem value="difficulty">Difficulty</SelectItem>
                <SelectItem value="competition">Competition</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Keyword Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Keyword Analysis</CardTitle>
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Keyword</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Volume</TableHead>
                  <TableHead>Competition</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Trend</TableHead>
                  <TableHead>Intent</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredKeywords.slice(0, 20).map((keyword, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium max-w-xs">
                      <div className="truncate" title={keyword.keyword}>
                        {keyword.keyword}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={keyword.language === 'pl' ? 'default' : 'secondary'}>
                        {keyword.language.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{keyword.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{keyword.searchVolume.toLocaleString()}</div>
                        {keyword.localVolume && (
                          <div className="text-xs text-gray-500">
                            Local: {keyword.localVolume.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getCompetitionColor(keyword.competition)}>
                        {keyword.competition}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-12 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${keyword.difficulty}%` }}
                          ></div>
                        </div>
                        <span className="text-sm">{keyword.difficulty}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(keyword.trend)}
                        <span className="text-sm capitalize">{keyword.trend}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {getIntentIcon(keyword.searchIntent)}
                        <span className="text-sm capitalize">{keyword.searchIntent}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline">
                        Target
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredKeywords.length > 20 && (
            <div className="mt-4 text-center text-sm text-gray-500">
              Showing 20 of {filteredKeywords.length} keywords. Export to see all.
            </div>
          )}
        </CardContent>
      </Card>

      {/* SEO Recommendations */}
      <Alert>
        <Target className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-2">
            <p className="font-medium">SEO Recommendations:</p>
            <ul className="text-sm space-y-1">
              <li>• Focus on Polish keywords with low competition and high local volume</li>
              <li>• Target Warsaw-specific variations to capture local search intent</li>
              <li>• Use transactional keywords on service pages and booking pages</li>
              <li>• Create content around informational keywords for blog posts</li>
              <li>• Monitor and track keyword rankings monthly</li>
            </ul>
          </div>
        </AlertDescription>
      </Alert>
    </div>
  );
};