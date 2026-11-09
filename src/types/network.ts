export type DeviceType = 'router' | 'switch' | 'server' | 'pc' | 'laptop' | 'access_point' | 'firewall';

export type CableType = 'copper' | 'fiber' | 'wireless';

export interface NetworkInterface {
  id: string;
  name: string; // e.g. "eth0", "g0/0", "wlan0"
  macAddress: string;
  ipAddress: string;
  subnetMask: string;
  isDhcp: boolean;
  status: 'up' | 'down';
}

export interface RoutingEntry {
  destination: string; // e.g. "0.0.0.0" or "192.168.2.0"
  mask: string; // e.g. "0.0.0.0" or "255.255.255.0"
  nextHop: string; // e.g. "192.168.1.1" or "Direct"
  interfaceName: string;
}

export interface ArpEntry {
  ipAddress: string;
  macAddress: string;
  interfaceName: string;
  timestamp: number;
}

export interface DnsRecord {
  domain: string;
  ipAddress: string;
}

export interface DhcpConfig {
  enabled: boolean;
  poolStart: string;
  poolEnd: string;
  subnetMask: string;
  defaultGateway: string;
  dnsServer: string;
  leasedIps: Record<string, string>; // mac -> ip
}

export interface HttpServiceConfig {
  enabled: boolean;
  port: number;
  siteTitle: string;
  htmlContent: string;
}

export interface FirewallRule {
  id: string;
  action: 'allow' | 'deny';
  protocol: 'ALL' | 'ICMP' | 'TCP' | 'UDP';
  destPort?: number;
  sourceIp?: string;
  description: string;
}

export interface NetworkDevice {
  id: string;
  name: string;
  type: DeviceType;
  x: number;
  y: number;
  interfaces: NetworkInterface[];
  defaultGateway?: string;
  dnsServer?: string;
  routingTable?: RoutingEntry[];
  arpTable: ArpEntry[];
  macTable?: Record<string, string>; // Switch: MAC -> Port/Interface
  // Server specific
  dhcpConfig?: DhcpConfig;
  dnsRecords?: DnsRecord[];
  httpConfig?: HttpServiceConfig;
  // Firewall specific
  firewallRules?: FirewallRule[];
}

export interface NetworkLink {
  id: string;
  fromDeviceId: string;
  fromInterfaceId: string;
  toDeviceId: string;
  toInterfaceId: string;
  type: CableType;
  bandwidthMbps: number;
  latencyMs: number;
  status: 'active' | 'degraded' | 'down';
}

export type ProtocolType = 'ARP' | 'ICMP' | 'DHCP' | 'DNS' | 'TCP' | 'HTTP';

export interface PacketHeaders {
  // L2 Ethernet
  srcMac: string;
  dstMac: string;
  etherType: string; // e.g. "0x0800 (IPv4)" or "0x0806 (ARP)"
  // L3 Network
  srcIp?: string;
  dstIp?: string;
  ttl?: number;
  protocol?: string; // "ICMP", "TCP", "UDP"
  // L4 Transport
  srcPort?: number;
  dstPort?: number;
  flags?: string[]; // "SYN", "ACK", "FIN", etc.
  seq?: number;
  ack?: number;
  // L7 Application
  appProtocol: ProtocolType;
  messageType?: string; // e.g. "Echo Request", "Echo Reply", "ARP Request", "DHCP Discover", "HTTP 200 OK"
  payloadSummary: string;
  rawPayload?: Record<string, any>;
}

export interface SimulationHop {
  fromDeviceId: string;
  toDeviceId: string;
  linkId: string;
  durationMs: number;
  headers: PacketHeaders;
  dropped?: boolean;
  dropReason?: string;
}

export interface NetworkPacket {
  id: string;
  sourceDeviceId: string;
  destinationDeviceId: string;
  protocol: ProtocolType;
  description: string;
  createdAt: number;
  status: 'in-flight' | 'delivered' | 'dropped';
  currentHopIndex: number;
  hops: SimulationHop[];
  progress: number; // 0 to 1 along current hop
}

export interface CapturedPacket {
  id: string;
  timestamp: string;
  srcDeviceName: string;
  dstDeviceName: string;
  srcIp: string;
  dstIp: string;
  protocol: ProtocolType;
  info: string;
  length: number;
  status: 'ok' | 'dropped';
  headers: PacketHeaders;
}

export interface ScenarioPreset {
  id: string;
  title: string;
  category: string;
  description: string;
  devices: NetworkDevice[];
  links: NetworkLink[];
  suggestedAction?: {
    type: 'ping' | 'http' | 'dhcp';
    fromId: string;
    target: string;
    label: string;
  };
}
