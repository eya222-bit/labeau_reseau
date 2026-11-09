import React, { useState } from 'react';
import {
  X,
  Settings,
  Terminal,
  Server,
  Shield,
  Layers,
  Send,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { NetworkDevice, NetworkInterface, RoutingEntry, DnsRecord, FirewallRule } from '../types/network';

interface DeviceModalProps {
  device: NetworkDevice;
  onClose: () => void;
  onUpdateDevice: (updated: NetworkDevice) => void;
  onExecutePingFromTerminal: (fromDevice: NetworkDevice, targetIp: string) => void;
  onExecuteHttpFromTerminal: (fromDevice: NetworkDevice, targetUrl: string) => void;
}

export const DeviceModal: React.FC<DeviceModalProps> = ({
  device,
  onClose,
  onUpdateDevice,
  onExecutePingFromTerminal,
  onExecuteHttpFromTerminal
}) => {
  const [activeTab, setActiveTab] = useState<'config' | 'terminal' | 'services' | 'firewall' | 'routing'>('config');

  // Local state for configuration
  const [name, setName] = useState(device.name);
  const [interfaces, setInterfaces] = useState<NetworkInterface[]>(device.interfaces);
  const [defaultGateway, setDefaultGateway] = useState(device.defaultGateway || '');
  const [dnsServer, setDnsServer] = useState(device.dnsServer || '');

  // Terminal state
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    `NetSim OS [Version 12.4(15)T]`,
    `Connexion établie avec ${device.name}. Tapez 'help' pour la liste des commandes.`
  ]);

  // Server Services state
  const [dnsRecords, setDnsRecords] = useState<DnsRecord[]>(device.dnsRecords || []);
  const [newDnsDomain, setNewDnsDomain] = useState('');
  const [newDnsIp, setNewDnsIp] = useState('');

  const [httpTitle, setHttpTitle] = useState(device.httpConfig?.siteTitle || 'Mon Serveur Web');
  const [htmlContent, setHtmlContent] = useState(
    device.httpConfig?.htmlContent || '<h1>Bienvenue sur NetSim Lab</h1>'
  );

  // Firewall rules state
  const [firewallRules, setFirewallRules] = useState<FirewallRule[]>(device.firewallRules || []);
  const [newFwAction, setNewFwAction] = useState<'allow' | 'deny'>('allow');
  const [newFwProto, setNewFwProto] = useState<'ALL' | 'ICMP' | 'TCP' | 'UDP'>('TCP');
  const [newFwPort, setNewFwPort] = useState('80');
  const [newFwDesc, setNewFwDesc] = useState('');

  // Router static routing
  const [routingTable, setRoutingTable] = useState<RoutingEntry[]>(device.routingTable || []);
  const [newRouteDest, setNewRouteDest] = useState('');
  const [newRouteMask, setNewRouteMask] = useState('255.255.255.0');
  const [newRouteHop, setNewRouteHop] = useState('');

  const handleSaveConfig = () => {
    onUpdateDevice({
      ...device,
      name,
      interfaces,
      defaultGateway: defaultGateway.trim() || undefined,
      dnsServer: dnsServer.trim() || undefined,
      dnsRecords,
      httpConfig: device.httpConfig
        ? {
            ...device.httpConfig,
            siteTitle: httpTitle,
            htmlContent
          }
        : undefined,
      firewallRules,
      routingTable
    });
    onClose();
  };

  const handleInterfaceChange = (index: number, field: keyof NetworkInterface, value: any) => {
    const updated = [...interfaces];
    updated[index] = { ...updated[index], [field]: value };
    setInterfaces(updated);
  };

  // Terminal command handler
  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = terminalInput.trim();
    if (!cmd) return;

    const newLogs = [...terminalLogs, `${device.name}> ${cmd}`];
    const parts = cmd.split(' ');
    const mainCmd = parts[0].toLowerCase();
    const arg1 = parts[1];

    if (mainCmd === 'help') {
      newLogs.push(
        `Commandes disponibles :`,
        `  ping <adresse_ip>         - Envoyer 4 paquets ICMP Echo`,
        `  curl <url_ou_ip>          - Effectuer une requête Web HTTP GET`,
        `  ipconfig ou ifconfig      - Afficher les interfaces réseau et IP`,
        `  arp -a                    - Consulter le cache ARP local`,
        `  traceroute <ip>           - Diagnostiquer le chemin réseau`,
        `  clear                     - Effacer l'écran du terminal`
      );
    } else if (mainCmd === 'clear') {
      setTerminalLogs([]);
      setTerminalInput('');
      return;
    } else if (mainCmd === 'ipconfig' || mainCmd === 'ifconfig') {
      interfaces.forEach(iface => {
        newLogs.push(
          `Interface ${iface.name} (${iface.status.toUpperCase()}) :`,
          `  Adresse IPv4 : ${iface.ipAddress || 'Non assignée'}`,
          `  Masque de sous-réseau : ${iface.subnetMask || 'Non assigné'}`,
          `  Adresse Physique MAC : ${iface.macAddress}`
        );
      });
      if (defaultGateway) newLogs.push(`  Passerelle par Défaut : ${defaultGateway}`);
      if (dnsServer) newLogs.push(`  Serveur DNS : ${dnsServer}`);
    } else if (mainCmd === 'arp' && arg1 === '-a') {
      newLogs.push(`Table du Cache ARP :`);
      if (device.arpTable && device.arpTable.length > 0) {
        device.arpTable.forEach(entry => {
          newLogs.push(`  ${entry.ipAddress} -> ${entry.macAddress} (${entry.interfaceName})`);
        });
      } else {
        newLogs.push(`  Aucune entrée dynamique enregistrée.`);
      }
    } else if (mainCmd === 'ping') {
      if (!arg1) {
        newLogs.push(`Usage : ping <adresse_ip>`);
      } else {
        newLogs.push(`Envoi d'un Ping ICMP vers ${arg1}...`);
        onExecutePingFromTerminal(device, arg1);
      }
    } else if (mainCmd === 'curl') {
      if (!arg1) {
        newLogs.push(`Usage : curl <url_ou_ip>`);
      } else {
        newLogs.push(`Connexion HTTP vers ${arg1}...`);
        onExecuteHttpFromTerminal(device, arg1);
      }
    } else {
      newLogs.push(`Commande inconnue : "${mainCmd}". Tapez 'help' pour voir les options.`);
    }

    setTerminalLogs(newLogs);
    setTerminalInput('');
  };

  const handleAddDns = () => {
    if (!newDnsDomain || !newDnsIp) return;
    setDnsRecords([...dnsRecords, { domain: newDnsDomain.trim(), ipAddress: newDnsIp.trim() }]);
    setNewDnsDomain('');
    setNewDnsIp('');
  };

  const handleAddFwRule = () => {
    if (!newFwDesc) return;
    const newRule: FirewallRule = {
      id: `rule-${Date.now()}`,
      action: newFwAction,
      protocol: newFwProto,
      destPort: newFwPort ? parseInt(newFwPort, 10) : undefined,
      description: newFwDesc
    };
    setFirewallRules([...firewallRules, newRule]);
    setNewFwDesc('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-950 border border-cyan-800/80 rounded-lg text-cyan-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>{device.name}</span>
                <span className="text-xs font-normal text-slate-400">({device.type.toUpperCase()})</span>
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                MAC : {device.interfaces[0]?.macAddress || 'N/A'}
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

        {/* Modal Tabs Bar */}
        <div className="px-6 border-b border-slate-800 flex gap-2 overflow-x-auto bg-slate-900/40">
          <button
            onClick={() => setActiveTab('config')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'config'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Configuration IP</span>
          </button>

          <button
            onClick={() => setActiveTab('terminal')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'terminal'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Console CLI Terminal</span>
          </button>

          {device.type === 'server' && (
            <button
              onClick={() => setActiveTab('services')}
              className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                activeTab === 'services'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Server className="w-4 h-4" />
              <span>Services (Web, DNS, DHCP)</span>
            </button>
          )}

          {device.type === 'firewall' && (
            <button
              onClick={() => setActiveTab('firewall')}
              className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                activeTab === 'firewall'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Règles Pare-feu (ACL)</span>
            </button>
          )}

          {device.type === 'router' && (
            <button
              onClick={() => setActiveTab('routing')}
              className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
                activeTab === 'routing'
                  ? 'border-cyan-400 text-cyan-400'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Table de Routage</span>
            </button>
          )}
        </div>

        {/* Modal Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'config' && (
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Nom d'hôte de l'équipement (Hostname)
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              {/* Interfaces list */}
              <div className="space-y-4">
                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Interfaces Réseau Physiques
                </h3>

                {interfaces.map((iface, idx) => (
                  <div key={iface.id} className="p-4 rounded-xl border border-slate-800 bg-slate-950/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-cyan-400 font-mono">
                        Interface {iface.name}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">
                        MAC: {iface.macAddress}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Adresse IPv4</label>
                        <input
                          type="text"
                          value={iface.ipAddress}
                          placeholder="ex: 192.168.1.10"
                          onChange={(e) => handleInterfaceChange(idx, 'ipAddress', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-400 mb-1">Masque de Sous-réseau</label>
                        <input
                          type="text"
                          value={iface.subnetMask}
                          placeholder="ex: 255.255.255.0"
                          onChange={(e) => handleInterfaceChange(idx, 'subnetMask', e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Gateway & DNS */}
              {device.type !== 'switch' && (
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Passerelle par Défaut (Default Gateway)
                    </label>
                    <input
                      type="text"
                      value={defaultGateway}
                      placeholder="ex: 192.168.1.1"
                      onChange={(e) => setDefaultGateway(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Serveur DNS Principal
                    </label>
                    <input
                      type="text"
                      value={dnsServer}
                      placeholder="ex: 192.168.1.254"
                      onChange={(e) => setDnsServer(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'terminal' && (
            <div className="flex flex-col h-80 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden font-mono text-xs">
              <div className="flex-1 p-3 overflow-y-auto space-y-1 text-slate-300">
                {terminalLogs.map((log, i) => (
                  <div key={i} className="leading-relaxed">
                    {log}
                  </div>
                ))}
              </div>

              <form onSubmit={handleTerminalSubmit} className="p-2 border-t border-slate-800 bg-slate-900/80 flex items-center gap-2">
                <span className="text-cyan-400 font-bold">{device.name}&gt;</span>
                <input
                  type="text"
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  placeholder="Tapez 'ping 192.168.1.1' ou 'help'..."
                  className="flex-1 bg-transparent text-slate-100 focus:outline-none placeholder-slate-600"
                  autoFocus
                />
              </form>
            </div>
          )}

          {activeTab === 'services' && (
            <div className="space-y-6">
              {/* Web HTTP Server */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 space-y-3">
                <h3 className="text-xs font-bold text-purple-400 uppercase">Service Web HTTP (Port 80)</h3>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Titre de la Page Web</label>
                  <input
                    type="text"
                    value={httpTitle}
                    onChange={(e) => setHttpTitle(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Contenu HTML Réponse (index.html)</label>
                  <textarea
                    rows={3}
                    value={htmlContent}
                    onChange={(e) => setHtmlContent(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* DNS Records */}
              <div className="p-4 rounded-xl border border-slate-800 bg-slate-950/40 space-y-3">
                <h3 className="text-xs font-bold text-indigo-400 uppercase">Service DNS (Enregistrements A)</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nom de domaine (ex: intranet.lan)"
                    value={newDnsDomain}
                    onChange={(e) => setNewDnsDomain(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                  <input
                    type="text"
                    placeholder="Adresse IP (ex: 192.168.20.80)"
                    value={newDnsIp}
                    onChange={(e) => setNewDnsIp(e.target.value)}
                    className="w-48 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleAddDns}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Ajouter</span>
                  </button>
                </div>

                <div className="divide-y divide-slate-800 text-xs">
                  {dnsRecords.map((rec, i) => (
                    <div key={i} className="py-2 flex items-center justify-between font-mono">
                      <span className="text-slate-200">{rec.domain}</span>
                      <span className="text-cyan-400">&rarr; {rec.ipAddress}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'firewall' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-amber-400 uppercase">Règles de Filtrage Pare-feu (ACL)</h3>

              <div className="grid grid-cols-4 gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <select
                  value={newFwAction}
                  onChange={(e) => setNewFwAction(e.target.value as any)}
                  aria-label="Action de la règle pare-feu"
                  className="bg-slate-900 border border-slate-700 text-xs rounded-lg px-2 py-1.5 text-slate-200"
                >
                  <option value="allow">AUTORISER (ALLOW)</option>
                  <option value="deny">BLOQUER (DENY)</option>
                </select>

                <select
                  value={newFwProto}
                  onChange={(e) => setNewFwProto(e.target.value as any)}
                  aria-label="Protocole réseau à filtrer"
                  className="bg-slate-900 border border-slate-700 text-xs rounded-lg px-2 py-1.5 text-slate-200"
                >
                  <option value="TCP">TCP</option>
                  <option value="UDP">UDP</option>
                  <option value="ICMP">ICMP (Ping)</option>
                  <option value="ALL">TOUT (ALL)</option>
                </select>

                <input
                  type="text"
                  placeholder="Port (ex: 80)"
                  value={newFwPort}
                  onChange={(e) => setNewFwPort(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-xs rounded-lg px-2 py-1.5 text-slate-200 font-mono"
                />

                <button
                  type="button"
                  onClick={handleAddFwRule}
                  className="bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs px-3 py-1.5 flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter Règle</span>
                </button>

                <input
                  type="text"
                  placeholder="Description de la règle..."
                  value={newFwDesc}
                  onChange={(e) => setNewFwDesc(e.target.value)}
                  className="col-span-4 bg-slate-900 border border-slate-700 text-xs rounded-lg px-3 py-1.5 text-slate-200 mt-1"
                />
              </div>

              {/* Rules list */}
              <div className="space-y-2">
                {firewallRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`font-mono px-2 py-0.5 rounded text-[10px] font-bold ${
                          rule.action === 'allow'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}
                      >
                        {rule.action.toUpperCase()}
                      </span>
                      <span className="font-mono text-slate-300">
                        {rule.protocol} {rule.destPort ? `Port ${rule.destPort}` : ''}
                      </span>
                      <span className="text-slate-400">· {rule.description}</span>
                    </div>

                    <button
                      onClick={() => setFirewallRules(firewallRules.filter(r => r.id !== rule.id))}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'routing' && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-blue-400 uppercase">Table de Routage IPv4 (FIB)</h3>

              <div className="space-y-2 font-mono text-xs">
                {routingTable.map((route, i) => (
                  <div key={i} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-cyan-400">{route.destination}</span>
                      <span className="text-slate-500"> / {route.mask}</span>
                    </div>
                    <div className="text-slate-400">
                      Saut suivant : <span className="text-white">{route.nextHop}</span>
                    </div>
                    <span className="text-emerald-400 font-semibold">{route.interfaceName}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
          >
            Fermer
          </button>
          <button
            onClick={handleSaveConfig}
            className="px-5 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow-sm shadow-cyan-400/20 transition-colors"
          >
            Enregistrer les modifications
          </button>
        </div>
      </div>
    </div>
  );
};
