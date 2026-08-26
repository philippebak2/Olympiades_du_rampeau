import React from 'react';
import {
  TournamentTab,
  TournamentData,
} from '../types/tournament';
import {
  Users,
  Trophy,
  Shield,
  Layers,
  Award,
  Sparkles,
  RotateCcw,
  Download,
  Upload,
  Maximize2,
  Medal,
  ChevronRight,
} from 'lucide-react';

interface HeaderProps {
  currentTab: TournamentTab;
  onSelectTab: (tab: TournamentTab) => void;
  tournament: TournamentData;
  onReset: () => void;
  onLoadDemo: (count?: number) => void;
  onExportJSON: () => void;
  onImportJSON: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onToggleBigScreen: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  tournament,
  onReset,
  onLoadDemo,
  onExportJSON,
  onImportJSON,
  onToggleBigScreen,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const tabs: Array<{
    id: TournamentTab;
    label: string;
    sublabel: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
    isActive: boolean;
    isAvailable: boolean;
  }> = [
    {
      id: 'participants',
      label: '1. Inscriptions & Poules',
      sublabel: 'Liste & Paramètres',
      icon: Users,
      count: tournament.players.length,
      isActive: currentTab === 'participants',
      isAvailable: true,
    },
    {
      id: 'tour1',
      label: '2. Tour 1',
      sublabel: '2 tirs sur 9 quilles',
      icon: Layers,
      count: tournament.tour1Poules.length > 0 ? tournament.tour1Poules.length : undefined,
      isActive: currentTab === 'tour1',
      isAvailable: tournament.tour1Poules.length > 0,
    },
    {
      id: 'tour2',
      label: '3. Tour 2',
      sublabel: 'Cumul T1 + T2',
      icon: Layers,
      count: tournament.tour2Poules.length > 0 ? tournament.tour2Poules.length : undefined,
      isActive: currentTab === 'tour2',
      isAvailable: tournament.tour2Poules.length > 0,
    },
    {
      id: 'tour3',
      label: '4. Tour 3',
      sublabel: 'Poules A, B, C, D',
      icon: Layers,
      count: tournament.tour3Poules.length > 0 ? tournament.tour3Poules.length : undefined,
      isActive: currentTab === 'tour3',
      isAvailable: tournament.tour3Poules.length > 0,
    },
    {
      id: 'phasesFinales',
      label: '5. Phases Finales',
      sublabel: '8èmes à Finale',
      icon: Trophy,
      count: tournament.finalMatches.length > 0 ? 16 : undefined,
      isActive: currentTab === 'phasesFinales',
      isAvailable: tournament.finalMatches.length > 0,
    },
    {
      id: 'equipes',
      label: '6. Classement Équipes',
      sublabel: 'Points accumulés',
      icon: Shield,
      isActive: currentTab === 'equipes',
      isAvailable: tournament.players.length > 0,
    },
    {
      id: 'stats',
      label: '7. Palmarès & Bilan',
      sublabel: 'Podium & Tous scores',
      icon: Medal,
      isActive: currentTab === 'stats',
      isAvailable: tournament.players.length > 0,
    },
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
      {/* Top Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-900 text-white flex items-center justify-center font-bold text-sm tracking-wider shrink-0 shadow-2xs">
              OR
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-gray-900 tracking-tight leading-tight">
                  Olympiades du rampeau
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  9 Quilles / Rampeau
                </span>
              </div>
              <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                <span>{tournament.title || 'Olympiades du rampeau'}</span>
                <span>•</span>
                <span className="font-medium text-gray-700">{tournament.players.length} quilleurs inscrits</span>
              </p>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            {tournament.players.length === 0 && (
              <button
                type="button"
                id="btn-load-demo-header"
                onClick={() => onLoadDemo(160)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-white font-medium shadow-2xs transition-all cursor-pointer active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Charger 160 Joueurs (Démo)</span>
              </button>
            )}

            <button
              type="button"
              id="btn-bigscreen-header"
              onClick={onToggleBigScreen}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 font-medium transition-all cursor-pointer shadow-2xs"
              title="Mode Grand Écran / Vidéoprojecteur pour salle de tournoi"
            >
              <Maximize2 className="w-3.5 h-3.5 text-gray-500" />
              <span className="hidden sm:inline">Grand Écran</span>
            </button>

            <button
              type="button"
              id="btn-export-json-header"
              onClick={onExportJSON}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 font-medium transition-all cursor-pointer shadow-2xs"
              title="Sauvegarder et exporter le tournoi au format JSON"
            >
              <Download className="w-3.5 h-3.5 text-gray-500" />
              <span className="hidden sm:inline">Exporter</span>
            </button>

            <label
              htmlFor="file-import-input"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 font-medium transition-all cursor-pointer shadow-2xs"
              title="Importer un tournoi depuis un fichier JSON"
            >
              <Upload className="w-3.5 h-3.5 text-gray-500" />
              <span className="hidden sm:inline">Importer</span>
              <input
                id="file-import-input"
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={onImportJSON}
                className="hidden"
              />
            </label>

            <button
              type="button"
              id="btn-reset-header"
              onClick={onReset}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 font-medium transition-all cursor-pointer"
              title="Réinitialiser le tournoi"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Réinit</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="bg-gray-50/70 border-t border-gray-200 overflow-x-auto scrollbar-thin">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 py-1.5" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  id={`tab-btn-${tab.id}`}
                  onClick={() => onSelectTab(tab.id)}
                  className={`group relative flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                    tab.isActive
                      ? 'bg-gray-900 text-white shadow-2xs'
                      : tab.isAvailable
                      ? 'text-gray-600 hover:bg-gray-200/60 hover:text-gray-900'
                      : 'text-gray-400 hover:text-gray-500'
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 transition-colors ${
                      tab.isActive ? 'text-white' : tab.isAvailable ? 'text-gray-500 group-hover:text-gray-800' : 'text-gray-300'
                    }`}
                  />
                  <div className="text-left">
                    <div className="leading-tight">{tab.label}</div>
                  </div>

                  {tab.count !== undefined && (
                    <span
                      className={`ml-1 text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        tab.isActive
                          ? 'bg-gray-800 text-gray-200'
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
