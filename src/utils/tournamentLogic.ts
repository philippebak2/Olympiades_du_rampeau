import {
  Player,
  Poule,
  PoulePlayerScore,
  FinalMatch,
  TournamentSettings,
  TeamStanding,
  TournamentData,
} from '../types/tournament';

// Helper pour mélanger un tableau (Fisher-Yates)
export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Calcul du score d'un joueur dans une poule
export function calculatePlayerScore(playerScore: PoulePlayerScore): {
  roundScore: number;
  totalScore: number;
  throwsCount: number;
} {
  const roundScore = playerScore.tirs.reduce((acc, val) => acc + (val || 0), 0);
  const previous = playerScore.previousCumulativeScore || 0;
  const totalScore = previous + roundScore;
  return {
    roundScore,
    totalScore,
    throwsCount: playerScore.tirs.length,
  };
}

// Tri des joueurs d'une poule par score décroissant + départage
export function sortPoulePlayers(
  poule: Poule,
  allPlayersMap: Map<number, Player>
): Array<{
  scoreObj: PoulePlayerScore;
  player: Player | undefined;
  roundScore: number;
  totalScore: number;
  isQualified: boolean;
  rank: number;
  needsTieBreak: boolean;
}> {
  const list = poule.playerScores.map((scoreObj) => {
    const { roundScore, totalScore } = calculatePlayerScore(scoreObj);
    const player = allPlayersMap.get(scoreObj.playerId);
    return {
      scoreObj,
      player,
      roundScore,
      totalScore,
      tieBreak: scoreObj.tieBreakScore || 0,
      secondThrow: scoreObj.tirs[1] || 0,
      firstThrow: scoreObj.tirs[0] || 0,
    };
  });

  // Tri: TotalScore DESC -> TieBreak DESC -> SecondThrow DESC -> FirstThrow DESC -> playerId ASC
  list.sort((a, b) => {
    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
    if (b.tieBreak !== a.tieBreak) return b.tieBreak - a.tieBreak;
    if (b.secondThrow !== a.secondThrow) return b.secondThrow - a.secondThrow;
    if (b.firstThrow !== a.firstThrow) return b.firstThrow - a.firstThrow;
    return a.scoreObj.playerId - b.scoreObj.playerId;
  });

  const qualifyCount = poule.qualifyCount;

  return list.map((item, index) => {
    const rank = index + 1;
    const isQualified = rank <= qualifyCount;

    // Détection si égalité sur la frontière de qualification (ex: entre le 5e et 6e)
    let needsTieBreak = false;
    if (list.length >= qualifyCount && rank === qualifyCount) {
      const nextItem = list[qualifyCount]; // Le (qualifyCount + 1)-ème joueur
      if (nextItem && nextItem.totalScore === item.totalScore && (item.tieBreak === 0 && nextItem.tieBreak === 0)) {
        needsTieBreak = true;
      }
    } else if (list.length > qualifyCount && rank === qualifyCount + 1) {
      const prevItem = list[qualifyCount - 1]; // Le qualifyCount-ème
      if (prevItem && prevItem.totalScore === item.totalScore && (item.tieBreak === 0 && prevItem.tieBreak === 0)) {
        needsTieBreak = true;
      }
    }

    return {
      scoreObj: item.scoreObj,
      player: item.player,
      roundScore: item.roundScore,
      totalScore: item.totalScore,
      isQualified,
      rank,
      needsTieBreak,
    };
  });
}

// 1. Génération du Tour 1
export function generateTour1(
  players: Player[],
  settings: TournamentSettings
): Poule[] {
  if (players.length === 0) return [];
  const shuffled = shuffleArray(players);
  const poolCount = Math.max(1, settings.round1PoolCount);
  const poules: Poule[] = [];

  for (let i = 0; i < poolCount; i++) {
    poules.push({
      id: `tour1-poule-${i + 1}`,
      name: `Poule ${i + 1}`,
      roundNumber: 1,
      playerScores: [],
      qualifyCount: settings.round1QualifiersPerPool,
    });
  }

  // Distribution équitable
  shuffled.forEach((player, idx) => {
    const pouleIndex = idx % poolCount;
    poules[pouleIndex].playerScores.push({
      playerId: player.id,
      tirs: [],
      previousCumulativeScore: 0,
      tieBreakScore: 0,
    });
  });

  return poules;
}

