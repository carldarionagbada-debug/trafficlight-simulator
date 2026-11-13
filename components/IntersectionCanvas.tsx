'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ApproachTelemetry,
  ControlMode,
  Direction,
  LightColor,
  PedestrianAgent,
  PhaseId,
  TurnIntent,
  Vehicle,
  VehicleType,
} from '@/types/simulation';
import {
  PHASE_DEFINITIONS,
} from '@/lib/simulation-data';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Car,
  ShieldAlert,
  Construction,
  CornerUpLeft,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Cpu,
  X,
} from 'lucide-react';

interface IntersectionCanvasProps {
  vehicles: Vehicle[];
  pedestrians: PedestrianAgent[];
  currentPhase: PhaseId;
  controlMode: ControlMode;
  protectedLeftEnabled: boolean;
  laneClosureActive: boolean;
  mmuFaultLockout: boolean;
  phaseTimeRemaining: number;
  phaseDuration: number;
  flashTick: boolean;
  isRunning: boolean;
  simSpeed: number;
  isFocusMode: boolean;
  emergencyActive: Direction | null;
  approaches: Record<Direction, ApproachTelemetry>;
  onToggleRun: () => void;
  onStepPhase: () => void;
  onReset: () => void;
  onChangeSpeed: (speed: number) => void;
  onChangeMode: (mode: ControlMode) => void;
  onToggleProtectedLeft: () => void;
  onToggleLaneClosure: () => void;
  onToggleMmuFault: () => void;
  onToggleFocusMode: () => void;
  onSelectPhase: (phase: PhaseId, reason: string) => void;
  onSpawnVehicle: (
    direction: Direction,
    type?: VehicleType,
    turn?: TurnIntent
  ) => void;
}

function evalQuadBezier(
  t: number,
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number }
) {
  const u = 1 - t;
  const x = u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x;
  const y = u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y;
  const dx = 2 * u * (p1.x - p0.x) + 2 * t * (p2.x - p1.x);
  const dy = 2 * u * (p1.y - p0.y) + 2 * t * (p2.y - p1.y);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  return { x, y, angle };
}

function getVehicleTransform(v: Vehicle): { x: number; y: number; angle: number } {
  const offset = v.lane === 0 ? 14 : 41.5;

  const turnStart = 275;
  const turnLength = v.turnIntent === 'LEFT' ? 185 : 95;
  const turnEnd = turnStart + turnLength;

  if (v.turnIntent === 'STRAIGHT' || v.position <= turnStart) {
    switch (v.direction) {
      case 'N':
        return { x: 400 - offset, y: v.position, angle: 90 };
      case 'S':
        return { x: 400 + offset, y: 800 - v.position, angle: -90 };
      case 'W':
        return { x: v.position, y: 400 + offset, angle: 0 };
      case 'E':
        return { x: 800 - v.position, y: 400 - offset, angle: 180 };
    }
  }

  const rawT = Math.min(1, (v.position - turnStart) / turnLength);
  const afterTurnDist = Math.max(0, v.position - turnEnd);

  if (v.turnIntent === 'LEFT') {
    const outOffset = 14;
    switch (v.direction) {
      case 'N': {
        const p0 = { x: 400 - offset, y: 275 };
        const p1 = { x: 400 - offset, y: 400 + outOffset };
        const p2 = { x: 525, y: 400 + outOffset };
        if (rawT < 1) return evalQuadBezier(rawT, p0, p1, p2);
        return { x: 525 + afterTurnDist, y: 400 + outOffset, angle: 0 };
      }
      case 'S': {
        const p0 = { x: 400 + offset, y: 525 };
        const p1 = { x: 400 + offset, y: 400 - outOffset };
        const p2 = { x: 275, y: 400 - outOffset };
        if (rawT < 1) return evalQuadBezier(rawT, p0, p1, p2);
        return { x: 275 - afterTurnDist, y: 400 - outOffset, angle: 180 };
      }
      case 'W': {
        const p0 = { x: 275, y: 400 + offset };
        const p1 = { x: 400 + outOffset, y: 400 + offset };
        const p2 = { x: 400 + outOffset, y: 275 };
        if (rawT < 1) return evalQuadBezier(rawT, p0, p1, p2);
        return { x: 400 + outOffset, y: 275 - afterTurnDist, angle: -90 };
      }
      case 'E': {
        const p0 = { x: 525, y: 400 - offset };
        const p1 = { x: 400 - outOffset, y: 400 - offset };
        const p2 = { x: 400 - outOffset, y: 525 };
        if (rawT < 1) return evalQuadBezier(rawT, p0, p1, p2);
        return { x: 400 - outOffset, y: 525 + afterTurnDist, angle: 90 };
      }
    }
  } else {
    const outOffset = 41.5;
    switch (v.direction) {
      case 'N': {
        const p0 = { x: 400 - offset, y: 275 };
        const p1 = { x: 400 - offset, y: 400 - outOffset };
        const p2 = { x: 275, y: 400 - outOffset };
        if (rawT < 1) return evalQuadBezier(rawT, p0, p1, p2);
        return { x: 275 - afterTurnDist, y: 400 - outOffset, angle: 180 };
      }
      case 'S': {
        const p0 = { x: 400 + offset, y: 525 };
        const p1 = { x: 400 + offset, y: 400 + outOffset };
        const p2 = { x: 525, y: 400 + outOffset };
        if (rawT < 1) return evalQuadBezier(rawT, p0, p1, p2);
        return { x: 525 + afterTurnDist, y: 400 + outOffset, angle: 0 };
      }
      case 'W': {
        const p0 = { x: 275, y: 400 + offset };
        const p1 = { x: 400 - outOffset, y: 400 + offset };
        const p2 = { x: 400 - outOffset, y: 525 };
        if (rawT < 1) return evalQuadBezier(rawT, p0, p1, p2);
        return { x: 400 - outOffset, y: 525 + afterTurnDist, angle: 90 };
      }
      case 'E': {
        const p0 = { x: 525, y: 400 - offset };
        const p1 = { x: 400 + outOffset, y: 400 - offset };
        const p2 = { x: 400 + outOffset, y: 275 };
        if (rawT < 1) return evalQuadBezier(rawT, p0, p1, p2);
        return { x: 400 + outOffset, y: 275 - afterTurnDist, angle: -90 };
      }
    }
  }
}

function getPedestrianCoords(
  ped: PedestrianAgent,
  indexInGroup: number
): { x: number; y: number } {
  const clamped = Math.max(0, Math.min(1, ped.progress));
  const curbSpread = ped.progress <= 0.02 ? (indexInGroup % 5) * 8 : 0;
  const t = ped.direction === 1 ? clamped : 1 - clamped;

  switch (ped.crosswalk) {
    case 'N':
      return {
        x:
          ped.direction === 1
            ? 276 - curbSpread + t * 248
            : 524 + curbSpread - clamped * 248,
        y: 272 + ped.laneOffset,
      };
    case 'S':
      return {
        x:
          ped.direction === 1
            ? 276 - curbSpread + t * 248
            : 524 + curbSpread - clamped * 248,
        y: 528 + ped.laneOffset,
      };
    case 'W':
      return {
        x: 272 + ped.laneOffset,
        y:
          ped.direction === 1
            ? 276 - curbSpread + t * 248
            : 524 + curbSpread - clamped * 248,
      };
    case 'E':
      return {
        x: 528 + ped.laneOffset,
        y:
          ped.direction === 1
            ? 276 - curbSpread + t * 248
            : 524 + curbSpread - clamped * 248,
      };
  }
}

