// Polish SEO Keywords for Warsaw Beauty and Fitness Market
// This file contains comprehensive keyword strategy for Polish and English SEO

export interface KeywordCategory {
  category: string;
  polishKeywords: string[];
  englishKeywords: string[];
  searchIntent: 'informational' | 'commercial' | 'transactional' | 'navigational';
  priority: 'high' | 'medium' | 'low';
}

export const polishSEOKeywords: KeywordCategory[] = [
  // Primary Service Keywords - High Priority
  {
    category: 'Permanent Makeup Services',
    polishKeywords: [
      'makijaż permanentny Warszawa',
      'PMU Warszawa',
      'makijaż permanentny ust Warszawa',
      'lip blush Warszawa',
      'makijaż permanentny brwi Warszawa',
      'microblading Warszawa',
      'eyeliner permanentny Warszawa',
      'studio PMU Warszawa',
      'makijaż permanentny cena Warszawa',
      'najlepszy makijaż permanentny Warszawa'
    ],
    englishKeywords: [
      'permanent makeup Warsaw',
      'PMU Warsaw',
      'lip blush Warsaw',
      'eyebrow permanent makeup Warsaw',
      'microblading Warsaw',
      'eyeliner tattoo Warsaw',
      'permanent makeup studio Warsaw',
      'permanent makeup price Warsaw'
    ],
    searchIntent: 'transactional',
    priority: 'high'
  },

  // Local Polish Keywords - High Priority
  {
    category: 'Warsaw Local Areas',
    polishKeywords: [
      'makijaż permanentny Śródmieście Warszawa',
      'PMU Mokotów Warszawa',
      'makijaż permanentny Wola',
      'beauty salon Praga Południe',
      'kosmetyka Żoliborz Warszawa',
      'stylizacja brwi Ochota',
      'studio urody Ursus',
      'PMU Bemowo',
      'makijaż permanentny Wilanów',
      'beauty Włochy Warszawa'
    ],
    englishKeywords: [
      'permanent makeup Warsaw city center',
      'PMU Mokotów Warsaw',
      'beauty salon Srodmiescie',
      'cosmetics Żoliborz Warsaw',
      'beauty studio Old Town Warsaw'
    ],
    searchIntent: 'transactional',
    priority: 'high'
  },

  // Brow Services Keywords - Medium Priority
  {
    category: 'Eyebrow Services',
    polishKeywords: [
      'stylizacja brwi Warszawa',
      'henna brwi Warszawa',
      'regulacja brwi Warszawa',
      'laminacja brwi Warszawa',
      'brow lift Warszawa',
      'farbowanie brwi Warszawa',
      'piękne brwi Warszawa',
      'salon brwi Warszawa',
      'kosmetyczka brwi Warszawa',
      'architektura brwi Warszawa'
    ],
    englishKeywords: [
      'eyebrow styling Warsaw',
      'eyebrow tinting Warsaw',
      'eyebrow shaping Warsaw',
      'eyebrow lamination Warsaw',
      'brow lift Warsaw',
      'eyebrow salon Warsaw'
    ],
    searchIntent: 'transactional',
    priority: 'medium'
  },

  // Fitness Keywords - Medium Priority
  {
    category: 'Personal Training',
    polishKeywords: [
      'trening personalny Warszawa',
      'trener personalny Warszawa',
      'personal trainer Warszawa',
      'trening personalny cena Warszawa',
      'siłownia personal Warszawa',
      'trener Warszawa',
      'fitness Warszawa',
      'trening personalny dla kobiet Warszawa',
      'Zdrofit Warszawa',
      'klub fitness Warszawa'
    ],
    englishKeywords: [
      'personal training Warsaw',
      'personal trainer Warsaw',
      'fitness trainer Warsaw',
      'gym personal training Warsaw',
      'personal training price Warsaw',
      'Zdrofit Warsaw'
    ],
    searchIntent: 'transactional',
    priority: 'medium'
  },

  // Long-tail Polish Keywords - Medium Priority
  {
    category: 'Long-tail Beauty',
    polishKeywords: [
      'makijaż permanentny ust naturalny Warszawa',
      'delikatny makijaż permanentny brwi Warszawa',
      'PMU dla początkujących Warszawa',
      'makijaż permanentny po korekcji Warszawa',
      'najlepszy salon PMU w Warszawie',
      'cennik makijażu permanentnego Warszawa',
      'makijaż permanentny dla blondynek Warszawa',
      'makijaż permanentny po 40 Warszawa',
      'PMU medyczny Warszawa',
      'makijaż permanentny areole Warszawa'
    ],
    englishKeywords: [
      'natural lip blush Warsaw',
      'subtle eyebrow PMU Warsaw',
      'beginner permanent makeup Warsaw',
      'permanent makeup correction Warsaw',
      'best PMU studio Warsaw',
      'permanent makeup price list Warsaw'
    ],
    searchIntent: 'informational',
    priority: 'medium'
  },

  // Informational/Review Keywords - Low Priority
  {
    category: 'Research and Reviews',
    polishKeywords: [
      'opinie makijaż permanentny Warszawa',
      'forum PMU Warszawa',
      'czy makijaż permanentny boli Warszawa',
      'jak pielęgnować PMU Warszawa',
      'makijaż permanentny gojenie Warszawa',
      'porady makijaż permanentny Warszawa',
      'zdjęcia PMU przed po Warszawa',
      'recenzje salonów PMU Warszawa',
      'polecany artysta PMU Warszawa',
      'ranking makijaż permanentny Warszawa'
    ],
    englishKeywords: [
      'permanent makeup reviews Warsaw',
      'PMU Warsaw forum',
      'does permanent makeup hurt',
      'permanent makeup aftercare',
      'PMU healing process Warsaw',
      'permanent makeup before after Warsaw'
    ],
    searchIntent: 'informational',
    priority: 'low'
  },

  // Emergency/Urgent Keywords - Low Priority
  {
    category: 'Urgent Services',
    polishKeywords: [
      'makijaż permanentny na już Warszawa',
      'pilna stylizacja brwi Warszawa',
      'PMU awaryjne Warszawa',
      'kosmetyczka dzisiaj Warszawa',
      'salon urody otwarte dziś Warszawa',
      'makijaż permanentny weekend Warszawa',
      'brwi na ostatnią chwilę Warszawa',
      'piękna na wczoraj Warszawa'
    ],
    englishKeywords: [
      'permanent makeup today Warsaw',
      'urgent beauty salon Warsaw',
      'last minute eyebrow appointment Warsaw',
      'beauty salon open now Warsaw',
      'weekend PMU Warsaw'
    ],
    searchIntent: 'transactional',
    priority: 'low'
  }
];

