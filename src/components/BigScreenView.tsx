import React, { useState, useEffect } from 'react';
import { TournamentData, Player } from '../types/tournament';
import { calculateTeamStandings, sortPoulePlayers } from '../utils/tournamentLogic';
import {
  Maximize2,
  Minimize2,
  Trophy,
  Shield,
  Layers,
  Sparkles,
  Crown,
  Medal,
} from 'lucide-react';

interface BigScreenViewProps {
  tournament: TournamentData;
  playersMap: Map<number, Player>;
  onClose: () => void;
}

export const BigScreenView: React.FC<BigScreenViewProps> = ({
  tournament,
  playersMap,
  onClose,
}) => {
  const standings = calculateTeamStandings(tournament, playersMap);
  const [activeView, setActiveView] = useState<'currentRound' | 'teams' | 'finals'>('currentRound');

  // Determine current active phase
  let activePhaseTitle = 'Tour 1 (Qualifications)';
  if (tournament.finalMatches.length > 0) {
    activePhaseTitle = 'Phases Finales (Élimination Directe)';
  } else if (tournament.tour3Poules.length > 0) {
    activePhaseTitle = 'Tour 3 (Poules A, B, C, D)';
  } else if (tournament.tour2Poules.length > 0) {
    activePhaseTitle = 'Tour 2 (Qualifications)';
  }

  // Auto switch views every 15 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveView((prev) => {
        if (prev === 'currentRound') return 'teams';
        if (prev === 'teams') return tournament.finalMatches.length > 0 ? 'finals' : 'currentRound';
        return 'currentRound';
      });
    }, 15000);
    return () => clearInterval(timer);
  }, [tournament.finalMatches.length]);

  return (
    <div className="fixed inset-0 z-50 bg-gray-950 text-white overflow-y-auto p-6 md:p-8 flex flex-col justify-between select-none">
      {/* Top Bar */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white text-gray-950 flex items-center justify-center font-bold text-lg shadow-sm">
            9Q
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {tournament.title}
            </h1>
            <div className="text-xs text-gray-400 font-medium flex items-center gap-2">
              <span>{tournament.players.length} Quilleurs</span>
              <span>•</span>
              <span className="bg-gray-800 text-gray-300 px-2 py-0.5 rounded-md border border-gray-700">
                {activePhaseTitle}
              </span>
            </div>
          </div>
        </div>

        {/* View Switchers & Close */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveView('currentRound')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeView === 'currentRound' ? 'bg-white text-gray-950' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
            }`}
          >
            Poules Actuelles
          </button>
          <button
            type="button"
            onClick={() => setActiveView('teams')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeView === 'teams' ? 'bg-white text-gray-950' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
            }`}
          >
            Classement Clubs
          </button>
          {tournament.finalMatches.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveView('finals')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeView === 'finals' ? 'bg-white text-gray-950' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
              }`}
            >
              Phases Finales
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg bg-gray-800 hover:bg-rose-600 text-gray-300 hover:text-white transition-all ml-2 cursor-pointer"
            title="Quitter le plein écran"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="my-6 flex-1">
        {activeView === 'teams' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-gray-400" />
              <span>Classement Général par Équipes</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {standings.slice(0, 9).map((team, idx) => (
                <div
                  key={team.teamName}
                  className={`p-4 rounded-xl border ${
                    idx === 0
                      ? 'bg-gray-900 border-gray-600 shadow-sm'
                      : idx === 1
                      ? 'bg-gray-900/80 border-gray-800'
                      : idx === 2
                      ? 'bg-gray-900/60 border-gray-800'
                      : 'bg-gray-900/40 border-gray-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs ${
                        idx === 0
                          ? 'bg-white text-gray-950'
                          : idx === 1
                          ? 'bg-gray-300 text-gray-950'
                          : idx === 2
                          ? 'bg-gray-500 text-white'
                          : 'bg-gray-800 text-gray-300'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="text-xl font-bold text-white">
                      {team.totalPoints} <span className="text-xs font-normal text-gray-400">pts</span>
                    </span>
                  </div>

                  <div className="mt-2">
                    <div className="font-semibold text-base text-white truncate">{team.teamName}</div>
                    <div className="text-xs text-gray-400 flex items-center gap-2 mt-0.5">
                      <span>{team.playerCount} quilleurs</span>
                      <span>•</span>
                      <span>{team.totalPins} quilles</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeView === 'currentRound' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-gray-400" />
              <span>Direct des Poules</span>
            </h2>

            {/* If Tour 3 */}
            {tournament.tour3Poules.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tournament.tour3Poules.map((poule) => {
                  const sorted = sortPoulePlayers(poule, playersMap);
                  return (
                    <div
                      key={poule.id}
                      className="bg-gray-900 rounded-xl border border-gray-800 p-4 overflow-hidden"
                    >
                      <div className="font-bold text-sm text-white pb-2.5 border-b border-gray-800 flex justify-between">
                        <span>{poule.name}</span>
                        <span className="text-emerald-400 text-xs font-semibold">Top 4 Qualifiés</span>
                      </div>
                      <div className="divide-y divide-gray-800/80 text-xs">
                        {sorted.slice(0, 6).map((item, idx) => (
                          <div
                            key={item.scoreObj.playerId}
                            className={`py-2 flex items-center justify-between ${
                              idx < 4 ? 'text-emerald-400 font-semibold' : 'text-gray-400'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate pr-2">
                              <span className="font-mono bg-gray-800 text-gray-300 px-1.5 py-0.5 rounded text-[10px] border border-gray-700">
                                #{item.player?.id}
                              </span>
                              <span className="truncate">{item.player?.name}</span>
                            </div>
                            <span className="font-bold text-white">{item.totalScore} pts</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : tournament.tour1Poules.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {tournament.tour1Poules.slice(0, 8).map((poule) => {
                  const sorted = sortPoulePlayers(poule, playersMap);
                  return (
                    <div
                      key={poule.id}
                      className="bg-gray-900 rounded-xl border border-gray-800 p-4 overflow-hidden"
                    >
                      <div className="font-bold text-sm text-white pb-2.5 border-b border-gray-800 flex justify-between">
                        <span>{poule.name}</span>
                        <span className="text-emerald-400 text-xs font-semibold">Top 5</span>
                      </div>
                      <div className="divide-y divide-gray-800/80 text-xs">
                        {sorted.slice(0, 5).map((item) => (
                          <div
                            key={item.scoreObj.playerId}
                            className="py-1.5 flex items-center justify-between text-emerald-400"
                          >
                            <span className="truncate pr-2 font-medium">
                              #{item.player?.id} {item.player?.name}
                            </span>
                            <span className="font-bold text-white">{item.totalScore}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        )}

        {activeView === 'finals' && tournament.finalMatches.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-gray-400" />
              <span>Phases Finales en Direct</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {tournament.finalMatches
                .filter((m) => m.round === 'roundOf16')
                .map((m) => {
                  const p1 = m.player1Id ? playersMap.get(m.player1Id) : null;
                  const p2 = m.player2Id ? playersMap.get(m.player2Id) : null;

                  return (
                    <div
                      key={m.id}
                      className="bg-gray-900 border border-gray-800 rounded-xl p-3.5 space-y-2 text-xs"
                    >
                      <div className="text-[11px] text-gray-300 font-bold">{m.label}</div>
                      <div className="space-y-1.5">
                        <div
                          className={`p-1.5 rounded-lg flex items-center justify-between ${
                            m.winnerId === m.player1Id && m.winnerId !== null
                              ? 'bg-emerald-950/60 text-emerald-300 font-bold border border-emerald-800/60'
                              : 'text-gray-300 bg-gray-800/50'
                          }`}
                        >
                          <span className="truncate">
                            {p1 ? `#${p1.id} ${p1.name}` : m.player1Placeholder}
                          </span>
                          <span className="font-bold text-white">{m.score1 ?? '-'}</span>
                        </div>
                        <div
                          className={`p-1.5 rounded-lg flex items-center justify-between ${
                            m.winnerId === m.player2Id && m.winnerId !== null
                              ? 'bg-emerald-950/60 text-emerald-300 font-bold border border-emerald-800/60'
                              : 'text-gray-300 bg-gray-800/50'
                          }`}
                        >
                          <span className="truncate">
                            {p2 ? `#${p2.id} ${p2.name}` : m.player2Placeholder}
                          </span>
                          <span className="font-bold text-white">{m.score2 ?? '-'}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-4 border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
        <div>Affichage automatique mis à jour en temps réel</div>
        <div className="text-gray-300 font-mono font-semibold">
          {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
      </div>
    </div>
  );
};
