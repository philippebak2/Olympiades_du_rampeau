import React, { useState } from 'react';
import { TournamentData, Player } from '../types/tournament';
import { calculateTeamStandings } from '../utils/tournamentLogic';
import {
  Trophy,
  Medal,
  Award,
  Crown,
  Printer,
  Download,
  Search,
  Filter,
  Flame,
  Target,
  BarChart3,
  Users,
} from 'lucide-react';

interface TabPalmaresStatsProps {
  tournament: TournamentData;
  playersMap: Map<number, Player>;
}

export const TabPalmaresStats: React.FC<TabPalmaresStatsProps> = ({
  tournament,
  playersMap,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Collect individual stats for all players
  const finalMatches = tournament.finalMatches;
  const grandFinal = finalMatches.find((m) => m.round === 'final' && m.isComplete);
  const bronzeMatch = finalMatches.find((m) => m.round === 'thirdPlace' && m.isComplete);

  const champion = grandFinal?.winnerId ? playersMap.get(grandFinal.winnerId) : null;
  const viceChampion = grandFinal?.loserId ? playersMap.get(grandFinal.loserId) : null;
  const thirdPlace = bronzeMatch?.winnerId ? playersMap.get(bronzeMatch.winnerId) : null;
  const fourthPlace = bronzeMatch?.loserId ? playersMap.get(bronzeMatch.loserId) : null;

  // Calcul du récapitulatif de tous les joueurs
  const playerStatsList = tournament.players.map((player) => {
    let t1Score = 0;
    let t2Score = 0;
    let t3Score = 0;
    let finalsScore = 0;
    let throwCount = 0;
    let maxSingleThrow = 0;

    // Tour 1
    tournament.tour1Poules.forEach((poule) => {
      const ps = poule.playerScores.find((s) => s.playerId === player.id);
      if (ps) {
        ps.tirs.forEach((t) => {
          if (t !== undefined && t !== null) {
            t1Score += t;
            throwCount++;
            if (t > maxSingleThrow) maxSingleThrow = t;
          }
        });
      }
    });

    // Tour 2
    tournament.tour2Poules.forEach((poule) => {
      const ps = poule.playerScores.find((s) => s.playerId === player.id);
      if (ps) {
        ps.tirs.forEach((t) => {
          if (t !== undefined && t !== null) {
            t2Score += t;
            throwCount++;
            if (t > maxSingleThrow) maxSingleThrow = t;
          }
        });
      }
    });

    // Tour 3
    tournament.tour3Poules.forEach((poule) => {
      const ps = poule.playerScores.find((s) => s.playerId === player.id);
      if (ps) {
        ps.tirs.forEach((t) => {
          if (t !== undefined && t !== null) {
            t3Score += t;
            throwCount++;
            if (t > maxSingleThrow) maxSingleThrow = t;
          }
        });
      }
    });

    // Finals
    tournament.finalMatches.forEach((m) => {
      if (m.player1Id === player.id && m.score1 !== null) {
        finalsScore += m.score1;
        throwCount++;
        if (m.score1 > maxSingleThrow) maxSingleThrow = m.score1;
      }
      if (m.player2Id === player.id && m.score2 !== null) {
        finalsScore += m.score2;
        throwCount++;
        if (m.score2 > maxSingleThrow) maxSingleThrow = m.score2;
      }
    });

    const totalPins = t1Score + t2Score + t3Score + finalsScore;
    const average = throwCount > 0 ? (totalPins / throwCount).toFixed(2) : '0.00';

    // Determining official final rank / badge
    let finalTitle = 'Tour 1';
    let rankPriority = 100;

    if (champion?.id === player.id) {
      finalTitle = '🏆 1ère Place (Champion)';
      rankPriority = 1;
    } else if (viceChampion?.id === player.id) {
      finalTitle = '🥈 2ème Place (Vice-Champion)';
      rankPriority = 2;
    } else if (thirdPlace?.id === player.id) {
      finalTitle = '🥉 3ème Place (Bronze)';
      rankPriority = 3;
    } else if (fourthPlace?.id === player.id) {
      finalTitle = '4ème Place';
      rankPriority = 4;
    } else if (tournament.finalMatches.some((m) => m.round === 'quarterFinals' && (m.player1Id === player.id || m.player2Id === player.id))) {
      finalTitle = '1/4 de Finale';
      rankPriority = 5;
    } else if (tournament.finalMatches.some((m) => m.round === 'roundOf16' && (m.player1Id === player.id || m.player2Id === player.id))) {
      finalTitle = '8ème de Finale';
      rankPriority = 6;
    } else if (tournament.tour3Poules.some((p) => p.playerScores.some((s) => s.playerId === player.id))) {
      finalTitle = 'Tour 3 (Poules)';
      rankPriority = 7;
    } else if (tournament.tour2Poules.some((p) => p.playerScores.some((s) => s.playerId === player.id))) {
      finalTitle = 'Tour 2 (Poules)';
      rankPriority = 8;
    }

    return {
      player,
      t1Score,
      t2Score,
      t3Score,
      finalsScore,
      totalPins,
      throwCount,
      average,
      maxSingleThrow,
      finalTitle,
      rankPriority,
    };
  });

  // Sort players by Rank priority then Total Pins
  playerStatsList.sort((a, b) => {
    if (a.rankPriority !== b.rankPriority) return a.rankPriority - b.rankPriority;
    return b.totalPins - a.totalPins;
  });

  // Filter
  const filteredList = playerStatsList.filter(
    (item) =>
      item.player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.player.id.toString().includes(searchTerm) ||
      item.player.team.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Global aggregate tournament stats
  const grandTotalPins = playerStatsList.reduce((acc, p) => acc + p.totalPins, 0);
  const grandTotalThrows = playerStatsList.reduce((acc, p) => acc + p.throwCount, 0);
  const globalAverage = grandTotalThrows > 0 ? (grandTotalPins / grandTotalThrows).toFixed(2) : '0.00';
  const strikesCount = playerStatsList.filter((p) => p.maxSingleThrow === 9).length;

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ['Rang', 'Numéro', 'Nom', 'Club', 'Tour 1', 'Tour 2', 'Tour 3', 'Phases Finales', 'Total Quilles', 'Nb Tirs', 'Moyenne', 'Stade Atteint'];
    const rows = playerStatsList.map((p, idx) => [
      idx + 1,
      `#${p.player.id}`,
      `"${p.player.name.replace(/"/g, '""')}"`,
      `"${p.player.team.replace(/"/g, '""')}"`,
      p.t1Score,
      p.t2Score,
      p.t3Score,
      p.finalsScore,
      p.totalPins,
      p.throwCount,
      p.average,
      `"${p.finalTitle.replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `palmares_olympiades_du_rampeau_${new Date().toISOString().slice(0, 10)}.csv`);
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
              <Trophy className="w-3.5 h-3.5 text-gray-600" />
              <span>Bilan Global & Tableau d'Honneur</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
              Palmarès Officiel & Statistiques Individuelles
            </h2>
            <p className="text-xs text-gray-600 max-w-3xl">
              Consultez le podium officiel, les moyennes de tir de chaque quilleur et exportez le rapport complet de la compétition.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-print-results"
              onClick={handlePrint}
              className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <Printer className="w-4 h-4 text-gray-500" />
              <span>Imprimer</span>
            </button>
            <button
              type="button"
              id="btn-export-csv"
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Exporter CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Tournament Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs text-center">
          <div className="text-2xl font-bold text-gray-900">{grandTotalPins}</div>
          <div className="text-xs text-gray-500 font-medium mt-0.5">Quilles Abattues au Total</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs text-center">
          <div className="text-2xl font-bold text-gray-900">{grandTotalThrows}</div>
          <div className="text-xs text-gray-500 font-medium mt-0.5">Tirs Réalisés</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs text-center">
          <div className="text-2xl font-bold text-emerald-700">{globalAverage} / 9</div>
          <div className="text-xs text-gray-500 font-medium mt-0.5">Moyenne Générale / Tir</div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs text-center">
          <div className="text-2xl font-bold text-gray-900">{strikesCount}</div>
          <div className="text-xs text-gray-500 font-medium mt-0.5">Quilleurs avec Tir Parfait (9)</div>
        </div>
      </div>

      {/* Official Podium Card if available */}
      {champion && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs">
          <h3 className="text-base font-bold text-gray-900 text-center mb-6 uppercase tracking-wider flex items-center justify-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            <span>Podium Officiel du Tournoi</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end max-w-3xl mx-auto">
            {/* 2nd Place */}
            {viceChampion && (
              <div className="bg-gray-50/70 rounded-xl p-5 border border-gray-200 text-center order-2 md:order-1 flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-700 font-bold text-base flex items-center justify-center mb-2 shadow-2xs">
                  2
                </div>
                <div className="text-xs font-semibold text-gray-500 uppercase">Médaille d'Argent</div>
                <div className="text-base font-bold text-gray-900 mt-1">
                  #{viceChampion.id} {viceChampion.name}
                </div>
                <div className="text-xs text-gray-500">{viceChampion.team}</div>
                <span className="mt-3 inline-block px-2.5 py-1 rounded-md bg-gray-200 text-gray-800 text-xs font-semibold">
                  Vice-Champion (7 pts)
                </span>
              </div>
            )}

            {/* 1st Place */}
            <div className="bg-white rounded-xl p-6 border-2 border-gray-900 text-center order-1 md:order-2 flex flex-col items-center shadow-xs">
              <div className="w-14 h-14 rounded-full bg-gray-900 text-white font-bold text-xl flex items-center justify-center mb-2 shadow-2xs">
                1
              </div>
              <div className="text-xs font-bold text-gray-900 uppercase flex items-center gap-1">
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                <span>CHAMPION (OR)</span>
              </div>
              <div className="text-lg font-bold text-gray-900 mt-1">
                #{champion.id} {champion.name}
              </div>
              <div className="text-xs text-gray-600 font-medium">{champion.team}</div>
              <span className="mt-3 inline-block px-3 py-1 rounded-md bg-gray-900 text-white text-xs font-bold shadow-2xs">
                Vainqueur (8 pts)
              </span>
            </div>

            {/* 3rd Place */}
            {thirdPlace && (
              <div className="bg-gray-50/70 rounded-xl p-5 border border-gray-200 text-center order-3 flex flex-col items-center">
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-900 font-bold text-base flex items-center justify-center mb-2 shadow-2xs border border-amber-200">
                  3
                </div>
                <div className="text-xs font-semibold text-amber-800 uppercase">Médaille de Bronze</div>
                <div className="text-base font-bold text-gray-900 mt-1">
                  #{thirdPlace.id} {thirdPlace.name}
                </div>
                <div className="text-xs text-gray-500">{thirdPlace.team}</div>
                <span className="mt-3 inline-block px-2.5 py-1 rounded-md bg-amber-50 text-amber-900 text-xs font-semibold border border-amber-200">
                  3ème Place (6 pts)
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full Leaderboard Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Award className="w-4 h-4 text-gray-700" />
            <span>Tableau d'Honneur Individuel ({filteredList.length} / {playerStatsList.length})</span>
          </h3>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              id="search-stats-input"
              placeholder="Rechercher quilleur ou club..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-900 w-56"
            />
          </div>
        </div>

        <div className="overflow-x-auto max-h-[600px] scrollbar-thin">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-gray-50/50 text-gray-600 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10 border-b border-gray-200">
              <tr>
                <th className="py-3 px-3 w-14 text-center">Rang</th>
                <th className="py-3 px-3">Quilleur (N° & Nom)</th>
                <th className="py-3 px-3">Club / Équipe</th>
                <th className="py-3 px-2 text-center w-16">Tour 1</th>
                <th className="py-3 px-2 text-center w-16">Tour 2</th>
                <th className="py-3 px-2 text-center w-16">Tour 3</th>
                <th className="py-3 px-2 text-center w-18">Phases Fin.</th>
                <th className="py-3 px-3 text-center w-24 font-bold text-gray-900">
                  Total Quilles
                </th>
                <th className="py-3 px-2 text-center w-20">Moyenne</th>
                <th className="py-3 px-3 text-right w-36">Stade Atteint</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredList.map((item, index) => {
                const rank = index + 1;
                return (
                  <tr
                    key={item.player.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      rank === 1
                        ? 'bg-emerald-50/20 font-semibold'
                        : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-[11px] font-bold ${
                          rank === 1
                            ? 'bg-gray-900 text-white'
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

                    <td className="py-2.5 px-3 font-semibold text-gray-900">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-gray-800 font-bold bg-gray-100 px-1.5 py-0.5 rounded text-[11px] border border-gray-200">
                          #{item.player.id}
                        </span>
                        <span>{item.player.name}</span>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-gray-600">
                      {item.player.team || 'Individuel'}
                    </td>

                    <td className="py-2.5 px-2 text-center text-gray-700">
                      {item.t1Score || '-'}
                    </td>

                    <td className="py-2.5 px-2 text-center text-gray-700">
                      {item.t2Score || '-'}
                    </td>

                    <td className="py-2.5 px-2 text-center text-gray-700">
                      {item.t3Score || '-'}
                    </td>

                    <td className="py-2.5 px-2 text-center text-gray-700">
                      {item.finalsScore > 0 ? `+${item.finalsScore}` : '-'}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-900 font-bold text-xs border border-gray-200">
                        {item.totalPins} 🎳
                      </span>
                    </td>

                    <td className="py-2.5 px-2 text-center font-mono font-bold text-gray-800">
                      {item.average}
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-medium bg-gray-100 text-gray-700 border border-gray-200">
                        {item.finalTitle}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
