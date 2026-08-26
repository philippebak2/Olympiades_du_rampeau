import { Player, TournamentSettings, TournamentData } from '../types/tournament';

export const SAMPLE_TEAMS = [
  'Quilleurs de Strasbourg',
  'BC Colmar',
  'AS Quilles Mulhouse',
  'Quilles Club Vosgien',
  'La Quille d’Or Saverne',
  'Étoile Bowling Haguenau',
  'Les Frappeurs de Sélestat',
  'Bowling Club Belfort',
  'Quilles Traditionnelles Metz',
  'Union Quilleurs Nancy',
  'Le Strike de Saint-Dié',
  'Club des Neuf Quilles Épinal',
];

export const FRENCH_FIRST_NAMES = [
  'Jean', 'Michel', 'Pierre', 'Philippe', 'Alain', 'Laurent', 'Nicolas', 'Stéphane',
  'Christophe', 'Frédéric', 'David', 'Sébastien', 'Julien', 'Thomas', 'Alexandre', 'Guillaume',
  'Maxime', 'Romain', 'Antoine', 'Lucas', 'Marc', 'Pascal', 'Thierry', 'Bruno',
  'Dominique', 'Patrick', 'Bernard', 'Gérard', 'Didier', 'Éric', 'Olivier', 'Hervé',
  'Marie', 'Nathalie', 'Isabelle', 'Sylvie', 'Catherine', 'Valérie', 'Céline', 'Sandrine',
  'Sophie', 'Audrey', 'Aurélie', 'Émilie', 'Camille', 'Julie', 'Marion', 'Laura',
  'Vincent', 'Christian', 'François', 'Daniel', 'Gilles', 'Yves', 'Francis', 'Guy',
  'Fabrice', 'Franck', 'Yannick', 'Cédric', 'Anthony', 'Benjamin', 'Florian', 'Arnaud',
  'Benoît', 'Mathieu', 'Quentin', 'Adrien', 'Hugo', 'Clément', 'Paul', 'Louis',
  'Arthur', 'Jules', 'Gabriel', 'Théo', 'Léo', 'Nathan', 'Victor', 'Simon',
  'Henri', 'René', 'Jean-Luc', 'Jean-Paul', 'Jean-Marc', 'Jean-Pierre', 'Jean-Claude', 'Serge',
  'Claude', 'Jacques', 'André', 'Raymond', 'Maurice', 'Robert', 'Georges', 'Roger',
  'Élise', 'Chloé', 'Léa', 'Manon', 'Lucie', 'Sarah', 'Clara', 'Inès',
  'Jeanne', 'Mathilde', 'Charlotte', 'Alice', 'Juliette', 'Louise', 'Emma', 'Zoé',
  'Baptiste', 'Rémi', 'Damien', 'Xavier', 'Ludovic', 'Mickaël', 'Bastien', 'Valentin',
  'Maxence', 'Corentin', 'Tristan', 'Robin', 'Alexis', 'Thibault', 'Kevin', 'Jordan',
  'Jonathan', 'Sylvain', 'Bertrand', 'Emmanuel', 'Samuel', 'Florent', 'Loïc', 'Gautier',
  'Gaël', 'Lionel', 'Grégory', 'Benoist', 'Hugues', 'Brice', 'Renaud', 'Tanguy',
  'Patrice', 'Joël', 'Serge', 'Régis', 'Norbert', 'Hubert', 'Gilbert', 'Martial',
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
    const firstName = FRENCH_FIRST_NAMES[(i - 1) % FRENCH_FIRST_NAMES.length];
    const lastName = FRENCH_LAST_NAMES[Math.floor((i * 7) % FRENCH_LAST_NAMES.length)];
    const team = SAMPLE_TEAMS[(i - 1) % SAMPLE_TEAMS.length];
    players.push({
      id: i,
      name: `${firstName} ${lastName}`,
      team,
    });
  }
  return players;
}

export const DEFAULT_SETTINGS: TournamentSettings = {
  round1PoolCount: 16,
  round1QualifiersPerPool: 5,
  round1ThrowsCount: 2,
  
  round2PoolCount: 8,
  round2QualifiersPerPool: 5,
  round2ThrowsCount: 1,
  
  round3PoolCount: 4,
  round3QualifiersPerPool: 4,
  round3ThrowsCount: 1,

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
