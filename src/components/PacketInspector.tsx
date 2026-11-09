import React, { useState } from 'react';
import {
  Search,
  Filter,
  Download,
  Trash2,
  ChevronRight,
  ChevronDown,
  Layers,
  FileCode,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { CapturedPacket, PacketHeaders } from '../types/network';

interface PacketInspectorProps {
  packets: CapturedPacket[];
  onClearCapture: () => void;
}

export const PacketInspector: React.FC<PacketInspectorProps> = ({
  packets,
  onClearCapture
}) => {
  const [selectedPacketId, setSelectedPacketId] = useState<string | null>(
    packets.length > 0 ? packets[packets.length - 1].id : null
  );
  const [filterQuery, setFilterQuery] = useState('');
  const [filterProto, setFilterProto] = useState<string>('ALL');

  // Accordion state for OSI layers
  const [openLayers, setOpenLayers] = useState<Record<string, boolean>>({
    l1: true,
    l2: true,
    l3: true,
    l4: true,
    l7: true
  });

  const toggleLayer = (layerKey: string) => {
    setOpenLayers(prev => ({ ...prev, [layerKey]: !prev[layerKey] }));
  };

  const filteredPackets = packets.filter(p => {
    if (filterProto !== 'ALL' && p.protocol !== filterProto) return false;
    if (filterQuery.trim()) {
      const q = filterQuery.toLowerCase();
      return (
        p.srcIp.toLowerCase().includes(q) ||
        p.dstIp.toLowerCase().includes(q) ||
        p.info.toLowerCase().includes(q) ||
        p.srcDeviceName.toLowerCase().includes(q) ||
        p.dstDeviceName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const selectedPacket = packets.find(p => p.id === selectedPacketId) || filteredPackets[0];
  const h: PacketHeaders | undefined = selectedPacket?.headers;

  // Generate simulated hex dump from headers
  const generateHexDump = (pkt: CapturedPacket) => {
    const raw = `${pkt.protocol} ${pkt.srcIp} -> ${pkt.dstIp} ${pkt.info} ${JSON.stringify(pkt.headers.rawPayload || {})}`;
    const lines = [];
    for (let i = 0; i < Math.min(raw.length, 96); i += 16) {
      const chunk = raw.slice(i, i + 16);
      const hexParts = [];
      let ascii = '';
      for (let j = 0; j < 16; j++) {
        if (j < chunk.length) {
          const code = chunk.charCodeAt(j);
          hexParts.push(code.toString(16).padStart(2, '0'));
          ascii += code >= 32 && code <= 126 ? chunk[j] : '.';
        } else {
          hexParts.push('  ');
        }
      }
      lines.push({
        offset: i.toString(16).padStart(4, '0'),
        hex: hexParts.slice(0, 8).join(' ') + '  ' + hexParts.slice(8).join(' '),
        ascii
      });
    }
    return lines;
  };

  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(packets, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `netsim_packet_capture_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-105px)] bg-slate-950 overflow-hidden font-sans">
      {/* Top Filter and Actions Bar */}
      <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Filtrer par IP, machine ou mot-clé (ex: 192.168, ICMP)..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            {['ALL', 'ICMP', 'HTTP', 'TCP', 'DHCP'].map((p) => (
              <button
                key={p}
                onClick={() => setFilterProto(p)}
                className={`px-2.5 py-0.5 rounded text-[11px] font-mono font-medium transition-colors ${
                  filterProto === p
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportJson}
            disabled={packets.length === 0}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Exporter JSON</span>
          </button>

          <button
            onClick={onClearCapture}
            disabled={packets.length === 0}
            className="px-3 py-1.5 bg-slate-800 hover:bg-rose-950/30 disabled:opacity-40 border border-slate-700 hover:border-rose-900/40 rounded-lg text-xs font-medium text-slate-400 hover:text-rose-400 flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Effacer capture</span>
          </button>
        </div>
      </div>

      {/* Main Split Layout: Top Table + Bottom Detail Inspector */}
      <div className="flex-1 flex flex-col min-h-0">
        {/* Packets Table (Wireshark packet list view) */}
        <div className="h-2/5 overflow-y-auto border-b border-slate-800 bg-[#090d16]">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead className="bg-slate-900/90 text-slate-400 text-[11px] sticky top-0 border-b border-slate-800 select-none">
              <tr>
                <th className="py-2 px-3 w-12 text-center">N°</th>
                <th className="py-2 px-3 w-24">Temps</th>
                <th className="py-2 px-3 w-36">Source</th>
                <th className="py-2 px-3 w-36">Destination</th>
                <th className="py-2 px-3 w-24">Protocole</th>
                <th className="py-2 px-3 w-20 text-right">Taille</th>
                <th className="py-2 px-4">Informations d'En-tête & Payload</th>
                <th className="py-2 px-3 w-24 text-center">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredPackets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500 font-sans">
                    Aucun paquet capturé pour le moment. Lancez un Ping ou une requête Web pour observer les trames.
                  </td>
                </tr>
              ) : (
                filteredPackets.map((pkt, idx) => {
                  const isSelected = selectedPacket?.id === pkt.id;
                  let protoBg = 'text-cyan-400';
                  if (pkt.protocol === 'HTTP') protoBg = 'text-emerald-400';
                  if (pkt.protocol === 'DHCP') protoBg = 'text-amber-400';
                  if (pkt.protocol === 'TCP') protoBg = 'text-blue-400';

                  return (
                    <tr
                      key={pkt.id}
                      onClick={() => setSelectedPacketId(pkt.id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-cyan-950/60 text-white font-medium'
                          : 'hover:bg-slate-900/60 text-slate-300'
                      }`}
                    >
                      <td className="py-1.5 px-3 text-center text-slate-500 tabular-nums">
                        {idx + 1}
                      </td>
                      <td className="py-1.5 px-3 text-slate-400 tabular-nums">{pkt.timestamp}</td>
                      <td className="py-1.5 px-3 truncate" title={`${pkt.srcDeviceName} (${pkt.srcIp})`}>
                        {pkt.srcIp}
                      </td>
                      <td className="py-1.5 px-3 truncate" title={`${pkt.dstDeviceName} (${pkt.dstIp})`}>
                        {pkt.dstIp}
                      </td>
                      <td className={`py-1.5 px-3 font-bold ${protoBg}`}>{pkt.protocol}</td>
                      <td className="py-1.5 px-3 text-right text-slate-400 tabular-nums">
                        {pkt.length} B
                      </td>
                      <td className="py-1.5 px-4 truncate font-sans text-xs text-slate-200">
                        {pkt.info}
                      </td>
                      <td className="py-1.5 px-3 text-center">
                        {pkt.status === 'ok' ? (
                          <span className="text-[10px] text-emerald-400 font-sans font-semibold">
                            SUCCÈS
                          </span>
                        ) : (
                          <span className="text-[10px] text-rose-400 font-sans font-semibold">
                            REJETÉ
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Bottom Split: OSI 7 Layers Tree + Hex/ASCII Dump */}
        {selectedPacket && h && (
          <div className="h-3/5 grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-slate-800 bg-[#070b12] overflow-hidden">
            {/* Left: OSI 7-Layer Protocol Tree */}
            <div className="flex flex-col h-full overflow-hidden">
              <div className="px-4 py-2 bg-slate-900/80 border-b border-slate-800 flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span>Arborescence des Couches du Modèle OSI</span>
              </div>

              <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs">
                {/* Layer 1: Physical */}
                <div className="border border-slate-800 rounded-xl bg-slate-900/40 overflow-hidden">
                  <button
                    onClick={() => toggleLayer('l1')}
                    className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-slate-800/40 text-slate-200 font-semibold"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 border border-cyan-800 px-1 rounded">
                        L1
                      </span>
                      <span>Couche Physique (Câble & Signal)</span>
                    </span>
                    {openLayers.l1 ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  {openLayers.l1 && (
                    <div className="p-3 bg-slate-950/60 border-t border-slate-800 text-[11px] font-mono text-slate-300 space-y-1">
                      <div>Interface TX : {selectedPacket.srcDeviceName} (Port actif)</div>
                      <div>Média physique : Câble Cuivre RJ45 UTP Cat6 (1000BASE-T)</div>
                      <div>Débit négocié : 1000 Mbps Full Duplex</div>
                    </div>
                  )}
                </div>

                {/* Layer 2: Data Link (Ethernet II) */}
                <div className="border border-slate-800 rounded-xl bg-slate-900/40 overflow-hidden">
                  <button
                    onClick={() => toggleLayer('l2')}
                    className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-slate-800/40 text-slate-200 font-semibold"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 border border-emerald-800 px-1 rounded">
                        L2
                      </span>
                      <span>Couche Liaison de Données (Ethernet II)</span>
                    </span>
                    {openLayers.l2 ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  {openLayers.l2 && (
                    <div className="p-3 bg-slate-950/60 border-t border-slate-800 text-[11px] font-mono text-slate-300 space-y-1">
                      <div>Adresse MAC Source : {h.srcMac}</div>
                      <div>Adresse MAC Destination : {h.dstMac}</div>
                      <div>EtherType : {h.etherType}</div>
                    </div>
                  )}
                </div>

                {/* Layer 3: Network (IPv4) */}
                <div className="border border-slate-800 rounded-xl bg-slate-900/40 overflow-hidden">
                  <button
                    onClick={() => toggleLayer('l3')}
                    className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-slate-800/40 text-slate-200 font-semibold"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-blue-400 bg-blue-950 border border-blue-800 px-1 rounded">
                        L3
                      </span>
                      <span>Couche Réseau (Internet Protocol v4)</span>
                    </span>
                    {openLayers.l3 ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  {openLayers.l3 && (
                    <div className="p-3 bg-slate-950/60 border-t border-slate-800 text-[11px] font-mono text-slate-300 space-y-1">
                      <div>Adresse IP Source : {h.srcIp || '0.0.0.0'}</div>
                      <div>Adresse IP Destination : {h.dstIp || '255.255.255.255'}</div>
                      <div>TTL (Time to Live) : {h.ttl ?? 64}</div>
                      <div>Protocole encapsulé : {h.protocol || 'ICMP'}</div>
                    </div>
                  )}
                </div>

                {/* Layer 4: Transport (TCP/UDP) */}
                {(h.srcPort || h.flags || h.appProtocol === 'TCP' || h.appProtocol === 'HTTP') && (
                  <div className="border border-slate-800 rounded-xl bg-slate-900/40 overflow-hidden">
                    <button
                      onClick={() => toggleLayer('l4')}
                      className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-slate-800/40 text-slate-200 font-semibold"
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-purple-400 bg-purple-950 border border-purple-800 px-1 rounded">
                          L4
                        </span>
                        <span>Couche Transport ({h.protocol || 'TCP'})</span>
                      </span>
                      {openLayers.l4 ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    {openLayers.l4 && (
                      <div className="p-3 bg-slate-950/60 border-t border-slate-800 text-[11px] font-mono text-slate-300 space-y-1">
                        <div>Port Source : {h.srcPort || 54321}</div>
                        <div>Port Destination : {h.dstPort || 80}</div>
                        {h.flags && <div>Drapeaux TCP (Flags) : [{h.flags.join(', ')}]</div>}
                        {h.seq && <div>Numéro de séquence (SEQ) : {h.seq}</div>}
                        {h.ack && <div>Numéro d'acquittement (ACK) : {h.ack}</div>}
                      </div>
                    )}
                  </div>
                )}

                {/* Layer 7: Application */}
                <div className="border border-slate-800 rounded-xl bg-slate-900/40 overflow-hidden">
                  <button
                    onClick={() => toggleLayer('l7')}
                    className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-slate-800/40 text-slate-200 font-semibold"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-amber-400 bg-amber-950 border border-amber-800 px-1 rounded">
                        L7
                      </span>
                      <span>Couche Application ({h.appProtocol})</span>
                    </span>
                    {openLayers.l7 ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </button>
                  {openLayers.l7 && (
                    <div className="p-3 bg-slate-950/60 border-t border-slate-800 text-[11px] font-mono text-slate-300 space-y-1">
                      <div className="font-bold text-amber-300">{h.messageType || h.appProtocol}</div>
                      <div>Résumé : {h.payloadSummary}</div>
                      {h.rawPayload && (
                        <pre className="mt-2 p-2 bg-slate-900 rounded border border-slate-800 text-[10px] text-cyan-300 overflow-x-auto">
                          {JSON.stringify(h.rawPayload, null, 2)}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Hexadecimal & ASCII Wireshark View */}
            <div className="flex flex-col h-full overflow-hidden">
              <div className="px-4 py-2 bg-slate-900/80 border-b border-slate-800 flex items-center gap-2 text-xs font-semibold text-slate-300">
                <FileCode className="w-4 h-4 text-emerald-400" />
                <span>Décodage Hexadécimal & ASCII (Trame Brute)</span>
              </div>

              <div className="flex-1 overflow-y-auto p-3 font-mono text-[11px] leading-relaxed text-slate-400 select-all">
                {generateHexDump(selectedPacket).map((row, i) => (
                  <div key={i} className="flex gap-4 hover:bg-slate-900/40 px-1.5 py-0.5 rounded">
                    <span className="text-slate-600">{row.offset}</span>
                    <span className="text-cyan-400 font-medium">{row.hex}</span>
                    <span className="text-slate-300 border-l border-slate-800 pl-3">{row.ascii}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
