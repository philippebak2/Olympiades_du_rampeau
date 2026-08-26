import React, { useState } from 'react';
import { Player, TournamentSettings, Poule } from '../types/tournament';
import { SAMPLE_TEAMS, generateSamplePlayers } from '../utils/sampleData';
import {
  UserPlus,
  Users,
  Shuffle,
  Trash2,
  Edit2,
  Search,
  CheckCircle2,
  Sparkles,
  FileText,
  Sliders,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface TabParticipantsProps {
  players: Player[];
  settings: TournamentSettings;
  tour1Poules: Poule[];
  onAddPlayer: (player: { name: string; team: string }) => void;
  onUpdatePlayer: (id: number, player: { name: string; team: string }) => void;
  onDeletePlayer: (id: number) => void;
  onBatchAddPlayers: (newPlayers: Array<{ name: string; team: string }>) => void;
  onClearAllPlayers: () => void;
  onUpdateSettings: (newSettings: Partial<TournamentSettings>) => void;
  onGenerateTour1: () => void;
  onNavigateToTour1: () => void;
  onLoadSamplePlayers: (count?: number) => void;
}

export const TabParticipants: React.FC<TabParticipantsProps> = ({
  players,
  settings,
  tour1Poules,
  onAddPlayer,
  onUpdatePlayer,
  onDeletePlayer,
  onBatchAddPlayers,
  onClearAllPlayers,
  onUpdateSettings,
  onGenerateTour1,
  onNavigateToTour1,
  onLoadSamplePlayers,
}) => {
  // Form State
  const [singleName, setSingleName] = useState('');
  const [singleTeam, setSingleTeam] = useState('');
  const [editingPlayerId, setEditingPlayerId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editTeam, setEditTeam] = useState('');

  // Bulk paste modal / text
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkText, setBulkText] = useState('');

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTeam, setFilterTeam] = useState<string>('ALL');

  // Add player handler
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleName.trim()) return;
    onAddPlayer({
      name: singleName.trim(),
      team: singleTeam.trim() || 'Individuel',
    });
    setSingleName('');
    setSingleTeam('');
  };

  // Edit player handler
  const handleStartEdit = (player: Player) => {
    setEditingPlayerId(player.id);
    setEditName(player.name);
    setEditTeam(player.team || '');
  };

  const handleSaveEdit = (id: number) => {
    if (!editName.trim()) return;
    onUpdatePlayer(id, {
      name: editName.trim(),
      team: editTeam.trim() || 'Individuel',
    });
    setEditingPlayerId(null);
  };

  // Bulk add handler
  const handleBulkSubmit = () => {
    const lines = bulkText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    const newItems: Array<{ name: string; team: string }> = [];

    lines.forEach((line) => {
      // Si la ligne contient une virgule ou un point-virgule (ex: "Jean Dupont, Quilleurs d'Alsace")
      if (line.includes(';') || line.includes(',')) {
        const parts = line.split(/[;,]/);
        const name = parts[0].trim();
        const team = parts.slice(1).join(' ').trim();
        if (name) newItems.push({ name, team: team || 'Individuel' });
      } else {
        newItems.push({ name: line, team: 'Individuel' });
      }
    });

    if (newItems.length > 0) {
      onBatchAddPlayers(newItems);
      setBulkText('');
      setShowBulkModal(false);
    }
  };

  // Filtered players
  const filteredPlayers = players.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id.toString().includes(searchTerm) ||
      p.team.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTeam = filterTeam === 'ALL' || p.team === filterTeam;
    return matchesSearch && matchesTeam;
  });

  // Unique teams list
  const uniqueTeams = Array.from(new Set(players.map((p) => p.team).filter(Boolean)));

  // Calculate stats
  const totalPlayers = players.length;
  const poolCount = settings.round1PoolCount;
  const avgPlayersPerPool = poolCount > 0 ? (totalPlayers / poolCount).toFixed(1) : '0';
  const totalQualifiedT1 = poolCount * settings.round1QualifiersPerPool;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Configuration & Control Banner */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-gray-100 text-gray-800 text-xs font-semibold border border-gray-200">
              <Sliders className="w-3.5 h-3.5 text-gray-600" />
              <span>Étape 1 : Paramétrage du Tournoi & Tirage au Sort</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">
              Gestion des Inscriptions & Tirage des Poules
            </h2>
            <p className="text-xs text-gray-600 leading-relaxed">
              Définissez les participants (chacun reçoit un numéro unique attribué pour toute la compétition), configurez le nombre de poules et le nombre de qualifiés par poule avant de lancer le tirage aléatoire.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 text-center">
              <div className="text-2xl font-bold text-gray-900">{totalPlayers}</div>
              <div className="text-[11px] text-gray-500 font-medium">Participants</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 text-center">
              <div className="text-2xl font-bold text-gray-900">{settings.round1PoolCount}</div>
              <div className="text-[11px] text-gray-500 font-medium">Poules Tour 1</div>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 text-center col-span-2 sm:col-span-1">
              <div className="text-2xl font-bold text-emerald-600">{totalQualifiedT1}</div>
              <div className="text-[11px] text-gray-500 font-medium">Qualifiés Tour 2</div>
            </div>
          </div>
        </div>

        {/* Configuration settings row for Tours 1, 2, and 3 */}
        <div className="mt-5 pt-4 border-t border-gray-100 space-y-4">
          <div className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-gray-500" />
            <span>Configuration des Tours de Qualification (Poules & Nombre de Qualifiés)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tour 1 Settings */}
            <div className="bg-gray-50/80 rounded-xl p-3.5 border border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900">Tour 1</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-700 font-semibold">2 tirs</span>
              </div>
              
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Nombre de poules
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    id="input-round1-pools"
                    min={1}
                    max={32}
                    value={settings.round1PoolCount}
                    onChange={(e) =>
                      onUpdateSettings({
                        round1PoolCount: Math.max(1, parseInt(e.target.value) || 1),
                      })
                    }
                    className="w-16 bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-gray-900 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900"
                  />
                  <span className="text-[11px] text-gray-500">
                    (~{avgPlayersPerPool} j/poule)
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Qualifiés par poule (Top X)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    id="input-round1-qualifiers"
                    min={1}
                    max={20}
                    value={settings.round1QualifiersPerPool}
                    onChange={(e) =>
                      onUpdateSettings({
                        round1QualifiersPerPool: Math.max(1, parseInt(e.target.value) || 1),
                      })
                    }
                    className="w-16 bg-white border border-emerald-300 rounded-lg px-2.5 py-1 text-emerald-700 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <span className="text-[11px] text-emerald-700 font-semibold">
                    = {settings.round1PoolCount * settings.round1QualifiersPerPool} qualifiés T2
                  </span>
                </div>
              </div>
            </div>

            {/* Tour 2 Settings */}
            <div className="bg-gray-50/80 rounded-xl p-3.5 border border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900">Tour 2</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-700 font-semibold">1 tir (cumul T1+T2)</span>
              </div>
              
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Nombre de poules
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    id="input-round2-pools"
                    min={1}
                    max={20}
                    value={settings.round2PoolCount}
                    onChange={(e) =>
                      onUpdateSettings({
                        round2PoolCount: Math.max(1, parseInt(e.target.value) || 1),
                      })
                    }
                    className="w-16 bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-gray-900 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900"
                  />
                  <span className="text-[11px] text-gray-500">poules au T2</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Qualifiés par poule (Top X)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    id="input-round2-qualifiers"
                    min={1}
                    max={20}
                    value={settings.round2QualifiersPerPool}
                    onChange={(e) =>
                      onUpdateSettings({
                        round2QualifiersPerPool: Math.max(1, parseInt(e.target.value) || 1),
                      })
                    }
                    className="w-16 bg-white border border-emerald-300 rounded-lg px-2.5 py-1 text-emerald-700 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <span className="text-[11px] text-emerald-700 font-semibold">
                    = {settings.round2PoolCount * settings.round2QualifiersPerPool} qualifiés T3
                  </span>
                </div>
              </div>
            </div>

            {/* Tour 3 Settings */}
            <div className="bg-gray-50/80 rounded-xl p-3.5 border border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-900">Tour 3</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 text-gray-700 font-semibold">1 tir (cumul général)</span>
              </div>
              
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Nombre de poules
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    id="input-round3-pools"
                    min={1}
                    max={10}
                    value={settings.round3PoolCount}
                    onChange={(e) =>
                      onUpdateSettings({
                        round3PoolCount: Math.max(1, parseInt(e.target.value) || 1),
                      })
                    }
                    className="w-16 bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-gray-900 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900"
                  />
                  <span className="text-[11px] text-gray-500">poules au T3</span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                  Qualifiés par poule (Top X)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    id="input-round3-qualifiers"
                    min={1}
                    max={10}
                    value={settings.round3QualifiersPerPool}
                    onChange={(e) =>
                      onUpdateSettings({
                        round3QualifiersPerPool: Math.max(1, parseInt(e.target.value) || 1),
                      })
                    }
                    className="w-16 bg-white border border-emerald-300 rounded-lg px-2.5 py-1 text-emerald-700 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <span className="text-[11px] text-emerald-700 font-semibold">
                    = {settings.round3PoolCount * settings.round3QualifiersPerPool} qualifiés Finales
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end pt-2">
            <button
              type="button"
              id="btn-generate-tour1-pools"
              disabled={totalPlayers === 0}
              onClick={onGenerateTour1}
              className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                totalPlayers > 0
                  ? 'bg-gray-900 hover:bg-gray-800 text-white shadow-2xs active:scale-95'
                  : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
              }`}
            >
              <Shuffle className="w-4 h-4" />
              <span>Générer les Poules Aléatoirement</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notice if Tour 1 is already generated */}
      {tour1Poules.length > 0 && (
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <div>
              <div className="text-sm font-bold text-emerald-950">
                {tour1Poules.length} poules ont été générées avec succès pour le Tour 1 !
              </div>
              <div className="text-xs text-emerald-700">
                Vous pouvez saisir les résultats des tirs dans l'onglet Tour 1.
              </div>
            </div>
          </div>
          <button
            type="button"
            id="btn-goto-tour1-banner"
            onClick={onNavigateToTour1}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-xs transition-all shadow-2xs cursor-pointer text-center"
          >
            Accéder à la saisie du Tour 1 →
          </button>
        </div>
      )}

      {/* Grid: Player Form & Players List Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Add Forms & Batch Actions */}
        <div className="space-y-5 lg:col-span-1">
          {/* Add Single Player Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-gray-700" />
                <span>Ajouter un Participant</span>
              </h3>
              <span className="text-[11px] text-gray-500 font-medium">N° suivant : #{totalPlayers + 1}</span>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nom et Prénom du joueur *
                </label>
                <input
                  type="text"
                  id="input-player-name"
                  placeholder="ex: Jean Dupont"
                  value={singleName}
                  onChange={(e) => setSingleName(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 outline-none transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Club / Équipe (pour classement équipes)
                </label>
                <input
                  type="text"
                  id="input-player-team"
                  placeholder="ex: Quilleurs de Strasbourg"
                  value={singleTeam}
                  onChange={(e) => setSingleTeam(e.target.value)}
                  list="teams-datalist"
                  className="w-full px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 outline-none transition-all"
                />
                <datalist id="teams-datalist">
                  {SAMPLE_TEAMS.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </div>

              <button
                type="submit"
                id="btn-add-player"
                className="w-full py-2.5 px-4 bg-gray-900 hover:bg-gray-800 text-white font-semibold text-sm rounded-lg shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <UserPlus className="w-4 h-4" />
                <span>Inscrire le joueur #{totalPlayers + 1}</span>
              </button>
            </form>
          </div>

          {/* Quick Setup / Bulk Tools Card */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3 shadow-xs">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-gray-600" />
              <span>Outils rapides & Import</span>
            </h4>

            <div className="space-y-2">
              <button
                type="button"
                id="btn-load-160-players"
                onClick={() => onLoadSamplePlayers(160)}
                className="w-full py-2 px-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800 text-xs font-semibold rounded-lg transition-all flex items-center justify-between cursor-pointer"
              >
                <span>Charger 160 Joueurs (16 Poules de 10)</span>
                <span className="text-[10px] bg-gray-200 text-gray-800 font-bold px-2 py-0.5 rounded-full">Standard</span>
              </button>

              <button
                type="button"
                id="btn-load-80-players"
                onClick={() => onLoadSamplePlayers(80)}
                className="w-full py-2 px-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800 text-xs font-semibold rounded-lg transition-all flex items-center justify-between cursor-pointer"
              >
                <span>Charger 80 Joueurs (8 Poules de 10)</span>
                <span className="text-[10px] bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded-full">Tournoi Moyen</span>
              </button>

              <button
                type="button"
                id="btn-open-bulk-modal"
                onClick={() => setShowBulkModal(true)}
                className="w-full py-2 px-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-800 text-xs font-semibold rounded-lg transition-all flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-gray-500" />
                  <span>Coller une liste de noms (Import en bloc)</span>
                </span>
              </button>

              {players.length > 0 && (
                <button
                  type="button"
                  id="btn-clear-all-players"
                  onClick={() => {
                    if (window.confirm('Voulez-vous vraiment vider la liste des participants ?')) {
                      onClearAllPlayers();
                    }
                  }}
                  className="w-full py-1.5 px-3 text-rose-600 hover:bg-rose-50 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-2"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Vider tous les participants ({players.length})</span>
                </button>
              )}
            </div>
          </div>

          {/* Tournament Rules Info Reminder */}
          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 text-xs text-gray-700 space-y-1.5">
            <div className="font-bold flex items-center gap-1.5 text-gray-900">
              <HelpCircle className="w-4 h-4 text-gray-600" />
              <span>Règles du Jeu de Quilles</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-gray-600 text-[11px] leading-relaxed">
              <li><strong>Tour 1</strong> : 2 tirs sur 9 quilles (total max 18). Top 5 qualifiés par poule.</li>
              <li><strong>Tour 2</strong> : 1 tir sur 9 quilles cumulé au Tour 1. Top 5 qualifiés.</li>
              <li><strong>Tour 3</strong> : 4 poules A, B, C, D. Cumul T1+T2+T3. 4 qualifiés/poule (16 en 8èmes).</li>
              <li><strong>Points Équipe</strong> : 1 pt (T1), 2 pts (T2), 3 pts (T3), 4 pts (1/8), 5 pts (1/4 & 4e), 6 pts (3e), 7 pts (2e), 8 pts (1er).</li>
            </ul>
          </div>
        </div>

        {/* Right Col: Table of Registered Participants */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
            {/* Table Header & Search Toolbar */}
            <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-700" />
                  <span>Tableau des Participants ({filteredPlayers.length} / {players.length})</span>
                </h3>
                <p className="text-xs text-gray-500">
                  Chaque joueur conserve son numéro attribué (#N°) tout au long de la compétition.
                </p>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    id="search-participants-input"
                    placeholder="Chercher N° ou Nom..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 pr-3 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 w-44"
                  />
                </div>

                {uniqueTeams.length > 0 && (
                  <select
                    id="filter-team-select"
                    value={filterTeam}
                    onChange={(e) => setFilterTeam(e.target.value)}
                    className="text-xs bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 max-w-[150px]"
                  >
                    <option value="ALL">Tous les clubs</option>
                    {uniqueTeams.map((team) => (
                      <option key={team} value={team}>
                        {team}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Table */}
            {players.length === 0 ? (
              <div className="p-12 text-center text-gray-500 space-y-3">
                <Users className="w-12 h-12 text-gray-300 mx-auto" />
                <div className="text-sm font-medium text-gray-700">Aucun participant inscrit pour l'instant</div>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  Ajoutez les quilleurs individuellement, collez une liste ou chargez les 160 participants démo pour tester.
                </p>
                <button
                  type="button"
                  id="btn-empty-load-sample"
                  onClick={() => onLoadSamplePlayers(160)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold rounded-lg transition-all shadow-2xs cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Charger les 160 joueurs démo</span>
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[580px] scrollbar-thin">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-gray-50 text-gray-600 uppercase tracking-wider font-bold text-[10px] sticky top-0 z-10 border-b border-gray-200">
                    <tr>
                      <th className="py-2.5 px-4 w-16 text-center">N°</th>
                      <th className="py-2.5 px-4">Nom et Prénom</th>
                      <th className="py-2.5 px-4">Club / Équipe</th>
                      <th className="py-2.5 px-3 w-20 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredPlayers.map((player) => {
                      const isEditing = editingPlayerId === player.id;
                      return (
                        <tr
                          key={player.id}
                          className="hover:bg-gray-50 transition-colors group"
                        >
                          {/* Numéro à gauche */}
                          <td className="py-2.5 px-4 text-center font-bold text-gray-900">
                            <span className="inline-flex items-center justify-center w-8 h-7 rounded-md bg-gray-100 text-gray-900 font-bold border border-gray-200 font-mono text-[11px]">
                              #{player.id}
                            </span>
                          </td>

                          {/* Nom */}
                          <td className="py-2.5 px-4 font-semibold text-gray-900">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full px-2 py-1 border border-gray-400 rounded-md text-xs font-medium focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                              />
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <span>{player.name}</span>
                              </div>
                            )}
                          </td>

                          {/* Club */}
                          <td className="py-2.5 px-4 text-gray-600">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editTeam}
                                onChange={(e) => setEditTeam(e.target.value)}
                                className="w-full px-2 py-1 border border-gray-400 rounded-md text-xs focus:ring-1 focus:ring-gray-900 focus:border-gray-900"
                              />
                            ) : (
                              <span className="inline-block px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 border border-gray-200 text-[11px]">
                                {player.team || 'Individuel'}
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="py-2.5 px-3 text-right">
                            {isEditing ? (
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  type="button"
                                  onClick={() => handleSaveEdit(player.id)}
                                  className="px-2 py-1 bg-emerald-600 text-white rounded text-[10px] font-bold hover:bg-emerald-700"
                                >
                                  OK
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingPlayerId(null)}
                                  className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-[10px] hover:bg-gray-300"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-1 opacity-70 group-hover:opacity-100">
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(player)}
                                  className="p-1 text-gray-400 hover:text-gray-800 rounded hover:bg-gray-100 transition-colors"
                                  title="Modifier"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onDeletePlayer(player.id)}
                                  className="p-1 text-gray-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors"
                                  title="Supprimer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bulk Paste Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-gray-700" />
                <span>Import en bloc de Quilleurs</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="text-gray-400 hover:text-gray-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-600">
              Collez votre liste de participants (1 par ligne). Vous pouvez inclure le club séparé par une virgule :
              <br />
              <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-[11px]">
                Jean Dupont, Quilleurs de Strasbourg
              </code>
            </p>

            <textarea
              id="bulk-players-textarea"
              rows={8}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={`Pierre Martin, BC Colmar\nPhilippe Durand, Quilleurs de Strasbourg\nAlain Lefebvre, AS Quilles Mulhouse\n...`}
              className="w-full p-3 text-xs border border-gray-300 rounded-xl font-mono focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 outline-none"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold"
              >
                Annuler
              </button>
              <button
                type="button"
                id="btn-submit-bulk-import"
                onClick={handleBulkSubmit}
                disabled={!bulkText.trim()}
                className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs font-bold shadow-2xs transition-all disabled:opacity-50"
              >
                Ajouter les participants
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
