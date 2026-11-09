import React from 'react';
import { Network, Play, Pause, Zap, RefreshCw, Layers, Calculator, TerminalSquare } from 'lucide-react';

interface HeaderProps {
  activeTab: 'canvas' | 'scenarios' | 'subnet' | 'wireshark';
  setActiveTab: (tab: 'canvas' | 'scenarios' | 'subnet' | 'wireshark') => void;
  onOpenPingModal: () => void;
  onOpenDbModal: () => void;
  packetCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenPingModal,
  onOpenDbModal,
  packetCount
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md sticky top-0 z-40">
      {/* Zone 1: Single text element wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-cyan-500/20">
          <Network className="w-5 h-5 text-white" />
        </div>
        <a
          href="#"
          onClick={(e) => { e.preventDefault(); setActiveTab('canvas'); }}
          className="text-lg font-bold tracking-tight text-white whitespace-nowrap hover:text-cyan-400 transition-colors"
        >
          NetSim Lab <span className="text-cyan-400 text-xs font-mono font-normal">v2.4</span>
        </a>
      </div>

      {/* Zone 2: 4-5 clean single-line text navigation links */}
      <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
        <button
          onClick={() => setActiveTab('canvas')}
          className={`flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors ${
            activeTab === 'canvas' ? 'text-cyan-400 font-semibold' : 'hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Topologie & Canvas</span>
        </button>

        <button
          onClick={() => setActiveTab('scenarios')}
          className={`flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors ${
            activeTab === 'scenarios' ? 'text-cyan-400 font-semibold' : 'hover:text-slate-200'
          }`}
        >
          <Zap className="w-4 h-4" />
          <span>Scénarios & Labos</span>
        </button>

        <button
          onClick={() => setActiveTab('subnet')}
          className={`flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors ${
            activeTab === 'subnet' ? 'text-cyan-400 font-semibold' : 'hover:text-slate-200'
          }`}
        >
          <Calculator className="w-4 h-4" />
          <span>Calculateur VLSM</span>
        </button>

        <button
          onClick={() => setActiveTab('wireshark')}
          className={`flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors relative ${
            activeTab === 'wireshark' ? 'text-cyan-400 font-semibold' : 'hover:text-slate-200'
          }`}
        >
          <TerminalSquare className="w-4 h-4" />
          <span>Inspecteur Wireshark</span>
          {packetCount > 0 && (
            <span className="text-[11px] font-mono text-cyan-400 bg-cyan-950/80 border border-cyan-800/80 px-1.5 py-0.2 rounded">
              {packetCount}
            </span>
          )}
        </button>
      </nav>

      {/* Zone 3: Actions */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenDbModal}
          className="px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg shadow-sm flex items-center gap-2 whitespace-nowrap shrink-0 transition-colors"
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>BDD MySQL (analyse)</span>
        </button>

        <button
          onClick={onOpenPingModal}
          className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow-sm shadow-cyan-400/20 transition-all flex items-center gap-2 whitespace-nowrap shrink-0 active:scale-95"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Lancer un Paquet (Ping / Web)</span>
        </button>
      </div>
    </header>
  );
};
