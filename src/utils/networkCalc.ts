import { OpticalParameters, OtdrEvent, PathLossModel, RfParameters, ModulationScheme } from '../types/telecom';

// -------------------------------------------------------------
// 1. IP & VLSM CALCULATIONS
// -------------------------------------------------------------

export interface SubnetResult {
  id: string;
  name: string;
  hostsNeeded: number;
  hostsAllocated: number;
  prefix: number;
  subnetMask: string;
  networkAddress: string;
  firstUsableIp: string;
  lastUsableIp: string;
  broadcastAddress: string;
  wastedHosts: number;
  ciscoConfig: string;
}

// Convert 32-bit uint to IPv4 string
export function uint32ToIp(val: number): string {
  return [
    (val >>> 24) & 255,
    (val >>> 16) & 255,
    (val >>> 8) & 255,
    val & 255
  ].join('.');
}

// Convert IPv4 string to 32-bit uint
export function ipToUint32(ip: string): number {
  const parts = ip.trim().split('.').map(p => parseInt(p, 10));
  if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) {
    return 0;
  }
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

// Prefix to subnet mask string
export function prefixToMask(prefix: number): string {
  const maskUint = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  return uint32ToIp(maskUint);
}

// Mask to prefix
export function maskToPrefix(mask: string): number {
  const uint = ipToUint32(mask);
  let count = 0;
  for (let i = 31; i >= 0; i--) {
    if ((uint & (1 << i)) !== 0) count++;
    else break;
  }
  return count;
}

export function calculateVlsm(
  majorNetworkInput: string,
  requirements: Array<{ id: string; name: string; hostsNeeded: number }>
): { results: SubnetResult[]; totalCapacity: number; allocatedCapacity: number; error?: string } {
  const [baseIpStr, prefixStr] = majorNetworkInput.split('/');
  const basePrefix = parseInt(prefixStr || '24', 10);
  const baseIpUint = ipToUint32(baseIpStr);

  if (isNaN(basePrefix) || basePrefix < 8 || basePrefix > 30) {
    return { results: [], totalCapacity: 0, allocatedCapacity: 0, error: 'Préfixe CIDR invalide (doit être entre /8 et /30).' };
  }

  const totalCapacity = Math.pow(2, 32 - basePrefix);
  let currentIpUint = baseIpUint;

  // Sort requirements in descending order of hosts needed (Fundamental VLSM rule)
  const sortedReqs = [...requirements].sort((a, b) => b.hostsNeeded - a.hostsNeeded);
  const results: SubnetResult[] = [];
  let totalAllocated = 0;

  for (const req of sortedReqs) {
    if (req.hostsNeeded <= 0) continue;

    // We need req.hostsNeeded + 2 (Network + Broadcast)
    let hostBits = 1;
    while (Math.pow(2, hostBits) - 2 < req.hostsNeeded && hostBits < 32) {
      hostBits++;
    }

    const subnetPrefix = 32 - hostBits;
    const subnetSize = Math.pow(2, hostBits);
    const hostsAllocated = subnetSize - 2;

    const netAddr = currentIpUint;
    const broadcastAddr = netAddr + subnetSize - 1;
    const firstIp = netAddr + 1;
    const lastIp = broadcastAddr - 1;

    const netAddrStr = uint32ToIp(netAddr);
    const maskStr = prefixToMask(subnetPrefix);
    const firstIpStr = uint32ToIp(firstIp);
    const lastIpStr = uint32ToIp(lastIp);
    const broadcastStr = uint32ToIp(broadcastAddr);

    const cisco = `! Configuration Cisco IOS pour ${req.name}
interface GigabitEthernet0/${results.length}
 description LAN_${req.name.replace(/\\s+/g, '_')}
 ip address ${firstIpStr} ${maskStr}
 no shutdown
!`;

    results.push({
      id: req.id,
      name: req.name,
      hostsNeeded: req.hostsNeeded,
      hostsAllocated,
      prefix: subnetPrefix,
      subnetMask: maskStr,
      networkAddress: `${netAddrStr}/${subnetPrefix}`,
      firstUsableIp: firstIpStr,
      lastUsableIp: lastIpStr,
      broadcastAddress: broadcastStr,
      wastedHosts: Math.max(0, hostsAllocated - req.hostsNeeded),
      ciscoConfig: cisco
    });

    currentIpUint += subnetSize;
    totalAllocated += subnetSize;
  }

  return {
    results,
    totalCapacity,
    allocatedCapacity: totalAllocated
  };
}

// -------------------------------------------------------------
// 2. DIJKSTRA (OSPF SHORTEST PATH FIRST) ALGORITHM
// -------------------------------------------------------------

export interface DijkstraStep {
  step: number;
  currentNode: string;
  visitedNodes: string[];
  distances: Record<string, number>;
  previousNodes: Record<string, string | null>;
  log: string;
}

