import {
  PhaseId,
  PhaseMetadata,
  PhaseTimingConfig,
  ScenarioId,
  VehicleType,
  WeatherCondition,
} from '@/types/simulation';

export const PHASE_ORDER: PhaseId[] = [
  'NS_LEFT',
  'NS_GREEN',
  'NS_YELLOW',
  'ALL_RED_1',
  'EW_LEFT',
  'EW_GREEN',
  'EW_YELLOW',
  'ALL_RED_2',
];

export const PHASE_DEFINITIONS: Record<PhaseId, PhaseMetadata> = {
  NS_LEFT: {
    id: 'NS_LEFT',
    code: 'S0',
    shortTitle: 'N-S Left Arrow',
    title: 'North–South Protected Left-Turn Phase',
    description:
      'Dedicated green arrow for Northbound and Southbound inner-lane left-turning traffic. Opposing through traffic and crosswalks are held.',
    nsColor: 'LEFT_GREEN',
    ewColor: 'RED',
    pedNS: 'DONT_WALK',
    pedEW: 'DONT_WALK',
    binaryOutput: '001L 100',
    booleanExpr: 'Q2′ · Q1′ · Q0′',
    qBits: '000',
    nextPhase: 'NS_GREEN',
  },
  NS_GREEN: {
    id: 'NS_GREEN',
    code: 'S1',
    shortTitle: 'N-S Green',
    title: 'North–South Through & Right Flow',
    description:
      'Northbound and Southbound lanes have active green right-of-way. N–S pedestrian crosswalks display WALK.',
    nsColor: 'GREEN',
    ewColor: 'RED',
    pedNS: 'WALK',
    pedEW: 'DONT_WALK',
    binaryOutput: '001 100',
    booleanExpr: 'Q2′ · Q1′ · Q0',
    qBits: '001',
    nextPhase: 'NS_YELLOW',
  },
  NS_YELLOW: {
    id: 'NS_YELLOW',
    code: 'S2',
    shortTitle: 'N-S Yellow',
    title: 'North–South Yellow Clearance',
    description:
      'Warns approaching North–South vehicles to decelerate and stop before the stop line unless already past safe braking distance.',
    nsColor: 'YELLOW',
    ewColor: 'RED',
    pedNS: 'DONT_WALK',
    pedEW: 'DONT_WALK',
    binaryOutput: '010 100',
    booleanExpr: 'Q2′ · Q1 · Q0′',
    qBits: '010',
    nextPhase: 'ALL_RED_1',
  },
  ALL_RED_1: {
    id: 'ALL_RED_1',
    code: 'S3',
    shortTitle: 'All-Red (N→E)',
    title: 'Intergreen Safety Buffer (N-S to E-W)',
    description:
      'All four approaches display solid red so vehicles inside the conflict box clear before East–West release.',
    nsColor: 'RED',
    ewColor: 'RED',
    pedNS: 'DONT_WALK',
    pedEW: 'DONT_WALK',
    binaryOutput: '100 100',
    booleanExpr: 'Q2′ · Q1 · Q0',
    qBits: '011',
    nextPhase: 'EW_LEFT',
  },
  EW_LEFT: {
    id: 'EW_LEFT',
    code: 'S4',
    shortTitle: 'E-W Left Arrow',
    title: 'East–West Protected Left-Turn Phase',
    description:
      'Dedicated green arrow for Eastbound and Westbound inner-lane left-turning traffic. Crosswalk signals remain on hold.',
    nsColor: 'RED',
    ewColor: 'LEFT_GREEN',
    pedNS: 'DONT_WALK',
    pedEW: 'DONT_WALK',
    binaryOutput: '100 001L',
    booleanExpr: 'Q2 · Q1′ · Q0′',
    qBits: '100',
    nextPhase: 'EW_GREEN',
  },
  EW_GREEN: {
    id: 'EW_GREEN',
    code: 'S5',
    shortTitle: 'E-W Green',
    title: 'East–West Through & Right Flow',
    description:
      'Eastbound and Westbound lanes have active green right-of-way. E–W pedestrian crosswalks display WALK.',
    nsColor: 'RED',
    ewColor: 'GREEN',
    pedNS: 'DONT_WALK',
    pedEW: 'WALK',
    binaryOutput: '100 001',
    booleanExpr: 'Q2 · Q1′ · Q0',
    qBits: '101',
    nextPhase: 'EW_YELLOW',
  },
  EW_YELLOW: {
    id: 'EW_YELLOW',
    code: 'S6',
    shortTitle: 'E-W Yellow',
    title: 'East–West Yellow Clearance',
    description:
      'Warns approaching East–West vehicles to decelerate and stop before the stop line prior to the all-red transition.',
    nsColor: 'RED',
    ewColor: 'YELLOW',
    pedNS: 'DONT_WALK',
    pedEW: 'DONT_WALK',
    binaryOutput: '100 010',
    booleanExpr: 'Q2 · Q1 · Q0′',
    qBits: '110',
    nextPhase: 'ALL_RED_2',
  },
  ALL_RED_2: {
    id: 'ALL_RED_2',
    code: 'S7',
    shortTitle: 'All-Red (E→N)',
    title: 'Intergreen Safety Buffer (E-W to N-S)',
    description:
      'All four approaches display solid red to clear the intersection before returning right-of-way to North–South.',
    nsColor: 'RED',
    ewColor: 'RED',
    pedNS: 'DONT_WALK',
    pedEW: 'DONT_WALK',
    binaryOutput: '100 100',
    booleanExpr: 'Q2 · Q1 · Q0',
    qBits: '111',
    nextPhase: 'NS_LEFT',
  },
};

