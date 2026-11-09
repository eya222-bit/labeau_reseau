import React, { useState } from 'react';
import { Layers, ShieldCheck, Cpu, HardDrive, ArrowRight, Eye, Code2 } from 'lucide-react';
import { PacketLayerInfo, PacketLogEntry } from '../../types/network';

interface PacketInspectorProps {
  selectedLog: PacketLogEntry | null;
  onClose?: () => void;
}

export const PacketInspector: React.FC<PacketInspectorProps> = ({ selectedLog }) => {
  const [activeTab, setActiveTab] = useState<'osi' | 'hex'>('osi');

  if (!selectedLog) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-500 dark:text-slate-400">
        <Layers className="w-10 h-10 mb-3 text-slate-400 dark:text-slate-600 stroke-[1.5]" />
        <p className="text-sm font-medium">Aucun paquet sélectionné</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-xs">
          Lancez une simulation (Ping, HTTP, DHCP) et cliquez sur une trame dans le journal pour inspecter les couches OSI 1 à 7.
        </p>
      </div>
    );
  }

  const { layers, protocol, from, to, timestamp, status } = selectedLog;

  // Generate mock hex dump for educational fidelity
  const hexDump = [
    `0000   ${layers.l2.destMac.replace(/:/g, ' ').toLowerCase()} ${layers.l2.srcMac.replace(/:/g, ' ').toLowerCase()} 08 00`,
    `0010   45 00 00 54 1c 7d 40 00 ${layers.l3.ttl.toString(16).padStart(2, '0')} 01 00 00 ${layers.l3.srcIp.split('.').map(n => parseInt(n).toString(16).padStart(2, '0')).join(' ')}`,
    `0020   ${layers.l3.destIp.split('.').map(n => parseInt(n).toString(16).padStart(2, '0')).join(' ')} 08 00 4d 5a 00 01 00 01 65 e4`,
    `0030   61 62 63 64 65 66 67 68 69 6a 6b 6c 6d 6e 6f 70 71 72 73 74`,
    `0040   75 76 77 61 62 63 64 65 66 67 68 69`
  ];

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-slate-900 dark:text-white">
              Analyseur de Trame Wireshark
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-sky-100 dark:bg-sky-950/70 text-sky-700 dark:text-sky-300 font-mono">
              {protocol.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span>{from}</span>
            <ArrowRight className="w-3 h-3" />
            <span>{to}</span>
            <span>·</span>
            <span className="font-mono">{timestamp}</span>
          </div>
        </div>

        {/* View toggle */}
        <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <button
            onClick={() => setActiveTab('osi')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'osi'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Couches OSI
          </button>
          <button
            onClick={() => setActiveTab('hex')}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
              activeTab === 'hex'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Hex Dump
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {activeTab === 'osi' ? (
          <>
            {/* Layer 7: Application */}
            {layers.l7 && (
              <div className="rounded-lg border border-purple-200 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/20 p-3 text-xs space-y-1.5">
                <div className="flex items-center justify-between font-semibold text-purple-900 dark:text-purple-300">
                  <span>Couche 7 : Application ({layers.l7.protocol})</span>
                  <HardDrive className="w-3.5 h-3.5" />
                </div>
                <div className="text-slate-600 dark:text-slate-300 font-mono">
                  {layers.l7.message}
                </div>
                {layers.l7.details && (
                  <div className="text-slate-500 dark:text-slate-400 text-2xs">
                    {layers.l7.details}
                  </div>
                )}
              </div>
            )}

            {/* Layer 4: Transport */}
            <div className="rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/20 p-3 text-xs space-y-1.5">
              <div className="flex items-center justify-between font-semibold text-blue-900 dark:text-blue-300">
                <span>Couche 4 : Transport ({layers.l4.type ? 'ICMP' : 'TCP/UDP'})</span>
                <Cpu className="w-3.5 h-3.5" />
              </div>
              <div className="grid grid-cols-2 gap-2 font-mono text-slate-700 dark:text-slate-300">
                {layers.l4.srcPort !== undefined && (
                  <div>Port Source : <span className="text-sky-600 dark:text-sky-400">{layers.l4.srcPort}</span></div>
                )}
                {layers.l4.destPort !== undefined && (
                  <div>Port Dest : <span className="text-sky-600 dark:text-sky-400">{layers.l4.destPort}</span></div>
                )}
                {layers.l4.type && (
                  <div>Type ICMP : <span className="text-sky-600 dark:text-sky-400">{layers.l4.type}</span></div>
                )}
                {layers.l4.code && (
                  <div>Code ICMP : <span className="text-sky-600 dark:text-sky-400">{layers.l4.code}</span></div>
                )}
              </div>
            </div>

            {/* Layer 3: Network (IPv4) */}
            <div className="rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 text-xs space-y-1.5">
              <div className="flex items-center justify-between font-semibold text-emerald-900 dark:text-emerald-300">
                <span>Couche 3 : Réseau (IPv4 Internet Protocol)</span>
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
              <div className="grid grid-cols-2 gap-2 font-mono text-slate-700 dark:text-slate-300">
                <div>IP Source : <span className="text-emerald-700 dark:text-emerald-400">{layers.l3.srcIp}</span></div>
                <div>IP Dest : <span className="text-emerald-700 dark:text-emerald-400">{layers.l3.destIp}</span></div>
                <div>TTL (Time to Live) : <span className="text-slate-600 dark:text-slate-400">{layers.l3.ttl}</span></div>
                <div>Protocole Suivant : <span className="text-slate-600 dark:text-slate-400">{layers.l3.protocol}</span></div>
              </div>
            </div>

            {/* Layer 2: Data Link (Ethernet II) */}
            <div className="rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 p-3 text-xs space-y-1.5">
              <div className="flex items-center justify-between font-semibold text-amber-900 dark:text-amber-300">
                <span>Couche 2 : Liaison de Données (Ethernet II)</span>
                <Layers className="w-3.5 h-3.5" />
              </div>
              <div className="grid grid-cols-2 gap-2 font-mono text-slate-700 dark:text-slate-300">
                <div className="col-span-2">MAC Source : <span className="text-amber-700 dark:text-amber-400">{layers.l2.srcMac}</span></div>
                <div className="col-span-2">MAC Dest : <span className="text-amber-700 dark:text-amber-400">{layers.l2.destMac}</span></div>
                <div>EtherType : <span className="text-slate-600 dark:text-slate-400">{layers.l2.ethType}</span></div>
                <div>Taille Trame : <span className="text-slate-600 dark:text-slate-400">{layers.l2.frameLen} octets</span></div>
              </div>
            </div>

            {/* Layer 1: Physical */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3 text-xs space-y-1.5">
              <div className="font-semibold text-slate-700 dark:text-slate-300">
                Couche 1 : Physique (Bits & Support de Transmission)
              </div>
              <div className="flex items-center justify-between font-mono text-slate-600 dark:text-slate-400">
                <span>Support : {layers.l1.medium}</span>
                <span>Débit : {layers.l1.speed}</span>
                <span>Mode : {layers.l1.duplex}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="bg-slate-950 rounded-lg p-3 text-xs font-mono text-emerald-400 overflow-x-auto space-y-1">
            <div className="text-slate-400 text-2xs pb-2 border-b border-slate-800">
              Offset   Données Brutes Hexadécimales                                  ASCII
            </div>
            {hexDump.map((line, i) => (
              <div key={i} className="whitespace-pre">
                {line}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
