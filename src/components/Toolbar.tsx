import React from 'react';
import { Play, Pause, StepForward, FastForward, Activity, Globe, Send, RefreshCw, ChevronDown } from 'lucide-react';
import { ScenarioPreset } from '../types/network';
import { PRESET_SCENARIOS } from '../data/presetScenarios';

interface ToolbarProps {
  isSimulating: boolean;
  setIsSimulating: (val: boolean) => void;
  simSpeed: number;
  setSimSpeed: (speed: number) => void;
  onStepForward: () => void;
  activeScenarioId: string;
  onSelectScenario: (scenario: ScenarioPreset) => void;
  onQuickPing: () => void;
  onQuickHttp: () => void;
  inFlightCount: number;
  lastSimEvent?: string;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  isSimulating,
  setIsSimulating,
  simSpeed,
  setSimSpeed,
  onStepForward,
  activeScenarioId,
  onSelectScenario,
  onQuickPing,
  onQuickHttp,
  inFlightCount,
  lastSimEvent
}) => {
  return (
    <div className="h-12 bg-slate-900 border-b border-slate-800/80 px-4 flex items-center justify-between text-xs text-slate-300">
      {/* Left: Scenario Presets Dropdown */}
      <div className="flex items-center gap-3">
        <label className="text-slate-500 font-medium whitespace-nowrap">Scénario :</label>
        <div className="relative">
          <select
            value={activeScenarioId}
            onChange={(e) => {
              const found = PRESET_SCENARIOS.find(s => s.id === e.target.value);
              if (found) onSelectScenario(found);
            }}
            aria-label="Sélectionner un scénario réseau"
            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 pr-7 appearance-none focus:outline-none focus:border-cyan-500 transition-colors font-medium cursor-pointer"
          >
            {PRESET_SCENARIOS.map(sc => (
              <option key={sc.id} value={sc.id}>
                {sc.title}
              </option>
            ))}
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2.5 pointer-events-none" />
        </div>

        {lastSimEvent && (
          <span className="hidden xl:inline text-[11px] text-slate-400 font-mono truncate max-w-xs border-l border-slate-800 pl-3">
            {lastSimEvent}
          </span>
        )}
      </div>

      {/* Middle: Simulation Playback Controls */}
      <div className="flex items-center gap-1.5 bg-slate-800/70 p-1 rounded-xl border border-slate-700/60">
        <button
          onClick={() => setIsSimulating(!isSimulating)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
            isSimulating
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400'
          }`}
          title={isSimulating ? 'Mettre en pause' : 'Démarrer la simulation'}
        >
          {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          <span>{isSimulating ? 'Pause' : 'Lecture'}</span>
        </button>

        <button
          onClick={onStepForward}
          disabled={isSimulating || inFlightCount === 0}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          title="Avancer d'un saut de paquet"
        >
          <StepForward className="w-3.5 h-3.5" />
        </button>

        <div className="h-4 w-px bg-slate-700 mx-1" />

        {/* Speed multipliers */}
        {[0.5, 1, 2].map(speed => (
          <button
            key={speed}
            onClick={() => setSimSpeed(speed)}
            className={`px-2 py-0.5 rounded text-[11px] font-mono tabular-nums transition-colors ${
              simSpeed === speed
                ? 'bg-cyan-950 text-cyan-300 font-bold border border-cyan-800'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {speed}x
          </button>
        ))}
      </div>

      {/* Right: Quick Injections */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-mono mr-2">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span className="tabular-nums">
            {inFlightCount} {inFlightCount > 1 ? 'paquets en vol' : 'paquet en vol'}
          </span>
        </div>

        <button
          onClick={onQuickPing}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-200 font-medium transition-colors"
        >
          <Send className="w-3 h-3 text-cyan-400" />
          <span>Ping ICMP</span>
        </button>

        <button
          onClick={onQuickHttp}
          className="flex items-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-200 font-medium transition-colors"
        >
          <Globe className="w-3 h-3 text-emerald-400" />
          <span>Requête Web HTTP</span>
        </button>
      </div>
    </div>
  );
};
