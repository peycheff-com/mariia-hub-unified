import React from 'react';
import Head from 'react-helmet-async';

interface WarsawStructuredDataProps {
  type: 'BeautySalon' | 'LocalBusiness' | 'Service' | 'Person';
  data?: any;
}

const WarsawStructuredData: React.FC<WarsawStructuredDataProps> = ({ type, data }) => {
  const generateStructuredData = () => {
    const baseSchema = {
      "@context": "https://schema.org",
      "@graph": []
    };

    // Organization Schema
    const organization = {
      "@type": "Organization",
      "@id": "https://mariaborysevych.com/#organization",
      "name": "Mariia Beauty & Fitness",
      "url": "https://mariaborysevych.com",
      "logo": {
        "@type": "ImageObject",
        "url": "https://mariaborysevych.com/logo.png",
        "width": 512,
        "height": 512
      },
      "sameAs": [
        "https://instagram.com/mariia.borysevych",
        "https://facebook.com/mariia.beauty.fitness"
      ],
      "address": {
        "@type": "PostalAddress",
        "streetAddress": "Smolna 8",
        "addressLocality": "Warszawa",
        "addressRegion": "Mazowieckie",
        "postalCode": "00-375",
        "addressCountry": "PL"
      },
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": "+48 536 200 573",
        "contactType": "customer service",
        "availableLanguage": ["Polish", "English", "Ukrainian", "Russian"],
        "areaServed": {
          "@type": "GeoCircle",
          "geoMidpoint": {
            "@type": "GeoCoordinates",
            "latitude": 52.2297,
            "longitude": 21.0122
          },
          "geoRadius": "50000"
        }
      }
    };

    // Beauty Salon Schema
    const beautySalon = {
      "@type": "BeautySalon",
      "@id": "https://mariaborysevych.com/#beautysalon",
      "name": "Mariia Beauty Studio - Makijaż Permanentny Warszawa",
      "description": "Profesjonalny makijaż permanentny w Warszawie. Delikatne, naturalne efekty healed-first approach. Studio w Śródmieściu.",
      "url": "https://mariaborysevych.com/uroda",
      "telephone": "+48 536 200 573",
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
      "openingHours": [
        "Mo-Fr 09:00-19:00",
        "Sa 10:00-16:00"
      ],
      "priceRange": "$$$$",
      "paymentAccepted": ["Cash", "Credit Card", "Bank Transfer"],
      "currenciesAccepted": "PLN",
      "image": [
        "https://mariaborysevych.com/images/studio-1.jpg",
        "https://mariaborysevych.com/images/studio-2.jpg",
        "https://mariaborysevych.com/images/studio-3.jpg"
      ],
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Usługi Kosmetyczne",
        "itemListElement": [
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Makijaż Permanentny Brwi",
              "description": "Idealnie wymodelowane brwi dopasowane do Twojej rysunku twarzy. Technika healed-first.",
              "duration": "PT2H",
              "provider": {
                "@type": "Person",
                "name": "Mariia Borysevych"
              }
            }
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Makijaż Permanentny Ust",
              "description": "Precyzyjnie zdefiniowane, naturalnie wyglądające usta.",
              "duration": "PT2H",
              "provider": {
                "@type": "Person",
                "name": "Mariia Borysevych"
              }
            }
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Eyeliner Permanentny",
              "description": "Precyzyjna kreska, która nie rozmazuje się.",
              "duration": "PT1.5H",
              "provider": {
                "@type": "Person",
                "name": "Mariia Borysevych"
              }
            }
          }
        ]
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "reviewCount": "44",
        "bestRating": "5",
        "worstRating": "1"
      }
    };

    // Fitness Center Schema
    const fitnessCenter = {
      "@type": "SportsActivityLocation",
      "@id": "https://mariaborysevych.com/#fitness",
      "name": "Mariia Fitness - Trening Personalny Warszawa",
      "description": "Certyfikowany trening personalny w Warszawie. Indywidualne podejście bez presji i porównań.",
      "url": "https://mariaborysevych.com/fitness",
      "telephone": "+48 536 200 573",
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
      "openingHours": [
        "Mo-Fr 09:00-19:00",
        "Sa 10:00-16:00"
      ],
      "priceRange": "$$$",
      "paymentAccepted": ["Cash", "Credit Card", "Bank Transfer"],
      "currenciesAccepted": "PLN",
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "Programy Fitness",
        "itemListElement": [
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Trening Personalny",
              "description": "Spersonalizowane sesje skupione na Twoich unikalnych celach.",
              "duration": "PT1H",
              "provider": {
                "@type": "Person",
                "name": "Mariia Borysevych"
              }
            }
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Service",
              "name": "Holistyczne Wellness",
              "description": "Ruch, mindset i trwałe zmiany stylu życia.",
              "duration": "PT1H",
              "provider": {
                "@type": "Person",
                "name": "Mariia Borysevych"
              }
            }
          }
        ]
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "reviewCount": "28",
        "bestRating": "5",
        "worstRating": "1"
      }
    };

    // Person Schema (Founder)
    const person = {
      "@type": "Person",
      "@id": "https://mariaborysevych.com/#founder",
      "name": "Mariia Borysevych",
      "description": "Artystka makijażu permanentnego i certyfikowana trenerka personalna. Specjalizuje się w podejściu healed-first i holistycznym wellness.",
      "url": "https://mariaborysevych.com/o-mnie",
      "image": "https://mariaborysevych.com/images/mariia-profile.jpg",
      "jobTitle": ["Permanent Makeup Artist", "Certified Personal Trainer", "Entrepreneur"],
      "knowsLanguage": ["Polish", "English", "Ukrainian", "Russian"],
      "address": {
        "@type": "PostalAddress",
        "addressLocality": "Warszawa",
        "addressCountry": "PL"
      },
      "sameAs": [
        "https://instagram.com/mariia.borysevych",
        "https://facebook.com/mariia.beauty.fitness"
      ],
      "award": ["Best PMU Artist Warsaw 2023", "Top Personal Trainer Zdrofit"],
      "alumniOf": ["Zdrofit Fitness Academy"],
      "hasOccupation": [
        {
          "@type": "Occupation",
          "name": "Permanent Makeup Artist",
          "occupationLocation": {
            "@type": "Place",
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "Warszawa",
              "addressCountry": "PL"
            }
          }
        },
        {
          "@type": "Occupation",
          "name": "Personal Trainer",
          "occupationLocation": {
            "@type": "Place",
            "address": {
              "@type": "PostalAddress",
              "addressLocality": "Warszawa",
              "addressCountry": "PL"
            }
          }
        }
      ]
    };

    // LocalBusiness Schema
    const localBusiness = {
      "@type": "LocalBusiness",
      "@id": "https://mariaborysevych.com/#localbusiness",
      "name": "Mariia Beauty & Fitness",
      "description": "Luksusowe studio urody i fitness w sercu Warszawy. Profesjonalny makijaż permanentny i trening personalny.",
      "url": "https://mariaborysevych.com",
      "telephone": "+48 536 200 573",
      "email": "kontakt@mariaborysevych.com",
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
      "openingHours": [
        "Mo-Fr 09:00-19:00",
        "Sa 10:00-16:00"
      ],
      "priceRange": "$$$$",
      "paymentAccepted": ["Cash", "Credit Card", "Bank Transfer"],
      "currenciesAccepted": "PLN",
      "areaServed": {
        "@type": "GeoCircle",
        "geoMidpoint": {
          "@type": "GeoCoordinates",
          "latitude": 52.2297,
          "longitude": 21.0122
        },
        "geoRadius": "50000"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "reviewCount": "72",
        "bestRating": "5",
        "worstRating": "1"
      }
    };

    // WebSite Schema
    const website = {
      "@type": "WebSite",
      "@id": "https://mariaborysevych.com/#website",
      "url": "https://mariaborysevych.com",
      "name": "Mariia Beauty & Fitness - Professional Services in Warsaw",
      "description": "Professional permanent makeup and certified personal training services in Warsaw city center. Luxury beauty and wellness experience.",
      "inLanguage": ["pl", "en"],
      "isAccessibleForFree": true,
      "isPartOf": {
        "@type": "WebSite",
        "url": "https://mariaborysevych.com",
        "name": "Mariia Beauty & Fitness"
      }
    };

    // Add schemas based on type
    switch (type) {
      case 'BeautySalon':
        baseSchema["@graph"] = [organization, beautySalon, person, website];
        break;
      case 'LocalBusiness':
        baseSchema["@graph"] = [organization, localBusiness, person, website];
        break;
      case 'Service':
        baseSchema["@graph"] = [organization, beautySalon, fitnessCenter, website];
        break;
      case 'Person':
        baseSchema["@graph"] = [organization, person, website];
        break;
      default:
        baseSchema["@graph"] = [organization, beautySalon, fitnessCenter, person, website];
    }

    // Add custom data if provided
    if (data) {
      baseSchema["@graph"].push(data);
    }

    return baseSchema;
  };

  const structuredData = generateStructuredData();

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData)}
      </script>
    </Helmet>
  );
};

export default WarsawStructuredData;