import React from 'react';
import { Play, Layers, Shield, Wifi, Zap, ArrowRight, CheckCircle2 } from 'lucide-react';
import { PRESET_SCENARIOS } from '../data/presetScenarios';
import { ScenarioPreset } from '../types/network';

interface ScenariosViewProps {
  currentScenarioId: string;
  onSelectScenario: (scenario: ScenarioPreset) => void;
  onRunSuggestedAction: (scenario: ScenarioPreset) => void;
}

export const ScenariosView: React.FC<ScenariosViewProps> = ({
  currentScenarioId,
  onSelectScenario,
  onRunSuggestedAction
}) => {
  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-8 h-[calc(100vh-57px)]">
      <div className="max-w-5xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Laboratoires Réseaux & Télécommunications
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Sélectionnez un banc d'essai pré-configuré pour explorer les protocoles fondamentaux (Modèle OSI, Routage L3, WiFi, DHCP, Filtrage ACL).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {PRESET_SCENARIOS.map((scenario) => {
            const isLoaded = scenario.id === currentScenarioId;

            return (
              <div
                key={scenario.id}
                className={`p-6 rounded-2xl border transition-all flex flex-col justify-between ${
                  isLoaded
                    ? 'bg-slate-900/90 border-cyan-500/60 shadow-lg shadow-cyan-500/10'
                    : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                      {scenario.category}
                    </span>
                    {isLoaded && (
                      <span className="text-xs text-emerald-400 font-medium flex items-center gap-1 bg-emerald-950/60 border border-emerald-800/80 px-2.5 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Actif sur le Canvas</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-white mb-2">{scenario.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4">
                    {scenario.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs font-mono text-slate-500 border-t border-slate-800/80 pt-3">
                    <span>{scenario.devices.length} Équipements</span>
                    <span>·</span>
                    <span>{scenario.links.length} Câbles / Liens</span>
                  </div>
                </div>

                <div className="mt-6 space-y-2 pt-4 border-t border-slate-800/80">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onSelectScenario(scenario)}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                        isLoaded
                          ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20'
                      }`}
                    >
                      <Layers className="w-4 h-4" />
                      <span>{isLoaded ? 'Recharger le banc' : 'Charger ce laboratoire'}</span>
                    </button>

                    {scenario.suggestedAction && (
                      <button
                        onClick={() => {
                          onSelectScenario(scenario);
                          onRunSuggestedAction(scenario);
                        }}
                        className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                        title={scenario.suggestedAction.label}
                      >
                        <Zap className="w-4 h-4" />
                        <span>Lancer le test</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
