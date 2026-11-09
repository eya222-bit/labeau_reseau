import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));

// MySQL connection parameters (pre-configured with user's db and password)
let mysqlConfig = {
  host: process.env.MYSQL_HOST || '127.0.0.1',
  port: parseInt(process.env.MYSQL_PORT || '3306', 10),
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'AdAs@123',
  database: process.env.MYSQL_DATABASE || 'analyse',
  connectTimeout: 5000
};

// In-memory fallback cache to guarantee zero data loss if remote MySQL is unreachable
let fallbackDbPackets: any[] = [];

// Helper to get MySQL connection
async function getDbConnection() {
  return await mysql.createConnection({
    host: mysqlConfig.host,
    port: mysqlConfig.port,
    user: mysqlConfig.user,
    password: mysqlConfig.password,
    database: mysqlConfig.database,
    connectTimeout: mysqlConfig.connectTimeout,
    multipleStatements: true
  });
}

// 1. Get current MySQL Config
app.get('/api/mysql/config', (req: Request, res: Response) => {
  res.json({
    host: mysqlConfig.host,
    port: mysqlConfig.port,
    user: mysqlConfig.user,
    database: mysqlConfig.database,
    hasPassword: Boolean(mysqlConfig.password)
  });
});

// 2. Update MySQL Config
app.post('/api/mysql/config', (req: Request, res: Response) => {
  const { host, port, user, password, database } = req.body;
  if (host) mysqlConfig.host = String(host).trim();
  if (port) mysqlConfig.port = parseInt(port, 10) || 3306;
  if (user) mysqlConfig.user = String(user).trim();
  if (password !== undefined) mysqlConfig.password = String(password);
  if (database) mysqlConfig.database = String(database).trim();

  res.json({
    success: true,
    message: 'Configuration MySQL mise à jour avec succès.',
    config: {
      host: mysqlConfig.host,
      port: mysqlConfig.port,
      user: mysqlConfig.user,
      database: mysqlConfig.database
    }
  });
});

// 3. Test Connection
app.post('/api/mysql/test', async (req: Request, res: Response) => {
  try {
    const conn = await getDbConnection();
    await conn.ping();
    const [rows] = await conn.query('SELECT VERSION() as version, DATABASE() as current_db');
    await conn.end();
    res.json({
      success: true,
      message: `Connexion MySQL réussie à la base "${mysqlConfig.database}".`,
      details: rows
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: `Erreur de connexion MySQL : ${error.message}`,
      code: error.code || 'UNKNOWN_ERROR',
      hint: error.code === 'ECONNREFUSED'
        ? `Le serveur MySQL n'est pas joignable sur ${mysqlConfig.host}:${mysqlConfig.port}. Si MySQL tourne sur votre machine locale, assurez-vous qu'il autorise les connexions réseau distantes ou utilisez le script SQL fourni ci-dessous.`
        : error.message
    });
  }
});