// Geographic location keywords for Warsaw districts
export const warsawDistricts = {
  polish: [
    'Śródmieście', 'Mokotów', 'Wola', 'Praga-Południe', 'Praga-Północ',
    'Żoliborz', 'Bemowo', 'Białołęka', 'Targówek', 'Ursus',
    'Ursynów', 'Wawer', 'Wilanów', 'Włochy', 'Ochota', 'Rembertów'
  ],
  english: [
    'Srodmiescie', 'Mokotow', 'Wola', 'Praga-South', 'Praga-North',
    'Zoliborz', 'Bemowo', 'Białołęka', 'Targowek', 'Ursus',
    'Ursynow', 'Wawer', 'Wilanow', 'Wlochy', 'Ochota', 'Rembertow'
  ]
};

// Polish local search modifiers
export const polishSearchModifiers = {
  polish: [
    'blisko mnie', 'w okolicy', 'darmowa konsultacja', 'dobry ceny',
    'polecany', 'najlepszy', 'profesjonalny', 'cena', 'promocja',
    'zniżka', 'oferta', 'dostępny', 'otwarte teraz', 'rezerwacja online'
  ],
  english: [
    'near me', 'nearby', 'free consultation', 'good prices',
    'recommended', 'best', 'professional', 'price', 'promotion',
    'discount', 'offer', 'available', 'open now', 'online booking'
  ]
};

