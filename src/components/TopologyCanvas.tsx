import React, { useState, useRef, useEffect } from 'react';
import {
  Router,
  Server,
  Laptop,
  Monitor,
  Wifi,
  Shield,
  Network,
  Trash2,
  Settings,
  Send,
  ZoomIn,
  ZoomOut,
  Maximize2,
  AlertTriangle,
  Radio
} from 'lucide-react';
import { NetworkDevice, NetworkLink, NetworkPacket, DeviceType, CableType } from '../types/network';

interface TopologyCanvasProps {
  devices: NetworkDevice[];
  links: NetworkLink[];
  packets: NetworkPacket[];
  selectedDeviceId: string | null;
  onSelectDevice: (deviceId: string | null) => void;
  onOpenDeviceModal: (device: NetworkDevice) => void;
  onUpdateDevicePosition: (deviceId: string, x: number, y: number) => void;
  onDeleteDevice: (deviceId: string) => void;
  onDeleteLink: (linkId: string) => void;
  cableMode: boolean;
  onConnectDevices: (fromId: string, toId: string, cableType: CableType) => void;
  onInitiatePing: (fromDevice: NetworkDevice) => void;
}

const DEVICE_ICONS: Record<DeviceType, React.ComponentType<{ className?: string }>> = {
  router: Router,
  switch: Network,
  server: Server,
  pc: Monitor,
  laptop: Laptop,
  access_point: Wifi,
  firewall: Shield
};

const DEVICE_COLORS: Record<DeviceType, { bg: string; border: string; text: string; ring: string }> = {
  router: { bg: 'bg-blue-950/80', border: 'border-blue-500/50', text: 'text-blue-400', ring: 'ring-blue-400' },
  switch: { bg: 'bg-emerald-950/80', border: 'border-emerald-500/50', text: 'text-emerald-400', ring: 'ring-emerald-400' },
  server: { bg: 'bg-purple-950/80', border: 'border-purple-500/50', text: 'text-purple-400', ring: 'ring-purple-400' },
  pc: { bg: 'bg-cyan-950/80', border: 'border-cyan-500/50', text: 'text-cyan-400', ring: 'ring-cyan-400' },
  laptop: { bg: 'bg-teal-950/80', border: 'border-teal-500/50', text: 'text-teal-400', ring: 'ring-teal-400' },
  access_point: { bg: 'bg-indigo-950/80', border: 'border-indigo-500/50', text: 'text-indigo-400', ring: 'ring-indigo-400' },
  firewall: { bg: 'bg-amber-950/80', border: 'border-amber-500/50', text: 'text-amber-400', ring: 'ring-amber-400' }
};

