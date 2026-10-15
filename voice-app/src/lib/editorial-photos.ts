export type LicensedEditorialPhoto = {
  path: string;
  alt: string;
  credit: string;
  source: string;
  license: string;
  title?: string;
};

// Every image was checked against its source page and visual subject.
// Archive/illustration wording prevents an older photo from being read as the reported event.
const photos: Record<string, LicensedEditorialPhoto> = {
  "power": {
    "path": "/images/editorial-licensed/power.webp",
    "alt": "Lignes de transport d’électricité (photo d’illustration)",
    "credit": "Peter Balcerzak · CC BY-SA 3.0",
    "source": "https://commons.wikimedia.org/wiki/File%3APower_Lines_(178579725).jpeg",
    "license": "CC BY-SA 3.0",
    "title": "File:Power Lines (178579725).jpeg"
  },
  "football": {
    "path": "/images/editorial-licensed/football.webp",
    "alt": "Un joueur guinéen lors d’un ancien match contre l’Algérie (archive)",
    "credit": "feguifoot · Public domain",
    "source": "https://commons.wikimedia.org/wiki/File%3AWorld_Cup_Qualification_Africa_Guinea_v_Algeria.jpg",
    "license": "Public domain",
    "title": "File:World Cup Qualification Africa Guinea v Algeria.jpg"
  },
  "market": {
    "path": "/images/editorial-licensed/market.webp",
    "alt": "Vendeuses de mangues en Guinée (archive)",
    "credit": "Hmadiyan · CC BY-SA 4.0",
    "source": "https://commons.wikimedia.org/wiki/File%3AMango_sellers.jpg",
    "license": "CC BY-SA 4.0",
    "title": "File:Mango sellers.jpg"
  },
  "madina": {
    "path": "/images/editorial-licensed/madina.webp",
    "alt": "Vue du marché de Madina à Conakry (archive)",
    "credit": "Thie Abdoul · CC BY-SA 4.0",
    "source": "https://commons.wikimedia.org/wiki/File%3AMarch%C3%A9_Madina_4.jpg",
    "license": "CC BY-SA 4.0",
    "title": "File:Marché Madina 4.jpg"
  },
  "sport": {
    "path": "/images/editorial-licensed/sport.webp",
    "alt": "Enfants pratiquant une activité sportive en Guinée (archive)",
    "credit": "Diane bora · CC BY-SA 4.0",
    "source": "https://commons.wikimedia.org/wiki/File%3ADes_enfants_qui_pratique_le_sport_pour_leur_sant%C3%A9.jpg",
    "license": "CC BY-SA 4.0",
    "title": "File:Des enfants qui pratique le sport pour leur santé.jpg"
  },
  "hpv": {
    "path": "/images/editorial-licensed/hpv.webp",
    "alt": "Seringue de vaccin contre le papillomavirus (photo d’illustration)",
    "credit": "melvil · CC BY-SA 4.0",
    "source": "https://commons.wikimedia.org/wiki/File%3AHPV-vaccine-_Gardasil2016JAPAN.jpg",
    "license": "CC BY-SA 4.0",
    "title": "File:HPV-vaccine- Gardasil2016JAPAN.jpg"
  },
  "clinic": {
    "path": "/images/editorial-licensed/clinic.webp",
    "alt": "Centre de santé de Madina en Guinée (archive)",
    "credit": "Diane bora · CC BY-SA 4.0",
    "source": "https://commons.wikimedia.org/wiki/File%3ACentre_de_sant%C3%A9_de_madina.jpg",
    "license": "CC BY-SA 4.0",
    "title": "File:Centre de santé de madina.jpg"
  },
  "bottle": {
    "path": "/images/editorial-licensed/bottle.webp",
    "alt": "Packs de bouteilles d’eau (photo d’illustration)",
    "credit": "Eminence190 · CC0",
    "source": "https://commons.wikimedia.org/wiki/File%3APacks_of_OAU_branded_bottled_water_on_sidewalk.jpg",
    "license": "CC0",
    "title": "File:Packs of OAU branded bottled water on sidewalk.jpg"
  },
  "gas": {
    "path": "/images/editorial-licensed/gas.webp",
    "alt": "Bouteilles de gaz domestique (photo d’illustration)",
    "credit": "Evil Monkey · CC BY 2.5",
    "source": "https://commons.wikimedia.org/wiki/File%3ALPG_cylinders.JPG",
    "license": "CC BY 2.5",
    "title": "File:LPG cylinders.JPG"
  },
  "computer": {
    "path": "/images/editorial-licensed/computer.webp",
    "alt": "Salle de classe équipée d’ordinateurs (photo d’illustration)",
    "credit": "Antonio Chaves · CC BY-SA 4.0",
    "source": "https://commons.wikimedia.org/wiki/File%3AComputer_classroom.JPG",
    "license": "CC BY-SA 4.0",
    "title": "File:Computer classroom.JPG"
  },
  "ship": {
    "path": "/images/editorial-licensed/ship.webp",
    "alt": "Le navire-hôpital Peace Ark en 2014 (archive)",
    "credit": "U.S. Navy photo by Mass Communication Specialist 1st Class Shannon Renfroe · Public domain",
    "source": "https://commons.wikimedia.org/wiki/File%3APeople's_Liberation_Army_(Navy)_ship_PLA(N)_Peace_Ark_(T-AH_866)_steams_in_close_formation_during_Rim_of_the_Pacific_(RIMPAC)_Exercise_2014.jpg",
    "license": "Public domain",
    "title": "File:People's Liberation Army (Navy) ship PLA(N) Peace Ark (T-AH 866) steams in close formation during Rim of the Pacific (RIMPAC) Exercise 2014.jpg"
  },
  "school": {
    "path": "/images/editorial-licensed/school.webp",
    "alt": "École à Fria, en Guinée (archive)",
    "credit": "Aboubacarkhoraa · CC BY-SA 4.0",
    "source": "https://commons.wikimedia.org/wiki/File%3AEcole_%C3%A0_Fria.jpg",
    "license": "CC BY-SA 4.0",
    "title": "File:Ecole à Fria.jpg"
  },
  "teacher-school": {
    "path": "/images/editorial-licensed/teacher-school.webp",
    "alt": "École normale d’instituteurs de Kindia (archive)",
    "credit": "Rachid Kawass Camara · CC BY-SA 4.0",
    "source": "https://commons.wikimedia.org/wiki/File%3AL'ENI_DE_KINDIA.jpg",
    "license": "CC BY-SA 4.0",
    "title": "File:L'ENI DE KINDIA.jpg"
  },
  "palais": {
    "path": "/images/editorial-licensed/palais.webp",
    "alt": "Palais du peuple de Conakry lors d’une ancienne célébration (archive)",
    "credit": "Aboubacarkhoraa · CC BY-SA 4.0",
    "source": "https://commons.wikimedia.org/wiki/File%3APalais_du_peuple_de_Conakry_le_jour_de_l%E2%80%99ind%C3%A9pendance_Guin%C3%A9e_01.jpg",
    "license": "CC BY-SA 4.0",
    "title": "File:Palais du peuple de Conakry le jour de l’indépendance Guinée 01.jpg"
  },
  "independence": {
    "path": "/images/editorial-licensed/independence.webp",
    "alt": "Célébration passée de l’indépendance à Conakry (archive)",
    "credit": "Aboubacarkhoraa · CC BY-SA 4.0",
    "source": "https://commons.wikimedia.org/wiki/File%3AJour_de_l%E2%80%99ind%C3%A9pendance_Guin%C3%A9e_02.jpg",
    "license": "CC BY-SA 4.0",
    "title": "File:Jour de l’indépendance Guinée 02.jpg"
  },
  "wood": {
    "path": "/images/editorial-licensed/wood.webp",
    "alt": "Transport de bois à vélo en Guinée (archive)",
    "credit": "Aboubacarkhoraa · CC BY-SA 4.0",
    "source": "https://commons.wikimedia.org/wiki/File%3ATransport_de_boie_sur_v%C3%A9lo_8.jpg",
    "license": "CC BY-SA 4.0",
    "title": "File:Transport de boie sur vélo 8.jpg"
  },
  "mask": {
    "path": "/images/editorial-licensed/mask.webp",
    "alt": "Masque kpelle originaire de Guinée, conservé dans une collection (archive)",
    "credit": "Raccolte Extraeuropee del Castello Sforzesco · CC BY-SA 3.0",
    "source": "https://commons.wikimedia.org/wiki/File%3ARaccolte_Extraeuropee_-_AFR_00034_Bassani_-_Maschera_Kpelle_-_Guinea.jpg",
    "license": "CC BY-SA 3.0",
    "title": "File:Raccolte Extraeuropee - AFR 00034 Bassani - Maschera Kpelle - Guinea.jpg"
  },
  "bank": {
    "path": "/images/editorial-licensed/bank.webp",
    "alt": "Bâtiment de la Banque centrale de la République de Guinée (archive)",
    "credit": "Ourysow92 · CC BY-SA 4.0",
    "source": "https://commons.wikimedia.org/wiki/File%3ABanque_central_de_la_r%C3%A9publique_de_Guinee.jpg",
    "license": "CC BY-SA 4.0",
    "title": "File:Banque central de la république de Guinee.jpg"
  },
  "handball": {
    "path": "/images/editorial-licensed/handball.webp",
    "alt": "Match de handball entre la Tchéquie et la France en 2010 (photo d’illustration)",
    "credit": "Steindy ( talk ) 00:03, 21 January 2010 (UTC) · CC BY-SA 3.0",
    "source": "https://commons.wikimedia.org/wiki/File%3ACZE_vs_FRA_(01)_-_2010_European_Men's_Handball_Championship.jpg",
    "license": "CC BY-SA 3.0",
    "title": "File:CZE vs FRA (01) - 2010 European Men's Handball Championship.jpg"
  },
  "plastic": {
    "path": "/images/editorial-licensed/plastic.webp",
    "alt": "Déchets plastiques (photo d’illustration)",
    "credit": "Mandeiya flower · CC BY-SA 4.0",
    "source": "https://commons.wikimedia.org/wiki/File%3APlastic_waste_pollution.jpg",
    "license": "CC BY-SA 4.0",
    "title": "File:Plastic waste pollution.jpg"
  },
  "rice-field": {
    "path": "/images/editorial-licensed/rice-field.webp",
    "alt": "Rizière en Guinée (archive)",
    "credit": "Flucco · CC BY-SA 4.0",
    "source": "https://commons.wikimedia.org/wiki/File%3AReisfeldTelimele.jpg",
    "license": "CC BY-SA 4.0",
    "title": "File:ReisfeldTelimele.jpg"
  },
  "rice-harvest": {
    "path": "/images/editorial-licensed/rice-harvest.webp",
    "alt": "Récolte de riz en Guinée (archive)",
    "credit": "Flucco · CC BY-SA 4.0",
    "source": "https://commons.wikimedia.org/wiki/File%3AReisernte.jpg",
    "license": "CC BY-SA 4.0",
    "title": "File:Reisernte.jpg"
  },
  "grain": {
    "path": "/images/editorial-licensed/grain.webp",
    "alt": "Tamisage du grain en Guinée (archive)",
    "credit": "AConde11 · CC BY-SA 4.0",
    "source": "https://commons.wikimedia.org/wiki/File%3ATamisage_du_grain.jpg",
    "license": "CC BY-SA 4.0",
    "title": "File:Tamisage du grain.jpg"
  },
  "media": {
    "path": "/images/editorial-licensed/media.webp",
    "alt": "Bâtiment de la Radiodiffusion Télévision Guinéenne (archive)",
    "credit": "Aboubacarkhoraa · CC BY-SA 4.0",
    "source": "https://commons.wikimedia.org/wiki/File%3ARTG_Guin%C3%A9e.jpg",
    "license": "CC BY-SA 4.0",
    "title": "File:RTG Guinée.jpg"
  },
  "university": {
    "path": "/images/editorial-licensed/university.webp",
    "alt": "Bâtiment universitaire en Guinée (archive)",
    "credit": "Utad Guinée · CC BY-SA 3.0",
    "source": "https://commons.wikimedia.org/wiki/File%3AUniversit%C3%A9_Thierno_Amadou_Diallo_-_UTAD.jpg",
    "license": "CC BY-SA 3.0",
    "title": "File:Université Thierno Amadou Diallo - UTAD.jpg"
  },
  "road": {
    "path": "/images/editorial-licensed/road.webp",
    "alt": "Route Conakry-Boffa en Guinée (archive)",
    "credit": "Cooperazione · CC BY-SA 3.0",
    "source": "https://commons.wikimedia.org/wiki/File%3AStrada_Conakry-_Boffa_Guinea.jpg",
    "license": "CC BY-SA 3.0",
    "title": "File:Strada Conakry- Boffa Guinea.jpg"
  },
  "adama": {
    "path": "/images/editorial-licensed/adama.webp",
    "alt": "Adama Barrow en 2018 (archive)",
    "credit": "Chatham House · CC BY 2.0",
    "source": "https://commons.wikimedia.org/wiki/File%3AAdama_Barrow%2C_President%2C_Republic_of_the_Gambia_-_2018_(cropped).jpg",
    "license": "CC BY 2.0",
    "title": "File:Adama Barrow, President, Republic of the Gambia - 2018 (cropped).jpg"
  },
  "mamadi": {
    "path": "/images/editorial-licensed/mamadi.webp",
    "alt": "Mamadi Doumbouya en 2022 (archive)",
    "credit": "Ambassade des Etats-Unis Conakry, Guinée · Public domain",
    "source": "https://commons.wikimedia.org/wiki/File%3AMamadi_Doumbouya_2022.jpg",
    "license": "Public domain",
    "title": "File:Mamadi Doumbouya 2022.jpg"
  },
  "stadium": {
    "path": "/images/editorial-licensed/stadium.webp",
    "alt": "Stade national de Guinée à Conakry (archive)",
    "credit": "Sazzi88 · CC BY-SA 4.0",
    "source": "https://commons.wikimedia.org/wiki/File%3AGuinea_National_%2C_Stadium.jpg",
    "license": "CC BY-SA 4.0",
    "title": "File:Guinea National , Stadium.jpg"
  },
  "water-nature": {
    "path": "/images/editorial-licensed/water-nature.webp",
    "alt": "Source naturelle de Ninguelande en Guinée (archive)",
    "credit": "Mostshine · CC BY-SA 4.0",
    "source": "https://commons.wikimedia.org/wiki/File%3ASource_NINGUELANDE.jpg",
    "license": "CC BY-SA 4.0",
    "title": "File:Source NINGUELANDE.jpg"
  },
  "cinema": {
    "path": "/images/editorial-licensed/cinema.webp",
    "alt": "Tournage dans un studio de cinéma guinéen (archive)",
    "credit": "MoussaFernandez · CC BY-SA 4.0",
    "source": "https://commons.wikimedia.org/wiki/File%3AMAKING_OFF_DES_STUDIOS_MK_KINGDOM.jpg",
    "license": "CC BY-SA 4.0",
    "title": "File:MAKING OFF DES STUDIOS MK KINGDOM.jpg"
  },
  "djembe": {
    "path": "/images/editorial-licensed/djembe.webp",
    "alt": "Deux djembés (photo d’illustration)",
    "credit": "Edwin1971 at Dutch Wikipedia · CC BY-SA 3.0",
    "source": "https://commons.wikimedia.org/wiki/File%3ADjemb%C3%A9's.jpg",
    "license": "CC BY-SA 3.0",
    "title": "File:Djembé's.jpg"
  },
  "museum": {
    "path": "/images/editorial-licensed/museum.webp",
    "alt": "Musée régional de Boké en Guinée (archive)",
    "credit": "Sayd224 · CC BY-SA 4.0",
    "source": "https://commons.wikimedia.org/wiki/File%3AB%C3%A2timent_du_mus%C3%A9e_r%C3%A9gional_de_Bok%C3%A9_avec_un_bel_environnement.jpg",
    "license": "CC BY-SA 4.0",
    "title": "File:Bâtiment du musée régional de Boké avec un bel environnement.jpg"
  },
  "bauxite": {
    "path": "/images/editorial-licensed/bauxite.webp",
    "alt": "Infrastructure de transport de bauxite à Boffa, en Guinée (archive)",
    "credit": "Aboubacarkhoraa · CC BY-SA 4.0",
    "source": "https://commons.wikimedia.org/wiki/File%3ATransport_de_Bauxite_a_Boffa.jpg",
    "license": "CC BY-SA 4.0",
    "title": "File:Transport de Bauxite a Boffa.jpg"
  },
  "students": {
    "path": "/images/editorial-licensed/students.webp",
    "alt": "Élèves guinéens photographiés lors d’une ancienne distinction (archive)",
    "credit": "MoussaFernandez · CC BY-SA 4.0",
    "source": "https://commons.wikimedia.org/wiki/File%3ATrois_%C3%A9l%C3%A8ves_de_la_Guin%C3%A9e_remporte_trois_prix_%C3%A0_l'international_06.jpg",
    "license": "CC BY-SA 4.0",
    "title": "File:Trois élèves de la Guinée remporte trois prix à l'international 06.jpg"
  }
};

