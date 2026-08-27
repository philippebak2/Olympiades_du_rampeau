import React, { useState } from 'react';
import { TournamentData, Player } from '../types/tournament';
import { exportPalmaresPDF } from '../utils/pdfExport';
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
  Sparkles,
  Heart,
  Baby,
} from 'lucide-react';

interface TabPalmaresStatsProps {
  tournament: TournamentData;
  playersMap: Map<number, Player>;
}

export type PalmaresCategory = 'overall' | 'women' | 'juniors' | 'men' | 'all_podiums';

export const TabPalmaresStats: React.FC<TabPalmaresStatsProps> = ({
  tournament,
  playersMap,
}) => {
  const [activeCategory, setActiveCategory] = useState<PalmaresCategory>('overall');
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
  const rawPlayerStatsList = tournament.players.map((player) => {
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
      finalTitle = '🏆 Champion (1ère Place)';
      rankPriority = 1;
    } else if (viceChampion?.id === player.id) {
      finalTitle = '🥈 Vice-Champion (2e Place)';
      rankPriority = 2;
    } else if (thirdPlace?.id === player.id) {
      finalTitle = '🥉 3ème Place (Bronze)';
      rankPriority = 3;
    } else if (fourthPlace?.id === player.id) {
      finalTitle = '4ème Place';
      rankPriority = 4;
    } else if (
      tournament.finalMatches.some(
        (m) =>
          m.round === 'quarterFinals' &&
          (m.player1Id === player.id || m.player2Id === player.id)
      )
    ) {
      finalTitle = '1/4 de Finale';
      rankPriority = 5;
    } else if (
      tournament.finalMatches.some(
        (m) =>
          m.round === 'roundOf16' &&
          (m.player1Id === player.id || m.player2Id === player.id)
      )
    ) {
      finalTitle = '8ème de Finale';
      rankPriority = 6;
    } else if (
      tournament.tour3Poules.some((p) =>
        p.playerScores.some((s) => s.playerId === player.id)
      )
    ) {
      finalTitle = 'Tour 3 (Poules)';
      rankPriority = 7;
    } else if (
      tournament.tour2Poules.some((p) =>
        p.playerScores.some((s) => s.playerId === player.id)
      )
    ) {
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

  // Sort overall by rank priority then total pins then average
  rawPlayerStatsList.sort((a, b) => {
    if (a.rankPriority !== b.rankPriority) return a.rankPriority - b.rankPriority;
    if (b.totalPins !== a.totalPins) return b.totalPins - a.totalPins;
    return parseFloat(b.average) - parseFloat(a.average);
  });

  // Assign overall rank
  const overallPlayerStats = rawPlayerStatsList.map((item, idx) => ({
    ...item,
    overallRank: idx + 1,
  }));

  // Filter lists by category
  const womenStats = overallPlayerStats
    .filter((item) => item.player.gender === 'F')
    .map((item, idx) => ({
      ...item,
      categoryRank: idx + 1,
    }));

  const juniorStats = overallPlayerStats
    .filter((item) => !!item.player.isUnder18)
    .map((item, idx) => ({
      ...item,
      categoryRank: idx + 1,
    }));

  const menStats = overallPlayerStats
    .filter((item) => (item.player.gender || 'H') === 'H')
    .map((item, idx) => ({
      ...item,
      categoryRank: idx + 1,
    }));

  // Active list according to active category
  let currentList: Array<typeof overallPlayerStats[0] & { categoryRank?: number }> = [];
  if (activeCategory === 'overall' || activeCategory === 'all_podiums') {
    currentList = overallPlayerStats.map((item) => ({ ...item, categoryRank: item.overallRank }));
  } else if (activeCategory === 'women') {
    currentList = womenStats;
  } else if (activeCategory === 'juniors') {
    currentList = juniorStats;
  } else if (activeCategory === 'men') {
    currentList = menStats;
  }

  // Filtered by search
  const filteredList = currentList.filter(
    (item) =>
      item.player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.player.id.toString().includes(searchTerm) ||
      item.player.team.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Stats Calculations
  const grandTotalPins = overallPlayerStats.reduce((acc, p) => acc + p.totalPins, 0);
  const grandTotalThrows = overallPlayerStats.reduce((acc, p) => acc + p.throwCount, 0);
  const globalAverage =
    grandTotalThrows > 0 ? (grandTotalPins / grandTotalThrows).toFixed(2) : '0.00';
  const strikesCount = overallPlayerStats.filter((p) => p.maxSingleThrow === 9).length;

  // Women Stats
  const womenCount = womenStats.length;
  const womenTotalPins = womenStats.reduce((acc, p) => acc + p.totalPins, 0);
  const womenThrows = womenStats.reduce((acc, p) => acc + p.throwCount, 0);
  const womenAverage = womenThrows > 0 ? (womenTotalPins / womenThrows).toFixed(2) : '0.00';
  const bestWoman = womenStats[0] || null;

  // Juniors Stats
  const juniorCount = juniorStats.length;
  const juniorTotalPins = juniorStats.reduce((acc, p) => acc + p.totalPins, 0);
  const juniorThrows = juniorStats.reduce((acc, p) => acc + p.throwCount, 0);
  const juniorAverage = juniorThrows > 0 ? (juniorTotalPins / juniorThrows).toFixed(2) : '0.00';
  const bestJunior = juniorStats[0] || null;

  // Podiums
  const overallPodium = overallPlayerStats.slice(0, 3);
  const womenPodium = womenStats.slice(0, 3);
  const juniorPodium = juniorStats.slice(0, 3);

  // Active Category Title
  const getCategoryTitle = () => {
    switch (activeCategory) {
      case 'women':
        return 'Classement Féminin (Dames)';
      case 'juniors':
        return 'Classement Juniors (< 18 ans)';
      case 'men':
        return 'Classement Hommes (Messieurs)';
      case 'all_podiums':
        return 'Synthèse des Podiums (Général, Féminin, Juniors)';
      case 'overall':
      default:
        return 'Classement Général Scratch';
    }
  };

  const handlePrintPDF = () => {
    const title = tournament.title || 'Olympiades du Rampeau';
    const categoryTitle = getCategoryTitle();
    const itemsToExport = (activeCategory === 'all_podiums' ? overallPlayerStats : currentList).map(
      (item, idx) => ({
        rank: item.categoryRank || idx + 1,
        overallRank: item.overallRank,
        player: item.player,
        t1Score: item.t1Score,
        t2Score: item.t2Score,
        t3Score: item.t3Score,
        finalsScore: item.finalsScore,
        totalPins: item.totalPins,
        average: item.average,
        finalTitle: item.finalTitle,
      })
    );

    exportPalmaresPDF({
      title,
      categoryTitle,
      subtitle:
        activeCategory === 'women'
          ? `Palmarès et classement des ${womenCount} quilleuses féminines`
          : activeCategory === 'juniors'
          ? `Palmarès et classement des ${juniorCount} quilleurs de moins de 18 ans`
          : `Palmarès officiel de la compétition (${overallPlayerStats.length} quilleurs)`,
      items: itemsToExport,
      showCategoryColumn: activeCategory === 'overall' || activeCategory === 'all_podiums',
    });
  };

  const handleExportCSV = () => {
    let filenamePrefix = 'palmares_general';
    let catHeaderName = 'Rang Général';

    if (activeCategory === 'women') {
      filenamePrefix = 'classement_feminin';
      catHeaderName = 'Rang Féminin';
    } else if (activeCategory === 'juniors') {
      filenamePrefix = 'classement_juniors_u18';
      catHeaderName = 'Rang Junior';
    } else if (activeCategory === 'men') {
      filenamePrefix = 'classement_hommes';
      catHeaderName = 'Rang Homme';
    }

    const headers = [
      catHeaderName,
      'Rang Scratch',
      'Numéro',
      'Nom',
      'Genre',
      'Moins de 18 ans',
      'Club / Équipe',
      'Tour 1',
      'Tour 2',
      'Tour 3',
      'Phases Finales',
      'Total Quilles',
      'Nb Tirs',
      'Moyenne',
      'Stade Atteint',
    ];

    const rows = currentList.map((p) => [
      p.categoryRank || p.overallRank,
      p.overallRank,
      `#${p.player.id}`,
      `"${p.player.name.replace(/"/g, '""')}"`,
      p.player.gender === 'F' ? 'Femme' : 'Homme',
      p.player.isUnder18 ? 'Oui (<18)' : 'Non',
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

    const csvContent =
      '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `${filenamePrefix}_olympiades_du_rampeau_${new Date().toISOString().slice(0, 10)}.csv`
    );
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
              <Trophy className="w-3.5 h-3.5 text-gray-700" />
              <span>Bilan Global & Tableaux d'Honneur</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
              Palmarès Officiel & Classements par Catégories
            </h2>
            <p className="text-xs text-gray-600 max-w-3xl">
              Consultez les podiums et classements complets : <strong>Général (Scratch)</strong>,{' '}
              <strong>Féminin</strong> et <strong>Juniors (&lt; 18 ans)</strong>. Exportez les
              résultats en PDF officiels ou tableurs CSV.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-print-palmares-pdf"
              onClick={handlePrintPDF}
              className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <Printer className="w-4 h-4 text-gray-500" />
              <span>Imprimer PDF</span>
            </button>
            <button
              type="button"
              id="btn-export-palmares-csv"
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Exporter CSV ({activeCategory === 'women' ? 'Femmes' : activeCategory === 'juniors' ? 'Juniors' : 'Général'})</span>
            </button>
          </div>
        </div>
      </div>

      {/* Category Tabs Selection */}
      <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-xs flex flex-wrap items-center gap-2">
        <button
          type="button"
          id="tab-btn-cat-overall"
          onClick={() => setActiveCategory('overall')}
          className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeCategory === 'overall'
              ? 'bg-gray-900 text-white shadow-2xs'
              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Classement Général (Scratch)</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeCategory === 'overall' ? 'bg-gray-800 text-gray-200' : 'bg-gray-200 text-gray-700'}`}>
            {overallPlayerStats.length}
          </span>
        </button>

        <button
          type="button"
          id="tab-btn-cat-women"
          onClick={() => setActiveCategory('women')}
          className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeCategory === 'women'
              ? 'bg-pink-600 text-white shadow-2xs ring-2 ring-pink-600/20'
              : 'bg-pink-50/60 text-pink-800 hover:bg-pink-100/80 border border-pink-200'
          }`}
        >
          <span>♀ Classement Féminin</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeCategory === 'women' ? 'bg-pink-700 text-white' : 'bg-pink-200 text-pink-900 font-bold'}`}>
            {womenCount}
          </span>
        </button>

        <button
          type="button"
          id="tab-btn-cat-juniors"
          onClick={() => setActiveCategory('juniors')}
          className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeCategory === 'juniors'
              ? 'bg-amber-600 text-white shadow-2xs ring-2 ring-amber-600/20'
              : 'bg-amber-50/60 text-amber-900 hover:bg-amber-100/80 border border-amber-300'
          }`}
        >
          <Baby className="w-4 h-4" />
          <span>Classement Juniors (&lt; 18 ans)</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeCategory === 'juniors' ? 'bg-amber-700 text-white' : 'bg-amber-200 text-amber-900 font-bold'}`}>
            {juniorCount}
          </span>
        </button>

        <button
          type="button"
          id="tab-btn-cat-podiums"
          onClick={() => setActiveCategory('all_podiums')}
          className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeCategory === 'all_podiums'
              ? 'bg-indigo-900 text-white shadow-2xs'
              : 'bg-indigo-50/60 text-indigo-900 hover:bg-indigo-100/80 border border-indigo-200'
          }`}
        >
          <Crown className="w-4 h-4 text-amber-400" />
          <span>Vue Triple Podium (Synthèse)</span>
        </button>

        <button
          type="button"
          id="tab-btn-cat-men"
          onClick={() => setActiveCategory('men')}
          className={`flex-1 sm:flex-initial px-3 py-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeCategory === 'men'
              ? 'bg-blue-900 text-white shadow-2xs'
              : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <span>♂ Hommes ({menStats.length})</span>
        </button>
      </div>

      {/* Overview Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs text-center">
          <div className="text-2xl font-bold text-gray-900">{grandTotalPins}</div>
          <div className="text-[11px] text-gray-500 font-medium mt-0.5">Quilles Abattues (Global)</div>
          <div className="text-[10px] text-gray-400 mt-1">{grandTotalThrows} tirs • moy {globalAverage}/tir</div>
        </div>

        <div className="bg-pink-50/50 p-4 rounded-xl border border-pink-200 shadow-xs text-center">
          <div className="text-2xl font-bold text-pink-700">{womenCount}</div>
          <div className="text-[11px] text-pink-800 font-semibold mt-0.5">Quilleuses Féminines</div>
          <div className="text-[10px] text-pink-600 mt-1 font-medium">
            {bestWoman ? `1ère: ${bestWoman.player.name} (${bestWoman.totalPins} q)` : 'Aucune inscrite'}
          </div>
        </div>

        <div className="bg-amber-50/50 p-4 rounded-xl border border-amber-200 shadow-xs text-center">
          <div className="text-2xl font-bold text-amber-800">{juniorCount}</div>
          <div className="text-[11px] text-amber-900 font-semibold mt-0.5">Juniors Moins de 18 ans</div>
          <div className="text-[10px] text-amber-700 mt-1 font-medium">
            {bestJunior ? `1er: ${bestJunior.player.name} (${bestJunior.totalPins} q)` : 'Aucun inscrit'}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs text-center">
          <div className="text-2xl font-bold text-emerald-700">{strikesCount}</div>
          <div className="text-[11px] text-gray-500 font-medium mt-0.5">Tirs Parfaits (9/9)</div>
          <div className="text-[10px] text-emerald-700 mt-1 font-semibold">Tir maximal réussi</div>
        </div>
      </div>

      {/* Triple Podium View when selected */}
      {activeCategory === 'all_podiums' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1. Podium Général */}
            <div className="bg-white rounded-xl border-2 border-gray-900 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-200 mb-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    <span className="font-bold text-sm text-gray-900 uppercase tracking-wide">
                      Podium Général Scratch
                    </span>
                  </div>
                  <span className="text-[10px] font-bold bg-gray-100 text-gray-800 px-2 py-0.5 rounded">
                    Toutes Catégories
                  </span>
                </div>

                <div className="space-y-3">
                  {overallPodium[0] && (
                    <div className="bg-gray-900 text-white p-3.5 rounded-xl flex items-center justify-between shadow-2xs">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-400 text-gray-950 font-black text-sm flex items-center justify-center">
                          1
                        </div>
                        <div>
                          <div className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">
                            Champion (Or)
                          </div>
                          <div className="font-bold text-sm">
                            #{overallPodium[0].player.id} {overallPodium[0].player.name}
                          </div>
                          <div className="text-[11px] text-gray-300">
                            {overallPodium[0].player.team}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-base font-black text-amber-400">
                          {overallPodium[0].totalPins}
                        </div>
                        <div className="text-[10px] text-gray-400">quilles</div>
                      </div>
                    </div>
                  )}

                  {overallPodium[1] && (
                    <div className="bg-gray-50 border border-gray-200 p-3 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-gray-300 text-gray-900 font-bold text-xs flex items-center justify-center">
                          2
                        </div>
                        <div>
                          <div className="text-[10px] text-gray-500 font-semibold uppercase">
                            Médaille d'Argent
                          </div>
                          <div className="font-bold text-xs text-gray-900">
                            #{overallPodium[1].player.id} {overallPodium[1].player.name}
                          </div>
                          <div className="text-[10px] text-gray-500">
                            {overallPodium[1].player.team}
                          </div>
                        </div>
                      </div>
                      <div className="text-right font-bold text-xs text-gray-900">
                        {overallPodium[1].totalPins} q
                      </div>
                    </div>
                  )}

                  {overallPodium[2] && (
                    <div className="bg-amber-50/40 border border-amber-200 p-3 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-amber-200 text-amber-900 font-bold text-xs flex items-center justify-center">
                          3
                        </div>
                        <div>
                          <div className="text-[10px] text-amber-800 font-semibold uppercase">
                            Médaille de Bronze
                          </div>
                          <div className="font-bold text-xs text-gray-900">
                            #{overallPodium[2].player.id} {overallPodium[2].player.name}
                          </div>
                          <div className="text-[10px] text-gray-500">
                            {overallPodium[2].player.team}
                          </div>
                        </div>
                      </div>
                      <div className="text-right font-bold text-xs text-amber-900">
                        {overallPodium[2].totalPins} q
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveCategory('overall')}
                className="mt-4 w-full py-1.5 text-center text-xs font-bold text-gray-800 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
              >
                Voir le classement complet ({overallPlayerStats.length}) →
              </button>
            </div>

            {/* 2. Podium Féminin */}
            <div className="bg-white rounded-xl border-2 border-pink-400 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-pink-100 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🌸</span>
                    <span className="font-bold text-sm text-pink-900 uppercase tracking-wide">
                      Podium Féminin
                    </span>
                  </div>
                  <span className="text-[10px] font-bold bg-pink-100 text-pink-800 px-2 py-0.5 rounded">
                    {womenCount} Dames
                  </span>
                </div>

                {womenPodium.length > 0 ? (
                  <div className="space-y-3">
                    {womenPodium[0] && (
                      <div className="bg-pink-600 text-white p-3.5 rounded-xl flex items-center justify-between shadow-2xs">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white text-pink-700 font-black text-sm flex items-center justify-center">
                            1
                          </div>
                          <div>
                            <div className="text-[10px] text-pink-200 font-bold uppercase tracking-wider">
                              🥇 Championne Féminine
                            </div>
                            <div className="font-bold text-sm">
                              #{womenPodium[0].player.id} {womenPodium[0].player.name}
                            </div>
                            <div className="text-[11px] text-pink-100">
                              {womenPodium[0].player.team} (Scratch #{womenPodium[0].overallRank})
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-black text-white">
                            {womenPodium[0].totalPins}
                          </div>
                          <div className="text-[10px] text-pink-200">quilles</div>
                        </div>
                      </div>
                    )}

                    {womenPodium[1] && (
                      <div className="bg-pink-50/60 border border-pink-200 p-3 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-pink-200 text-pink-900 font-bold text-xs flex items-center justify-center">
                            2
                          </div>
                          <div>
                            <div className="text-[10px] text-pink-700 font-semibold uppercase">
                              🥈 2ème Féminine
                            </div>
                            <div className="font-bold text-xs text-gray-900">
                              #{womenPodium[1].player.id} {womenPodium[1].player.name}
                            </div>
                            <div className="text-[10px] text-gray-500">
                              {womenPodium[1].player.team}
                            </div>
                          </div>
                        </div>
                        <div className="text-right font-bold text-xs text-pink-800">
                          {womenPodium[1].totalPins} q
                        </div>
                      </div>
                    )}

                    {womenPodium[2] && (
                      <div className="bg-pink-50/30 border border-pink-200 p-3 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-pink-100 text-pink-800 font-bold text-xs flex items-center justify-center">
                            3
                          </div>
                          <div>
                            <div className="text-[10px] text-pink-700 font-semibold uppercase">
                              🥉 3ème Féminine
                            </div>
                            <div className="font-bold text-xs text-gray-900">
                              #{womenPodium[2].player.id} {womenPodium[2].player.name}
                            </div>
                            <div className="text-[10px] text-gray-500">
                              {womenPodium[2].player.team}
                            </div>
                          </div>
                        </div>
                        <div className="text-right font-bold text-xs text-pink-800">
                          {womenPodium[2].totalPins} q
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-gray-500 bg-gray-50 rounded-xl">
                    Aucune participante inscrite dans la catégorie Féminine.
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setActiveCategory('women')}
                className="mt-4 w-full py-1.5 text-center text-xs font-bold text-pink-800 bg-pink-50 hover:bg-pink-100 border border-pink-200 rounded-lg transition-colors cursor-pointer"
              >
                Voir le classement féminin ({womenCount}) →
              </button>
            </div>

            {/* 3. Podium Juniors */}
            <div className="bg-white rounded-xl border-2 border-amber-400 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-amber-100 mb-4">
                  <div className="flex items-center gap-2">
                    <Baby className="w-5 h-5 text-amber-600" />
                    <span className="font-bold text-sm text-amber-900 uppercase tracking-wide">
                      Podium Juniors (&lt; 18 ans)
                    </span>
                  </div>
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                    {juniorCount} Juniors
                  </span>
                </div>

                {juniorPodium.length > 0 ? (
                  <div className="space-y-3">
                    {juniorPodium[0] && (
                      <div className="bg-amber-600 text-white p-3.5 rounded-xl flex items-center justify-between shadow-2xs">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-white text-amber-800 font-black text-sm flex items-center justify-center">
                            1
                          </div>
                          <div>
                            <div className="text-[10px] text-amber-100 font-bold uppercase tracking-wider">
                              🥇 Champion Junior (Espoir)
                            </div>
                            <div className="font-bold text-sm">
                              #{juniorPodium[0].player.id} {juniorPodium[0].player.name}
                            </div>
                            <div className="text-[11px] text-amber-100">
                              {juniorPodium[0].player.team} (Scratch #{juniorPodium[0].overallRank})
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-base font-black text-white">
                            {juniorPodium[0].totalPins}
                          </div>
                          <div className="text-[10px] text-amber-100">quilles</div>
                        </div>
                      </div>
                    )}

                    {juniorPodium[1] && (
                      <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-amber-200 text-amber-900 font-bold text-xs flex items-center justify-center">
                            2
                          </div>
                          <div>
                            <div className="text-[10px] text-amber-800 font-semibold uppercase">
                              🥈 2ème Junior
                            </div>
                            <div className="font-bold text-xs text-gray-900">
                              #{juniorPodium[1].player.id} {juniorPodium[1].player.name}
                            </div>
                            <div className="text-[10px] text-gray-500">
                              {juniorPodium[1].player.team}
                            </div>
                          </div>
                        </div>
                        <div className="text-right font-bold text-xs text-amber-900">
                          {juniorPodium[1].totalPins} q
                        </div>
                      </div>
                    )}

                    {juniorPodium[2] && (
                      <div className="bg-amber-50/40 border border-amber-200 p-3 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-900 font-bold text-xs flex items-center justify-center">
                            3
                          </div>
                          <div>
                            <div className="text-[10px] text-amber-800 font-semibold uppercase">
                              🥉 3ème Junior
                            </div>
                            <div className="font-bold text-xs text-gray-900">
                              #{juniorPodium[2].player.id} {juniorPodium[2].player.name}
                            </div>
                            <div className="text-[10px] text-gray-500">
                              {juniorPodium[2].player.team}
                            </div>
                          </div>
                        </div>
                        <div className="text-right font-bold text-xs text-amber-900">
                          {juniorPodium[2].totalPins} q
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-6 text-center text-xs text-gray-500 bg-gray-50 rounded-xl">
                    Aucun quilleur inscrit dans la catégorie Juniors (&lt; 18 ans).
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setActiveCategory('juniors')}
                className="mt-4 w-full py-1.5 text-center text-xs font-bold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer"
              >
                Voir le classement juniors ({juniorCount}) →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Specific Active Category Podium Banner if single category is selected */}
      {activeCategory !== 'all_podiums' && currentList.length >= 1 && (
        <div
          className={`rounded-xl border p-6 shadow-xs ${
            activeCategory === 'women'
              ? 'bg-pink-50/30 border-pink-200'
              : activeCategory === 'juniors'
              ? 'bg-amber-50/30 border-amber-200'
              : 'bg-white border-gray-200'
          }`}
        >
          <h3 className="text-base font-bold text-gray-900 text-center mb-6 uppercase tracking-wider flex items-center justify-center gap-2">
            <Crown
              className={`w-5 h-5 ${
                activeCategory === 'women'
                  ? 'text-pink-600'
                  : activeCategory === 'juniors'
                  ? 'text-amber-600'
                  : 'text-amber-500'
              }`}
            />
            <span>
              Podium Officiel —{' '}
              {activeCategory === 'women'
                ? 'Catégorie Féminine'
                : activeCategory === 'juniors'
                ? 'Catégorie Juniors (< 18 ans)'
                : 'Classement Général'}
            </span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end max-w-3xl mx-auto">
            {/* 2nd Place */}
            {currentList[1] && (
              <div className="bg-white rounded-xl p-5 border border-gray-200 text-center order-2 md:order-1 flex flex-col items-center shadow-xs">
                <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-800 font-bold text-base flex items-center justify-center mb-2 shadow-2xs">
                  2
                </div>
                <div className="text-[11px] font-semibold text-gray-500 uppercase">
                  {activeCategory === 'women' ? '2ème Féminine' : activeCategory === 'juniors' ? '2ème Junior' : "Médaille d'Argent"}
                </div>
                <div className="text-base font-bold text-gray-900 mt-1">
                  #{currentList[1].player.id} {currentList[1].player.name}
                </div>
                <div className="text-xs text-gray-500">{currentList[1].player.team}</div>
                <span className="mt-3 inline-block px-2.5 py-1 rounded-md bg-gray-100 text-gray-800 text-xs font-semibold">
                  {currentList[1].totalPins} quilles (moy. {currentList[1].average})
                </span>
              </div>
            )}

            {/* 1st Place */}
            {currentList[0] && (
              <div
                className={`rounded-xl p-6 border-2 text-center order-1 md:order-2 flex flex-col items-center shadow-xs ${
                  activeCategory === 'women'
                    ? 'bg-pink-600 text-white border-pink-700'
                    : activeCategory === 'juniors'
                    ? 'bg-amber-600 text-white border-amber-700'
                    : 'bg-gray-900 text-white border-gray-900'
                }`}
              >
                <div className="w-14 h-14 rounded-full bg-white text-gray-950 font-black text-xl flex items-center justify-center mb-2 shadow-2xs">
                  1
                </div>
                <div className="text-xs font-bold uppercase flex items-center gap-1 opacity-90">
                  <Crown className="w-3.5 h-3.5 text-amber-300" />
                  <span>
                    {activeCategory === 'women'
                      ? 'CHAMPIONNE FÉMININE'
                      : activeCategory === 'juniors'
                      ? 'CHAMPION JUNIOR (<18)'
                      : 'CHAMPION (OR)'}
                  </span>
                </div>
                <div className="text-lg font-bold mt-1">
                  #{currentList[0].player.id} {currentList[0].player.name}
                </div>
                <div className="text-xs font-medium opacity-80">{currentList[0].player.team}</div>
                <span className="mt-3 inline-block px-3 py-1 rounded-md bg-white/20 text-white text-xs font-bold shadow-2xs">
                  {currentList[0].totalPins} quilles (moy. {currentList[0].average})
                </span>
              </div>
            )}

            {/* 3rd Place */}
            {currentList[2] && (
              <div className="bg-white rounded-xl p-5 border border-gray-200 text-center order-3 flex flex-col items-center shadow-xs">
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-900 font-bold text-base flex items-center justify-center mb-2 shadow-2xs border border-amber-200">
                  3
                </div>
                <div className="text-[11px] font-semibold text-amber-800 uppercase">
                  {activeCategory === 'women' ? '3ème Féminine' : activeCategory === 'juniors' ? '3ème Junior' : 'Médaille de Bronze'}
                </div>
                <div className="text-base font-bold text-gray-900 mt-1">
                  #{currentList[2].player.id} {currentList[2].player.name}
                </div>
                <div className="text-xs text-gray-500">{currentList[2].player.team}</div>
                <span className="mt-3 inline-block px-2.5 py-1 rounded-md bg-amber-50 text-amber-900 text-xs font-semibold border border-amber-200">
                  {currentList[2].totalPins} quilles (moy. {currentList[2].average})
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full Leaderboard Table for the active selection */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
            <Award className="w-4 h-4 text-gray-700" />
            <span>
              Tableau d'Honneur — {getCategoryTitle()} ({filteredList.length} / {currentList.length})
            </span>
          </h3>

          <div className="flex items-center gap-2">
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
        </div>

        <div className="overflow-x-auto max-h-[600px] scrollbar-thin">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-gray-50/80 text-gray-600 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10 border-b border-gray-200">
              <tr>
                <th className="py-3 px-3 w-16 text-center">Rang</th>
                {activeCategory !== 'overall' && (
                  <th className="py-3 px-2 text-center w-16 text-gray-500">Scratch</th>
                )}
                <th className="py-3 px-3">Quilleur (N° & Nom)</th>
                <th className="py-3 px-2 text-center w-24">Catégorie</th>
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
                const rank = item.categoryRank || index + 1;
                const gender = item.player.gender || 'H';
                const isUnder18 = item.player.isUnder18;

                return (
                  <tr
                    key={item.player.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      rank === 1
                        ? activeCategory === 'women'
                          ? 'bg-pink-50/30 font-semibold'
                          : activeCategory === 'juniors'
                          ? 'bg-amber-50/30 font-semibold'
                          : 'bg-emerald-50/20 font-semibold'
                        : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-[11px] font-bold ${
                          rank === 1
                            ? activeCategory === 'women'
                              ? 'bg-pink-600 text-white'
                              : activeCategory === 'juniors'
                              ? 'bg-amber-600 text-white'
                              : 'bg-gray-900 text-white'
                            : rank === 2
                            ? 'bg-gray-200 text-gray-800'
                            : rank === 3
                            ? 'bg-amber-100 text-amber-900 border border-amber-200'
                            : 'bg-gray-50 text-gray-600'
                        }`}
                      >
                        {rank}
                      </span>
                    </td>

                    {activeCategory !== 'overall' && (
                      <td className="py-2.5 px-2 text-center text-gray-500 font-mono text-[10px]">
                        #{item.overallRank}
                      </td>
                    )}

                    <td className="py-2.5 px-3 font-semibold text-gray-900">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-gray-800 font-bold bg-gray-100 px-1.5 py-0.5 rounded text-[11px] border border-gray-200">
                          #{item.player.id}
                        </span>
                        <span>{item.player.name}</span>
                      </div>
                    </td>

                    <td className="py-2.5 px-2 text-center">
                      <div className="flex items-center justify-center gap-1 flex-wrap">
                        {gender === 'F' ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-pink-50 text-pink-700 border border-pink-200 text-[10px] font-bold">
                            ♀ F
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 text-[10px] font-bold">
                            ♂ H
                          </span>
                        )}
                        {isUnder18 && (
                          <span className="inline-flex items-center px-1 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-300 text-[9.5px] font-extrabold">
                            -18
                          </span>
                        )}
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
