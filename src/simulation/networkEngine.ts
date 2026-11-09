import {
  NetworkDevice,
  NetworkLink,
  NetworkPacket,
  SimulationHop,
  ProtocolType,
  PacketHeaders,
  CapturedPacket
} from '../types/network';
import { areInSameSubnet, ipToInt, getNetworkAddress } from '../utils/ipUtils';

interface PathResult {
  deviceIds: string[];
  linkIds: string[];
}

/**
 * Breadth-First-Search on device topology to find physical/logical path
 */
function findPhysicalPath(
  startId: string,
  endId: string,
  devices: NetworkDevice[],
  links: NetworkLink[]
): PathResult | null {
  if (startId === endId) return { deviceIds: [startId], linkIds: [] };

  const queue: { currentId: string; path: string[]; linkPath: string[] }[] = [
    { currentId: startId, path: [startId], linkPath: [] }
  ];
  const visited = new Set<string>([startId]);

  while (queue.length > 0) {
    const { currentId, path, linkPath } = queue.shift()!;

    if (currentId === endId) {
      return { deviceIds: path, linkIds: linkPath };
    }

    // Find all links connected to currentId
    const connectedLinks = links.filter(
      l => (l.fromDeviceId === currentId || l.toDeviceId === currentId) && l.status === 'active'
    );

    for (const link of connectedLinks) {
      const nextId = link.fromDeviceId === currentId ? link.toDeviceId : link.fromDeviceId;
      if (!visited.has(nextId)) {
        visited.add(nextId);
        queue.push({
          currentId: nextId,
          path: [...path, nextId],
          linkPath: [...linkPath, link.id]
        });
      }
    }
  }

  return null;
}

/**
 * Builds packet hops for a Ping (ICMP) transaction
 */
