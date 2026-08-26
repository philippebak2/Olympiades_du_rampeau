import React from 'react';
import { TournamentData, TournamentTab } from '../types/tournament';
import {
  Users,
  Layers,
  Trophy,
  CheckCircle2,
  ChevronRight,
  Shield,
  Medal,
  ArrowRight,
} from 'lucide-react';

interface TournamentPipelineVisualizerProps {
  tournament: TournamentData;
  currentTab: TournamentTab;
  onSelectTab: (tab: TournamentTab) => void;
}

export const TournamentPipelineVisualizer: React.FC<TournamentPipelineVisualizerProps> = ({
  tournament,
  currentTab,
  onSelectTab,
}) => {
  const totalInscrits = tournament.players.length;
  const t1PoulesCount = tournament.tour1Poules.length || tournament.settings.round1PoolCount;
  const t1QualifsPerPoule = tournament.settings.round1QualifiersPerPool;
  const t1TotalQualifs = t1PoulesCount * t1QualifsPerPoule;

  const t2PoulesCount = tournament.tour2Poules.length || tournament.settings.round2PoolCount;
  const t2QualifsPerPoule = tournament.settings.round2QualifiersPerPool;
  const t2TotalQualifs = tournament.tour2Poules.length > 0
    ? tournament.tour2Poules.reduce((acc, p) => acc + p.qualifyCount, 0)
    : t2PoulesCount * t2QualifsPerPoule;

  const t3PoulesCount = tournament.tour3Poules.length || tournament.settings.round3PoolCount;
  const t3QualifsPerPoule = tournament.settings.round3QualifiersPerPool;
  const t3TotalQualifs = tournament.tour3Poules.length > 0
    ? tournament.tour3Poules.reduce((acc, p) => acc + p.qualifyCount, 0)
    : t3PoulesCount * t3QualifsPerPoule;

  // Counts of remaining active players in finals
  const r16Matches = tournament.finalMatches.filter((m) => m.round === 'roundOf16');
  const qfMatches = tournament.finalMatches.filter((m) => m.round === 'quarterFinals');
  const sfMatches = tournament.finalMatches.filter((m) => m.round === 'semiFinals');
  const finalMatch = tournament.finalMatches.find((m) => m.round === 'final');

  const isTour1Done = tournament.tour1Poules.length > 0 && tournament.tour1Poules.every((p) =>
    p.playerScores.every((ps) => ps.tirs.length >= 2)
  );
  const isTour2Done = tournament.tour2Poules.length > 0 && tournament.tour2Poules.every((p) =>
    p.playerScores.every((ps) => ps.tirs.length >= 1)
  );
  const isTour3Done = tournament.tour3Poules.length > 0 && tournament.tour3Poules.every((p) =>
    p.playerScores.every((ps) => ps.tirs.length >= 1)
  );
  const isFinalsDone = finalMatch?.isComplete || false;

  const stages = [
    {
      id: 'participants' as TournamentTab,
      label: 'Inscriptions',
      sublabel: 'Tirage au sort',
      remainingText: `${totalInscrits} joueurs`,
      detailText: `${t1PoulesCount} poules`,
      isActive: currentTab === 'participants',
      isCompleted: tournament.tour1Poules.length > 0,
      badge: 'Départ',
    },
    {
      id: 'tour1' as TournamentTab,
      label: 'Tour 1 (Poules)',
      sublabel: '2 tirs sur 9 quilles',
      remainingText: `${t1TotalQualifs} qualifiés`,
      detailText: `Top ${t1QualifsPerPoule} / poule`,
      isActive: currentTab === 'tour1',
      isCompleted: tournament.isTour2Started || isTour1Done,
      badge: `${t1PoulesCount} poules`,
    },
    {
      id: 'tour2' as TournamentTab,
      label: 'Tour 2 (Cumul)',
      sublabel: 'Cumul T1 + T2',
      remainingText: `${t2TotalQualifs} qualifiés`,
      detailText: `Top ${t2QualifsPerPoule} / poule`,
      isActive: currentTab === 'tour2',
      isCompleted: tournament.isTour3Started || isTour2Done,
      badge: `${t2PoulesCount} poules`,
    },
    {
      id: 'tour3' as TournamentTab,
      label: 'Tour 3 (Qualif Finales)',
      sublabel: 'Cumul T1 + T2 + T3',
      remainingText: `${t3TotalQualifs} qualifiés`,
      detailText: `Top ${t3QualifsPerPoule} / poule`,
      isActive: currentTab === 'tour3',
      isCompleted: tournament.isFinalsStarted || isTour3Done,
      badge: `${t3PoulesCount} poules`,
    },
    {
      id: 'phasesFinales' as TournamentTab,
      label: 'Phases Finales',
      sublabel: '1/8 → 1/4 → 1/2 → Finale',
      remainingText: isFinalsDone ? 'Podium couronné' : '16 → 8 → 4 → 2',
      detailText: 'Élimination directe',
      isActive: currentTab === 'phasesFinales',
      isCompleted: isFinalsDone,
      badge: 'KO direct',
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-xs mb-6">
      {/* Title and description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 mb-3 border-b border-gray-100">
        <div>
          <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-gray-600" />
            <span>Parcours de Qualification & Joueurs Restants à Chaque Étape</span>
          </h3>
          <p className="text-[11px] text-gray-500 mt-0.5">
            Suivi en direct de la réduction des effectifs et progression vers le titre officiel
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 font-semibold border border-gray-200 text-[11px]">
            <span>Statut :</span>
            <span className="text-gray-900">
              {isFinalsDone
                ? '🏆 Tournoi Terminé'
                : tournament.isFinalsStarted
                ? '🥊 Phases Finales en cours'
                : tournament.isTour3Started
                ? '🎳 Tour 3 en cours'
                : tournament.isTour2Started
                ? '🎳 Tour 2 en cours'
                : tournament.isTour1Started
                ? '🎳 Tour 1 en cours'
                : '📝 Inscriptions'}
            </span>
          </span>
        </div>
      </div>

      {/* Stepper Pipeline */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
        {stages.map((stage, idx) => {
          const isCurrent = stage.isActive;
          const isCompleted = stage.isCompleted;

          return (
            <button
              key={stage.id}
              type="button"
              id={`pipeline-step-${stage.id}`}
              onClick={() => onSelectTab(stage.id)}
              className={`p-3 rounded-lg border text-left transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer ${
                isCurrent
                  ? 'bg-gray-900 text-white border-gray-900 shadow-2xs ring-2 ring-gray-900/10'
                  : isCompleted
                  ? 'bg-gray-50 hover:bg-gray-100/80 border-gray-200 text-gray-800'
                  : 'bg-white hover:bg-gray-50/60 border-gray-200 text-gray-600'
              }`}
            >
              {/* Top Step Row */}
              <div className="flex items-center justify-between text-[10px] mb-1">
                <span
                  className={`font-bold px-1.5 py-0.5 rounded ${
                    isCurrent
                      ? 'bg-gray-800 text-gray-200'
                      : isCompleted
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  Étape {idx + 1}
                </span>

                <span
                  className={`font-semibold ${
                    isCurrent
                      ? 'text-gray-300'
                      : isCompleted
                      ? 'text-emerald-700'
                      : 'text-gray-400'
                  }`}
                >
                  {stage.badge}
                </span>
              </div>

              {/* Title & Subtitle */}
              <div className="my-1">
                <div
                  className={`text-xs font-bold leading-tight ${
                    isCurrent ? 'text-white' : 'text-gray-900'
                  }`}
                >
                  {stage.label}
                </div>
                <div
                  className={`text-[10px] truncate ${
                    isCurrent ? 'text-gray-300' : 'text-gray-500'
                  }`}
                >
                  {stage.sublabel}
                </div>
              </div>

              {/* Bottom Metric */}
              <div
                className={`pt-2 mt-1 border-t text-[11px] flex items-center justify-between ${
                  isCurrent
                    ? 'border-gray-800 text-white'
                    : 'border-gray-100 text-gray-700'
                }`}
              >
                <span className="font-bold">{stage.remainingText}</span>
                <span
                  className={`text-[10px] ${
                    isCurrent ? 'text-gray-400' : 'text-gray-400'
                  }`}
                >
                  {stage.detailText}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
