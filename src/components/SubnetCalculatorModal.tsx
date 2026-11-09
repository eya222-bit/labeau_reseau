import React, { useState } from 'react';
import { Calculator, X, Copy, Check, Info, Binary, Cpu } from 'lucide-react';
import { getSubnetDetails, isValidIp } from '../utils/ipUtils';

interface SubnetCalculatorModalProps {
  onClose: () => void;
}

export const SubnetCalculatorModal: React.FC<SubnetCalculatorModalProps> = ({ onClose }) => {
  const [ip, setIp] = useState('192.168.10.0');
  const [cidr, setCidr] = useState(24);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const validIp = isValidIp(ip) ? ip : '192.168.1.0';
  const details = getSubnetDetails(validIp, cidr);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-950 border border-cyan-800/80 rounded-lg text-cyan-400">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Calculateur de Sous-réseaux & VLSM (IPv4)</h2>
              <p className="text-xs text-slate-400">
                Dimensionnement CIDR, masques binaires et plages d'adresses d'ingénierie réseau.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Controls: IP + CIDR */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Adresse IPv4 de référence
              </label>
              <input
                type="text"
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                placeholder="ex: 192.168.1.0"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-slate-300">Préfixe CIDR</label>
                <span className="text-xs font-mono font-bold text-cyan-400">/{cidr}</span>
              </div>
              <input
                type="range"
                min="8"
                max="30"
                value={cidr}
                onChange={(e) => setCidr(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-400 cursor-pointer mt-2"
              />
            </div>
          </div>

          {/* Visual Bit Allocation Bar */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Bits Réseau (NetID) : <strong className="text-cyan-400 font-mono">{cidr} bits</strong></span>
              <span>Bits Hôtes (HostID) : <strong className="text-amber-400 font-mono">{32 - cidr} bits</strong></span>
            </div>

            <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${(cidr / 32) * 100}%` }}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all"
                title={`${cidr} bits réseau`}
              />
              <div
                style={{ width: `${((32 - cidr) / 32) * 100}%` }}
                className="bg-amber-500/80 h-full transition-all"
                title={`${32 - cidr} bits hôtes`}
              />
            </div>

            <div className="text-[11px] font-mono text-slate-400 pt-1 flex items-center justify-between">
              <span>Masque Binaire :</span>
              <span className="text-cyan-300 tracking-wider">{details.binaryMask}</span>
            </div>
          </div>

          {/* Key Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
              <span className="text-[11px] text-slate-500">Hôtes Exploitables</span>
              <div className="text-base font-bold text-white font-mono mt-0.5 tabular-nums">
                {details.usableHosts.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-500 font-mono">2^{32 - cidr} - 2</span>
            </div>

            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
              <span className="text-[11px] text-slate-500">Total Adresses</span>
              <div className="text-base font-bold text-slate-200 font-mono mt-0.5 tabular-nums">
                {details.totalIps.toLocaleString()}
              </div>
              <span className="text-[10px] text-slate-500 font-mono">2^{32 - cidr}</span>
            </div>

            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
              <span className="text-[11px] text-slate-500">Classe Historique</span>
              <div className="text-base font-bold text-cyan-400 font-mono mt-0.5">
                {details.ipClass}
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Standard IPv4</span>
            </div>

            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
              <span className="text-[11px] text-slate-500">Masque Générique (ACL)</span>
              <div className="text-xs font-bold text-amber-300 font-mono mt-1 truncate">
                {details.wildcardMask}
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Inverse Mask</span>
            </div>
          </div>

          {/* Detailed Subnet Table */}
          <div className="bg-slate-950 rounded-xl border border-slate-800 divide-y divide-slate-800/80 font-mono text-xs">
            <div className="p-3 flex items-center justify-between">
              <span className="text-slate-400 font-sans">Adresse Réseau (Network ID) :</span>
              <div className="flex items-center gap-2">
                <span className="text-emerald-400 font-bold">{details.networkAddress}</span>
                <button
                  onClick={() => copyToClipboard(details.networkAddress, 'net')}
                  className="text-slate-500 hover:text-white"
                >
                  {copiedKey === 'net' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="p-3 flex items-center justify-between">
              <span className="text-slate-400 font-sans">Masque de Sous-réseau décimal :</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-200 font-bold">{details.subnetMask}</span>
                <button
                  onClick={() => copyToClipboard(details.subnetMask, 'mask')}
                  className="text-slate-500 hover:text-white"
                >
                  {copiedKey === 'mask' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="p-3 flex items-center justify-between">
              <span className="text-slate-400 font-sans">Première IP Hôte utilisable :</span>
              <span className="text-cyan-400">{details.firstUsableHost}</span>
            </div>

            <div className="p-3 flex items-center justify-between">
              <span className="text-slate-400 font-sans">Dernière IP Hôte utilisable :</span>
              <span className="text-cyan-400">{details.lastUsableHost}</span>
            </div>

            <div className="p-3 flex items-center justify-between">
              <span className="text-slate-400 font-sans">Adresse de Diffusion (Broadcast) :</span>
              <div className="flex items-center gap-2">
                <span className="text-rose-400 font-bold">{details.broadcastAddress}</span>
                <button
                  onClick={() => copyToClipboard(details.broadcastAddress, 'bcast')}
                  className="text-slate-500 hover:text-white"
                >
                  {copiedKey === 'bcast' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
