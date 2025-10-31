import { Service } from '@/types/shared';

export interface WarsawLocation {
  district: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  postalCode: string;
  description: string;
  keywords: string[];
  landmarks: string[];
  transport: string[];
}

export interface LocalCitation {
  name: string;
  url: string;
  category: string;
  address?: string;
  phone?: string;
  rating?: number;
}

export interface LocalKeyword {
  keyword: string;
  searchVolume?: number;
  difficulty?: number;
  intent: 'local' | 'informational' | 'transactional' | 'commercial';
  locationModifier?: string;
}

export interface GoogleBusinessProfile {
  name: string;
  categories: string[];
  address: string;
  phone: string;
  website: string;
  hours: Record<string, string>;
  services: Array<{
    name: string;
    description: string;
    price?: number;
  }>;
  photos: string[];
  reviews: {
    count: number;
    rating: number;
    recent: Array<{
      author: string;
      rating: number;
      comment: string;
      date: string;
    }>;
  };
  attributes: string[];
  questions: Array<{
    question: string;
    answer: string;
    author?: string;
    date?: string;
  }>;
}

/**
 * Warsaw districts and areas for local SEO targeting
 */
export const WARSAW_DISTRICTS: Record<string, WarsawLocation> = {
  srodmiescie: {
    district: 'Śródmieście',
    coordinates: { lat: 52.2297, lng: 21.0122 },
    postalCode: '00-001',
    description: 'Central Warsaw business district',
    keywords: ['centrum warszawy', 'śródmieście', 'warszawa centrum', 'salon urody centrum'],
    landmarks: ['Pałac Kultury', 'PKiN', 'Warsaw Central Station', 'Palace of Culture'],
    transport: ['Metro Centrum', 'PKP Centralny', 'Multiple tram lines']
  },
  wola: {
    district: 'Wola',
    coordinates: { lat: 52.2400, lng: 20.9900 },
    postalCode: '00-850',
    description: 'Modern business and residential area',
    keywords: ['wola warszawa', 'rondo daszyńskiego', 'warszawa wola', 'biznes wola'],
    landmarks: ['Rondo Daszyńskiego', 'Warsaw Spire', 'Wola Tower'],
    transport: ['Metro Rondo Daszyńskiego', 'Multiple bus lines']
  },
  mokotow: {
    district: 'Mokotów',
    coordinates: { lat: 52.2100, lng: 21.0200 },
    postalCode: '00-580',
    description: 'Premium residential and business area',
    keywords: ['mokotów warszawa', 'pole mokotowskie', 'mokotowska', 'służewiec'],
    landmarks: ['Pole Mokotowskie', 'Mokotów Business Center', 'Służewiec'],
    transport: ['Metro Pole Mokotowskie', 'Metro Wierzbno']
  },
  praga: {
    district: 'Praga-Południe',
    coordinates: { lat: 52.2400, lng: 21.0700 },
    postalCode: '04-000',
    description: 'Historic district with modern development',
    keywords: ['praga południe', 'praga warszawa', 'saska kępa', 'grochów'],
    landmarks: ['Stadion Narodowy', 'PGE Narodowy', 'Saska Kępa'],
    transport: ['Metro Stadion Narodowy', 'Multiple tram lines']
  },
  zoliborz: {
    district: 'Żoliborz',
    coordinates: { lat: 52.2700, lng: 20.9900 },
    postalCode: '01-500',
    description: 'Prestigious residential area',
    keywords: ['żoliborz warszawa', 'zoliborz', 'marymont', 'plac wilsona'],
    landmarks: ['Plac Wilsona', 'Żoliborz Artistic Village', 'Park Żeromskiego'],
    transport: ['Metro Plac Wilsona', 'Multiple tram lines']
  }
};

/**
 * Local SEO optimization for Warsaw market
 */
export class LocalSEOGenerator {
  private static instance: LocalSEOGenerator;
  private businessLocation: WarsawLocation;

  constructor(district: keyof typeof WARSAW_DISTRICTS = 'srodmiescie') {
    this.businessLocation = WARSAW_DISTRICTS[district];
  }

