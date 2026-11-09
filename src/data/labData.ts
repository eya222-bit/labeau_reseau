import { LabChallenge } from '../types/labs';
import { DeviceNode, NetworkLink } from '../types/network';

export const LAB_CHALLENGES: LabChallenge[] = [
  {
    id: 'lab-1',
    category: 'reseau',
    title: 'Lab 1 : Configuration d\'un LAN & Test Ping',
    level: 'Débutant',
    summary: 'Attribuez les adresses IPv4 et le masque adéquat à deux ordinateurs reliés par un Switch pour valider leur connectivité ICMP.',
    context: 'Deux stations de travail (PC-1 et PC-2) sont connectées au commutateur SW-1. Elles ne peuvent actuellement pas communiquer car leurs adresses IP ne sont pas configurées.',
    objectives: [
      'Attribuer à PC-1 l\'adresse 192.168.1.10 avec le masque 255.255.255.0 (/24)',
      'Attribuer à PC-2 l\'adresse 192.168.1.20 avec le masque 255.255.255.0 (/24)',
      'Lancer une commande Ping ICMP depuis PC-1 vers PC-2 et observer l\'échange de trames ARP et Echo ICMP'
    ],
    steps: [
      {
        id: 's1',
        instruction: 'Ouvrez la configuration de PC-1 et saisissez IP = 192.168.1.10 et Masque = 255.255.255.0',
        hint: 'Cliquez sur le nœud PC-1 dans le canvas ou la liste, puis accédez à ses Paramètres Réseau.',
        isCompleted: false
      },
      {
        id: 's2',
        instruction: 'Ouvrez la configuration de PC-2 et saisissez IP = 192.168.1.20 et Masque = 255.255.255.0',
        hint: 'Vérifiez que les deux machines partagent bien le même ID réseau 192.168.1.0/24.',
        isCompleted: false
      },
      {
        id: 's3',
        instruction: 'Déclenchez une simulation Ping depuis PC-1 vers PC-2',
        hint: 'Utilisez le bouton "Envoyer un Paquet" ou le terminal CLI de PC-1 : ping 192.168.1.20',
        isCompleted: false
      }
    ],
    theoryNotes: [
      'Deux hôtes sur le même réseau local Ethernet communiquent directement sans routeur.',
      'Avant d\'envoyer le paquet ICMP, PC-1 émet une requête ARP en broadcast pour découvrir l\'adresse MAC de PC-2.',
      'Le commutateur commute les trames au niveau 2 (L2) en se basant sur sa table MAC/port.'
    ]
  },
  {
    id: 'lab-2',
    category: 'reseau',
    title: 'Lab 2 : Routage Inter-Réseaux & Passerelle par Défaut',
    level: 'Intermédiaire',
    summary: 'Configurez la Default Gateway sur un client pour lui permettre de traverser le routeur et joindre le serveur Web.',
    context: 'Le client PC-Bureau (192.168.1.10) souhaite accéder au serveur Web WEB-SRV (192.168.2.50) hébergé sur un autre sous-réseau. Le routeur R1 possède deux interfaces : g0/0 (192.168.1.1) et g0/1 (192.168.2.1).',
    objectives: [
      'Identifier l\'interface du routeur servant de passerelle pour PC-Bureau',
      'Définir la passerelle par défaut (Gateway = 192.168.1.1) sur PC-Bureau',
      'Simuler une requête HTTP GET vers WEB-SRV (192.168.2.50) et inspecter le passage L3 au niveau du routeur'
    ],
    steps: [
      {
        id: 's1',
        instruction: 'Vérifiez l\'adresse IP de l\'interface du routeur R1 connectée au LAN 1 (192.168.1.1)',
        hint: 'Le routeur agit comme une passerelle entre deux domaines de diffusion différents.',
        isCompleted: false
      },
      {
        id: 's2',
        instruction: 'Configurez la passerelle par défaut de PC-Bureau sur 192.168.1.1',
        hint: 'Sans passerelle configurée, un hôte refuse d\'expédier des paquets vers un sous-réseau hors de son subnet.',
        isCompleted: false
      },
      {
        id: 's3',
        instruction: 'Lancez un test de requête HTTP vers le serveur Web 192.168.2.50',
        hint: 'Le paquet sera acheminé vers le routeur qui décrémentera le TTL et réécrira les adresses MAC L2.',
        isCompleted: false
      }
    ],
    theoryNotes: [
      'Un routeur opère à la couche 3 (Réseau). Il inspecte l\'adresse IP de destination et consulte sa table de routage.',
      'Le routeur remplace l\'en-tête de trame Ethernet L2 (nouvelle MAC source et destination) tout en conservant les IP L3 d\'origine.',
      'Le champ TTL (Time to Live) dans l\'en-tête IPv4 est décrémenté de 1 à chaque saut pour éviter les boucles infinies.'
    ]
  },
  {
    id: 'lab-3',
    category: 'telecom',
    title: 'Lab 3 : Dimensionnement & Bilan de Liaison 5G n78',
    level: 'Intermédiaire',
    summary: 'Ajustez la puissance et la hauteur d\'un site gNodeB 5G pour assurer une couverture minimale de -95 dBm à 3.5 km.',
    context: 'Un opérateur déploie la 5G à 3500 MHz (Bande n78). Une zone résidentielle située à 3.5 km subit des déconnexions car le signal reçu (RSRP) descend en dessous du seuil de sensibilité.',
    objectives: [
      'Calculer l\'affaiblissement en espace libre (FSPL) à 3.5 GHz sur 3.5 km',
      'Optimiser la puissance d\'émission et la hauteur d\'antenne pour obtenir un RSRP >= -90 dBm',
      'Atteindre une capacité théorique de Shannon supérieure à 150 Mbps sur une largeur de 40 MHz'
    ],
    steps: [
      {
        id: 's1',
        instruction: 'Accédez au module "Télécoms 4G/5G" et réglez la fréquence sur 3500 MHz (5G Mid-band)',
        hint: 'Les fréquences élevées subissent une atténuation de parcours nettement plus forte.',
        isCompleted: false
      },
      {
        id: 's2',
        instruction: 'Réglez la distance cible à 3.5 km et ajustez la puissance d\'émission à 46 dBm (40W)',
        hint: 'Augmenter le gain de l\'antenne à 18 dBi permet aussi de focaliser l\'énergie vers les cellules.',
        isCompleted: false
      },
      {
        id: 's3',
        instruction: 'Vérifiez que la marge de liaison est positive et que le débit dépasse 150 Mbps',
        hint: 'Regardez la jauge de couverture et le diagramme de constellation QAM.',
        isCompleted: false
      }
    ],
    theoryNotes: [
      'Formule FSPL : L = 32.44 + 20*log10(f_MHz) + 20*log10(d_km). À 3.5 GHz, la perte est environ 14 dB plus élevée qu\'à 700 MHz.',
      'La formule de Shannon C = B * log2(1 + SINR) montre que le débit dépend linéairement de la bande passante B et logarithmiquement du SINR.',
      'En zone urbaine dense, le modèle Okumura-Hata ou 3GPP UMa/UMi est généralement préféré au simple modèle en espace libre.'
    ]
  },
  {
    id: 'lab-4',
    category: 'telecom',
    title: 'Lab 4 : Dépannage Réflectométrie Fibre Optique (OTDR)',
    level: 'Avancé',
    summary: 'Localisez une coupure de câble sous-marin/terrestre à l\'aide d\'une trace réflectométrique OTDR.',
    context: 'Une liaison métropolitaine de 45 km à 1550 nm subit une interruption de service totale. L\'équipe d\'ingénierie branche un réflectomètre optique (OTDR) pour localiser la coordonnée kilométrique exacte de la rupture.',
    objectives: [
      'Comparer les pertes linéiques à 1310 nm (0.35 dB/km) et 1550 nm (0.20 dB/km)',
      'Détecter l\'événement de rupture et identifier la coordonnée kilométrique de l\'incident',
      'Calculer la marge de puissance optique résiduelle nécessaire après réparation'
    ],
    steps: [
      {
        id: 's1',
        instruction: 'Ouvrez le module "Liaison Fibre & OTDR" et observez la courbe de rétrodiffusion Rayleigh',
        hint: 'La pente régulière représente la décroissance normale de la lumière dans le verre de silice.',
        isCompleted: false
      },
      {
        id: 's2',
        instruction: 'Activez l\'option "Simuler une coupure de fibre" et observez le pic réflectif anormal',
        hint: 'Une cassure nette crée une transition verre/air provoquant une forte réflexion de Fresnel (-14 dB).',
        isCompleted: false
      },
      {
        id: 's3',
        instruction: 'Identifiez la distance exacte de la coupure dans le tableau des événements OTDR',
        hint: 'Cette information permet d\'envoyer l\'équipe d\'intervention directement sur le regard technique adéquat.',
        isCompleted: false
      }
    ],
    theoryNotes: [
      'L\'OTDR envoie des impulsions laser courtes et mesure la lumière rétrodiffusée (effet Rayleigh) et réfléchie (Fresnel).',
      'La longueur d\'onde de 1550 nm offre l\'atténuation la plus faible (fenêtre minimale du verre de silice ~0.2 dB/km), idéale pour les longues liaisons WDM.',
      'Les épissures par fusion thermique ont une perte typique de 0.02 à 0.05 dB, bien inférieure aux connecteurs mécaniques (0.3 à 0.5 dB).'
    ]
  }
];

