import React from 'react';
import { Poule, Player, TournamentSettings } from '../types/tournament';
import { sortPoulePlayers } from '../utils/tournamentLogic';
import { exportSinglePouleToCSV, exportAllPoulesOfRoundToCSV } from '../utils/csvExport';
import { PinScoreInput } from './PinScoreInput';
import {
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Trophy,
  FileSpreadsheet,
  Download,
} from 'lucide-react';

interface TabTour3Props {
  poules: Poule[];
  playersMap: Map<number, Player>;
  settings: TournamentSettings;
  onUpdateScore: (pouleId: string, playerId: number, throwIndex: number, pins: number) => void;
  onUpdateTieBreak: (pouleId: string, playerId: number, tieBreakScore: number) => void;
  onUpdateSettings?: (newSettings: Partial<TournamentSettings>) => void;
  onAutoSimulateTour3: () => void;
  onAdvanceToFinals: () => void;
}

export const TabTour3: React.FC<TabTour3Props> = ({
  poules,
  playersMap,
  settings,
  onUpdateScore,
  onUpdateTieBreak,
  onUpdateSettings,
  onAutoSimulateTour3,
  onAdvanceToFinals,
}) => {
  if (poules.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center space-y-4">
        <Layers className="w-12 h-12 text-neutral-300 mx-auto" />
        <h3 className="text-base font-bold text-neutral-800">
          Les poules du Tour 3 ne sont pas encore prêtes
        </h3>
        <p className="text-xs text-neutral-500 max-w-md mx-auto">
          Terminez le Tour 2 et cliquez sur « Passer au Tour 3 » pour former les {settings.round3PoolCount} poules du Tour 3.
        </p>
      </div>
    );
  }

  // Calcul du taux de complétion
  let totalThrowsNeeded = 0;
  let totalThrowsCompleted = 0;
  let hasPendingTieBreaks = false;
  const pendingTieBreakMessages: string[] = [];

  poules.forEach((poule) => {
    let pouleThrowsDone = true;
    poule.playerScores.forEach((ps) => {
      totalThrowsNeeded += 1;
      if (ps.tirs[0] !== undefined && ps.tirs[0] !== null) {
        totalThrowsCompleted++;
      } else {
        pouleThrowsDone = false;
      }
    });

    const sorted = sortPoulePlayers(poule, playersMap);
    const unresolvedCritical = sorted.filter((s) => s.needsTieBreak);
    if (pouleThrowsDone && unresolvedCritical.length > 0) {
      hasPendingTieBreaks = true;
      pendingTieBreakMessages.push(
        `${poule.name} (${unresolvedCritical.length} joueurs à égalité pour les Finales)`
      );
    }
  });

  const completionPercent =
    totalThrowsNeeded > 0 ? Math.round((totalThrowsCompleted / totalThrowsNeeded) * 100) : 0;

  const totalQualifsFinales = poules.reduce((acc, p) => acc + p.qualifyCount, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Control Banner */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-800 text-xs font-semibold border border-gray-200">
              <span>Tour 3 : {poules.length} Poules</span>
              <span>•</span>
              <span>Cumul T1 + T2 + T3</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
              Dernier Tour Qualificatif - Tour 3 ({poules.length} Poules)
            </h2>
            <p className="text-xs text-gray-600 max-w-3xl">
              Chaque quilleur tire 1 fois sur 9 quilles. Le total général cumulé (T1 + T2 + T3) détermine le classement. Les{' '}
              <strong className="text-emerald-700 font-bold">{settings.round3QualifiersPerPool} premiers de chaque poule</strong> (soit {totalQualifsFinales} quilleurs) accèdent aux phases finales en élimination directe. Les éliminés marquent{' '}
              <strong>3 points</strong> pour leur club.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              id="btn-export-csv-tour3-all"
              onClick={() => exportAllPoulesOfRoundToCSV(poules, 3, playersMap, 'Olympiades du rampeau')}
              className="px-3 py-2 rounded-lg bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Exporter toutes les poules du Tour 3 dans un fichier CSV (avec joueurs et scores)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Exporter Toutes les Poules (CSV)</span>
            </button>

            <button
              type="button"
              id="btn-simulate-tour3"
              onClick={onAutoSimulateTour3}
              className="px-3.5 py-2 rounded-lg bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-gray-500" />
              <span>Simuler scores Tour 3</span>
            </button>

            <button
              type="button"
              id="btn-advance-to-finals"
              onClick={onAdvanceToFinals}
              className={`px-4 py-2 rounded-lg font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                completionPercent >= 90
                  ? 'bg-gray-900 hover:bg-gray-800 text-white shadow-2xs active:scale-95'
                  : 'bg-gray-100 text-gray-400 border border-gray-200'
              }`}
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Générer le Tableau des Phases Finales ({totalQualifsFinales} Joueurs)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar & qualifiers count settings */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Progression des tirs Tour 3 :</span>
            <span className="font-bold text-gray-900">
              {totalThrowsCompleted} / {totalThrowsNeeded} tirs ({completionPercent}%)
            </span>
          </div>

          {onUpdateSettings && (
            <div className="flex flex-wrap items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
              <span className="text-[11px] font-bold text-gray-700">Paramètres pour les Finales :</span>
              <div className="flex items-center gap-1.5">
                <span className="text-gray-500">Qualifiés par poule (Top X) :</span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={settings.round3QualifiersPerPool}
                  onChange={(e) =>
                    onUpdateSettings({
                      round3QualifiersPerPool: Math.max(1, parseInt(e.target.value) || 1),
                    })
                  }
                  className="w-12 bg-white border border-emerald-300 text-emerald-700 rounded px-1.5 py-0.5 text-center font-bold text-xs"
                />
                <span className="text-emerald-700 font-semibold">
                  = {poules.length * settings.round3QualifiersPerPool} quilleurs au tableau
                </span>
              </div>
            </div>
          )}

          <div className="w-full md:w-40 bg-gray-100 h-2 rounded-full overflow-hidden border border-gray-200">
            <div
              className={`h-full transition-all duration-300 ${
                completionPercent === 100 ? 'bg-emerald-600' : 'bg-gray-900'
              }`}
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tie Break Alert Banner */}
      {hasPendingTieBreaks && (
        <div className="bg-amber-50 border border-amber-300 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start sm:items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <div className="text-sm font-bold text-amber-900">
                Égalité détectée sur les places qualificatives pour les Finales !
              </div>
              <div className="text-xs text-amber-800 mt-0.5">
                {pendingTieBreakMessages.length > 0
                  ? `Poules concernées : ${pendingTieBreakMessages.join(' • ')}`
                  : `Saisissez un tir de barrage dans la colonne Départage pour classer et qualifier les quilleurs.`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4 Poules (A, B, C, D) Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {poules.map((poule) => {
          const sortedPlayers = sortPoulePlayers(poule, playersMap);
          const letter = poule.id.replace('tour3-poule-', '');

          return (
            <div
              key={poule.id}
              id={`card-poule-t3-${poule.id}`}
              className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden"
            >
              {/* Header */}
              <div className="bg-gray-50/70 px-4 py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-md bg-gray-900 text-white font-black text-xs flex items-center justify-center shadow-2xs">
                    {letter}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{poule.name}</h3>
                    <div className="text-[10px] text-gray-500">Top {poule.qualifyCount} qualifiés pour les Finales</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {poule.qualifyCount} Qualifiés Finales
                  </span>
                  <button
                    type="button"
                    id={`btn-export-poule-t3-${poule.id}`}
                    onClick={() => exportSinglePouleToCSV(poule, playersMap, 'Olympiades du rampeau')}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-semibold transition-all shadow-2xs cursor-pointer hover:border-emerald-300"
                    title="Exporter cette poule avec noms et scores au format CSV"
                  >
                    <Download className="w-3 h-3 text-emerald-600" />
                    <span>CSV</span>
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-gray-50/50 text-gray-600 font-bold uppercase text-[10px] tracking-wider border-b border-gray-200">
                    <tr>
                      <th className="py-2.5 px-3 w-14 text-center">Rang</th>
                      <th className="py-2.5 px-3">Quilleur (N° & Nom)</th>
                      <th className="py-2.5 px-2 text-center w-18">T1+T2</th>
                      <th className="py-2.5 px-2 text-center w-16">Tir T3</th>
                      <th className="py-2.5 px-3 text-center w-20 font-extrabold text-gray-900">
                        Total T1+2+3
                      </th>
                      <th className="py-2.5 px-2 text-center w-20">Départage</th>
                      <th className="py-2.5 px-3 text-right w-24">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sortedPlayers.map((item) => {
                      const player = item.player;
                      const tirs = item.scoreObj.tirs;
                      const prev = item.scoreObj.previousCumulativeScore || 0;
                      const isQual = item.isQualified;
                      const seedLabel = `${letter}${item.rank}`;

                      return (
                        <tr
                          key={item.scoreObj.playerId}
                          className={`transition-colors ${
                            isQual
                              ? 'bg-emerald-50/30 hover:bg-emerald-50/60'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          {/* Seed & Rank */}
                          <td className="py-2 px-3 text-center font-bold">
                            <span
                              className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-[11px] font-bold ${
                                isQual
                                  ? 'bg-emerald-600 text-white shadow-2xs'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {isQual ? seedLabel : item.rank}
                            </span>
                          </td>

                          {/* Nom & N° */}
                          <td className="py-2 px-3">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded text-[11px] border border-gray-200">
                                #{player?.id || item.scoreObj.playerId}
                              </span>
                              <div>
                                <div className="font-semibold text-gray-900 leading-tight">
                                  {player?.name || `Joueur #${item.scoreObj.playerId}`}
                                </div>
                                <div className="text-[10px] text-gray-500">
                                  {player?.team || 'Sans club'}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Cumul T1 + T2 */}
                          <td className="py-2 px-2 text-center">
                            <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-800 font-bold rounded text-xs">
                              {prev}
                            </span>
                          </td>

                          {/* Tir Tour 3 */}
                          <td className="py-2 px-2 text-center">
                            <PinScoreInput
                              value={tirs[0]}
                              onChange={(val) =>
                                onUpdateScore(poule.id, item.scoreObj.playerId, 0, val)
                              }
                              size="sm"
                            />
                          </td>

                          {/* Total T1 + T2 + T3 */}
                          <td className="py-2 px-3 text-center">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-md text-xs font-bold ${
                                isQual
                                  ? 'bg-emerald-700 text-white'
                                  : 'bg-gray-100 text-gray-800 border border-gray-200'
                              }`}
                            >
                              {item.totalScore}
                            </span>
                          </td>

                          {/* Départage */}
                          <td className="py-2 px-2 text-center">
                            {item.isTied || item.isCriticalTie || (item.scoreObj.tieBreakScore && item.scoreObj.tieBreakScore > 0) ? (
                              <div className="flex items-center justify-center gap-1">
                                <PinScoreInput
                                  value={item.scoreObj.tieBreakScore > 0 ? item.scoreObj.tieBreakScore : null}
                                  onChange={(val) =>
                                    onUpdateTieBreak(poule.id, item.scoreObj.playerId, val)
                                  }
                                  size="sm"
                                  placeholder="-"
                                />
                                {item.needsTieBreak && (
                                  <span
                                    className="inline-block w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-ping"
                                    title="Tir de barrage requis pour départager la qualification"
                                  />
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-300">-</span>
                            )}
                          </td>

                          {/* Statut */}
                          <td className="py-2 px-3 text-right">
                            {isQual ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Qualifié 8èmes ({seedLabel})</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 text-gray-500">
                                Éliminé (3 pts)
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