export const TopologyCanvas: React.FC<TopologyCanvasProps> = ({
  devices,
  links,
  packets,
  selectedDeviceId,
  onSelectDevice,
  onOpenDeviceModal,
  onUpdateDevicePosition,
  onDeleteDevice,
  onDeleteLink,
  cableMode,
  onConnectDevices,
  onInitiatePing
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Pan and Zoom
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Node Dragging
  const [draggingDeviceId, setDraggingDeviceId] = useState<string | null>(null);
  const [nodeOffset, setNodeOffset] = useState({ x: 0, y: 0 });

  // Cable creation source node
  const [cableSourceId, setCableSourceId] = useState<string | null>(null);

  // Selected link
  const [selectedLinkId, setSelectedLinkId] = useState<string | null>(null);

  // Handle Dragging Nodes
  const handleNodeMouseDown = (e: React.MouseEvent, device: NetworkDevice) => {
    e.stopPropagation();

    if (cableMode) {
      if (!cableSourceId) {
        setCableSourceId(device.id);
      } else if (cableSourceId !== device.id) {
        onConnectDevices(cableSourceId, device.id, 'copper');
        setCableSourceId(null);
      }
      return;
    }

    onSelectDevice(device.id);
    setSelectedLinkId(null);
    setDraggingDeviceId(device.id);
    setNodeOffset({
      x: (e.clientX - pan.x) / zoom - device.x,
      y: (e.clientY - pan.y) / zoom - device.y
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggingDeviceId) {
      const newX = Math.round(((e.clientX - pan.x) / zoom - nodeOffset.x) / 10) * 10;
      const newY = Math.round(((e.clientY - pan.y) / zoom - nodeOffset.y) / 10) * 10;
      onUpdateDevicePosition(draggingDeviceId, Math.max(40, newX), Math.max(40, newY));
    } else if (isPanning) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setDraggingDeviceId(null);
    setIsPanning(false);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.target === containerRef.current || (e.target as HTMLElement).tagName === 'svg') {
      onSelectDevice(null);
      setSelectedLinkId(null);
      setCableSourceId(null);
      setIsPanning(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  // Zoom controls
  const handleZoom = (delta: number) => {
    setZoom(prev => Math.min(2.0, Math.max(0.5, prev + delta)));
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="relative flex-1 h-[calc(100vh-105px)] bg-[#070b12] overflow-hidden select-none cursor-crosshair"
      style={{
        backgroundImage: `radial-gradient(rgba(51, 65, 85, 0.25) 1px, transparent 1px)`,
        backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
        backgroundPosition: `${pan.x}px ${pan.y}px`
      }}
    >
      {/* Cable Mode Banner */}
      {cableMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-amber-950/90 border border-amber-500/50 text-amber-200 text-xs px-4 py-2 rounded-xl shadow-lg backdrop-blur-md flex items-center gap-2">
          <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>
            {cableSourceId
              ? `Sélectionnez l'appareil de destination pour brancher le câble...`
              : 'Cliquez sur le premier équipement à relier...'}
          </span>
          {cableSourceId && (
            <button
              onClick={() => setCableSourceId(null)}
              className="ml-2 text-slate-400 hover:text-white underline text-[11px]"
            >
              Annuler
            </button>
          )}
        </div>
      )}

      {/* SVG Container for Cables and Animated Packets */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0'
        }}
      >
        <defs>
          <linearGradient id="linkActiveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. Network Cables / Links */}
        {links.map((link) => {
          const fromDev = devices.find(d => d.id === link.fromDeviceId);
          const toDev = devices.find(d => d.id === link.toDeviceId);
          if (!fromDev || !toDev) return null;

          const isSelected = selectedLinkId === link.id;
          const isWireless = link.type === 'wireless';
          const isFiber = link.type === 'fiber';

          let strokeColor = '#334155'; // default slate-700
          if (isSelected) strokeColor = '#06b6d4';
          else if (isFiber) strokeColor = '#f59e0b';
          else if (isWireless) strokeColor = '#818cf8';

          return (
            <g key={link.id} className="pointer-events-auto cursor-pointer" onClick={() => setSelectedLinkId(link.id)}>
              {/* Invisible thicker stroke for easier clicking */}
              <line
                x1={fromDev.x + 36}
                y1={fromDev.y + 36}
                x2={toDev.x + 36}
                y2={toDev.y + 36}
                stroke="transparent"
                strokeWidth={16}
              />
              {/* Visible Cable */}
              <line
                x1={fromDev.x + 36}
                y1={fromDev.y + 36}
                x2={toDev.x + 36}
                y2={toDev.y + 36}
                stroke={strokeColor}
                strokeWidth={isSelected ? 3 : 2}
                strokeDasharray={isWireless ? '6,6' : undefined}
                className="transition-colors"
              />
              {/* Midpoint link badge (speed / latency) */}
              <circle
                cx={(fromDev.x + toDev.x) / 2 + 36}
                cy={(fromDev.y + toDev.y) / 2 + 36}
                r={4}
                fill={link.status === 'active' ? '#10b981' : '#ef4444'}
              />
            </g>
          );
        })}

        {/* 2. In-Flight Animated Packets */}
        {packets.map((pkt) => {
          if (pkt.status !== 'in-flight' || pkt.currentHopIndex >= pkt.hops.length) return null;
          const currentHop = pkt.hops[pkt.currentHopIndex];
          if (!currentHop) return null;

          const fromDev = devices.find(d => d.id === currentHop.fromDeviceId);
          const toDev = devices.find(d => d.id === currentHop.toDeviceId);
          if (!fromDev || !toDev) return null;

          // Interpolate coordinates based on progress (0 to 1)
          const curX = (fromDev.x + 36) + ((toDev.x + 36) - (fromDev.x + 36)) * currentHop.durationMs > 0 ? (fromDev.x + 36) + ((toDev.x - fromDev.x) * pkt.progress) : fromDev.x + 36;
          const curY = (fromDev.y + 36) + ((toDev.y - fromDev.y) * pkt.progress);

          const isDropped = currentHop.dropped && pkt.progress >= 0.95;

          return (
            <g key={pkt.id} transform={`translate(${curX}, ${curY})`} filter="url(#glow)">
              {isDropped ? (
                // Dropped cross marker
                <g>
                  <circle r={14} fill="#7f1d1d" stroke="#ef4444" strokeWidth={2} />
                  <path d="M-5,-5 L5,5 M5,-5 L-5,5" stroke="#ffffff" strokeWidth={2.5} strokeLinecap="round" />
                  <text y={24} textAnchor="middle" fill="#f87171" fontSize="10" fontWeight="bold">
                    REJETÉ
                  </text>
                </g>
              ) : (
                // Flying packet capsule
                <g>
                  <rect
                    x={-28}
                    y={-11}
                    width={56}
                    height={22}
                    rx={6}
                    fill="#0f172a"
                    stroke="#06b6d4"
                    strokeWidth={1.5}
                  />
                  <circle cx={-18} cy={0} r={4} fill="#22d3ee" className="animate-pulse" />
                  <text
                    x={2}
                    y={3.5}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="9.5"
                    fontFamily="JetBrains Mono"
                    fontWeight="600"
                  >
                    {currentHop.headers.appProtocol}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      {/* 3. HTML Nodes Layer (Devices) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0'
        }}
      >
        {devices.map((device) => {
          const Icon = DEVICE_ICONS[device.type] || Monitor;
          const colors = DEVICE_COLORS[device.type] || DEVICE_COLORS.pc;
          const isSelected = selectedDeviceId === device.id;
          const isCableSource = cableSourceId === device.id;
          const primaryIf = device.interfaces[0];
          const ipLabel = primaryIf?.ipAddress || (primaryIf?.isDhcp ? 'DHCP...' : 'Non configuré');

          return (
            <div
              key={device.id}
              onMouseDown={(e) => handleNodeMouseDown(e, device)}
              onDoubleClick={() => onOpenDeviceModal(device)}
              style={{
                left: `${device.x}px`,
                top: `${device.y}px`,
                width: '72px',
                height: '72px'
              }}
              className={`absolute pointer-events-auto rounded-2xl p-2.5 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing transition-shadow ${colors.bg} border ${colors.border} shadow-lg backdrop-blur-sm ${
                isSelected ? `ring-2 ${colors.ring} shadow-cyan-500/20` : ''
              } ${isCableSource ? 'ring-2 ring-amber-400 animate-pulse' : ''}`}
            >
              {/* Online indicator */}
              <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400" />

              {/* Hardware Icon */}
              <div className={`${colors.text}`}>
                <Icon className="w-7 h-7" />
              </div>

              {/* Device Name */}
              <span className="text-[10.5px] font-semibold text-slate-100 text-center truncate w-full mt-1">
                {device.name}
              </span>

              {/* IP / Info subtext */}
              <span className="text-[9px] font-mono text-slate-400 text-center truncate w-full tracking-tight">
                {ipLabel}
              </span>

              {/* Quick contextual action buttons when selected */}
              {isSelected && !cableMode && (
                <div className="absolute -top-9 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-900 border border-slate-700 p-1 rounded-lg shadow-xl z-20">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenDeviceModal(device);
                    }}
                    className="p-1 hover:bg-slate-800 text-slate-300 hover:text-white rounded"
                    title="Configurer l'équipement"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onInitiatePing(device);
                    }}
                    className="p-1 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 rounded"
                    title="Envoyer un Ping depuis cet hôte"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteDevice(device.id);
                    }}
                    className="p-1 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 rounded"
                    title="Supprimer cet équipement"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Selected Link Floating Action */}
      {selectedLinkId && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 bg-slate-900 border border-slate-700 px-4 py-2 rounded-xl shadow-xl flex items-center gap-3 text-xs text-slate-300">
          <span>Lien sélectionné (Câble Ethernet 1Gbps)</span>
          <button
            onClick={() => {
              onDeleteLink(selectedLinkId);
              setSelectedLinkId(null);
            }}
            className="px-2 py-1 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 rounded font-medium flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            <span>Débrancher le câble</span>
          </button>
        </div>
      )}

      {/* Canvas Viewport Zoom Controls */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-xl shadow-lg backdrop-blur-md">
        <button
          onClick={() => handleZoom(0.1)}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          title="Zoomer (+)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <span className="text-[11px] font-mono text-slate-400 px-1 tabular-nums">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => handleZoom(-0.1)}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          title="Dézoomer (-)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="h-4 w-px bg-slate-800" />
        <button
          onClick={resetView}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          title="Réinitialiser la vue"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