export function runDijkstra(
  nodes: string[],
  edges: Array<{ from: string; to: string; cost: number }>,
  source: string,
  target?: string
): {
  distances: Record<string, number>;
  previous: Record<string, string | null>;
  path: string[];
  totalCost: number;
  steps: DijkstraStep[];
} {
  const distances: Record<string, number> = {};
  const previous: Record<string, string | null> = {};
  const unvisited = new Set<string>(nodes);
  const visited: string[] = [];
  const steps: DijkstraStep[] = [];

  nodes.forEach(n => {
    distances[n] = n === source ? 0 : Infinity;
    previous[n] = null;
  });

  steps.push({
    step: 0,
    currentNode: source,
    visitedNodes: [],
    distances: { ...distances },
    previousNodes: { ...previous },
    log: `Initialisation de Dijkstra avec le routeur racine ${source}. Distance = 0.`
  });

  let stepCounter = 1;

  while (unvisited.size > 0) {
    // Find unvisited node with smallest distance
    let current: string | null = null;
    let minDistance = Infinity;

    for (const node of unvisited) {
      if (distances[node] < minDistance) {
        minDistance = distances[node];
        current = node;
      }
    }

    if (!current || minDistance === Infinity) {
      break; // Remaining nodes are unreachable
    }

    unvisited.delete(current);
    visited.push(current);

    // Find neighbors of current
    const neighbors = edges.filter(e => e.from === current || e.to === current);
    for (const edge of neighbors) {
      const neighbor = edge.from === current ? edge.to : edge.from;
      if (!unvisited.has(neighbor)) continue;

      const alt = distances[current] + edge.cost;
      if (alt < distances[neighbor]) {
        distances[neighbor] = alt;
        previous[neighbor] = current;
      }
    }

    steps.push({
      step: stepCounter++,
      currentNode: current,
      visitedNodes: [...visited],
      distances: { ...distances },
      previousNodes: { ...previous },
      log: `Routeur ${current} sélectionné (coût OSPF cummulé: ${minDistance}). Mise à jour des coûts des voisins.`
    });

    if (target && current === target) {
      break;
    }
  }

  // Reconstruct path if target is specified
  const path: string[] = [];
  let curr = target;
  if (curr && distances[curr] !== Infinity) {
    while (curr) {
      path.unshift(curr);
      curr = previous[curr] || undefined;
    }
  }

  return {
    distances,
    previous,
    path,
    totalCost: target ? distances[target] : 0,
    steps
  };
}

// -------------------------------------------------------------
// 3. TELECOM RF & 4G/5G CALCULATIONS
// -------------------------------------------------------------

export function calculateRfLinkBudget(params: RfParameters, distanceKm: number) {
  const d = Math.max(0.05, distanceKm);
  const f = params.frequencyMhz;
  const hb = params.baseStationHeightM;
  const hm = params.mobileHeightM;

  // 1. EIRP (PIRE en dBm)
  const eirpDbm = params.txPowerDbm - params.cableLossTxDb + params.txAntennaGainDbi;
  const eirpWatts = Math.pow(10, (eirpDbm - 30) / 10);

  // 2. Path loss calculation depending on model
  let pathLossDb = 0;

  if (params.model === 'fspl' || f > 3000) {
    // Free Space Path Loss (Friis formula)
    pathLossDb = 32.44 + 20 * Math.log10(f) + 20 * Math.log10(d);
  } else {
    // Okumura-Hata empirical model (150 - 1500 MHz, valid up to 2000 MHz via COST 231)
    // a(hm) mobile correction factor for medium/small city:
    const aHm = (1.1 * Math.log10(f) - 0.7) * hm - (1.56 * Math.log10(f) - 0.8);
    const luUrban = 69.55 + 26.16 * Math.log10(f) - 13.82 * Math.log10(hb) - aHm + (44.9 - 6.55 * Math.log10(hb)) * Math.log10(d);

    if (params.model === 'okumura_hata_urban') {
      pathLossDb = luUrban;
    } else if (params.model === 'okumura_hata_suburban') {
      pathLossDb = luUrban - 2 * Math.pow(Math.log10(f / 28), 2) - 5.4;
    } else {
      // Rural open area
      pathLossDb = luUrban - 4.78 * Math.pow(Math.log10(f), 2) + 18.33 * Math.log10(f) - 40.94;
    }
  }

  // 3. Received Power (RSRP / Prx)
  const rxPowerDbm = eirpDbm - pathLossDb + params.mobileAntennaGainDbi;

  // 4. Noise Floor (kTB + NF)
  // Thermal noise k * T * B = -174 dBm/Hz at 290K
  const bandwidthHz = params.bandwidthMhz * 1e6;
  const thermalNoiseDbm = -174 + 10 * Math.log10(bandwidthHz) + params.noiseFigureDb;

  // 5. Signal to Interference + Noise Ratio (SINR in dB)
  const sinrDb = rxPowerDbm - thermalNoiseDbm;

  // 6. Shannon Capacity (theoretical channel maximum in Mbps)
  const sinrLinear = Math.max(0.001, Math.pow(10, sinrDb / 10));
  const shannonCapacityMbps = (params.bandwidthMhz * Math.log2(1 + sinrLinear));

  // 7. Link Margin
  const linkMarginDb = rxPowerDbm - params.rxSensitivityDbm - params.fadeMarginDb;
  const isCovered = linkMarginDb >= 0 && rxPowerDbm >= params.rxSensitivityDbm;

  return {
    eirpDbm,
    eirpWatts,
    pathLossDb,
    rxPowerDbm,
    thermalNoiseDbm,
    sinrDb,
    shannonCapacityMbps: Math.min(shannonCapacityMbps, params.bandwidthMhz * 8), // spectral efficiency cap
    linkMarginDb,
    isCovered
  };
}

