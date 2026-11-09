export function ipToInt(ip: string): number {
  const parts = ip.split('.').map(p => parseInt(p, 10));
  if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) {
    return 0;
  }
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

export function intToIp(int: number): string {
  return [
    (int >>> 24) & 255,
    (int >>> 16) & 255,
    (int >>> 8) & 255,
    int & 255
  ].join('.');
}

export function cidrToMask(cidr: number): string {
  if (cidr <= 0) return '0.0.0.0';
  if (cidr >= 32) return '255.255.255.255';
  const mask = ((0xFFFFFFFF << (32 - cidr)) >>> 0);
  return intToIp(mask);
}

export function maskToCidr(mask: string): number {
  const int = ipToInt(mask);
  let count = 0;
  for (let i = 31; i >= 0; i--) {
    if ((int & (1 << i)) !== 0) {
      count++;
    } else {
      break;
    }
  }
  return count;
}

export function areInSameSubnet(ip1: string, ip2: string, mask: string): boolean {
  if (!ip1 || !ip2 || !mask) return false;
  const int1 = ipToInt(ip1);
  const int2 = ipToInt(ip2);
  const maskInt = ipToInt(mask);
  return (int1 & maskInt) === (int2 & maskInt);
}

export function getNetworkAddress(ip: string, mask: string): string {
  return intToIp((ipToInt(ip) & ipToInt(mask)) >>> 0);
}

export function getBroadcastAddress(ip: string, mask: string): string {
  const netInt = ipToInt(ip) & ipToInt(mask);
  const hostMask = ~ipToInt(mask) >>> 0;
  return intToIp((netInt | hostMask) >>> 0);
}

export function getSubnetDetails(ip: string, cidr: number) {
  const mask = cidrToMask(cidr);
  const netInt = (ipToInt(ip) & ipToInt(mask)) >>> 0;
  const hostMask = ~ipToInt(mask) >>> 0;
  const bcastInt = (netInt | hostMask) >>> 0;

  const totalIps = Math.pow(2, 32 - cidr);
  const usableHosts = cidr >= 31 ? 0 : totalIps - 2;

  const firstHostInt = cidr >= 31 ? netInt : netInt + 1;
  const lastHostInt = cidr >= 31 ? bcastInt : bcastInt - 1;

  // Binary representation of mask
  const maskBinary = (ipToInt(mask) >>> 0).toString(2).padStart(32, '0');
  const formattedBinary = maskBinary.match(/.{1,8}/g)?.join('.') || maskBinary;

  // Determine Class
  const firstOctet = parseInt(ip.split('.')[0] || '0', 10);
  let ipClass = 'Class A';
  if (firstOctet >= 128 && firstOctet <= 191) ipClass = 'Class B';
  else if (firstOctet >= 192 && firstOctet <= 223) ipClass = 'Class C';
  else if (firstOctet >= 224 && firstOctet <= 239) ipClass = 'Class D (Multicast)';
  else if (firstOctet >= 240) ipClass = 'Class E (Experimental)';

  return {
    networkAddress: intToIp(netInt),
    broadcastAddress: intToIp(bcastInt),
    subnetMask: mask,
    cidr,
    firstUsableHost: intToIp(firstHostInt),
    lastUsableHost: intToIp(lastHostInt),
    totalIps,
    usableHosts: Math.max(0, usableHosts),
    binaryMask: formattedBinary,
    ipClass,
    wildcardMask: intToIp(hostMask)
  };
}

export function generateRandomMac(prefix = '00:50:79'): string {
  const hex = () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
  return `${prefix}:${hex()}:${hex()}:${hex()}`.toUpperCase();
}

export function isValidIp(ip: string): boolean {
  const parts = ip.trim().split('.');
  if (parts.length !== 4) return false;
  return parts.every(part => {
    if (!/^\d+$/.test(part)) return false;
    const n = parseInt(part, 10);
    return n >= 0 && n <= 255 && (part === '0' || !part.startsWith('0'));
  });
}
