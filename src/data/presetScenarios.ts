import { NetworkDevice, NetworkLink, ScenarioPreset } from '../types/network';

export const PRESET_SCENARIOS: ScenarioPreset[] = [
  {
    id: 'enterprise-subnets',
    title: 'Réseau Entreprise Multi-Sous-Réseaux',
    category: 'Routage & Modèle OSI',
    description: 'Deux sous-réseaux (Ingénierie & Serveurs) interconnectés par un routeur central avec résolution DNS et Web HTTP.',
    suggestedAction: {
      type: 'ping',
      fromId: 'dev-pc-eng',
      target: '192.168.20.80',
      label: 'Ping PC-Ingénieur vers Serveur Web (192.168.20.80)'
    },
    devices: [
      {
        id: 'dev-r1',
        name: 'Routeur-R1',
        type: 'router',
        x: 480,
        y: 200,
        interfaces: [
          {
            id: 'r1-g00',
            name: 'g0/0',
            macAddress: '00:1A:2B:3C:01:01',
            ipAddress: '192.168.10.1',
            subnetMask: '255.255.255.0',
            isDhcp: false,
            status: 'up'
          },
          {
            id: 'r1-g01',
            name: 'g0/1',
            macAddress: '00:1A:2B:3C:01:02',
            ipAddress: '192.168.20.1',
            subnetMask: '255.255.255.0',
            isDhcp: false,
            status: 'up'
          }
        ],
        routingTable: [
          { destination: '192.168.10.0', mask: '255.255.255.0', nextHop: 'Direct', interfaceName: 'g0/0' },
          { destination: '192.168.20.0', mask: '255.255.255.0', nextHop: 'Direct', interfaceName: 'g0/1' }
        ],
        arpTable: [
          { ipAddress: '192.168.10.10', macAddress: '00:50:79:AA:01:01', interfaceName: 'g0/0', timestamp: Date.now() },
          { ipAddress: '192.168.20.80', macAddress: '00:50:79:BB:01:80', interfaceName: 'g0/1', timestamp: Date.now() }
        ]
      },
      {
        id: 'dev-sw-a',
        name: 'Switch-Ingénierie',
        type: 'switch',
        x: 240,
        y: 330,
        interfaces: [
          { id: 'swa-fa1', name: 'Fa0/1', macAddress: '00:2A:3B:4C:01:01', ipAddress: '', subnetMask: '', isDhcp: false, status: 'up' },
          { id: 'swa-fa2', name: 'Fa0/2', macAddress: '00:2A:3B:4C:01:02', ipAddress: '', subnetMask: '', isDhcp: false, status: 'up' },
          { id: 'swa-fa3', name: 'Fa0/3', macAddress: '00:2A:3B:4C:01:03', ipAddress: '', subnetMask: '', isDhcp: false, status: 'up' }
        ],
        arpTable: [],
        macTable: {}
      },
      {
        id: 'dev-sw-b',
        name: 'Switch-Datacenter',
        type: 'switch',
        x: 720,
        y: 330,
        interfaces: [
          { id: 'swb-fa1', name: 'Fa0/1', macAddress: '00:2B:3C:4D:01:01', ipAddress: '', subnetMask: '', isDhcp: false, status: 'up' },
          { id: 'swb-fa2', name: 'Fa0/2', macAddress: '00:2B:3C:4D:01:02', ipAddress: '', subnetMask: '', isDhcp: false, status: 'up' },
          { id: 'swb-fa3', name: 'Fa0/3', macAddress: '00:2B:3C:4D:01:03', ipAddress: '', subnetMask: '', isDhcp: false, status: 'up' }
        ],
        arpTable: [],
        macTable: {}
      },
      {
        id: 'dev-pc-eng',
        name: 'PC-Ingénieur-1',
        type: 'pc',
        x: 120,
        y: 460,
        interfaces: [
          {
            id: 'pc1-eth0',
            name: 'eth0',
            macAddress: '00:50:79:AA:01:01',
            ipAddress: '192.168.10.10',
            subnetMask: '255.255.255.0',
            isDhcp: false,
            status: 'up'
          }
        ],
        defaultGateway: '192.168.10.1',
        dnsServer: '192.168.20.2',
        arpTable: [
          { ipAddress: '192.168.10.1', macAddress: '00:1A:2B:3C:01:01', interfaceName: 'eth0', timestamp: Date.now() }
        ]
      },
      {
        id: 'dev-laptop-eng',
        name: 'Laptop-Ingénieur-2',
        type: 'laptop',
        x: 260,
        y: 480,
        interfaces: [
          {
            id: 'lap1-eth0',
            name: 'eth0',
            macAddress: '00:50:79:AA:01:02',
            ipAddress: '192.168.10.11',
            subnetMask: '255.255.255.0',
            isDhcp: false,
            status: 'up'
          }
        ],
        defaultGateway: '192.168.10.1',
        dnsServer: '192.168.20.2',
        arpTable: []
      },
      {
        id: 'dev-srv-dns',
        name: 'Serveur-DNS',
        type: 'server',
        x: 640,
        y: 470,
        interfaces: [
          {
            id: 'dns-eth0',
            name: 'eth0',
            macAddress: '00:50:79:BB:01:02',
            ipAddress: '192.168.20.2',
            subnetMask: '255.255.255.0',
            isDhcp: false,
            status: 'up'
          }
        ],
        defaultGateway: '192.168.20.1',
        arpTable: [],
        dnsRecords: [
          { domain: 'intranet.lan', ipAddress: '192.168.20.80' },
          { domain: 'portal.company.tn', ipAddress: '192.168.20.80' }
        ]
      },
      {
        id: 'dev-srv-web',
        name: 'Serveur-Web-HTTP',
        type: 'server',
        x: 820,
        y: 470,
        interfaces: [
          {
            id: 'web-eth0',
            name: 'eth0',
            macAddress: '00:50:79:BB:01:80',
            ipAddress: '192.168.20.80',
            subnetMask: '255.255.255.0',
            isDhcp: false,
            status: 'up'
          }
        ],
        defaultGateway: '192.168.20.1',
        arpTable: [
          { ipAddress: '192.168.20.1', macAddress: '00:1A:2B:3C:01:02', interfaceName: 'eth0', timestamp: Date.now() }
        ],
        httpConfig: {
          enabled: true,
          port: 80,
          siteTitle: 'Portail Intranet Entreprise',
          htmlContent: '<h1>Bienvenue sur l\'intranet de NetSim Lab</h1><p>Connexion HTTP 200 OK réussie à travers le routeur R1.</p>'
        }
      }
    ],
    links: [
      { id: 'link-r1-swa', fromDeviceId: 'dev-r1', fromInterfaceId: 'r1-g00', toDeviceId: 'dev-sw-a', toInterfaceId: 'swa-fa1', type: 'copper', bandwidthMbps: 1000, latencyMs: 2, status: 'active' },
      { id: 'link-r1-swb', fromDeviceId: 'dev-r1', fromInterfaceId: 'r1-g01', toDeviceId: 'dev-sw-b', toInterfaceId: 'swb-fa1', type: 'copper', bandwidthMbps: 1000, latencyMs: 2, status: 'active' },
      { id: 'link-swa-pc1', fromDeviceId: 'dev-sw-a', fromInterfaceId: 'swa-fa2', toDeviceId: 'dev-pc-eng', toInterfaceId: 'pc1-eth0', type: 'copper', bandwidthMbps: 100, latencyMs: 1, status: 'active' },
      { id: 'link-swa-lap1', fromDeviceId: 'dev-sw-a', fromInterfaceId: 'swa-fa3', toDeviceId: 'dev-laptop-eng', toInterfaceId: 'lap1-eth0', type: 'copper', bandwidthMbps: 100, latencyMs: 1, status: 'active' },
      { id: 'link-swb-dns', fromDeviceId: 'dev-sw-b', fromInterfaceId: 'swb-fa2', toDeviceId: 'dev-srv-dns', toInterfaceId: 'dns-eth0', type: 'copper', bandwidthMbps: 1000, latencyMs: 1, status: 'active' },
      { id: 'link-swb-web', fromDeviceId: 'dev-sw-b', fromInterfaceId: 'swb-fa3', toDeviceId: 'dev-srv-web', toInterfaceId: 'web-eth0', type: 'copper', bandwidthMbps: 1000, latencyMs: 1, status: 'active' }
    ]
  },
  {
    id: 'home-wireless-lan',
    title: 'LAN Domestique avec Borne WiFi',
    category: 'Réseaux Locaux & Sans-Fil',
    description: 'Routeur Passerelle avec switch et point d\'accès WiFi 802.11ac pour postes fixes et nomades.',
    suggestedAction: {
      type: 'ping',
      fromId: 'dev-laptop-wifi',
      target: '192.168.1.1',
      label: 'Ping Laptop WiFi vers Passerelle (192.168.1.1)'
    },
    devices: [
      {
        id: 'dev-gw',
        name: 'Box-Routeur-Passerelle',
        type: 'router',
        x: 480,
        y: 180,
        interfaces: [
          { id: 'gw-lan', name: 'LAN1', macAddress: '00:11:22:33:44:01', ipAddress: '192.168.1.1', subnetMask: '255.255.255.0', isDhcp: false, status: 'up' }
        ],
        arpTable: []
      },
      {
        id: 'dev-sw-home',
        name: 'Switch-Salon',
        type: 'switch',
        x: 480,
        y: 320,
        interfaces: [
          { id: 'swh-1', name: 'Port1', macAddress: '00:11:22:33:55:01', ipAddress: '', subnetMask: '', isDhcp: false, status: 'up' },
          { id: 'swh-2', name: 'Port2', macAddress: '00:11:22:33:55:02', ipAddress: '', subnetMask: '', isDhcp: false, status: 'up' },
          { id: 'swh-3', name: 'Port3', macAddress: '00:11:22:33:55:03', ipAddress: '', subnetMask: '', isDhcp: false, status: 'up' },
          { id: 'swh-4', name: 'Port4', macAddress: '00:11:22:33:55:04', ipAddress: '', subnetMask: '', isDhcp: false, status: 'up' }
        ],
        arpTable: [],
        macTable: {}
      },
      {
        id: 'dev-pc-desk',
        name: 'PC-Bureau',
        type: 'pc',
        x: 240,
        y: 470,
        interfaces: [
          { id: 'pcd-eth0', name: 'eth0', macAddress: '00:50:79:CC:01:01', ipAddress: '192.168.1.10', subnetMask: '255.255.255.0', isDhcp: false, status: 'up' }
        ],
        defaultGateway: '192.168.1.1',
        arpTable: []
      },
      {
        id: 'dev-ap',
        name: 'Borne-WiFi-AP',
        type: 'access_point',
        x: 720,
        y: 330,
        interfaces: [
          { id: 'ap-eth0', name: 'eth0', macAddress: '00:50:79:EE:01:01', ipAddress: '', subnetMask: '', isDhcp: false, status: 'up' },
          { id: 'ap-wlan0', name: 'wlan0', macAddress: '00:50:79:EE:01:02', ipAddress: '', subnetMask: '', isDhcp: false, status: 'up' }
        ],
        arpTable: []
      },
      {
        id: 'dev-laptop-wifi',
        name: 'Laptop-WiFi',
        type: 'laptop',
        x: 820,
        y: 470,
        interfaces: [
          { id: 'lapw-wlan0', name: 'wlan0', macAddress: '00:50:79:CC:02:02', ipAddress: '192.168.1.15', subnetMask: '255.255.255.0', isDhcp: false, status: 'up' }
        ],
        defaultGateway: '192.168.1.1',
        arpTable: []
      }
    ],
    links: [
      { id: 'lh-gw-sw', fromDeviceId: 'dev-gw', fromInterfaceId: 'gw-lan', toDeviceId: 'dev-sw-home', toInterfaceId: 'swh-1', type: 'copper', bandwidthMbps: 1000, latencyMs: 1, status: 'active' },
      { id: 'lh-sw-pc', fromDeviceId: 'dev-sw-home', fromInterfaceId: 'swh-2', toDeviceId: 'dev-pc-desk', toInterfaceId: 'pcd-eth0', type: 'copper', bandwidthMbps: 1000, latencyMs: 1, status: 'active' },
      { id: 'lh-sw-ap', fromDeviceId: 'dev-sw-home', fromInterfaceId: 'swh-3', toDeviceId: 'dev-ap', toInterfaceId: 'ap-eth0', type: 'copper', bandwidthMbps: 1000, latencyMs: 1, status: 'active' },
      { id: 'lh-ap-lap', fromDeviceId: 'dev-ap', fromInterfaceId: 'ap-wlan0', toDeviceId: 'dev-laptop-wifi', toInterfaceId: 'lapw-wlan0', type: 'wireless', bandwidthMbps: 300, latencyMs: 4, status: 'active' }
    ]
  },
  {
    id: 'dhcp-dora-lab',
    title: 'Attribution Automatique DHCP (Processus DORA)',
    category: 'Protocoles de Services',
    description: 'Expérimentez le cycle DHCP Discover (Broadcast), DHCP Offer, DHCP Request et DHCP ACK.',
    suggestedAction: {
      type: 'dhcp',
      fromId: 'dev-pc-guest',
      target: '',
      label: 'Demander une IP via DHCP (DORA) pour PC-Invité'
    },
    devices: [
      {
        id: 'dev-sw-dhcp',
        name: 'Switch-Campus',
        type: 'switch',
        x: 480,
        y: 280,
        interfaces: [
          { id: 'swd-1', name: 'Fa0/1', macAddress: '00:3A:4B:5C:01:01', ipAddress: '', subnetMask: '', isDhcp: false, status: 'up' },
          { id: 'swd-2', name: 'Fa0/2', macAddress: '00:3A:4B:5C:01:02', ipAddress: '', subnetMask: '', isDhcp: false, status: 'up' },
          { id: 'swd-3', name: 'Fa0/3', macAddress: '00:3A:4B:5C:01:03', ipAddress: '', subnetMask: '', isDhcp: false, status: 'up' }
        ],
        arpTable: [],
        macTable: {}
      },
      {
        id: 'dev-srv-dhcp',
        name: 'Serveur-DHCP',
        type: 'server',
        x: 480,
        y: 120,
        interfaces: [
          { id: 'dhcpsrv-eth0', name: 'eth0', macAddress: '00:50:79:DD:01:FE', ipAddress: '10.0.0.254', subnetMask: '255.255.255.0', isDhcp: false, status: 'up' }
        ],
        arpTable: [],
        dhcpConfig: {
          enabled: true,
          poolStart: '10.0.0.100',
          poolEnd: '10.0.0.200',
          subnetMask: '255.255.255.0',
          defaultGateway: '10.0.0.1',
          dnsServer: '10.0.0.254',
          leasedIps: {}
        }
      },
      {
        id: 'dev-pc-guest',
        name: 'PC-Invité (Sans IP)',
        type: 'pc',
        x: 280,
        y: 440,
        interfaces: [
          { id: 'pcg-eth0', name: 'eth0', macAddress: '00:50:79:DD:02:11', ipAddress: '0.0.0.0', subnetMask: '0.0.0.0', isDhcp: true, status: 'up' }
        ],
        arpTable: []
      },
      {
        id: 'dev-pc-admin',
        name: 'PC-Admin-Fixe',
        type: 'pc',
        x: 680,
        y: 440,
        interfaces: [
          { id: 'pca-eth0', name: 'eth0', macAddress: '00:50:79:DD:02:99', ipAddress: '10.0.0.10', subnetMask: '255.255.255.0', isDhcp: false, status: 'up' }
        ],
        defaultGateway: '10.0.0.1',
        arpTable: []
      }
    ],
    links: [
      { id: 'ld-srv-sw', fromDeviceId: 'dev-srv-dhcp', fromInterfaceId: 'dhcpsrv-eth0', toDeviceId: 'dev-sw-dhcp', toInterfaceId: 'swd-1', type: 'copper', bandwidthMbps: 1000, latencyMs: 1, status: 'active' },
      { id: 'ld-sw-guest', fromDeviceId: 'dev-sw-dhcp', fromInterfaceId: 'swd-2', toDeviceId: 'dev-pc-guest', toInterfaceId: 'pcg-eth0', type: 'copper', bandwidthMbps: 100, latencyMs: 2, status: 'active' },
      { id: 'ld-sw-admin', fromDeviceId: 'dev-sw-dhcp', fromInterfaceId: 'swd-3', toDeviceId: 'dev-pc-admin', toInterfaceId: 'pca-eth0', type: 'copper', bandwidthMbps: 1000, latencyMs: 1, status: 'active' }
    ]
  },
  {
    id: 'firewall-security-lab',
    title: 'Filtrage Réseau & Pare-feu (ACL Inspection)',
    category: 'Sécurité Réseau',
    description: 'Pare-feu filtrant configuré pour autoriser le trafic Web HTTP tout en rejetant les requêtes ICMP Ping.',
    suggestedAction: {
      type: 'ping',
      fromId: 'dev-fw-pc',
      target: '172.16.0.80',
      label: 'Tester Ping (Sera bloqué par le Pare-feu)'
    },
    devices: [
      {
        id: 'dev-fw-pc',
        name: 'PC-Client-LAN',
        type: 'pc',
        x: 200,
        y: 320,
        interfaces: [
          { id: 'fwpc-eth0', name: 'eth0', macAddress: '00:50:79:FF:01:10', ipAddress: '10.10.10.10', subnetMask: '255.255.255.0', isDhcp: false, status: 'up' }
        ],
        defaultGateway: '10.10.10.1',
        arpTable: []
      },
      {
        id: 'dev-firewall',
        name: 'Pare-feu-Edge',
        type: 'firewall',
        x: 480,
        y: 320,
        interfaces: [
          { id: 'fw-lan', name: 'eth0 (LAN)', macAddress: '00:50:79:FF:00:01', ipAddress: '10.10.10.1', subnetMask: '255.255.255.0', isDhcp: false, status: 'up' },
          { id: 'fw-wan', name: 'eth1 (WAN)', macAddress: '00:50:79:FF:00:02', ipAddress: '172.16.0.1', subnetMask: '255.255.255.0', isDhcp: false, status: 'up' }
        ],
        firewallRules: [
          { id: 'rule-http', action: 'allow', protocol: 'TCP', destPort: 80, description: 'Autoriser Web HTTP (Port 80)' },
          { id: 'rule-dns', action: 'allow', protocol: 'UDP', destPort: 53, description: 'Autoriser DNS (Port 53)' },
          { id: 'rule-icmp', action: 'deny', protocol: 'ICMP', description: 'Bloquer les sondes ICMP Ping' }
        ],
        arpTable: []
      },
      {
        id: 'dev-web-target',
        name: 'Serveur-DMZ-Web',
        type: 'server',
        x: 760,
        y: 320,
        interfaces: [
          { id: 'srvtarget-eth0', name: 'eth0', macAddress: '00:50:79:FF:02:80', ipAddress: '172.16.0.80', subnetMask: '255.255.255.0', isDhcp: false, status: 'up' }
        ],
        defaultGateway: '172.16.0.1',
        arpTable: [],
        httpConfig: {
          enabled: true,
          port: 80,
          siteTitle: 'Serveur Web Sécurisé DMZ',
          htmlContent: '<h2>Accès Autorisé</h2><p>Le pare-feu a validé le paquet TCP sur le port 80.</p>'
        }
      }
    ],
    links: [
      { id: 'lf-pc-fw', fromDeviceId: 'dev-fw-pc', fromInterfaceId: 'fwpc-eth0', toDeviceId: 'dev-firewall', toInterfaceId: 'fw-lan', type: 'copper', bandwidthMbps: 1000, latencyMs: 2, status: 'active' },
      { id: 'lf-fw-srv', fromDeviceId: 'dev-firewall', fromInterfaceId: 'fw-wan', toDeviceId: 'dev-web-target', toInterfaceId: 'srvtarget-eth0', type: 'copper', bandwidthMbps: 1000, latencyMs: 2, status: 'active' }
    ]
  }
];
