export type Direction = 'N' | 'S' | 'E' | 'W';

export type LightColor =
  | 'RED'
  | 'YELLOW'
  | 'GREEN'
  | 'LEFT_GREEN'
  | 'FLASH_YELLOW'
  | 'FLASH_RED';

export type PhaseId =
  | 'NS_LEFT'
  | 'NS_GREEN'
  | 'NS_YELLOW'
  | 'ALL_RED_1'
  | 'EW_LEFT'
  | 'EW_GREEN'
  | 'EW_YELLOW'
  | 'ALL_RED_2';

export type ControlMode =
  | 'FIXED_TIME'
  | 'ACTUATED_SMART'
  | 'MANUAL_OVERRIDE'
  | 'NIGHT_FLASH';

export type WeatherCondition = 'CLEAR' | 'RAIN' | 'FOG' | 'NIGHT';

export type ScenarioId =
  | 'STANDARD'
  | 'MORNING_RUSH'
  | 'STADIUM_SURGE'
  | 'LANE_CLOSURE'
  | 'GRIDLOCK_TEST';

export type TurnIntent = 'STRAIGHT' | 'LEFT' | 'RIGHT';

export type VehicleType = 'SEDAN' | 'SUV' | 'TAXI' | 'TRANSIT_BUS' | 'EMERGENCY';

export interface Vehicle {
  id: string;
  direction: Direction;
  lane: 0 | 1; // 0 = inner lane (Left / Straight), 1 = outer lane (Right / Straight)
  position: number; // 0 to 800 along trajectory
  speed: number;
  maxSpeed: number;
  length: number;
  width: number;
  type: VehicleType;
  color: string;
  turnIntent: TurnIntent;
  waitTime: number;
  braking: boolean;
  passedIntersection: boolean;
}

export interface PedestrianAgent {
  id: string;
  crosswalk: 'N' | 'S' | 'E' | 'W'; // which crosswalk they are using
  progress: number; // 0 to 1 across the crosswalk
  speed: number; // fraction per second
  direction: 1 | -1; // walking direction across the crosswalk
  laneOffset: number; // -7 to +7 px lateral offset across zebra width so pedestrians never overlap
  color: string;
}

export interface PhaseTimingConfig {
  nsLeft: number;
  nsGreen: number;
  nsYellow: number;
  allRed1: number;
  ewLeft: number;
  ewGreen: number;
  ewYellow: number;
  allRed2: number;
}

export interface ApproachTelemetry {
  direction: Direction;
  label: string;
  queueCount: number;
  totalVehicles: number;
  sensorActive: boolean;
  avgWaitSec: number;
  lightState: LightColor;
  pedestrianWalk: boolean;
  leftTurnWaiting: number;
}

export interface PhaseMetadata {
  id: PhaseId;
  code: string;
  shortTitle: string;
  title: string;
  description: string;
  nsColor: LightColor;
  ewColor: LightColor;
  pedNS: 'WALK' | 'DONT_WALK';
  pedEW: 'WALK' | 'DONT_WALK';
  binaryOutput: string;
  booleanExpr: string;
  qBits: string;
  nextPhase: PhaseId;
}

export interface PhaseLogEntry {
  id: string;
  timestamp: string;
  fromPhase: PhaseId;
  toPhase: PhaseId;
  reason: string;
  cycleCount: number;
}

export interface TelemetrySample {
  timeSec: number;
  nsQueue: number;
  ewQueue: number;
  avgWait: number;
  throughput: number;
}
