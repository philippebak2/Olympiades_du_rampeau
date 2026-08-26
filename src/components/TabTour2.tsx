import React, { useState } from 'react';
import { Poule, Player, TournamentSettings } from '../types/tournament';
import { sortPoulePlayers } from '../utils/tournamentLogic';
import { exportSinglePouleToCSV, exportAllPoulesOfRoundToCSV } from '../utils/csvExport';
import { exportPoulesToPdf, exportJudgesScoreSheetPDF } from '../utils/pdfExport';
import { PinScoreInput } from './PinScoreInput';
import {
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Award,
  FileSpreadsheet,
  FileText,
  ClipboardList,
  Download,
} from 'lucide-react';

interface TabTour2Props {
  poules: Poule[];
  playersMap: Map<number, Player>;
  settings: TournamentSettings;
  onUpdateScore: (pouleId: string, playerId: number, throwIndex: number, pins: number) => void;
  onUpdateTieBreak: (pouleId: string, playerId: number, tieBreakScore: number) => void;
  onUpdateSettings?: (newSettings: Partial<TournamentSettings>) => void;
  onAutoSimulateTour2: () => void;
  onAdvanceToTour3: () => void;
}

export const TabTour2: React.FC<TabTour2Props> = ({
  poules,
  playersMap,
  settings,
  onUpdateScore,
  onUpdateTieBreak,
  onUpdateSettings,
  onAutoSimulateTour2,
  onAdvanceToTour3,
}) => {
  const [selectedPouleId, setSelectedPouleId] = useState<string>(poules[0]?.id || '');
  const [showAllPoules, setShowAllPoules] = useState(true);

  if (poules.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-neutral-200 p-12 text-center space-y-4">
        <Layers className="w-12 h-12 text-neutral-300 mx-auto" />
        <h3 className="text-base font-bold text-neutral-800">
          Les poules du Tour 2 ne sont pas encore prêtes
        </h3>
        <p className="text-xs text-neutral-500 max-w-md mx-auto">
          Terminez la saisie des scores du Tour 1 et cliquez sur « Passer au Tour 2 » pour combiner les qualifiés selon votre configuration ({settings.round2PoolCount} poules).
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
        `${poule.name} (${unresolvedCritical.length} joueurs à égalité pour la qualification T3)`
      );
    }
  });

  const completionPercent =
    totalThrowsNeeded > 0 ? Math.round((totalThrowsCompleted / totalThrowsNeeded) * 100) : 0;

  const totalQualifsT2 = poules.reduce((acc, p) => acc + p.qualifyCount, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Control Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-800 text-xs font-semibold border border-gray-200">
              <span>Tour 2 : 1 Tir sur 9 Quilles</span>
              <span>•</span>
              <span>Cumul Tour 1 + Tour 2</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
              Qualifications - Tour 2 ({poules.length} Poules)
            </h2>
            <p className="text-xs text-gray-600 max-w-3xl">
              Le score du tir s'ajoute au cumul du Tour 1. On retient les{' '}
              <strong className="text-emerald-700 font-bold">{settings.round2QualifiersPerPool} premiers de chaque poule</strong> ({totalQualifsT2} qualifiés pour le Tour 3). Les éliminés rapportent{' '}
              <strong>2 points</strong> à leur club.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              id="btn-export-judges-tour2-all"
              onClick={() =>
                exportJudgesScoreSheetPDF({
                  title: 'Olympiades du Rampeau',
                  roundNumber: 2,
                  poules,
                  playersMap,
                  settings,
                })
              }
              className="px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-950 border border-blue-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Générer les feuilles de marque officielles pour les juges de piste du Tour 2 (1 page A4 par poule)"
            >
              <ClipboardList className="w-4 h-4 text-blue-600" />
              <span>Feuilles Juges de Piste (PDF)</span>
            </button>

            <button
              type="button"
              id="btn-export-pdf-tour2-all"
              onClick={() =>
                exportPoulesToPdf({
                  title: 'Olympiades du Rampeau',
                  roundNumber: 2,
                  poules,
                  playersMap,
                  settings,
                })
              }
              className="px-3 py-2 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Exporter et imprimer toutes les poules du Tour 2 en PDF (avec surlignage vert/rouge des qualifiés/éliminés)"
            >
              <FileText className="w-3.5 h-3.5 text-rose-600" />
              <span>Résultats Poules (PDF)</span>
            </button>

            <button
              type="button"
              id="btn-export-csv-tour2-all"
              onClick={() => exportAllPoulesOfRoundToCSV(poules, 2, playersMap, 'Olympiades du rampeau')}
              className="px-3 py-2 rounded-lg bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Exporter toutes les poules du Tour 2 dans un fichier CSV (avec joueurs et scores)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Exporter (CSV)</span>
            </button>

            <button
              type="button"
              id="btn-simulate-tour2"
              onClick={onAutoSimulateTour2}
              className="px-3.5 py-2 rounded-lg bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-gray-500" />
              <span>Simuler scores Tour 2</span>
            </button>

            <button
              type="button"
              id="btn-advance-to-tour3"
              onClick={onAdvanceToTour3}
              className={`px-4 py-2 rounded-lg font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer ${
                completionPercent >= 90
                  ? 'bg-gray-900 hover:bg-gray-800 text-white shadow-2xs active:scale-95'
                  : 'bg-gray-100 text-gray-400 border border-gray-200'
              }`}
            >
              <span>Passer au Tour 3 ({totalQualifsT2} Qualifiés)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar & Tour 3 configuration */}
        <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Progression des tirs Tour 2 :</span>
            <span className="font-bold text-gray-900">
              {totalThrowsCompleted} / {totalThrowsNeeded} tirs ({completionPercent}%)
            </span>
          </div>

          {onUpdateSettings && (
            <div className="flex flex-wrap items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
              <span className="text-[11px] font-bold text-gray-700">Paramètres pour le Tour 3 :</span>
              <div className="flex items-center gap-1.5">
                <span className="text-gray-500">Poules :</span>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={settings.round3PoolCount}
                  onChange={(e) =>
                    onUpdateSettings({
                      round3PoolCount: Math.max(1, parseInt(e.target.value) || 1),
                    })
                  }
                  className="w-12 bg-white border border-gray-300 rounded px-1.5 py-0.5 text-center font-bold text-gray-900 text-xs"
                />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-gray-500">Qualifiés/poule :</span>
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

      {/* Tie Break Alert Banner if needed */}
      {hasPendingTieBreaks && (
        <div className="bg-amber-50 border border-amber-300 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-start sm:items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <div className="text-sm font-bold text-amber-900">
                Égalité détectée sur la ligne de qualification Tour 2 !
              </div>
              <div className="text-xs text-amber-800 mt-0.5">
                {pendingTieBreakMessages.length > 0
                  ? `Poules concernées : ${pendingTieBreakMessages.join(' • ')}`
                  : `Renseignez le tir de barrage dans la colonne Départage pour chaque joueur concerné.`}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Poule Selector */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
          <button
            type="button"
            onClick={() => setShowAllPoules(true)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              showAllPoules
                ? 'bg-gray-900 text-white shadow-2xs'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Toutes les Poules ({poules.length})
          </button>

          <div className="h-4 w-px bg-gray-200 mx-1" />

          {poules.map((p, idx) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setSelectedPouleId(p.id);
                setShowAllPoules(false);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                !showAllPoules && selectedPouleId === p.id
                  ? 'bg-gray-900 text-white shadow-2xs'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              Poule {idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Poules */}
      <div
        className={`grid gap-6 ${
          showAllPoules ? 'grid-cols-1 xl:grid-cols-2' : 'grid-cols-1'
        }`}
      >
        {(showAllPoules ? poules : poules.filter((p) => p.id === selectedPouleId)).map(
          (poule, pIdx) => {
            const sortedPlayers = sortPoulePlayers(poule, playersMap);
            const qualifyLimit = poule.qualifyCount;

            return (
              <div
                key={poule.id}
                id={`card-poule-t2-${poule.id}`}
                className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden"
              >
                {/* Header */}
                <div className="bg-gray-50/70 px-4 py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-gray-900 text-white font-bold text-xs flex items-center justify-center shadow-2xs">
                      P{pIdx + 1}
                    </span>
                    <h3 className="text-sm font-bold text-gray-900">{poule.name}</h3>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                      Top {qualifyLimit} qualifiés T3
                    </span>
                    <button
                      type="button"
                      id={`btn-export-judge-poule-t2-${poule.id}`}
                      onClick={() =>
                        exportJudgesScoreSheetPDF({
                          title: 'Olympiades du Rampeau',
                          roundNumber: 2,
                          poules,
                          playersMap,
                          settings,
                          singlePouleId: poule.id,
                        })
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-[11px] font-bold transition-all shadow-2xs cursor-pointer hover:border-blue-300"
                      title="Imprimer la feuille de marque pour le juge de piste de cette poule (Tour 2)"
                    >
                      <ClipboardList className="w-3 h-3 text-blue-600" />
                      <span>Feuille Juge</span>
                    </button>
                    <button
                      type="button"
                      id={`btn-export-pdf-poule-t2-${poule.id}`}
                      onClick={() =>
                        exportPoulesToPdf({
                          title: 'Olympiades du Rampeau',
                          roundNumber: 2,
                          poules,
                          playersMap,
                          settings,
                          singlePouleId: poule.id,
                        })
                      }
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-white hover:bg-rose-50 text-rose-800 border border-rose-200 text-[11px] font-semibold transition-all shadow-2xs cursor-pointer hover:border-rose-300"
                      title="Exporter et imprimer cette poule en PDF (avec surlignage vert/rouge)"
                    >
                      <FileText className="w-3 h-3 text-rose-600" />
                      <span>PDF</span>
                    </button>
                    <button
                      type="button"
                      id={`btn-export-poule-t2-${poule.id}`}
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
                        <th className="py-2.5 px-3 w-12 text-center">Rang</th>
                        <th className="py-2.5 px-3">Quilleur (N° & Nom)</th>
                        <th className="py-2.5 px-2 text-center w-18">Report T1</th>
                        <th className="py-2.5 px-2 text-center w-16">Tir T2</th>
                        <th className="py-2.5 px-3 text-center w-20 font-extrabold text-gray-900">
                          Total T1+T2
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

                        return (
                          <tr
                            key={item.scoreObj.playerId}
                            className={`transition-colors ${
                              isQual
                                ? 'bg-emerald-50/30 hover:bg-emerald-50/60'
                                : 'hover:bg-gray-50'
                            }`}
                          >
                            <td className="py-2 px-3 text-center font-bold">
                              <span
                                className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-[11px] font-bold ${
                                  isQual
                                    ? 'bg-emerald-600 text-white shadow-2xs'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {item.rank}
                              </span>
                            </td>

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

                            {/* Report Tour 1 */}
                            <td className="py-2 px-2 text-center">
                              <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-800 font-bold rounded text-xs">
                                {prev}
                              </span>
                            </td>

                            {/* Tir Tour 2 */}
                            <td className="py-2 px-2 text-center">
                              <PinScoreInput
                                value={tirs[0]}
                                onChange={(val) =>
                                  onUpdateScore(poule.id, item.scoreObj.playerId, 0, val)
                                }
                                size="sm"
                              />
                            </td>

                            {/* Total Cumulé */}
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
                                  <span>Qualifié T3</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 text-gray-500">
                                  Éliminé (2 pts)
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
          }
        )}
      </div>
    </div>
  );
};
