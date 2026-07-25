export type Category = string;

export type ContentBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "image"; src: string; alt: string; credit: string };

export type Article = {
  slug: string;
  title: string;
  summary: string;
  category: Category;
  publishedAt: string;
  author: string;
  image: string;
  imageAlt: string;
  imageCredit: string;
  featured?: boolean;
  blocks: ContentBlock[];
};

export const articles: Article[] = [
  {
    slug: "guinee-acces-facebook-vpn",
    title:
      "Guinée : l’accès à Facebook perturbé, de nombreux utilisateurs se tournent vers les VPN",
    summary:
      "De nombreux internautes signalent des difficultés d’accès à Facebook et se tournent vers des VPN.",
    category: "Actualités",
    publishedAt: "2026-04-15",
    author: "Voice of Guinea",
    image: "/images/news/guinee-acces-facebook-vpn.jpg",
    imageAlt: "Illustration d’un VPN sur un écran",
    imageCredit: "Unsplash",
    featured: true,
    blocks: [
      { type: "paragraph", text: "Depuis plusieurs heures, de nombreux internautes en Guinée signalent des difficultés d’accès à Facebook et, pour certains, à Messenger. Plusieurs utilisateurs affirment que les plateformes sont devenues partiellement ou totalement inaccessibles sans recours à un VPN." },
      { type: "paragraph", text: "Selon plusieurs témoignages partagés en ligne, le constat reste souvent le même : chargement très lent, impossibilité d’ouvrir certaines pages ou blocage complet de l’application. Face à cette situation, de nombreux usagers disent s’être tournés vers des VPN afin de retrouver un accès plus stable à leurs comptes." },
      { type: "heading", text: "Une perturbation qui touche aussi les activités en ligne" },
      { type: "paragraph", text: "Au-delà de la gêne pour les particuliers, cette perturbation touche également des personnes dont l’activité dépend fortement des réseaux sociaux. Vendeurs en ligne, community managers et entrepreneurs du numérique évoquent des difficultés à répondre à leurs clients, gérer leurs pages ou maintenir leurs échanges habituels." },
      { type: "paragraph", text: "Dans un contexte où Facebook reste l’une des plateformes les plus utilisées en Guinée, la situation suscite de nombreuses réactions. Entre frustration, incompréhension et inquiétude, beaucoup cherchent à comprendre l’origine exacte du problème." },
      { type: "heading", text: "Des interrogations en l’absence d’explication officielle" },
      { type: "paragraph", text: "Ces perturbations interviennent alors que plusieurs contenus très commentés ont circulé massivement sur les réseaux sociaux ces dernières heures. Plusieurs hypothèses sont avancées par les internautes : incident technique, ralentissement du réseau ou restriction ciblée." },
      { type: "paragraph", text: "À ce stade, aucune communication officielle n’a permis de confirmer la cause précise de ces difficultés d’accès. L’absence d’explication claire continue donc d’alimenter les interrogations, notamment chez les jeunes utilisateurs et les professionnels dont l’activité repose en partie sur les outils numériques." },
      { type: "heading", text: "Un rappel du poids du numérique dans le quotidien" },
      { type: "paragraph", text: "Pour beaucoup, cette situation rappelle à quel point l’accès aux plateformes sociales est désormais lié à l’information, à la communication mais aussi à l’économie informelle et à l’entrepreneuriat en ligne." },
    ],
  },
  {
    slug: "feguifoot-crise-assemblee",
    title: "Féguifoot en crise : une assemblée générale très attendue",
    summary:
      "La crise de gouvernance à la Féguifoot place la prochaine assemblée générale au centre de toutes les attentions.",
    category: "Actualités",
    publishedAt: "2026-04-15",
    author: "Voice of Guinea",
    image: "/images/news/feguifoot-crise.jpg",
    imageAlt: "Réunion liée au football guinéen",
    imageCredit: "Unsplash",
    blocks: [
      { type: "paragraph", text: "La Fédération guinéenne de football traverse une période marquée par de fortes tensions et de nombreuses interrogations autour de sa gouvernance. Dans ce contexte, l’assemblée générale annoncée suscite une attention particulière, aussi bien chez les acteurs du football local que chez les supporters." },
      { type: "paragraph", text: "Depuis plusieurs semaines, les débats autour de la gestion de l’institution alimentent les réactions dans le milieu sportif. Plusieurs observateurs estiment désormais qu’un cadre clair et des décisions fortes sont nécessaires pour sortir durablement de cette zone d’incertitude." },
      { type: "heading", text: "Un climat de tension qui fragilise l’institution" },
      { type: "paragraph", text: "Les désaccords qui opposent différentes parties prenantes ont peu à peu installé un climat tendu au sein du football guinéen. Cette situation nourrit les inquiétudes sur la stabilité de l’instance et sur sa capacité à piloter sereinement les grandes échéances à venir." },
      { type: "heading", text: "Une assemblée générale attendue comme un tournant" },
      { type: "paragraph", text: "L’assemblée générale à venir est perçue comme un moment décisif. Beaucoup espèrent qu’elle permettra d’apaiser les tensions, de clarifier certaines positions et d’ouvrir une nouvelle phase dans la gestion du football guinéen." },
      { type: "heading", text: "Un enjeu qui dépasse le cadre administratif" },
      { type: "paragraph", text: "Derrière la crise institutionnelle, c’est aussi l’image du football guinéen qui se joue. Les répercussions peuvent toucher l’ensemble de l’écosystème : clubs, encadrement, compétitions et perception du public." },
    ],
  },
  {
    slug: "projet-minier-guinee-investissement",
    title: "Guinée : un projet minier relance l’intérêt autour du potentiel du pays",
    summary:
      "Un nouveau projet minier ravive les perspectives d’investissement et les attentes autour des retombées locales.",
    category: "Actualités",
    publishedAt: "2026-04-15",
    author: "Voice of Guinea",
    image: "/images/news/projet-minier-guinee.jpg",
    imageAlt: "Colline de bauxite sur un site minier en Guinée",
    imageCredit: "Présidence de la République de Guinée",
    blocks: [
      { type: "paragraph", text: "Un projet minier en Guinée attire actuellement l’attention et relance les discussions autour du potentiel économique du pays. Dans un contexte où les ressources naturelles jouent un rôle clé, ce type d’initiative suscite un intérêt croissant." },
      { type: "paragraph", text: "Le secteur minier guinéen, déjà reconnu à l’échelle internationale, continue d’apparaître comme un levier stratégique pour le développement. De nouveaux projets viennent renforcer cette dynamique et alimentent les perspectives d’investissement." },
      { type: "heading", text: "Un secteur clé pour l’économie" },
      { type: "paragraph", text: "La Guinée dispose de ressources importantes, notamment en bauxite, qui en font un acteur incontournable sur certains marchés. Le développement de nouveaux projets pourrait consolider cette position et renforcer l’attractivité du pays." },
      { type: "heading", text: "Des attentes autour des retombées" },
      { type: "paragraph", text: "Au-delà des investissements, les attentes portent également sur les impacts concrets pour la population. L’emploi, les infrastructures et le développement local restent au cœur des enjeux liés à ce type de projet." },
    ],
  },
  {
    slug: "guinee-u17-victoire-niger",
    title: "Éliminatoires Mondial Féminin U17 : la Guinée domine le Niger (5-2)",
    summary:
      "Le Syli féminin U17 s’impose 5-2 à Niamey et prend une sérieuse option sur la qualification.",
    category: "Actualités",
    publishedAt: "2026-04-15",
    author: "Voice of Guinea",
    image: "/images/news/guinee-u17-feminine-equipe-niger-2026.jpg",
    imageAlt: "Équipe féminine U17 de Guinée avant le match contre le Niger",
    imageCredit: "Fédération Guinéenne de Football (FGF)",
    blocks: [
      { type: "paragraph", text: "Le Syli national féminin U17 a réussi une belle entrée en matière en s’imposant largement face au Niger (5-2), mardi à Niamey, lors du match aller du premier tour des éliminatoires de la Coupe du Monde féminine U17 Maroc 2026." },
      { type: "paragraph", text: "Grâce à cette victoire convaincante à l’extérieur, la Guinée prend une option sérieuse sur la qualification avant la manche retour." },
      { type: "heading", text: "Une attaque guinéenne en grande réussite" },
      { type: "paragraph", text: "Aminata Touré s’est particulièrement illustrée avec un triplé. Kouyaté Aïcha et Nana Camara ont également marqué pour permettre au Syli féminin U17 de prendre une avance importante." },
      { type: "image", src: "/images/news/guinee-u17-joueuse-celebration-but-niger.jpg", alt: "Joueuse du Syli féminin U17 célébrant un but", credit: "Fédération Guinéenne de Football (FGF)" },
      { type: "heading", text: "Un avantage important avant le match retour" },
      { type: "paragraph", text: "Avec ce succès 5-2, la sélection guinéenne se place dans une position favorable avant le match retour programmé le 18 avril au stade Général Seyni Kountché de Niamey." },
      { type: "heading", text: "Le Syli féminin U17 vise plus loin" },
      { type: "paragraph", text: "Ce résultat confirme les ambitions de la Guinée dans ces éliminatoires. Avec une génération prometteuse et une prestation offensive solide, le Syli féminin espère poursuivre sur cette dynamique." },
    ],
  },
  {
    slug: "melangeur-artiste-guinee-reseaux",
    title: "Mélangeur : un artiste guinéen qui affirme son identité et fait parler de lui",
    summary:
      "Le rappeur guinéen Mélangeur construit sa place grâce à une identité assumée et un fort ancrage culturel.",
    category: "Divertissement",
    publishedAt: "2026-04-15",
    author: "Voice of Guinea",
    image: "/images/entertainment/melangeur-artiste-guinee.jpg",
    imageAlt: "Le rappeur guinéen Mélangeur",
    imageCredit: "Communication de l’artiste",
    blocks: [
      { type: "paragraph", text: "Mélangeur continue de faire parler de lui dans le paysage musical guinéen. L’artiste s’impose progressivement grâce à une identité assumée, une présence remarquée et une manière bien à lui de porter sa culture dans sa musique." },
      { type: "paragraph", text: "À travers son univers, le rappeur attire l’attention d’un public de plus en plus large. Son nom circule davantage, ses prises de parole sont commentées et sa trajectoire suscite l’intérêt." },
      { type: "heading", text: "Une identité artistique pleinement assumée" },
      { type: "paragraph", text: "L’une des forces de Mélangeur réside dans sa capacité à défendre une ligne artistique claire. Là où certains misent sur des codes plus formatés, lui semble choisir l’authenticité, le ton personnel et l’ancrage culturel." },
      { type: "heading", text: "Un artiste qui mise sur sa culture" },
      { type: "paragraph", text: "Mélangeur renvoie l’image d’un artiste qui ne cherche pas seulement à suivre les tendances, mais à imposer sa vision. Cette volonté contribue à renforcer sa place auprès de son public." },
      { type: "heading", text: "Une dynamique à suivre de près" },
      { type: "paragraph", text: "Sa visibilité grandissante, son image affirmée et sa capacité à susciter des réactions en font déjà un nom à surveiller sur la scène guinéenne." },
    ],
  },
];

export function getArticle(slug: string) {
  return articles.find((article) => article.slug === slug);
}

export function getArticlesByCategory(category: Category) {
  return articles.filter((article) => article.category === category);
}

export function formatArticleDate(date: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date.includes("T") ? date : `${date}T12:00:00Z`));
}

export function getReadingTime(article: Article) {
  const words = [
    article.title,
    article.summary,
    ...article.blocks
      .filter((block) => block.type !== "image")
      .map((block) => block.text),
  ]
    .join(" ")
    .trim()
    .split(/\s+/).length;

  return Math.max(1, Math.ceil(words / 200));
}
