import React, { useState, useEffect } from 'react';
import {
  Database,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Play,
  Copy,
  Check,
  Server,
  Layers,
  Save,
  Download,
  Trash2
} from 'lucide-react';
import { CapturedPacket } from '../types/network';

interface DatabaseModalProps {
  onClose: () => void;
  currentPackets: CapturedPacket[];
  onLoadPacketsFromDb: (packets: CapturedPacket[]) => void;
  autoSaveToDb: boolean;
  setAutoSaveToDb: (val: boolean) => void;
}

export const DatabaseModal: React.FC<DatabaseModalProps> = ({
  onClose,
  currentPackets,
  onLoadPacketsFromDb,
  autoSaveToDb,
  setAutoSaveToDb
}) => {
  const [activeTab, setActiveTab] = useState<'status' | 'tables' | 'sql'>('status');

  // Connection settings
  const [host, setHost] = useState('127.0.0.1');
  const [port, setPort] = useState('3306');
  const [user, setUser] = useState('root');
  const [password, setPassword] = useState('AdAs@123');
  const [database, setDatabase] = useState('analyse');

  // Statuses
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'success' | 'error' | 'info'>('info');
  const [copiedSql, setCopiedSql] = useState(false);

  // Stats
  const [dbPacketCount, setDbPacketCount] = useState<number | null>(null);

  // Fetch initial config & count
  useEffect(() => {
    fetch('/api/mysql/config')
      .then(res => res.json())
      .then(data => {
        if (data.host) setHost(data.host);
        if (data.port) setPort(String(data.port));
        if (data.user) setUser(data.user);
        if (data.database) setDatabase(data.database);
      })
      .catch(() => {});

    fetch('/api/mysql/packets')
      .then(res => res.json())
      .then(data => {
        if (data.packets) setDbPacketCount(data.packets.length);
      })
      .catch(() => {});
  }, []);

  const handleSaveConfig = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/mysql/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host, port, user, password, database })
      });
      const data = await res.json();
      setStatusType('success');
      setStatusMessage('Configuration MySQL mise à jour.');
    } catch (e: any) {
      setStatusType('error');
      setStatusMessage('Erreur lors de la mise à jour : ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      // First save current values
      await fetch('/api/mysql/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host, port, user, password, database })
      });

      const res = await fetch('/api/mysql/test', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setStatusType('success');
        setStatusMessage(data.message);
      } else {
        setStatusType('error');
        setStatusMessage(data.message + (data.hint ? ` (${data.hint})` : ''));
      }
    } catch (e: any) {
      setStatusType('error');
      setStatusMessage('Impossible de contacter le serveur backend : ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInitTables = async () => {
    setLoading(true);
    setStatusMessage(null);
    try {
      // Save config first
      await fetch('/api/mysql/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host, port, user, password, database })
      });

      const res = await fetch('/api/mysql/init-tables', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setStatusType('success');
        setStatusMessage(data.message);
      } else {
        setStatusType('error');
        setStatusMessage(data.message);
      }
    } catch (e: any) {
      setStatusType('error');
      setStatusMessage('Erreur lors de la création des tables : ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCurrentPackets = async () => {
    if (currentPackets.length === 0) {
      setStatusType('info');
      setStatusMessage('Aucun paquet dans Wireshark à enregistrer.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/mysql/save-packets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packets: currentPackets })
      });
      const data = await res.json();
      setStatusType('success');
      setStatusMessage(data.message || `${data.count} paquets enregistrés !`);
      setDbPacketCount((prev) => (prev ?? 0) + currentPackets.length);
    } catch (e: any) {
      setStatusType('error');
      setStatusMessage('Erreur lors de l\'enregistrement : ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadFromDb = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/mysql/packets');
      const data = await res.json();
      if (data.packets && data.packets.length > 0) {
        onLoadPacketsFromDb(data.packets);
        setStatusType('success');
        setStatusMessage(`${data.packets.length} paquets chargés depuis la base de données.`);
        setDbPacketCount(data.packets.length);
      } else {
        setStatusType('info');
        setStatusMessage('La table "captured_packets" est actuellement vide.');
      }
    } catch (e: any) {
      setStatusType('error');
      setStatusMessage('Erreur lors du chargement : ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const ddlSqlCode = `-- Script SQL d'initialisation pour la base de données 'analyse'
CREATE DATABASE IF NOT EXISTS \`analyse\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`analyse\`;

-- 1. Table principale pour enregistrer les trames capturées Wireshark
CREATE TABLE IF NOT EXISTS \`captured_packets\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`timestamp\` VARCHAR(32) NOT NULL,
  \`src_device_name\` VARCHAR(128) NOT NULL,
  \`dst_device_name\` VARCHAR(128) NOT NULL,
  \`src_ip\` VARCHAR(64) NOT NULL,
  \`dst_ip\` VARCHAR(64) NOT NULL,
  \`protocol\` VARCHAR(32) NOT NULL,
  \`length\` INT NOT NULL,
  \`info\` TEXT NOT NULL,
  \`status\` VARCHAR(32) NOT NULL,
  \`headers_json\` JSON NULL,
  \`saved_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`),
  INDEX \`idx_protocol\` (\`protocol\`),
  INDEX \`idx_src_ip\` (\`src_ip\`),
  INDEX \`idx_dst_ip\` (\`dst_ip\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Table pour stocker les sessions d'analyse réseau
CREATE TABLE IF NOT EXISTS \`analysis_sessions\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`session_name\` VARCHAR(255) NOT NULL,
  \`total_packets\` INT NOT NULL DEFAULT 0,
  \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Table des équipements et nœuds de la topologie
CREATE TABLE IF NOT EXISTS \`network_nodes\` (
  \`id\` VARCHAR(64) NOT NULL,
  \`name\` VARCHAR(128) NOT NULL,
  \`type\` VARCHAR(64) NOT NULL,
  \`ip_address\` VARCHAR(64) NULL,
  \`mac_address\` VARCHAR(64) NULL,
  \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

  const copySqlToClipboard = () => {
    navigator.clipboard.writeText(ddlSqlCode);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-950 border border-blue-800/80 rounded-lg text-blue-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Gestionnaire Base de Données MySQL</span>
                <span className="text-xs font-mono font-normal text-cyan-400 bg-cyan-950/80 border border-cyan-800/80 px-2 py-0.5 rounded">
                  analyse
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Liaison et enregistrement persistant des paquets et trames Wireshark.
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

        {/* Tabs Bar */}
        <div className="px-6 border-b border-slate-800 flex gap-2 bg-slate-900/40">
          <button
            onClick={() => setActiveTab('status')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'status'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Connexion & Paramètres</span>
          </button>

          <button
            onClick={() => setActiveTab('tables')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'tables'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Structure des Tables & Données</span>
          </button>

          <button
            onClick={() => setActiveTab('sql')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'sql'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Copy className="w-4 h-4" />
            <span>Script SQL (DDL)</span>
          </button>
        </div>

        {/* Status Message Banner */}
        {statusMessage && (
          <div
            className={`mx-6 mt-4 p-3 rounded-xl text-xs flex items-center gap-2 border ${
              statusType === 'success'
                ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300'
                : statusType === 'error'
                ? 'bg-rose-950/60 border-rose-800/80 text-rose-300'
                : 'bg-blue-950/60 border-blue-800/80 text-blue-300'
            }`}
          >
            {statusType === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0" />}
            {statusType === 'error' && <AlertCircle className="w-4 h-4 shrink-0" />}
            {statusType === 'info' && <RefreshCw className="w-4 h-4 shrink-0" />}
            <span className="leading-relaxed">{statusMessage}</span>
          </div>
        )}

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'status' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Hôte MySQL (Serveur)
                  </label>
                  <input
                    type="text"
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                    placeholder="localhost ou 127.0.0.1 ou IP"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Port MySQL
                  </label>
                  <input
                    type="text"
                    value={port}
                    onChange={(e) => setPort(e.target.value)}
                    placeholder="3306"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Nom de la Base de Données
                  </label>
                  <input
                    type="text"
                    value={database}
                    onChange={(e) => setDatabase(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:border-cyan-500 focus:outline-none font-bold text-cyan-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Utilisateur MySQL
                  </label>
                  <input
                    type="text"
                    value={user}
                    onChange={(e) => setUser(e.target.value)}
                    placeholder="root"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Mot de passe MySQL
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={loading}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  <span>Tester la connexion</span>
                </button>

                <button
                  type="button"
                  onClick={handleInitTables}
                  disabled={loading}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-lg shadow-sm shadow-cyan-500/20 flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Créer les Tables dans "analyse"</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveConfig}
                  disabled={loading}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium rounded-lg"
                >
                  Enregistrer les paramètres
                </button>
              </div>

              {/* Auto-sync Switch */}
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-200">
                    Enregistrement automatique des paquets
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Chaque trame capturée dans la simulation est immédiatement persistée en base de données.
                  </p>
                </div>
                <button
                  onClick={() => setAutoSaveToDb(!autoSaveToDb)}
                  className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    autoSaveToDb ? 'bg-cyan-500' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                      autoSaveToDb ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'tables' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-[11px] text-slate-400">Trame(s) en mémoire Wireshark</span>
                  <div className="text-lg font-bold text-white font-mono mt-0.5 tabular-nums">
                    {currentPackets.length}
                  </div>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-[11px] text-slate-400">Paquets enregistrés en BDD</span>
                  <div className="text-lg font-bold text-cyan-400 font-mono mt-0.5 tabular-nums">
                    {dbPacketCount !== null ? dbPacketCount : '—'}
                  </div>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-[11px] text-slate-400">Base active</span>
                  <div className="text-sm font-bold text-emerald-400 font-mono mt-1 truncate">
                    {database}
                  </div>
                </div>
              </div>

              {/* Action Buttons for Sync */}
              <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-3">
                <h4 className="text-xs font-semibold text-slate-300">Synchronisation des Données</h4>
                <div className="flex gap-3">
                  <button
                    onClick={handleSaveCurrentPackets}
                    disabled={currentPackets.length === 0 || loading}
                    className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Enregistrer ({currentPackets.length}) paquets vers MySQL</span>
                  </button>

                  <button
                    onClick={handleLoadFromDb}
                    disabled={loading}
                    className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Recharger depuis la BDD vers l'écran</span>
                  </button>
                </div>
              </div>

              {/* Table descriptions */}
              <div className="space-y-2 text-xs">
                <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl font-mono">
                  <div className="text-cyan-400 font-bold mb-1">Table: captured_packets</div>
                  <p className="text-slate-400 font-sans text-[11px]">
                    Contient les colonnes : id, timestamp, src_device_name, dst_device_name, src_ip, dst_ip, protocol, length, info, status, headers_json (détail OSI complet en JSON), saved_at.
                  </p>
                </div>

                <div className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl font-mono">
                  <div className="text-cyan-400 font-bold mb-1">Table: analysis_sessions</div>
                  <p className="text-slate-400 font-sans text-[11px]">
                    Enregistre les métadonnées de sessions de diagnostic et le volume de trafic simulé.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Vous pouvez copier ce code SQL et l'exécuter directement dans votre client MySQL (ex: phpMyAdmin, MySQL Workbench, DBeaver) :
                </p>
                <button
                  onClick={copySqlToClipboard}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSql ? 'Copié !' : 'Copier le script SQL'}</span>
                </button>
              </div>

              <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-[11px] font-mono text-cyan-300 overflow-x-auto leading-relaxed max-h-80 select-all">
                {ddlSqlCode}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">
            MySQL {database} @ {host}:{port}
          </span>
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
