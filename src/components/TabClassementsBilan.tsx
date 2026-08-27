import React, { useState } from 'react';
import { TournamentData, Player } from '../types/tournament';
import { exportPalmaresPDF, exportTeamStandingsPDF } from '../utils/pdfExport';
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
  Sparkles,
  Heart,
  Baby,
  Shield,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';

interface TabClassementsBilanProps {
  tournament: TournamentData;
  playersMap: Map<number, Player>;
}

export type ClassementCategory = 'overall' | 'women' | 'juniors' | 'teams' | 'all_podiums' | 'men';

export const TabClassementsBilan: React.FC<TabClassementsBilanProps> = ({
  tournament,
  playersMap,
}) => {
  const [activeCategory, setActiveCategory] = useState<ClassementCategory>('overall');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);

  // 1. Calculations for Individual Players
  const finalMatches = tournament.finalMatches;
  const grandFinal = finalMatches.find((m) => m.round === 'final' && m.isComplete);
  const bronzeMatch = finalMatches.find((m) => m.round === 'thirdPlace' && m.isComplete);

  const champion = grandFinal?.winnerId ? playersMap.get(grandFinal.winnerId) : null;
  const viceChampion = grandFinal?.loserId ? playersMap.get(grandFinal.loserId) : null;
  const thirdPlace = bronzeMatch?.winnerId ? playersMap.get(bronzeMatch.winnerId) : null;
  const fourthPlace = bronzeMatch?.loserId ? playersMap.get(bronzeMatch.loserId) : null;

  // Compute individual stats for all players
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

  // 2. Calculations for Team Standings
  const teamStandings = calculateTeamStandings(tournament, playersMap);
  const teamPodium = teamStandings.slice(0, 3);

  // Active individual list according to active category
  let currentIndividualList: Array<typeof overallPlayerStats[0] & { categoryRank?: number }> = [];
  if (activeCategory === 'overall' || activeCategory === 'all_podiums') {
    currentIndividualList = overallPlayerStats.map((item) => ({ ...item, categoryRank: item.overallRank }));
  } else if (activeCategory === 'women') {
    currentIndividualList = womenStats;
  } else if (activeCategory === 'juniors') {
    currentIndividualList = juniorStats;
  } else if (activeCategory === 'men') {
    currentIndividualList = menStats;
  }

  // Filtered individual list
  const filteredIndividualList = currentIndividualList.filter(
    (item) =>
      item.player.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.player.id.toString().includes(searchTerm) ||
      item.player.team.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filtered teams list
  const filteredTeamList = teamStandings.filter(
    (team) =>
      team.teamName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      team.players.some((p) => p.playerName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Global Statistics
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

  const getCategoryTitle = () => {
    switch (activeCategory) {
      case 'women':
        return 'Classement Féminin (Dames)';
      case 'juniors':
        return 'Classement Juniors (< 18 ans)';
      case 'teams':
        return 'Classement Général par Équipes';
      case 'men':
        return 'Classement Hommes (Messieurs)';
      case 'all_podiums':
        return 'Synthèse de Tous les Podiums Officiels';
      case 'overall':
      default:
        return 'Classement Général Scratch';
    }
  };

  const handlePrintPDF = () => {
    const title = tournament.title || 'Olympiades du Rampeau';

    if (activeCategory === 'teams') {
      exportTeamStandingsPDF({
        title,
        standings: teamStandings,
      });
      return;
    }

    const categoryTitle = getCategoryTitle();
    const itemsToExport = (activeCategory === 'all_podiums' ? overallPlayerStats : currentIndividualList).map(
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
          ? `Classement officiel des ${womenCount} quilleuses féminines`
          : activeCategory === 'juniors'
          ? `Classement officiel des ${juniorCount} quilleurs de moins de 18 ans`
          : `Classement officiel de la compétition (${overallPlayerStats.length} quilleurs)`,
      items: itemsToExport,
      showCategoryColumn: activeCategory === 'overall' || activeCategory === 'all_podiums',
    });
  };

  const handleExportCSV = () => {
    if (activeCategory === 'teams') {
      const headers = ['Rang', 'Équipe', 'Points Équipe', 'Nb Quilleurs', 'Total Quilles Abattues', 'En Lice', 'Éliminés'];
      const rows = teamStandings.map((team, idx) => [
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
      return;
    }

    let filenamePrefix = 'classement_general_scratch';
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
      'Équipe',
      'Tour 1',
      'Tour 2',
      'Tour 3',
      'Phases Finales',
      'Total Quilles',
      'Nb Tirs',
      'Moyenne',
      'Stade Atteint',
    ];

    const rows = currentIndividualList.map((p) => [
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
              <span>Classements & Bilan Officiels de la Compétition</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
              Classements & Bilan
            </h2>
            <p className="text-xs text-gray-600 max-w-3xl">
              Consultez l'ensemble des classements officiels : <strong>Général (Scratch)</strong>,{' '}
              <strong>Féminin</strong>, <strong>Juniors (&lt; 18 ans)</strong>, <strong>Équipes</strong> et la synthèse de tous les podiums.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              id="btn-print-classements-pdf"
              onClick={handlePrintPDF}
              className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
            >
              <Printer className="w-4 h-4 text-gray-500" />
              <span>Imprimer PDF</span>
            </button>
            <button
              type="button"
              id="btn-export-classements-csv"
              onClick={handleExportCSV}
              className="px-3.5 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>
                Exporter CSV ({activeCategory === 'teams' ? 'Équipes' : activeCategory === 'women' ? 'Femmes' : activeCategory === 'juniors' ? 'Juniors' : 'Général'})
              </span>
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
              : 'bg-amber-50/60 text-amber-900 hover:bg-amber-100/80 border border-amber-200'
          }`}
        >
          <span>🌟 Juniors (&lt; 18 ans)</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeCategory === 'juniors' ? 'bg-amber-700 text-white' : 'bg-amber-200 text-amber-900 font-bold'}`}>
            {juniorCount}
          </span>
        </button>

        <button
          type="button"
          id="tab-btn-cat-teams"
          onClick={() => setActiveCategory('teams')}
          className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeCategory === 'teams'
              ? 'bg-blue-600 text-white shadow-2xs ring-2 ring-blue-600/20'
              : 'bg-blue-50/60 text-blue-900 hover:bg-blue-100/80 border border-blue-200'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Classement par Équipes</span>
          <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeCategory === 'teams' ? 'bg-blue-700 text-white' : 'bg-blue-200 text-blue-900 font-bold'}`}>
            {teamStandings.length}
          </span>
        </button>

        <button
          type="button"
          id="tab-btn-cat-all-podiums"
          onClick={() => setActiveCategory('all_podiums')}
          className={`flex-1 sm:flex-initial px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeCategory === 'all_podiums'
              ? 'bg-emerald-700 text-white shadow-2xs'
              : 'bg-emerald-50/60 text-emerald-900 hover:bg-emerald-100/80 border border-emerald-200'
          }`}
        >
          <Crown className="w-4 h-4 text-amber-300" />
          <span>Synthèse des Podiums</span>
        </button>

        <button
          type="button"
          id="tab-btn-cat-men"
          onClick={() => setActiveCategory('men')}
          className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            activeCategory === 'men'
              ? 'bg-gray-800 text-white shadow-2xs'
              : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          <span>♂ Hommes</span>
        </button>
      </div>

      {/* Global Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs">
          <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
            Total Quilleurs
          </div>
          <div className="text-xl font-bold text-gray-900 mt-1">
            {overallPlayerStats.length}
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">
            {womenCount} femmes • {juniorCount} juniors
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs">
          <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
            Équipes
          </div>
          <div className="text-xl font-bold text-gray-900 mt-1">
            {teamStandings.length}
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">
            Équipes en compétition
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs">
          <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
            Quilles Abattues
          </div>
          <div className="text-xl font-bold text-gray-900 mt-1">
            {grandTotalPins}
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">
            {grandTotalThrows} lancers officiels
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs">
          <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
            Moyenne Générale
          </div>
          <div className="text-xl font-bold text-gray-900 mt-1">
            {globalAverage} <span className="text-xs font-normal text-gray-500">/ 9</span>
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">
            Sur l'ensemble des tours
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs">
          <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
            1ère Féminine
          </div>
          <div className="text-base font-bold text-pink-700 mt-1 truncate">
            {bestWoman ? bestWoman.player.name : 'En cours'}
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">
            {bestWoman ? `${bestWoman.totalPins} q. (Moy. ${bestWoman.average})` : '-'}
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs">
          <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
            1er Junior (&lt;18)
          </div>
          <div className="text-base font-bold text-amber-700 mt-1 truncate">
            {bestJunior ? bestJunior.player.name : 'En cours'}
          </div>
          <div className="text-[10px] text-gray-500 mt-0.5">
            {bestJunior ? `${bestJunior.totalPins} q. (Moy. ${bestJunior.average})` : '-'}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. VUE CLASSEMENT PAR ÉQUIPES */}
      {/* ========================================================================= */}
      {activeCategory === 'teams' && (
        <div className="space-y-6">
          {/* Top 3 Teams Podium Cards */}
          {teamPodium.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {teamPodium.map((team, idx) => {
                const medals = [
                  { color: 'border-gray-900 bg-white', badge: 'bg-gray-900 text-white', label: '1ère Équipe Vainqueur (Or)', icon: Trophy },
                  { color: 'border-gray-200 bg-white', badge: 'bg-gray-100 text-gray-700 border border-gray-200', label: '2ème Équipe (Argent)', icon: Medal },
                  { color: 'border-gray-200 bg-white', badge: 'bg-gray-100 text-gray-700 border border-gray-200', label: '3ème Équipe (Bronze)', icon: Medal },
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

                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
                      <span className="text-emerald-700 font-medium">{team.activePlayerCount} en lice</span>
                      <span className="text-gray-400">{team.eliminatedPlayerCount} éliminés</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Barème de points explicatif */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs">
            <div className="text-xs font-bold text-gray-900 mb-2 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-600" />
              <span>Barème Officiel d'Attribution des Points par Quilleur :</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 text-[11px]">
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

          {/* Search bar */}
          <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-xs flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher une équipe ou un quilleur..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div className="text-xs text-gray-500">
              {filteredTeamList.length} équipe(s)
            </div>
          </div>

          {/* Teams Standings Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-600 text-[11px] uppercase tracking-wider font-semibold border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4 w-16 text-center">Rang</th>
                    <th className="py-3 px-4">Équipe</th>
                    <th className="py-3 px-4 text-center font-bold text-gray-900">Total Points</th>
                    <th className="py-3 px-4 text-center">Quilleurs</th>
                    <th className="py-3 px-4 text-center">Quilles Abattues</th>
                    <th className="py-3 px-4 text-center text-emerald-700">En Lice</th>
                    <th className="py-3 px-4 text-center text-gray-500">Éliminés</th>
                    <th className="py-3 px-4 text-right">Détails Joueurs</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredTeamList.map((team, idx) => {
                    const isExpanded = expandedTeam === team.teamName;
                    const isLeader = idx === 0;

                    return (
                      <React.Fragment key={team.teamName}>
                        <tr
                          className={`hover:bg-gray-50/80 transition-colors cursor-pointer ${
                            isLeader ? 'bg-emerald-50/40 font-medium' : ''
                          }`}
                          onClick={() =>
                            setExpandedTeam(isExpanded ? null : team.teamName)
                          }
                        >
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-flex items-center justify-center w-6 h-6 rounded-md font-bold text-xs ${
                                idx === 0
                                  ? 'bg-gray-900 text-white'
                                  : idx === 1
                                  ? 'bg-gray-200 text-gray-800'
                                  : idx === 2
                                  ? 'bg-gray-100 text-gray-700'
                                  : 'text-gray-500'
                              }`}
                            >
                              {idx + 1}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-gray-900">{team.teamName}</div>
                            <div className="text-[10px] text-gray-500">
                              {team.playerCount} membre(s) dans le tableau
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-gray-900 text-white font-bold text-xs">
                              {team.totalPoints} pts
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-medium text-gray-700">
                            {team.playerCount}
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-medium text-gray-800">
                            {team.totalPins}
                          </td>
                          <td className="py-3 px-4 text-center text-emerald-700 font-semibold">
                            {team.activePlayerCount}
                          </td>
                          <td className="py-3 px-4 text-center text-gray-400">
                            {team.eliminatedPlayerCount}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 text-xs text-gray-600 hover:text-gray-900"
                            >
                              <span>{isExpanded ? 'Masquer' : 'Voir'}</span>
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </td>
                        </tr>

                        {/* Accordion Row with Player Breakdown */}
                        {isExpanded && (
                          <tr className="bg-gray-50/90">
                            <td colSpan={8} className="py-3 px-6">
                              <div className="text-xs font-semibold text-gray-700 mb-2">
                                Détail des points rapportés par les quilleurs de « {team.teamName} » :
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                {team.players.map((p) => (
                                  <div
                                    key={p.playerId}
                                    className="bg-white p-2.5 rounded-lg border border-gray-200 flex items-center justify-between text-xs shadow-2xs"
                                  >
                                    <div>
                                      <div className="font-bold text-gray-900">
                                        #{p.playerId} {p.playerName}
                                      </div>
                                      <div className="text-[10px] text-gray-500">
                                        {p.stageReached} • {p.totalPinsKnocked} quilles
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <span className="font-bold text-emerald-700 text-sm">
                                        +{p.points} pts
                                      </span>
                                    </div>
                                  </div>
                                ))}
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
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. VUE SYNTHÈSE DE TOUS LES PODIUMS */}
      {/* ========================================================================= */}
      {activeCategory === 'all_podiums' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 1. Podium Scratch Général */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-gray-800" />
                    <h3 className="text-sm font-bold text-gray-900">Podium Général (Scratch)</h3>
                  </div>
                  <span className="text-[11px] text-gray-500 font-semibold">{overallPlayerStats.length} quilleurs</span>
                </div>

                <div className="space-y-3">
                  {overallPodium.map((item, idx) => {
                    const medals = [
                      { badge: '🥇 1er Vainqueur', bg: 'bg-gray-900 text-white', label: 'Champion' },
                      { badge: '🥈 2ème Place', bg: 'bg-gray-100 text-gray-800 border border-gray-200', label: 'Vice-Champion' },
                      { badge: '🥉 3ème Place', bg: 'bg-gray-100 text-gray-800 border border-gray-200', label: 'Bronze' },
                    ];
                    const meta = medals[idx];
                    return (
                      <div key={item.player.id} className="p-3 rounded-lg border border-gray-200 bg-gray-50/50 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${meta.bg}`}>
                            {meta.badge}
                          </span>
                          <div>
                            <div className="font-bold text-gray-900 text-xs">
                              {item.player.name}
                            </div>
                            <div className="text-[10px] text-gray-500">
                              {item.player.team} • #{item.player.id}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-gray-900 text-xs">{item.totalPins} q.</div>
                          <div className="text-[10px] text-gray-500">Moy. {item.average}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveCategory('overall')}
                className="mt-4 text-xs font-semibold text-gray-700 hover:text-gray-900 text-center block pt-2 border-t border-gray-100"
              >
                Voir tout le classement général →
              </button>
            </div>

            {/* 2. Podium Féminin */}
            <div className="bg-white rounded-xl border border-pink-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-pink-100 mb-4">
                  <div className="flex items-center gap-2 text-pink-700">
                    <Trophy className="w-4 h-4" />
                    <h3 className="text-sm font-bold text-pink-900">Podium Féminin (Dames)</h3>
                  </div>
                  <span className="text-[11px] text-pink-700 font-semibold">{womenCount} quilleuses</span>
                </div>

                <div className="space-y-3">
                  {womenPodium.length > 0 ? (
                    womenPodium.map((item, idx) => {
                      const medals = [
                        { badge: '🥇 1ère Féminine', bg: 'bg-pink-600 text-white', label: 'Championne' },
                        { badge: '🥈 2ème Féminine', bg: 'bg-pink-100 text-pink-900 border border-pink-200', label: '2e Dames' },
                        { badge: '🥉 3ème Féminine', bg: 'bg-pink-50 text-pink-800 border border-pink-200', label: '3e Dames' },
                      ];
                      const meta = medals[idx];
                      return (
                        <div key={item.player.id} className="p-3 rounded-lg border border-pink-100 bg-pink-50/30 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${meta.bg}`}>
                              {meta.badge}
                            </span>
                            <div>
                              <div className="font-bold text-pink-950 text-xs">
                                {item.player.name}
                              </div>
                              <div className="text-[10px] text-pink-700/70">
                                {item.player.team} • Rang Scratch: #{item.overallRank}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-pink-950 text-xs">{item.totalPins} q.</div>
                            <div className="text-[10px] text-pink-700">Moy. {item.average}</div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-xs text-gray-500 py-6 text-center">Aucune quilleuse enregistrée</div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveCategory('women')}
                className="mt-4 text-xs font-semibold text-pink-700 hover:text-pink-900 text-center block pt-2 border-t border-pink-100"
              >
                Voir tout le classement féminin →
              </button>
            </div>

            {/* 3. Podium Juniors */}
            <div className="bg-white rounded-xl border border-amber-200 p-5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-amber-100 mb-4">
                  <div className="flex items-center gap-2 text-amber-700">
                    <Trophy className="w-4 h-4" />
                    <h3 className="text-sm font-bold text-amber-950">Podium Juniors (&lt; 18 ans)</h3>
                  </div>
                  <span className="text-[11px] text-amber-700 font-semibold">{juniorCount} juniors</span>
                </div>

                <div className="space-y-3">
                  {juniorPodium.length > 0 ? (
                    juniorPodium.map((item, idx) => {
                      const medals = [
                        { badge: '🥇 1er Junior', bg: 'bg-amber-600 text-white', label: 'Champion Junior' },
                        { badge: '🥈 2ème Junior', bg: 'bg-amber-100 text-amber-950 border border-amber-200', label: '2e Junior' },
                        { badge: '🥉 3ème Junior', bg: 'bg-amber-50 text-amber-900 border border-amber-200', label: '3e Junior' },
                      ];
                      const meta = medals[idx];
                      return (
                        <div key={item.player.id} className="p-3 rounded-lg border border-amber-100 bg-amber-50/30 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${meta.bg}`}>
                              {meta.badge}
                            </span>
                            <div>
                              <div className="font-bold text-amber-950 text-xs">
                                {item.player.name}
                              </div>
                              <div className="text-[10px] text-amber-700/70">
                                {item.player.team} • Rang Scratch: #{item.overallRank}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-amber-950 text-xs">{item.totalPins} q.</div>
                            <div className="text-[10px] text-amber-700">Moy. {item.average}</div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-xs text-gray-500 py-6 text-center">Aucun junior enregistré</div>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveCategory('juniors')}
                className="mt-4 text-xs font-semibold text-amber-700 hover:text-amber-900 text-center block pt-2 border-t border-amber-100"
              >
                Voir tout le classement juniors →
              </button>
            </div>
          </div>

          {/* 4. Podium par Équipes */}
          <div className="bg-white rounded-xl border border-blue-200 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-blue-100 mb-4">
              <div className="flex items-center gap-2 text-blue-700">
                <Shield className="w-4 h-4" />
                <h3 className="text-sm font-bold text-blue-950">Podium du Classement par Équipes</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveCategory('teams')}
                className="text-xs font-semibold text-blue-700 hover:text-blue-900"
              >
                Voir le classement complet des {teamStandings.length} équipes →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {teamPodium.map((team, idx) => {
                const medals = [
                  { label: '🥇 1ère Équipe Vainqueur', badge: 'bg-blue-600 text-white' },
                  { label: '🥈 2ème Équipe', badge: 'bg-blue-100 text-blue-900 border border-blue-200' },
                  { label: '🥉 3ème Équipe', badge: 'bg-blue-50 text-blue-800 border border-blue-200' },
                ];
                const meta = medals[idx];
                return (
                  <div key={team.teamName} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${meta.badge}`}>
                        {meta.label}
                      </span>
                      <span className="text-xl font-bold text-gray-900">{team.totalPoints} pts</span>
                    </div>
                    <div className="text-sm font-bold text-gray-900">{team.teamName}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {team.playerCount} quilleurs • {team.totalPins} quilles
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. VUE CLASSEMENT INDIVIDUEL (GÉNÉRAL / FÉMININ / JUNIORS / HOMMES) */}
      {/* ========================================================================= */}
      {activeCategory !== 'teams' && activeCategory !== 'all_podiums' && (
        <div className="space-y-6">
          {/* Podium Top 3 Cards for this category */}
          {currentIndividualList.length >= 3 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 2nd place */}
              {currentIndividualList[1] && (
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs flex flex-col justify-between order-2 md:order-1">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200 flex items-center gap-1">
                      <Medal className="w-3.5 h-3.5" />
                      <span>2ème Place (Argent)</span>
                    </span>
                    <span className="text-xl font-bold text-gray-900">
                      {currentIndividualList[1].totalPins} <span className="text-xs font-medium text-gray-500">quilles</span>
                    </span>
                  </div>
                  <div className="my-3">
                    <h3 className="text-base font-bold text-gray-900 leading-tight">
                      {currentIndividualList[1].player.name}
                    </h3>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {currentIndividualList[1].player.team} • #{currentIndividualList[1].player.id}
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
                    <span>Moyenne : <strong>{currentIndividualList[1].average}</strong></span>
                    <span className="text-[11px] text-gray-500">{currentIndividualList[1].finalTitle}</span>
                  </div>
                </div>
              )}

              {/* 1st place */}
              {currentIndividualList[0] && (
                <div className="bg-white rounded-xl border-2 border-gray-900 p-5 shadow-xs flex flex-col justify-between order-1 md:order-2 ring-2 ring-gray-900/5">
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 rounded-md text-xs font-bold bg-gray-900 text-white flex items-center gap-1.5 shadow-2xs">
                      <Trophy className="w-4 h-4 text-amber-300" />
                      <span>1ère Place (Vainqueur)</span>
                    </span>
                    <span className="text-2xl font-extrabold text-gray-900">
                      {currentIndividualList[0].totalPins} <span className="text-xs font-medium text-gray-500">quilles</span>
                    </span>
                  </div>
                  <div className="my-3">
                    <h3 className="text-lg font-bold text-gray-900 leading-tight">
                      {currentIndividualList[0].player.name}
                    </h3>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {currentIndividualList[0].player.team} • #{currentIndividualList[0].player.id}
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-700">
                    <span>Moyenne : <strong>{currentIndividualList[0].average}</strong> / 9</span>
                    <span className="text-[11px] font-semibold text-emerald-800">{currentIndividualList[0].finalTitle}</span>
                  </div>
                </div>
              )}

              {/* 3rd place */}
              {currentIndividualList[2] && (
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs flex flex-col justify-between order-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200 flex items-center gap-1">
                      <Medal className="w-3.5 h-3.5" />
                      <span>3ème Place (Bronze)</span>
                    </span>
                    <span className="text-xl font-bold text-gray-900">
                      {currentIndividualList[2].totalPins} <span className="text-xs font-medium text-gray-500">quilles</span>
                    </span>
                  </div>
                  <div className="my-3">
                    <h3 className="text-base font-bold text-gray-900 leading-tight">
                      {currentIndividualList[2].player.name}
                    </h3>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {currentIndividualList[2].player.team} • #{currentIndividualList[2].player.id}
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
                    <span>Moyenne : <strong>{currentIndividualList[2].average}</strong></span>
                    <span className="text-[11px] text-gray-500">{currentIndividualList[2].finalTitle}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Search bar */}
          <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-xs flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher un quilleur par nom, numéro ou équipe..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div className="text-xs text-gray-500">
              {filteredIndividualList.length} quilleur(s)
            </div>
          </div>

          {/* Individual Leaderboard Table */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-600 text-[11px] uppercase tracking-wider font-semibold border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4 w-16 text-center">Rang</th>
                    {activeCategory !== 'overall' && (
                      <th className="py-3 px-2 text-center text-gray-400" title="Rang Général Scratch">Scratch</th>
                    )}
                    <th className="py-3 px-4 w-16 text-center">Dossard</th>
                    <th className="py-3 px-4">Quilleur</th>
                    <th className="py-3 px-4">Équipe</th>
                    <th className="py-3 px-3 text-center">Catégorie</th>
                    <th className="py-3 px-3 text-center">Tour 1</th>
                    <th className="py-3 px-3 text-center">Tour 2</th>
                    <th className="py-3 px-3 text-center">Tour 3</th>
                    <th className="py-3 px-3 text-center">Finales</th>
                    <th className="py-3 px-3 text-center font-bold text-gray-900">Total</th>
                    <th className="py-3 px-3 text-center">Moyenne</th>
                    <th className="py-3 px-4 text-right">Stade Atteint</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredIndividualList.map((item, idx) => {
                    const isTop3 = (item.categoryRank || idx + 1) <= 3;
                    const isChampion = (item.categoryRank || idx + 1) === 1;

                    return (
                      <tr
                        key={item.player.id}
                        className={`hover:bg-gray-50/80 transition-colors ${
                          isChampion ? 'bg-emerald-50/30' : ''
                        }`}
                      >
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded-md font-bold text-xs ${
                              item.categoryRank === 1
                                ? 'bg-gray-900 text-white'
                                : item.categoryRank === 2
                                ? 'bg-gray-200 text-gray-800'
                                : item.categoryRank === 3
                                ? 'bg-gray-100 text-gray-700'
                                : 'text-gray-500'
                            }`}
                          >
                            {item.categoryRank || idx + 1}
                          </span>
                        </td>

                        {activeCategory !== 'overall' && (
                          <td className="py-3 px-2 text-center text-xs text-gray-400 font-mono">
                            #{item.overallRank}
                          </td>
                        )}

                        <td className="py-3 px-4 text-center font-mono font-medium text-gray-500">
                          #{item.player.id}
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-bold text-gray-900 flex items-center gap-1.5">
                            <span>{item.player.name}</span>
                            {item.player.gender === 'F' && (
                              <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-pink-100 text-pink-800">
                                ♀ F
                              </span>
                            )}
                            {item.player.isUnder18 && (
                              <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-amber-100 text-amber-900">
                                -18
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-4 text-gray-600">
                          {item.player.team || 'Individuel'}
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span className="text-[11px] text-gray-500">
                            {item.player.gender === 'F' ? 'Féminin' : 'Masculin'}
                            {item.player.isUnder18 ? ' • Junior' : ''}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center font-mono font-medium text-gray-700">
                          {item.t1Score > 0 ? item.t1Score : '-'}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-medium text-gray-700">
                          {item.t2Score > 0 ? item.t2Score : '-'}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-medium text-gray-700">
                          {item.t3Score > 0 ? item.t3Score : '-'}
                        </td>
                        <td className="py-3 px-3 text-center font-mono font-medium text-emerald-700">
                          {item.finalsScore > 0 ? `+${item.finalsScore}` : '-'}
                        </td>

                        <td className="py-3 px-3 text-center">
                          <span className="inline-flex items-center px-2 py-0.5 rounded font-bold text-xs bg-gray-100 text-gray-900">
                            {item.totalPins}
                          </span>
                        </td>

                        <td className="py-3 px-3 text-center font-mono font-semibold text-gray-700">
                          {item.average}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-gray-100 text-gray-700">
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
      )}
    </div>
  );
};

// Export also as TabPalmaresStats for smooth backward compatibility
export const TabPalmaresStats = TabClassementsBilan;