const photoKeyBySlug: Record<string, string> = {
  "electricite-guinee-financement-additionnel-paaeg-2-27-8-millions": "power",
  "election-feguifoot-quatre-listes-provisoires-27-octobre-2026": "football",
  "recensement-entreprises-guinee-forecariah-rge-1": "madina",
  "economie-guinee-banque-mondiale-croissance-diversification-2026": "market",
  "festibeg-2026-sport-sante-conakry-decembre": "sport",
  "cancer-guinee-vaccin-hpv-centres-cancerologie-2027": "hpv",
  "sante-3-0-guinee-prevention-depistage-proximite": "clinic",
  "pme-guineennes-afg-bank-proparco-60-millions-euros": "market",
  "eau-embouteillee-guinee-nouveaux-prix-plafonds-octobre-2026": "bottle",
  "competences-numeriques-programme-r-cun-2000-beneficiaires-guinee": "computer",
  "kankan-explosion-bouteille-gaz-atelier-bilan-provisoire": "gas",
  "education-numerique-guinee-partenariat-orange-unicef-50-ecoles": "computer",
  "conakry-navire-hopital-auspicious-ark-soins-gratuits": "ship",
  "rentree-scolaire-guinee-reprise-effective-inegale-2026": "school",
  "guinee-rentree-parlementaire-10e-legislature-octobre-2026": "palais",
  "guinee-banque-mondiale-cadre-partenariat-2027-2033": "market",
  "guinee-prix-eau-embouteillee-hausses-injustifiees-octobre-2026": "bottle",
  "guinee-68-ans-independance-jeunesse-2-octobre-2026": "independence",
  "guinee-reprise-coupe-transport-bois-controle-octobre-2026": "wood",
  "eliminatoires-can-2027-guinee-bat-kenya-guirassy": "football",
  "guinee-recrutement-6000-enseignants-candidatures-2026": "teacher-school",
  "fesmaf-2026-nzerekore-festival-masques-folklores-guinee-forestiere": "mask",
  "guinee-emprunt-obligataire-2500-milliards-gnf-2026": "bank",
  "eliminatoires-can-2027-guinee-defaite-afrique-du-sud-kenya": "football",
  "28-septembre-1958-vote-independance-guinee": "independence",
  "can-u18-handball-guinee-demi-finales-mondial-2027": "handball",
  "fonction-publique-calendrier-recrutements-2026-2027-guinee": "palais",
  "plastiques-usage-unique-echeance-20-septembre-guinee": "plastic",
  "eliminatoires-can-2027-25-joueurs-guinee-afrique-du-sud-kenya": "football",
  "guinee-lance-collecte-premier-recensement-general-entreprises-rge-1": "madina",
  "riz-local-le-programme-ewasme-etend-son-appui-aux-entreprises-dirigees-par-des-femmes": "grain",
  "securite-alimentaire-un-nouvel-entrepot-de-40-000-tonnes-inaugure-a-conakry": "rice-harvest",
  "handball-la-guinee-decroche-une-qualification-historique-pour-le-mondial-junior-masculin-2027": "handball",
  "guinee-119-etablissements-publics-evalues-apres-neuf-ans-d-interruption": "palais",
  "plastiques-a-usage-unique-en-guinee-ce-que-prevoit-le-nouveau-cadre-d-application": "plastic",
  "medias-awards-guinee-2026-la-cinquieme-edition-met-la-presse-ecrite-a-l-honneur": "media",
  "jeux-universitaires-africains-2026-une-delegation-guineenne-de-72-membres-au-caire": "university",
  "guinee-cote-d-ivoire-mamadi-doumbouya-recu-par-alassane-ouattara-a-abidjan": "mamadi",
  "guinee-la-rentree-scolaire-fixee-au-5-octobre-2026-la-reprise-administrative-au-21-septembre": "school",
  "guinee-trois-prets-de-la-bidc-pour-des-projets-routiers-energetiques-et-sanitaires": "road",
  "guinee-gambie-les-principaux-dossiers-evoques-lors-de-la-visite-d-adama-barrow-a-conakry": "adama",
  "stade-du-28-septembre-ce-que-permet-l-homologation-temporaire-accordee-par-la-caf": "stadium",
  "sante-des-jeunes-conakry-accueille-une-conference-africaine-sur-les-droits-sexuels-et-reproductifs": "clinic",
  "guinee-gambie-la-visite-d-adama-barrow-relance-la-cooperation-bilaterale": "adama",
  "statistique-et-demographie-26-laureats-guineens-admis-dans-trois-grandes-ecoles-africaines": "students",
  "can-2032-et-2036-la-guinee-officialise-sa-candidature-a-l-organisation": "stadium",
  "eau-potable-a-conakry-le-peag-mise-aussi-sur-la-restauration-des-ecosystemes": "water-nature",
  "agriconnect-guinee-riz-volaille-fonio-et-mangue-au-c-ur-d-un-pacte-agricole": "rice-field",
  "intelligence-artificielle-la-guinee-evalue-sa-preparation-avec-l-outil-aila-du-pnud": "computer",
  "cinema-center-de-conakry-un-complexe-culturel-annonce-sur-le-site-de-l-ancien-cinema-liberte": "cinema",
  "emploi-et-croissance-ce-que-prevoit-le-nouveau-partenariat-entre-la-guinee-et-la-banque-mondiale": "market",
  "djembe-conakry-prepare-un-festival-international-du-8-au-13-decembre-2026": "djembe",
  "patrimoine-la-guinee-engage-une-demarche-pour-recuperer-des-manuscrits-conserves-en-france": "museum",
  "projet-minier-guinee-investissement": "bauxite",
  "feguifoot-crise-assemblee": "stadium"
};

export function getLicensedEditorialPhoto(slug: string): LicensedEditorialPhoto | undefined {
  const key = photoKeyBySlug[slug];
  return key ? photos[key] : undefined;
}

export const restoredOriginalPhotoSlugs = new Set([
  "guinee-calendrier-restitution-samory-toure-bocar-biro-2026",
  "grand-bal-2026-guinee-invitee-honneur-youssou-ndour",
  "peche-maritime-en-guinee-reprise-des-activites-apres-deux-mois-de-repos-biologique"
]);