// 2. Génération du Tour 2
// Les qualifiés du Tour 1 sont regroupés dans les poules du Tour 2
export function generateTour2(
  tour1Poules: Poule[],
  playersMap: Map<number, Player>,
  settings: TournamentSettings
): Poule[] {
  const targetPoolCount = Math.max(1, settings.round2PoolCount || Math.ceil(tour1Poules.length / 2));
  const tour2Poules: Poule[] = [];

  // Récupérer tous les qualifiés du Tour 1 dans l'ordre des poules
  const allT1QualifiersByPool: PoulePlayerScore[][] = tour1Poules.map((poule) => {
    const sorted = sortPoulePlayers(poule, playersMap);
    return sorted
      .filter((s) => s.isQualified)
      .map((s) => ({
        playerId: s.scoreObj.playerId,
        tirs: [],
        previousCumulativeScore: s.totalScore,
        tieBreakScore: 0,
      }));
  });

  // Si le nombre de poules T1 est exactement le double du T2 (cas standard, ex: 16 -> 8)
  if (tour1Poules.length === targetPoolCount * 2) {
    for (let i = 0; i < targetPoolCount; i++) {
      const q1 = allT1QualifiersByPool[i * 2] || [];
      const q2 = allT1QualifiersByPool[i * 2 + 1] || [];
      tour2Poules.push({
        id: `tour2-poule-${i + 1}`,
        name: `Poule ${i + 1} (Qualifiés Poules ${i * 2 + 1} & ${i * 2 + 2})`,
        roundNumber: 2,
        playerScores: [...q1, ...q2],
        qualifyCount: settings.round2QualifiersPerPool,
      });
    }
  } else {
    // Cas personnalisé : distribution équitable des qualifiés du Tour 1 dans les poules configurées
    const allQualifiersFlat = allT1QualifiersByPool.flat();
    for (let i = 0; i < targetPoolCount; i++) {
      tour2Poules.push({
        id: `tour2-poule-${i + 1}`,
        name: `Poule ${i + 1}`,
        roundNumber: 2,
        playerScores: [],
        qualifyCount: settings.round2QualifiersPerPool,
      });
    }

    allQualifiersFlat.forEach((qualifier, idx) => {
      const poolIndex = idx % targetPoolCount;
      tour2Poules[poolIndex].playerScores.push(qualifier);
    });
  }

  return tour2Poules;
}

// 3. Génération du Tour 3
export function generateTour3(
  tour2Poules: Poule[],
  playersMap: Map<number, Player>,
  settings: TournamentSettings
): Poule[] {
  const targetPoolCount = Math.max(1, settings.round3PoolCount || 4);
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const tour3Poules: Poule[] = [];

  // Récupérer tous les qualifiés du Tour 2 dans l'ordre des poules
  const allT2QualifiersByPool: PoulePlayerScore[][] = tour2Poules.map((poule) => {
    const sorted = sortPoulePlayers(poule, playersMap);
    return sorted
      .filter((s) => s.isQualified)
      .map((s) => ({
        playerId: s.scoreObj.playerId,
        tirs: [],
        previousCumulativeScore: s.totalScore,
        tieBreakScore: 0,
      }));
  });

  // Si Tour 2 a exactement le double de poules que Tour 3 (ex: 8 poules T2 -> 4 poules A, B, C, D)
  if (tour2Poules.length === targetPoolCount * 2) {
    for (let i = 0; i < targetPoolCount; i++) {
      const letter = alphabet[i] || `${i + 1}`;
      const q1 = allT2QualifiersByPool[i * 2] || [];
      const q2 = allT2QualifiersByPool[i * 2 + 1] || [];
      tour3Poules.push({
        id: `tour3-poule-${letter}`,
        name: `Poule ${letter}`,
        roundNumber: 3,
        playerScores: [...q1, ...q2],
        qualifyCount: settings.round3QualifiersPerPool,
      });
    }
  } else {
    // Cas personnalisé : distribution équitable des qualifiés du Tour 2
    const allQualifiersFlat = allT2QualifiersByPool.flat();
    for (let i = 0; i < targetPoolCount; i++) {
      const letter = alphabet[i] || `${i + 1}`;
      tour3Poules.push({
        id: `tour3-poule-${letter}`,
        name: `Poule ${letter}`,
        roundNumber: 3,
        playerScores: [],
        qualifyCount: settings.round3QualifiersPerPool,
      });
    }

    allQualifiersFlat.forEach((qualifier, idx) => {
      const poolIndex = idx % targetPoolCount;
      tour3Poules[poolIndex].playerScores.push(qualifier);
    });
  }

  return tour3Poules;
}

