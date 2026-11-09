import React from 'react';
import { Network, Radio, Sparkles, Sun, Moon, CheckCircle2 } from 'lucide-react';

export type TabKey = 'netsim' | 'rf' | 'fiber' | 'netops' | 'labs';

interface NavigationProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  completedLabsCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onSelectTab,
  isDark,
  onToggleTheme,
  completedLabsCount
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-8 h-16">
        {/* Zone 1: Brand Wordmark (Single element) */}
        <button
          onClick={() => onSelectTab('netsim')}
          className="flex items-center gap-2.5 text-left text-slate-900 dark:text-white font-bold tracking-tight text-lg whitespace-nowrap shrink-0 hover:opacity-90 transition-opacity"
        >
          <div className="w-8 h-8 rounded-lg bg-sky-600 dark:bg-sky-500 text-white flex items-center justify-center shadow-sm">
            <Network className="w-5 h-5" />
          </div>
          <span>TeleCom & NetLab Studio</span>
        </button>

        {/* Zone 2: Navigation Links (Single-line labels) */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          <button
            onClick={() => onSelectTab('netsim')}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'netsim'
                ? 'bg-slate-100 dark:bg-slate-800 text-sky-600 dark:text-sky-400 font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            Simulateur Réseau
          </button>
          <button
            onClick={() => onSelectTab('rf')}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'rf'
                ? 'bg-slate-100 dark:bg-slate-800 text-sky-600 dark:text-sky-400 font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            Télécoms 4G/5G
          </button>
          <button
            onClick={() => onSelectTab('fiber')}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'fiber'
                ? 'bg-slate-100 dark:bg-slate-800 text-sky-600 dark:text-sky-400 font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            Liaison Fibre & OTDR
          </button>
          <button
            onClick={() => onSelectTab('netops')}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'netops'
                ? 'bg-slate-100 dark:bg-slate-800 text-sky-600 dark:text-sky-400 font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            Calculateur VLSM & OSPF
          </button>
          <button
            onClick={() => onSelectTab('labs')}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              activeTab === 'labs'
                ? 'bg-slate-100 dark:bg-slate-800 text-sky-600 dark:text-sky-400 font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <span>Labos Pratiques</span>
            {completedLabsCount > 0 && (
              <span className="text-xs px-1.5 py-0.2 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 rounded-md font-mono">
                {completedLabsCount}/4
              </span>
            )}
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action & Theme Toggle */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isDark ? "Mode clair" : "Mode sombre"}
            aria-label="Changer de thème"
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <button
            onClick={() => onSelectTab('labs')}
            className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-sky-600 dark:bg-sky-500 hover:bg-sky-700 dark:hover:bg-sky-600 rounded-lg shadow-sm transition-colors whitespace-nowrap shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>Lancer un Défi</span>
          </button>
        </div>
      </div>

      {/* Mobile nav row */}
      <div className="lg:hidden flex overflow-x-auto border-t border-slate-200 dark:border-slate-800 px-3 py-2 gap-1.5 scrollbar-none bg-slate-50/50 dark:bg-slate-900/50">
        <button
          onClick={() => onSelectTab('netsim')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
            activeTab === 'netsim'
              ? 'bg-sky-600 text-white'
              : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          Simulateur Réseau
        </button>
        <button
          onClick={() => onSelectTab('rf')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
            activeTab === 'rf'
              ? 'bg-sky-600 text-white'
              : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          Télécoms 4G/5G
        </button>
        <button
          onClick={() => onSelectTab('fiber')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
            activeTab === 'fiber'
              ? 'bg-sky-600 text-white'
              : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          Fibre & OTDR
        </button>
        <button
          onClick={() => onSelectTab('netops')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
            activeTab === 'netops'
              ? 'bg-sky-600 text-white'
              : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          VLSM & OSPF
        </button>
        <button
          onClick={() => onSelectTab('labs')}
          className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
            activeTab === 'labs'
              ? 'bg-sky-600 text-white'
              : 'text-slate-600 dark:text-slate-300'
          }`}
        >
          Labos ({completedLabsCount}/4)
        </button>
      </div>
    </header>
  );
};
