import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Crown,
  Gift,
  Star,
  Users,
  TrendingUp,
  Award,
  Trophy,
  Sparkles,
  Heart,
  CheckCircle,
  ArrowRight,
  Target,
  ArrowLeft
} from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/PageHeader';
import { useLoyaltyContext } from '@/contexts/LoyaltyContext';
import { Skeleton } from '@/components/ui/skeleton';

const LoyaltyProgramPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { state, actions } = useLoyaltyContext();
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const initializeLoyalty = async () => {
      try {
        await actions.loadMemberData();
      } catch (error) {
        console.error('Failed to load loyalty data:', error);
      } finally {
        setInitializing(false);
      }
    };

    initializeLoyalty();
  }, [actions]);

  // Show loading state while checking membership
  if (initializing) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Skeleton className="h-8 w-48" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Redirect to dashboard if user is a loyalty member
  if (state.member) {
    navigate('/loyalty/dashboard');
    return null;
  }

  const tiers = [
    {
      name: 'Bronze',
      icon: '🥉',
      color: 'from-amber-500 to-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      benefits: [
        'Punkty powitalne przy dołączeniu',
        'Prezent urodzinowy',
        '5% zniżki na usługi',
        'Dostęp do ekskluzywnych wydarzeń'
      ],
      requirements: 'Dołącz do programu'
    },
    {
      name: 'Silver',
      icon: '🥈',
      color: 'from-gray-500 to-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200',
      benefits: [
        'Wszystkie korzyści z Bronze',
        'O 20% więcej punktów za rezerwacje',
        'Priorytetowe wsparcie',
        'Sezonowe oferty ekskluzywne',
        'Darmowe konsultacje'
      ],
      requirements: '500 PLN wydatków lub 5 wizyt'
    },
    {
      name: 'Gold',
      icon: '🥇',
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
      benefits: [
        'Wszystkie korzyści z Silver',
        'O 50% więcej punktów za rezerwacje',
        'Ekskluzywne wydarzenia i warsztaty',
        'Darmowy miesięczny zabieg',
        'Spersonalizowane rekomendacje',
        'Priorytetowe rezerwacje'
      ],
      requirements: '1,500 PLN wydatków lub 15 wizyt'
    },
    {
      name: 'Platinum',
      icon: '💎',
      color: 'from-slate-500 to-slate-600',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200',
      benefits: [
        'Wszystkie korzyści z Gold',
        'Podwójne punkty za wszystkie rezerwacje',
        'Osobisty concierge',
        'Dostęp do ekskluzywnych produktów',
        'Kwartalne wydarzenia VIP',
        'Niestandardowe plany zabiegów',
        'White-glove service'
      ],
      requirements: '5,000 PLN wydatków lub 50 wizyt'
    },
    {
      name: 'Diamond',
      icon: '💠',
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      benefits: [
        'Wszystkie korzyści z Platinum',
        'O 150% więcej punktów za rezerwacje',
        'Niestandardowe doświadczenia luksusowe',
        'Pierwszy dostęp do innowacji',
        'Dedykowane wydarzenia Diamond',
        'Niestandardowe nagrody programu',
        'Dożywotnie recognition'
      ],
      requirements: '15,000 PLN wydatków lub 100 wizyt'
    }
  ];

  const waysToEarn = [
    {
      icon: '📅',
      title: 'Rezerwacje usług',
      description: 'Zarabiaj punkty za każdą rezerwację zabiegu beauty lub sesji fitness',
      points: '10-15 punktów'
    },
    {
      icon: '⭐',
      title: 'Opinie i recenzje',
      description: 'Dziel się swoimi doświadczeniami i zarabiaj punkty',
      points: '25 punktów'
    },
    {
      icon: '👥',
      title: 'Polecenia znajomych',
      description: 'Zaproś znajomych i zarabiaj punkty za ich pierwszą rezerwację',
      points: '100 punktów'
    },
    {
      icon: '🎂',
      title: 'Urodziny',
      description: 'Otrzymaj specjalny bonus punktowy w miesiącu urodzin',
      points: '50 punktów'
    },
    {
      icon: '📱',
      title: 'Social media',
      title: 'Udostępniania w mediach społecznościowych',
      description: 'Udostępniaj nasze treści i bądź aktywny w mediach społecznościowych',
      points: '5 punktów'
    },
    {
      icon: '🏆',
      title: 'Osiągnięcia',
      description: 'Odblokuj osiągnięcia i zarabiaj dodatkowe punkty',
      points: '25-200 punktów'
    }
  ];

  const rewards = [
    {
      category: 'Zniżki',
      icon: '💰',
      items: [
        { name: '10% zniżki na następny zabieg', points: 200 },
        { name: '25% zniżki na zabieg premium', points: 500 },
        { name: 'Pakiet 5 zabiegów - 15% taniej', points: 800 }
      ]
    },
    {
      category: 'Darmowe usługi',
      icon: '🎁',
      items: [
        { name: 'Darmowa konsultacja', points: 300 },
        { name: 'Zabieg na usta (15 min)', points: 800 },
        { name: 'Sesja fitness personalna', points: 600 }
      ]
    },
    {
      category: 'Produkty',
      icon: '🧴',
      items: [
        { name: 'Zestaw produktów premium', points: 500 },
        { name: 'Krem do pielęgnacji', points: 250 },
        { name: 'Suplementy diety', points: 350 }
      ]
    },
    {
      category: 'Doświadczenia',
      icon: '✨',
      items: [
        { name: 'Dostęp do warsztatów VIP', points: 600 },
        { name: 'Sesja zdjęciowa beauty', points: 1000 },
        { name: 'Spa day dla dwóch osób', points: 1500 }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <PageHeader
          title={
            <div className="flex items-center gap-3">
              <Crown className="h-8 w-8 text-rose-600" />
              <span>Program Lojalnościowy</span>
            </div>
          }
          subtitle="Zarabiaj punkty, odblokuj ekskluzywne korzyści i ciesz się wyjątkowym doświadczeniem"
          className="mb-8"
        />

        <div className="space-y-12">
          {/* Program Overview */}
        <section className="text-center max-w-4xl mx-auto">
          <div className="mb-8">
            <Badge className="mb-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white px-4 py-2">
              <Sparkles className="h-4 w-4 mr-2" />
              Dołącz do ponad 1,200 członków
            </Badge>
            <h2 className="text-3xl font-bold mb-4">
              Zostań członkiem naszego ekskluzywnego programu lojalnościowego
            </h2>
            <p className="text-lg text-muted-foreground mb-6">
              Dołącz do programu, który nagradza Twoją lojalność i pozwala Ci cieszyć się wyjątkowymi korzyściami.
              Zarabiaj punkty za każdą rezerwację, wymieniaj je na nagrody i ciesz się ekskluzywnymi przywilejami.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600">
                <Users className="h-5 w-5 mr-2" />
                Dołącz teraz
              </Button>
              <Button size="lg" variant="outline">
                <Target className="h-5 w-5 mr-2" />
                Dowiedz się więcej
              </Button>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-rose-600">1,247</div>
              <div className="text-sm text-muted-foreground">Członków</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">24,568</div>
              <div className="text-sm text-muted-foreground">Punktów wydanych</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">5</div>
              <div className="text-sm text-muted-foreground">Poziomów</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">50+</div>
              <div className="text-sm text-muted-foreground">Nagród</div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Jak to działa?</h2>
            <p className="text-lg text-muted-foreground">
              Cztery proste kroki do rozpoczęcia korzystania z programu lojalnościowego
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                step: 1,
                icon: '👋',
                title: 'Dołącz',
                description: 'Zarejestruj się i otrzymaj 100 punktów powitalnych'
              },
              {
                step: 2,
                icon: '⭐',
                title: 'Zarabiaj punkty',
                description: 'Zbieraj punkty za rezerwacje, opinie i polecenia'
              },
              {
                step: 3,
                icon: '📈',
                title: 'Awansuj',
                description: 'Odblokuj wyższe poziomy i lepsze korzyści'
              },
              {
                step: 4,
                icon: '🎁',
                title: 'Odbieraj nagrody',
                description: 'Wymieniaj punkty na ekskluzywne nagrody i usługi'
              }
            ].map((step) => (
              <Card key={step.step} className="text-center">
                <CardContent className="p-6">
                  <div className="text-4xl mb-4">{step.icon}</div>
                  <div className="text-2xl font-bold mb-2 text-rose-600">
                    Krok {step.step}
                  </div>
                  <h3 className="font-semibold mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Membership Tiers */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Poziomy członkostwa</h2>
            <p className="text-lg text-muted-foreground">
              Odblokuj coraz lepsze korzyści wraz ze wzrostem zaangażowania
            </p>
          </div>

          <div className="space-y-4">
            {tiers.map((tier, index) => (
              <Card key={tier.name} className={`${tier.bgColor} ${tier.borderColor} border-2`}>
                <CardContent className="p-6">
                  <div className="flex items-start gap-6">
                    <div className="text-center">
                      <div className="text-5xl mb-2">{tier.icon}</div>
                      <Badge className={`bg-gradient-to-r ${tier.color} text-white`}>
                        {tier.name}
                      </Badge>
                    </div>

                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-3">Poziom {tier.name}</h3>
                      <div className="mb-4">
                        <p className="text-sm text-muted-foreground mb-2">
                          <strong>Wymagania:</strong> {tier.requirements}
                        </p>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Korzyści:</h4>
                        <ul className="space-y-1">
                          {tier.benefits.map((benefit, benefitIndex) => (
                            <li key={benefitIndex} className="flex items-center gap-2 text-sm">
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              {benefit}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="text-center">
                      {index === 0 && (
                        <Badge className="bg-green-100 text-green-900 mb-2">
                          Najpopularniejszy
                        </Badge>
                      )}
                      <div className="text-lg font-bold mb-2">
                        {index === 0 ? 'Start' : index === tiers.length - 1 ? 'VIP' : 'Premium'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Ways to Earn */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Zarabiaj punkty</h2>
            <p className="text-lg text-muted-foreground">
              Odkryj różne sposoby na zbieranie punktów
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {waysToEarn.map((way, index) => (
              <Card key={index}>
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-4">{way.icon}</div>
                  <h3 className="font-semibold mb-2">{way.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{way.description}</p>
                  <Badge variant="secondary">{way.points}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Rewards */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Odkryj nagrody</h2>
            <p className="text-lg text-muted-foreground">
              Wymieniaj swoje punkty na fantastyczne nagrody
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {rewards.map((category) => (
              <Card key={category.category}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="text-2xl">{category.icon}</span>
                    {category.category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {category.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm font-medium">{item.name}</span>
                        <Badge variant="outline">{item.points} pkt</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center bg-gradient-to-r from-rose-100 to-pink-100 rounded-2xl p-8">
          <Trophy className="h-16 w-16 text-rose-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">Gotowy dołączyć?</h2>
          <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
            Dołącz do tysięcy zadowolonych członków i zacznij zarabiać punkty już dziś.
            Odblokuj ekskluzywne korzyści i ciesz się wyjątkowym doświadczeniem w Mariia Beauty & Fitness.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600">
              <Users className="h-5 w-5 mr-2" />
              Dołącz do programu
            </Button>
            <Button size="lg" variant="outline">
              <Heart className="h-5 w-5 mr-2" />
              Zarezerwuj wizytę
            </Button>
          </div>
        </section>

        {/* FAQ */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Często zadawane pytania</h2>
            <p className="text-lg text-muted-foreground">
              Wszystko, co musisz wiedzieć o naszym programie lojalnościowym
            </p>
          </div>

          <div className="max-w-4xl mx-auto space-y-4">
            {[
              {
                question: 'Jak mogę dołączyć do programu lojalnościowego?',
                answer: 'Dołączenie jest automatyczne! Po prostu zarezerwuj swoją pierwszą wizytę, a my utworzymy dla Ciebie konto lojalnościowe z 100 punktami powitalnymi.'
              },
              {
                question: 'Jak długo ważne są moje punkty?',
                answer: 'Punkty są ważne przez 12 miesięcy od daty zdobycia. Otrzymasz przypomnienie, jeśli Twoje punkty mają wygasnąć w ciągu najbliższych 30 dni.'
              },
              {
                question: 'Czy mogę wymienić punkty na gotówkę?',
                answer: 'Punkty nie mogą być wymienione na gotówkę, ale możesz ich użyć do otrzymania zniżek, darmowych usług i ekskluzywnych nagród.'
              },
              {
                question: 'Jak mogę sprawdzić saldo punktów?',
                answer: 'Możesz sprawdzić swoje saldo punktów w panelu członkowskim na naszej stronie internetowej lub w aplikacji mobilnej.'
              }
            ].map((faq, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2">{faq.question}</h3>
                  <p className="text-muted-foreground">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
        </div>
      </div>
    </div>
  );
};

export default LoyaltyProgramPage;