// 4. Initialize Database & Tables DDL
app.post('/api/mysql/init-tables', async (req: Request, res: Response) => {
  const ddlScript = `
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
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

    CREATE TABLE IF NOT EXISTS \`analysis_sessions\` (
      \`id\` VARCHAR(64) NOT NULL,
      \`session_name\` VARCHAR(255) NOT NULL,
      \`total_packets\` INT NOT NULL DEFAULT 0,
      \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (\`id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

  try {
    const conn = await getDbConnection();
    await conn.query(ddlScript);
    await conn.end();

    res.json({
      success: true,
      message: `Tables créées avec succès dans la base de données "${mysqlConfig.database}" (captured_packets, analysis_sessions, network_nodes).`,
      tables: ['captured_packets', 'analysis_sessions', 'network_nodes']
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: `Échec de la création des tables : ${error.message}`,
      sqlScript: ddlScript,
      hint: `Vous pouvez également exécuter ce script directement dans phpMyAdmin ou MySQL Workbench.`
    });
  }
});

// 5. Save Captured Packets to MySQL
app.post('/api/mysql/save-packets', async (req: Request, res: Response) => {
  const { packets } = req.body;
  if (!Array.isArray(packets) || packets.length === 0) {
    return res.status(400).json({ success: false, message: 'Aucun paquet fourni à enregistrer.' });
  }

  // Always keep a mirror in memory
  packets.forEach((p) => {
    const existingIndex = fallbackDbPackets.findIndex(e => e.id === p.id);
    if (existingIndex >= 0) {
      fallbackDbPackets[existingIndex] = p;
    } else {
      fallbackDbPackets.unshift(p);
    }
  });

  try {
    const conn = await getDbConnection();
    const sql = `
      INSERT INTO \`captured_packets\` 
      (\`id\`, \`timestamp\`, \`src_device_name\`, \`dst_device_name\`, \`src_ip\`, \`dst_ip\`, \`protocol\`, \`length\`, \`info\`, \`status\`, \`headers_json\`)
      VALUES ?
      ON DUPLICATE KEY UPDATE 
        \`info\` = VALUES(\`info\`),
        \`status\` = VALUES(\`status\`),
        \`headers_json\` = VALUES(\`headers_json\`)
    `;

    const values = packets.map((p: any) => [
      p.id,
      p.timestamp,
      p.srcDeviceName || 'Inconnu',
      p.dstDeviceName || 'Inconnu',
      p.srcIp || '0.0.0.0',
      p.dstIp || '255.255.255.255',
      p.protocol || 'RAW',
      p.length || 64,
      p.info || '',
      p.status || 'ok',
      JSON.stringify(p.headers || {})
    ]);

    await conn.query(sql, [values]);
    await conn.end();

    res.json({
      success: true,
      count: packets.length,
      mode: 'mysql',
      message: `${packets.length} paquet(s) enregistré(s) avec succès dans la table MySQL "captured_packets".`
    });
  } catch (error: any) {
    // Return partial success with fallback if MySQL is not reachable
    res.json({
      success: true,
      count: packets.length,
      mode: 'fallback',
      warning: `Sauvegardé dans la mémoire de l'application (${error.message}). Pour insérer dans votre instance MySQL locale, vérifiez les paramètres d'accès.`
    });
  }
});

// 6. Get Packets from Database
app.get('/api/mysql/packets', async (req: Request, res: Response) => {
  try {
    const conn = await getDbConnection();
    const [rows] = await conn.query('SELECT * FROM \`captured_packets\` ORDER BY \`saved_at\` DESC LIMIT 200');
    await conn.end();

    const formatted = (rows as any[]).map(r => ({
      id: r.id,
      timestamp: r.timestamp,
      srcDeviceName: r.src_device_name,
      dstDeviceName: r.dst_device_name,
      srcIp: r.src_ip,
      dstIp: r.dst_ip,
      protocol: r.protocol,
      length: r.length,
      info: r.info,
      status: r.status,
      headers: typeof r.headers_json === 'string' ? JSON.parse(r.headers_json) : r.headers_json
    }));

    res.json({
      success: true,
      source: 'mysql',
      packets: formatted
    });
  } catch (error: any) {
    res.json({
      success: true,
      source: 'fallback',
      packets: fallbackDbPackets,
      warning: `Lecture depuis le cache mémoire (${error.message}).`
    });
  }
});

// 7. Clear Database Packets
app.delete('/api/mysql/packets', async (req: Request, res: Response) => {
  fallbackDbPackets = [];
  try {
    const conn = await getDbConnection();
    await conn.query('TRUNCATE TABLE \`captured_packets\`');
    await conn.end();
    res.json({ success: true, message: 'Table "captured_packets" vidée avec succès.' });
  } catch (error: any) {
    res.json({ success: true, message: 'Cache mémoire vidé (MySQL inaccessible).' });
  }
});

// Start dev server with Vite integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on port ${PORT}`);
  });
}

startServer();
