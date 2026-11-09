export type PathLossModel = 'fspl' | 'okumura_hata_urban' | 'okumura_hata_suburban' | 'okumura_hata_rural';

export type FrequencyBand = 
  | '700MHz'   // 4G/5G Low band (Coverage)
  | '1800MHz'  // 4G LTE Band 3
  | '2600MHz'  // 4G LTE Band 7
  | '3500MHz'  // 5G Mid band (n78, Capacity)
  | '28GHz';   // 5G mmWave High band

export interface RfParameters {
  txPowerDbm: number;        // Transmit power (e.g. 43 dBm for macro cell = 20W)
  txAntennaGainDbi: number;  // Base station antenna gain (e.g. 15 to 18 dBi)
  cableLossTxDb: number;     // Feed line / jumper loss (e.g. 1 to 2 dB)
  frequencyMhz: number;      // Carrier frequency in MHz
  baseStationHeightM: number;// Height of gNodeB/eNodeB (e.g. 30 m)
  mobileHeightM: number;     // Mobile station height (e.g. 1.5 m)
  mobileAntennaGainDbi: number; // Mobile phone antenna gain (0 to 3 dBi)
  rxSensitivityDbm: number;  // Minimal receiver sensitivity (e.g. -105 dBm)
  bandwidthMhz: number;      // Channel bandwidth (e.g. 20, 50, 100 MHz)
  noiseFigureDb: number;     // Receiver noise figure (e.g. 7 dB)
  fadeMarginDb: number;      // Shadow fading margin (e.g. 8 dB)
  model: PathLossModel;
}

export type ModulationScheme = 'BPSK' | 'QPSK' | '16QAM' | '64QAM' | '256QAM';

export interface ConstellationPoint {
  i: number;
  q: number;
  symbol: string;
}

export interface OpticalParameters {
  wavelengthNm: 1310 | 1550;
  fiberLengthKm: number;
  fiberAttenuationDbPerKm: number; // ~0.35 at 1310nm, ~0.20 at 1550nm
  spliceCount: number;
  lossPerSpliceDb: number;         // ~0.05 to 0.1 dB
  connectorCount: number;
  lossPerConnectorDb: number;      // ~0.3 to 0.5 dB
  txPowerDbm: number;              // Laser output power (+3 dBm)
  rxSensitivityDbm: number;        // Photodiode receiver sensitivity (-28 dBm)
  safetyMarginDb: number;          // System safety margin (~3 dB)
  hasEdfa: boolean;                // Erbium-Doped Fiber Amplifier
  edfaGainDb: number;              // Amplifier gain in dB
  faultDistanceKm?: number | null; // Simulated fiber cut location
}

export interface OtdrEvent {
  distanceKm: number;
  type: 'launch' | 'splice' | 'bend' | 'connector' | 'fiber_break' | 'end';
  lossDb: number;
  reflectanceDb?: number;
  cumulativeLossDb: number;
  description: string;
}
