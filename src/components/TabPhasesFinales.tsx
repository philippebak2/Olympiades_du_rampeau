import React from 'react';
import { FinalMatch, Player } from '../types/tournament';
import { PinScoreInput } from './PinScoreInput';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Medal,
  Award,
  Sparkles,
  Swords,
  CheckCircle2,
  AlertTriangle,
  Crown,
} from 'lucide-react';

interface TabPhasesFinalesProps {
  matches: FinalMatch[];
  playersMap: Map<number, Player>;
  onUpdateMatchScore: (
    matchId: string,
    score1: number | null,
    score2: number | null,
    tieBreak1?: number | null,
    tieBreak2?: number | null
  ) => void;
  onAutoSimulateFinals: () => void;
}

export const TabPhasesFinales: React.FC<TabPhasesFinalesProps> = ({
  matches,
  playersMap,
  onUpdateMatchScore,
  onAutoSimulateFinals,
}) => {
  if (matches.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center space-y-4">
        <Trophy className="w-12 h-12 text-neutral-300 mx-auto" />
        <h3 className="text-base font-bold text-neutral-800">
          Les phases finales n'ont pas encore été lancées
        </h3>
        <p className="text-xs text-neutral-500 max-w-md mx-auto">
          Terminez le Tour 3 (Poules A, B, C, D) et cliquez sur « Générer le Tableau des Phases Finales » pour démarrer les 8èmes de finale à élimination directe.
        </p>
      </div>
    );
  }

  // Filter matches by round
  const roundOf16 = matches.filter((m) => m.round === 'roundOf16');
  const quarterFinals = matches.filter((m) => m.round === 'quarterFinals');
  const semiFinals = matches.filter((m) => m.round === 'semiFinals');
  const thirdPlaceMatch = matches.find((m) => m.round === 'thirdPlace');
  const grandFinalMatch = matches.find((m) => m.round === 'final');

  const championPlayer = grandFinalMatch?.winnerId
    ? playersMap.get(grandFinalMatch.winnerId)
    : null;
  const viceChampionPlayer = grandFinalMatch?.loserId
    ? playersMap.get(grandFinalMatch.loserId)
    : null;
  const thirdPlayer = thirdPlaceMatch?.winnerId
    ? playersMap.get(thirdPlaceMatch.winnerId)
    : null;
  const fourthPlayer = thirdPlaceMatch?.loserId
    ? playersMap.get(thirdPlaceMatch.loserId)
    : null;

  // Trigger confetti if champion is crowned
  React.useEffect(() => {
    if (championPlayer) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [championPlayer?.id]);

  // Render a match card
  const renderMatchCard = (match: FinalMatch, isHighlighted = false) => {
    const p1 = match.player1Id ? playersMap.get(match.player1Id) : null;
    const p2 = match.player2Id ? playersMap.get(match.player2Id) : null;

    const isBaseScoreTie =
      match.score1 !== null &&
      match.score2 !== null &&
      match.score1 === match.score2;

    const showTieBreakInputs =
      isBaseScoreTie ||
      (match.tieBreak1 !== null && match.tieBreak1 !== undefined && match.tieBreak1 > 0) ||
      (match.tieBreak2 !== null && match.tieBreak2 !== undefined && match.tieBreak2 > 0);

    const isTie = isBaseScoreTie && match.tieBreak1 === match.tieBreak2;

    const isP1Winner = match.winnerId === match.player1Id && match.player1Id !== null;
    const isP2Winner = match.winnerId === match.player2Id && match.player2Id !== null;

    return (
      <div
        key={match.id}
        id={`match-card-${match.id}`}
        className={`bg-white rounded-xl border transition-all overflow-hidden ${
          isHighlighted
            ? 'border-gray-900 shadow-sm ring-1 ring-gray-900/10'
            : match.isComplete
            ? 'border-gray-200 shadow-2xs'
            : 'border-gray-200 shadow-2xs'
        }`}
      >
        {/* Match Header */}
        <div className="bg-gray-50/70 px-3 py-1.5 border-b border-gray-200 flex items-center justify-between text-[11px]">
          <span className="font-bold text-gray-800">{match.label}</span>
          {match.isComplete ? (
            <span className="text-emerald-700 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              <span>Terminé</span>
            </span>
          ) : match.player1Id && match.player2Id ? (
            <span className="text-gray-700 font-semibold flex items-center gap-1">
              <Swords className="w-3 h-3 text-gray-500" />
              <span>En cours</span>
            </span>
          ) : (
            <span className="text-gray-400">En attente</span>
          )}
        </div>

        {/* Competitors and scores */}
        <div className="p-3 space-y-2">
          {/* Player 1 Row */}
          <div
            className={`flex items-center justify-between p-2 rounded-lg transition-all ${
              isP1Winner
                ? 'bg-emerald-50/70 border border-emerald-200 text-emerald-950 font-bold'
                : match.isComplete
                ? 'opacity-60 bg-gray-50'
                : 'bg-gray-50/80 hover:bg-gray-100/60'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0 pr-2">
              {p1 ? (
                <>
                  <span className="font-mono text-xs font-bold text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 shrink-0">
                    #{p1.id}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-gray-900 truncate">
                      {p1.name}
                    </div>
                    <div className="text-[10px] text-gray-500 truncate">
                      {p1.team || 'Individuel'}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-xs italic text-gray-400">
                  {match.player1Placeholder}
                </div>
              )}
            </div>

            {/* Score & Tie Break for P1 */}
            <div className="flex items-center gap-1 shrink-0">
              {showTieBreakInputs && (
                <div className="flex items-center gap-0.5" title="Tir de barrage">
                  <span className="text-[9px] text-amber-700 font-bold">Barrage:</span>
                  <PinScoreInput
                    value={match.tieBreak1}
                    onChange={(val) =>
                      onUpdateMatchScore(
                        match.id,
                        match.score1,
                        match.score2,
                        val,
                        match.tieBreak2 || 0
                      )
                    }
                    size="sm"
                    disabled={!match.player1Id || !match.player2Id}
                  />
                </div>
              )}
              <PinScoreInput
                value={match.score1}
                onChange={(val) =>
                  onUpdateMatchScore(
                    match.id,
                    val,
                    match.score2,
                    match.tieBreak1,
                    match.tieBreak2
                  )
                }
                size="sm"
                disabled={!match.player1Id || !match.player2Id}
              />
            </div>
          </div>

          {/* VS Divider */}
          <div className="flex items-center justify-center -my-1">
            <span className="text-[10px] font-bold text-gray-400 bg-white px-2 py-0.5 rounded-full border border-gray-200">
              VS
            </span>
          </div>

          {/* Player 2 Row */}
          <div
            className={`flex items-center justify-between p-2 rounded-lg transition-all ${
              isP2Winner
                ? 'bg-emerald-50/70 border border-emerald-200 text-emerald-950 font-bold'
                : match.isComplete
                ? 'opacity-60 bg-gray-50'
                : 'bg-gray-50/80 hover:bg-gray-100/60'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0 pr-2">
              {p2 ? (
                <>
                  <span className="font-mono text-xs font-bold text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200 shrink-0">
                    #{p2.id}
                  </span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-gray-900 truncate">
                      {p2.name}
                    </div>
                    <div className="text-[10px] text-gray-500 truncate">
                      {p2.team || 'Individuel'}
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-xs italic text-gray-400">
                  {match.player2Placeholder}
                </div>
              )}
            </div>

            {/* Score & Tie Break for P2 */}
            <div className="flex items-center gap-1 shrink-0">
              {showTieBreakInputs && (
                <div className="flex items-center gap-0.5" title="Tir de barrage">
                  <span className="text-[9px] text-amber-700 font-bold">Barrage:</span>
                  <PinScoreInput
                    value={match.tieBreak2}
                    onChange={(val) =>
                      onUpdateMatchScore(
                        match.id,
                        match.score1,
                        match.score2,
                        match.tieBreak1 || 0,
                        val
                      )
                    }
                    size="sm"
                    disabled={!match.player1Id || !match.player2Id}
                  />
                </div>
              )}
              <PinScoreInput
                value={match.score2}
                onChange={(val) =>
                  onUpdateMatchScore(
                    match.id,
                    match.score1,
                    val,
                    match.tieBreak1,
                    match.tieBreak2
                  )
                }
                size="sm"
                disabled={!match.player1Id || !match.player2Id}
              />
            </div>
          </div>
        </div>

        {/* Tie alert inside card */}
        {isTie && match.score1 !== null && (
          <div className="bg-amber-50 px-3 py-1.5 text-[10px] text-amber-800 font-bold flex items-center justify-between border-t border-amber-200">
            <span className="flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Égalité ! Saisir le tir de barrage</span>
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-800 text-xs font-semibold border border-gray-200">
              <Trophy className="w-3.5 h-3.5 text-gray-600" />
              <span>Tableau Final à Élimination Directe</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
              Phases Finales (8èmes, Quarts, Demis, Petite & Grande Finale)
            </h2>
            <p className="text-xs text-gray-600 max-w-3xl">
              Croisements officiels : A1/B4, A2/B3, A3/B2, A4/B1, C1/D4, C2/D3, C3/D2, C4/D1. Les quilleurs s'affrontent sur 9 quilles. En cas d'égalité, un tir de barrage départage les tireurs.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              id="btn-simulate-finals"
              onClick={onAutoSimulateFinals}
              className="px-4 py-2 rounded-lg bg-gray-900 hover:bg-gray-800 text-white font-semibold text-xs transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-gray-300" />
              <span>Simuler toutes les Phases Finales</span>
            </button>
          </div>
        </div>
      </div>

      {/* Champion & Podium Highlight if tournament is finished */}
      {championPlayer && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm relative overflow-hidden text-center">
          <div className="relative z-10 max-w-xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-900 text-white text-xs font-bold shadow-2xs">
              <Crown className="w-4 h-4 text-amber-400" />
              <span>CHAMPION DU TOURNOI 2026</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">
              #{championPlayer.id} {championPlayer.name}
            </h3>
            <div className="text-sm font-semibold text-gray-600">
              Club : {championPlayer.team || 'Individuel'} (+8 points au classement club)
            </div>

            {/* Mini Podium Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-gray-100 text-xs">
              {viceChampionPlayer && (
                <div className="bg-gray-50/70 p-3 rounded-lg border border-gray-200">
                  <div className="font-bold text-gray-600 flex items-center justify-center gap-1">
                    <Medal className="w-3.5 h-3.5 text-gray-400" />
                    <span>2ème Place (Argent)</span>
                  </div>
                  <div className="font-bold text-gray-900 mt-1">
                    #{viceChampionPlayer.id} {viceChampionPlayer.name}
                  </div>
                  <div className="text-[10px] text-gray-500">{viceChampionPlayer.team}</div>
                </div>
              )}

              <div className="bg-amber-50/60 p-3 rounded-lg border border-amber-300 shadow-2xs">
                <div className="font-bold text-amber-900 flex items-center justify-center gap-1">
                  <Medal className="w-4 h-4 text-amber-600" />
                  <span>1ère Place (Or)</span>
                </div>
                <div className="font-bold text-amber-950 mt-1">
                  #{championPlayer.id} {championPlayer.name}
                </div>
                <div className="text-[10px] text-amber-800">{championPlayer.team}</div>
              </div>

              {thirdPlayer && (
                <div className="bg-gray-50/70 p-3 rounded-lg border border-gray-200">
                  <div className="font-bold text-amber-800 flex items-center justify-center gap-1">
                    <Medal className="w-3.5 h-3.5 text-amber-700" />
                    <span>3ème Place (Bronze)</span>
                  </div>
                  <div className="font-bold text-gray-900 mt-1">
                    #{thirdPlayer.id} {thirdPlayer.name}
                  </div>
                  <div className="text-[10px] text-gray-500">{thirdPlayer.team}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bracket Tree Columns Layout */}
      <div className="space-y-8">
        {/* 1. 8èmes de finale (8 matches) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-gray-900 text-white text-xs flex items-center justify-center font-bold">
                8e
              </span>
              <span>1. Huitièmes de Finale (8 Confrontations Directes - 16 Joueurs)</span>
            </h3>
            <span className="text-xs text-gray-500">
              4 points par éliminé pour le classement équipe
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {roundOf16.map((m) => renderMatchCard(m))}
          </div>
        </div>

        {/* 2. Quarts de finale (4 matches) */}
        <div className="space-y-3 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-gray-900 text-white text-xs flex items-center justify-center font-bold">
                1/4
              </span>
              <span>2. Quarts de Finale (4 Confrontations - 8 Joueurs)</span>
            </h3>
            <span className="text-xs text-gray-500">
              5 points pour les éliminés (5e à 8e place)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {quarterFinals.map((m) => renderMatchCard(m))}
          </div>
        </div>

        {/* 3. Demi-finales (2 matches) */}
        <div className="space-y-3 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-gray-900 text-white text-xs flex items-center justify-center font-bold">
                1/2
              </span>
              <span>3. Demi-Finales (2 Confrontations - 4 Joueurs)</span>
            </h3>
            <span className="text-xs text-gray-500">
              Les gagnants vont en Grande Finale, les perdants en Petite Finale
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            {semiFinals.map((m) => renderMatchCard(m))}
          </div>
        </div>

        {/* 4. Petite Finale & Grande Finale */}
        <div className="space-y-3 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <Trophy className="w-4 h-4 text-gray-700" />
              <span>4. Finales & Attribution du Podium</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Petite Finale */}
            {thirdPlaceMatch && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-gray-800">
                  <span>🥉 Petite Finale (Match 3ème / 4ème Place)</span>
                  <span className="text-gray-500 text-[11px]">3e: 6 pts / 4e: 5 pts</span>
                </div>
                {renderMatchCard(thirdPlaceMatch, true)}
              </div>
            )}

            {/* Grande Finale */}
            {grandFinalMatch && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-gray-900">
                  <span>🏆 GRANDE FINALE (Match pour le Titre)</span>
                  <span className="text-gray-600 text-[11px]">1er: 8 pts / 2e: 7 pts</span>
                </div>
                {renderMatchCard(grandFinalMatch, true)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