export const DEFAULT_TIMINGS: PhaseTimingConfig = {
  nsLeft: 5,
  nsGreen: 10,
  nsYellow: 3,
  allRed1: 1.5,
  ewLeft: 5,
  ewGreen: 10,
  ewYellow: 3,
  allRed2: 1.5,
};

export function getActivePhaseOrder(protectedLeftEnabled: boolean): PhaseId[] {
  if (protectedLeftEnabled) {
    return PHASE_ORDER;
  }
  return [
    'NS_GREEN',
    'NS_YELLOW',
    'ALL_RED_1',
    'EW_GREEN',
    'EW_YELLOW',
    'ALL_RED_2',
  ];
}

export function getNextPhaseInCycle(
  current: PhaseId,
  protectedLeftEnabled: boolean
): PhaseId {
  const order = getActivePhaseOrder(protectedLeftEnabled);
  const idx = order.indexOf(current);
  if (idx === -1) return order[0];
  return order[(idx + 1) % order.length];
}

export function getPhaseDuration(
  phase: PhaseId,
  config: PhaseTimingConfig
): number {
  switch (phase) {
    case 'NS_LEFT':
      return config.nsLeft;
    case 'NS_GREEN':
      return config.nsGreen;
    case 'NS_YELLOW':
      return config.nsYellow;
    case 'ALL_RED_1':
      return config.allRed1;
    case 'EW_LEFT':
      return config.ewLeft;
    case 'EW_GREEN':
      return config.ewGreen;
    case 'EW_YELLOW':
      return config.ewYellow;
    case 'ALL_RED_2':
      return config.allRed2;
  }
}

export function getTotalCycleDuration(
  config: PhaseTimingConfig,
  protectedLeftEnabled = true
): number {
  const base =
    config.nsGreen +
    config.nsYellow +
    config.allRed1 +
    config.ewGreen +
    config.ewYellow +
    config.allRed2;
  return protectedLeftEnabled ? base + config.nsLeft + config.ewLeft : base;
}

export const WEATHER_PROFILES: Record<
  WeatherCondition,
  {
    label: string;
    frictionMultiplier: number;
    speedMultiplier: number;
    recommendedYellowSec: number;
    description: string;
  }
> = {
  CLEAR: {
    label: 'Dry Asphalt',
    frictionMultiplier: 1.0,
    speedMultiplier: 1.0,
    recommendedYellowSec: 3.0,
    description: '100% tire-pavement grip. Nominal braking distances.',
  },
  RAIN: {
    label: 'Heavy Rain',
    frictionMultiplier: 0.65,
    speedMultiplier: 0.85,
    recommendedYellowSec: 4.5,
    description: '65% wet braking traction. Longer stopping distances.',
  },
  FOG: {
    label: 'Dense Fog',
    frictionMultiplier: 0.82,
    speedMultiplier: 0.75,
    recommendedYellowSec: 4.0,
    description: 'Reduced sight distance and cautious approach speeds.',
  },
  NIGHT: {
    label: 'Night Operations',
    frictionMultiplier: 0.92,
    speedMultiplier: 0.92,
    recommendedYellowSec: 3.5,
    description: 'High-beam illumination with reduced peripheral visibility.',
  },
};

