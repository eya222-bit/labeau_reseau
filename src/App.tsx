import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { DevicePalette } from './components/DevicePalette';
import { Toolbar } from './components/Toolbar';
import { TopologyCanvas } from './components/TopologyCanvas';
import { DeviceModal } from './components/DeviceModal';
import { PacketInspector } from './components/PacketInspector';
import { SubnetCalculatorModal } from './components/SubnetCalculatorModal';
import { PacketInjectionModal } from './components/PacketInjectionModal';
import { ScenariosView } from './components/ScenariosView';
import { PRESET_SCENARIOS } from './data/presetScenarios';
import {
  NetworkDevice,
  NetworkLink,
  NetworkPacket,
  CapturedPacket,
  ScenarioPreset,
  DeviceType,
  CableType
} from './types/network';
import {
  buildPingTransaction,
  buildHttpTransaction,
  buildDhcpTransaction
} from './simulation/networkEngine';
import { generateRandomMac } from './utils/ipUtils';

export default function App() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'canvas' | 'scenarios' | 'subnet' | 'wireshark'>('canvas');

  // Topology data
  const [activeScenarioId, setActiveScenarioId] = useState<string>(PRESET_SCENARIOS[0].id);
  const [devices, setDevices] = useState<NetworkDevice[]>(PRESET_SCENARIOS[0].devices);
  const [links, setLinks] = useState<NetworkLink[]>(PRESET_SCENARIOS[0].links);

  // Selected item and tools
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null);
  const [deviceModalTarget, setDeviceModalTarget] = useState<NetworkDevice | null>(null);
  const [cableMode, setCableMode] = useState(false);

  // Modals
  const [showPingModal, setShowPingModal] = useState(false);
  const [showSubnetModal, setShowSubnetModal] = useState(false);
  const [injectionSourceDevice, setInjectionSourceDevice] = useState<NetworkDevice | undefined>(undefined);

  // Simulation engine state
  const [isSimulating, setIsSimulating] = useState(true);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [packets, setPackets] = useState<NetworkPacket[]>([]);
  const [capturedPackets, setCapturedPackets] = useState<CapturedPacket[]>([]);
  const [lastSimEvent, setLastSimEvent] = useState<string>('Banc prêt. Prêt pour simulation.');

  // Simulation Loop
  const lastTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const delta = now - lastTimeRef.current;
      lastTimeRef.current = now;

      if (!isSimulating || packets.length === 0) return;

      setPackets((prevPackets) => {
        let hasChanges = false;
        const newPackets: NetworkPacket[] = [];
        const newCaptured: CapturedPacket[] = [];

        for (const pkt of prevPackets) {
          if (pkt.status !== 'in-flight') continue;

          const currentHop = pkt.hops[pkt.currentHopIndex];
          if (!currentHop) {
            newPackets.push({ ...pkt, status: 'delivered' });
            hasChanges = true;
            continue;
          }

          const stepProgress = (delta / (currentHop.durationMs / simSpeed));
          const nextProgress = pkt.progress + stepProgress;

          if (nextProgress >= 1.0) {
            hasChanges = true;
            // Record hop in captured Wireshark log
            const fromDev = devices.find(d => d.id === currentHop.fromDeviceId);
            const toDev = devices.find(d => d.id === currentHop.toDeviceId);

            const timestamp = new Date().toTimeString().split(' ')[0] + '.' + Math.floor(now % 1000);

            newCaptured.push({
              id: `cap-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
              timestamp,
              srcDeviceName: fromDev?.name || currentHop.fromDeviceId,
              dstDeviceName: toDev?.name || currentHop.toDeviceId,
              srcIp: currentHop.headers.srcIp || '0.0.0.0',
              dstIp: currentHop.headers.dstIp || '255.255.255.255',
              protocol: currentHop.headers.appProtocol,
              info: currentHop.headers.payloadSummary,
              length: currentHop.headers.rawPayload?.sizeBytes || 64,
              status: currentHop.dropped ? 'dropped' : 'ok',
              headers: currentHop.headers
            });

            if (currentHop.dropped) {
              setLastSimEvent(`Paquet rejeté : ${currentHop.dropReason || 'Filtrage pare-feu'}`);
              newPackets.push({
                ...pkt,
                progress: 1.0,
                status: 'dropped'
              });
            } else if (pkt.currentHopIndex + 1 < pkt.hops.length) {
              // Advance to next hop
              newPackets.push({
                ...pkt,
                currentHopIndex: pkt.currentHopIndex + 1,
                progress: 0.0
              });
            } else {
              // Packet completed journey
              newPackets.push({
                ...pkt,
                progress: 1.0,
                status: 'delivered'
              });
              setLastSimEvent(`Flux terminé : ${pkt.description} (Succès)`);

              // If DHCP DORA delivered, dynamically lease IP to client device!
              if (pkt.protocol === 'DHCP') {
                const targetDevId = pkt.sourceDeviceId;
                setDevices((prevDevs) =>
                  prevDevs.map((d) => {
                    if (d.id === targetDevId && d.interfaces[0]) {
                      return {
                        ...d,
                        defaultGateway: '10.0.0.1',
                        dnsServer: '10.0.0.254',
                        interfaces: [
                          {
                            ...d.interfaces[0],
                            ipAddress: '10.0.0.100',
                            subnetMask: '255.255.255.0',
                            isDhcp: false
                          }
                        ]
                      };
                    }
                    return d;
                  })
                );
              }
            }
          } else {
            newPackets.push({
              ...pkt,
              progress: nextProgress
            });
            hasChanges = true;
          }
        }

        if (newCaptured.length > 0) {
          setCapturedPackets((prev) => [...prev, ...newCaptured]);
        }

        return hasChanges ? newPackets : prevPackets;
      });
    }, 40);

    return () => clearInterval(interval);
  }, [isSimulating, simSpeed, devices, packets.length]);

  // Load a scenario
  const handleSelectScenario = (scenario: ScenarioPreset) => {
    setActiveScenarioId(scenario.id);
    setDevices(scenario.devices);
    setLinks(scenario.links);
    setPackets([]);
    setSelectedDeviceId(null);
    setLastSimEvent(`Scénario chargé : ${scenario.title}`);
    setActiveTab('canvas');
  };

  // Run scenario suggested action
  const handleRunSuggestedAction = (scenario: ScenarioPreset) => {
    if (!scenario.suggestedAction) return;
    const { type, fromId, target } = scenario.suggestedAction;
    const srcDev = scenario.devices.find(d => d.id === fromId);
    if (!srcDev) return;

    if (type === 'ping') {
      handleSendPing(srcDev, target);
    } else if (type === 'http') {
      handleSendHttp(srcDev, target);
    } else if (type === 'dhcp') {
      handleSendDhcp(srcDev);
    }
  };

  // Send Ping
  const handleSendPing = (srcDevice: NetworkDevice, targetIp: string) => {
    const { packet, error } = buildPingTransaction(srcDevice, targetIp, devices, links);
    if (error) {
      setLastSimEvent(`Erreur Ping : ${error}`);
      return;
    }
    setPackets((prev) => [...prev, packet]);
    setLastSimEvent(`Envoi Ping : ${srcDevice.name} -> ${targetIp}`);
  };

  // Send HTTP
  const handleSendHttp = (srcDevice: NetworkDevice, targetUrl: string) => {
    const { packet, error } = buildHttpTransaction(srcDevice, targetUrl, devices, links);
    if (error) {
      setLastSimEvent(`Erreur HTTP : ${error}`);
      return;
    }
    setPackets((prev) => [...prev, packet]);
    setLastSimEvent(`Requête Web HTTP : ${srcDevice.name} -> ${targetUrl}`);
  };

  // Send DHCP
  const handleSendDhcp = (clientDevice: NetworkDevice) => {
    const { packet, error } = buildDhcpTransaction(clientDevice, devices, links);
    if (error) {
      setLastSimEvent(`Erreur DHCP : ${error}`);
      return;
    }
    setPackets((prev) => [...prev, packet]);
    setLastSimEvent(`Diffusion DHCP DORA initiée par ${clientDevice.name}`);
  };

  // Add Device to Canvas
  const handleAddDevice = (type: DeviceType) => {
    const count = devices.filter(d => d.type === type).length + 1;
    const typeNames: Record<DeviceType, string> = {
      router: 'Routeur',
      switch: 'Switch',
      server: 'Serveur',
      pc: 'PC',
      laptop: 'Laptop',
      access_point: 'Borne-WiFi',
      firewall: 'Pare-feu'
    };

    const newId = `dev-${type}-${Date.now()}`;
    const name = `${typeNames[type]}-${count}`;

    let ipAddress = '192.168.1.' + (20 + count);
    if (type === 'switch' || type === 'access_point') ipAddress = '';

    const newDevice: NetworkDevice = {
      id: newId,
      name,
      type,
      x: 320 + (count % 3) * 120,
      y: 240 + Math.floor(count / 3) * 90,
      interfaces: [
        {
          id: `${newId}-if0`,
          name: type === 'router' ? 'g0/0' : 'eth0',
          macAddress: generateRandomMac(),
          ipAddress,
          subnetMask: ipAddress ? '255.255.255.0' : '',
          isDhcp: false,
          status: 'up'
        }
      ],
      defaultGateway: type !== 'router' && type !== 'switch' ? '192.168.1.1' : undefined,
      arpTable: []
    };

    if (type === 'server') {
      newDevice.httpConfig = {
        enabled: true,
        port: 80,
        siteTitle: 'Portail Local',
        htmlContent: '<h2>Serveur Web</h2><p>Page hébergée localement.</p>'
      };
    }

    if (type === 'firewall') {
      newDevice.firewallRules = [
        { id: `rule-${Date.now()}`, action: 'allow', protocol: 'TCP', destPort: 80, description: 'Autoriser Web' },
        { id: `rule-${Date.now() + 1}`, action: 'deny', protocol: 'ICMP', description: 'Bloquer ICMP Ping' }
      ];
    }

    setDevices((prev) => [...prev, newDevice]);
    setSelectedDeviceId(newId);
    setLastSimEvent(`Équipement ajouté : ${name}`);
  };

  // Connect two devices with cable
  const handleConnectDevices = (fromId: string, toId: string, cableType: CableType) => {
    // Check if link already exists
    const exists = links.some(
      l => (l.fromDeviceId === fromId && l.toDeviceId === toId) ||
           (l.fromDeviceId === toId && l.toDeviceId === fromId)
    );
    if (exists) {
      setLastSimEvent('Un câble relie déjà ces deux équipements.');
      return;
    }

    const fromDev = devices.find(d => d.id === fromId);
    const toDev = devices.find(d => d.id === toId);
    if (!fromDev || !toDev) return;

    const newLink: NetworkLink = {
      id: `link-${Date.now()}`,
      fromDeviceId: fromId,
      fromInterfaceId: fromDev.interfaces[0]?.id || 'if0',
      toDeviceId: toId,
      toInterfaceId: toDev.interfaces[0]?.id || 'if0',
      type: cableType,
      bandwidthMbps: 1000,
      latencyMs: 2,
      status: 'active'
    };

    setLinks((prev) => [...prev, newLink]);
    setCableMode(false);
    setLastSimEvent(`Liaison établie : ${fromDev.name} <---> ${toDev.name}`);
  };

  // Delete device
  const handleDeleteDevice = (deviceId: string) => {
    setDevices((prev) => prev.filter(d => d.id !== deviceId));
    setLinks((prev) => prev.filter(l => l.fromDeviceId !== deviceId && l.toDeviceId !== deviceId));
    if (selectedDeviceId === deviceId) setSelectedDeviceId(null);
  };

  // Delete link
  const handleDeleteLink = (linkId: string) => {
    setLinks((prev) => prev.filter(l => l.id !== linkId));
    setLastSimEvent('Câble réseau débranché.');
  };

  // Step forward single packet hop
  const handleStepForward = () => {
    setPackets((prevPackets) => {
      const newPackets: NetworkPacket[] = [];
      const newCaptured: CapturedPacket[] = [];

      for (const pkt of prevPackets) {
        if (pkt.status !== 'in-flight') continue;

        const currentHop = pkt.hops[pkt.currentHopIndex];
        if (!currentHop) continue;

        const fromDev = devices.find(d => d.id === currentHop.fromDeviceId);
        const toDev = devices.find(d => d.id === currentHop.toDeviceId);
        const timestamp = new Date().toTimeString().split(' ')[0];

        newCaptured.push({
          id: `cap-${Date.now()}`,
          timestamp,
          srcDeviceName: fromDev?.name || currentHop.fromDeviceId,
          dstDeviceName: toDev?.name || currentHop.toDeviceId,
          srcIp: currentHop.headers.srcIp || '0.0.0.0',
          dstIp: currentHop.headers.dstIp || '255.255.255.255',
          protocol: currentHop.headers.appProtocol,
          info: currentHop.headers.payloadSummary,
          length: 64,
          status: currentHop.dropped ? 'dropped' : 'ok',
          headers: currentHop.headers
        });

        if (currentHop.dropped) {
          newPackets.push({ ...pkt, progress: 1.0, status: 'dropped' });
        } else if (pkt.currentHopIndex + 1 < pkt.hops.length) {
          newPackets.push({ ...pkt, currentHopIndex: pkt.currentHopIndex + 1, progress: 0.0 });
        } else {
          newPackets.push({ ...pkt, progress: 1.0, status: 'delivered' });
        }
      }

      if (newCaptured.length > 0) {
        setCapturedPackets((prev) => [...prev, ...newCaptured]);
      }

      return newPackets;
    });
  };

  const inFlightCount = packets.filter(p => p.status === 'in-flight').length;

  return (
    <div className="flex flex-col h-screen w-screen bg-[#070b12] text-slate-100 overflow-hidden font-sans">
      {/* Top Bar Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={(t) => {
          if (t === 'subnet') setShowSubnetModal(true);
          else setActiveTab(t);
        }}
        onOpenPingModal={() => {
          setInjectionSourceDevice(undefined);
          setShowPingModal(true);
        }}
        packetCount={capturedPackets.length}
      />

      {/* Main Content Area */}
      {activeTab === 'canvas' && (
        <div className="flex flex-col flex-1 min-h-0">
          {/* Simulation Control Toolbar */}
          <Toolbar
            isSimulating={isSimulating}
            setIsSimulating={setIsSimulating}
            simSpeed={simSpeed}
            setSimSpeed={setSimSpeed}
            onStepForward={handleStepForward}
            activeScenarioId={activeScenarioId}
            onSelectScenario={handleSelectScenario}
            onQuickPing={() => {
              setInjectionSourceDevice(undefined);
              setShowPingModal(true);
            }}
            onQuickHttp={() => {
              setInjectionSourceDevice(undefined);
              setShowPingModal(true);
            }}
            inFlightCount={inFlightCount}
            lastSimEvent={lastSimEvent}
          />

          {/* Canvas + Hardware Palette Split */}
          <div className="flex flex-1 min-h-0">
            <DevicePalette
              onAddDevice={handleAddDevice}
              cableMode={cableMode}
              setCableMode={setCableMode}
              onClearCanvas={() => {
                setDevices([]);
                setLinks([]);
                setPackets([]);
                setLastSimEvent('Topologie effacée.');
              }}
              onResetLayout={() => {
                const found = PRESET_SCENARIOS.find(s => s.id === activeScenarioId);
                if (found) handleSelectScenario(found);
              }}
              deviceCount={devices.length}
              linkCount={links.length}
            />

            <TopologyCanvas
              devices={devices}
              links={links}
              packets={packets}
              selectedDeviceId={selectedDeviceId}
              onSelectDevice={setSelectedDeviceId}
              onOpenDeviceModal={setDeviceModalTarget}
              onUpdateDevicePosition={(id, x, y) => {
                setDevices((prev) => prev.map(d => d.id === id ? { ...d, x, y } : d));
              }}
              onDeleteDevice={handleDeleteDevice}
              onDeleteLink={handleDeleteLink}
              cableMode={cableMode}
              onConnectDevices={handleConnectDevices}
              onInitiatePing={(dev) => {
                setInjectionSourceDevice(dev);
                setShowPingModal(true);
              }}
            />
          </div>
        </div>
      )}

      {activeTab === 'scenarios' && (
        <ScenariosView
          currentScenarioId={activeScenarioId}
          onSelectScenario={handleSelectScenario}
          onRunSuggestedAction={handleRunSuggestedAction}
        />
      )}

      {activeTab === 'wireshark' && (
        <PacketInspector
          packets={capturedPackets}
          onClearCapture={() => setCapturedPackets([])}
        />
      )}

      {/* Device Configuration & Terminal Modal */}
      {deviceModalTarget && (
        <DeviceModal
          device={deviceModalTarget}
          onClose={() => setDeviceModalTarget(null)}
          onUpdateDevice={(updated) => {
            setDevices((prev) => prev.map(d => d.id === updated.id ? updated : d));
          }}
          onExecutePingFromTerminal={(dev, targetIp) => {
            handleSendPing(dev, targetIp);
          }}
          onExecuteHttpFromTerminal={(dev, targetUrl) => {
            handleSendHttp(dev, targetUrl);
          }}
        />
      )}

      {/* Packet Injection Modal */}
      {showPingModal && (
        <PacketInjectionModal
          devices={devices}
          onClose={() => setShowPingModal(false)}
          onSendPing={handleSendPing}
          onSendHttp={handleSendHttp}
          onSendDhcp={handleSendDhcp}
          initialSourceDevice={injectionSourceDevice}
        />
      )}

      {/* VLSM / Subnet Calculator Modal */}
      {showSubnetModal && (
        <SubnetCalculatorModal
          onClose={() => setShowSubnetModal(false)}
        />
      )}
    </div>
  );
}