  static getInstance(district?: keyof typeof WARSAW_DISTRICTS): LocalSEOGenerator {
    if (!LocalSEOGenerator.instance) {
      LocalSEOGenerator.instance = new LocalSEOGenerator(district);
    }
    return LocalSEOGenerator.instance;
  }

  /**
   * Generate location-aware keywords
   */
  generateLocalKeywords(
    baseKeywords: string[],
    serviceType?: string
  ): LocalKeyword[] {
    const keywords: LocalKeyword[] = [];
    const district = this.businessLocation.district;
    const city = 'Warszawa';

    // District-specific keywords
    baseKeywords.forEach(keyword => {
      keywords.push(
        {
          keyword: `${keyword} ${district}`,
          intent: 'transactional',
          locationModifier: district
        },
        {
          keyword: `${keyword} ${district} warszawa`,
          intent: 'transactional',
          locationModifier: `${district} warszawa`
        },
        {
          keyword: `${keyword} centrum warszawy`,
          intent: 'transactional',
          locationModifier: 'centrum warszawy'
        }
      );
    });

    // City-level keywords
    baseKeywords.forEach(keyword => {
      keywords.push(
        {
          keyword: `${keyword} ${city}`,
          intent: 'transactional',
          locationModifier: city
        },
        {
          keyword: `${keyword} warszawa centrum`,
          intent: 'transactional',
          locationModifier: 'warszawa centrum'
        }
      );
    });

    // Service-specific local keywords
    if (serviceType) {
      keywords.push(
        {
          keyword: `${serviceType} ${district}`,
          intent: 'transactional',
          locationModifier: district
        },
        {
          keyword: `najlepszy ${serviceType} ${city}`,
          intent: 'commercial',
          locationModifier: city
        },
        {
          keyword: `${serviceType} polecany ${district}`,
          intent: 'commercial',
          locationModifier: district
        }
      );
    }

    // District keywords
    this.businessLocation.keywords.forEach(keyword => {
      keywords.push({
        keyword,
        intent: 'informational',
        locationModifier: district
      });
    });

    return keywords;
  }

  /**
   * Generate Google Business Profile data
   */
  generateGoogleBusinessProfile(
    services: Service[],
    reviews?: Array<{ author: string; rating: number; comment: string; date: string }>
  ): GoogleBusinessProfile {
    return {
      name: 'mariiaborysevych',
      categories: [
        'Beauty Salon',
        'Permanent Makeup Clinic',
        'Fitness Center',
        'Personal Trainer',
        'Cosmetic Service'
      ],
      address: 'ul. Smolna 8, 00-001 Warszawa',
      phone: '+48 123 456 789',
      website: 'https://mariia-hub.pl',
      hours: {
        Monday: '09:00-21:00',
        Tuesday: '09:00-21:00',
        Wednesday: '09:00-21:00',
        Thursday: '09:00-21:00',
        Friday: '09:00-21:00',
        Saturday: '10:00-18:00',
        Sunday: '11:00-17:00'
      },
      services: services.map(service => ({
        name: service.name,
        description: service.description,
        price: service.price
      })),
      photos: [
        '/assets/hero/hero-beauty-luxury.webp',
        '/assets/hero/hero-fitness-luxury.webp',
        '/assets/services/beauty/beauty-lashes.webp'
      ],
      reviews: {
        count: reviews?.length || 0,
        rating: reviews?.length ?
          reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length : 4.8,
        recent: reviews?.slice(0, 5) || []
      },
      attributes: [
        'Women-owned',
        'LGBTQ+ friendly',
        'Appointment required',
        'Credit cards accepted',
        'Parking available',
        'Wi-Fi available',
        'Air conditioned'
      ],
      questions: [
        {
          question: 'Jakie zabiegi permanentnego makijażu oferujecie?',
          answer: 'Oferujemy profesjonalny permanentny makijaż brwi, ust i powiek, wykonany najwyższej jakości pigmentami.'
        },
        {
          question: 'Czy potrzebuję wcześniejszej rezerwacji?',
          answer: 'Tak, wszystkie wizyty wymagają wcześniejszej rezerwacji przez naszą stronę lub aplikację Booksy.'
        },
        {
          question: 'Jak długo utrzymuje się efekt permanentnego makijażu?',
          answer: 'Efekt utrzymuje się zazwyczaj od 1 do 3 lat, w zależności od pielęgnacji i typu skóry.'
        }
      ]
    };
  }