// -------------------------------------------------------------
// 4. DIGITAL MODULATION CONSTELLATION GENERATOR
// -------------------------------------------------------------

export function generateConstellation(scheme: ModulationScheme, snrDb: number, sampleCount = 600) {
  let idealPoints: Array<{ i: number; q: number; symbol: string }> = [];

  if (scheme === 'BPSK') {
    idealPoints = [
      { i: -1, q: 0, symbol: '0' },
      { i: 1, q: 0, symbol: '1' }
    ];
  } else if (scheme === 'QPSK') {
    const s = 1 / Math.sqrt(2);
    idealPoints = [
      { i: -s, q: -s, symbol: '00' },
      { i: -s, q: s, symbol: '01' },
      { i: s, q: -s, symbol: '10' },
      { i: s, q: s, symbol: '11' }
    ];
  } else if (scheme === '16QAM') {
    const levels = [-3, -1, 1, 3];
    const norm = Math.sqrt(10);
    levels.forEach(i => {
      levels.forEach(q => {
        idealPoints.push({
          i: i / norm,
          q: q / norm,
          symbol: `${(i + 3) / 2}${(q + 3) / 2}`
        });
      });
    });
  } else if (scheme === '64QAM') {
    const levels = [-7, -5, -3, -1, 1, 3, 5, 7];
    const norm = Math.sqrt(42);
    levels.forEach(i => {
      levels.forEach(q => {
        idealPoints.push({
          i: i / norm,
          q: q / norm,
          symbol: ''
        });
      });
    });
  } else if (scheme === '256QAM') {
    const levels = [-15, -13, -11, -9, -7, -5, -3, -1, 1, 3, 5, 7, 9, 11, 13, 15];
    const norm = Math.sqrt(170);
    levels.forEach(i => {
      levels.forEach(q => {
        idealPoints.push({
          i: i / norm,
          q: q / norm,
          symbol: ''
        });
      });
    });
  }

  // Noise standard deviation from SNR
  const snrLinear = Math.pow(10, snrDb / 10);
  const sigma = 1 / Math.sqrt(2 * snrLinear);

  // Box-Muller AWGN generator
  const noisySamples: Array<{ x: number; y: number }> = [];
  for (let idx = 0; idx < sampleCount; idx++) {
    const ideal = idealPoints[Math.floor(Math.random() * idealPoints.length)];
    const u1 = Math.max(1e-7, Math.random());
    const u2 = Math.random();
    const noiseI = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2) * sigma;
    const noiseQ = Math.sqrt(-2.0 * Math.log(u1)) * Math.sin(2.0 * Math.PI * u2) * sigma;

    noisySamples.push({
      x: ideal.i + noiseI,
      y: ideal.q + noiseQ
    });
  }

  // Theoretical BER (Q-function approximation)
  const qFunc = (x: number) => 0.5 * Math.exp(-0.5 * x * x) / (x * Math.sqrt(2 * Math.PI));
  let ber = 0;
  if (scheme === 'BPSK') {
    ber = qFunc(Math.sqrt(2 * snrLinear));
  } else if (scheme === 'QPSK') {
    ber = qFunc(Math.sqrt(2 * snrLinear));
  } else if (scheme === '16QAM') {
    ber = (3 / 8) * qFunc(Math.sqrt((4 / 5) * snrLinear));
  } else {
    ber = (7 / 24) * qFunc(Math.sqrt((6 / 21) * snrLinear));
  }
  if (isNaN(ber) || ber < 1e-9) ber = 1e-9;
  if (ber > 0.5) ber = 0.5;

  return {
    idealPoints,
    noisySamples,
    ber,
    spectralEfficiency: scheme === 'BPSK' ? 1 : scheme === 'QPSK' ? 2 : scheme === '16QAM' ? 4 : scheme === '64QAM' ? 6 : 8
  };
}