// Seasonal Polish keywords
export const seasonalKeywords = {
  polish: {
    winter: ['makijaż permanentny na święta', 'PMU na sylwestra', 'piękna na Boże Narodzenie'],
    spring: ['makijaż permanentny na wiosnę', 'odświeżenie brwi na wiosnę', 'wiosenna metamorfoza'],
    summer: ['PMU na lato', 'makijaż permanentny wodoodporny', 'brwi na wakacje'],
    autumn: ['makijaż permanentny na jesień', 'PMU na sezon', 'jesienna stylizacja']
  },
  english: {
    winter: ['permanent makeup for holidays', 'New Year PMU', 'Christmas beauty'],
    spring: ['spring permanent makeup', 'eyebrow refresh spring', 'spring makeover'],
    summer: ['summer PMU', 'waterproof permanent makeup', 'vacation eyebrows'],
    autumn: ['autumn permanent makeup', 'seasonal PMU', 'fall beauty']
  }
};

// Polish FAQ keywords
export const faqKeywords = {
  polish: [
    'ile utrzymuje się makijaż permanentny',
    'czy makijaż permanentny jest bezpieczny',
    'jak dbać o PMU po zabiegu',
    'kto może robić makijaż permanentny',
    'ile kosztuje makijaż permanentny w Warszawie',
    'jak długo goi się PMU',
    'czy makijaż permanentny boli',
    'jak wybrać salon PMU'
  ],
  english: [
    'how long does permanent makeup last',
    'is permanent makeup safe',
    'permanent makeup aftercare',
    'who can get permanent makeup',
    'permanent makeup cost Warsaw',
    'PMU healing time',
    'does permanent makeup hurt',
    'how to choose PMU studio'
  ]
};

// Generate keyword combinations for content creation
export const generateKeywordCombinations = (
  service: string,
  location: string,
  modifier?: string,
  language: 'pl' | 'en' = 'pl'
): string[] => {
  const keywords: string[] = [];

  // Basic combinations
  keywords.push(`${service} ${location}`);

  // With modifiers
  if (modifier) {
    keywords.push(`${service} ${modifier} ${location}`);
    keywords.push(`${service} ${location} ${modifier}`);
  }

  // Price-related
  if (language === 'pl') {
    keywords.push(`${service} cena ${location}`);
    keywords.push(`cennik ${service} ${location}`);
  } else {
    keywords.push(`${service} price ${location}`);
    keywords.push(`price list ${service} ${location}`);
  }

  // Quality modifiers
  const qualityModifiers = language === 'pl'
    ? ['najlepszy', 'polecany', 'profesjonalny']
    : ['best', 'recommended', 'professional'];

  qualityModifiers.forEach(mod => {
    keywords.push(`${mod} ${service} ${location}`);
  });

  return keywords;
};

// Polish SEO meta descriptions templates
export const polishMetaTemplates = {
  service: (service: string, location: string, price?: string) =>
    `Profesjonalny ${service} w ${location}. Najwyższa jakość, certyfikowani specjaliści. ${price ? `Ceny od ${price}.` : ''} Rezerwacja online ➤ Szybkie terminy ➤ Zadowoleni klienci.`,

  local: (district: string) =>
    `Studio urody w dzielnicy ${district}, Warszawa. Makijaż permanentny, stylizacja brwi, trening personalny. Dogodna lokalizacja, elastyczne godziny pracy.`,

  review: () =>
    `Sprawdź opinie o naszych usługach! Ponad 500 zadowolonych klientów w Warszawie. Profesjonalny makijaż permanentny i trening personalny. Zobacz galerię prac.`
};

// English SEO meta descriptions templates
export const englishMetaTemplates = {
  service: (service: string, location: string, price?: string) =>
    `Professional ${service} in ${location}. Highest quality, certified specialists. ${price ? `Prices from ${price}.` : ''} Online booking ➤ Quick appointments ➤ Happy clients.`,

  local: (district: string) =>
    `Beauty studio in ${district} district, Warsaw. Permanent makeup, eyebrow styling, personal training. Convenient location, flexible hours.`,

  review: () =>
    `Check our service reviews! Over 500 happy clients in Warsaw. Professional permanent makeup and personal training. See our portfolio.`
};