export function buildPingTransaction(
  srcDevice: NetworkDevice,
  dstIp: string,
  devices: NetworkDevice[],
  links: NetworkLink[]
): { packet: NetworkPacket; error?: string } {
  const srcIf = srcDevice.interfaces[0];
  if (!srcIf || !srcIf.ipAddress || srcIf.ipAddress === '0.0.0.0') {
    return {
      packet: null as any,
      error: `L'appareil source ${srcDevice.name} n'a pas d'adresse IP valide configurée.`
    };
  }

  // Find destination device by IP
  let dstDevice: NetworkDevice | undefined;
  for (const d of devices) {
    if (d.interfaces.some(i => i.ipAddress === dstIp)) {
      dstDevice = d;
      break;
    }
  }

  if (!dstDevice) {
    return {
      packet: null as any,
      error: `Hôte de destination introuvable pour l'adresse IP ${dstIp}.`
    };
  }

  const isLocal = areInSameSubnet(srcIf.ipAddress, dstIp, srcIf.subnetMask);
  if (!isLocal && !srcDevice.defaultGateway) {
    return {
      packet: null as any,
      error: `La destination ${dstIp} est sur un autre sous-réseau et aucune Passerelle par Défaut n'est configurée sur ${srcDevice.name}.`
    };
  }

  // Find path
  const forwardPath = findPhysicalPath(srcDevice.id, dstDevice.id, devices, links);
  if (!forwardPath || forwardPath.deviceIds.length < 2) {
    return {
      packet: null as any,
      error: `Aucun câble ou chemin actif trouvé entre ${srcDevice.name} et ${dstDevice.name}.`
    };
  }

  const dstIf = dstDevice.interfaces.find(i => i.ipAddress === dstIp) || dstDevice.interfaces[0];

  const hops: SimulationHop[] = [];
  const reqId = Math.floor(Math.random() * 9000 + 1000);

  // Check if any device in the path is a firewall that blocks ICMP
  let droppedAtIndex = -1;
  let dropReason = '';

  for (let i = 0; i < forwardPath.deviceIds.length - 1; i++) {
    const fromId = forwardPath.deviceIds[i];
    const toId = forwardPath.deviceIds[i + 1];
    const linkId = forwardPath.linkIds[i];
    const fromDev = devices.find(d => d.id === fromId)!;
    const toDev = devices.find(d => d.id === toId)!;

    // Check firewall rule
    if (toDev.type === 'firewall' && toDev.firewallRules) {
      const icmpRule = toDev.firewallRules.find(r => r.protocol === 'ICMP' || r.protocol === 'ALL');
      if (icmpRule && icmpRule.action === 'deny') {
        droppedAtIndex = i;
        dropReason = `Bloqué par la règle Pare-feu (${toDev.name}) : Filtrage ICMP actif.`;
      }
    }

    const headers: PacketHeaders = {
      srcMac: fromDev.interfaces[0]?.macAddress || '00:00:00:00:00:00',
      dstMac: toDev.interfaces[0]?.macAddress || 'FF:FF:FF:FF:FF:FF',
      etherType: '0x0800 (IPv4)',
      srcIp: srcIf.ipAddress,
      dstIp: dstIp,
      ttl: 64 - i,
      protocol: 'ICMP',
      appProtocol: 'ICMP',
      messageType: 'Echo Request (Type 8, Code 0)',
      payloadSummary: `ICMP Echo Request id=${reqId} seq=1 ttl=${64 - i}`,
      rawPayload: { id: reqId, seq: 1, sizeBytes: 32 }
    };

    hops.push({
      fromDeviceId: fromId,
      toDeviceId: toId,
      linkId,
      durationMs: 700,
      headers,
      dropped: droppedAtIndex === i,
      dropReason: droppedAtIndex === i ? dropReason : undefined
    });

    if (droppedAtIndex === i) break;
  }

  // If not dropped, build return path (Echo Reply)
  if (droppedAtIndex === -1) {
    const returnPath = findPhysicalPath(dstDevice.id, srcDevice.id, devices, links);
    if (returnPath) {
      for (let i = 0; i < returnPath.deviceIds.length - 1; i++) {
        const fromId = returnPath.deviceIds[i];
        const toId = returnPath.deviceIds[i + 1];
        const linkId = returnPath.linkIds[i];
        const fromDev = devices.find(d => d.id === fromId)!;
        const toDev = devices.find(d => d.id === toId)!;

        const headers: PacketHeaders = {
          srcMac: fromDev.interfaces[0]?.macAddress || '00:00:00:00:00:00',
          dstMac: toDev.interfaces[0]?.macAddress || 'FF:FF:FF:FF:FF:FF',
          etherType: '0x0800 (IPv4)',
          srcIp: dstIp,
          dstIp: srcIf.ipAddress,
          ttl: 64 - i,
          protocol: 'ICMP',
          appProtocol: 'ICMP',
          messageType: 'Echo Reply (Type 0, Code 0)',
          payloadSummary: `ICMP Echo Reply id=${reqId} seq=1 ttl=${64 - i} (Succès)`,
          rawPayload: { id: reqId, seq: 1, rttMs: 4 }
        };

        hops.push({
          fromDeviceId: fromId,
          toDeviceId: toId,
          linkId,
          durationMs: 700,
          headers
        });
      }
    }
  }

  const packet: NetworkPacket = {
    id: `pkt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    sourceDeviceId: srcDevice.id,
    destinationDeviceId: dstDevice.id,
    protocol: 'ICMP',
    description: `Ping ${srcDevice.name} -> ${dstDevice.name} (${dstIp})`,
    createdAt: Date.now(),
    status: 'in-flight',
    currentHopIndex: 0,
    hops,
    progress: 0
  };

  return { packet };
}

/**
 * Builds packet hops for an HTTP Web request transaction
 */
export function buildHttpTransaction(
  srcDevice: NetworkDevice,
  targetUrlOrIp: string,
  devices: NetworkDevice[],
  links: NetworkLink[]
): { packet: NetworkPacket; error?: string } {
  const srcIf = srcDevice.interfaces[0];
  if (!srcIf || !srcIf.ipAddress) {
    return { packet: null as any, error: `L'hôte ${srcDevice.name} n'a pas d'adresse IP configurée.` };
  }

  let cleanTarget = targetUrlOrIp.replace(/^https?:\/\//, '').split('/')[0].trim();
  let dstIp = cleanTarget;
  let dnsLookupHops: SimulationHop[] = [];

  // If domain name, check DNS
  const isIpRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
  if (!isIpRegex.test(cleanTarget)) {
    // Look up DNS server
    let resolvedIp: string | null = null;
    const dnsServer = devices.find(
      d => d.dnsRecords && d.dnsRecords.some(r => r.domain.toLowerCase() === cleanTarget.toLowerCase())
    );

    if (dnsServer) {
      const rec = dnsServer.dnsRecords!.find(r => r.domain.toLowerCase() === cleanTarget.toLowerCase());
      if (rec) resolvedIp = rec.ipAddress;
    }

    if (!resolvedIp) {
      return {
        packet: null as any,
        error: `Échec de résolution DNS : Impossible de résoudre le nom de domaine "${cleanTarget}".`
      };
    }
    dstIp = resolvedIp;
  }

  // Find Web server device
  const server = devices.find(
    d => d.httpConfig?.enabled && d.interfaces.some(i => i.ipAddress === dstIp)
  );

  if (!server) {
    return {
      packet: null as any,
      error: `Aucun serveur Web HTTP actif trouvé à l'adresse IP ${dstIp}.`
    };
  }

  const forwardPath = findPhysicalPath(srcDevice.id, server.id, devices, links);
  const returnPath = findPhysicalPath(server.id, srcDevice.id, devices, links);

  if (!forwardPath || !returnPath) {
    return { packet: null as any, error: `Chemin réseau rompu vers le serveur Web.` };
  }

  const hops: SimulationHop[] = [];

  // 1. TCP SYN
  for (let i = 0; i < forwardPath.deviceIds.length - 1; i++) {
    hops.push({
      fromDeviceId: forwardPath.deviceIds[i],
      toDeviceId: forwardPath.deviceIds[i + 1],
      linkId: forwardPath.linkIds[i],
      durationMs: 600,
      headers: {
        srcMac: '00:50:79:01:01',
        dstMac: '00:50:79:01:02',
        etherType: '0x0800 (IPv4)',
        srcIp: srcIf.ipAddress,
        dstIp: dstIp,
        protocol: 'TCP',
        srcPort: 54321,
        dstPort: 80,
        flags: ['SYN'],
        seq: 100,
        appProtocol: 'TCP',
        messageType: 'TCP Handshake: SYN',
        payloadSummary: `TCP SYN Port 54321 -> 80 (Demande de connexion)`
      }
    });
  }

  // 2. TCP SYN-ACK
  for (let i = 0; i < returnPath.deviceIds.length - 1; i++) {
    hops.push({
      fromDeviceId: returnPath.deviceIds[i],
      toDeviceId: returnPath.deviceIds[i + 1],
      linkId: returnPath.linkIds[i],
      durationMs: 600,
      headers: {
        srcMac: '00:50:79:01:02',
        dstMac: '00:50:79:01:01',
        etherType: '0x0800 (IPv4)',
        srcIp: dstIp,
        dstIp: srcIf.ipAddress,
        protocol: 'TCP',
        srcPort: 80,
        dstPort: 54321,
        flags: ['SYN', 'ACK'],
        seq: 500,
        ack: 101,
        appProtocol: 'TCP',
        messageType: 'TCP Handshake: SYN-ACK',
        payloadSummary: `TCP SYN-ACK Port 80 -> 54321 (Accord serveur)`
      }
    });
  }

  // 3. HTTP GET Request
  for (let i = 0; i < forwardPath.deviceIds.length - 1; i++) {
    hops.push({
      fromDeviceId: forwardPath.deviceIds[i],
      toDeviceId: forwardPath.deviceIds[i + 1],
      linkId: forwardPath.linkIds[i],
      durationMs: 650,
      headers: {
        srcMac: '00:50:79:01:01',
        dstMac: '00:50:79:01:02',
        etherType: '0x0800 (IPv4)',
        srcIp: srcIf.ipAddress,
        dstIp: dstIp,
        protocol: 'TCP',
        srcPort: 54321,
        dstPort: 80,
        flags: ['ACK', 'PSH'],
        appProtocol: 'HTTP',
        messageType: 'HTTP GET /',
        payloadSummary: `GET / HTTP/1.1 Host: ${cleanTarget}`,
        rawPayload: { method: 'GET', path: '/', host: cleanTarget }
      }
    });
  }

  // 4. HTTP 200 OK Response
  for (let i = 0; i < returnPath.deviceIds.length - 1; i++) {
    hops.push({
      fromDeviceId: returnPath.deviceIds[i],
      toDeviceId: returnPath.deviceIds[i + 1],
      linkId: returnPath.linkIds[i],
      durationMs: 650,
      headers: {
        srcMac: '00:50:79:01:02',
        dstMac: '00:50:79:01:01',
        etherType: '0x0800 (IPv4)',
        srcIp: dstIp,
        dstIp: srcIf.ipAddress,
        protocol: 'TCP',
        srcPort: 80,
        dstPort: 54321,
        flags: ['ACK'],
        appProtocol: 'HTTP',
        messageType: 'HTTP/1.1 200 OK',
        payloadSummary: `HTTP/1.1 200 OK (Content-Type: text/html, Content-Length: ${server.httpConfig?.htmlContent.length || 120})`,
        rawPayload: {
          status: 200,
          statusText: 'OK',
          siteTitle: server.httpConfig?.siteTitle,
          html: server.httpConfig?.htmlContent
        }
      }
    });
  }

  const packet: NetworkPacket = {
    id: `pkt-http-${Date.now()}`,
    sourceDeviceId: srcDevice.id,
    destinationDeviceId: server.id,
    protocol: 'HTTP',
    description: `HTTP GET ${cleanTarget} -> ${server.name}`,
    createdAt: Date.now(),
    status: 'in-flight',
    currentHopIndex: 0,
    hops,
    progress: 0
  };

  return { packet };
}

/**
 * Builds packet hops for a DHCP DORA cycle
 */
export function buildDhcpTransaction(
  clientDevice: NetworkDevice,
  devices: NetworkDevice[],
  links: NetworkLink[]
): { packet: NetworkPacket; offeredIp?: string; error?: string } {
  // Find DHCP Server in network
  const dhcpServer = devices.find(d => d.dhcpConfig?.enabled);
  if (!dhcpServer || !dhcpServer.dhcpConfig) {
    return {
      packet: null as any,
      error: `Aucun serveur DHCP actif trouvé sur le réseau pour attribuer une configuration IP.`
    };
  }

  const forwardPath = findPhysicalPath(clientDevice.id, dhcpServer.id, devices, links);
  const returnPath = findPhysicalPath(dhcpServer.id, clientDevice.id, devices, links);

  if (!forwardPath || !returnPath) {
    return { packet: null as any, error: `Impossible d'atteindre le serveur DHCP.` };
  }

  const hops: SimulationHop[] = [];
  const clientMac = clientDevice.interfaces[0]?.macAddress || '00:50:79:DD:02:11';
  const offeredIp = dhcpServer.dhcpConfig.poolStart;

  // 1. DHCP Discover (Broadcast)
  for (let i = 0; i < forwardPath.deviceIds.length - 1; i++) {
    hops.push({
      fromDeviceId: forwardPath.deviceIds[i],
      toDeviceId: forwardPath.deviceIds[i + 1],
      linkId: forwardPath.linkIds[i],
      durationMs: 700,
      headers: {
        srcMac: clientMac,
        dstMac: 'FF:FF:FF:FF:FF:FF',
        etherType: '0x0800 (IPv4)',
        srcIp: '0.0.0.0',
        dstIp: '255.255.255.255',
        protocol: 'UDP',
        srcPort: 68,
        dstPort: 67,
        appProtocol: 'DHCP',
        messageType: 'DHCP Discover',
        payloadSummary: `DHCP Discover (Client MAC: ${clientMac})`,
        rawPayload: { op: 'BOOTREQUEST', chaddr: clientMac }
      }
    });
  }

  // 2. DHCP Offer
  for (let i = 0; i < returnPath.deviceIds.length - 1; i++) {
    hops.push({
      fromDeviceId: returnPath.deviceIds[i],
      toDeviceId: returnPath.deviceIds[i + 1],
      linkId: returnPath.linkIds[i],
      durationMs: 700,
      headers: {
        srcMac: dhcpServer.interfaces[0]?.macAddress || '00:50:79:DD:01:FE',
        dstMac: clientMac,
        etherType: '0x0800 (IPv4)',
        srcIp: dhcpServer.interfaces[0]?.ipAddress || '10.0.0.254',
        dstIp: offeredIp,
        protocol: 'UDP',
        srcPort: 67,
        dstPort: 68,
        appProtocol: 'DHCP',
        messageType: 'DHCP Offer',
        payloadSummary: `DHCP Offer IP: ${offeredIp}, Masque: ${dhcpServer.dhcpConfig.subnetMask}`,
        rawPayload: { yiaddr: offeredIp, gateway: dhcpServer.dhcpConfig.defaultGateway }
      }
    });
  }

  // 3. DHCP Request
  for (let i = 0; i < forwardPath.deviceIds.length - 1; i++) {
    hops.push({
      fromDeviceId: forwardPath.deviceIds[i],
      toDeviceId: forwardPath.deviceIds[i + 1],
      linkId: forwardPath.linkIds[i],
      durationMs: 700,
      headers: {
        srcMac: clientMac,
        dstMac: 'FF:FF:FF:FF:FF:FF',
        etherType: '0x0800 (IPv4)',
        srcIp: '0.0.0.0',
        dstIp: '255.255.255.255',
        protocol: 'UDP',
        srcPort: 68,
        dstPort: 67,
        appProtocol: 'DHCP',
        messageType: 'DHCP Request',
        payloadSummary: `DHCP Request pour ${offeredIp}`,
        rawPayload: { requestedIp: offeredIp }
      }
    });
  }

  // 4. DHCP ACK
  for (let i = 0; i < returnPath.deviceIds.length - 1; i++) {
    hops.push({
      fromDeviceId: returnPath.deviceIds[i],
      toDeviceId: returnPath.deviceIds[i + 1],
      linkId: returnPath.linkIds[i],
      durationMs: 700,
      headers: {
        srcMac: dhcpServer.interfaces[0]?.macAddress || '00:50:79:DD:01:FE',
        dstMac: clientMac,
        etherType: '0x0800 (IPv4)',
        srcIp: dhcpServer.interfaces[0]?.ipAddress || '10.0.0.254',
        dstIp: offeredIp,
        protocol: 'UDP',
        srcPort: 67,
        dstPort: 68,
        appProtocol: 'DHCP',
        messageType: 'DHCP ACK',
        payloadSummary: `DHCP ACK : Bail accordé avec succès pour ${offeredIp}`,
        rawPayload: { leasedIp: offeredIp, leaseTimeSeconds: 86400 }
      }
    });
  }

  const packet: NetworkPacket = {
    id: `pkt-dhcp-${Date.now()}`,
    sourceDeviceId: clientDevice.id,
    destinationDeviceId: dhcpServer.id,
    protocol: 'DHCP',
    description: `Processus DHCP DORA : Attribution de ${offeredIp} à ${clientDevice.name}`,
    createdAt: Date.now(),
    status: 'in-flight',
    currentHopIndex: 0,
    hops,
    progress: 0
  };

  return { packet, offeredIp };
}
