import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Clock, AlertTriangle, ExternalLink, RefreshCw, MapPin, Star } from 'lucide-react';

interface BusinessListing {
  id: string;
  name: string;
  platform: string;
  url: string;
  category: string;
  status: 'verified' | 'pending' | 'unlisted' | 'error';
  lastUpdated: string;
  reviews: {
    count: number;
    average: number;
  };
  napsConsistent: boolean;
  profileCompleteness: number;
  actions: string[];
}

interface LocalBusinessListingsProps {
  businessData: {
    name: string;
    address: string;
    phone: string;
    website: string;
    categories: string[];
  };
}

export const LocalBusinessListings: React.FC<LocalBusinessListingsProps> = ({ businessData }) => {
  const [listings, setListings] = useState<BusinessListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all');

  // Polish business directories and platforms
  const polishPlatforms = [
    {
      id: 'booksy',
      name: 'Booksy',
      url: 'https://booksy.com/pl/pl/102735832_b-m-beauty-studio_studio-kosmetyczne_105984_warszawa',
      category: 'Beauty & Wellness',
      priority: 'high',
      description: 'Wiodąca platforma rezerwacji usług beauty w Polsce'
    },
    {
      id: 'google-business',
      name: 'Google Business Profile',
      url: 'https://maps.google.com',
      category: 'Local Search',
      priority: 'high',
      description: 'Profil Google Moja Firma dla lokalnego SEO'
    },
    {
      id: 'panorama-firm',
      name: 'Panorama Firm',
      url: 'https://panoramafirm.pl',
      category: 'Business Directory',
      priority: 'medium',
      description: 'Największa baza polskich firm'
    },
    {
      id: 'zloty',
      name: 'Złoty',
      url: 'https://zapytaj.zlote-strony.pl',
      category: 'Local Directory',
      priority: 'medium',
      description: 'Lokalny katalog firm z ocenami'
    },
    {
      id: 'kogo',
      name: 'Kogo',
      url: 'https://kogo.pl',
      category: 'Service Directory',
      priority: 'medium',
      description: 'Platforma do wyszukiwania usług lokalnych'
    },
    {
      id: 'oferteo',
      name: 'Oferteo',
      url: 'https://oferteo.pl',
      category: 'Service Marketplace',
      priority: 'low',
      description: 'Platforma zapytań o oferty usług'
    },
    {
      id: 'gumtree',
      name: 'Gumtree',
      url: 'https://www.gumtree.pl',
      category: 'Classifieds',
      priority: 'low',
      description: 'Lokalne ogłoszenia usługowe'
    },
    {
      id: 'otodom',
      name: 'Otodom Usługi',
      url: 'https://uslugi.otodom.pl',
      category: 'Service Directory',
      priority: 'low',
      description: 'Usługi na platformie nieruchomościowej'
    }
  ];

  const internationalPlatforms = [
    {
      id: 'instagram',
      name: 'Instagram Business',
      url: 'https://www.instagram.com/mariiaborysevych/',
      category: 'Social Media',
      priority: 'high',
      description: 'Profil biznesowy Instagram'
    },
    {
      id: 'facebook',
      name: 'Facebook Business',
      url: 'https://www.facebook.com/BMBeautyStudioWarsaw',
      category: 'Social Media',
      priority: 'high',
      description: 'Strona Facebook firmy'
    },
    {
      id: 'yelp',
      name: 'Yelp',
      url: 'https://www.yelp.com',
      category: 'Review Platform',
      priority: 'medium',
      description: 'Międzynarodowa platforma recenzji'
    },
    {
      id: 'tripadvisor',
      name: 'TripAdvisor',
      url: 'https://www.tripadvisor.com',
      category: 'Travel & Tourism',
      priority: 'low',
      description: 'Dla klientów turystycznych'
    }
  ];

  useEffect(() => {
    // Simulate fetching listings data
    const fetchListings = async () => {
      setLoading(true);

      // Mock data - in real app, this would fetch from backend
      const mockListings: BusinessListing[] = [
        {
          id: 'booksy',
          name: 'BM BEAUTY STUDIO',
          platform: 'Booksy',
          url: 'https://booksy.com/pl/pl/102735832_b-m-beauty-studio_studio-kosmetyczne_105984_warszawa',
          category: 'Beauty & Wellness',
          status: 'verified',
          lastUpdated: '2024-01-15',
          reviews: { count: 44, average: 4.8 },
          napsConsistent: true,
          profileCompleteness: 95,
          actions: ['Ask for new review', 'Update holiday hours']
        },
        {
          id: 'google-business',
          name: 'BM BEAUTY STUDIO',
          platform: 'Google Business Profile',
          url: '#',
          category: 'Local Search',
          status: 'pending',
          lastUpdated: '2024-01-10',
          reviews: { count: 0, average: 0 },
          napsConsistent: false,
          profileCompleteness: 60,
          actions: ['Complete profile setup', 'Verify business', 'Add photos']
        },
        {
          id: 'instagram',
          name: '@mariiaborysevych',
          platform: 'Instagram Business',
          url: 'https://www.instagram.com/mariiaborysevych/',
          category: 'Social Media',
          status: 'verified',
          lastUpdated: '2024-01-20',
          reviews: { count: 56000, average: 4.9 },
          napsConsistent: true,
          profileCompleteness: 85,
          actions: ['Update contact info', 'Post service reels']
        }
      ];

      setListings(mockListings);
      setLoading(false);
    };

    fetchListings();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'unlisted': return 'bg-gray-100 text-gray-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="w-4 h-4" />;
      case 'pending': return <Clock className="w-4 h-4" />;
      case 'error': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const filteredListings = listings.filter(listing =>
    selectedPlatform === 'all' || listing.platform.toLowerCase().includes(selectedPlatform.toLowerCase())
  );

  const calculateOverallHealth = () => {
    const verifiedCount = listings.filter(l => l.status === 'verified').length;
    const totalCount = listings.length;
    return totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 0;
  };

  const getNapConsistencyScore = () => {
    const consistentCount = listings.filter(l => l.napsConsistent).length;
    const totalCount = listings.length;
    return totalCount > 0 ? Math.round((consistentCount / totalCount) * 100) : 0;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Local Business Listings Management</h2>
        <p className="text-gray-600">
          Monitor and manage your business listings across Polish and international platforms
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overall Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculateOverallHealth()}%</div>
            <Progress value={calculateOverallHealth()} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">NAP Consistency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getNapConsistencyScore()}%</div>
            <Progress value={getNapConsistencyScore()} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Listings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{listings.length}</div>
            <p className="text-xs text-gray-500 mt-1">
              {listings.filter(l => l.status === 'verified').length} verified
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {listings.reduce((sum, l) => sum + l.reviews.count, 0)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Across {listings.filter(l => l.reviews.count > 0).length} platforms
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for different platforms */}
      <Tabs defaultValue="polish" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="polish">Polish Platforms</TabsTrigger>
          <TabsTrigger value="international">International</TabsTrigger>
          <TabsTrigger value="managed">Managed Listings</TabsTrigger>
        </TabsList>

        <TabsContent value="polish" className="space-y-4">
          <Alert>
            <MapPin className="h-4 w-4" />
            <AlertDescription>
              Polish business directories are crucial for local SEO. These platforms have high domain authority in Polish search results.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {polishPlatforms.map((platform) => (
              <Card key={platform.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{platform.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{platform.description}</p>
                    <Badge variant="outline" className="mt-2">
                      {platform.category}
                    </Badge>
                    {platform.priority === 'high' && (
                      <Badge className="ml-2 bg-red-100 text-red-800">
                        High Priority
                      </Badge>
                    )}
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <a href={platform.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="international" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {internationalPlatforms.map((platform) => (
              <Card key={platform.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{platform.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{platform.description}</p>
                    <Badge variant="outline" className="mt-2">
                      {platform.category}
                    </Badge>
                  </div>
                  <Button size="sm" variant="outline" asChild>
                    <a href={platform.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="managed" className="space-y-4">
          {/* Platform Filter */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedPlatform === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedPlatform('all')}
            >
              All Platforms
            </Button>
            {Array.from(new Set(listings.map(l => l.platform))).map(platform => (
              <Button
                key={platform}
                variant={selectedPlatform === platform.toLowerCase() ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedPlatform(platform.toLowerCase())}
              >
                {platform}
              </Button>
            ))}
          </div>

          {/* Listings Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredListings.map((listing) => (
              <Card key={listing.id} className="p-4">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold">{listing.name}</h3>
                      <p className="text-sm text-gray-600">{listing.platform}</p>
                    </div>
                    <Badge className={getStatusColor(listing.status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(listing.status)}
                        {listing.status}
                      </div>
                    </Badge>
                  </div>

                  {listing.reviews.count > 0 && (
                    <div className="flex items-center gap-2">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <span className="font-medium">{listing.reviews.average}</span>
                      <span className="text-sm text-gray-500">
                        ({listing.reviews.count} reviews)
                      </span>
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Profile Completeness</span>
                      <span>{listing.profileCompleteness}%</span>
                    </div>
                    <Progress value={listing.profileCompleteness} />
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>NAP Consistency</span>
                      <Badge variant={listing.napsConsistent ? 'default' : 'destructive'}>
                        {listing.napsConsistent ? 'Consistent' : 'Inconsistent'}
                      </Badge>
                    </div>
                  </div>

                  {listing.actions.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Recommended Actions:</h4>
                      <div className="space-y-1">
                        {listing.actions.map((action, index) => (
                          <div key={index} className="text-sm text-gray-600 flex items-center gap-1">
                            <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                            {action}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button size="sm" variant="outline" asChild>
                      <a href={listing.url} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-1" />
                        View
                      </a>
                    </Button>
                    <Button size="sm" variant="outline">
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Update
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};