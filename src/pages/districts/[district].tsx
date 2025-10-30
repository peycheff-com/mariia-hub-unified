import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SEOMeta } from '@/components/seo/SEOMeta';
import { LocalSEOGenerator, WARSAW_DISTRICTS } from '@/lib/seo/localSEO';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Phone, Clock, Star, Tram, Bus, Train } from 'lucide-react';
import { Navigation } from '@/components/navigation/Navigation';
import { Footer } from '@/components/footer/Footer';
import { TestimonialsSection } from '@/components/testimonials/TestimonialsSection';
import { CTASection } from '@/components/cta/CTASection';

export function DistrictPage() {
  const { district } = useParams<{ district: string }>();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const districtKey = district as keyof typeof WARSAW_DISTRICTS;
  const districtData = WARSAW_DISTRICTS[districtKey];
  const localSEO = LocalSEOGenerator.getInstance(districtKey);

  if (!districtData) {
    navigate('/');
    return null;
  }

  // Generate local SEO content
  const localContent = localSEO.generateLocationLandingContent(districtKey);
  const localKeywords = localSEO.generateLocalKeywords([
    'permanentny makijaż',
    'stylizacja brwi',
    'lift rzęs',
    'trening personalny',
    'salon urody',
    'beauty salon'
  ]);

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    ...localSEO.generateLocalStructuredData(),
    mainEntityOfPage: `https://mariaborysevych.com/districts/${district}`,
    areaServed: [
      {
        '@type': 'Place',
        name: districtData.district,
        description: districtData.description
      }
    ]
  };

  const services = [
    {
      title: 'Permanentny Makijaż',
      description: `Profesjonalny permanentny makijaż w dzielnicy ${districtData.district}. Oferujemy makijaż brwi, ust i powiek.`,
      price: 'od 800 zł',
      duration: '2-3 godziny',
      keywords: ['permanentny makijaż', 'microblading', 'powieka', 'usta']
    },
    {
      title: 'Stylizacja Brwi',
      description: `Stylizacja brwi z laminowaniem i farbowaniem w ${districtData.district}. Efekt utrzymuje się do 6 tygodni.`,
      price: 'od 150 zł',
      duration: '1 godzina',
      keywords: ['stylizacja brwi', 'laminowanie brwi', 'farbowanie brwi', 'regulacja']
    },
    {
      title: 'Trening Personalny',
      description: `Treningi personalne w ${districtData.district}. Indywidualne programy dopasowane do Twoich celów.`,
      price: 'od 200 zł',
      duration: '1 godzina',
      keywords: ['trening personalny', 'fitness', 'siłownia', 'odchudzanie']
    }
  ];

  const districtReviews = [
    {
      author: 'Anna K.',
      rating: 5,
      comment: `Fantastyczny salon w ${districtData.district}! Profesjonalne podejście i świetne efekty permanentnego makijażu.`,
      date: '2024-01-15'
    },
    {
      author: 'Marta W.',
      rating: 5,
      comment: `Polecam każdej z ${districtData.district}. Świetna lokalizacja, łatwy dojazd ${districtData.transport[0]}.`,
      date: '2024-01-10'
    }
  ];

  return (
    <>
      <SEOMeta
        title={localContent.title}
        description={localContent.description}
        keywords={localKeywords.map(k => k.keyword)}
        jsonLd={structuredData}
        additionalMeta={{
          'geo.region': 'PL-MZ',
          'geo.placename': districtData.district,
          'ICBM': `${districtData.coordinates.lat},${districtData.coordinates.lng}`,
          'district': districtKey,
          'city': 'Warszawa',
          'locality': districtData.district
        }}
        canonical={`https://mariaborysevych.com/districts/${districtKey}`}
      />

      <Navigation />

      <main role="main" className="min-h-screen">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-amber-50 to-orange-50 py-20">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <MapPin className="h-6 w-6 text-orange-600" />
                  <Badge variant="outline" className="text-lg">
                    {districtData.district}, Warszawa
                  </Badge>
                </div>

                <h1 className="text-5xl font-bold text-gray-900 mb-6">
                  {localContent.headings[0]}
                </h1>

                <p className="text-xl text-gray-600 mb-8">
                  {localContent.description}
                </p>

                <div className="flex flex-wrap gap-4 mb-8">
                  <Button size="lg" className="bg-orange-600 hover:bg-orange-700">
                    Umów Wizytę
                  </Button>
                  <Button size="lg" variant="outline">
                    Sprawdź Usługi
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600">4.9</div>
                    <div className="text-sm text-gray-600">Ocena klientów</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600">500+</div>
                    <div className="text-sm text-gray-600">Zadowolonych klientów</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600">5 lat</div>
                    <div className="text-sm text-gray-600">Doświadczenia</div>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="bg-white rounded-2xl shadow-xl p-8">
                  <h3 className="text-2xl font-bold mb-6">Informacje o Lokalizacji</h3>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-orange-600" />
                      <div>
                        <div className="font-semibold">Adres</div>
                        <div className="text-gray-600">ul. Smolna 8, {districtData.postalCode} Warszawa</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Tram className="h-5 w-5 text-orange-600" />
                      <div>
                        <div className="font-semibold">Komunikacja</div>
                        <div className="text-gray-600">{districtData.transport.join(', ')}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-orange-600" />
                      <div>
                        <div className="font-semibold">Godziny otwarcia</div>
                        <div className="text-gray-600">Pn-Pt: 9:00-21:00, Sob: 10:00-18:00</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-orange-600" />
                      <div>
                        <div className="font-semibold">Telefon</div>
                        <div className="text-gray-600">+48 123 456 789</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-orange-50 rounded-lg">
                    <div className="text-sm font-medium text-orange-900 mb-2">Blisko:</div>
                    <div className="text-sm text-orange-700">
                      {districtData.landmarks.join(' • ')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Local SEO Content */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl font-bold text-center mb-12">
                {localContent.headings[1]}
              </h2>

              <div className="grid md:grid-cols-3 gap-8 mb-12">
                {services.map((service, index) => (
                  <Card key={index} className="border-orange-200 hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-xl">{service.title}</CardTitle>
                      <CardDescription>{service.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-2xl font-bold text-orange-600">{service.price}</span>
                        <span className="text-sm text-gray-500">{service.duration}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {service.keywords.map((keyword, kidx) => (
                          <Badge key={kidx} variant="secondary" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                      <Button className="w-full">Rezerwuj</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Local Content */}
              <div className="prose prose-lg max-w-none">
                {localContent.content.map((paragraph, index) => (
                  <p key={index} className="text-gray-700 mb-6">
                    {paragraph}
                  </p>
                ))}

                <h3 className="text-2xl font-bold mb-4">{localContent.headings[2]}</h3>
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-orange-50 p-6 rounded-lg">
                    <h4 className="font-semibold mb-3">Lokalizacja</h4>
                    <ul className="space-y-2 text-gray-700">
                      {localContent.localReferences.map((ref, index) => (
                        <li key={index} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-orange-600 rounded-full" />
                          {ref}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h4 className="font-semibold mb-3">Usługi Premium</h4>
                    <ul className="space-y-2 text-gray-700">
                      <li>Permanentny makijaż najwyższej jakości</li>
                      <li>Indywidualne podejście do klienta</li>
                      <li>Bezpieczne i certyfikowane produkty</li>
                      <li>Międzynarodowe doświadczenie</li>
                    </ul>
                  </div>
                </div>

                <h3 className="text-2xl font-bold mb-4">{localContent.headings[3]}</h3>
                <div className="bg-gray-50 p-6 rounded-lg mb-8">
                  <p className="text-gray-700 mb-4">
                    Nasz salon w {districtData.district} jest doskonale skomunikowany z resztą Warszawy.
                    Możesz dojechać do nas {districtData.transport.join(' lub ')}.
                    Bliskość {districtData.landmarks.join(' i ')} sprawia, że nasza lokalizacja jest idealna.
                  </p>
                  <p className="text-gray-700">
                    Dla klientów z {districtData.district} oferujemy specjalne promocje i program lojalnościowy.
                    Zapraszamy do kontaktu i rezerwacji wizyt online!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Local Reviews */}
        <section className="py-20 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-4xl font-bold text-center mb-12">
              {localContent.headings[4]}
            </h2>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {districtReviews.map((review, index) => (
                <Card key={index}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <span className="text-lg font-bold text-orange-600">
                          {review.author.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <div className="font-semibold">{review.author}</div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-700 italic">"{review.comment}"</p>
                    <div className="text-sm text-gray-500 mt-4">{review.date}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl font-bold text-center mb-12">
                Często Zadawane Pytania
              </h2>

              <div className="space-y-6">
                {[
                  {
                    question: `Jak długo utrzymuje się permanentny makijaż wykonany w ${districtData.district}?`,
                    answer: `Efekt permanentnego makijażu utrzymuje się zazwyczaj od 1 do 3 lat, w zależności od pielęgnacji i typu skóry.`
                  },
                  {
                    question: `Czy potrzebuję wcześniejszej rezerwacji wizyty w ${districtData.district}?`,
                    answer: `Tak, wszystkie wizyty wymagają wcześniejszej rezerwacji. Rezerwować można online lub telefonicznie.`
                  },
                  {
                    question: `Jak dojechać do salonu w ${districtData.district}?`,
                    answer: `Nasz salon jest łatwo dostępny ${districtData.transport.join(' i ')} i znajduje się blisko ${districtData.landmarks[0]}.`
                  }
                ].map((faq, index) => (
                  <Card key={index}>
                    <CardContent className="p-6">
                      <h3 className="text-lg font-semibold mb-3">{faq.question}</h3>
                      <p className="text-gray-700">{faq.answer}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <TestimonialsSection />

        {/* CTA Section */}
        <CTASection
          title={`Umów Wizytę w ${districtData.district}`}
          description="Dołącz do grona zadowolonych klientów i zafunduj sobie luksusowe zabiegi."
          buttonText="Rezerwuj Online"
          buttonLink="/booking"
        />
      </main>

      <Footer />
    </>
  );
}

export default DistrictPage;