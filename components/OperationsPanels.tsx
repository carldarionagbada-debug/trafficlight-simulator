'use client';

import React, { useState } from 'react';
import {
  Direction,
  PedestrianAgent,
  PhaseId,
  TurnIntent,
  Vehicle,
  VehicleType,
} from '@/types/simulation';
import { PHASE_DEFINITIONS } from '@/lib/simulation-data';
import {
  Car,
  Zap,
  Trash2,
  Siren,
  Footprints,
  CornerUpLeft,
  Layers,
  Radio,
  Users,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpLeft,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

interface OperationsPanelsProps {
  mode?: 'GRID' | 'SIDEBAR';
  vehicles: Vehicle[];
  pedestrians: PedestrianAgent[];
  currentPhase: PhaseId;
  pedestrianRequestedNS: boolean;
  pedestrianRequestedEW: boolean;
  emergencyActive: Direction | null;
  onSpawnVehicle: (
    direction: Direction,
    forcedType?: VehicleType,
    forcedTurn?: TurnIntent
  ) => void;
  onSpawnWave: (countPerApproach?: number, forcedTurn?: TurnIntent) => void;
  onClearVehicles: () => void;
  onSpawnEmergency: (direction: Direction) => void;
  onClearEmergency: () => void;
  onSpawnPedestrian: (
    crosswalk: 'N' | 'S' | 'E' | 'W',
    count?: number,
    forceWalkNow?: boolean
  ) => void;
  onRequestPedestrianPhase: (axis: 'NS' | 'EW', immediateOverride: boolean) => void;
  onClearPedestrians: () => void;
}

export default function OperationsPanels({
  mode = 'SIDEBAR',
  vehicles,
  pedestrians,
  currentPhase,
  pedestrianRequestedNS,
  pedestrianRequestedEW,
  emergencyActive,
  onSpawnVehicle,
  onSpawnWave,
  onClearVehicles,
  onSpawnEmergency,
  onClearEmergency,
  onSpawnPedestrian,
  onRequestPedestrianPhase,
  onClearPedestrians,
}: OperationsPanelsProps) {
  const [deckTab, setDeckTab] = useState<'VEHICLES' | 'EMERGENCY' | 'PEDESTRIANS' | 'ALL'>('VEHICLES');
  const [selectedVehicleType, setSelectedVehicleType] = useState<VehicleType>('SEDAN');
  const [selectedTurnIntent, setSelectedTurnIntent] = useState<'AUTO' | TurnIntent>('AUTO');
  const [immediatePedOverride, setImmediatePedOverride] = useState<boolean>(true);

  const phaseMeta = PHASE_DEFINITIONS[currentPhase];
  const emergencyUnits = vehicles.filter((v) => v.type === 'EMERGENCY');

  // Count vehicles by type
  const sedanCount = vehicles.filter((v) => v.type === 'SEDAN').length;
  const suvCount = vehicles.filter((v) => v.type === 'SUV').length;
  const taxiCount = vehicles.filter((v) => v.type === 'TAXI').length;
  const busCount = vehicles.filter((v) => v.type === 'TRANSIT_BUS').length;

  // Count vehicles by direction
  const northVehicles = vehicles.filter((v) => v.direction === 'N').length;
  const southVehicles = vehicles.filter((v) => v.direction === 'S').length;
  const eastVehicles = vehicles.filter((v) => v.direction === 'E').length;
  const westVehicles = vehicles.filter((v) => v.direction === 'W').length;

  // Count pedestrians by state and crosswalk
  const waitingPeds = pedestrians.filter((p) => p.progress <= 0.05).length;
  const crossingPeds = pedestrians.filter((p) => p.progress > 0.05).length;
  const nsWalkPeds = pedestrians.filter((p) => p.crosswalk === 'W' || p.crosswalk === 'E').length;
  const ewWalkPeds = pedestrians.filter((p) => p.crosswalk === 'N' || p.crosswalk === 'S').length;

  const handleDirectionalVehicleSpawn = (dir: Direction) => {
    const turnArg = selectedTurnIntent === 'AUTO' ? undefined : selectedTurnIntent;
    onSpawnVehicle(dir, selectedVehicleType, turnArg);
  };

  /* ========================================================================= */
  /* PANEL 1: VEHICLE SPAWN & WAVE GENERATOR                                   */
  /* ========================================================================= */
  const renderVehiclePanel = (compact = false) => (
    <section
      className={`flex flex-col bg-slate-900/45 backdrop-blur-3xl text-[#f5f5f7] border border-white/20 shadow-[0_24px_60px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.28)] rounded-2xl sm:rounded-[26px] overflow-hidden ${
        compact ? 'h-auto' : 'h-full flex-1'
      }`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-3.5 sm:px-5 py-3.5 bg-white/[0.04] border-b border-white/[0.1] shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-[200px] flex-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#0A84FF] to-[#0058D0] shadow-[0_4px_16px_rgba(10,132,255,0.45),inset_0_1px_1px_rgba(255,255,255,0.35)] flex items-center justify-center text-white shrink-0">
            <Car className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3
              className="text-sm font-bold tracking-tight text-white leading-tight truncate"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Vehicle Spawn &amp; Wave Generator
            </h3>
            <p className="text-[11px] text-zinc-400 font-normal leading-tight mt-0.5 truncate">
              Roadway traffic injection controls
            </p>
          </div>
        </div>
        <span className="h-6 px-2.5 inline-flex items-center rounded-full bg-[#0A84FF]/15 border border-[#64D2FF]/35 text-[11px] font-mono tabular-nums text-[#64D2FF] font-semibold leading-none shrink-0">
          {vehicles.length} Active
        </span>
      </div>

      {/* Main Content Body */}
      <div className="p-3.5 sm:p-5 flex-1 flex flex-col gap-3.5 text-xs overflow-y-auto">
        {/* 1. Vehicle Class Selector */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">
              1. Vehicle Class
            </span>
            <span className="text-[11px] font-mono text-zinc-400 hidden sm:inline">
              Select chassis to spawn
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { id: 'SEDAN', label: 'Sedan', spec: 'Standard', count: sedanCount },
                { id: 'SUV', label: 'SUV', spec: 'Midsize', count: suvCount },
                { id: 'TAXI', label: 'City Taxi', spec: 'Express', count: taxiCount },
                { id: 'TRANSIT_BUS', label: 'Transit Bus', spec: 'Heavy', count: busCount },
              ] as { id: VehicleType; label: string; spec: string; count: number }[]
            ).map((item) => {
              const isSelected = selectedVehicleType === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedVehicleType(item.id)}
                  className={`h-[54px] flex items-center justify-between gap-1.5 px-2.5 sm:px-3.5 rounded-xl border transition-all active:scale-[0.98] cursor-pointer min-w-0 ${
                    isSelected
                      ? 'bg-gradient-to-b from-[#0A84FF]/30 to-[#0A84FF]/15 text-white border-[#64D2FF]/60 shadow-[0_6px_18px_rgba(10,132,255,0.22),inset_0_1px_1px_rgba(255,255,255,0.3)]'
                      : 'bg-white/[0.05] text-zinc-300 border-white/[0.1] hover:bg-white/[0.11] hover:border-white/25 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 text-left min-w-0">
                    <Car
                      className={`w-4 h-4 shrink-0 ${
                        isSelected ? 'text-[#64D2FF]' : 'text-zinc-400'
                      }`}
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold leading-none truncate">{item.label}</div>
                      <div
                        className={`text-[10px] leading-none mt-1 truncate ${
                          isSelected ? 'text-[#93C5FD]' : 'text-zinc-500'
                        }`}
                      >
                        {item.spec}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`font-mono text-xs tabular-nums px-1.5 sm:px-2 py-0.5 rounded-full leading-none border shrink-0 ${
                      isSelected
                        ? 'bg-[#64D2FF]/20 border-[#64D2FF]/40 text-white font-bold'
                        : 'bg-white/[0.06] border-white/10 text-zinc-300'
                    }`}
                  >
                    {item.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Turning Maneuver */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">
              2. Turning Maneuver
            </span>
            <span className="text-[11px] font-mono text-zinc-400 hidden sm:inline">
              Approach lane intent
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-black/45 backdrop-blur-md p-1.5 rounded-xl border border-white/[0.1]">
            {(
              [
                { id: 'AUTO', label: 'Auto', icon: <Sparkles className="w-3 h-3 shrink-0" /> },
                { id: 'STRAIGHT', label: 'Straight', icon: <ArrowUp className="w-3 h-3 shrink-0" /> },
                { id: 'LEFT', label: 'Left', icon: <ArrowUpLeft className="w-3 h-3 shrink-0" /> },
                { id: 'RIGHT', label: 'Right', icon: <ArrowUpRight className="w-3 h-3 shrink-0" /> },
              ] as { id: 'AUTO' | TurnIntent; label: string; icon: React.ReactNode }[]
            ).map((turn) => {
              const isSelected = selectedTurnIntent === turn.id;
              return (
                <button
                  key={turn.id}
                  type="button"
                  onClick={() => setSelectedTurnIntent(turn.id)}
                  className={`h-10 sm:h-9 inline-flex items-center justify-center gap-1 px-2 text-[11px] font-semibold rounded-lg transition-all whitespace-nowrap cursor-pointer leading-none ${
                    isSelected
                      ? 'bg-[#0A84FF]/30 text-white border border-[#64D2FF]/50 shadow-[0_2px_10px_rgba(10,132,255,0.25),inset_0_1px_0_rgba(255,255,255,0.25)] font-bold'
                      : 'text-zinc-400 border border-transparent hover:text-white hover:bg-white/[0.06]'
                  }`}
                >
                  {turn.icon}
                  <span>{turn.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Inject on Approach */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">
              3. Inject on Approach
            </span>
            <span className="text-[11px] font-mono text-zinc-400 hidden sm:inline">
              Tap to dispatch
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { dir: 'N', short: 'North (N)', label: 'Northbound (N)', icon: <ArrowUp className="w-3.5 h-3.5" /> },
                { dir: 'S', short: 'South (S)', label: 'Southbound (S)', icon: <ArrowDown className="w-3.5 h-3.5" /> },
                { dir: 'E', short: 'East (E)', label: 'Eastbound (E)', icon: <ArrowRight className="w-3.5 h-3.5" /> },
                { dir: 'W', short: 'West (W)', label: 'Westbound (W)', icon: <ArrowLeft className="w-3.5 h-3.5" /> },
              ] as { dir: Direction; short: string; label: string; icon: React.ReactNode }[]
            ).map((btn) => (
              <button
                key={btn.dir}
                type="button"
                onClick={() => handleDirectionalVehicleSpawn(btn.dir)}
                className="h-12 flex items-center justify-between gap-1.5 px-2.5 sm:px-3.5 text-[11px] sm:text-xs font-bold text-white bg-white/[0.07] hover:bg-[#0A84FF]/25 border border-white/15 hover:border-[#64D2FF]/55 rounded-xl transition-all active:scale-[0.98] cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] group min-w-0"
              >
                <span className="leading-none truncate sm:hidden">+ {btn.short}</span>
                <span className="leading-none truncate hidden sm:inline">+ {btn.label}</span>
                <span className="w-6 h-6 rounded-lg bg-white/[0.08] group-hover:bg-[#0A84FF]/30 text-zinc-300 group-hover:text-[#64D2FF] flex items-center justify-center transition-colors shrink-0">
                  {btn.icon}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Live Directional Traffic Distribution Box (Fills remaining height cleanly with zero dead gap) */}
        <div className="flex-1 flex flex-col justify-between p-3.5 sm:p-4 bg-black/40 backdrop-blur-md border border-white/15 rounded-2xl text-[11px] font-mono shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <div className="flex items-center justify-between gap-2 mb-3 font-sans">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">
              Roadway Vehicles by Approach
            </span>
            <span className="text-[#64D2FF] font-mono tabular-nums font-bold shrink-0">
              {vehicles.length} total
            </span>
          </div>
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            {[
              { label: 'North', count: northVehicles },
              { label: 'South', count: southVehicles },
              { label: 'East', count: eastVehicles },
              { label: 'West', count: westVehicles },
            ].map((item) => {
              const share =
                vehicles.length > 0
                  ? Math.round((item.count / vehicles.length) * 100)
                  : 0;
              const barPct =
                vehicles.length > 0
                  ? Math.min(100, Math.round((item.count / Math.max(vehicles.length, 4)) * 100))
                  : 0;
              return (
                <div
                  key={item.label}
                  className="h-full min-h-[82px] p-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] flex flex-col items-center justify-center"
                >
                  <div className="text-zinc-400 text-[10px] font-sans font-medium leading-none">
                    {item.label}
                  </div>
                  <div className="text-white font-bold text-xl tabular-nums mt-2 leading-none">
                    {item.count}
                  </div>
                  <div className="text-[10px] text-[#64D2FF]/80 tabular-nums mt-1.5 leading-none">
                    {share}% share
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/[0.07] mt-2.5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#0A84FF] transition-all duration-300"
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom Actions Toolbar */}
      <div className="px-4 sm:px-5 py-3.5 bg-black/45 backdrop-blur-md border-t border-white/[0.1] flex flex-col gap-2 shrink-0">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onSpawnWave(2)}
            className="h-10 inline-flex items-center justify-center gap-1.5 px-3 text-xs font-bold text-white bg-gradient-to-b from-[#FF9F0A]/25 to-[#FF9F0A]/10 hover:from-[#FF9F0A]/40 hover:to-[#FF9F0A]/20 border border-[#FF9F0A]/45 rounded-xl transition-all active:scale-[0.98] cursor-pointer shadow-[0_4px_14px_rgba(255,159,10,0.18),inset_0_1px_0_rgba(255,255,255,0.2)] leading-none"
          >
            <Zap className="w-3.5 h-3.5 text-[#FFD60A] shrink-0" />
            <span>Rush Wave (+8)</span>
          </button>

          <button
            type="button"
            onClick={() => onSpawnWave(1, 'LEFT')}
            className="h-10 inline-flex items-center justify-center gap-1.5 px-3 text-xs font-bold text-white bg-gradient-to-b from-[#0A84FF]/25 to-[#0A84FF]/10 hover:from-[#0A84FF]/40 hover:to-[#0A84FF]/20 border border-[#64D2FF]/45 rounded-xl transition-all active:scale-[0.98] cursor-pointer shadow-[0_4px_14px_rgba(10,132,255,0.18),inset_0_1px_0_rgba(255,255,255,0.2)] leading-none"
          >
            <CornerUpLeft className="w-3.5 h-3.5 text-[#64D2FF] shrink-0" />
            <span>Left Wave (+4)</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onClearVehicles}
          className="h-9 inline-flex items-center justify-center gap-1.5 w-full px-3 text-xs font-semibold text-zinc-300 hover:text-white bg-white/[0.05] hover:bg-white/[0.11] border border-white/[0.1] rounded-xl transition-all active:scale-[0.99] cursor-pointer leading-none"
        >
          <Trash2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span>Clear Queued Vehicles</span>
        </button>
      </div>
    </section>
  );

  /* ========================================================================= */
  /* PANEL 2: EMERGENCY PRIORITY & PREEMPTION                                  */
  /* ========================================================================= */
  const renderEmergencyPanel = (compact = false) => (
    <section
      className={`flex flex-col bg-slate-900/45 backdrop-blur-3xl text-[#f5f5f7] border border-white/20 shadow-[0_24px_60px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.28)] rounded-2xl sm:rounded-[26px] overflow-hidden ${
        compact ? 'h-auto' : 'h-full flex-1'
      }`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-3.5 sm:px-5 py-3.5 bg-white/[0.04] border-b border-white/[0.1] shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-[200px] flex-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF453A] to-[#D70015] shadow-[0_4px_16px_rgba(255,69,58,0.45),inset_0_1px_1px_rgba(255,255,255,0.35)] flex items-center justify-center text-white shrink-0">
            <Siren className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3
              className="text-sm font-bold tracking-tight text-white leading-tight truncate"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Emergency Priority &amp; Preemption
            </h3>
            <p className="text-[11px] text-zinc-400 font-normal leading-tight mt-0.5 truncate">
              Opticom siren preemption &amp; green corridor
            </p>
          </div>
        </div>
        <span
          className={`h-6 px-2.5 inline-flex items-center rounded-full text-[11px] font-mono font-bold border leading-none shrink-0 ${
            emergencyUnits.length > 0
              ? 'bg-[#FF453A]/25 text-[#FF6961] border-[#FF453A]/60 shadow-[0_0_14px_rgba(255,69,58,0.4)]'
              : 'bg-white/[0.08] text-zinc-300 border-white/15'
          }`}
        >
          {emergencyUnits.length > 0
            ? `${emergencyUnits.length} UNIT ACTIVE`
            : 'STANDBY'}
        </span>
      </div>

      {/* Main Content Body */}
      <div className="p-3.5 sm:p-5 flex-1 flex flex-col gap-3.5 text-xs overflow-y-auto">
        {/* Opticom Receiver Status Card */}
        <div className="p-3.5 bg-black/45 backdrop-blur-md border border-white/15 rounded-2xl shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 text-white font-bold text-xs leading-none">
              <Radio className="w-3.5 h-3.5 text-[#FF453A] shrink-0" />
              <span>Opticom Preempt Receiver</span>
            </div>
            <span
              className={`font-mono text-[10px] px-2.5 py-1 rounded-full font-bold leading-none shrink-0 ${
                emergencyActive
                  ? 'bg-[#FF453A]/25 text-[#FF6961] border border-[#FF453A]/55 animate-pulse'
                  : 'bg-white/[0.08] text-zinc-300 border border-white/15'
              }`}
            >
              {emergencyActive
                ? `LOCKED (${emergencyActive} CORRIDOR)`
                : 'NOMINAL SCAN'}
            </span>
          </div>
          <p className="text-[11px] text-zinc-300 leading-relaxed">
            Dispatching injects a high-speed emergency unit and overrides the PLC state machine to hold a clear green corridor.
          </p>
        </div>

        {/* 4 Directional Emergency Dispatch Buttons */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">
              Dispatch Siren Unit &amp; Preempt
            </span>
            <span className="text-[11px] font-mono text-zinc-400 hidden sm:inline">
              Immediate priority
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { dir: 'N', label: 'North (N)', fullLabel: 'North (N) Bound', desc: 'Northbound corridor' },
                { dir: 'S', label: 'South (S)', fullLabel: 'South (S) Bound', desc: 'Southbound corridor' },
                { dir: 'E', label: 'East (E)', fullLabel: 'East (E) Bound', desc: 'Eastbound corridor' },
                { dir: 'W', label: 'West (W)', fullLabel: 'West (W) Bound', desc: 'Westbound corridor' },
              ] as { dir: Direction; label: string; fullLabel: string; desc: string }[]
            ).map((btn) => {
              const isActiveDir = emergencyActive === btn.dir;
              return (
                <button
                  key={btn.dir}
                  type="button"
                  onClick={() => onSpawnEmergency(btn.dir)}
                  className={`flex flex-col gap-1.5 p-3 sm:p-3.5 text-left rounded-xl border transition-all active:scale-[0.98] cursor-pointer min-w-0 ${
                    isActiveDir
                      ? 'bg-gradient-to-b from-[#FF453A]/35 to-[#FF453A]/15 text-white border-[#FF453A]/70 shadow-[0_6px_20px_rgba(255,69,58,0.28),inset_0_1px_1px_rgba(255,255,255,0.3)]'
                      : 'bg-white/[0.06] hover:bg-[#FF453A]/20 hover:border-[#FF453A]/50 text-white border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5 w-full">
                    <span className="font-bold text-xs leading-tight truncate sm:hidden">
                      {btn.label}
                    </span>
                    <span className="font-bold text-xs leading-tight truncate hidden sm:inline">
                      Dispatch {btn.fullLabel}
                    </span>
                    <Siren
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isActiveDir ? 'text-white' : 'text-[#FF453A]'
                      }`}
                    />
                  </div>
                  <span className="text-[10px] leading-tight text-zinc-400 truncate w-full">
                    {btn.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Emergency Units Telemetry List (Expands cleanly to fill lower space) */}
        <div className="flex-1 flex flex-col p-3.5 sm:p-4 bg-black/40 backdrop-blur-md border border-white/15 rounded-2xl font-mono text-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <div className="flex items-center justify-between gap-2 mb-2.5 font-sans">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">
              Active Roadway Siren Units
            </span>
            <span className="font-mono text-[#FF6961] tabular-nums font-bold shrink-0">
              {emergencyUnits.length} deployed
            </span>
          </div>
          {emergencyUnits.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-[11px] text-zinc-400 font-sans py-4 px-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-center">
              Roadway clear. Select an approach above to trigger emergency preemption.
            </div>
          ) : (
            <div className="space-y-1.5">
              {emergencyUnits.map((unit) => (
                <div
                  key={unit.id}
                  className="flex flex-wrap items-center justify-between gap-1.5 p-2.5 rounded-xl bg-[#FF453A]/10 border border-[#FF453A]/30 text-[11px] text-zinc-100"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#FF453A] animate-ping shrink-0" />
                    <span className="font-bold text-white">
                      Unit #{unit.id.slice(-4)} ({unit.direction} Bound)
                    </span>
                  </div>
                  <span className="text-[#64D2FF] font-semibold">
                    {Math.round(unit.speed * 0.45)} km/h · {Math.round(unit.position)}m
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Actions Toolbar */}
      <div className="px-4 sm:px-5 py-3.5 bg-black/45 backdrop-blur-md border-t border-white/[0.1] flex flex-col gap-2 shrink-0">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              onSpawnEmergency('N');
              onSpawnEmergency('S');
            }}
            className="h-10 inline-flex items-center justify-center gap-1.5 px-3 text-xs font-bold text-white bg-gradient-to-b from-[#FF453A]/25 to-[#FF453A]/10 hover:from-[#FF453A]/40 hover:to-[#FF453A]/20 border border-[#FF453A]/45 rounded-xl transition-all active:scale-[0.98] cursor-pointer shadow-[0_4px_14px_rgba(255,69,58,0.16),inset_0_1px_0_rgba(255,255,255,0.2)] leading-none"
          >
            <Siren className="w-3.5 h-3.5 text-[#FF6961] shrink-0" />
            <span>N–S Convoy (+2)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onSpawnEmergency('E');
              onSpawnEmergency('W');
            }}
            className="h-10 inline-flex items-center justify-center gap-1.5 px-3 text-xs font-bold text-white bg-gradient-to-b from-[#FF453A]/25 to-[#FF453A]/10 hover:from-[#FF453A]/40 hover:to-[#FF453A]/20 border border-[#FF453A]/45 rounded-xl transition-all active:scale-[0.98] cursor-pointer shadow-[0_4px_14px_rgba(255,69,58,0.16),inset_0_1px_0_rgba(255,255,255,0.2)] leading-none"
          >
            <Siren className="w-3.5 h-3.5 text-[#FF6961] shrink-0" />
            <span>E–W Convoy (+2)</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onClearEmergency}
          className="h-9 inline-flex items-center justify-center gap-1.5 w-full px-3 text-xs font-semibold text-zinc-300 hover:text-white bg-white/[0.05] hover:bg-white/[0.11] border border-white/[0.1] rounded-xl transition-all active:scale-[0.99] cursor-pointer leading-none"
        >
          <Trash2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span>Clear Emergency Units</span>
        </button>
      </div>
    </section>
  );

  /* ========================================================================= */
  /* PANEL 3: PEDESTRIAN CROSSWALK CONTROLLER (WALK)                           */
  /* ========================================================================= */
  const renderPedestrianPanel = (compact = false) => (
    <section
      className={`flex flex-col bg-slate-900/45 backdrop-blur-3xl text-[#f5f5f7] border border-white/20 shadow-[0_24px_60px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.28)] rounded-2xl sm:rounded-[26px] overflow-hidden ${
        compact ? 'h-auto' : 'h-full flex-1'
      }`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 px-3.5 sm:px-5 py-3.5 bg-white/[0.04] border-b border-white/[0.1] shrink-0">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-[200px] flex-1">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#30D158] to-[#1E8A38] shadow-[0_4px_16px_rgba(48,209,88,0.45),inset_0_1px_1px_rgba(255,255,255,0.35)] flex items-center justify-center text-white shrink-0">
            <Footprints className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3
              className="text-sm font-bold tracking-tight text-white leading-tight truncate"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Pedestrian Crosswalk Controller
            </h3>
            <p className="text-[11px] text-zinc-400 font-normal leading-tight mt-0.5 truncate">
              Pushbutton calls &amp; crosswalk actuation
            </p>
          </div>
        </div>
        <span className="h-6 px-2.5 inline-flex items-center rounded-full bg-[#30D158]/15 border border-[#30D158]/35 text-[11px] font-mono tabular-nums text-[#30D158] font-semibold leading-none shrink-0">
          {crossingPeds} Walking · {waitingPeds} Curb
        </span>
      </div>

      {/* Main Content Body */}
      <div className="p-3.5 sm:p-5 flex-1 flex flex-col gap-3.5 text-xs overflow-y-auto">
        {/* Pushbutton Mode Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-black/45 backdrop-blur-md p-3 sm:p-2.5 sm:pl-3.5 rounded-2xl border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <div>
            <span className="text-white font-bold text-xs leading-none">
              Walk Signal Mode
            </span>
            <div className="text-[10px] text-zinc-400 mt-1">
              Pushbutton override policy
            </div>
          </div>
          <div className="grid grid-cols-2 sm:flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-white/10 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setImmediatePedOverride(true)}
              className={`h-8 sm:h-7 px-3 inline-flex items-center justify-center text-[11px] font-bold rounded-lg transition-all cursor-pointer leading-none whitespace-nowrap ${
                immediatePedOverride
                  ? 'bg-[#30D158]/25 text-white border border-[#30D158]/55 shadow-[0_2px_10px_rgba(48,209,88,0.2)]'
                  : 'text-zinc-400 border border-transparent hover:text-white'
              }`}
            >
              Walk Now
            </button>
            <button
              type="button"
              onClick={() => setImmediatePedOverride(false)}
              className={`h-8 sm:h-7 px-3 inline-flex items-center justify-center text-[11px] font-bold rounded-lg transition-all cursor-pointer leading-none whitespace-nowrap ${
                !immediatePedOverride
                  ? 'bg-[#0A84FF]/30 text-white border border-[#64D2FF]/55 shadow-[0_2px_10px_rgba(10,132,255,0.2)]'
                  : 'text-zinc-400 border border-transparent hover:text-white'
              }`}
            >
              Queue Call
            </button>
          </div>
        </div>

        {/* 4 Dedicated Crosswalk Spawners with Live Signal Aspects */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">
              Spawn Pedestrians on Crosswalk
            </span>
            <span className="text-[11px] font-mono text-zinc-400 hidden sm:inline">
              Live signal aspect
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(
              [
                {
                  cw: 'W',
                  label: 'West Crosswalk (N–S)',
                  walk: phaseMeta.pedNS === 'WALK',
                },
                {
                  cw: 'E',
                  label: 'East Crosswalk (N–S)',
                  walk: phaseMeta.pedNS === 'WALK',
                },
                {
                  cw: 'N',
                  label: 'North Crosswalk (E–W)',
                  walk: phaseMeta.pedEW === 'WALK',
                },
                {
                  cw: 'S',
                  label: 'South Crosswalk (E–W)',
                  walk: phaseMeta.pedEW === 'WALK',
                },
              ] as {
                cw: 'N' | 'S' | 'E' | 'W';
                label: string;
                walk: boolean;
              }[]
            ).map((btn) => (
              <button
                key={btn.cw}
                type="button"
                onClick={() =>
                  onSpawnPedestrian(btn.cw, 1, immediatePedOverride)
                }
                className={`flex items-center justify-between gap-2 p-3 text-xs font-semibold rounded-xl border transition-all active:scale-[0.98] cursor-pointer min-w-0 ${
                  btn.walk
                    ? 'bg-[#30D158]/10 border-[#30D158]/35 hover:bg-[#30D158]/20 text-white'
                    : 'bg-white/[0.06] border-white/15 hover:bg-white/[0.12] hover:border-white/30 text-white'
                }`}
              >
                <div className="text-left min-w-0">
                  <div className="font-bold text-xs leading-snug truncate">
                    + {btn.label}
                  </div>
                  <span
                    className={`text-[10px] font-mono uppercase mt-1 inline-block leading-none ${
                      btn.walk ? 'text-[#30D158] font-bold' : 'text-zinc-400'
                    }`}
                  >
                    {btn.walk ? 'WALK ACTIVE' : 'DON’T WALK'}
                  </span>
                </div>
                <span
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    btn.walk
                      ? 'bg-[#30D158] shadow-[0_0_8px_#30D158]'
                      : 'bg-[#FF453A]/80'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Crosswalk Pushbutton Call Triggers */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">
              Simulate Pushbutton Sensor Call
            </span>
            <span className="text-[11px] font-mono text-zinc-400 hidden sm:inline">
              Demand actuated
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() =>
                onRequestPedestrianPhase('NS', immediatePedOverride)
              }
              className={`h-11 flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 text-xs font-bold rounded-xl border transition-all active:scale-[0.98] cursor-pointer leading-none whitespace-nowrap ${
                pedestrianRequestedNS
                  ? 'bg-[#30D158]/25 text-white border-[#30D158]/60 shadow-[0_4px_14px_rgba(48,209,88,0.22)]'
                  : 'bg-white/[0.07] hover:bg-[#30D158]/20 hover:border-[#30D158]/50 text-white border-white/15'
              }`}
            >
              <Footprints className="w-4 h-4 text-[#30D158] shrink-0" />
              <span>Call N–S Walk</span>
            </button>

            <button
              type="button"
              onClick={() =>
                onRequestPedestrianPhase('EW', immediatePedOverride)
              }
              className={`h-11 flex items-center justify-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 text-xs font-bold rounded-xl border transition-all active:scale-[0.98] cursor-pointer leading-none whitespace-nowrap ${
                pedestrianRequestedEW
                  ? 'bg-[#30D158]/25 text-white border-[#30D158]/60 shadow-[0_4px_14px_rgba(48,209,88,0.22)]'
                  : 'bg-white/[0.07] hover:bg-[#30D158]/20 hover:border-[#30D158]/50 text-white border-white/15'
              }`}
            >
              <Footprints className="w-4 h-4 text-[#30D158] shrink-0" />
              <span>Call E–W Walk</span>
            </button>
          </div>
        </div>

        {/* Live Crosswalk Axis Occupancy Summary (Expands cleanly to fill lower space) */}
        <div className="flex-1 flex flex-col justify-between p-3.5 sm:p-4 bg-black/40 backdrop-blur-md border border-white/15 rounded-2xl text-[11px] font-mono">
          <div className="flex items-center justify-between gap-2 mb-2.5 font-sans">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">
              Crosswalk Corridor Occupancy
            </span>
            <span className="text-[#30D158] font-mono tabular-nums font-bold shrink-0">
              {pedestrians.length} active
            </span>
          </div>
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] flex flex-col justify-center gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-zinc-400 font-sans">N–S Crosswalks</span>
                <span className="text-white font-bold tabular-nums text-sm">{nsWalkPeds} peds</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#30D158] transition-all duration-300"
                  style={{ width: `${pedestrians.length > 0 ? Math.min(100, (nsWalkPeds / Math.max(pedestrians.length, 2)) * 100) : 0}%` }}
                />
              </div>
            </div>
            <div className="p-3 rounded-xl bg-white/[0.04] border border-white/[0.08] flex flex-col justify-center gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-zinc-400 font-sans">E–W Crosswalks</span>
                <span className="text-white font-bold tabular-nums text-sm">{ewWalkPeds} peds</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-white/[0.07] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#30D158] transition-all duration-300"
                  style={{ width: `${pedestrians.length > 0 ? Math.min(100, (ewWalkPeds / Math.max(pedestrians.length, 2)) * 100) : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Actions Toolbar */}
      <div className="px-4 sm:px-5 py-3.5 bg-black/45 backdrop-blur-md border-t border-white/[0.1] flex flex-col gap-2 shrink-0">
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onSpawnPedestrian('W', 2, immediatePedOverride)}
            className="h-10 inline-flex items-center justify-center gap-1.5 px-3 text-xs font-bold text-white bg-gradient-to-b from-[#30D158]/20 to-[#30D158]/10 hover:from-[#30D158]/35 hover:to-[#30D158]/18 border border-[#30D158]/40 rounded-xl transition-all active:scale-[0.98] cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] leading-none"
          >
            <Users className="w-3.5 h-3.5 text-[#30D158] shrink-0" />
            <span>Group N–S (+2)</span>
          </button>
          <button
            type="button"
            onClick={() => onSpawnPedestrian('N', 2, immediatePedOverride)}
            className="h-10 inline-flex items-center justify-center gap-1.5 px-3 text-xs font-bold text-white bg-gradient-to-b from-[#30D158]/20 to-[#30D158]/10 hover:from-[#30D158]/35 hover:to-[#30D158]/18 border border-[#30D158]/40 rounded-xl transition-all active:scale-[0.98] cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] leading-none"
          >
            <Users className="w-3.5 h-3.5 text-[#30D158] shrink-0" />
            <span>Group E–W (+2)</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onClearPedestrians}
          className="h-9 inline-flex items-center justify-center gap-1.5 w-full px-3 text-xs font-semibold text-zinc-300 hover:text-white bg-white/[0.05] hover:bg-white/[0.11] border border-white/[0.1] rounded-xl transition-all active:scale-[0.99] cursor-pointer leading-none"
        >
          <Trash2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
          <span>Clear Crosswalk Pedestrians</span>
        </button>
      </div>
    </section>
  );

  if (mode === 'GRID') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 auto-rows-fr gap-4 lg:gap-5 items-stretch">
        {renderVehiclePanel()}
        {renderEmergencyPanel()}
        {renderPedestrianPanel()}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 h-full min-h-0 flex-1">
      {/* macOS Tahoe Liquid Glass Operations Deck Switcher */}
      <div className="flex flex-col gap-2.5 p-3 bg-slate-900/45 backdrop-blur-3xl border border-white/20 shadow-[0_16px_36px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.25)] rounded-[22px] shrink-0">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-xs font-bold text-white leading-none">
            <Layers className="w-3.5 h-3.5 text-[#64D2FF] shrink-0" />
            <span className="tracking-tight">Operations Deck</span>
          </div>
          <span className="text-[11px] font-mono text-zinc-400 leading-none">
            {deckTab === 'VEHICLES'
              ? 'Vehicle Dispatch'
              : deckTab === 'EMERGENCY'
              ? 'Preemption Control'
              : deckTab === 'PEDESTRIANS'
              ? 'Crosswalk Actuation'
              : 'All Modules'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 bg-black/45 backdrop-blur-md p-1.5 rounded-2xl border border-white/[0.1]">
          <button
            type="button"
            onClick={() => setDeckTab('VEHICLES')}
            className={`h-10 sm:h-8 px-2.5 inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer leading-none ${
              deckTab === 'VEHICLES'
                ? 'bg-[#0A84FF]/30 text-white border border-[#64D2FF]/55 shadow-[0_2px_10px_rgba(10,132,255,0.25),inset_0_1px_0_rgba(255,255,255,0.25)] font-bold'
                : 'text-zinc-300 border border-transparent hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <Car className="w-3.5 h-3.5 shrink-0" />
            <span>Vehicles ({vehicles.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setDeckTab('EMERGENCY')}
            className={`h-10 sm:h-8 px-2.5 inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer leading-none ${
              deckTab === 'EMERGENCY'
                ? 'bg-[#FF453A]/30 text-white border border-[#FF453A]/60 shadow-[0_2px_10px_rgba(255,69,58,0.25),inset_0_1px_0_rgba(255,255,255,0.25)] font-bold'
                : emergencyUnits.length > 0
                ? 'text-[#FF6961] border border-[#FF453A]/30 bg-[#FF453A]/10 font-bold'
                : 'text-zinc-300 border border-transparent hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <Siren className="w-3.5 h-3.5 shrink-0" />
            <span>{emergencyUnits.length > 0 ? 'Siren (ON)' : 'Emergency'}</span>
          </button>

          <button
            type="button"
            onClick={() => setDeckTab('PEDESTRIANS')}
            className={`h-10 sm:h-8 px-2.5 inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer leading-none ${
              deckTab === 'PEDESTRIANS'
                ? 'bg-[#30D158]/25 text-white border border-[#30D158]/55 shadow-[0_2px_10px_rgba(48,209,88,0.22),inset_0_1px_0_rgba(255,255,255,0.25)] font-bold'
                : 'text-zinc-300 border border-transparent hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <Footprints className="w-3.5 h-3.5 shrink-0" />
            <span>Walk ({pedestrians.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setDeckTab('ALL')}
            className={`h-10 sm:h-8 px-2.5 inline-flex items-center justify-center gap-1.5 text-[11px] font-semibold rounded-xl transition-all whitespace-nowrap cursor-pointer leading-none ${
              deckTab === 'ALL'
                ? 'bg-[#0A84FF]/30 text-white border border-[#64D2FF]/55 shadow-[0_2px_10px_rgba(10,132,255,0.25),inset_0_1px_0_rgba(255,255,255,0.25)] font-bold'
                : 'text-zinc-300 border border-transparent hover:text-white hover:bg-white/[0.06]'
            }`}
          >
            <Layers className="w-3.5 h-3.5 shrink-0" />
            <span>All 3</span>
          </button>
        </div>
      </div>

      {/* Active Operation Panel */}
      <div className="flex-1 min-h-0 flex flex-col">
        {deckTab === 'VEHICLES' && renderVehiclePanel(false)}
        {deckTab === 'EMERGENCY' && renderEmergencyPanel(false)}
        {deckTab === 'PEDESTRIANS' && renderPedestrianPanel(false)}
        {deckTab === 'ALL' && (
          <div className="space-y-4 max-h-[700px] overflow-y-auto pr-1.5 scrollbar-thin">
            {renderVehiclePanel(true)}
            {renderEmergencyPanel(true)}
            {renderPedestrianPanel(true)}
          </div>
        )}
      </div>
    </div>
  );
}
