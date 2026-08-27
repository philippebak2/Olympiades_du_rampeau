import { Player, TournamentSettings, TournamentData } from '../types/tournament';

export const SAMPLE_TEAMS = [
  'Quilleurs de Strasbourg',
  'Équipe de Colmar',
  'AS Quilles Mulhouse',
  'Quilleurs Vosgiens',
  'La Quille d’Or Saverne',
  'Étoile Bowling Haguenau',
  'Les Frappeurs de Sélestat',
  'Équipe de Belfort',
  'Quilles Traditionnelles Metz',
  'Union Quilleurs Nancy',
  'Le Strike de Saint-Dié',
  'Équipe des Neuf Quilles Épinal',
];

export const FEMALE_FIRST_NAMES = [
  'Marie', 'Nathalie', 'Isabelle', 'Sylvie', 'Catherine', 'Valérie', 'Céline', 'Sandrine',
  'Sophie', 'Audrey', 'Aurélie', 'Émilie', 'Camille', 'Julie', 'Marion', 'Laura',
  'Élise', 'Chloé', 'Léa', 'Manon', 'Lucie', 'Sarah', 'Clara', 'Inès',
  'Jeanne', 'Mathilde', 'Charlotte', 'Alice', 'Juliette', 'Louise', 'Emma', 'Zoé',
  'Amélie', 'Morgane', 'Lucile', 'Carla', 'Océane', 'Margaux', 'Pauline', 'Justine',
];

export const MALE_FIRST_NAMES = [
  'Jean', 'Michel', 'Pierre', 'Philippe', 'Alain', 'Laurent', 'Nicolas', 'Stéphane',
  'Christophe', 'Frédéric', 'David', 'Sébastien', 'Julien', 'Thomas', 'Alexandre', 'Guillaume',
  'Maxime', 'Romain', 'Antoine', 'Lucas', 'Marc', 'Pascal', 'Thierry', 'Bruno',
  'Dominique', 'Patrick', 'Bernard', 'Gérard', 'Didier', 'Éric', 'Olivier', 'Hervé',
  'Vincent', 'Christian', 'François', 'Daniel', 'Gilles', 'Yves', 'Francis', 'Guy',
  'Fabrice', 'Franck', 'Yannick', 'Cédric', 'Anthony', 'Benjamin', 'Florian', 'Arnaud',
  'Benoît', 'Mathieu', 'Quentin', 'Adrien', 'Hugo', 'Clément', 'Paul', 'Louis',
  'Arthur', 'Jules', 'Gabriel', 'Théo', 'Léo', 'Nathan', 'Victor', 'Simon',
  'Baptiste', 'Rémi', 'Damien', 'Xavier', 'Ludovic', 'Mickaël', 'Bastien', 'Valentin',
  'Maxence', 'Corentin', 'Tristan', 'Robin', 'Alexis', 'Thibault', 'Kevin', 'Jordan',
  'Jonathan', 'Sylvain', 'Bertrand', 'Emmanuel', 'Samuel', 'Florent', 'Loïc', 'Gautier',
];

export const FRENCH_LAST_NAMES = [
  'Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand',
  'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'David',
  'Bertrand', 'Roux', 'Vincent', 'Fournier', 'Morel', 'Girard', 'Andre', 'Lefevre',
  'Mercier', 'Dupont', 'Lambert', 'Bonnet', 'Francois', 'Martinez', 'Legrand', 'Garnier',
  'Faure', 'Rousseau', 'Blanc', 'Guerin', 'Muller', 'Henry', 'Roussel', 'Nicolas',
  'Perrin', 'Morin', 'Mathieu', 'Clement', 'Gauthier', 'Dumont', 'Lopez', 'Fontaine',
  'Chevalier', 'Robin', 'Masson', 'Sanchez', 'Gerard', 'Nguyen', 'Boyer', 'Denis',
  'Lemaire', 'Duval', 'Joly', 'Gautier', 'Meyer', 'Weber', 'Klein', 'Schmidt',
  'Wagner', 'Becker', 'Hoffmann', 'Schmitt', 'Schneider', 'Fischer', 'Frey', 'Keller',
  'Zimmermann', 'Braun', 'Walter', 'Kaufmann', 'Huber', 'Baumann', 'Kuhn', 'Haas',
];

export function generateSamplePlayers(count: number = 160): Player[] {
  const players: Player[] = [];
  for (let i = 1; i <= count; i++) {
    // Environ 35% de femmes, 65% d'hommes
    const isFemale = (i % 3 === 0) || (i % 8 === 0);
    const gender: 'H' | 'F' = isFemale ? 'F' : 'H';
    
    // Environ 15% de moins de 18 ans (< 18 ans)
    const isUnder18 = (i % 7 === 0) || (i % 13 === 0);

    const firstName = isFemale
      ? FEMALE_FIRST_NAMES[(i - 1) % FEMALE_FIRST_NAMES.length]
      : MALE_FIRST_NAMES[(i - 1) % MALE_FIRST_NAMES.length];

    const lastName = FRENCH_LAST_NAMES[Math.floor((i * 7) % FRENCH_LAST_NAMES.length)];
    const team = SAMPLE_TEAMS[(i - 1) % SAMPLE_TEAMS.length];
    
    players.push({
      id: i,
      name: `${firstName} ${lastName}`,
      team,
      gender,
      isUnder18,
    });
  }
  return players;
}

export const DEFAULT_SETTINGS: TournamentSettings = {
  round1PoolCount: 16,
  round1QualifiersPerPool: 5,
  round1ThrowsCount: 2,
  round1LanesCount: 4,
  
  round2PoolCount: 8,
  round2QualifiersPerPool: 5,
  round2ThrowsCount: 1,
  round2LanesCount: 4,
  
  round3PoolCount: 4,
  round3QualifiersPerPool: 4,
  round3ThrowsCount: 1,
  round3LanesCount: 4,

  pinsCount: 9,
};

export const INITIAL_TOURNAMENT_DATA: TournamentData = {
  title: 'Olympiades du rampeau',
  date: new Date().toISOString().split('T')[0],
  location: 'Boulodrome / Quillier du Rampeau',
  players: [],
  settings: DEFAULT_SETTINGS,
  tour1Poules: [],
  tour2Poules: [],
  tour3Poules: [],
  finalMatches: [],
  isTour1Started: false,
  isTour2Started: false,
  isTour3Started: false,
  isFinalsStarted: false,
};