export const SCENARIO_PRESETS: Record<
  ScenarioId,
  {
    label: string;
    description: string;
    spawnRate: number;
    timings: PhaseTimingConfig;
    laneClosureEastOuter: boolean;
  }
> = {
  STANDARD: {
    label: 'Balanced Arterial',
    description: 'Symmetric 4-way flow with standard protected left turns.',
    spawnRate: 32,
    timings: { ...DEFAULT_TIMINGS },
    laneClosureEastOuter: false,
  },
  MORNING_RUSH: {
    label: 'Morning N–S Commute',
    description: 'Heavy North–South arterial inflow with extended green allocation.',
    spawnRate: 52,
    timings: {
      nsLeft: 6,
      nsGreen: 15,
      nsYellow: 3.5,
      allRed1: 1.5,
      ewLeft: 4,
      ewGreen: 8,
      ewYellow: 3,
      allRed2: 1.5,
    },
    laneClosureEastOuter: false,
  },
  STADIUM_SURGE: {
    label: 'Stadium Exit Surge',
    description: 'High-density all-way wave with frequent turning movements.',
    spawnRate: 64,
    timings: {
      nsLeft: 7,
      nsGreen: 12,
      nsYellow: 3.5,
      allRed1: 1.5,
      ewLeft: 7,
      ewGreen: 12,
      ewYellow: 3.5,
      allRed2: 1.5,
    },
    laneClosureEastOuter: false,
  },
  LANE_CLOSURE: {
    label: 'Eastbound Work Zone',
    description: 'Outer Eastbound lane closed with traffic cones; single-lane bottleneck.',
    spawnRate: 36,
    timings: { ...DEFAULT_TIMINGS },
    laneClosureEastOuter: true,
  },
  GRIDLOCK_TEST: {
    label: 'Gridlock Stress Test',
    description: 'Maximum 72 veh/min saturation inflow to test queue recovery.',
    spawnRate: 72,
    timings: {
      nsLeft: 4,
      nsGreen: 8,
      nsYellow: 2.5,
      allRed1: 1.0,
      ewLeft: 4,
      ewGreen: 8,
      ewYellow: 2.5,
      allRed2: 1.0,
    },
    laneClosureEastOuter: false,
  },
};

// Compute Highway Capacity Manual (HCM) Level of Service (LOS A-F) from average delay (s/veh)
export function computeLOSGrade(avgDelaySec: number): {
  grade: 'A' | 'B' | 'C' | 'D' | 'E' | 'F';
  label: string;
  colorClass: string;
} {
  if (avgDelaySec <= 10) {
    return { grade: 'A', label: 'Free Flow', colorClass: 'text-emerald-400' };
  }
  if (avgDelaySec <= 20) {
    return { grade: 'B', label: 'Stable Progression', colorClass: 'text-teal-400' };
  }
  if (avgDelaySec <= 35) {
    return { grade: 'C', label: 'Moderate Delay', colorClass: 'text-sky-400' };
  }
  if (avgDelaySec <= 55) {
    return { grade: 'D', label: 'Approaching Unstable', colorClass: 'text-amber-400' };
  }
  if (avgDelaySec <= 80) {
    return { grade: 'E', label: 'Capacity Limit', colorClass: 'text-orange-400' };
  }
  return { grade: 'F', label: 'Forced Breakdown', colorClass: 'text-rose-400' };
}

export const VEHICLE_PALETTES: Record<
  VehicleType,
  { colors: string[]; length: number; width: number; maxSpeed: number; label: string }
> = {
  SEDAN: {
    colors: ['#38bdf8', '#e2e8f0', '#94a3b8', '#60a5fa', '#34d399', '#fbbf24'],
    length: 34,
    width: 18,
    maxSpeed: 118,
    label: 'Passenger Sedan',
  },
  SUV: {
    colors: ['#cbd5e1', '#475569', '#0284c7', '#0d9488', '#f97316'],
    length: 38,
    width: 20,
    maxSpeed: 108,
    label: 'Crossover SUV',
  },
  TAXI: {
    colors: ['#facc15'],
    length: 34,
    width: 18,
    maxSpeed: 122,
    label: 'City Taxi',
  },
  TRANSIT_BUS: {
    colors: ['#0ea5e9', '#6366f1'],
    length: 54,
    width: 22,
    maxSpeed: 92,
    label: 'Transit Bus',
  },
  EMERGENCY: {
    colors: ['#ef4444'],
    length: 42,
    width: 20,
    maxSpeed: 148,
    label: 'Emergency Unit',
  },
};
