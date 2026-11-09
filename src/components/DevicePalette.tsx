import React from 'react';
import { Router, Server, Laptop, Monitor, Wifi, Shield, Network, Plus, Cable, Trash2, RotateCcw } from 'lucide-react';
import { DeviceType } from '../types/network';

interface DevicePaletteProps {
  onAddDevice: (type: DeviceType) => void;
  cableMode: boolean;
  setCableMode: (val: boolean) => void;
  onClearCanvas: () => void;
  onResetLayout: () => void;
  deviceCount: number;
  linkCount: number;
}

interface PaletteItem {
  type: DeviceType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const PALETTE_ITEMS: PaletteItem[] = [
  {
    type: 'router',
    label: 'Routeur L3',
    description: 'Routage inter-réseaux (g0/0, g0/1)',
    icon: Router,
    color: 'text-blue-400 bg-blue-950/60 border-blue-800/60'
  },
  {
    type: 'switch',
    label: 'Commutateur L2',
    description: 'Commutation trames Ethernet (8 ports)',
    icon: Network,
    color: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/60'
  },
  {
    type: 'server',
    label: 'Serveur Multi-Services',
    description: 'Web HTTP, DNS, DHCP',
    icon: Server,
    color: 'text-purple-400 bg-purple-950/60 border-purple-800/60'
  },
  {
    type: 'firewall',
    label: 'Pare-feu Réseau',
    description: 'Filtrage de paquets & règles ACL',
    icon: Shield,
    color: 'text-amber-400 bg-amber-950/60 border-amber-800/60'
  },
  {
    type: 'pc',
    label: 'Poste Fixe (PC)',
    description: 'Client filaire RJ45 avec terminal',
    icon: Monitor,
    color: 'text-cyan-400 bg-cyan-950/60 border-cyan-800/60'
  },
  {
    type: 'laptop',
    label: 'PC Portable',
    description: 'Client mobile Ethernet / WiFi',
    icon: Laptop,
    color: 'text-teal-400 bg-teal-950/60 border-teal-800/60'
  },
  {
    type: 'access_point',
    label: 'Borne WiFi (AP)',
    description: 'Point d\'accès sans-fil 802.11ac',
    icon: Wifi,
    color: 'text-indigo-400 bg-indigo-950/60 border-indigo-800/60'
  }
];

export const DevicePalette: React.FC<DevicePaletteProps> = ({
  onAddDevice,
  cableMode,
  setCableMode,
  onClearCanvas,
  onResetLayout,
  deviceCount,
  linkCount
}) => {
  return (
    <aside className="w-72 bg-slate-900/95 border-r border-slate-800/80 flex flex-col h-[calc(100vh-57px)] shrink-0 select-none">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-semibold text-slate-200">Catalogue Équipements</h2>
          <span className="text-xs font-mono text-slate-500 tabular-nums">
            {deviceCount} noeuds · {linkCount} liens
          </span>
        </div>
        <p className="text-xs text-slate-400">
          Cliquez sur un composant pour l'ajouter sur la scène.
        </p>
      </div>

      {/* Hardware Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {PALETTE_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.type}
              onClick={() => onAddDevice(item.type)}
              className="w-full text-left p-2.5 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-800/40 hover:bg-slate-800/80 transition-all group flex items-start gap-3 active:scale-[0.98]"
            >
              <div className={`p-2 rounded-lg border ${item.color} shrink-0 mt-0.5`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200 group-hover:text-white truncate">
                    {item.label}
                  </span>
                  <Plus className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                </div>
                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                  {item.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Wiring & Canvas Actions */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/60 space-y-2">
        <button
          onClick={() => setCableMode(!cableMode)}
          className={`w-full py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
            cableMode
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm shadow-amber-500/10'
              : 'bg-slate-800/60 border-slate-700 hover:bg-slate-800 text-slate-300'
          }`}
        >
          <Cable className={`w-4 h-4 ${cableMode ? 'text-amber-400 animate-pulse' : 'text-slate-400'}`} />
          <span>{cableMode ? 'Mode Câblage Actif (Cliquez 2 noeuds)' : 'Relier deux équipements (Câble)'}</span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onResetLayout}
            className="py-2 px-3 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-800/30 hover:bg-slate-800/60 text-[11px] font-medium text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
            title="Réorganiser la disposition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Réaligner</span>
          </button>

          <button
            onClick={onClearCanvas}
            className="py-2 px-3 rounded-lg border border-slate-800 hover:border-rose-900/40 bg-slate-800/30 hover:bg-rose-950/20 text-[11px] font-medium text-slate-400 hover:text-rose-400 flex items-center justify-center gap-1.5 transition-colors"
            title="Effacer toute la topologie"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Tout effacer</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
