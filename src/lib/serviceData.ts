// Service data mapping - corresponds to Booksy catalog accessed 2025-10-16
export const beautyServices = [
  {
    slug: "makijaz-permanentny-ust",
    booksy_name: "Makijaż permanentny ust",
    duration: "2h 30min",
    price_from: 720,
    price_to: 900,
    category: "permanent-makeup",
    benefit: {
      en: "Soft, even lip color that heals natural—no overlining needed.",
      pl: "Miękki, równy kolor ust, który goi się naturalnie—bez przerysowania.",
      ua: "Ніжний, рівномірний колір губ із натуральним загоєнням—без оверлайну."
    },
    who_for: {
      en: "Faded lip tone, uneven contour, frequent lipstick users.",
      pl: "Blady odcień ust, nierówny kontur, częste użycie szminki.",
      ua: "Тьмяний тон, нерівний контур, часте використання помади."
    }
  },
  {
    slug: "makijaz-permanentny-brwi",
    booksy_name: "Makijaż permanentny brwi",
    duration: "2h 30min",
    price_from: 720,
    price_to: 900,
    category: "permanent-makeup",
    benefit: {
      en: "Framing brows with soft definition; symmetry without harsh lines.",
      pl: "Ramy twarzy z miękką definicją; symetria bez ostrych krawędzi.",
      ua: "Оформлені брови з м'якою чіткістю; симетрія без різких ліній."
    },
    who_for: {
      en: "Sparse/uneven brows, time-saving routine.",
      pl: "Rzadkie/niesymetryczne brwi, oszczędność czasu.",
      ua: "Рідкі/асиметричні брови, економія часу."
    }
  },
  {
    slug: "makijaz-permanentny-oczu",
    booksy_name: "Makijaż permanentny oczu",
    duration: "2h",
    price_from: 600,
    price_to: 750,
    category: "permanent-makeup",
    benefit: {
      en: "Lash-line definition that survives workouts and rain.",
      pl: "Kreska w linii rzęs odporna na trening i deszcz.",
      ua: "Підкреслена лінія вій, що тримається за будь-яких умов."
    }
  },
  {
    slug: "brwi-laminacja-regulacja",
    booksy_name: "Brwi laminacja+regulacją",
    duration: "1h",
    price_from: 120,
    price_to: 180,
    category: "brow-styling",
    benefit: {
      en: "Semi-permanent brow set + tidy regulation.",
      pl: "Semi-permanentne ułożenie + regulacja.",
      ua: "Півперманентне укладання + корекція."
    }
  },
  {
    slug: "stylizacja-brwi-koloryzacja",
    booksy_name: "Stylizacja brwi +koloryzacja",
    duration: "30min",
    price_from: 100,
    price_to: 125,
    category: "brow-styling",
    benefit: {
      en: "Shape, tint, and care consult in one visit.",
      pl: "Kształt, koloryzacja i konsultacja pielęgnacji w jednej wizycie.",
      ua: "Форма, тон і консультація догляду за один візит."
    }
  },
  {
    slug: "rzesy-lifting-laminacja",
    booksy_name: "Rzęsy Lifting +Laminacja (z koloryzacja)",
    duration: "1h",
    price_from: 124,
    price_to: 155,
    category: "lashes",
    benefit: {
      en: "Curled, tinted, conditioned lashes—no extensions.",
      pl: "Podkręcone, przyciemnione i odżywione rzęsy—bez przedłużania.",
      ua: "Підкручені, тоновані та доглянуті вії—без нарощування."
    }
  },
  {
    slug: "komplet-laminacja-botox-brwi-rzes",
    booksy_name: "KOMPLET Laminacja BOTOX BRWI &RZES",
    duration: "1h 10min",
    price_from: 239,
    price_to: 299,
    category: "package",
    benefit: {
      en: "Brow + lash makeover with nourishing botox & keratin.",
      pl: "Metamorfoza brwi i rzęs z odżywczym botoxem i keratyną.",
      ua: "Комплекс брів і вій з доглядом ботокс + кератин."
    }
  }
];

export const fitnessPrograms = [
  {
    slug: "glute-sculpt-8w",
    title: {
      en: "Glute Sculpt 8-Week (Gym or Home)",
      pl: "Glute Sculpt 8 tyg. (Siłownia lub Dom)",
      ua: "Glute Sculpt 8 тиж. (Зал або Дім)"
    },
    duration: "8 weeks",
    sessions_per_week: 3,
    goal: {
      en: "Lifted, fuller glutes with balanced quads/hamstrings; better hip drive and gait. No guarantees.",
      pl: "Uniesione, pełniejsze pośladki przy równowadze ud/tyłów; lepsza praca bioder.",
      ua: "Підняті, об'ємні сідниці з балансом стегон; краща робота тазу."
    }
  },
  {
    slug: "waist-core",
    title: {
      en: "Waist & Core (Anti-Rotation + TVA)",
      pl: "Talia & Rdzeń (Anty-Rotacja + TVA)",
      ua: "Талія & Кор (Анти-Ротація + TVA)"
    },
    duration: "4 weeks",
    sessions_per_week: 2
  },
  {
    slug: "posture-mobility",
    title: {
      en: "Posture & Mobility for Desk Work",
      pl: "Postura & Mobilność dla Pracy Biurowej",
      ua: "Постава & Мобільність для Офісу"
    },
    duration: "Daily 20-30 min"
  },
  {
    slug: "lean-toned-no-barbell",
    title: {
      en: "Lean & Toned (No Barbell)",
      pl: "Szczupła & Wysportowana (Bez Sztangi)",
      ua: "Струнка & Підтягнута (Без Штанги)"
    },
    duration: "8 weeks",
    sessions_per_week: 3
  },
  {
    slug: "rehab-friendly",
    title: {
      en: "Rehab-Friendly Reconditioning",
      pl: "Trening Rehabilitacyjny",
      ua: "Реабілітаційне Тренування"
    },
    requires_clearance: true
  },
  {
    slug: "pre-post-natal",
    title: {
      en: "Pre/Post-natal Gentle Strength",
      pl: "Siła dla Przyszłych/Młodych Mam",
      ua: "Сила для Майбутніх/Молодих Мам"
    },
    requires_clearance: true
  },
  {
    slug: "pt-1-1",
    title: {
      en: "1:1 Personal Training (Studio/Gym)",
      pl: "Trening Personalny 1:1 (Studio/Siłownia)",
      ua: "Персональне Тренування 1:1 (Студія/Зал)"
    },
    duration: "30/45/60 min"
  },
  {
    slug: "online-coaching",
    title: {
      en: "Online Coaching (Chat/Video + Weekly Plan)",
      pl: "Coaching Online (Chat/Wideo + Plan Tygodniowy)",
      ua: "Онлайн-Коучинг (Чат/Відео + Тижневий План)"
    },
    duration: "Monthly"
  }
];
