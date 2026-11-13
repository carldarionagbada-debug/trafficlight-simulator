'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import Navbar, { NavSection } from '@/components/Navbar';
import IntersectionCanvas from '@/components/IntersectionCanvas';
import OperationsPanels from '@/components/OperationsPanels';
import StateMachineDiagram from '@/components/StateMachineDiagram';
import ControlPanels from '@/components/ControlPanels';
import SystemDocumentationPanel from '@/components/SystemDocumentationPanel';
import {
  Sliders,
  Play,
  Pause,
  Zap,
  Siren,
  Footprints,
  BookOpen,
  GitCommitHorizontal,
  Car,
  Command,
  CheckCircle2,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import {
  ApproachTelemetry,
  ControlMode,
  Direction,
  LightColor,
  PedestrianAgent,
  PhaseId,
  PhaseLogEntry,
  PhaseTimingConfig,
  TelemetrySample,
  TurnIntent,
  Vehicle,
  VehicleType,
} from '@/types/simulation';
import {
  DEFAULT_TIMINGS,
  PHASE_DEFINITIONS,
  PHASE_ORDER,
  VEHICLE_PALETTES,
  computeLOSGrade,
  getNextPhaseInCycle,
  getPhaseDuration,
} from '@/lib/simulation-data';

const STOP_LINE_POS = 232;
const SENSOR_ZONE_START = 165;
const SENSOR_ZONE_END = 242;

function createVehicle(
  direction: Direction,
  lane: 0 | 1,
  position: number,
  forcedType?: VehicleType,
  forcedTurn?: TurnIntent
): Vehicle {
  const types: VehicleType[] = ['SEDAN', 'SEDAN', 'SUV', 'TAXI', 'TRANSIT_BUS'];
  const vType =
    forcedType || types[Math.floor(Math.random() * types.length)];
  const spec = VEHICLE_PALETTES[vType];
  const color = spec.colors[Math.floor(Math.random() * spec.colors.length)];

  let turnIntent: TurnIntent = 'STRAIGHT';
  if (forcedTurn) {
    turnIntent = forcedTurn;
  } else if (vType !== 'TRANSIT_BUS' && vType !== 'EMERGENCY') {
    if (lane === 0 && Math.random() < 0.38) {
      turnIntent = 'LEFT';
    } else if (lane === 1 && Math.random() < 0.32) {
      turnIntent = 'RIGHT';
    }
  }

  return {
    id: `veh-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    direction,
    lane,
    position,
    speed: spec.maxSpeed * 0.78,
    maxSpeed: spec.maxSpeed + (Math.random() * 14 - 7),
    length: spec.length,
    width: spec.width,
    type: vType,
    color,
    turnIntent,
    waitTime: 0,
    braking: false,
    passedIntersection: position > STOP_LINE_POS + 15,
  };
}

function createPedestrian(
  crosswalk: 'N' | 'S' | 'E' | 'W',
  startWalkingImmediately = false
): PedestrianAgent {
  const colors = ['#38bdf8', '#34d399', '#fbbf24', '#f472b6', '#a78bfa'];
  return {
    id: `ped-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    crosswalk,
    progress: startWalkingImmediately ? 0.06 + Math.random() * 0.08 : 0.01,
    speed: 0.24 + Math.random() * 0.06,
    direction: Math.random() < 0.5 ? 1 : -1,
    laneOffset: Math.round((Math.random() - 0.5) * 14),
    color: colors[Math.floor(Math.random() * colors.length)],
  };
}

function getInitialVehicles(): Vehicle[] {
  return [
    {
      id: 'veh-init-n0',
      direction: 'N',
      lane: 0,
      position: 175,
      speed: 92,
      maxSpeed: 118,
      length: 34,
      width: 18,
      type: 'SEDAN',
      color: '#38bdf8',
      turnIntent: 'STRAIGHT',
      waitTime: 0,
      braking: false,
      passedIntersection: false,
    },
    {
      id: 'veh-init-n1',
      direction: 'N',
      lane: 1,
      position: 95,
      speed: 84,
      maxSpeed: 108,
      length: 38,
      width: 20,
      type: 'SUV',
      color: '#cbd5e1',
      turnIntent: 'STRAIGHT',
      waitTime: 0,
      braking: false,
      passedIntersection: false,
    },
    {
      id: 'veh-init-s0',
      direction: 'S',
      lane: 0,
      position: 185,
      speed: 95,
      maxSpeed: 122,
      length: 34,
      width: 18,
      type: 'TAXI',
      color: '#facc15',
      turnIntent: 'STRAIGHT',
      waitTime: 0,
      braking: false,
      passedIntersection: false,
    },
    {
      id: 'veh-init-s1',
      direction: 'S',
      lane: 1,
      position: 110,
      speed: 92,
      maxSpeed: 118,
      length: 34,
      width: 18,
      type: 'SEDAN',
      color: '#34d399',
      turnIntent: 'RIGHT',
      waitTime: 0,
      braking: false,
      passedIntersection: false,
    },
    {
      id: 'veh-init-e0',
      direction: 'E',
      lane: 0,
      position: 205,
      speed: 0,
      maxSpeed: 118,
      length: 34,
      width: 18,
      type: 'SEDAN',
      color: '#60a5fa',
      turnIntent: 'LEFT',
      waitTime: 0,
      braking: true,
      passedIntersection: false,
    },
    {
      id: 'veh-init-e1',
      direction: 'E',
      lane: 1,
      position: 135,
      speed: 84,
      maxSpeed: 108,
      length: 38,
      width: 20,
      type: 'SUV',
      color: '#0284c7',
      turnIntent: 'STRAIGHT',
      waitTime: 0,
      braking: false,
      passedIntersection: false,
    },
    {
      id: 'veh-init-w0',
      direction: 'W',
      lane: 0,
      position: 195,
      speed: 0,
      maxSpeed: 92,
      length: 54,
      width: 22,
      type: 'TRANSIT_BUS',
      color: '#0ea5e9',
      turnIntent: 'STRAIGHT',
      waitTime: 0,
      braking: true,
      passedIntersection: false,
    },
    {
      id: 'veh-init-w1',
      direction: 'W',
      lane: 1,
      position: 120,
      speed: 92,
      maxSpeed: 118,
      length: 34,
      width: 18,
      type: 'SEDAN',
      color: '#e2e8f0',
      turnIntent: 'RIGHT',
      waitTime: 0,
      braking: false,
      passedIntersection: false,
    },
  ];
}

function getInitialPedestrians(): PedestrianAgent[] {
  return [
    {
      id: 'ped-init-w',
      crosswalk: 'W',
      progress: 0.12,
      speed: 0.26,
      direction: 1,
      laneOffset: -4,
      color: '#38bdf8',
    },
    {
      id: 'ped-init-e',
      crosswalk: 'E',
      progress: 0.14,
      speed: 0.27,
      direction: -1,
      laneOffset: 4,
      color: '#34d399',
    },
    {
      id: 'ped-init-n',
      crosswalk: 'N',
      progress: 0.01,
      speed: 0.26,
      direction: 1,
      laneOffset: 0,
      color: '#fbbf24',
    },
    {
      id: 'ped-init-s',
      crosswalk: 'S',
      progress: 0.01,
      speed: 0.25,
      direction: -1,
      laneOffset: 3,
      color: '#f472b6',
    },
  ];
}

export default function TrafficSimulatorPage() {
  const [activeSection, setActiveSection] = useState<NavSection>('intersection');
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [controlMode, setControlMode] = useState<ControlMode>('FIXED_TIME');
  const [protectedLeftEnabled, setProtectedLeftEnabled] = useState<boolean>(true);
  const [laneClosureActive, setLaneClosureActive] = useState<boolean>(false);
  const [mmuFaultLockout, setMmuFaultLockout] = useState<boolean>(false);
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false);

  const [timings, setTimings] = useState<PhaseTimingConfig>(DEFAULT_TIMINGS);
  const [currentPhase, setCurrentPhase] = useState<PhaseId>('NS_GREEN');
  const [phaseTimeRemaining, setPhaseTimeRemaining] = useState<number>(
    DEFAULT_TIMINGS.nsGreen
  );
  const [cycleCount, setCycleCount] = useState<number>(1);
  const [flashTick, setFlashTick] = useState<boolean>(true);
  const [spawnRatePerMin, setSpawnRatePerMin] = useState<number>(32);

  const [vehicles, setVehicles] = useState<Vehicle[]>(() => getInitialVehicles());
  const [pedestrians, setPedestrians] = useState<PedestrianAgent[]>(() =>
    getInitialPedestrians()
  );
  const [totalCleared, setTotalCleared] = useState<number>(24);
  const [pedestrianRequestedNS, setPedestrianRequestedNS] =
    useState<boolean>(false);
  const [pedestrianRequestedEW, setPedestrianRequestedEW] =
    useState<boolean>(false);

  const [telemetryHistory, setTelemetryHistory] = useState<TelemetrySample[]>([
    { timeSec: 0, nsQueue: 2, ewQueue: 3, avgWait: 3.2, throughput: 24 },
    { timeSec: 1, nsQueue: 1, ewQueue: 4, avgWait: 4.1, throughput: 25 },
    { timeSec: 2, nsQueue: 1, ewQueue: 4, avgWait: 4.5, throughput: 26 },
  ]);

  const [phaseLogs, setPhaseLogs] = useState<PhaseLogEntry[]>([
    {
      id: 'init-1',
      timestamp: '00:00.0',
      fromPhase: 'NS_LEFT',
      toPhase: 'NS_GREEN',
      reason: 'Cycle #1 Initialized (8-Phase Dual-Ring Schedule)',
      cycleCount: 1,
    },
  ]);

  const stateRef = useRef({
    isRunning,
    simSpeed,
    controlMode,
    protectedLeftEnabled,
    laneClosureActive,
    mmuFaultLockout,
    timings,
    currentPhase,
    phaseTimeRemaining,
    cycleCount,
    spawnRatePerMin,
    vehicles,
    pedestrians,
    pedestrianRequestedNS,
    pedestrianRequestedEW,
    elapsedTotalSec: 0,
  });

  useEffect(() => {
    stateRef.current.isRunning = isRunning;
    stateRef.current.simSpeed = simSpeed;
    stateRef.current.controlMode = controlMode;
    stateRef.current.protectedLeftEnabled = protectedLeftEnabled;
    stateRef.current.laneClosureActive = laneClosureActive;
    stateRef.current.mmuFaultLockout = mmuFaultLockout;
    stateRef.current.timings = timings;
    stateRef.current.spawnRatePerMin = spawnRatePerMin;
  }, [
    isRunning,
    simSpeed,
    controlMode,
    protectedLeftEnabled,
    laneClosureActive,
    mmuFaultLockout,
    spawnRatePerMin,
    timings,
  ]);

  const appendLog = useCallback(
    (fromPhase: PhaseId, toPhase: PhaseId, reason: string, nextCycle: number) => {
      const totalSec = stateRef.current.elapsedTotalSec;
      const mins = Math.floor(totalSec / 60)
        .toString()
        .padStart(2, '0');
      const secs = (totalSec % 60).toFixed(1).padStart(4, '0');
      const timestamp = `${mins}:${secs}`;

      setPhaseLogs((prev) => [
        {
          id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          timestamp,
          fromPhase,
          toPhase,
          reason,
          cycleCount: nextCycle,
        },
        ...prev.slice(0, 49),
      ]);
    },
    []
  );

  const handleSelectPhase = useCallback(
    (targetPhase: PhaseId, reason: string) => {
      const prevPhase = stateRef.current.currentPhase;
      const dur = getPhaseDuration(targetPhase, stateRef.current.timings);
      stateRef.current.currentPhase = targetPhase;
      stateRef.current.phaseTimeRemaining = dur;
      setCurrentPhase(targetPhase);
      setPhaseTimeRemaining(dur);
      appendLog(prevPhase, targetPhase, reason, stateRef.current.cycleCount);
    },
    [appendLog]
  );

  const handleStepPhase = useCallback(() => {
    const prevPhase = stateRef.current.currentPhase;
    const nextPhase = getNextPhaseInCycle(
      prevPhase,
      stateRef.current.protectedLeftEnabled
    );
    const isNewCycle =
      nextPhase === 'NS_LEFT' ||
      (!stateRef.current.protectedLeftEnabled && nextPhase === 'NS_GREEN');
    const nextCycle = isNewCycle
      ? stateRef.current.cycleCount + 1
      : stateRef.current.cycleCount;
    const dur = getPhaseDuration(nextPhase, stateRef.current.timings);

    stateRef.current.currentPhase = nextPhase;
    stateRef.current.phaseTimeRemaining = dur;
    setCurrentPhase(nextPhase);
    setPhaseTimeRemaining(dur);
    setCycleCount(nextCycle);
    appendLog(prevPhase, nextPhase, 'Manual Step Forward', nextCycle);
  }, [appendLog]);

  // Queue-aware vehicle spawner: always spawns a vehicle in the best lane and queues behind existing cars if near entry
  const handleSpawnVehicle = useCallback(
    (
      direction: Direction,
      forcedType?: VehicleType,
      forcedTurn?: TurnIntent,
      isAutoTick = false
    ) => {
      setVehicles((prev) => {
        let candidates: (0 | 1)[] =
          stateRef.current.laneClosureActive && direction === 'W'
            ? [0]
            : [0, 1];

        // Match lane to forcedTurn when possible (LEFT uses inner lane 0, RIGHT uses outer lane 1)
        if (forcedTurn === 'LEFT') {
          candidates = [0];
        } else if (
          forcedTurn === 'RIGHT' &&
          !(stateRef.current.laneClosureActive && direction === 'W')
        ) {
          candidates = [1];
        }

        let chosenLane: 0 | 1 = candidates[0];
        let bestRearPos = -999;

        for (const lane of candidates) {
          const inLane = prev.filter(
            (v) => v.direction === direction && v.lane === lane
          );
          const minPos =
            inLane.length === 0
              ? 180
              : Math.min(...inLane.map((v) => v.position - v.length / 2));
          if (minPos > bestRearPos) {
            bestRearPos = minPos;
            chosenLane = lane;
          }
        }

        // For automatic background ticks, don't pile up past the edge of the screen
        if (isAutoTick && bestRearPos < 36) {
          return prev;
        }

        // For manual user clicks, ALWAYS spawn visibly on the approach roadway!
        const spawnPos =
          bestRearPos >= 50
            ? 24
            : Math.max(-35, bestRearPos - 44);

        const newVeh = createVehicle(
          direction,
          chosenLane,
          spawnPos,
          forcedType,
          forcedTurn
        );
        const nextList = [...prev, newVeh];
        stateRef.current.vehicles = nextList;
        return nextList;
      });
    },
    []
  );

  // Bulk Rush Wave or Left-Turn Wave Spawner
  const handleSpawnWave = useCallback(
    (countPerApproach = 2, forcedTurn?: TurnIntent) => {
      setVehicles((prev) => {
        let working = [...prev];
        (['N', 'S', 'E', 'W'] as Direction[]).forEach((dir) => {
          const lanes: (0 | 1)[] =
            stateRef.current.laneClosureActive && dir === 'W'
              ? [0]
              : forcedTurn === 'LEFT'
              ? [0]
              : forcedTurn === 'RIGHT'
              ? [1]
              : [0, 1];

          for (let c = 0; c < countPerApproach; c++) {
            const lane = lanes[c % lanes.length];
            const inLane = working.filter(
              (v) => v.direction === dir && v.lane === lane
            );
            const minRear =
              inLane.length === 0
                ? 160
                : Math.min(...inLane.map((v) => v.position - v.length / 2));

            const spawnPos =
              minRear >= 55 ? 28 : Math.max(-60, minRear - 46);
            working.push(
              createVehicle(dir, lane, spawnPos, undefined, forcedTurn)
            );
          }
        });
        stateRef.current.vehicles = working;
        return working;
      });
    },
    []
  );

  // Clear All Vehicles
  const handleClearVehicles = useCallback(() => {
    stateRef.current.vehicles = [];
    setVehicles([]);
  }, []);

  // Emergency Dispatch & Preemption
  const handleSpawnEmergency = useCallback(
    (direction: Direction) => {
      setVehicles((prev) => {
        const lane: 0 | 1 = 0;
        const inLane = prev.filter(
          (v) => v.direction === direction && v.lane === lane
        );
        const minRear =
          inLane.length === 0
            ? 160
            : Math.min(...inLane.map((v) => v.position - v.length / 2));
        const spawnPos = minRear >= 50 ? 32 : Math.max(-20, minRear - 48);

        // Convert any queued cars in front of the emergency vehicle to STRAIGHT so they clear immediately on green
        const clearedAhead = prev.map((v) =>
          v.direction === direction && !v.passedIntersection
            ? { ...v, turnIntent: 'STRAIGHT' as TurnIntent }
            : v
        );

        const emergUnit = createVehicle(
          direction,
          lane,
          spawnPos,
          'EMERGENCY',
          'STRAIGHT'
        );
        const nextList = [...clearedAhead, emergUnit];
        stateRef.current.vehicles = nextList;
        return nextList;
      });

      const targetGreen: PhaseId =
        direction === 'N' || direction === 'S' ? 'NS_GREEN' : 'EW_GREEN';
      handleSelectPhase(
        targetGreen,
        `Emergency Priority Preemption (${direction} Approach)`
      );
    },
    [handleSelectPhase]
  );

  const handleClearEmergency = useCallback(() => {
    setVehicles((prev) => {
      const filtered = prev.filter((v) => v.type !== 'EMERGENCY');
      stateRef.current.vehicles = filtered;
      return filtered;
    });
  }, []);

  // Spawn Pedestrians on a Specific Crosswalk
  const handleSpawnPedestrian = useCallback(
    (
      crosswalk: 'N' | 'S' | 'E' | 'W',
      count = 2,
      forceWalkNow = true
    ) => {
      const isNSCrosswalk = crosswalk === 'E' || crosswalk === 'W';
      if (isNSCrosswalk) {
        setPedestrianRequestedNS(true);
        if (forceWalkNow && stateRef.current.currentPhase !== 'NS_GREEN') {
          handleSelectPhase(
            'NS_GREEN',
            `Pedestrian Walk Override (${crosswalk} Crosswalk)`
          );
        }
      } else {
        setPedestrianRequestedEW(true);
        if (forceWalkNow && stateRef.current.currentPhase !== 'EW_GREEN') {
          handleSelectPhase(
            'EW_GREEN',
            `Pedestrian Walk Override (${crosswalk} Crosswalk)`
          );
        }
      }

      setPedestrians((prev) => {
        const added: PedestrianAgent[] = [];
        for (let i = 0; i < count; i++) {
          added.push(createPedestrian(crosswalk, forceWalkNow));
        }
        const nextPeds = [...prev, ...added];
        stateRef.current.pedestrians = nextPeds;
        return nextPeds;
      });
    },
    [handleSelectPhase]
  );

  // Request Pedestrian Walk Phase across an Axis (+4 Pedestrians)
  const handleRequestPedestrianPhase = useCallback(
    (axis: 'NS' | 'EW', immediateOverride: boolean) => {
      if (axis === 'NS') {
        setPedestrianRequestedNS(true);
        if (immediateOverride && stateRef.current.currentPhase !== 'NS_GREEN') {
          handleSelectPhase(
            'NS_GREEN',
            'Pedestrian Pushbutton Walk Override (N–S)'
          );
        }
        setPedestrians((prev) => {
          const nextPeds = [
            ...prev,
            createPedestrian('W', immediateOverride),
            createPedestrian('W', immediateOverride),
            createPedestrian('E', immediateOverride),
            createPedestrian('E', immediateOverride),
          ];
          stateRef.current.pedestrians = nextPeds;
          return nextPeds;
        });
      } else {
        setPedestrianRequestedEW(true);
        if (immediateOverride && stateRef.current.currentPhase !== 'EW_GREEN') {
          handleSelectPhase(
            'EW_GREEN',
            'Pedestrian Pushbutton Walk Override (E–W)'
          );
        }
        setPedestrians((prev) => {
          const nextPeds = [
            ...prev,
            createPedestrian('N', immediateOverride),
            createPedestrian('N', immediateOverride),
            createPedestrian('S', immediateOverride),
            createPedestrian('S', immediateOverride),
          ];
          stateRef.current.pedestrians = nextPeds;
          return nextPeds;
        });
      }
    },
    [handleSelectPhase]
  );

  const handleClearPedestrians = useCallback(() => {
    stateRef.current.pedestrians = [];
    setPedestrians([]);
    setPedestrianRequestedNS(false);
    setPedestrianRequestedEW(false);
  }, []);

  const handleReset = useCallback(() => {
    const initV = getInitialVehicles();
    const initP = getInitialPedestrians();
    const resetDur = stateRef.current.timings.nsGreen;
    stateRef.current.vehicles = initV;
    stateRef.current.pedestrians = initP;
    stateRef.current.currentPhase = 'NS_GREEN';
    stateRef.current.phaseTimeRemaining = resetDur;
    stateRef.current.cycleCount = 1;
    stateRef.current.mmuFaultLockout = false;
    stateRef.current.pedestrianRequestedNS = false;
    stateRef.current.pedestrianRequestedEW = false;
    stateRef.current.elapsedTotalSec = 0;
    setVehicles(initV);
    setPedestrians(initP);
    setCurrentPhase('NS_GREEN');
    setPhaseTimeRemaining(resetDur);
    setCycleCount(1);
    setTotalCleared(0);
    setMmuFaultLockout(false);
    setPedestrianRequestedNS(false);
    setPedestrianRequestedEW(false);
    setPhaseLogs([
      {
        id: `reset-${Date.now()}`,
        timestamp: '00:00.0',
        fromPhase: 'ALL_RED_2',
        toPhase: 'NS_GREEN',
        reason: 'Simulation Reset to Initial State',
        cycleCount: 1,
      },
    ]);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setFlashTick((prev) => !prev);
    }, 450);
    return () => clearInterval(timer);
  }, []);

  // Main 60Hz Physics, Pedestrian & Signal Controller Loop
  useEffect(() => {
    let lastTime = performance.now();
    let spawnAccumulator = 0;
    let telemetryAccumulator = 0;
    let pedSpawnAccumulator = 0;
    let animId: number;

    const stepSimulation = (now: number) => {
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;

      const s = stateRef.current;
      if (s.isRunning) {
        const dt = Math.min(rawDt, 0.1) * s.simSpeed;
        s.elapsedTotalSec += dt;

        let activePhase = s.currentPhase;
        let remaining = s.phaseTimeRemaining;

        if (
          s.controlMode !== 'MANUAL_OVERRIDE' &&
          s.controlMode !== 'NIGHT_FLASH' &&
          !s.mmuFaultLockout
        ) {
          remaining -= dt;

          if (s.controlMode === 'ACTUATED_SMART' && remaining > 1.8) {
            const nsWaiting = s.vehicles.some(
              (v) =>
                (v.direction === 'N' || v.direction === 'S') &&
                v.position >= SENSOR_ZONE_START &&
                v.position <= STOP_LINE_POS + 5
            );
            const ewWaiting = s.vehicles.some(
              (v) =>
                (v.direction === 'E' || v.direction === 'W') &&
                v.position >= SENSOR_ZONE_START &&
                v.position <= STOP_LINE_POS + 5
            );

            if (activePhase === 'NS_GREEN' && !nsWaiting && ewWaiting) {
              remaining = Math.min(remaining, 1.4);
            } else if (activePhase === 'EW_GREEN' && !ewWaiting && nsWaiting) {
              remaining = Math.min(remaining, 1.4);
            }
          }

          if (remaining <= 0) {
            const prevPhase = activePhase;
            const nextPhase = getNextPhaseInCycle(
              prevPhase,
              s.protectedLeftEnabled
            );
            const isNewCycle =
              nextPhase === 'NS_LEFT' ||
              (!s.protectedLeftEnabled && nextPhase === 'NS_GREEN');
            const nextCycle = isNewCycle ? s.cycleCount + 1 : s.cycleCount;
            const nextDur = getPhaseDuration(nextPhase, s.timings);

            activePhase = nextPhase;
            remaining = nextDur;
            s.currentPhase = nextPhase;
            s.phaseTimeRemaining = nextDur;
            s.cycleCount = nextCycle;

            setCurrentPhase(nextPhase);
            setCycleCount(nextCycle);

            if (nextPhase === 'NS_GREEN' && s.pedestrianRequestedNS) {
              s.pedestrianRequestedNS = false;
              setPedestrianRequestedNS(false);
            }
            if (nextPhase === 'EW_GREEN' && s.pedestrianRequestedEW) {
              s.pedestrianRequestedEW = false;
              setPedestrianRequestedEW(false);
            }

            appendLog(
              prevPhase,
              nextPhase,
              s.controlMode === 'ACTUATED_SMART'
                ? 'Sensor-Actuated Phase Transition'
                : 'Scheduled Timer Transition',
              nextCycle
            );
          }

          s.phaseTimeRemaining = Math.max(0, remaining);
          setPhaseTimeRemaining(Math.max(0, remaining));
        }

        // Autonomous Vehicle Spawning
        if (s.spawnRatePerMin > 0) {
          const spawnIntervalSec = 60 / s.spawnRatePerMin;
          spawnAccumulator += dt;
          if (spawnAccumulator >= spawnIntervalSec) {
            spawnAccumulator = 0;
            const dirs: Direction[] = ['N', 'S', 'E', 'W'];
            const randomDir = dirs[Math.floor(Math.random() * dirs.length)];
            handleSpawnVehicle(randomDir, undefined, undefined, true);
          }
        }

        // Ambient Pedestrian Spawning & Crosswalk Walking
        pedSpawnAccumulator += dt;
        if (pedSpawnAccumulator >= 3.5) {
          pedSpawnAccumulator = 0;
          const cwList: ('N' | 'S' | 'E' | 'W')[] = ['N', 'S', 'E', 'W'];
          const cw = cwList[Math.floor(Math.random() * cwList.length)];
          setPedestrians((prev) => {
            const nextPeds =
              prev.length < 18 ? [...prev, createPedestrian(cw, false)] : prev;
            s.pedestrians = nextPeds;
            return nextPeds;
          });
        }

        const phaseMeta = PHASE_DEFINITIONS[activePhase];
        const canWalkNS =
          !s.mmuFaultLockout &&
          s.controlMode !== 'NIGHT_FLASH' &&
          phaseMeta.pedNS === 'WALK';
        const canWalkEW =
          !s.mmuFaultLockout &&
          s.controlMode !== 'NIGHT_FLASH' &&
          phaseMeta.pedEW === 'WALK';

        setPedestrians((prevPeds) => {
          const nextPeds = prevPeds
            .map((p) => {
              const isNSCrosswalk = p.crosswalk === 'E' || p.crosswalk === 'W';
              const walkAllowed = isNSCrosswalk ? canWalkNS : canWalkEW;
              // Once a pedestrian has Walk permission or has already stepped onto the crosswalk, walk smoothly to the opposite curb
              if (walkAllowed || p.progress > 0.02) {
                return { ...p, progress: p.progress + p.speed * dt };
              }
              return p;
            })
            .filter((p) => p.progress < 1.0);
          s.pedestrians = nextPeds;
          return nextPeds;
        });

        // Update Vehicle Physics (Zero Mid-Intersection Stopping, Zero Collisions, Smooth Flow)
        const nsLight: LightColor = s.mmuFaultLockout
          ? 'FLASH_RED'
          : s.controlMode === 'NIGHT_FLASH'
          ? 'FLASH_YELLOW'
          : phaseMeta.nsColor;
        const ewLight: LightColor = s.mmuFaultLockout
          ? 'FLASH_RED'
          : s.controlMode === 'NIGHT_FLASH'
          ? 'FLASH_RED'
          : phaseMeta.ewColor;

        let newlyClearedCount = 0;

        setVehicles((prevVehicles) => {
          const updated: Vehicle[] = [];
          const dirs: Direction[] = ['N', 'S', 'E', 'W'];

          // Map each approach's right-turn exit crosswalk
          const rightTurnExitCrosswalk: Record<Direction, 'N' | 'S' | 'E' | 'W'> = {
            N: 'W',
            S: 'E',
            W: 'S',
            E: 'N',
          };

          for (const dir of dirs) {
            const light = dir === 'N' || dir === 'S' ? nsLight : ewLight;
            const isNSAxis = dir === 'N' || dir === 'S';

            // Check if any perpendicular cross-street vehicle is currently inside the central conflict box (240..485)
            const crossTrafficInBox = prevVehicles.some((other) => {
              const otherIsNS = other.direction === 'N' || other.direction === 'S';
              if (otherIsNS === isNSAxis) return false;
              const front = other.position + other.length / 2;
              const rear = other.position - other.length / 2;
              return front > STOP_LINE_POS + 10 && rear < 485;
            });

            // Check if any pedestrian is actively crossing this approach's entry crosswalk
            const pedOnEntryCrosswalk = s.pedestrians.some(
              (p) =>
                p.crosswalk === dir &&
                p.progress > 0.03 &&
                p.progress < 0.95
            );

            // Check if any pedestrian is on or about to cross the right-turn exit crosswalk
            const exitCw = rightTurnExitCrosswalk[dir];
            const pedOnRightExitCrosswalk = s.pedestrians.some(
              (p) => p.crosswalk === exitCw && p.progress < 0.95
            );

            for (const lane of [0, 1] as (0 | 1)[]) {
              const laneCars = prevVehicles
                .filter((v) => v.direction === dir && v.lane === lane)
                .sort((a, b) => b.position - a.position);

              for (let i = 0; i < laneCars.length; i++) {
                const car = { ...laneCars[i] };
                const leader = i > 0 ? updated[updated.length - 1] : null;

                const frontBumper = car.position + car.length / 2;
                const distToStopLine = STOP_LINE_POS - frontBumper;

                const blockedByWorkZone =
                  s.laneClosureActive &&
                  dir === 'W' &&
                  lane === 1 &&
                  frontBumper < 120;

                // Align turn maneuver with active signal phase & pedestrian activity BEFORE entering the intersection
                // This prevents inner-lane stalls, opposing-traffic left-turn collisions, and crosswalk conflicts
                if (!car.passedIntersection && distToStopLine >= -4 && distToStopLine < 48) {
                  if (light === 'LEFT_GREEN' && lane === 0 && car.type !== 'EMERGENCY') {
                    car.turnIntent = 'LEFT';
                  } else if (light === 'GREEN') {
                    if (lane === 0 && car.turnIntent === 'LEFT') {
                      car.turnIntent = 'STRAIGHT';
                    }
                    if (lane === 1 && car.turnIntent === 'RIGHT' && pedOnRightExitCrosswalk) {
                      car.turnIntent = 'STRAIGHT';
                    }
                  }
                }

                // Stopping rules apply ONLY before the stop line (cars already inside the intersection NEVER stop in the center!)
                let mustStopForSignal = false;
                if (!car.passedIntersection && distToStopLine >= -2) {
                  if (crossTrafficInBox || pedOnEntryCrosswalk) {
                    mustStopForSignal = true;
                  } else if (car.type === 'EMERGENCY') {
                    mustStopForSignal = false;
                  } else if (light === 'RED') {
                    mustStopForSignal = true;
                  } else if (light === 'LEFT_GREEN') {
                    if (lane !== 0) {
                      mustStopForSignal = true;
                    }
                  } else if (light === 'YELLOW' && distToStopLine > 24) {
                    mustStopForSignal = true;
                  } else if (
                    light === 'FLASH_RED' &&
                    distToStopLine < 35 &&
                    car.waitTime < 1.5
                  ) {
                    mustStopForSignal = true;
                  }
                }

                let gapAhead = 9999;
                if (
                  leader &&
                  leader.direction === car.direction &&
                  leader.lane === car.lane
                ) {
                  const leaderRear = leader.position - leader.length / 2;
                  gapAhead = leaderRear - frontBumper - 14;
                }
                if (mustStopForSignal) {
                  gapAhead = Math.min(gapAhead, distToStopLine - 2);
                }
                if (blockedByWorkZone) {
                  gapAhead = Math.min(gapAhead, 110 - frontBumper);
                }

                const effectiveMaxSpeed = car.maxSpeed;
                let targetSpeed = effectiveMaxSpeed;

                if (
                  car.turnIntent !== 'STRAIGHT' &&
                  car.position > 240 &&
                  car.position < 460
                ) {
                  targetSpeed = effectiveMaxSpeed * 0.82;
                }

                // Once a car has entered the intersection box (position > STOP_LINE_POS), keep it moving smoothly so it NEVER stops in the center
                const isInsideIntersectionBox =
                  car.position + car.length / 2 > STOP_LINE_POS + 2 &&
                  car.position - car.length / 2 < 525;

                if (!isInsideIntersectionBox) {
                  if (gapAhead <= 2) {
                    targetSpeed = 0;
                  } else if (gapAhead < 72) {
                    targetSpeed = Math.min(
                      targetSpeed,
                      effectiveMaxSpeed * (gapAhead / 72)
                    );
                  }
                }

                const accel = 185;
                const decel = 280;

                if (car.speed < targetSpeed) {
                  car.speed = Math.min(targetSpeed, car.speed + accel * dt);
                  car.braking = false;
                } else {
                  car.speed = Math.max(targetSpeed, car.speed - decel * dt);
                  car.braking = car.speed < effectiveMaxSpeed * 0.85;
                }

                let nextPos = car.position + car.speed * dt;

                // Hard Same-Lane Bumper-to-Bumper Separation Clamp (Zero Rear-End Overlap)
                if (
                  leader &&
                  leader.direction === car.direction &&
                  leader.lane === car.lane
                ) {
                  const maxAllowedPos =
                    leader.position - leader.length / 2 - car.length / 2 - 14;
                  if (nextPos > maxAllowedPos) {
                    nextPos = Math.max(car.position, maxAllowedPos);
                    car.speed = Math.min(car.speed, leader.speed);
                    car.braking = car.speed < 15;
                  }
                }

                // Hard Stop-Line Clamp on Red/Stop (Before Stop Line Only)
                if (
                  mustStopForSignal &&
                  car.position + car.length / 2 <= STOP_LINE_POS + 2
                ) {
                  const maxStopPos = STOP_LINE_POS - car.length / 2 - 2;
                  if (nextPos > maxStopPos) {
                    nextPos = Math.max(car.position, maxStopPos);
                    car.speed = 0;
                    car.braking = true;
                  }
                }

                if (car.speed < 8 && !car.passedIntersection) {
                  car.waitTime += dt;
                }

                car.position = nextPos;

                if (
                  !car.passedIntersection &&
                  car.position + car.length / 2 > STOP_LINE_POS + 8
                ) {
                  car.passedIntersection = true;
                  newlyClearedCount += 1;
                }

                if (car.position - car.length / 2 < 830) {
                  updated.push(car);
                }
              }
            }
          }

          s.vehicles = updated;
          return updated;
        });

        if (newlyClearedCount > 0) {
          setTotalCleared((prev) => prev + newlyClearedCount);
        }

        // Sample Rolling Telemetry History every 1.0s
        telemetryAccumulator += dt;
        if (telemetryAccumulator >= 1.0) {
          telemetryAccumulator = 0;
          const nsQ = s.vehicles.filter(
            (v) =>
              (v.direction === 'N' || v.direction === 'S') &&
              !v.passedIntersection &&
              v.speed < 25
          ).length;
          const ewQ = s.vehicles.filter(
            (v) =>
              (v.direction === 'E' || v.direction === 'W') &&
              !v.passedIntersection &&
              v.speed < 25
          ).length;
          const avgW =
            s.vehicles.length > 0
              ? s.vehicles.reduce((acc, v) => acc + v.waitTime, 0) /
                s.vehicles.length
              : 0;

          setTelemetryHistory((prev) => [
            ...prev.slice(-59),
            {
              timeSec: Math.round(s.elapsedTotalSec),
              nsQueue: nsQ,
              ewQueue: ewQ,
              avgWait: avgW,
              throughput: newlyClearedCount,
            },
          ]);
        }
      }

      animId = requestAnimationFrame(stepSimulation);
    };

    animId = requestAnimationFrame(stepSimulation);
    return () => cancelAnimationFrame(animId);
  }, [appendLog, handleSpawnVehicle]);

  const phaseMeta = PHASE_DEFINITIONS[currentPhase];
  const nsLight: LightColor = mmuFaultLockout
    ? 'FLASH_RED'
    : controlMode === 'NIGHT_FLASH'
    ? 'FLASH_YELLOW'
    : phaseMeta.nsColor;
  const ewLight: LightColor = mmuFaultLockout
    ? 'FLASH_RED'
    : controlMode === 'NIGHT_FLASH'
    ? 'FLASH_RED'
    : phaseMeta.ewColor;

  const buildApproachTelemetry = (
    dir: Direction,
    label: string,
    lightState: LightColor,
    pedWalk: boolean
  ): ApproachTelemetry => {
    const dirVehicles = vehicles.filter((v) => v.direction === dir);
    const queued = dirVehicles.filter(
      (v) => !v.passedIntersection && v.speed < 25
    );
    const leftTurnWaiting = queued.filter((v) => v.turnIntent === 'LEFT').length;
    const sensorActive = dirVehicles.some(
      (v) =>
        !v.passedIntersection &&
        v.position + v.length / 2 >= SENSOR_ZONE_START &&
        v.position - v.length / 2 <= SENSOR_ZONE_END
    );
    const avgWaitSec =
      dirVehicles.length > 0
        ? dirVehicles.reduce((acc, v) => acc + v.waitTime, 0) /
          dirVehicles.length
        : 0;

    return {
      direction: dir,
      label,
      queueCount: queued.length,
      totalVehicles: dirVehicles.length,
      sensorActive,
      avgWaitSec,
      lightState,
      pedestrianWalk: pedWalk,
      leftTurnWaiting,
    };
  };

  const approaches: Record<Direction, ApproachTelemetry> = {
    N: buildApproachTelemetry(
      'N',
      'Northbound',
      nsLight,
      phaseMeta.pedNS === 'WALK'
    ),
    S: buildApproachTelemetry(
      'S',
      'Southbound',
      nsLight,
      phaseMeta.pedNS === 'WALK'
    ),
    E: buildApproachTelemetry(
      'E',
      'Eastbound',
      ewLight,
      phaseMeta.pedEW === 'WALK'
    ),
    W: buildApproachTelemetry(
      'W',
      'Westbound',
      ewLight,
      phaseMeta.pedEW === 'WALK'
    ),
  };

  const emergencyVehicle = vehicles.find(
    (v) => v.type === 'EMERGENCY' && !v.passedIntersection
  );
  const emergencyActive = emergencyVehicle ? emergencyVehicle.direction : null;

  const avgSystemWait =
    vehicles.length > 0
      ? vehicles.reduce((acc, v) => acc + v.waitTime, 0) / vehicles.length
      : 0;

  const losInfo = computeLOSGrade(avgSystemWait);

  const handleNavSelection = (section: NavSection) => {
    setActiveSection(section);
    const el = document.getElementById(section);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Global Keyboard Shortcuts for Live Presentation & Demo Control
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT')
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        setIsRunning((prev) => !prev);
      } else if (key === 'n') {
        e.preventDefault();
        handleStepPhase();
      } else if (key === 'r') {
        e.preventDefault();
        handleReset();
      } else if (key === '1') {
        handleSpawnVehicle('N', undefined, undefined, false);
      } else if (key === '2') {
        handleSpawnVehicle('S', undefined, undefined, false);
      } else if (key === '3') {
        handleSpawnVehicle('E', undefined, undefined, false);
      } else if (key === '4') {
        handleSpawnVehicle('W', undefined, undefined, false);
      } else if (key === 'w') {
        handleSpawnWave(2);
      } else if (key === 'e') {
        handleSpawnEmergency('N');
      } else if (key === 'p') {
        handleRequestPedestrianPhase('NS', true);
      } else if (key === 'f') {
        setIsFocusMode((prev) => !prev);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    handleStepPhase,
    handleReset,
    handleSpawnVehicle,
    handleSpawnWave,
    handleSpawnEmergency,
    handleRequestPedestrianPhase,
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-[#030a16] text-[#f5f5f7] relative selection:bg-[#0A84FF]/30 selection:text-white pb-6 md:pb-20">
      {/* Fluid Silk Wave Ambient Desktop Wallpaper */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
        {/* Deep Ultramarine & Royal Sapphire Gradient Base */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a2347] via-[#071830] to-[#020814]" />
        {/* Fluid Wave Ribbon 1: Radiant Azure Silk Swirl */}
        <div className="absolute -top-[18%] -left-[12%] w-[130%] h-[78%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.24)_0%,rgba(14,165,233,0.16)_35%,rgba(37,99,235,0.08)_60%,transparent_75%)] blur-3xl transform -rotate-12" />
        {/* Fluid Wave Ribbon 2: Oceanic Cyan & Light Blue Wave */}
        <div className="absolute top-[16%] -right-[15%] w-[115%] h-[82%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(96,165,250,0.2)_0%,rgba(59,130,246,0.14)_40%,transparent_70%)] blur-3xl transform rotate-6" />
        {/* Fluid Wave Ribbon 3: Deep Marine Ambient Ripple */}
        <div className="absolute bottom-[2%] left-[4%] w-[105%] h-[65%] rounded-full bg-[radial-gradient(ellipse_at_center,rgba(147,197,253,0.12)_0%,rgba(30,64,175,0.16)_45%,transparent_70%)] blur-3xl" />
        {/* Liquid Glass Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.07),transparent_55%)]" />
      </div>

      {/* Top System Menu Bar */}
      <Navbar
        activeSection={activeSection}
        onSelectSection={handleNavSelection}
      />

      {/* Main 1640px Simulation Sandbox Container */}
      <main className="relative z-10 flex-1 w-full max-w-[1640px] mx-auto px-1.5 sm:px-6 py-2.5 sm:py-5">
        {/* macOS Tahoe Application Window Frame */}
        <div className="rounded-2xl sm:rounded-[30px] border border-white/20 shadow-[0_30px_90px_rgba(0,0,0,0.6),inset_0_1px_1px_rgba(255,255,255,0.3)] bg-slate-900/40 backdrop-blur-3xl overflow-hidden p-2.5 sm:p-6 mb-6 md:mb-12">
          {/* macOS Window Title Bar with Traffic Light Window Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 pb-3.5 sm:pb-4 mb-4 sm:mb-5 border-b border-white/[0.12] select-none">
            {/* Traffic Light Buttons (Close, Minimize, Maximize) */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                type="button"
                onClick={handleReset}
                title="Reset Simulation (Close Window)"
                className="w-3.5 h-3.5 rounded-full bg-[#FF5F56] border border-[#E0443E] shadow-inner hover:opacity-85 transition-opacity cursor-pointer group flex items-center justify-center text-[8px] font-bold text-black/70"
              >
                <span className="opacity-0 group-hover:opacity-100">✕</span>
              </button>
              <button
                type="button"
                onClick={() => handleNavSelection('intersection')}
                title="Scroll to Top (Minimize Window)"
                className="w-3.5 h-3.5 rounded-full bg-[#FFBD2E] border border-[#DEA123] shadow-inner hover:opacity-85 transition-opacity cursor-pointer group flex items-center justify-center text-[8px] font-bold text-black/70"
              >
                <span className="opacity-0 group-hover:opacity-100">–</span>
              </button>
              <button
                type="button"
                onClick={() => setIsFocusMode((prev) => !prev)}
                title="Toggle Focus / Fullscreen Window"
                className="w-3.5 h-3.5 rounded-full bg-[#27C93F] border border-[#1AAB29] shadow-inner hover:opacity-85 transition-opacity cursor-pointer group flex items-center justify-center text-[8px] font-bold text-black/70"
              >
                <span className="opacity-0 group-hover:opacity-100">⤢</span>
              </button>
            </div>

            {/* Window Center Title */}
            <div className="flex items-center gap-2 text-xs font-semibold tracking-tight text-white/90 min-w-0">
              <span className="w-2 h-2 rounded-full bg-[#0A84FF] shadow-[0_0_8px_#0A84FF] shrink-0" />
              <span className="truncate sm:hidden">SignalFlow PLC Simulator</span>
              <span className="hidden sm:inline">SignalFlow · 8-Phase Digital PLC & Intersection Simulator</span>
            </div>

            {/* Window Right Action Tools: Large Running & Focus View Controls */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setIsRunning((prev) => !prev)}
                className={`h-10 sm:h-11 px-4 sm:px-5 inline-flex items-center justify-center gap-2 rounded-full text-xs sm:text-sm font-bold transition-all active:scale-95 cursor-pointer leading-none whitespace-nowrap ${
                  isRunning
                    ? 'bg-gradient-to-b from-[#30D158]/28 to-[#30D158]/14 text-[#30D158] border border-[#30D158]/55 hover:from-[#30D158]/38 hover:to-[#30D158]/20 shadow-[0_6px_20px_rgba(48,209,88,0.22),inset_0_1px_1px_rgba(255,255,255,0.28)]'
                    : 'bg-gradient-to-b from-[#FFD60A]/25 to-[#FFD60A]/12 text-[#FFD60A] border border-[#FFD60A]/50 hover:from-[#FFD60A]/35 hover:to-[#FFD60A]/18 shadow-[0_6px_20px_rgba(255,214,10,0.18),inset_0_1px_1px_rgba(255,255,255,0.25)]'
                }`}
                title={isRunning ? 'Pause 60Hz Physics' : 'Resume Simulation'}
              >
                {isRunning ? (
                  <>
                    <Pause className="w-4 h-4 fill-current shrink-0" />
                    <span>Running</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current shrink-0" />
                    <span>Paused</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setIsFocusMode((prev) => !prev)}
                className={`hidden lg:inline-flex h-10 sm:h-11 px-4 sm:px-5 items-center justify-center gap-2 rounded-full text-xs sm:text-sm font-bold transition-all active:scale-95 cursor-pointer leading-none whitespace-nowrap ${
                  isFocusMode
                    ? 'bg-gradient-to-b from-[#0A84FF] to-[#0066CC] text-white border border-[#64D2FF]/60 shadow-[0_6px_22px_rgba(10,132,255,0.45),inset_0_1px_1px_rgba(255,255,255,0.3)]'
                    : 'bg-white/[0.09] hover:bg-white/[0.16] border border-white/25 text-white shadow-[0_6px_18px_rgba(0,0,0,0.25),inset_0_1px_1px_rgba(255,255,255,0.25)]'
                }`}
              >
                {isFocusMode ? (
                  <Minimize2 className="w-4 h-4 shrink-0" />
                ) : (
                  <Maximize2 className="w-4 h-4 shrink-0" />
                )}
                <span>{isFocusMode ? 'Standard View' : 'Focus View'}</span>
              </button>
            </div>
          </div>

          {/* Centered Hero Section with Enlarged Animated Title, Credits & Highlighted Telemetry Dock */}
          <div className="flex flex-col items-center text-center pt-2 sm:pt-4 pb-6 sm:pb-8 mb-5 sm:mb-6 border-b border-white/[0.08]">
            {/* Enlarged Animated SignalFlow Simulator Title */}
            <div className="relative inline-flex flex-col items-center max-w-full px-1">
              <motion.div
                aria-hidden="true"
                animate={{
                  opacity: [0.38, 0.72, 0.38],
                  scale: [0.96, 1.05, 0.96],
                }}
                transition={{
                  duration: 4.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
                className="pointer-events-none absolute -inset-x-6 sm:-inset-x-16 -inset-y-4 rounded-full bg-[radial-gradient(ellipse_at_center,rgba(56,189,248,0.32)_0%,rgba(10,132,255,0.16)_45%,transparent_72%)] blur-2xl"
              />
              <motion.h1
                initial={{ opacity: 0, y: 14, scale: 0.97 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  backgroundPosition: ['0% 50%', '200% 50%'],
                }}
                transition={{
                  opacity: { duration: 0.55, ease: 'easeOut' },
                  y: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
                  scale: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
                  backgroundPosition: {
                    duration: 7,
                    repeat: Infinity,
                    ease: 'linear',
                  },
                }}
                className="relative z-10 text-[2.65rem] leading-[1.02] sm:text-6xl md:text-7xl lg:text-[5rem] xl:text-[5.75rem] font-extrabold tracking-[-0.035em] bg-gradient-to-r from-white via-[#64D2FF] to-white bg-[length:200%_auto] bg-clip-text text-transparent drop-shadow-[0_8px_28px_rgba(10,132,255,0.34)]"
                style={{ fontFamily: 'var(--font-display)', textWrap: 'balance' }}
              >
                SignalFlow Simulator
              </motion.h1>
            </div>

            {/* Project Credits Directly Below Title */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.12, ease: 'easeOut' }}
              className="mt-3 sm:mt-4 text-sm sm:text-xl lg:text-2xl font-medium tracking-tight text-slate-300 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 px-2"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              <span>Project By</span>
              <span className="font-semibold text-white whitespace-nowrap">Carl Agbada</span>
              <span className="text-[#64D2FF]/70" aria-hidden="true">·</span>
              <span className="font-semibold text-white whitespace-nowrap">Angelo Icaro</span>
              <span className="text-[#64D2FF]/70" aria-hidden="true">·</span>
              <span className="font-semibold text-white whitespace-nowrap">Ryza Suarez</span>
            </motion.p>

            {/* Centered Liquid Glass Telemetry Readout Dock Below Credits */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.2, ease: 'easeOut' }}
              className="mt-5 sm:mt-7 w-full max-w-6xl mx-auto bg-slate-900/45 backdrop-blur-3xl border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.3)] rounded-2xl sm:rounded-[26px] p-2.5 sm:p-4 font-mono tabular-nums"
            >
              <div className="grid grid-cols-2 lg:grid-cols-4 items-stretch gap-2.5 sm:gap-3.5">
                {/* Current Phase */}
                <div className="h-full min-h-[76px] sm:min-h-[86px] flex flex-col items-center justify-center px-2.5 sm:px-3.5 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-b from-[#0A84FF]/16 to-[#0A84FF]/[0.04] border border-[#64D2FF]/35 shadow-[0_8px_24px_rgba(10,132,255,0.12),inset_0_1px_1px_rgba(255,255,255,0.28)] min-w-0">
                  <div className="text-[#64D2FF]/90 font-sans text-[10px] sm:text-[11px] font-bold tracking-wider uppercase leading-none flex items-center justify-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#64D2FF] shadow-[0_0_8px_#64D2FF] shrink-0" />
                    <span>Current Phase</span>
                  </div>
                  <div className="text-xs sm:text-base xl:text-[17px] font-bold text-white mt-2 sm:mt-2.5 leading-snug text-center max-w-full truncate">
                    {mmuFaultLockout
                      ? 'MMU FAULT LOCK'
                      : `${phaseMeta.code} · ${phaseMeta.shortTitle}`}
                  </div>
                </div>

                {/* Service Grade */}
                <div className="h-full min-h-[76px] sm:min-h-[86px] flex flex-col items-center justify-center px-2.5 sm:px-3.5 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-b from-white/[0.09] to-white/[0.03] border border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.2),inset_0_1px_1px_rgba(255,255,255,0.28)] min-w-0">
                  <div className="text-zinc-300 font-sans text-[10px] sm:text-[11px] font-bold tracking-wider uppercase leading-none">
                    Service Grade
                  </div>
                  <div
                    className={`text-xs sm:text-base xl:text-[17px] font-bold mt-2 sm:mt-2.5 leading-snug text-center max-w-full truncate ${losInfo.colorClass}`}
                  >
                    LOS {losInfo.grade} ({losInfo.label})
                  </div>
                </div>

                {/* Active Traffic */}
                <div className="h-full min-h-[76px] sm:min-h-[86px] flex flex-col items-center justify-center px-2.5 sm:px-3.5 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-b from-[#38BDF8]/18 to-[#0A84FF]/[0.05] border border-[#64D2FF]/40 shadow-[0_8px_24px_rgba(56,189,248,0.16),inset_0_1px_1px_rgba(255,255,255,0.3)] min-w-0">
                  <div className="flex items-center justify-center gap-1.5 text-[#64D2FF] font-sans text-[10px] sm:text-[11px] font-bold tracking-wider uppercase leading-none">
                    <span className="relative flex h-1.5 w-1.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#64D2FF] opacity-80" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#64D2FF]" />
                    </span>
                    <span>Active Traffic</span>
                  </div>
                  <div className="text-xs sm:text-base xl:text-[17px] font-bold text-white mt-2 sm:mt-2.5 leading-snug text-center max-w-full truncate">
                    {vehicles.length} cars · {pedestrians.length} peds
                  </div>
                </div>

                {/* Total Cleared */}
                <div className="h-full min-h-[76px] sm:min-h-[86px] flex flex-col items-center justify-center px-2.5 sm:px-3.5 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-b from-[#30D158]/16 to-[#30D158]/[0.04] border border-[#30D158]/35 shadow-[0_8px_24px_rgba(48,209,88,0.12),inset_0_1px_1px_rgba(255,255,255,0.28)] min-w-0">
                  <div className="text-[#30D158]/90 font-sans text-[10px] sm:text-[11px] font-bold tracking-wider uppercase leading-none flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#30D158] shrink-0" />
                    <span>Total Cleared</span>
                  </div>
                  <div className="text-xs sm:text-base xl:text-[17px] font-bold text-[#30D158] mt-2 sm:mt-2.5 leading-snug text-center max-w-full truncate">
                    {totalCleared} veh
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Centered System Guide CTA */}
            <div className="mt-4 sm:mt-5 w-full flex justify-center px-2">
              <button
                type="button"
                onClick={() => handleNavSelection('guide')}
                className="min-h-[40px] sm:h-9 inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-[#64D2FF] bg-gradient-to-b from-[#0A84FF]/25 to-[#0A84FF]/10 hover:from-[#0A84FF]/35 hover:to-[#0A84FF]/20 border border-[#0A84FF]/45 rounded-full shadow-[0_8px_24px_rgba(10,132,255,0.25),inset_0_1px_1px_rgba(255,255,255,0.3)] backdrop-blur-2xl transition-all active:scale-[0.98] cursor-pointer leading-snug text-center max-w-full"
              >
                <BookOpen className="w-3.5 h-3.5 text-[#64D2FF] shrink-0" />
                <span>How It Works: System &amp; Diagram Guide</span>
              </button>
            </div>
          </div>

          {/* Apple macOS Liquid Glass Keycap Shortcuts Strip (Desktop Only) */}
          <div className="hidden md:flex flex-wrap items-center justify-between gap-3 px-5 py-2.5 mb-5 bg-slate-900/40 backdrop-blur-3xl border border-white/20 shadow-[0_16px_40px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.25)] rounded-[22px] text-xs">
            <div className="flex items-center gap-2 text-zinc-300 font-semibold text-xs leading-none">
              <Command className="w-3.5 h-3.5 text-white shrink-0" />
              <span>Quick Hotkeys:</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 font-mono text-[11px]">
              <button
                type="button"
                onClick={() => setIsRunning((prev) => !prev)}
                className="h-8 px-3 bg-white/[0.08] hover:bg-white/[0.18] border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25),0_2px_8px_rgba(0,0,0,0.25)] rounded-xl text-[#f5f5f7] transition-all active:scale-[0.97] cursor-pointer inline-flex items-center gap-1.5 leading-none"
              >
                <kbd className="px-1.5 py-0.5 rounded bg-white/[0.12] border border-white/25 text-[#64D2FF] font-bold text-[10px] leading-none">Space</kbd>
                <span>Play/Pause</span>
              </button>
              <button
                type="button"
                onClick={handleStepPhase}
                className="h-8 px-3 bg-white/[0.08] hover:bg-white/[0.18] border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25),0_2px_8px_rgba(0,0,0,0.25)] rounded-xl text-[#f5f5f7] transition-all active:scale-[0.97] cursor-pointer inline-flex items-center gap-1.5 leading-none"
              >
                <kbd className="px-1.5 py-0.5 rounded bg-white/[0.12] border border-white/25 text-[#64D2FF] font-bold text-[10px] leading-none">N</kbd>
                <span>Next Phase</span>
              </button>
              <button
                type="button"
                onClick={() => handleSpawnWave(2)}
                className="h-8 px-3 bg-white/[0.08] hover:bg-white/[0.18] border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25),0_2px_8px_rgba(0,0,0,0.25)] rounded-xl text-[#f5f5f7] transition-all active:scale-[0.97] cursor-pointer inline-flex items-center gap-1.5 leading-none"
              >
                <kbd className="px-1.5 py-0.5 rounded bg-white/[0.12] border border-white/25 text-[#FFD60A] font-bold text-[10px] leading-none">W</kbd>
                <span>Rush Wave</span>
              </button>
              <button
                type="button"
                onClick={() => handleSpawnEmergency('N')}
                className="h-8 px-3 bg-white/[0.08] hover:bg-white/[0.18] border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25),0_2px_8px_rgba(0,0,0,0.25)] rounded-xl text-[#f5f5f7] transition-all active:scale-[0.97] cursor-pointer inline-flex items-center gap-1.5 leading-none"
              >
                <kbd className="px-1.5 py-0.5 rounded bg-white/[0.12] border border-white/25 text-[#FF453A] font-bold text-[10px] leading-none">E</kbd>
                <span>Emergency</span>
              </button>
              <button
                type="button"
                onClick={() => handleRequestPedestrianPhase('NS', true)}
                className="h-8 px-3 bg-white/[0.08] hover:bg-white/[0.18] border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25),0_2px_8px_rgba(0,0,0,0.25)] rounded-xl text-[#f5f5f7] transition-all active:scale-[0.97] cursor-pointer inline-flex items-center gap-1.5 leading-none"
              >
                <kbd className="px-1.5 py-0.5 rounded bg-white/[0.12] border border-white/25 text-[#30D158] font-bold text-[10px] leading-none">P</kbd>
                <span>Walk N–S</span>
              </button>
              <button
                type="button"
                onClick={() => setIsFocusMode((prev) => !prev)}
                className="h-8 px-3 bg-white/[0.08] hover:bg-white/[0.18] border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25),0_2px_8px_rgba(0,0,0,0.25)] rounded-xl text-[#f5f5f7] transition-all active:scale-[0.97] cursor-pointer inline-flex items-center gap-1.5 leading-none"
              >
                <kbd className="px-1.5 py-0.5 rounded bg-white/[0.12] border border-white/25 text-[#64D2FF] font-bold text-[10px] leading-none">F</kbd>
                <span>{isFocusMode ? 'Standard View' : 'Focus View'}</span>
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="h-8 px-3 bg-white/[0.08] hover:bg-white/[0.18] border border-white/20 shadow-[inset_0_1px_1px_rgba(255,255,255,0.25),0_2px_8px_rgba(0,0,0,0.25)] rounded-xl text-zinc-300 hover:text-white transition-all active:scale-[0.97] cursor-pointer inline-flex items-center gap-1.5 leading-none"
              >
                <kbd className="px-1.5 py-0.5 rounded bg-white/[0.12] border border-white/25 text-zinc-300 font-bold text-[10px] leading-none">R</kbd>
                <span>Reset</span>
              </button>
            </div>
          </div>

        {/* Two-Zone Sandbox Grid: Left Column Animated Moving Cars, Right Column 3 Operations Panels */}
        <div
          className={`grid grid-cols-1 lg:grid-cols-12 ${
            isFocusMode ? 'auto-rows-auto gap-5' : 'lg:auto-rows-[minmax(0,1fr)] gap-4 lg:gap-5'
          } items-stretch`}
        >
          {/* Left Column: Live Intersection Canvas (Animated Moving Cars) */}
          <div
            className={`${
              isFocusMode ? 'lg:col-span-12' : 'lg:col-span-7 xl:col-span-8'
            } h-full flex flex-col min-h-0`}
          >
            <div id="intersection" className="scroll-mt-20 sm:scroll-mt-24 h-full flex-1 flex flex-col min-h-0">
              <IntersectionCanvas
                vehicles={vehicles}
                pedestrians={pedestrians}
                currentPhase={currentPhase}
                controlMode={controlMode}
                protectedLeftEnabled={protectedLeftEnabled}
                laneClosureActive={laneClosureActive}
                mmuFaultLockout={mmuFaultLockout}
                phaseTimeRemaining={phaseTimeRemaining}
                phaseDuration={getPhaseDuration(currentPhase, timings)}
                flashTick={flashTick}
                isRunning={isRunning}
                simSpeed={simSpeed}
                isFocusMode={isFocusMode}
                emergencyActive={emergencyActive}
                approaches={approaches}
                onToggleRun={() => setIsRunning((prev) => !prev)}
                onStepPhase={handleStepPhase}
                onReset={handleReset}
                onChangeSpeed={setSimSpeed}
                onChangeMode={setControlMode}
                onToggleProtectedLeft={() =>
                  setProtectedLeftEnabled((prev) => !prev)
                }
                onToggleLaneClosure={() =>
                  setLaneClosureActive((prev) => !prev)
                }
                onToggleMmuFault={() => setMmuFaultLockout((prev) => !prev)}
                onToggleFocusMode={() => setIsFocusMode((prev) => !prev)}
                onSelectPhase={handleSelectPhase}
                onSpawnVehicle={(dir, vType, turn) =>
                  handleSpawnVehicle(dir, vType, turn, false)
                }
              />
            </div>
          </div>

          {/* Right Column: 3 Operations Panels directly beside the moving cars animation */}
          <div
            className={`${
              isFocusMode ? 'lg:col-span-12' : 'lg:col-span-5 xl:col-span-4'
            } h-full flex flex-col min-h-0`}
          >
            <OperationsPanels
              mode="SIDEBAR"
              vehicles={vehicles}
              pedestrians={pedestrians}
              currentPhase={currentPhase}
              pedestrianRequestedNS={pedestrianRequestedNS}
              pedestrianRequestedEW={pedestrianRequestedEW}
              emergencyActive={emergencyActive}
              onSpawnVehicle={(dir, vType, turn) =>
                handleSpawnVehicle(dir, vType, turn, false)
              }
              onSpawnWave={handleSpawnWave}
              onClearVehicles={handleClearVehicles}
              onSpawnEmergency={handleSpawnEmergency}
              onClearEmergency={handleClearEmergency}
              onSpawnPedestrian={handleSpawnPedestrian}
              onRequestPedestrianPhase={handleRequestPedestrianPhase}
              onClearPedestrians={handleClearPedestrians}
            />
          </div>
        </div>

        {/* Full-Width 2-Column Telemetry & PLC Truth Table Row (Side-by-Side Equal Height) */}
        <div className="mt-5">
          <ControlPanels
            mode="BOTTOM_PAIR"
            currentPhase={currentPhase}
            controlMode={controlMode}
            protectedLeftEnabled={protectedLeftEnabled}
            mmuFaultLockout={mmuFaultLockout}
            timings={timings}
            spawnRatePerMin={spawnRatePerMin}
            approaches={approaches}
            totalCleared={totalCleared}
            activeVehicleCount={vehicles.length}
            phaseLogs={phaseLogs}
            isFocusMode={isFocusMode}
            onUpdateTimings={(newTimings) => {
              stateRef.current.timings = newTimings;
              const clamped = Math.min(
                stateRef.current.phaseTimeRemaining,
                getPhaseDuration(stateRef.current.currentPhase, newTimings)
              );
              stateRef.current.phaseTimeRemaining = clamped;
              setTimings(newTimings);
              setPhaseTimeRemaining(clamped);
            }}
            onUpdateSpawnRate={setSpawnRatePerMin}
            onSelectPhase={handleSelectPhase}
            onSpawnVehicle={(dir) =>
              handleSpawnVehicle(dir, undefined, undefined, false)
            }
          />
        </div>

        {/* Full-Width 12-Column Interactive 8-State Finite State Machine & PLC Logic Gate Diagram */}
        <div id="diagram" className="scroll-mt-20 sm:scroll-mt-24 mt-5 sm:mt-6">
          <StateMachineDiagram
            currentPhase={currentPhase}
            controlMode={controlMode}
            protectedLeftEnabled={protectedLeftEnabled}
            mmuFaultLockout={mmuFaultLockout}
            phaseTimeRemaining={phaseTimeRemaining}
            timings={timings}
            cycleCount={cycleCount}
            onSelectPhase={handleSelectPhase}
            onToggleMmuFault={() => setMmuFaultLockout((prev) => !prev)}
          />
        </div>

        {/* Complete Interactive System Architecture, Button & Diagram Documentation Panel */}
        <div className="mt-5 sm:mt-6">
          <SystemDocumentationPanel
            onSelectPhase={handleSelectPhase}
            onChangeMode={setControlMode}
            onSpawnEmergency={handleSpawnEmergency}
            onSpawnWave={() => handleSpawnWave(2)}
            onRequestPedestrianPhase={handleRequestPedestrianPhase}
            onToggleMmuFault={() => setMmuFaultLockout((prev) => !prev)}
          />
        </div>
      </div>
      {/* End of macOS Tahoe Application Window Frame */}
    </main>

      {/* Quiet macOS Tahoe Desktop Footer */}
      <footer className="relative z-10 border-t border-white/[0.08] bg-black/40 backdrop-blur-2xl py-4 px-4 sm:px-6 text-xs text-zinc-400 md:mb-14">
        <div className="max-w-[1640px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-center sm:text-left">
          <span>
            SignalFlow Simulator · Project by Carl Agbada, Angelo Icaro, and Ryza Suarez
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="text-zinc-300 hover:text-white transition-colors cursor-pointer py-1"
            >
              Reset Intersection
            </button>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => handleSpawnWave(2)}
              className="text-zinc-300 hover:text-white transition-colors cursor-pointer py-1"
            >
              Inject Traffic Wave
            </button>
          </div>
        </div>
      </footer>

      {/* macOS Tahoe Floating Glass Bottom Dock (Desktop / Tablet Landscape) */}
      <aside
        aria-label="macOS Tahoe Dock"
        className="hidden md:flex fixed bottom-3 left-1/2 -translate-x-1/2 z-50 px-3.5 py-2 bg-slate-900/50 backdrop-blur-3xl border border-white/25 shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.3)] rounded-2xl items-center gap-2.5 sm:gap-3.5 select-none transition-all"
      >
        <button
          type="button"
          onClick={() => handleNavSelection('intersection')}
          title="Intersection Canvas"
          className="group relative flex flex-col items-center justify-center p-1 rounded-xl hover:-translate-y-1 transition-all cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0A84FF] to-[#0058D0] shadow-[0_4px_12px_rgba(10,132,255,0.4)] flex items-center justify-center text-white">
            <Car className="w-5 h-5" />
          </div>
          <span className="w-1 h-1 rounded-full bg-white mt-1 shadow-xs" />
        </button>

        <button
          type="button"
          onClick={() => handleNavSelection('diagram')}
          title="State Machine Diagram (FSM)"
          className="group relative flex flex-col items-center justify-center p-1 rounded-xl hover:-translate-y-1 transition-all cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#BF5AF2] to-[#8944AB] shadow-[0_4px_12px_rgba(191,90,242,0.4)] flex items-center justify-center text-white">
            <GitCommitHorizontal className="w-5 h-5" />
          </div>
          <span className="w-1 h-1 rounded-full bg-transparent mt-1" />
        </button>

        <button
          type="button"
          onClick={() => handleNavSelection('timing')}
          title="Phase Timing & Parameters"
          className="group relative flex flex-col items-center justify-center p-1 rounded-xl hover:-translate-y-1 transition-all cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#5E5CE6] to-[#3634A3] shadow-[0_4px_12px_rgba(94,92,230,0.4)] flex items-center justify-center text-white">
            <Sliders className="w-5 h-5" />
          </div>
          <span className="w-1 h-1 rounded-full bg-transparent mt-1" />
        </button>

        <button
          type="button"
          onClick={() => handleSpawnWave(2)}
          title="Inject Rush Wave (+8)"
          className="group relative flex flex-col items-center justify-center p-1 rounded-xl hover:-translate-y-1 transition-all cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF9F0A] to-[#D97706] shadow-[0_4px_12px_rgba(255,159,10,0.4)] flex items-center justify-center text-white">
            <Zap className="w-5 h-5" />
          </div>
          <span className="w-1 h-1 rounded-full bg-transparent mt-1" />
        </button>

        <button
          type="button"
          onClick={() => handleSpawnEmergency('N')}
          title="Dispatch Siren Emergency (N)"
          className="group relative flex flex-col items-center justify-center p-1 rounded-xl hover:-translate-y-1 transition-all cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF453A] to-[#D70015] shadow-[0_4px_12px_rgba(255,69,58,0.4)] flex items-center justify-center text-white">
            <Siren className="w-5 h-5" />
          </div>
          <span className="w-1 h-1 rounded-full bg-transparent mt-1" />
        </button>

        <button
          type="button"
          onClick={() => handleRequestPedestrianPhase('NS', true)}
          title="Call Pedestrian Crosswalk"
          className="group relative flex flex-col items-center justify-center p-1 rounded-xl hover:-translate-y-1 transition-all cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#30D158] to-[#1E8A38] shadow-[0_4px_12px_rgba(48,209,88,0.4)] flex items-center justify-center text-white">
            <Footprints className="w-5 h-5" />
          </div>
          <span className="w-1 h-1 rounded-full bg-transparent mt-1" />
        </button>

        <button
          type="button"
          onClick={() => handleNavSelection('guide')}
          title="System Guide & User Manual"
          className="group relative flex flex-col items-center justify-center p-1 rounded-xl hover:-translate-y-1 transition-all cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#64D2FF] to-[#0071A4] shadow-[0_4px_12px_rgba(100,210,255,0.4)] flex items-center justify-center text-white">
            <BookOpen className="w-5 h-5" />
          </div>
          <span className="w-1 h-1 rounded-full bg-transparent mt-1" />
        </button>

        <div className="h-8 w-px bg-white/20 mx-0.5" />

        <button
          type="button"
          onClick={() => setIsRunning((prev) => !prev)}
          title={isRunning ? 'Pause 60Hz Engine' : 'Resume 60Hz Engine'}
          className="group relative flex flex-col items-center justify-center p-1 rounded-xl hover:-translate-y-1 transition-all cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 shadow-sm flex items-center justify-center text-white">
            {isRunning ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
          </div>
          <span
            className={`w-1 h-1 rounded-full mt-1 ${
              isRunning ? 'bg-[#30D158] shadow-[0_0_6px_#30D158]' : 'bg-transparent'
            }`}
          />
        </button>
      </aside>
    </div>
  );
}
