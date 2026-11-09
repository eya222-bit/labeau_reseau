import React, { useState } from 'react';
import { X, Send, Globe, Zap, AlertCircle } from 'lucide-react';
import { NetworkDevice, ProtocolType } from '../types/network';

interface PacketInjectionModalProps {
  devices: NetworkDevice[];
  onClose: () => void;
  onSendPing: (srcDevice: NetworkDevice, targetIp: string) => void;
  onSendHttp: (srcDevice: NetworkDevice, targetUrl: string) => void;
  onSendDhcp: (srcDevice: NetworkDevice) => void;
  initialSourceDevice?: NetworkDevice;
}

export const PacketInjectionModal: React.FC<PacketInjectionModalProps> = ({
  devices,
  onClose,
  onSendPing,
  onSendHttp,
  onSendDhcp,
  initialSourceDevice
}) => {
  const eligibleSources = devices.filter(d => d.type !== 'switch');
  const [srcDeviceId, setSrcDeviceId] = useState<string>(
    initialSourceDevice?.id || (eligibleSources[0]?.id ?? '')
  );

  const [protoType, setProtoType] = useState<'ping' | 'http' | 'dhcp'>('ping');

  // Destination options
  const [targetMode, setTargetMode] = useState<'select' | 'manual'>('select');
  const [targetDeviceId, setTargetDeviceId] = useState<string>(
    eligibleSources.find(d => d.id !== srcDeviceId)?.id ?? ''
  );
  const [manualIp, setManualIp] = useState('192.168.20.80');
  const [httpUrl, setHttpUrl] = useState('intranet.lan');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const selectedSrc = devices.find(d => d.id === srcDeviceId);
  const selectedDst = devices.find(d => d.id === targetDeviceId);

  const handleLaunch = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!selectedSrc) {
      setErrorMsg('Veuillez sélectionner un équipement source.');
      return;
    }

    if (protoType === 'ping') {
      const targetIp =
        targetMode === 'select'
          ? selectedDst?.interfaces[0]?.ipAddress
          : manualIp.trim();

      if (!targetIp) {
        setErrorMsg('Adresse IP de destination non définie ou invalide.');
        return;
      }
      onSendPing(selectedSrc, targetIp);
      onClose();
    } else if (protoType === 'http') {
      const url = httpUrl.trim() || 'intranet.lan';
      onSendHttp(selectedSrc, url);
      onClose();
    } else if (protoType === 'dhcp') {
      onSendDhcp(selectedSrc);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-950 border border-cyan-800/80 rounded-lg text-cyan-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Injecter un Paquet Réseau</h2>
              <p className="text-xs text-slate-400">
                Générez des flux animés et observez le parcours hop-by-hop.
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

        {/* Form Body */}
        <form onSubmit={handleLaunch} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-950/50 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Protocol choice tabs */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-2">Protocole à injecter</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setProtoType('ping')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  protoType === 'ping'
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Ping ICMP</span>
              </button>

              <button
                type="button"
                onClick={() => setProtoType('http')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  protoType === 'http'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Web HTTP</span>
              </button>

              <button
                type="button"
                onClick={() => setProtoType('dhcp')}
                className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                  protoType === 'dhcp'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>DHCP DORA</span>
              </button>
            </div>
          </div>

          {/* Source Device */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Équipement Source (Émetteur)
            </label>
            <select
              value={srcDeviceId}
              onChange={(e) => setSrcDeviceId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
            >
              {eligibleSources.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.interfaces[0]?.ipAddress || 'Sans IP'})
                </option>
              ))}
            </select>
          </div>

          {/* Destination according to protocol */}
          {protoType === 'ping' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">Destination</label>
                <div className="flex text-[11px] gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetMode('select')}
                    className={`${targetMode === 'select' ? 'text-cyan-400 font-bold' : 'text-slate-500'}`}
                  >
                    Choisir un équipement
                  </button>
                  <span className="text-slate-700">|</span>
                  <button
                    type="button"
                    onClick={() => setTargetMode('manual')}
                    className={`${targetMode === 'manual' ? 'text-cyan-400 font-bold' : 'text-slate-500'}`}
                  >
                    IP manuelle
                  </button>
                </div>
              </div>

              {targetMode === 'select' ? (
                <select
                  value={targetDeviceId}
                  onChange={(e) => setTargetDeviceId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                >
                  {eligibleSources
                    .filter(d => d.id !== srcDeviceId)
                    .map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.interfaces[0]?.ipAddress || 'N/A'})
                      </option>
                    ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={manualIp}
                  onChange={(e) => setManualIp(e.target.value)}
                  placeholder="ex: 192.168.20.80"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                />
              )}
            </div>
          )}

          {protoType === 'http' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                URL cible ou Nom de Domaine
              </label>
              <input
                type="text"
                value={httpUrl}
                onChange={(e) => setHttpUrl(e.target.value)}
                placeholder="ex: intranet.lan ou 192.168.20.80"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
              />
              <span className="text-[11px] text-slate-500 mt-1 block">
                Effectue d'abord la résolution DNS (si nécessaire), puis le handshake TCP SYN et la réponse HTTP 200 OK.
              </span>
            </div>
          )}

          {protoType === 'dhcp' && (
            <div className="p-3 bg-amber-950/30 border border-amber-800/40 rounded-xl text-xs text-amber-300/90 leading-relaxed">
              Le poste source diffusera un paquet broadcast <strong>DHCP Discover</strong> sur le réseau local. Le serveur DHCP répondra avec une <strong>DHCP Offer</strong> puis accordera le bail après <strong>DHCP Request / Ack</strong>.
            </div>
          )}

          {/* Modal Action Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl shadow-md shadow-cyan-400/20 flex items-center gap-2 transition-all"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Lancer la Simulation de Paquet</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