export const INITIAL_DEVICES: DeviceNode[] = [
  {
    id: 'r1',
    name: 'R1-Passerelle',
    type: 'router',
    x: 480,
    y: 190,
    ip: '192.168.1.1',
    subnetMask: '255.255.255.0',
    gateway: '0.0.0.0',
    dns: '8.8.8.8',
    mac: '00:1A:2B:3C:4D:01',
    status: 'up',
    interfaces: [
      { name: 'Gig0/0', ip: '192.168.1.1', subnetMask: '255.255.255.0', mac: '00:1A:2B:3C:4D:01', status: 'up' },
      { name: 'Gig0/1', ip: '192.168.2.1', subnetMask: '255.255.255.0', mac: '00:1A:2B:3C:4D:02', status: 'up' }
    ],
    routes: [
      { destination: '192.168.1.0', genmask: '255.255.255.0', gateway: '0.0.0.0', interfaceName: 'Gig0/0', metric: 0 },
      { destination: '192.168.2.0', genmask: '255.255.255.0', gateway: '0.0.0.0', interfaceName: 'Gig0/1', metric: 0 }
    ]
  },
  {
    id: 'sw1',
    name: 'SW1-Distribution',
    type: 'switch',
    x: 260,
    y: 200,
    ip: '192.168.1.2',
    subnetMask: '255.255.255.0',
    gateway: '192.168.1.1',
    dns: '8.8.8.8',
    mac: '00:1A:2B:3C:4D:10',
    status: 'up'
  },
  {
    id: 'sw2',
    name: 'SW2-Serveurs',
    type: 'switch',
    x: 700,
    y: 200,
    ip: '192.168.2.2',
    subnetMask: '255.255.255.0',
    gateway: '192.168.2.1',
    dns: '8.8.8.8',
    mac: '00:1A:2B:3C:4D:20',
    status: 'up'
  },
  {
    id: 'pc1',
    name: 'PC-Ingenieur',
    type: 'pc',
    x: 100,
    y: 120,
    ip: '192.168.1.10',
    subnetMask: '255.255.255.0',
    gateway: '192.168.1.1',
    dns: '192.168.2.53',
    mac: 'AA:BB:CC:11:22:01',
    status: 'up'
  },
  {
    id: 'pc2',
    name: 'PC-Labo',
    type: 'laptop',
    x: 100,
    y: 280,
    ip: '192.168.1.20',
    subnetMask: '255.255.255.0',
    gateway: '192.168.1.1',
    dns: '192.168.2.53',
    mac: 'AA:BB:CC:11:22:02',
    status: 'up'
  },
  {
    id: 'srv_web',
    name: 'SRV-Web-FST',
    type: 'server',
    x: 880,
    y: 130,
    ip: '192.168.2.50',
    subnetMask: '255.255.255.0',
    gateway: '192.168.2.1',
    dns: '192.168.2.53',
    mac: 'CC:DD:EE:33:44:01',
    status: 'up',
    services: {
      webServer: {
        enabled: true,
        title: 'Portail Télécom & Réseaux FST',
        body: 'Bienvenue sur le portail universitaire des Réseaux & Télécommunications.'
      }
    }
  },
  {
    id: 'srv_dns',
    name: 'SRV-DNS-DHCP',
    type: 'server',
    x: 880,
    y: 290,
    ip: '192.168.2.53',
    subnetMask: '255.255.255.0',
    gateway: '192.168.2.1',
    dns: '127.0.0.1',
    mac: 'CC:DD:EE:33:44:02',
    status: 'up',
    services: {
      dnsServer: {
        enabled: true,
        records: {
          'telecom.fst.tn': '192.168.2.50',
          'intranet.local': '192.168.2.50'
        }
      },
      dhcpServer: {
        enabled: true,
        startIp: '192.168.1.100',
        endIp: '192.168.1.200',
        mask: '255.255.255.0',
        gateway: '192.168.1.1'
      }
    }
  }
];

export const INITIAL_LINKS: NetworkLink[] = [
  { id: 'l1', fromNodeId: 'pc1', toNodeId: 'sw1', medium: 'copper', bandwidthMbps: 1000, latencyMs: 1, status: 'active' },
  { id: 'l2', fromNodeId: 'pc2', toNodeId: 'sw1', medium: 'copper', bandwidthMbps: 1000, latencyMs: 1, status: 'active' },
  { id: 'l3', fromNodeId: 'sw1', toNodeId: 'r1', medium: 'fiber', bandwidthMbps: 10000, latencyMs: 2, status: 'active' },
  { id: 'l4', fromNodeId: 'r1', toNodeId: 'sw2', medium: 'fiber', bandwidthMbps: 10000, latencyMs: 2, status: 'active' },
  { id: 'l5', fromNodeId: 'sw2', toNodeId: 'srv_web', medium: 'copper', bandwidthMbps: 1000, latencyMs: 1, status: 'active' },
  { id: 'l6', fromNodeId: 'sw2', toNodeId: 'srv_dns', medium: 'copper', bandwidthMbps: 1000, latencyMs: 1, status: 'active' }
];