// 4. Génération des Phases Finales (Tableau des matchs à élimination directe)
export function generateFinals(
  tour3Poules: Poule[],
  playersMap: Map<number, Player>
): FinalMatch[] {
  // Récupérer les classements de chaque poule
  const pouleMap = new Map<string, ReturnType<typeof sortPoulePlayers>>();
  tour3Poules.forEach((p) => {
    // Extraction de la lettre ou clé de poule
    const key = p.name.replace('Poule', '').trim() || p.id.replace('tour3-poule-', '');
    pouleMap.set(key, sortPoulePlayers(p, playersMap));
  });

  const getPlayer = (pouleKey: string, rankIndex: number): number | null => {
    const list = pouleMap.get(pouleKey);
    if (!list || !list[rankIndex]) return null;
    return list[rankIndex].scoreObj.playerId;
  };

  const matches: FinalMatch[] = [];

  // Si on a les 4 poules A, B, C, D (croisements standards A/B et C/D)
  if (pouleMap.has('A') && pouleMap.has('B')) {
    const roundOf16Configs = [
      { p1Poule: 'A', p1Rank: 0, p2Poule: 'B', p2Rank: 3, label: '8ème #1 : 1er Poule A vs 4ème Poule B' },
      { p1Poule: 'A', p1Rank: 1, p2Poule: 'B', p2Rank: 2, label: '8ème #2 : 2ème Poule A vs 3ème Poule B' },
      { p1Poule: 'A', p1Rank: 2, p2Poule: 'B', p2Rank: 1, label: '8ème #3 : 3ème Poule A vs 2ème Poule B' },
      { p1Poule: 'A', p1Rank: 3, p2Poule: 'B', p2Rank: 0, label: '8ème #4 : 4ème Poule A vs 1er Poule B' },
      { p1Poule: 'C', p1Rank: 0, p2Poule: 'D', p2Rank: 3, label: '8ème #5 : 1er Poule C vs 4ème Poule D' },
      { p1Poule: 'C', p1Rank: 1, p2Poule: 'D', p2Rank: 2, label: '8ème #6 : 2ème Poule C vs 3ème Poule D' },
      { p1Poule: 'C', p1Rank: 2, p2Poule: 'D', p2Rank: 1, label: '8ème #7 : 3ème Poule C vs 2ème Poule D' },
      { p1Poule: 'C', p1Rank: 3, p2Poule: 'D', p2Rank: 0, label: '8ème #8 : 4ème Poule C vs 1er Poule D' },
    ];

    roundOf16Configs.forEach((cfg, idx) => {
      const p1Id = getPlayer(cfg.p1Poule, cfg.p1Rank);
      const p2Id = getPlayer(cfg.p2Poule, cfg.p2Rank);

      matches.push({
        id: `r16-${idx + 1}`,
        round: 'roundOf16',
        matchIndex: idx + 1,
        label: cfg.label,
        player1Id: p1Id,
        player2Id: p2Id,
        player1Placeholder: `${cfg.p1Rank + 1}e Poule ${cfg.p1Poule} (${cfg.p1Poule}${cfg.p1Rank + 1})`,
        player2Placeholder: `${cfg.p2Rank + 1}e Poule ${cfg.p2Poule} (${cfg.p2Poule}${cfg.p2Rank + 1})`,
        score1: null,
        score2: null,
        tieBreak1: null,
        tieBreak2: null,
        winnerId: null,
        loserId: null,
        isComplete: false,
      });
    });
  } else {
    // Cas alternatif : tous les qualifiés du Tour 3 classés globalement
    const allFinalists: number[] = [];
    tour3Poules.forEach((p) => {
      const sorted = sortPoulePlayers(p, playersMap);
      sorted.filter((s) => s.isQualified).forEach((s) => {
        allFinalists.push(s.scoreObj.playerId);
      });
    });

    const matchCount = 8;
    for (let i = 0; i < matchCount; i++) {
      const p1Id = allFinalists[i] || null;
      const p2Id = allFinalists[allFinalists.length - 1 - i] || null;
      matches.push({
        id: `r16-${i + 1}`,
        round: 'roundOf16',
        matchIndex: i + 1,
        label: `8ème #${i + 1}`,
        player1Id: p1Id,
        player2Id: p2Id,
        player1Placeholder: `Qualifié #${i + 1}`,
        player2Placeholder: `Qualifié #${allFinalists.length - i}`,
        score1: null,
        score2: null,
        tieBreak1: null,
        tieBreak2: null,
        winnerId: null,
        loserId: null,
        isComplete: false,
      });
    }
  }

  // Quarts de finale (4 matches)
  for (let i = 1; i <= 4; i++) {
    const m1Idx = (i - 1) * 2 + 1;
    const m2Idx = (i - 1) * 2 + 2;
    matches.push({
      id: `qf-${i}`,
      round: 'quarterFinals',
      matchIndex: i,
      label: `Quart #${i} : Vainqueur 8ème #${m1Idx} vs Vainqueur 8ème #${m2Idx}`,
      player1Id: null,
      player2Id: null,
      player1Placeholder: `Vainqueur 8ème #${m1Idx}`,
      player2Placeholder: `Vainqueur 8ème #${m2Idx}`,
      score1: null,
      score2: null,
      tieBreak1: null,
      tieBreak2: null,
      winnerId: null,
      loserId: null,
      isComplete: false,
    });
  }

  // Demi-finales (2 matches)
  for (let i = 1; i <= 2; i++) {
    const q1 = (i - 1) * 2 + 1;
    const q2 = (i - 1) * 2 + 2;
    matches.push({
      id: `sf-${i}`,
      round: 'semiFinals',
      matchIndex: i,
      label: `Demi-finale #${i} : Vainqueur QF #${q1} vs Vainqueur QF #${q2}`,
      player1Id: null,
      player2Id: null,
      player1Placeholder: `Vainqueur QF #${q1}`,
      player2Placeholder: `Vainqueur QF #${q2}`,
      score1: null,
      score2: null,
      tieBreak1: null,
      tieBreak2: null,
      winnerId: null,
      loserId: null,
      isComplete: false,
    });
  }

  // Petite finale (3ème place)
  matches.push({
    id: 'third-place',
    round: 'thirdPlace',
    matchIndex: 1,
    label: 'Petite Finale (Match pour la 3ème place)',
    player1Id: null,
    player2Id: null,
    player1Placeholder: 'Perdant Demi-finale #1',
    player2Placeholder: 'Perdant Demi-finale #2',
    score1: null,
    score2: null,
    tieBreak1: null,
    tieBreak2: null,
    winnerId: null,
    loserId: null,
    isComplete: false,
  });

  // Grande Finale
  matches.push({
    id: 'final',
    round: 'final',
    matchIndex: 1,
    label: 'Grande Finale (Attribution du Titre)',
    player1Id: null,
    player2Id: null,
    player1Placeholder: 'Vainqueur Demi-finale #1',
    player2Placeholder: 'Vainqueur Demi-finale #2',
    score1: null,
    score2: null,
    tieBreak1: null,
    tieBreak2: null,
    winnerId: null,
    loserId: null,
    isComplete: false,
  });

  return matches;
}