  /**
   * Generate local citations for Warsaw directories
   */
  generateLocalCitations(): LocalCitation[] {
    return [
      {
        name: 'Złote Strony',
        url: 'https://www.zlote-strony.pl',
        category: 'Beauty Services',
        address: 'ul. Smolna 8, Warszawa',
        phone: '+48 123 456 789'
      },
      {
        name: 'Panorama Firm',
        url: 'https://www.panoramafirm.pl',
        category: 'Permanent Makeup',
        address: 'ul. Smolna 8, Warszawa',
        phone: '+48 123 456 789'
      },
      {
        name: 'Booksy',
        url: 'https://booksy.com',
        category: 'Beauty Salon',
        rating: 4.8
      },
      {
        name: 'Google My Business',
        url: 'https://business.google.com',
        category: 'Beauty Salon',
        rating: 4.8
      },
      {
        name: 'Facebook Business',
        url: 'https://facebook.com/business',
        category: 'Beauty Services',
        rating: 4.9
      },
      {
        name: 'Instagram Business',
        url: 'https://instagram.com/business',
        category: 'Beauty Artist'
      },
      {
        name: 'Jakdojade',
        url: 'https://jakdojade.pl',
        category: 'Beauty Services',
        address: 'ul. Smolna 8, Warszawa'
      },
      {
        name: 'Co jest grane',
        url: 'https://www.cojestgrane.pl',
        category: 'Beauty & Wellness'
      },
      {
        name: 'Warsaw Local',
        url: 'https://warsawlocal.com',
        category: 'Beauty Services',
        address: 'ul. Smolna 8, Warszawa'
      }
    ];
  }

  /**
   * Generate location-specific landing page content
   */
  generateLocationLandingContent(district?: string): {
    title: string;
    description: string;
    headings: string[];
    content: string[];
    localReferences: string[];
  } {
    const targetDistrict = district ? WARSAW_DISTRICTS[district] : this.businessLocation;

    return {
      title: `Salon Urody ${targetDistrict.district} - mariiaborysevych | Warszawa`,
      description: `Profesjonalny salon urody w dzielnicy ${targetDistrict.district}. Oferujemy permanentny makijaż, stylizację brwi i treningi personalne w sercu Warszawy.`,
      headings: [
        `Salon Urody ${targetDistrict.district} - Najlepsze Usługi w Warszawie`,
        `Nasze Usługi w ${targetDistrict.district}`,
        `Dlaczego warto wybrać mariiaborysevych w ${targetDistrict.district}?`,
        `Lokalizacja i Dojazd do ${targetDistrict.district}`,
        `Opinie Klientów z ${targetDistrict.district}`
      ],
      content: [
        `mariiaborysevych to premium salon urody zlokalizowany w sercu ${targetDistrict.district}. Specjalizujemy się w profesjonalnym permanentnym makijażu i stylizacji brwi.`,
        `Nasza lokalizacja w ${targetDistrict.district} sprawia, że jesteśmy łatwo dostępni dla mieszkańców całej Warszawy.`,
        `W naszym salonie w ${targetDistrict.district} używamy tylko najwyższej jakości produktów i najnowocześniejszych technik.`,
        `Bliskość ${targetDistrict.landmarks.join(', ')} sprawia, że nasz salon jest idealnie połączony z komunikacją miejską.`
      ],
      localReferences: [
        `blisko ${targetDistrict.landmarks.join(' i ')}`,
        `łatwy dojazd ${targetDistrict.transport.join(' i ')}`,
        `kod pocztowy ${targetDistrict.postalCode}`,
        `dzielnica ${targetDistrict.district}`,
        `centrum ${targetDistrict.description.toLowerCase()}`
      ]
    };
  }