// -------------------------------------------------------------
// 5. FIBER OPTIC & OTDR TRACE GENERATOR
// -------------------------------------------------------------

export function calculateOpticalBudget(params: OpticalParameters) {
  const actualLength = params.faultDistanceKm !== null && params.faultDistanceKm !== undefined
    ? Math.min(params.fiberLengthKm, params.faultDistanceKm)
    : params.fiberLengthKm;

  const fiberLoss = actualLength * params.fiberAttenuationDbPerKm;
  const spliceLoss = params.spliceCount * params.lossPerSpliceDb;
  const connectorLoss = params.connectorCount * params.lossPerConnectorDb;
  const totalLossDb = fiberLoss + spliceLoss + connectorLoss;

  const edfaGain = params.hasEdfa ? params.edfaGainDb : 0;
  const rxPowerDbm = params.txPowerDbm - totalLossDb + edfaGain;
  const marginDb = rxPowerDbm - params.rxSensitivityDbm - params.safetyMarginDb;
  const linkPassed = rxPowerDbm >= params.rxSensitivityDbm && marginDb >= 0;

  // Generate OTDR Events
  const events: OtdrEvent[] = [];
  events.push({
    distanceKm: 0,
    type: 'launch',
    lossDb: 0.4,
    reflectanceDb: -42,
    cumulativeLossDb: 0.4,
    description: 'Injection laser & Connecteur d\'émission initial'
  });

  // Distribute splices across length
  const spliceInterval = actualLength / (params.spliceCount + 1);
  let runningLoss = 0.4;

  for (let i = 1; i <= params.spliceCount; i++) {
    const dist = spliceInterval * i;
    const distanceLoss = (dist - (events[events.length - 1]?.distanceKm || 0)) * params.fiberAttenuationDbPerKm;
    runningLoss += distanceLoss + params.lossPerSpliceDb;
    events.push({
      distanceKm: parseFloat(dist.toFixed(2)),
      type: 'splice',
      lossDb: params.lossPerSpliceDb,
      cumulativeLossDb: parseFloat(runningLoss.toFixed(2)),
      description: `Épissure de fusion N°${i}`
    });
  }

  // End event or break event
  if (params.faultDistanceKm !== null && params.faultDistanceKm !== undefined && params.faultDistanceKm < params.fiberLengthKm) {
    events.push({
      distanceKm: parseFloat(params.faultDistanceKm.toFixed(2)),
      type: 'fiber_break',
      lossDb: 25,
      reflectanceDb: -14,
      cumulativeLossDb: 35,
      description: 'RUPTURE / COUPURE DE FIBRE DÉTECTÉE (Événement non réflectif / chute totale)'
    });
  } else {
    events.push({
      distanceKm: params.fiberLengthKm,
      type: 'end',
      lossDb: params.lossPerConnectorDb,
      reflectanceDb: -38,
      cumulativeLossDb: parseFloat((runningLoss + (params.fiberLengthKm - (events[events.length - 1]?.distanceKm || 0)) * params.fiberAttenuationDbPerKm + params.lossPerConnectorDb).toFixed(2)),
      description: 'Connecteur terminal & Terminaison optique du lien'
    });
  }

  // Generate OTDR graph waveform samples
  const otdrWaveform: Array<{ distance: number; power: number }> = [];
  const stepKm = params.fiberLengthKm / 120;
  let curPower = params.txPowerDbm;

  for (let dist = 0; dist <= params.fiberLengthKm * 1.05; dist += stepKm) {
    if (params.faultDistanceKm && dist > params.faultDistanceKm) {
      // Noise floor after break
      const noise = -65 + (Math.random() - 0.5) * 1.5;
      otdrWaveform.push({ distance: parseFloat(dist.toFixed(2)), power: noise });
      continue;
    }

    if (dist > params.fiberLengthKm) {
      // Noise floor after termination
      const noise = -65 + (Math.random() - 0.5) * 1.5;
      otdrWaveform.push({ distance: parseFloat(dist.toFixed(2)), power: noise });
      continue;
    }

    // Normal Rayleigh backscatter slope
    curPower = params.txPowerDbm - (dist * params.fiberAttenuationDbPerKm);

    // Apply splice drops
    events.forEach(ev => {
      if (ev.type === 'splice' && dist >= ev.distanceKm) {
        curPower -= ev.lossDb;
      }
    });

    // Add tiny Rayleigh noise
    const noise = (Math.random() - 0.5) * 0.2;
    otdrWaveform.push({ distance: parseFloat(dist.toFixed(2)), power: curPower + noise });
  }

  return {
    actualLength,
    totalLossDb,
    fiberLoss,
    spliceLoss,
    connectorLoss,
    rxPowerDbm,
    marginDb,
    linkPassed,
    events,
    otdrWaveform
  };
}
