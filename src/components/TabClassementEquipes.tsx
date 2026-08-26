import React, { useState } from 'react';
import { TournamentData, Player } from '../types/tournament';
import { calculateTeamStandings } from '../utils/tournamentLogic';
import {
  Shield,
  Trophy,
  Medal,
  Users,
  ChevronDown,
  ChevronUp,
  Download,
  Info,
  Sparkles,
} from 'lucide-react';

interface TabClassementEquipesProps {
  tournament: TournamentData;
  playersMap: Map<number, Player>;
}

export const TabClassementEquipes: React.FC<TabClassementEquipesProps> = ({
  tournament,
  playersMap,
}) => {
  const standings = calculateTeamStandings(tournament, playersMap);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

  const toggleExpand = (teamName: string) => {
    setExpandedTeam(expandedTeam === teamName ? null : teamName);
  };

  const top3 = standings.slice(0, 3);

  const handleExportCSV = () => {
    const headers = ['Rang', 'Club / Équipe', 'Points Équipe', 'Nb Quilleurs', 'Total Quilles Abattues', 'En Lice', 'Éliminés'];
    const rows = standings.map((team, idx) => [
      idx + 1,
      `"${team.teamName.replace(/"/g, '""')}"`,
      team.totalPoints,
      team.playerCount,
      team.totalPins,
      team.activePlayerCount,
      team.eliminatedPlayerCount,
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `classement_equipes_olympiades_du_rampeau_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-800 text-xs font-semibold border border-gray-200">
              <Shield className="w-3.5 h-3.5 text-gray-600" />
              <span>Classement Général Inter-Clubs en Temps Réel</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
              Classement par Équipes / Clubs ({standings.length} Clubs)
            </h2>
            <p className="text-xs text-gray-600 max-w-3xl">
              Calcul automatique selon le barème officiel des performances individuelles accumulées par l'ensemble des quilleurs de chaque club tout au long de la compétition.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-export-teams-csv"
              onClick={handleExportCSV}
              className="px-3.5 py-2 rounded-lg bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="Exporter le classement par équipes au format CSV"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>Exporter Classement (CSV)</span>
            </button>
          </div>
        </div>

        {/* Barème de points explicatif */}
        <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-[11px]">
          <div className="bg-gray-50 p-2 rounded-lg border border-gray-200 text-center">
            <div className="text-gray-900 font-bold">1 pt</div>
            <div className="text-gray-500 text-[10px]">Éliminé Tour 1</div>
          </div>
          <div className="bg-gray-50 p-2 rounded-lg border border-gray-200 text-center">
            <div className="text-gray-900 font-bold">2 pts</div>
            <div className="text-gray-500 text-[10px]">Éliminé Tour 2</div>
          </div>
          <div className="bg-gray-50 p-2 rounded-lg border border-gray-200 text-center">
            <div className="text-gray-900 font-bold">3 pts</div>
            <div className="text-gray-500 text-[10px]">Éliminé Tour 3</div>
          </div>
          <div className="bg-gray-50 p-2 rounded-lg border border-gray-200 text-center">
            <div className="text-gray-900 font-bold">4 pts</div>
            <div className="text-gray-500 text-[10px]">Éliminé 8èmes</div>
          </div>
          <div className="bg-gray-50 p-2 rounded-lg border border-gray-200 text-center">
            <div className="text-gray-900 font-bold">5 pts</div>
            <div className="text-gray-500 text-[10px]">Quarts & 4e place</div>
          </div>
          <div className="bg-gray-50 p-2 rounded-lg border border-gray-200 text-center">
            <div className="text-gray-900 font-bold">6 pts</div>
            <div className="text-gray-500 text-[10px]">3ème (Bronze)</div>
          </div>
          <div className="bg-gray-50 p-2 rounded-lg border border-gray-200 text-center">
            <div className="text-gray-900 font-bold">7 pts</div>
            <div className="text-gray-500 text-[10px]">2ème (Argent)</div>
          </div>
          <div className="bg-emerald-50 p-2 rounded-lg border border-emerald-200 text-center">
            <div className="text-emerald-700 font-bold">8 pts</div>
            <div className="text-emerald-600 text-[10px]">1er (Champion)</div>
          </div>
        </div>
      </div>

      {/* Top 3 Clubs Podium Cards */}
      {top3.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {top3.map((team, idx) => {
            const medals = [
              { color: 'border-gray-900 bg-white', badge: 'bg-gray-900 text-white', label: '1er Club (Or)', icon: Trophy },
              { color: 'border-gray-200 bg-white', badge: 'bg-gray-100 text-gray-700 border border-gray-200', label: '2ème Club (Argent)', icon: Medal },
              { color: 'border-gray-200 bg-white', badge: 'bg-gray-100 text-gray-700 border border-gray-200', label: '3ème Club (Bronze)', icon: Medal },
            ];
            const meta = medals[idx];
            const Icon = meta.icon;

            return (
              <div
                key={team.teamName}
                className={`p-5 rounded-xl border ${meta.color} shadow-xs relative overflow-hidden flex flex-col justify-between`}
              >
                <div className="flex items-center justify-between">
                  <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${meta.badge} flex items-center gap-1`}>
                    <Icon className="w-3.5 h-3.5" />
                    <span>{meta.label}</span>
                  </span>
                  <span className="text-2xl font-bold text-gray-900">
                    {team.totalPoints} <span className="text-xs font-medium text-gray-500">pts</span>
                  </span>
                </div>

                <div className="my-3">
                  <h3 className="text-base font-bold text-gray-900 leading-tight">
                    {team.teamName}
                  </h3>
                  <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                    <span>{team.playerCount} quilleurs</span>
                    <span>•</span>
                    <span>{team.totalPins} quilles abattues</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => toggleExpand(team.teamName)}
                  className="w-full py-1.5 px-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-xs font-medium flex items-center justify-between cursor-pointer transition-all"
                >
                  <span>Détail des {team.playerCount} joueurs</span>
                  {expandedTeam === team.teamName ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Main Standings Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50/70 flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Shield className="w-4 h-4 text-gray-700" />
            <span>Tableau Complet du Classement par Équipes</span>
          </h3>
          <span className="text-xs text-gray-500">
            Cliquez sur une ligne pour voir les quilleurs de chaque club
          </span>
        </div>

        {standings.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            Aucune équipe enregistrée.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-gray-50/50 text-gray-600 font-bold uppercase text-[10px] tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4 w-16 text-center">Rang</th>
                  <th className="py-3 px-4">Club / Équipe</th>
                  <th className="py-3 px-3 text-center w-24">Quilleurs</th>
                  <th className="py-3 px-3 text-center w-28">En lice / Éliminés</th>
                  <th className="py-3 px-3 text-center w-28">Total Quilles</th>
                  <th className="py-3 px-4 text-center w-28 font-bold text-gray-900">
                    Points Totaux
                  </th>
                  <th className="py-3 px-3 w-16 text-center">Détail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {standings.map((team, index) => {
                  const isExpanded = expandedTeam === team.teamName;
                  const rank = index + 1;

                  return (
                    <React.Fragment key={team.teamName}>
                      <tr
                        onClick={() => toggleExpand(team.teamName)}
                        className={`hover:bg-gray-50 cursor-pointer transition-colors ${
                          rank === 1
                            ? 'bg-emerald-50/20 font-semibold'
                            : ''
                        }`}
                      >
                        {/* Rang */}
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-xs font-bold ${
                              rank === 1
                                ? 'bg-gray-900 text-white shadow-2xs'
                                : rank === 2
                                ? 'bg-gray-200 text-gray-800'
                                : rank === 3
                                ? 'bg-gray-100 text-gray-700 border border-gray-200'
                                : 'bg-gray-50 text-gray-600'
                            }`}
                          >
                            {rank}
                          </span>
                        </td>

                        {/* Nom du Club */}
                        <td className="py-3 px-4">
                          <div className="font-semibold text-gray-900 text-sm">
                            {team.teamName}
                          </div>
                        </td>

                        {/* Nb quilleurs */}
                        <td className="py-3 px-3 text-center text-gray-600 font-medium">
                          {team.playerCount}
                        </td>

                        {/* Actifs / Éliminés */}
                        <td className="py-3 px-3 text-center text-xs">
                          <span className="text-emerald-700 font-semibold">{team.activePlayerCount}</span>
                          <span className="text-gray-400"> / </span>
                          <span className="text-gray-500">{team.eliminatedPlayerCount}</span>
                        </td>

                        {/* Total quilles */}
                        <td className="py-3 px-3 text-center font-medium text-gray-700">
                          {team.totalPins} 🎳
                        </td>

                        {/* Total Points */}
                        <td className="py-3 px-4 text-center">
                          <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-900 font-bold text-xs rounded-md border border-gray-200">
                            {team.totalPoints} pts
                          </span>
                        </td>

                        {/* Toggle button */}
                        <td className="py-3 px-3 text-center text-gray-400">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 mx-auto text-gray-700" />
                          ) : (
                            <ChevronDown className="w-4 h-4 mx-auto" />
                          )}
                        </td>
                      </tr>

                      {/* Expanded Accordion: Individual Players Detail */}
                      {isExpanded && (
                        <tr className="bg-gray-50/50">
                          <td colSpan={7} className="p-4 border-t border-b border-gray-200">
                            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-2xs space-y-3">
                              <div className="flex items-center justify-between pb-2 border-b border-gray-100 text-xs">
                                <span className="font-bold text-gray-800">
                                  Quilleurs de « {team.teamName} » et points rapportés :
                                </span>
                                <span className="text-gray-500">
                                  Total équipe : {team.totalPoints} points
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                                {team.players.map((p) => (
                                  <div
                                    key={p.playerId}
                                    className="p-2.5 rounded-lg border border-gray-200 bg-gray-50/50 flex items-center justify-between text-xs"
                                  >
                                    <div className="flex items-center gap-2 min-w-0 pr-2">
                                      <span className="font-mono font-bold text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded text-[11px] border border-gray-200 shrink-0">
                                        #{p.playerId}
                                      </span>
                                      <div className="min-w-0">
                                        <div className="font-semibold text-gray-900 truncate">
                                          {p.playerName}
                                        </div>
                                        <div className="text-[10px] text-gray-500 truncate">
                                          {p.stageReached} ({p.totalPinsKnocked} quilles)
                                        </div>
                                      </div>
                                    </div>

                                    <span className="font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded text-xs shrink-0 border border-gray-200">
                                      +{p.points} pt{p.points > 1 ? 's' : ''}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