// Mise à jour de l'arbre des phases finales
export function propagateFinalMatches(matches: FinalMatch[]): FinalMatch[] {
  const updated = matches.map((m) => ({ ...m }));

  // Helper pour trouver un match
  const getMatch = (id: string) => updated.find((m) => m.id === id);

  // Mise à jour Quarts
  for (let i = 1; i <= 4; i++) {
    const qf = getMatch(`qf-${i}`);
    const r1 = getMatch(`r16-${(i - 1) * 2 + 1}`);
    const r2 = getMatch(`r16-${(i - 1) * 2 + 2}`);

    if (qf && r1 && r2) {
      qf.player1Id = r1.winnerId;
      qf.player2Id = r2.winnerId;
      // Si les joueurs changent et que le match était complété avec d'anciens joueurs invalides, reset
      if (!qf.player1Id || !qf.player2Id) {
        qf.isComplete = false;
        qf.winnerId = null;
        qf.loserId = null;
      }
    }
  }

  // Mise à jour Demis
  for (let i = 1; i <= 2; i++) {
    const sf = getMatch(`sf-${i}`);
    const q1 = getMatch(`qf-${(i - 1) * 2 + 1}`);
    const q2 = getMatch(`qf-${(i - 1) * 2 + 2}`);

    if (sf && q1 && q2) {
      sf.player1Id = q1.winnerId;
      sf.player2Id = q2.winnerId;
      if (!sf.player1Id || !sf.player2Id) {
        sf.isComplete = false;
        sf.winnerId = null;
        sf.loserId = null;
      }
    }
  }

  // Mise à jour Petite Finale et Finale
  const sf1 = getMatch('sf-1');
  const sf2 = getMatch('sf-2');
  const bronze = getMatch('third-place');
  const grandFinal = getMatch('final');

  if (bronze && sf1 && sf2) {
    bronze.player1Id = sf1.loserId;
    bronze.player2Id = sf2.loserId;
    if (!bronze.player1Id || !bronze.player2Id) {
      bronze.isComplete = false;
      bronze.winnerId = null;
      bronze.loserId = null;
    }
  }

  if (grandFinal && sf1 && sf2) {
    grandFinal.player1Id = sf1.winnerId;
    grandFinal.player2Id = sf2.winnerId;
    if (!grandFinal.player1Id || !grandFinal.player2Id) {
      grandFinal.isComplete = false;
      grandFinal.winnerId = null;
      grandFinal.loserId = null;
    }
  }

  return updated;
}