export default function IntersectionCanvas({
  vehicles,
  pedestrians,
  currentPhase,
  controlMode,
  protectedLeftEnabled,
  laneClosureActive,
  mmuFaultLockout,
  phaseTimeRemaining,
  phaseDuration,
  flashTick,
  isRunning,
  simSpeed,
  isFocusMode,
  emergencyActive,
  approaches,
  onToggleRun,
  onStepPhase,
  onReset,
  onChangeSpeed,
  onChangeMode,
  onToggleProtectedLeft,
  onToggleLaneClosure,
  onToggleMmuFault,
  onToggleFocusMode,
  onSelectPhase,
  onSpawnVehicle,
}: IntersectionCanvasProps) {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [hoveredSignalDir, setHoveredSignalDir] = useState<Direction | null>(
    null
  );
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const phaseMeta = PHASE_DEFINITIONS[currentPhase];

  const selectedVehicle =
    vehicles.find((v) => v.id === selectedVehicleId) || null;

  const nsDisplayColor: LightColor = mmuFaultLockout
    ? 'FLASH_RED'
    : controlMode === 'NIGHT_FLASH'
    ? 'FLASH_YELLOW'
    : phaseMeta.nsColor;

  const ewDisplayColor: LightColor = mmuFaultLockout
    ? 'FLASH_RED'
    : controlMode === 'NIGHT_FLASH'
    ? 'FLASH_RED'
    : phaseMeta.ewColor;

  const handleLightClick = (axis: 'NS' | 'EW') => {
    if (mmuFaultLockout) return;
    if (axis === 'NS') {
      onSelectPhase('NS_GREEN', 'Interactive Signal Head Override (N-S)');
    } else {
      onSelectPhase('EW_GREEN', 'Interactive Signal Head Override (E-W)');
    }
  };

  const renderSignalHead = (
    direction: Direction,
    x: number,
    y: number,
    colorState: LightColor,
    axis: 'NS' | 'EW'
  ) => {
    const isRedOn =
      colorState === 'RED' || (colorState === 'FLASH_RED' && flashTick);
    const isYellowOn =
      colorState === 'YELLOW' || (colorState === 'FLASH_YELLOW' && flashTick);
    const isGreenOn = colorState === 'GREEN';
    const isLeftArrowOn = colorState === 'LEFT_GREEN';

    const stateLabel =
      colorState === 'LEFT_GREEN'
        ? 'LEFT GRN'
        : colorState === 'FLASH_YELLOW'
        ? 'FLSH YEL'
        : colorState === 'FLASH_RED'
        ? 'FLSH RED'
        : colorState;

    const timerText =
      mmuFaultLockout
        ? 'ERR'
        : controlMode === 'NIGHT_FLASH'
        ? '--'
        : `${Math.ceil(phaseTimeRemaining)}s`;

    return (
      <g
        key={`signal-${direction}`}
        transform={`translate(${x}, ${y})`}
        onClick={(e) => {
          e.stopPropagation();
          handleLightClick(axis);
        }}
        onMouseEnter={() => setHoveredSignalDir(direction)}
        onMouseLeave={() => setHoveredSignalDir(null)}
        className="cursor-pointer group"
        role="button"
        aria-label={`${direction} Approach Traffic Signal — Current state ${stateLabel}. Click to switch green right-of-way.`}
      >
        <rect
          x="-32"
          y="-58"
          width="64"
          height="118"
          rx="12"
          fill="transparent"
          stroke="#38bdf8"
          strokeWidth="1.5"
          strokeDasharray="4 2"
          className="opacity-0 group-hover:opacity-90 transition-opacity"
        />

        <rect
          x="-24"
          y="-52"
          width="48"
          height="106"
          rx="9"
          fill="#0f172a"
          stroke={mmuFaultLockout ? '#ef4444' : '#334155'}
          strokeWidth="2"
        />
        <rect
          x="-20"
          y="-48"
          width="40"
          height="98"
          rx="6"
          fill="#020617"
          stroke="#1e293b"
          strokeWidth="1"
        />

        <text
          x="-11"
          y="-35"
          textAnchor="middle"
          fill="#94a3b8"
          fontSize="9"
          fontWeight="700"
          fontFamily="var(--font-mono)"
        >
          {direction}
        </text>
        <text
          x="8"
          y="-35"
          textAnchor="middle"
          fill={
            isGreenOn || isLeftArrowOn
              ? '#34d399'
              : isYellowOn
              ? '#fbbf24'
              : '#f87171'
          }
          fontSize="9"
          fontWeight="700"
          fontFamily="var(--font-mono)"
        >
          {timerText}
        </text>

        {/* RED Lamp */}
        <circle
          cx="0"
          cy="-21"
          r="7"
          fill={isRedOn ? '#ef4444' : '#2a1215'}
          stroke="#1e293b"
          strokeWidth="1.2"
        />
        {isRedOn && (
          <circle
            cx="0"
            cy="-21"
            r="9.5"
            fill="none"
            stroke="#ef4444"
            strokeWidth="1.8"
            opacity="0.45"
          />
        )}

        {/* YELLOW Lamp */}
        <circle
          cx="0"
          cy="-4"
          r="7"
          fill={isYellowOn ? '#f59e0b' : '#292112'}
          stroke="#1e293b"
          strokeWidth="1.2"
        />
        {isYellowOn && (
          <circle
            cx="0"
            cy="-4"
            r="9.5"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="1.8"
            opacity="0.45"
          />
        )}

        {/* GREEN Lamp */}
        <circle
          cx="0"
          cy="13"
          r="7"
          fill={isGreenOn ? '#10b981' : '#0d261f'}
          stroke="#1e293b"
          strokeWidth="1.2"
        />
        {isGreenOn && (
          <circle
            cx="0"
            cy="13"
            r="9.5"
            fill="none"
            stroke="#10b981"
            strokeWidth="1.8"
            opacity="0.45"
          />
        )}

        {/* PROTECTED LEFT ARROW Lamp */}
        <circle
          cx="0"
          cy="30"
          r="7"
          fill={isLeftArrowOn ? '#059669' : '#0a1f1a'}
          stroke="#1e293b"
          strokeWidth="1.2"
        />
        <text
          x="0"
          y="33.5"
          textAnchor="middle"
          fill={isLeftArrowOn ? '#ecfdf5' : '#1e293b'}
          fontSize="10"
          fontWeight="700"
          fontFamily="var(--font-mono)"
        >
          ←
        </text>
        {isLeftArrowOn && (
          <circle
            cx="0"
            cy="30"
            r="9.5"
            fill="none"
            stroke="#34d399"
            strokeWidth="1.8"
            opacity="0.55"
          />
        )}

        <text
          x="0"
          y="46"
          textAnchor="middle"
          fill={
            isGreenOn || isLeftArrowOn
              ? '#6ee7b7'
              : isYellowOn
              ? '#fde68a'
              : '#fca5a5'
          }
          fontSize="7"
          fontWeight="600"
          fontFamily="var(--font-mono)"
        >
          {stateLabel}
        </text>
      </g>
    );
  };

  const pedWalkNS =
    phaseMeta.pedNS === 'WALK' &&
    controlMode !== 'NIGHT_FLASH' &&
    !mmuFaultLockout;
  const pedWalkEW =
    phaseMeta.pedEW === 'WALK' &&
    controlMode !== 'NIGHT_FLASH' &&
    !mmuFaultLockout;

  const phaseProgressPct =
    phaseDuration > 0
      ? Math.max(0, Math.min(100, (phaseTimeRemaining / phaseDuration) * 100))
      : 0;

  return (
    <div className="h-full flex-1 grid grid-rows-[auto_auto_1fr_auto] bg-slate-900/45 backdrop-blur-3xl border border-white/20 shadow-[0_24px_60px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.28)] rounded-2xl sm:rounded-[26px] overflow-hidden">
      {/* Row 1: Crisp 2-Row Edge-to-Edge Playback, Speed, Zoom & Controller Mode Toolbar */}
      <div className="flex flex-col gap-2 px-3 sm:px-4 py-2.5 bg-white/[0.04] border-b border-white/[0.1]">
        {/* Toolbar Sub-row A: Primary Playback + Speed + Zoom/Expand */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={onToggleRun}
              className={`h-8 sm:h-7 inline-flex items-center justify-center gap-1.5 px-2.5 text-[11px] font-semibold rounded-lg transition-all active:scale-[0.97] whitespace-nowrap shrink-0 cursor-pointer leading-none ${
                isRunning
                  ? 'bg-[#FFD60A]/15 text-[#FFD60A] border border-[#FFD60A]/45 hover:bg-[#FFD60A]/25 shadow-[inset_0_1px_0_rgba(255,255,255,0.16)]'
                  : 'bg-[#0A84FF] text-white hover:bg-[#0071e3] border border-[#64D2FF]/50 shadow-[0_2px_12px_rgba(10,132,255,0.45),inset_0_1px_0_rgba(255,255,255,0.25)]'
              }`}
            >
              {isRunning ? <Pause className="w-3.5 h-3.5 shrink-0" /> : <Play className="w-3.5 h-3.5 shrink-0" />}
              <span>{isRunning ? 'Pause' : 'Play'}</span>
            </button>

            <button
              type="button"
              onClick={onStepPhase}
              className="h-8 sm:h-7 inline-flex items-center justify-center gap-1.5 px-2.5 text-[11px] font-semibold text-[#f5f5f7] bg-white/[0.07] hover:bg-[#0A84FF]/25 border border-white/15 hover:border-[#64D2FF]/45 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] rounded-lg transition-all active:scale-[0.97] whitespace-nowrap shrink-0 cursor-pointer leading-none"
            >
              <SkipForward className="w-3.5 h-3.5 text-[#64D2FF] shrink-0" />
              <span>Next Phase</span>
            </button>

            <button
              type="button"
              onClick={onReset}
              className="h-8 sm:h-7 inline-flex items-center justify-center gap-1.5 px-2.5 text-[11px] font-semibold text-zinc-300 hover:text-white bg-white/[0.05] hover:bg-white/[0.11] border border-white/10 rounded-lg transition-all active:scale-[0.97] whitespace-nowrap shrink-0 cursor-pointer leading-none"
            >
              <RotateCcw className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
              <span>Reset</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-end">
            {/* Speed Multipliers (Liquid Glass Segmented Control) */}
            <div
              className="flex items-center gap-0.5 p-0.5 bg-black/45 border border-white/[0.1] shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] rounded-lg"
              role="group"
              aria-label="Simulation Speed"
            >
              {[0.5, 1, 2, 4].map((spd) => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => onChangeSpeed(spd)}
                  className={`h-7 sm:h-6 px-2 inline-flex items-center justify-center text-[11px] font-mono font-semibold rounded-md transition-all whitespace-nowrap shrink-0 cursor-pointer leading-none ${
                    simSpeed === spd
                      ? 'bg-[#0A84FF]/30 text-white border border-[#64D2FF]/50 shadow-[0_2px_8px_rgba(10,132,255,0.25),inset_0_1px_0_rgba(255,255,255,0.2)]'
                      : 'text-zinc-400 border border-transparent hover:text-[#f5f5f7]'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            {/* Canvas Zoom & Expand Focus Controls */}
            <div className="flex items-center gap-0.5 p-0.5 bg-black/45 border border-white/[0.1] shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] rounded-lg">
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.max(1, +(z - 0.15).toFixed(2)))}
                className="h-7 w-7 sm:h-6 sm:w-6 inline-flex items-center justify-center text-zinc-400 hover:text-white rounded-md transition-colors cursor-pointer"
                title="Zoom Out Intersection"
              >
                <ZoomOut className="w-3.5 h-3.5 shrink-0" />
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel(1)}
                className="h-7 sm:h-6 px-1.5 inline-flex items-center justify-center text-[11px] font-mono tabular-nums text-zinc-300 hover:text-[#64D2FF] cursor-pointer leading-none"
                title="Reset Zoom to 100%"
              >
                {Math.round(zoomLevel * 100)}%
              </button>
              <button
                type="button"
                onClick={() => setZoomLevel((z) => Math.min(1.3, +(z + 0.15).toFixed(2)))}
                className="h-7 w-7 sm:h-6 sm:w-6 inline-flex items-center justify-center text-zinc-400 hover:text-white rounded-md transition-colors cursor-pointer"
                title="Zoom In Intersection"
              >
                <ZoomIn className="w-3.5 h-3.5 shrink-0" />
              </button>
              <button
                type="button"
                onClick={onToggleFocusMode}
                className={`hidden lg:inline-flex h-6 items-center justify-center gap-1 px-2 text-[11px] font-semibold rounded-md transition-all whitespace-nowrap shrink-0 cursor-pointer leading-none ${
                  isFocusMode
                    ? 'bg-[#0A84FF] text-white border border-[#64D2FF]/50 shadow-[0_1px_6px_rgba(10,132,255,0.5)]'
                    : 'text-[#f5f5f7] hover:bg-white/[0.14] bg-white/[0.08] border border-white/10'
                }`}
                title="Expand Intersection Stage for Presentation"
              >
                {isFocusMode ? (
                  <Minimize2 className="w-3 h-3 shrink-0" />
                ) : (
                  <Maximize2 className="w-3 h-3 shrink-0" />
                )}
                <span>
                  {isFocusMode ? 'Exit Focus' : 'Expand View'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Toolbar Sub-row B: Controller Operating Mode + Hardware Safety Toggles */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2">
          <div className="grid grid-cols-2 sm:inline-flex items-center gap-1 sm:gap-0.5 p-1 sm:p-0.5 bg-black/45 border border-white/[0.1] shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] rounded-lg w-full sm:w-auto">
            {(
              [
                { id: 'FIXED_TIME', label: 'Fixed Cycle' },
                { id: 'ACTUATED_SMART', label: 'Smart Sensor' },
                { id: 'MANUAL_OVERRIDE', label: 'Manual Hold' },
                { id: 'NIGHT_FLASH', label: 'Night Flash' },
              ] as { id: ControlMode; label: string }[]
            ).map((mode) => (
              <button
                key={mode.id}
                type="button"
                onClick={() => onChangeMode(mode.id)}
                className={`h-8 sm:h-6 px-2 inline-flex items-center justify-center text-[11px] font-semibold rounded-md transition-all whitespace-nowrap shrink-0 cursor-pointer leading-none ${
                  controlMode === mode.id
                    ? 'bg-[#0A84FF]/30 text-white border border-[#64D2FF]/50 shadow-[0_2px_8px_rgba(10,132,255,0.25),inset_0_1px_0_rgba(255,255,255,0.2)]'
                    : 'text-zinc-400 border border-transparent hover:text-[#f5f5f7]'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 sm:flex sm:flex-wrap items-center gap-1.5 sm:gap-1 w-full xl:w-auto xl:ml-auto">
            <button
              type="button"
              onClick={onToggleProtectedLeft}
              title="Toggle Protected Left-Turn Arrows"
              className={`h-8 sm:h-7 inline-flex items-center justify-center gap-1 px-1.5 xl:px-2 text-[10.5px] xl:text-[11px] font-semibold rounded-lg border transition-all whitespace-nowrap shrink-0 cursor-pointer leading-none ${
                protectedLeftEnabled
                  ? 'bg-[#30D158]/15 text-[#30D158] border-[#30D158]/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'
                  : 'bg-white/[0.05] text-zinc-400 border-white/10 hover:text-white'
              }`}
            >
              <CornerUpLeft className="w-3 h-3 shrink-0" />
              <span>Lefts: {protectedLeftEnabled ? 'ON' : 'OFF'}</span>
            </button>

            <button
              type="button"
              onClick={onToggleLaneClosure}
              title="Toggle Westbound Work Zone Lane Closure"
              className={`h-8 sm:h-7 inline-flex items-center justify-center gap-1 px-1.5 xl:px-2 text-[10.5px] xl:text-[11px] font-semibold rounded-lg border transition-all whitespace-nowrap shrink-0 cursor-pointer leading-none ${
                laneClosureActive
                  ? 'bg-[#FFD60A]/15 text-[#FFD60A] border-[#FFD60A]/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]'
                  : 'bg-white/[0.05] text-zinc-400 border-white/10 hover:text-white'
              }`}
            >
              <Construction className="w-3 h-3 shrink-0" />
              <span>Work: {laneClosureActive ? 'ON' : 'OFF'}</span>
            </button>

            <button
              type="button"
              onClick={onToggleMmuFault}
              title="Inject or Clear Malfunction Management Unit (MMU) Conflict Fault"
              className={`h-8 sm:h-7 inline-flex items-center justify-center gap-1 px-1.5 xl:px-2 text-[10.5px] xl:text-[11px] font-semibold rounded-lg border transition-all whitespace-nowrap shrink-0 cursor-pointer leading-none ${
                mmuFaultLockout
                  ? 'bg-[#FF453A] text-white border-[#FF453A] shadow-[0_2px_10px_rgba(255,69,58,0.4)]'
                  : 'bg-white/[0.05] text-zinc-400 border-white/10 hover:text-[#FF6961] hover:border-[#FF453A]/35'
              }`}
            >
              <ShieldAlert className="w-3 h-3 shrink-0" />
              <span>{mmuFaultLockout ? 'Clear Fault' : 'MMU Fault'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: Live Phase Status & Countdown Bar */}
      <div className="relative flex flex-wrap items-center justify-between gap-2 sm:gap-3 px-3.5 sm:px-5 py-2.5 bg-black/30 border-b border-white/[0.08] text-xs">
        <div className="flex flex-wrap items-center gap-2 text-zinc-300 min-w-0">
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#0A84FF]/15 border border-[#64D2FF]/30 font-mono font-bold text-[#64D2FF] leading-none shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-[#64D2FF] animate-pulse" />
            <span>{mmuFaultLockout ? 'MMU-ERR' : phaseMeta.code}</span>
          </span>
          <span className="font-semibold text-[#f5f5f7]">
            {mmuFaultLockout
              ? 'MMU Conflict Monitor Triggered — Emergency All-Way Flash Red'
              : controlMode === 'NIGHT_FLASH'
              ? 'Hazard Flash Mode (N-S Caution / E-W 4-Way Stop)'
              : phaseMeta.title}
          </span>
          {emergencyActive && (
            <>
              <span aria-hidden="true" className="text-white/20">
                ·
              </span>
              <span className="font-bold text-[#FF453A] animate-pulse">
                EMERGENCY PREEMPT ({emergencyActive} APPROACH)
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2.5 font-mono text-[11px] tabular-nums ml-auto">
          <span className="text-zinc-400">
            {isRunning ? 'Live 60Hz' : 'Paused'}
          </span>
          <div className="w-16 sm:w-20 h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#0A84FF] to-[#64D2FF] transition-[width] duration-150 ease-linear"
              style={{ width: `${phaseProgressPct}%` }}
            />
          </div>
          <span className="font-bold text-white">
            {phaseTimeRemaining.toFixed(1)}s
          </span>
        </div>
      </div>

      {/* Main Interactive SVG 4-Way Intersection Viewport */}
      <div
        className={`relative w-full h-full ${
          isFocusMode
            ? 'aspect-square max-h-[960px]'
            : 'aspect-square lg:aspect-auto lg:min-h-[660px] xl:min-h-[760px]'
        } bg-[#080d17] flex items-center justify-center overflow-hidden select-none p-0 sm:p-1`}
        style={{ contain: 'layout paint' }}
        onClick={() => setSelectedVehicleId(null)}
      >
        <svg
          viewBox="0 0 800 800"
          style={{
            transform: `scale(${zoomLevel})`,
            transition: 'transform 180ms cubic-bezier(0.16, 1, 0.3, 1)',
            transformOrigin: 'center center',
          }}
          className={`w-full h-full ${
            isFocusMode ? 'max-w-[960px] max-h-[960px]' : 'max-w-[880px] max-h-[880px]'
          }`}
          aria-label="Interactive 4-Way Traffic Light Intersection Simulation"
        >
          <defs>
            <pattern
              id="cityGrid"
              width="40"
              height="40"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 40"
                fill="none"
                stroke="#1e293b"
                strokeWidth="0.75"
                strokeOpacity="0.6"
              />
            </pattern>
            <pattern
              id="zebraH"
              width="16"
              height="24"
              patternUnits="userSpaceOnUse"
            >
              <rect x="0" y="0" width="8" height="24" fill="#cbd5e1" fillOpacity="0.75" />
            </pattern>
            <pattern
              id="zebraV"
              width="24"
              height="16"
              patternUnits="userSpaceOnUse"
            >
              <rect x="0" y="0" width="24" height="8" fill="#cbd5e1" fillOpacity="0.75" />
            </pattern>
            <pattern
              id="rainPattern"
              width="60"
              height="60"
              patternUnits="userSpaceOnUse"
            >
              <line
                x1="15"
                y1="5"
                x2="5"
                y2="28"
                stroke="#38bdf8"
                strokeWidth="1"
                strokeOpacity="0.3"
              />
              <line
                x1="45"
                y1="25"
                x2="35"
                y2="48"
                stroke="#38bdf8"
                strokeWidth="1"
                strokeOpacity="0.25"
              />
            </pattern>
          </defs>

          <rect x="0" y="0" width="800" height="800" fill="#090d16" />
          <rect x="0" y="0" width="800" height="800" fill="url(#cityGrid)" />

          {/* Corner Sidewalk Plazas with Live Approach Mini-Telemetry */}
          <g>
            {(
              [
                {
                  dir: 'N' as Direction,
                  x: 0,
                  y: 0,
                  title: 'NW PLAZA · N INBOUND',
                  cardX: 20,
                  cardY: 20,
                },
                {
                  dir: 'E' as Direction,
                  x: 514,
                  y: 0,
                  title: 'NE PLAZA · E INBOUND',
                  cardX: 540,
                  cardY: 20,
                },
                {
                  dir: 'W' as Direction,
                  x: 0,
                  y: 514,
                  title: 'SW PLAZA · W INBOUND',
                  cardX: 20,
                  cardY: 662,
                },
                {
                  dir: 'S' as Direction,
                  x: 514,
                  y: 514,
                  title: 'SE PLAZA · S INBOUND',
                  cardX: 540,
                  cardY: 662,
                },
              ]
            ).map((plaza) => {
              const app = approaches[plaza.dir];
              const isGreen = app.lightState === 'GREEN' || app.lightState === 'LEFT_GREEN';
              const isYellow = app.lightState === 'YELLOW' || app.lightState === 'FLASH_YELLOW';
              const accentColor = isGreen ? '#30D158' : isYellow ? '#FFD60A' : '#FF453A';
              const satWidth = Math.min(100, (app.queueCount / 6) * 100);
              return (
                <g key={plaza.dir}>
                  <rect
                    x={plaza.x}
                    y={plaza.y}
                    width="286"
                    height="286"
                    rx="20"
                    fill="#0b1324"
                    stroke="#24344d"
                    strokeWidth="2"
                  />
                  <rect
                    x={plaza.x + 10}
                    y={plaza.y + 10}
                    width="266"
                    height="266"
                    rx="14"
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="1"
                    strokeDasharray="4 4"
                  />

                  {/* Mini Corner Plaza Telemetry Widget */}
                  <g
                    onClick={(e) => {
                      e.stopPropagation();
                      onSpawnVehicle(plaza.dir);
                    }}
                    className="cursor-pointer group"
                    role="button"
                    aria-label={`Inject vehicle on ${app.label} approach`}
                  >
                    <rect
                      x={plaza.cardX}
                      y={plaza.cardY}
                      width="240"
                      height="112"
                      rx="12"
                      fill="#0f1b30"
                      fillOpacity="0.88"
                      stroke={app.sensorActive ? '#38bdf8' : '#1e293b'}
                      strokeWidth="1.2"
                      className="group-hover:stroke-sky-400 group-hover:fill-[#13233d] transition-colors"
                    />
                    <circle cx={plaza.cardX + 14} cy={plaza.cardY + 18} r="3.5" fill={accentColor} />
                    <text
                      x={plaza.cardX + 24}
                      y={plaza.cardY + 21.5}
                      fontFamily="var(--font-mono)"
                      fontSize="10"
                      fontWeight="700"
                      fill="#e2e8f0"
                    >
                      {plaza.title}
                    </text>

                    <text
                      x={plaza.cardX + 14}
                      y={plaza.cardY + 44}
                      fontFamily="var(--font-mono)"
                      fontSize="10.5"
                      fill="#94a3b8"
                    >
                      Queue: <tspan fill="#ffffff" fontWeight="700">{app.queueCount} veh</tspan> · Lefts:{' '}
                      <tspan fill="#64D2FF" fontWeight="700">{app.leftTurnWaiting}</tspan>
                    </text>

                    <text
                      x={plaza.cardX + 14}
                      y={plaza.cardY + 62}
                      fontFamily="var(--font-mono)"
                      fontSize="10"
                      fill={app.sensorActive ? '#38bdf8' : '#64748b'}
                      fontWeight="600"
                    >
                      Loop: {app.sensorActive ? 'DETECTED' : 'CLEAR'} · Wait: {app.avgWaitSec.toFixed(1)}s
                    </text>

                    {/* Mini Queue Saturation Bar */}
                    <rect
                      x={plaza.cardX + 14}
                      y={plaza.cardY + 74}
                      width="212"
                      height="5"
                      rx="2.5"
                      fill="#020617"
                    />
                    {app.queueCount > 0 && (
                      <rect
                        x={plaza.cardX + 14}
                        y={plaza.cardY + 74}
                        width={Math.max(8, (212 * satWidth) / 100)}
                        height="5"
                        rx="2.5"
                        fill={app.queueCount >= 4 ? '#FF9F0A' : '#0A84FF'}
                        className="transition-all duration-300"
                      />
                    )}

                    <text
                      x={plaza.cardX + 14}
                      y={plaza.cardY + 98}
                      fontFamily="var(--font-mono)"
                      fontSize="9.5"
                      fill="#64D2FF"
                      fontWeight="600"
                      className="opacity-75 group-hover:opacity-100 transition-opacity"
                    >
                      + Click card to inject {app.label} vehicle
                    </text>
                  </g>
                </g>
              );
            })}
          </g>

          {/* Asphalt Roadways */}
          <rect
            x="290"
            y="0"
            width="220"
            height="800"
            fill="#182232"
          />
          <rect
            x="0"
            y="290"
            width="800"
            height="220"
            fill="#182232"
          />

          {/* Glowing Animated Active Right-of-Way Corridor Overlays */}
          {!mmuFaultLockout && controlMode !== 'NIGHT_FLASH' && (
            <>
              {phaseMeta.nsColor === 'GREEN' && (
                <>
                  <rect
                    x="292"
                    y="0"
                    width="106"
                    height="800"
                    fill="#10b981"
                    fillOpacity="0.075"
                  />
                  <rect
                    x="402"
                    y="0"
                    width="106"
                    height="800"
                    fill="#10b981"
                    fillOpacity="0.075"
                  />
                  <motion.line
                    x1="345"
                    y1="0"
                    x2="345"
                    y2="800"
                    stroke="#34d399"
                    strokeWidth="2"
                    strokeOpacity="0.34"
                    strokeDasharray="10 14"
                    animate={isRunning ? { strokeDashoffset: [0, -48] } : undefined}
                    transition={{ duration: 1.2 / Math.max(0.5, simSpeed), repeat: Infinity, ease: 'linear' }}
                  />
                  <motion.line
                    x1="455"
                    y1="800"
                    x2="455"
                    y2="0"
                    stroke="#34d399"
                    strokeWidth="2"
                    strokeOpacity="0.34"
                    strokeDasharray="10 14"
                    animate={isRunning ? { strokeDashoffset: [0, -48] } : undefined}
                    transition={{ duration: 1.2 / Math.max(0.5, simSpeed), repeat: Infinity, ease: 'linear' }}
                  />
                </>
              )}
              {phaseMeta.ewColor === 'GREEN' && (
                <>
                  <rect
                    x="0"
                    y="292"
                    width="800"
                    height="106"
                    fill="#10b981"
                    fillOpacity="0.075"
                  />
                  <rect
                    x="0"
                    y="402"
                    width="800"
                    height="106"
                    fill="#10b981"
                    fillOpacity="0.075"
                  />
                  <motion.line
                    x1="800"
                    y1="345"
                    x2="0"
                    y2="345"
                    stroke="#34d399"
                    strokeWidth="2"
                    strokeOpacity="0.34"
                    strokeDasharray="10 14"
                    animate={isRunning ? { strokeDashoffset: [0, -48] } : undefined}
                    transition={{ duration: 1.2 / Math.max(0.5, simSpeed), repeat: Infinity, ease: 'linear' }}
                  />
                  <motion.line
                    x1="0"
                    y1="455"
                    x2="800"
                    y2="455"
                    stroke="#34d399"
                    strokeWidth="2"
                    strokeOpacity="0.34"
                    strokeDasharray="10 14"
                    animate={isRunning ? { strokeDashoffset: [0, -48] } : undefined}
                    transition={{ duration: 1.2 / Math.max(0.5, simSpeed), repeat: Infinity, ease: 'linear' }}
                  />
                </>
              )}
              {phaseMeta.nsColor === 'LEFT_GREEN' && (
                <>
                  <path
                    d="M 386 240 L 386 275 Q 386 414 550 414"
                    fill="none"
                    stroke="#14b8a6"
                    strokeWidth="18"
                    strokeOpacity="0.16"
                  />
                  <motion.path
                    d="M 386 240 L 386 275 Q 386 414 550 414"
                    fill="none"
                    stroke="#2dd4bf"
                    strokeWidth="2.5"
                    strokeOpacity="0.55"
                    strokeDasharray="8 10"
                    animate={isRunning ? { strokeDashoffset: [0, -36] } : undefined}
                    transition={{ duration: 1.0 / Math.max(0.5, simSpeed), repeat: Infinity, ease: 'linear' }}
                  />
                  <path
                    d="M 414 560 L 414 525 Q 414 386 250 386"
                    fill="none"
                    stroke="#14b8a6"
                    strokeWidth="18"
                    strokeOpacity="0.16"
                  />
                  <motion.path
                    d="M 414 560 L 414 525 Q 414 386 250 386"
                    fill="none"
                    stroke="#2dd4bf"
                    strokeWidth="2.5"
                    strokeOpacity="0.55"
                    strokeDasharray="8 10"
                    animate={isRunning ? { strokeDashoffset: [0, -36] } : undefined}
                    transition={{ duration: 1.0 / Math.max(0.5, simSpeed), repeat: Infinity, ease: 'linear' }}
                  />
                </>
              )}
              {phaseMeta.ewColor === 'LEFT_GREEN' && (
                <>
                  <path
                    d="M 240 414 L 275 414 Q 414 414 414 250"
                    fill="none"
                    stroke="#14b8a6"
                    strokeWidth="18"
                    strokeOpacity="0.16"
                  />
                  <motion.path
                    d="M 240 414 L 275 414 Q 414 414 414 250"
                    fill="none"
                    stroke="#2dd4bf"
                    strokeWidth="2.5"
                    strokeOpacity="0.55"
                    strokeDasharray="8 10"
                    animate={isRunning ? { strokeDashoffset: [0, -36] } : undefined}
                    transition={{ duration: 1.0 / Math.max(0.5, simSpeed), repeat: Infinity, ease: 'linear' }}
                  />
                  <path
                    d="M 560 386 L 525 386 Q 386 386 386 550"
                    fill="none"
                    stroke="#14b8a6"
                    strokeWidth="18"
                    strokeOpacity="0.16"
                  />
                  <motion.path
                    d="M 560 386 L 525 386 Q 386 386 386 550"
                    fill="none"
                    stroke="#2dd4bf"
                    strokeWidth="2.5"
                    strokeOpacity="0.55"
                    strokeDasharray="8 10"
                    animate={isRunning ? { strokeDashoffset: [0, -36] } : undefined}
                    transition={{ duration: 1.0 / Math.max(0.5, simSpeed), repeat: Infinity, ease: 'linear' }}
                  />
                </>
              )}
            </>
          )}

          {/* Center Intersection Conflict Box */}
          <rect
            x="290"
            y="290"
            width="220"
            height="220"
            fill="#151f2e"
            stroke="#334155"
            strokeWidth="1"
            strokeDasharray="6 6"
          />

          {/* Left-Turn Guiding Arcs */}
          <path
            d="M 386 275 Q 386 414 525 414"
            fill="none"
            stroke="#334155"
            strokeWidth="1"
            strokeDasharray="4 6"
          />
          <path
            d="M 414 525 Q 414 386 275 386"
            fill="none"
            stroke="#334155"
            strokeWidth="1"
            strokeDasharray="4 6"
          />
          <path
            d="M 275 414 Q 414 414 414 275"
            fill="none"
            stroke="#334155"
            strokeWidth="1"
            strokeDasharray="4 6"
          />
          <path
            d="M 525 386 Q 386 386 386 525"
            fill="none"
            stroke="#334155"
            strokeWidth="1"
            strokeDasharray="4 6"
          />

          {/* Double Yellow Center Dividers */}
          <line x1="398" y1="0" x2="398" y2="255" stroke="#eab308" strokeWidth="2" />
          <line x1="402" y1="0" x2="402" y2="255" stroke="#eab308" strokeWidth="2" />
          <line x1="398" y1="545" x2="398" y2="800" stroke="#eab308" strokeWidth="2" />
          <line x1="402" y1="545" x2="402" y2="800" stroke="#eab308" strokeWidth="2" />
          <line x1="0" y1="398" x2="255" y2="398" stroke="#eab308" strokeWidth="2" />
          <line x1="0" y1="402" x2="255" y2="402" stroke="#eab308" strokeWidth="2" />
          <line x1="545" y1="398" x2="800" y2="398" stroke="#eab308" strokeWidth="2" />
          <line x1="545" y1="402" x2="800" y2="402" stroke="#eab308" strokeWidth="2" />

          {/* Dashed White Multi-Lane Dividers */}
          <line
            x1="345"
            y1="0"
            x2="345"
            y2="255"
            stroke="#64748b"
            strokeWidth="1.5"
            strokeDasharray="12 12"
          />
          <line
            x1="455"
            y1="0"
            x2="455"
            y2="255"
            stroke="#64748b"
            strokeWidth="1.5"
            strokeDasharray="12 12"
          />
          <line
            x1="345"
            y1="545"
            x2="345"
            y2="800"
            stroke="#64748b"
            strokeWidth="1.5"
            strokeDasharray="12 12"
          />
          <line
            x1="455"
            y1="545"
            x2="455"
            y2="800"
            stroke="#64748b"
            strokeWidth="1.5"
            strokeDasharray="12 12"
          />
          <line
            x1="0"
            y1="345"
            x2="255"
            y2="345"
            stroke="#64748b"
            strokeWidth="1.5"
            strokeDasharray="12 12"
          />
          <line
            x1="0"
            y1="455"
            x2="255"
            y2="455"
            stroke="#64748b"
            strokeWidth="1.5"
            strokeDasharray="12 12"
          />
          <line
            x1="545"
            y1="345"
            x2="800"
            y2="345"
            stroke="#64748b"
            strokeWidth="1.5"
            strokeDasharray="12 12"
          />
          <line
            x1="545"
            y1="455"
            x2="800"
            y2="455"
            stroke="#64748b"
            strokeWidth="1.5"
            strokeDasharray="12 12"
          />

          {/* Solid White Stop Lines */}
          <line x1="292" y1="252" x2="396" y2="252" stroke="#f8fafc" strokeWidth="4" />
          <line x1="404" y1="548" x2="508" y2="548" stroke="#f8fafc" strokeWidth="4" />
          <line x1="252" y1="404" x2="252" y2="508" stroke="#f8fafc" strokeWidth="4" />
          <line x1="548" y1="292" x2="548" y2="396" stroke="#f8fafc" strokeWidth="4" />

          {/* Zebra Pedestrian Crosswalks */}
          <rect x="294" y="260" width="212" height="24" fill="url(#zebraH)" />
          <rect x="294" y="516" width="212" height="24" fill="url(#zebraH)" />
          <rect x="260" y="294" width="24" height="212" fill="url(#zebraV)" />
          <rect x="516" y="294" width="24" height="212" fill="url(#zebraV)" />

          {/* Active Pedestrian Walk Highlight Overlays & Digital Countdown Modules */}
          {pedWalkNS && (
            <>
              <rect
                x="260"
                y="294"
                width="24"
                height="212"
                fill="#10b981"
                fillOpacity="0.18"
                stroke="#10b981"
                strokeWidth="1.2"
              />
              <rect
                x="516"
                y="294"
                width="24"
                height="212"
                fill="#10b981"
                fillOpacity="0.18"
                stroke="#10b981"
                strokeWidth="1.2"
              />
            </>
          )}
          {pedWalkEW && (
            <>
              <rect
                x="294"
                y="260"
                width="212"
                height="24"
                fill="#10b981"
                fillOpacity="0.18"
                stroke="#10b981"
                strokeWidth="1.2"
              />
              <rect
                x="294"
                y="516"
                width="212"
                height="24"
                fill="#10b981"
                fillOpacity="0.18"
                stroke="#10b981"
                strokeWidth="1.2"
              />
            </>
          )}

          {/* Crosswalk Interactive Digital Signal Countdown Badges at Corners */}
          <g fontFamily="var(--font-mono)" fontSize="8.5" fontWeight="700">
            {/* West Crosswalk Badge (Click to toggle N-S Green & Walk) */}
            <g
              onClick={(e) => {
                e.stopPropagation();
                onSelectPhase('NS_GREEN', 'Interactive Crosswalk Override (N–S Walk)');
              }}
              className="cursor-pointer group"
              role="button"
              aria-label="Click to grant N-S Walk Phase"
            >
              <rect
                x="208"
                y="388"
                width="46"
                height="20"
                rx="6"
                fill="#020617"
                stroke={pedWalkNS ? '#10b981' : '#334155'}
                strokeWidth="1.2"
                className="group-hover:stroke-emerald-400 transition-colors"
              />
              <text
                x="231"
                y="401"
                textAnchor="middle"
                fill={pedWalkNS ? '#34d399' : '#94a3b8'}
              >
                {pedWalkNS ? `WLK ${Math.ceil(phaseTimeRemaining)}` : 'WAIT'}
              </text>
            </g>

            {/* North Crosswalk Badge (Click to toggle E-W Green & Walk) */}
            <g
              onClick={(e) => {
                e.stopPropagation();
                onSelectPhase('EW_GREEN', 'Interactive Crosswalk Override (E–W Walk)');
              }}
              className="cursor-pointer group"
              role="button"
              aria-label="Click to grant E-W Walk Phase"
            >
              <rect
                x="377"
                y="234"
                width="46"
                height="20"
                rx="6"
                fill="#020617"
                stroke={pedWalkEW ? '#10b981' : '#334155'}
                strokeWidth="1.2"
                className="group-hover:stroke-emerald-400 transition-colors"
              />
              <text
                x="400"
                y="247"
                textAnchor="middle"
                fill={pedWalkEW ? '#34d399' : '#94a3b8'}
              >
                {pedWalkEW ? `WLK ${Math.ceil(phaseTimeRemaining)}` : 'WAIT'}
              </text>
            </g>
          </g>

          {/* Inductive Loop Road Sensors (Click sensor pad to inject a test vehicle) */}
          <rect
            x="300"
            y="195"
            width="86"
            height="42"
            rx="4"
            fill={approaches.N.sensorActive ? '#0ea5e9' : 'transparent'}
            fillOpacity={approaches.N.sensorActive ? 0.16 : 0}
            stroke={approaches.N.sensorActive ? '#38bdf8' : '#334155'}
            strokeWidth="1.5"
            strokeDasharray="4 3"
            onClick={(e) => {
              e.stopPropagation();
              onSpawnVehicle('N');
            }}
            className="cursor-pointer hover:stroke-sky-400 transition-colors"
          />
          <rect
            x="414"
            y="563"
            width="86"
            height="42"
            rx="4"
            fill={approaches.S.sensorActive ? '#0ea5e9' : 'transparent'}
            fillOpacity={approaches.S.sensorActive ? 0.16 : 0}
            stroke={approaches.S.sensorActive ? '#38bdf8' : '#334155'}
            strokeWidth="1.5"
            strokeDasharray="4 3"
            onClick={(e) => {
              e.stopPropagation();
              onSpawnVehicle('S');
            }}
            className="cursor-pointer hover:stroke-sky-400 transition-colors"
          />
          <rect
            x="195"
            y="414"
            width="42"
            height="86"
            rx="4"
            fill={approaches.W.sensorActive ? '#0ea5e9' : 'transparent'}
            fillOpacity={approaches.W.sensorActive ? 0.16 : 0}
            stroke={approaches.W.sensorActive ? '#38bdf8' : '#334155'}
            strokeWidth="1.5"
            strokeDasharray="4 3"
            onClick={(e) => {
              e.stopPropagation();
              onSpawnVehicle('W');
            }}
            className="cursor-pointer hover:stroke-sky-400 transition-colors"
          />
          <rect
            x="563"
            y="300"
            width="42"
            height="86"
            rx="4"
            fill={approaches.E.sensorActive ? '#0ea5e9' : 'transparent'}
            fillOpacity={approaches.E.sensorActive ? 0.16 : 0}
            stroke={approaches.E.sensorActive ? '#38bdf8' : '#334155'}
            strokeWidth="1.5"
            strokeDasharray="4 3"
            onClick={(e) => {
              e.stopPropagation();
              onSpawnVehicle('E');
            }}
            className="cursor-pointer hover:stroke-sky-400 transition-colors"
          />

          {/* Lane Turn & Straight Pavement Markings */}
          <g fill="#475569" fontSize="13" fontFamily="var(--font-mono)" fontWeight="700">
            <text x="318" y="160" textAnchor="middle">
              ↓↱
            </text>
            <text x="372" y="160" textAnchor="middle">
              ↓↰
            </text>
            <text x="428" y="645" textAnchor="middle">
              ↑↰
            </text>
            <text x="482" y="645" textAnchor="middle">
              ↑↱
            </text>
            <text x="155" y="432" textAnchor="middle">
              →↰
            </text>
            <text x="155" y="486" textAnchor="middle">
              →↱
            </text>
            <text x="645" y="324" textAnchor="middle">
              ←↱
            </text>
            <text x="645" y="376" textAnchor="middle">
              ←↰
            </text>
          </g>

          {/* Work Zone Traffic Cones */}
          {laneClosureActive && (
            <g>
              <rect
                x="115"
                y="462"
                width="125"
                height="40"
                rx="4"
                fill="#f97316"
                fillOpacity="0.16"
                stroke="#f97316"
                strokeWidth="1.5"
                strokeDasharray="5 3"
              />
              {[130, 160, 190, 220].map((cx) => (
                <g key={cx} transform={`translate(${cx}, 482)`}>
                  <circle cx="0" cy="0" r="6" fill="#f97316" />
                  <circle cx="0" cy="0" r="2.5" fill="#fff" />
                </g>
              ))}
              <text
                x="177"
                y="475"
                textAnchor="middle"
                fill="#fdba74"
                fontSize="8.5"
                fontFamily="var(--font-mono)"
                fontWeight="700"
              >
                WORK ZONE CLOSED
              </text>
            </g>
          )}

          {/* Animated Pedestrian Agents on Crosswalks & Curbs */}
          {pedestrians.map((ped, idx) => {
            const { x, y } = getPedestrianCoords(ped, idx);
            const isWalking = ped.progress > 0.02 && ped.progress < 0.98;
            return (
              <g
                key={ped.id}
                transform={`translate(${x}, ${y})`}
              >
                {isWalking && (
                  <circle
                    cx="0"
                    cy="0"
                    r="10"
                    fill={ped.color}
                    fillOpacity="0.18"
                  />
                )}
                <circle
                  cx="0"
                  cy="0"
                  r="7.2"
                  fill="#020617"
                  fillOpacity="0.72"
                />
                <circle
                  cx="0"
                  cy="0"
                  r="5.5"
                  fill={ped.color}
                  stroke="#f8fafc"
                  strokeOpacity="0.7"
                  strokeWidth="1.1"
                />
                <circle cx="0" cy="0" r="2.1" fill="#ffffff" />
              </g>
            );
          })}

          {/* Autonomous Vehicles on Roadway */}
          {vehicles.map((v) => {
            const { x, y, angle } = getVehicleTransform(v);
            const isSelected = v.id === selectedVehicleId;
            const halfL = v.length / 2;
            const halfW = v.width / 2;
            const beamOpacity = 0.19;

            return (
              <g
                key={v.id}
                transform={`translate(${x}, ${y}) rotate(${angle})`}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedVehicleId(isSelected ? null : v.id);
                }}
                className="cursor-pointer group"
              >
                <rect
                  x={-halfL - 5}
                  y={-halfW - 5}
                  width={v.length + 10}
                  height={v.width + 10}
                  rx="7"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth={isSelected ? '2' : '1.4'}
                  strokeDasharray={isSelected ? undefined : '4 2'}
                  className={isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-75 transition-opacity'}
                />

                {/* Headlight Beams */}
                <polygon
                  points={`${halfL},${-halfW + 3} ${halfL + 28},${-halfW - 5} ${halfL + 28},${-2}`}
                  fill="#fef08a"
                  fillOpacity={beamOpacity}
                />
                <polygon
                  points={`${halfL},${halfW - 3} ${halfL + 28},${2} ${halfL + 28},${halfW + 5}`}
                  fill="#fef08a"
                  fillOpacity={beamOpacity}
                />

                {/* Vehicle Shadow */}
                <rect
                  x={-halfL + 1}
                  y={-halfW + 2.5}
                  width={v.length}
                  height={v.width}
                  rx="5.5"
                  fill="#020617"
                  fillOpacity="0.7"
                />

                {/* Vehicle Body */}
                <rect
                  x={-halfL}
                  y={-halfW}
                  width={v.length}
                  height={v.width}
                  rx="5.5"
                  fill={v.color}
                  stroke="#0f172a"
                  strokeWidth="1.2"
                />

                {/* Subtle Body Top Highlight */}
                <rect
                  x={-halfL + 2}
                  y={-halfW + 1.2}
                  width={v.length - 4}
                  height={2}
                  rx="1"
                  fill="#ffffff"
                  fillOpacity="0.22"
                />

                {/* Cabin Roof & Windshield */}
                <rect
                  x={-halfL * 0.45}
                  y={-halfW + 2.5}
                  width={v.length * 0.56}
                  height={v.width - 5}
                  rx="3"
                  fill="#0b1220"
                  fillOpacity="0.88"
                />
                <rect
                  x={halfL * 0.16}
                  y={-halfW + 3.2}
                  width={v.length * 0.16}
                  height={v.width - 6.4}
                  rx="1.5"
                  fill="#38bdf8"
                  fillOpacity="0.25"
                />

                {/* Blinking Amber Turn Signal Indicators */}
                {v.turnIntent === 'LEFT' && flashTick && v.position < 490 && (
                  <>
                    <circle cx={halfL - 2} cy={-halfW + 2} r="4.5" fill="#fbbf24" fillOpacity="0.28" />
                    <circle cx={halfL - 2} cy={-halfW + 2} r="2.6" fill="#fbbf24" />
                    <circle cx={-halfL + 2} cy={-halfW + 2} r="2.6" fill="#fbbf24" />
                  </>
                )}
                {v.turnIntent === 'RIGHT' && flashTick && v.position < 420 && (
                  <>
                    <circle cx={halfL - 2} cy={halfW - 2} r="4.5" fill="#fbbf24" fillOpacity="0.28" />
                    <circle cx={halfL - 2} cy={halfW - 2} r="2.6" fill="#fbbf24" />
                    <circle cx={-halfL + 2} cy={halfW - 2} r="2.6" fill="#fbbf24" />
                  </>
                )}

                {/* Emergency Lightbar */}
                {v.type === 'EMERGENCY' && (
                  <g>
                    <circle
                      cx="0"
                      cy="0"
                      r="22"
                      fill={flashTick ? '#ef4444' : '#3b82f6'}
                      fillOpacity="0.16"
                    />
                    <rect
                      x="-5"
                      y={-halfW + 2}
                      width="10"
                      height={v.width - 4}
                      rx="2"
                      fill={flashTick ? '#ef4444' : '#3b82f6'}
                    />
                    <circle
                      cx="0"
                      cy="0"
                      r="18"
                      fill="none"
                      stroke={flashTick ? '#ef4444' : '#3b82f6'}
                      strokeWidth="2"
                      opacity="0.8"
                    />
                  </g>
                )}

                {/* Brake Lights & Glow */}
                {v.braking && (
                  <>
                    <circle cx={-halfL} cy={-halfW + 4} r="5.5" fill="#ef4444" fillOpacity="0.32" />
                    <circle cx={-halfL} cy={halfW - 4} r="5.5" fill="#ef4444" fillOpacity="0.32" />
                  </>
                )}
                <rect
                  x={-halfL - 1}
                  y={-halfW + 2}
                  width="3"
                  height="4.5"
                  rx="1"
                  fill={v.braking ? '#ff3b30' : '#7f1d1d'}
                />
                <rect
                  x={-halfL - 1}
                  y={halfW - 6.5}
                  width="3"
                  height="4.5"
                  rx="1"
                  fill={v.braking ? '#ff3b30' : '#7f1d1d'}
                />
              </g>
            );
          })}

          {/* 4 Interactive Corner Traffic Light Modules */}
          {renderSignalHead('N', 240, 204, nsDisplayColor, 'NS')}
          {renderSignalHead('S', 560, 596, nsDisplayColor, 'NS')}
          {renderSignalHead('W', 204, 560, ewDisplayColor, 'EW')}
          {renderSignalHead('E', 596, 240, ewDisplayColor, 'EW')}

          {/* On-Canvas Quick Spawn Pills at Each Approach */}
          <g
            transform="translate(345, 28)"
            onClick={(e) => {
              e.stopPropagation();
              onSpawnVehicle('N');
            }}
            className="cursor-pointer group"
            role="button"
            aria-label="Spawn Vehicle on North Approach"
          >
            <rect
              x="-44"
              y="-14"
              width="88"
              height="26"
              rx="13"
              fill="#0c1526"
              fillOpacity="0.92"
              stroke="#3b4c68"
              strokeWidth="1.4"
              className="group-hover:stroke-sky-400 transition-colors"
            />
            <text
              x="0"
              y="3"
              textAnchor="middle"
              fill="#f1f5f9"
              fontSize="10"
              fontWeight="600"
              fontFamily="var(--font-mono)"
            >
              + SPAWN N
            </text>
          </g>

          <g
            transform="translate(455, 772)"
            onClick={(e) => {
              e.stopPropagation();
              onSpawnVehicle('S');
            }}
            className="cursor-pointer group"
            role="button"
            aria-label="Spawn Vehicle on South Approach"
          >
            <rect
              x="-44"
              y="-14"
              width="88"
              height="26"
              rx="13"
              fill="#0c1526"
              fillOpacity="0.92"
              stroke="#3b4c68"
              strokeWidth="1.4"
              className="group-hover:stroke-sky-400 transition-colors"
            />
            <text
              x="0"
              y="3"
              textAnchor="middle"
              fill="#f1f5f9"
              fontSize="10"
              fontWeight="600"
              fontFamily="var(--font-mono)"
            >
              + SPAWN S
            </text>
          </g>

          <g
            transform="translate(50, 455)"
            onClick={(e) => {
              e.stopPropagation();
              onSpawnVehicle('W');
            }}
            className="cursor-pointer group"
            role="button"
            aria-label="Spawn Vehicle on West Approach"
          >
            <rect
              x="-44"
              y="-14"
              width="88"
              height="26"
              rx="13"
              fill="#0c1526"
              fillOpacity="0.92"
              stroke="#3b4c68"
              strokeWidth="1.4"
              className="group-hover:stroke-sky-400 transition-colors"
            />
            <text
              x="0"
              y="3"
              textAnchor="middle"
              fill="#f1f5f9"
              fontSize="10"
              fontWeight="600"
              fontFamily="var(--font-mono)"
            >
              + SPAWN W
            </text>
          </g>

          <g
            transform="translate(750, 345)"
            onClick={(e) => {
              e.stopPropagation();
              onSpawnVehicle('E');
            }}
            className="cursor-pointer group"
            role="button"
            aria-label="Spawn Vehicle on East Approach"
          >
            <rect
              x="-44"
              y="-14"
              width="88"
              height="26"
              rx="13"
              fill="#0c1526"
              fillOpacity="0.92"
              stroke="#3b4c68"
              strokeWidth="1.4"
              className="group-hover:stroke-sky-400 transition-colors"
            />
            <text
              x="0"
              y="3"
              textAnchor="middle"
              fill="#f1f5f9"
              fontSize="10"
              fontWeight="600"
              fontFamily="var(--font-mono)"
            >
              + SPAWN E
            </text>
          </g>
        </svg>

        {/* Animated Hover & Selection Overlays */}
        <AnimatePresence>
          {hoveredSignalDir && (
            <motion.div
              key="signal-popover"
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.97 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              className="absolute top-2 left-2 right-2 sm:top-3 sm:left-3 sm:right-auto sm:w-72 bg-slate-900/90 backdrop-blur-2xl border border-[#64D2FF]/35 rounded-2xl p-3 sm:p-3.5 shadow-[0_16px_40px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.18)] text-xs pointer-events-none"
            >
              <div className="flex items-center justify-between gap-2 pb-1.5 mb-1.5 border-b border-white/[0.1]">
                <div className="flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-[#64D2FF]" />
                  <span className="font-semibold text-[#f5f5f7]">
                    Signal Head {hoveredSignalDir} ({approaches[hoveredSignalDir].label})
                  </span>
                </div>
                <span className="font-mono text-[11px] font-bold text-[#64D2FF]">
                  {phaseMeta.code}
                </span>
              </div>
              <div className="space-y-1 font-mono text-[11px] text-[#a1a1a6]">
                <div className="flex justify-between">
                  <span className="text-[#86868b]">Aspect Output:</span>
                  <span className="text-[#30D158] font-semibold">
                    {approaches[hoveredSignalDir].lightState}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#86868b]">Boolean Term:</span>
                  <span className="text-[#f5f5f7]">{phaseMeta.booleanExpr}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#86868b]">Register Bits:</span>
                  <span className="text-[#f5f5f7]">{phaseMeta.binaryOutput}</span>
                </div>
                <div className="text-[10px] font-sans text-[#64D2FF] pt-1">
                  Click signal head to force Green right-of-way
                </div>
              </div>
            </motion.div>
          )}

          {selectedVehicle && (
            <motion.div
              key="vehicle-inspector"
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.97 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-2 left-2 right-2 sm:bottom-3 sm:left-3 sm:right-auto sm:w-88 bg-slate-900/90 backdrop-blur-2xl border border-[#64D2FF]/40 rounded-2xl p-3 sm:p-3.5 shadow-[0_16px_40px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.18)] text-xs"
            >
              <div className="flex items-center justify-between gap-2 pb-2 mb-2 border-b border-white/[0.1]">
                <div className="flex items-center gap-2 min-w-0">
                  <Car className="w-3.5 h-3.5 text-[#64D2FF] shrink-0" />
                  <span className="font-semibold text-[#f5f5f7] truncate">
                    Vehicle #{selectedVehicle.id.slice(-4)} ({selectedVehicle.type})
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded-md font-mono text-[10px] font-semibold leading-none shrink-0 ${
                      selectedVehicle.type === 'EMERGENCY'
                        ? 'bg-[#FF453A]/20 text-[#FF6961] border border-[#FF453A]/40'
                        : selectedVehicle.braking || selectedVehicle.speed < 2
                        ? 'bg-[#FFD60A]/15 text-[#FFD60A] border border-[#FFD60A]/35'
                        : 'bg-[#30D158]/15 text-[#30D158] border border-[#30D158]/35'
                    }`}
                  >
                    {selectedVehicle.type === 'EMERGENCY'
                      ? 'PRIORITY'
                      : selectedVehicle.braking || selectedVehicle.speed < 2
                      ? 'STOPPED'
                      : 'MOVING'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedVehicleId(null)}
                  className="h-8 w-8 sm:h-6 sm:w-6 inline-flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.1] transition-colors cursor-pointer shrink-0"
                  aria-label="Close Vehicle Inspector"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono tabular-nums text-[#f5f5f7]">
                <div>
                  <div className="text-[10px] text-zinc-400">Approach</div>
                  <div>
                    {selectedVehicle.direction} L{selectedVehicle.lane + 1}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-400">Maneuver</div>
                  <div className="text-[#64D2FF]">{selectedVehicle.turnIntent}</div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-400">Velocity</div>
                  <div>{Math.round(selectedVehicle.speed * 0.45)} km/h</div>
                </div>
                <div>
                  <div className="text-[10px] text-zinc-400">Delay</div>
                  <div>{selectedVehicle.waitTime.toFixed(1)}s</div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Interactive Status Footer with Live Phase Progress Accent */}
      <div className="relative flex flex-wrap items-center justify-between gap-2 px-3.5 sm:px-5 py-2.5 bg-black/35 border-t border-white/[0.08] text-[11px] sm:text-xs text-zinc-400">
        <span>
          Tap signal heads, plaza cards, or any car to interact live
        </span>
        <span className="font-mono font-semibold text-[#f5f5f7] tabular-nums ml-auto">
          Timer: {phaseTimeRemaining.toFixed(1)}s / {phaseDuration.toFixed(1)}s
        </span>
      </div>
    </div>
  );
}
