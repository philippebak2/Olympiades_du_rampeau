import React, { useState, useEffect, useMemo } from 'react';
import {
  TournamentData,
  TournamentTab,
  Player,
  TournamentSettings,
  Poule,
  FinalMatch,
} from './types/tournament';
import {
  INITIAL_TOURNAMENT_DATA,
  DEFAULT_SETTINGS,
  generateSamplePlayers,
} from './utils/sampleData';
import {
  generateTour1,
  generateTour2,
  generateTour3,
  generateFinals,
  propagateFinalMatches,
  sortPoulePlayers,
} from './utils/tournamentLogic';
import { Header } from './components/Header';
import { TabParticipants } from './components/TabParticipants';
import { TabTour1 } from './components/TabTour1';
import { TabTour2 } from './components/TabTour2';
import { TabTour3 } from './components/TabTour3';
import { TabPhasesFinales } from './components/TabPhasesFinales';
import { TabClassementsBilan } from './components/TabClassementsBilan';
import { BigScreenView } from './components/BigScreenView';
import { TournamentPipelineVisualizer } from './components/TournamentPipelineVisualizer';

const STORAGE_KEY = 'quilles_tournament_data_v1';

export default function App() {
  const [tournament, setTournament] = useState<TournamentData>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (err) {
      console.error('Erreur chargement localStorage', err);
    }
    return INITIAL_TOURNAMENT_DATA;
  });

  const [currentTab, setCurrentTab] = useState<TournamentTab>('participants');
  const [isBigScreen, setIsBigScreen] = useState(false);

  // Auto-save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tournament));
    } catch (e) {
      console.error('Erreur sauvegarde localStorage', e);
    }
  }, [tournament]);

  // Players Map for fast lookups
  const playersMap = useMemo(() => {
    const map = new Map<number, Player>();
    tournament.players.forEach((p) => map.set(p.id, p));
    return map;
  }, [tournament.players]);

  // 1. Inscriptions Handlers
  const handleAddPlayer = (newPlayerData: {
    name: string;
    team: string;
    gender?: 'H' | 'F';
    isUnder18?: boolean;
  }) => {
    setTournament((prev) => {
      const nextId =
        prev.players.length > 0
          ? Math.max(...prev.players.map((p) => p.id)) + 1
          : 1;
      const newPlayer: Player = {
        id: nextId,
        name: newPlayerData.name,
        team: newPlayerData.team,
        gender: newPlayerData.gender || 'H',
        isUnder18: !!newPlayerData.isUnder18,
      };
      return {
        ...prev,
        players: [...prev.players, newPlayer],
      };
    });
  };

  const handleUpdatePlayer = (
    id: number,
    updated: {
      name: string;
      team: string;
      gender?: 'H' | 'F';
      isUnder18?: boolean;
    }
  ) => {
    setTournament((prev) => ({
      ...prev,
      players: prev.players.map((p) => (p.id === id ? { ...p, ...updated } : p)),
    }));
  };

  const handleDeletePlayer = (id: number) => {
    setTournament((prev) => ({
      ...prev,
      players: prev.players.filter((p) => p.id !== id),
    }));
  };

  const handleBatchAddPlayers = (
    newItems: Array<{
      name: string;
      team: string;
      gender?: 'H' | 'F';
      isUnder18?: boolean;
    }>
  ) => {
    setTournament((prev) => {
      let currentMaxId =
        prev.players.length > 0
          ? Math.max(...prev.players.map((p) => p.id))
          : 0;

      const created: Player[] = newItems.map((item) => {
        currentMaxId++;
        return {
          id: currentMaxId,
          name: item.name,
          team: item.team,
          gender: item.gender || 'H',
          isUnder18: !!item.isUnder18,
        };
      });

      return {
        ...prev,
        players: [...prev.players, ...created],
      };
    });
  };

  const handleClearAllPlayers = () => {
    setTournament((prev) => ({
      ...prev,
      players: [],
      tour1Poules: [],
      tour2Poules: [],
      tour3Poules: [],
      finalMatches: [],
      isTour1Started: false,
      isTour2Started: false,
      isTour3Started: false,
      isFinalsStarted: false,
    }));
  };

  const handleLoadSamplePlayers = (count: number = 160) => {
    const samplePlayers = generateSamplePlayers(count);
    setTournament((prev) => ({
      ...prev,
      players: samplePlayers,
      settings: {
        ...prev.settings,
        round1PoolCount: count === 160 ? 16 : 8,
        round1QualifiersPerPool: 5,
      },
    }));
  };

  const handleUpdateSettings = (newSettings: Partial<TournamentSettings>) => {
    setTournament((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        ...newSettings,
      },
    }));
  };

  // 2. Tour 1 Handlers
  const handleGenerateTour1 = () => {
    if (tournament.players.length === 0) return;
    const poules = generateTour1(tournament.players, tournament.settings);
    setTournament((prev) => ({
      ...prev,
      tour1Poules: poules,
      tour2Poules: [],
      tour3Poules: [],
      finalMatches: [],
      isTour1Started: true,
      isTour2Started: false,
      isTour3Started: false,
      isFinalsStarted: false,
    }));
    setCurrentTab('tour1');
  };

  const handleUpdateScoreTour1 = (
    pouleId: string,
    playerId: number,
    throwIndex: number,
    pins: number
  ) => {
    setTournament((prev) => {
      const updatedPoules = prev.tour1Poules.map((poule) => {
        if (poule.id !== pouleId) return poule;
        const updatedScores = poule.playerScores.map((ps) => {
          if (ps.playerId !== playerId) return ps;
          const newTirs = [...ps.tirs];
          newTirs[throwIndex] = pins;
          return {
            ...ps,
            tirs: newTirs,
          };
        });
        return {
          ...poule,
          playerScores: updatedScores,
        };
      });
      return {
        ...prev,
        tour1Poules: updatedPoules,
      };
    });
  };

  const handleUpdateTieBreakTour1 = (
    pouleId: string,
    playerId: number,
    tieBreakScore: number
  ) => {
    setTournament((prev) => {
      const updatedPoules = prev.tour1Poules.map((poule) => {
        if (poule.id !== pouleId) return poule;
        const updatedScores = poule.playerScores.map((ps) => {
          if (ps.playerId !== playerId) return ps;
          return {
            ...ps,
            tieBreakScore,
          };
        });
        return {
          ...poule,
          playerScores: updatedScores,
        };
      });
      return {
        ...prev,
        tour1Poules: updatedPoules,
      };
    });
  };

  const handleAutoSimulateTour1 = () => {
    setTournament((prev) => {
      const updated = prev.tour1Poules.map((poule) => ({
        ...poule,
        playerScores: poule.playerScores.map((ps) => {
          // Simulation réaliste de scores entre 3 et 9 quilles
          const r1 = Math.floor(Math.random() * 5) + 5; // 5 à 9
          const r2 = Math.floor(Math.random() * 5) + 4; // 4 à 8
          return {
            ...ps,
            tirs: [r1, r2],
            tieBreakScore: 0,
          };
        }),
      }));
      return {
        ...prev,
        tour1Poules: updated,
      };
    });
  };

  // 3. Tour 2 Handlers
  const handleAdvanceToTour2 = () => {
    const tour2Poules = generateTour2(
      tournament.tour1Poules,
      playersMap,
      tournament.settings
    );
    setTournament((prev) => ({
      ...prev,
      tour2Poules,
      isTour2Started: true,
    }));
    setCurrentTab('tour2');
  };

  const handleUpdateScoreTour2 = (
    pouleId: string,
    playerId: number,
    throwIndex: number,
    pins: number
  ) => {
    setTournament((prev) => {
      const updatedPoules = prev.tour2Poules.map((poule) => {
        if (poule.id !== pouleId) return poule;
        const updatedScores = poule.playerScores.map((ps) => {
          if (ps.playerId !== playerId) return ps;
          const newTirs = [...ps.tirs];
          newTirs[throwIndex] = pins;
          return {
            ...ps,
            tirs: newTirs,
          };
        });
        return {
          ...poule,
          playerScores: updatedScores,
        };
      });
      return {
        ...prev,
        tour2Poules: updatedPoules,
      };
    });
  };

  const handleUpdateTieBreakTour2 = (
    pouleId: string,
    playerId: number,
    tieBreakScore: number
  ) => {
    setTournament((prev) => {
      const updatedPoules = prev.tour2Poules.map((poule) => {
        if (poule.id !== pouleId) return poule;
        const updatedScores = poule.playerScores.map((ps) => {
          if (ps.playerId !== playerId) return ps;
          return {
            ...ps,
            tieBreakScore,
          };
        });
        return {
          ...poule,
          playerScores: updatedScores,
        };
      });
      return {
        ...prev,
        tour2Poules: updatedPoules,
      };
    });
  };

  const handleAutoSimulateTour2 = () => {
    setTournament((prev) => {
      const updated = prev.tour2Poules.map((poule) => ({
        ...poule,
        playerScores: poule.playerScores.map((ps) => {
          const r = Math.floor(Math.random() * 5) + 5;
          return {
            ...ps,
            tirs: [r],
            tieBreakScore: 0,
          };
        }),
      }));
      return {
        ...prev,
        tour2Poules: updated,
      };
    });
  };

  // 4. Tour 3 Handlers
  const handleAdvanceToTour3 = () => {
    const tour3Poules = generateTour3(
      tournament.tour2Poules,
      playersMap,
      tournament.settings
    );
    setTournament((prev) => ({
      ...prev,
      tour3Poules,
      isTour3Started: true,
    }));
    setCurrentTab('tour3');
  };

  const handleUpdateScoreTour3 = (
    pouleId: string,
    playerId: number,
    throwIndex: number,
    pins: number
  ) => {
    setTournament((prev) => {
      const updatedPoules = prev.tour3Poules.map((poule) => {
        if (poule.id !== pouleId) return poule;
        const updatedScores = poule.playerScores.map((ps) => {
          if (ps.playerId !== playerId) return ps;
          const newTirs = [...ps.tirs];
          newTirs[throwIndex] = pins;
          return {
            ...ps,
            tirs: newTirs,
          };
        });
        return {
          ...poule,
          playerScores: updatedScores,
        };
      });
      return {
        ...prev,
        tour3Poules: updatedPoules,
      };
    });
  };

  const handleUpdateTieBreakTour3 = (
    pouleId: string,
    playerId: number,
    tieBreakScore: number
  ) => {
    setTournament((prev) => {
      const updatedPoules = prev.tour3Poules.map((poule) => {
        if (poule.id !== pouleId) return poule;
        const updatedScores = poule.playerScores.map((ps) => {
          if (ps.playerId !== playerId) return ps;
          return {
            ...ps,
            tieBreakScore,
          };
        });
        return {
          ...poule,
          playerScores: updatedScores,
        };
      });
      return {
        ...prev,
        tour3Poules: updatedPoules,
      };
    });
  };

  const handleAutoSimulateTour3 = () => {
    setTournament((prev) => {
      const updated = prev.tour3Poules.map((poule) => ({
        ...poule,
        playerScores: poule.playerScores.map((ps) => {
          const r = Math.floor(Math.random() * 5) + 5;
          return {
            ...ps,
            tirs: [r],
            tieBreakScore: 0,
          };
        }),
      }));
      return {
        ...prev,
        tour3Poules: updated,
      };
    });
  };

  // 5. Phases Finales Handlers
  const handleAdvanceToFinals = () => {
    const finalMatches = generateFinals(tournament.tour3Poules, playersMap);
    setTournament((prev) => ({
      ...prev,
      finalMatches,
      isFinalsStarted: true,
    }));
    setCurrentTab('phasesFinales');
  };

  const handleUpdateMatchScore = (
    matchId: string,
    score1: number | null,
    score2: number | null,
    tieBreak1?: number | null,
    tieBreak2?: number | null
  ) => {
    setTournament((prev) => {
      let updatedMatches = prev.finalMatches.map((m) => {
        if (m.id !== matchId) return m;

        const isBothScored = score1 !== null && score2 !== null;
        let winnerId: number | null = null;
        let loserId: number | null = null;
        let isComplete = false;

        if (isBothScored && m.player1Id && m.player2Id) {
          const total1 = score1 + (tieBreak1 || 0);
          const total2 = score2 + (tieBreak2 || 0);

          if (total1 > total2) {
            winnerId = m.player1Id;
            loserId = m.player2Id;
            isComplete = true;
          } else if (total2 > total1) {
            winnerId = m.player2Id;
            loserId = m.player1Id;
            isComplete = true;
          } else {
            // Tie -> awaits tie break
            isComplete = false;
          }
        }

        return {
          ...m,
          score1,
          score2,
          tieBreak1: tieBreak1 ?? null,
          tieBreak2: tieBreak2 ?? null,
          winnerId,
          loserId,
          isComplete,
        };
      });

      // Propagate winners to subsequent rounds
      updatedMatches = propagateFinalMatches(updatedMatches);

      return {
        ...prev,
        finalMatches: updatedMatches,
      };
    });
  };

  const handleAutoSimulateFinals = () => {
    setTournament((prev) => {
      let currentMatches = [...prev.finalMatches];

      // Rounds in order
      const roundsOrder: Array<'roundOf16' | 'quarterFinals' | 'semiFinals' | 'thirdPlace' | 'final'> = [
        'roundOf16',
        'quarterFinals',
        'semiFinals',
        'thirdPlace',
        'final',
      ];

      roundsOrder.forEach((rName) => {
        currentMatches = currentMatches.map((m) => {
          if (m.round !== rName) return m;
          if (!m.player1Id || !m.player2Id) return m;

          let s1 = Math.floor(Math.random() * 4) + 6; // 6 to 9
          let s2 = Math.floor(Math.random() * 4) + 6;
          let tb1 = 0;
          let tb2 = 0;

          if (s1 === s2) {
            tb1 = 8;
            tb2 = 7;
          }

          const isP1Win = s1 + tb1 > s2 + tb2;

          return {
            ...m,
            score1: s1,
            score2: s2,
            tieBreak1: tb1 > 0 ? tb1 : null,
            tieBreak2: tb2 > 0 ? tb2 : null,
            winnerId: isP1Win ? m.player1Id : m.player2Id,
            loserId: isP1Win ? m.player2Id : m.player1Id,
            isComplete: true,
          };
        });

        currentMatches = propagateFinalMatches(currentMatches);
      });

      return {
        ...prev,
        finalMatches: currentMatches,
      };
    });
  };

  // 6. Global Actions
  const handleReset = () => {
    if (
      window.confirm(
        'Êtes-vous sûr de vouloir réinitialiser tout le tournoi ? Toutes les données seront effacées.'
      )
    ) {
      localStorage.removeItem(STORAGE_KEY);
      setTournament(INITIAL_TOURNAMENT_DATA);
      setCurrentTab('participants');
    }
  };

  const handleExportJSON = () => {
    const dataStr = JSON.stringify(tournament, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `tournoi_quilles_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.players)) {
          setTournament(parsed);
          alert('Tournoi importé avec succès !');
        } else {
          alert('Fichier JSON invalide pour ce format de tournoi.');
        }
      } catch (err) {
        alert('Erreur lors de la lecture du fichier JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex flex-col font-sans antialiased">
      {/* Header */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        tournament={tournament}
        onReset={handleReset}
        onLoadDemo={handleLoadSamplePlayers}
        onExportJSON={handleExportJSON}
        onImportJSON={handleImportJSON}
        onToggleBigScreen={() => setIsBigScreen(!isBigScreen)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Visualisation Interactive du Parcours de Qualification */}
        <TournamentPipelineVisualizer
          tournament={tournament}
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
        />

        {currentTab === 'participants' && (
          <TabParticipants
            players={tournament.players}
            settings={tournament.settings}
            tour1Poules={tournament.tour1Poules}
            onAddPlayer={handleAddPlayer}
            onUpdatePlayer={handleUpdatePlayer}
            onDeletePlayer={handleDeletePlayer}
            onBatchAddPlayers={handleBatchAddPlayers}
            onClearAllPlayers={handleClearAllPlayers}
            onUpdateSettings={handleUpdateSettings}
            onGenerateTour1={handleGenerateTour1}
            onNavigateToTour1={() => setCurrentTab('tour1')}
            onLoadSamplePlayers={handleLoadSamplePlayers}
          />
        )}

        {currentTab === 'tour1' && (
          <TabTour1
            poules={tournament.tour1Poules}
            playersMap={playersMap}
            settings={tournament.settings}
            onUpdateScore={handleUpdateScoreTour1}
            onUpdateTieBreak={handleUpdateTieBreakTour1}
            onUpdateSettings={handleUpdateSettings}
            onAutoSimulateTour1={handleAutoSimulateTour1}
            onAdvanceToTour2={handleAdvanceToTour2}
          />
        )}

        {currentTab === 'tour2' && (
          <TabTour2
            poules={tournament.tour2Poules}
            playersMap={playersMap}
            settings={tournament.settings}
            onUpdateScore={handleUpdateScoreTour2}
            onUpdateTieBreak={handleUpdateTieBreakTour2}
            onUpdateSettings={handleUpdateSettings}
            onAutoSimulateTour2={handleAutoSimulateTour2}
            onAdvanceToTour3={handleAdvanceToTour3}
          />
        )}

        {currentTab === 'tour3' && (
          <TabTour3
            poules={tournament.tour3Poules}
            playersMap={playersMap}
            settings={tournament.settings}
            onUpdateScore={handleUpdateScoreTour3}
            onUpdateTieBreak={handleUpdateTieBreakTour3}
            onUpdateSettings={handleUpdateSettings}
            onAutoSimulateTour3={handleAutoSimulateTour3}
            onAdvanceToFinals={handleAdvanceToFinals}
          />
        )}

        {currentTab === 'phasesFinales' && (
          <TabPhasesFinales
            matches={tournament.finalMatches}
            playersMap={playersMap}
            onUpdateMatchScore={handleUpdateMatchScore}
            onAutoSimulateFinals={handleAutoSimulateFinals}
          />
        )}

        {(currentTab === 'stats' || currentTab === 'equipes') && (
          <TabClassementsBilan
            tournament={tournament}
            playersMap={playersMap}
          />
        )}
      </main>

      {/* Fullscreen Big Screen Mode Modal */}
      {isBigScreen && (
        <BigScreenView
          tournament={tournament}
          playersMap={playersMap}
          onClose={() => setIsBigScreen(false)}
        />
      )}
    </div>
  );
}