// Calcul des classements d'équipe avec barème officiel utilisateur:
// - Éliminé Tour 1: 1 point
// - Éliminé Tour 2: 2 points
// - Éliminé Tour 3: 3 points
// - Éliminé 8ème de finale: 4 points
// - Éliminé 1/4 de finale (5e à 8e): 5 points
// - 4ème place (perdant petite finale): 5 points
// - 3ème place (gagnant petite finale): 6 points
// - 2ème place (perdant finale): 7 points
// - 1er place (champion): 8 points
export function calculateTeamStandings(
  tournament: TournamentData,
  playersMap: Map<number, Player>
): TeamStanding[] {
  const playerPointsMap = new Map<
    number,
    { points: number; stageReached: string; isEliminated: boolean; totalPins: number }
  >();

  // Initialisation pour tous les joueurs
  tournament.players.forEach((p) => {
    playerPointsMap.set(p.id, {
      points: 0,
      stageReached: 'Inscrit',
      isEliminated: false,
      totalPins: 0,
    });
  });

  // Calcul des quilles totales renversées par joueur
  tournament.tour1Poules.forEach((poule) => {
    poule.playerScores.forEach((ps) => {
      const cur = playerPointsMap.get(ps.playerId);
      const pins = ps.tirs.reduce((a, b) => a + (b || 0), 0);
      if (cur) {
        cur.totalPins += pins;
      }
    });
  });

  tournament.tour2Poules.forEach((poule) => {
    poule.playerScores.forEach((ps) => {
      const cur = playerPointsMap.get(ps.playerId);
      const pins = ps.tirs.reduce((a, b) => a + (b || 0), 0);
      if (cur) {
        cur.totalPins += pins;
      }
    });
  });

  tournament.tour3Poules.forEach((poule) => {
    poule.playerScores.forEach((ps) => {
      const cur = playerPointsMap.get(ps.playerId);
      const pins = ps.tirs.reduce((a, b) => a + (b || 0), 0);
      if (cur) {
        cur.totalPins += pins;
      }
    });
  });

  tournament.finalMatches.forEach((m) => {
    if (m.player1Id && m.score1 !== null) {
      const cur = playerPointsMap.get(m.player1Id);
      if (cur) cur.totalPins += m.score1;
    }
    if (m.player2Id && m.score2 !== null) {
      const cur = playerPointsMap.get(m.player2Id);
      if (cur) cur.totalPins += m.score2;
    }
  });

  // 1. Tour 1
  if (tournament.tour1Poules.length > 0) {
    tournament.tour1Poules.forEach((poule) => {
      const sorted = sortPoulePlayers(poule, playersMap);
      sorted.forEach((item) => {
        const cur = playerPointsMap.get(item.scoreObj.playerId);
        if (!cur) return;
        if (!item.isQualified) {
          cur.points = 1;
          cur.stageReached = 'Éliminé Tour 1';
          cur.isEliminated = true;
        } else {
          cur.stageReached = 'Qualifié Tour 2';
          cur.points = 1; // Au minimum 1 point garanti
        }
      });
    });
  }

  // 2. Tour 2
  if (tournament.tour2Poules.length > 0) {
    tournament.tour2Poules.forEach((poule) => {
      const sorted = sortPoulePlayers(poule, playersMap);
      sorted.forEach((item) => {
        const cur = playerPointsMap.get(item.scoreObj.playerId);
        if (!cur) return;
        if (!item.isQualified) {
          cur.points = 2;
          cur.stageReached = 'Éliminé Tour 2';
          cur.isEliminated = true;
        } else {
          cur.stageReached = 'Qualifié Tour 3';
          cur.points = 2;
        }
      });
    });
  }

  // 3. Tour 3
  if (tournament.tour3Poules.length > 0) {
    tournament.tour3Poules.forEach((poule) => {
      const sorted = sortPoulePlayers(poule, playersMap);
      sorted.forEach((item) => {
        const cur = playerPointsMap.get(item.scoreObj.playerId);
        if (!cur) return;
        if (!item.isQualified) {
          cur.points = 3;
          cur.stageReached = 'Éliminé Tour 3';
          cur.isEliminated = true;
        } else {
          cur.stageReached = 'Qualifié 8èmes';
          cur.points = 3;
        }
      });
    });
  }

  // 4. Phases finales
  if (tournament.finalMatches.length > 0) {
    // 8èmes
    tournament.finalMatches
      .filter((m) => m.round === 'roundOf16' && m.isComplete)
      .forEach((m) => {
        if (m.loserId) {
          const cur = playerPointsMap.get(m.loserId);
          if (cur) {
            cur.points = 4;
            cur.stageReached = 'Éliminé 8èmes de finale';
            cur.isEliminated = true;
          }
        }
        if (m.winnerId) {
          const cur = playerPointsMap.get(m.winnerId);
          if (cur) {
            cur.points = 4;
            cur.stageReached = 'Qualifié 1/4 de finale';
          }
        }
      });

    // Quarts
    tournament.finalMatches
      .filter((m) => m.round === 'quarterFinals' && m.isComplete)
      .forEach((m) => {
        if (m.loserId) {
          const cur = playerPointsMap.get(m.loserId);
          if (cur) {
            cur.points = 5;
            cur.stageReached = 'Éliminé Quarts (5e-8e place)';
            cur.isEliminated = true;
          }
        }
        if (m.winnerId) {
          const cur = playerPointsMap.get(m.winnerId);
          if (cur) {
            cur.points = 5;
            cur.stageReached = 'Qualifié Demi-finales';
          }
        }
      });

    // Demi-finales
    tournament.finalMatches
      .filter((m) => m.round === 'semiFinals' && m.isComplete)
      .forEach((m) => {
        if (m.loserId) {
          const cur = playerPointsMap.get(m.loserId);
          if (cur) {
            cur.stageReached = 'Qualifié Petite Finale';
          }
        }
        if (m.winnerId) {
          const cur = playerPointsMap.get(m.winnerId);
          if (cur) {
            cur.stageReached = 'Qualifié Grande Finale';
          }
        }
      });

    // Petite finale (3ème place)
    const bronze = tournament.finalMatches.find((m) => m.round === 'thirdPlace' && m.isComplete);
    if (bronze) {
      if (bronze.loserId) {
        const cur = playerPointsMap.get(bronze.loserId);
        if (cur) {
          cur.points = 5;
          cur.stageReached = '4ème Place';
          cur.isEliminated = true;
        }
      }
      if (bronze.winnerId) {
        const cur = playerPointsMap.get(bronze.winnerId);
        if (cur) {
          cur.points = 6;
          cur.stageReached = '3ème Place (Médaille de Bronze)';
          cur.isEliminated = true;
        }
      }
    }

    // Grande finale
    const grandFinal = tournament.finalMatches.find((m) => m.round === 'final' && m.isComplete);
    if (grandFinal) {
      if (grandFinal.loserId) {
        const cur = playerPointsMap.get(grandFinal.loserId);
        if (cur) {
          cur.points = 7;
          cur.stageReached = 'Vice-Champion (2ème Place - Argent)';
          cur.isEliminated = true;
        }
      }
      if (grandFinal.winnerId) {
        const cur = playerPointsMap.get(grandFinal.winnerId);
        if (cur) {
          cur.points = 8;
          cur.stageReached = 'Vainqueur du Tournoi (1ère Place - Or)';
          cur.isEliminated = false;
        }
      }
    }
  }

  // Aggrégation par équipe
  const teamsMap = new Map<string, TeamStanding>();

  tournament.players.forEach((p) => {
    const teamName = p.team?.trim() || 'Individuel / Sans club';
    if (!teamsMap.has(teamName)) {
      teamsMap.set(teamName, {
        teamName,
        totalPoints: 0,
        playerCount: 0,
        activePlayerCount: 0,
        eliminatedPlayerCount: 0,
        totalPins: 0,
        players: [],
      });
    }

    const teamEntry = teamsMap.get(teamName)!;
    const playerStats = playerPointsMap.get(p.id)!;

    teamEntry.playerCount++;
    teamEntry.totalPoints += playerStats.points;
    teamEntry.totalPins += playerStats.totalPins;

    if (playerStats.isEliminated) {
      teamEntry.eliminatedPlayerCount++;
    } else {
      teamEntry.activePlayerCount++;
    }

    teamEntry.players.push({
      playerId: p.id,
      playerName: p.name,
      points: playerStats.points,
      stageReached: playerStats.stageReached,
      isEliminated: playerStats.isEliminated,
      totalPinsKnocked: playerStats.totalPins,
    });
  });

  const standings = Array.from(teamsMap.values());
  // Tri des équipes par points décroissants, puis par total de quilles, puis par nombre de joueurs
  standings.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.totalPins !== a.totalPins) return b.totalPins - a.totalPins;
    return b.playerCount - a.playerCount;
  });

  return standings;
}