  /**
   * Generate local schema markup
   */
  generateLocalStructuredData() {
    return {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: 'mariiaborysevych',
      description: 'Premium beauty and fitness services in Warsaw',
      url: 'https://mariia-hub.pl',
      telephone: '+48 123 456 789',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'ul. Smolna 8',
        addressLocality: 'Warszawa',
        addressRegion: 'Mazowieckie',
        postalCode: this.businessLocation.postalCode,
        addressCountry: 'PL'
      },
      geo: {
        '@type': 'GeoCoordinates',
        latitude: this.businessLocation.coordinates.lat,
        longitude: this.businessLocation.coordinates.lng
      },
      areaServed: [
        {
          '@type': 'Place',
          name: this.businessLocation.district
        },
        {
          '@type': 'Place',
          name: 'Warszawa'
        },
        {
          '@type': 'Place',
          name: 'Mazowieckie'
        }
      ],
      availableLanguage: ['Polish', 'English'],
      priceRange: '$$$',
      openingHoursSpecification: [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Monday',
          opens: '09:00',
          closes: '21:00'
        },
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Tuesday',
          opens: '09:00',
          closes: '21:00'
        },
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Wednesday',
          opens: '09:00',
          closes: '21:00'
        },
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Thursday',
          opens: '09:00',
          closes: '21:00'
        },
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Friday',
          opens: '09:00',
          closes: '21:00'
        },
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Saturday',
          opens: '10:00',
          closes: '18:00'
        },
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Sunday',
          opens: '11:00',
          closes: '17:00'
        }
      ],
      sameAs: [
        'https://instagram.com/mariia.hub',
        'https://facebook.com/mariia.hub',
        'https://booksy.com/pl/pl/102783/mariia-hub'
      ]
    };
  }

  /**
   * Generate location-specific meta tags
   */
  generateLocalMetaTags(
    pageTitle: string,
    pageDescription: string,
    district?: string
  ) {
    const targetDistrict = district ? WARSAW_DISTRICTS[district] : this.businessLocation;

    return {
      title: `${pageTitle} | ${targetDistrict.district} | mariiaborysevych`,
      description: `${pageDescription} | Lokalizacja: ${targetDistrict.district}, Warszawa`,
      keywords: [
        ...this.generateLocalKeywords(['permanentny makijaż', 'stylizacja brwi', 'trening personalny']),
        targetDistrict.district.toLowerCase(),
        'warszawa',
        'centrum warszawy',
        'salon urody warszawa',
        'beauty salon warszawa'
      ].join(', '),
      geo: {
        placename: targetDistrict.district,
        position: `${targetDistrict.coordinates.lat};${targetDistrict.coordinates.lng}`,
        region: 'Mazowieckie',
        icbm: `${targetDistrict.coordinates.lat},${targetDistrict.coordinates.lng}`
      },
      local: {
        'geo.position': `${targetDistrict.coordinates.lat};${targetDistrict.coordinates.lng}`,
        'geo.placename': targetDistrict.district,
        'geo.region': 'PL-MZ',
        'ICBM': `${targetDistrict.coordinates.lat},${targetDistrict.coordinates.lng}`
      }
    };
  }

  /**
   * Generate local business backlink opportunities
   */
  generateBacklinkOpportunities(): Array<{
    source: string;
    type: 'local' | 'industry' | 'content' | 'partnership';
    description: string;
    domainAuthority?: number;
  }> {
    return [
      {
        source: 'Warsaw Business Journal',
        type: 'local',
        description: 'Local business news and features',
        domainAuthority: 65
      },
      {
        source: 'Cosmopolitan Poland',
        type: 'industry',
        description: 'Beauty and fashion magazine',
        domainAuthority: 78
      },
      {
        source: 'Warsaw Local',
        type: 'local',
        description: 'Expat and local community guide',
        domainAuthority: 42
      },
      {
        source: 'Polska Kosmetyka',
        type: 'industry',
        description: 'Polish beauty industry publication',
        domainAuthority: 55
      },
      {
        source: 'What Warsaw',
        type: 'local',
        description: 'Local events and lifestyle guide',
        domainAuthority: 38
      },
      {
        source: 'Fit & Healthy Poland',
        type: 'industry',
        description: 'Fitness and wellness magazine',
        domainAuthority: 52
      }
    ];
  }
}

export default LocalSEOGenerator;