'use client';

import React, { useState } from 'react';
import {
  ApproachTelemetry,
  ControlMode,
  Direction,
  PhaseId,
  PhaseLogEntry,
  PhaseTimingConfig,
} from '@/types/simulation';
import {
  DEFAULT_TIMINGS,
  PHASE_DEFINITIONS,
  PHASE_ORDER,
  getPhaseDuration,
} from '@/lib/simulation-data';
import {
  Sliders,
  Activity,
  Cpu,
  Plus,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Octagon,
  Layers,
} from 'lucide-react';

export type ControlDeckTab =
  | 'TIMING'
  | 'SENSORS'
  | 'TRUTH_TABLE';

interface ControlPanelsProps {
  mode?: 'SIDEBAR' | 'BOTTOM_PAIR';
  currentPhase: PhaseId;
  controlMode: ControlMode;
  protectedLeftEnabled: boolean;
  mmuFaultLockout: boolean;
  timings: PhaseTimingConfig;
  spawnRatePerMin: number;
  approaches: Record<Direction, ApproachTelemetry>;
  totalCleared: number;
  activeVehicleCount: number;
  phaseLogs: PhaseLogEntry[];
  isFocusMode?: boolean;
  onUpdateTimings: (newTimings: PhaseTimingConfig) => void;
  onUpdateSpawnRate: (rate: number) => void;
  onSelectPhase: (phase: PhaseId, reason: string) => void;
  onSpawnVehicle: (direction: Direction) => void;
}

export default function ControlPanels({
  mode = 'SIDEBAR',
  currentPhase,
  controlMode,
  protectedLeftEnabled,
  mmuFaultLockout,
  timings,
  spawnRatePerMin,
  approaches,
  totalCleared,
  activeVehicleCount,
  phaseLogs,
  onUpdateTimings,
  onUpdateSpawnRate,
  onSelectPhase,
  onSpawnVehicle,
}: ControlPanelsProps) {
  const [deckTab, setDeckTab] = useState<ControlDeckTab>('TIMING');

  const totalQueued =
    approaches.N.queueCount +
    approaches.S.queueCount +
    approaches.E.queueCount +
    approaches.W.queueCount;

  const applyPreset = (preset: 'balanced' | 'ns_rush' | 'ew_rush' | 'fast') => {
    switch (preset) {
      case 'balanced':
        onUpdateTimings({ ...DEFAULT_TIMINGS });
        break;
      case 'ns_rush':
        onUpdateTimings({
          nsLeft: 6,
          nsGreen: 16,
          nsYellow: 3,
          allRed1: 1.5,
          ewLeft: 4,
          ewGreen: 7,
          ewYellow: 3,
          allRed2: 1.5,
        });
        break;
      case 'ew_rush':
        onUpdateTimings({
          nsLeft: 4,
          nsGreen: 7,
          nsYellow: 3,
          allRed1: 1.5,
          ewLeft: 6,
          ewGreen: 16,
          ewYellow: 3,
          allRed2: 1.5,
        });
        break;
      case 'fast':
        onUpdateTimings({
          nsLeft: 3.5,
          nsGreen: 5.5,
          nsYellow: 2,
          allRed1: 1,
          ewLeft: 3.5,
          ewGreen: 5.5,
          ewYellow: 2,
          allRed2: 1,
        });
        break;
    }
  };

  const deckTabs: { id: ControlDeckTab; label: string }[] = [
    { id: 'TIMING', label: 'Phase & Timing' },
    { id: 'SENSORS', label: 'Sensors & Queues' },
    { id: 'TRUTH_TABLE', label: 'PLC Truth Table' },
  ];

  const renderTimingPanel = (flexGrow = true) => (
    <section
      id="timing"
      className={`scroll-mt-20 sm:scroll-mt-24 bg-slate-900/40 backdrop-blur-3xl text-[#f5f5f7] border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.25)] rounded-2xl sm:rounded-[26px] overflow-hidden grid grid-rows-[auto_1fr] h-full ${
        flexGrow ? 'flex-1' : ''
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-4 bg-white/[0.04] border-b border-white/[0.1]">
        <div className="flex items-center gap-3 min-w-[200px] flex-1">
          {/* macOS Tahoe Squircle: Timing */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#5E5CE6] to-[#3634A3] shadow-[0_4px_14px_rgba(94,92,230,0.4)] flex items-center justify-center text-white shrink-0">
            <Sliders className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2
              className="text-sm sm:text-base font-bold tracking-tight text-white leading-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Phase Controller &amp; Timing Parameters
            </h2>
            <p className="text-[11px] text-zinc-400 font-normal leading-tight mt-0.5">NEMA TS2 dual-ring phase clearance timing</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => applyPreset('balanced')}
          className="h-9 sm:h-8 inline-flex items-center gap-1.5 px-3 rounded-full border border-white/20 bg-white/[0.08] text-xs font-semibold text-white hover:bg-white hover:text-black transition-all whitespace-nowrap shrink-0 cursor-pointer shadow-2xs leading-none"
        >
          <RotateCcw className="w-3 h-3 shrink-0" />
          <span>Reset Defaults</span>
        </button>
      </div>

      <div className="p-3.5 sm:p-5 space-y-4 flex-1 flex flex-col overflow-y-auto">
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">Timing Presets</span>
            <span className="text-[11px] font-mono text-zinc-400">NEMA TS2 Standard</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'balanced', label: 'Balanced' },
              { id: 'ns_rush', label: 'N–S Rush' },
              { id: 'ew_rush', label: 'E–W Rush' },
              { id: 'fast', label: 'Fast Cycle' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => applyPreset(p.id as any)}
                className="h-10 sm:h-8 inline-flex items-center justify-center px-2 text-xs font-semibold rounded-xl sm:rounded-full border border-white/15 bg-white/[0.08] hover:bg-white hover:text-black text-white transition-all active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer shadow-2xs leading-none"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sliders Grid in macOS Tahoe Control Center Card */}
        <div className="p-4 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl space-y-3.5">
          {[
            {
              key: 'nsLeft',
              label: 'N–S Left Arrow (S0)',
              val: timings.nsLeft,
              min: 2,
              max: 12,
              step: 0.5,
              disabled: !protectedLeftEnabled,
            },
            {
              key: 'nsGreen',
              label: 'N–S Through Green (S1)',
              val: timings.nsGreen,
              min: 4,
              max: 30,
              step: 1,
            },
            {
              key: 'nsYellow',
              label: 'N–S Yellow Caution (S2)',
              val: timings.nsYellow,
              min: 2,
              max: 6,
              step: 0.5,
            },
            {
              key: 'ewLeft',
              label: 'E–W Left Arrow (S4)',
              val: timings.ewLeft,
              min: 2,
              max: 12,
              step: 0.5,
              disabled: !protectedLeftEnabled,
            },
            {
              key: 'ewGreen',
              label: 'E–W Through Green (S5)',
              val: timings.ewGreen,
              min: 4,
              max: 30,
              step: 1,
            },
            {
              key: 'ewYellow',
              label: 'E–W Yellow Caution (S6)',
              val: timings.ewYellow,
              min: 2,
              max: 6,
              step: 0.5,
            },
          ].map((slider) => (
            <div key={slider.key} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className={slider.disabled ? 'text-zinc-500 font-medium' : 'text-zinc-300 font-medium'}>
                  {slider.label}
                </span>
                <span className="font-mono text-white tabular-nums font-semibold">
                  {slider.disabled ? 'BYPASS' : `${slider.val.toFixed(1)}s`}
                </span>
              </div>
              <input
                type="range"
                min={slider.min}
                max={slider.max}
                step={slider.step}
                value={slider.val}
                disabled={slider.disabled}
                onChange={(e) =>
                  onUpdateTimings({
                    ...timings,
                    [slider.key]: parseFloat(e.target.value),
                  })
                }
                className="w-full accent-white cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              />
            </div>
          ))}

          {/* Traffic Spawn Rate Slider */}
          <div className="pt-2.5 border-t border-white/[0.08] space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-300 font-medium">
                Autonomous Vehicle Influx Rate:
              </span>
              <span className="font-mono text-white tabular-nums font-semibold">
                {spawnRatePerMin} veh / min
              </span>
            </div>
            <input
              type="range"
              min={12}
              max={96}
              step={4}
              value={spawnRatePerMin}
              onChange={(e) => onUpdateSpawnRate(parseInt(e.target.value, 10))}
              className="w-full accent-white cursor-pointer"
            />
          </div>
        </div>
      </div>
    </section>
  );

  const renderSensorsPanel = (flexGrow = true) => (
    <section
      id="telemetry"
      className={`scroll-mt-20 sm:scroll-mt-24 bg-slate-900/40 backdrop-blur-3xl text-[#f5f5f7] border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.25)] rounded-2xl sm:rounded-[26px] overflow-hidden grid grid-rows-[auto_1fr] h-full ${
        flexGrow ? 'flex-1' : ''
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-4 bg-white/[0.04] border-b border-white/[0.1]">
        <div className="flex items-center gap-3 min-w-[200px] flex-1">
          {/* macOS Tahoe Squircle: Sensors */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#64D2FF] to-[#0071A4] shadow-[0_4px_14px_rgba(100,210,255,0.4)] flex items-center justify-center text-white shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2
              className="text-sm sm:text-base font-bold tracking-tight text-white leading-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Approach Queue &amp; Sensor Telemetry
            </h2>
            <p className="text-[11px] text-zinc-400 font-normal leading-tight mt-0.5">Inductive loop detection &amp; roadway queue occupancy</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* High-visibility Active Vehicles Badge */}
          <div className="h-8 sm:h-9 inline-flex items-center gap-2 px-3 sm:px-3.5 rounded-full bg-[#0A84FF]/20 border border-[#0A84FF]/50 shadow-[0_0_16px_rgba(10,132,255,0.3)] text-white backdrop-blur-md leading-none">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#64D2FF] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#0A84FF]"></span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#64D2FF]">
              Active:
            </span>
            <span className="text-sm sm:text-base font-mono font-extrabold text-white tabular-nums leading-none">
              {activeVehicleCount}
            </span>
          </div>

          {/* High-visibility Cleared Vehicles Badge */}
          <div className="h-8 sm:h-9 inline-flex items-center gap-2 px-3 sm:px-3.5 rounded-full bg-[#30D158]/20 border border-[#30D158]/50 shadow-[0_0_16px_rgba(48,209,88,0.3)] text-white backdrop-blur-md leading-none">
            <CheckCircle2 className="w-4 h-4 text-[#30D158] shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#30D158]">
              Cleared:
            </span>
            <span className="text-sm sm:text-base font-mono font-extrabold text-white tabular-nums leading-none">
              {totalCleared}
            </span>
          </div>
        </div>
      </div>

      <div className="p-3.5 sm:p-5 space-y-4 flex-1 flex flex-col justify-between">
        {/* Mobile Card View (< md) — Zero Horizontal Table Overflow */}
        <div className="md:hidden grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {(['N', 'S', 'E', 'W'] as Direction[]).map((dir) => {
            const data = approaches[dir];
            const isGreen =
              data.lightState === 'GREEN' ||
              data.lightState === 'LEFT_GREEN';
            const isYellow =
              data.lightState === 'YELLOW' ||
              data.lightState === 'FLASH_YELLOW';

            return (
              <div
                key={`mob-${dir}`}
                className="p-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl space-y-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-sans font-semibold text-white text-xs">
                    {data.label} <span className="text-zinc-400 font-normal">({dir})</span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 font-mono font-semibold text-[11px] ${
                      isGreen
                        ? 'text-[#30D158]'
                        : isYellow
                        ? 'text-[#FFD60A]'
                        : 'text-[#FF453A]'
                    }`}
                  >
                    {isGreen ? (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    ) : isYellow ? (
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <Octagon className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span>
                      {data.lightState === 'LEFT_GREEN' ? '←ARROW' : data.lightState}
                    </span>
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono tabular-nums bg-white/[0.03] border border-white/[0.06] rounded-lg p-2">
                  <div>
                    <div className="text-[10px] text-zinc-400 font-sans">Sensor</div>
                    <div className={data.sensorActive ? 'text-[#64D2FF] font-bold' : 'text-zinc-400'}>
                      {data.sensorActive ? 'DETECT' : 'CLEAR'}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-400 font-sans">Queue</div>
                    <div className="text-white font-semibold">
                      {data.queueCount} <span className="text-zinc-400 font-normal">({data.leftTurnWaiting}L)</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-zinc-400 font-sans">Wait</div>
                    <div className="text-zinc-200">{data.avgWaitSec.toFixed(1)}s</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onSpawnVehicle(dir)}
                  className="h-9 w-full inline-flex items-center justify-center gap-1.5 text-xs font-sans font-semibold text-white bg-white/[0.08] hover:bg-white hover:text-black border border-white/20 rounded-xl transition-all active:scale-[0.98] cursor-pointer leading-none"
                >
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                  <span>Inject {data.label} Car</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Desktop Table View (md+) */}
        <div className="hidden md:block p-3.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/[0.08] text-zinc-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 pr-2">Approach</th>
                <th className="py-2.5 px-2">Signal State</th>
                <th className="py-2.5 px-2">Sensor</th>
                <th className="py-2.5 px-2 text-right">Queue</th>
                <th className="py-2.5 px-2 text-right">Wait</th>
                <th className="py-2.5 pl-2 text-right">Inject</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] font-mono tabular-nums">
              {(['N', 'S', 'E', 'W'] as Direction[]).map((dir) => {
                const data = approaches[dir];
                const isGreen =
                  data.lightState === 'GREEN' ||
                  data.lightState === 'LEFT_GREEN';
                const isYellow =
                  data.lightState === 'YELLOW' ||
                  data.lightState === 'FLASH_YELLOW';

                return (
                  <tr key={dir} className="hover:bg-white/[0.04] transition-colors align-middle">
                    <td className="py-2.5 pr-2 font-sans font-semibold text-white whitespace-nowrap">
                      <span>{data.label}</span>{' '}
                      <span className="text-zinc-400 text-[10px] font-normal">({dir})</span>
                    </td>
                    <td className="py-2.5 px-2 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 font-semibold text-[11px] ${
                          isGreen
                            ? 'text-[#30D158]'
                            : isYellow
                            ? 'text-[#FFD60A]'
                            : 'text-[#FF453A]'
                        }`}
                      >
                        {isGreen ? (
                          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        ) : isYellow ? (
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        ) : (
                          <Octagon className="w-3.5 h-3.5 shrink-0" />
                        )}
                        <span>
                          {data.lightState === 'LEFT_GREEN'
                            ? '←ARROW'
                            : data.lightState}
                        </span>
                      </span>
                    </td>
                    <td className="py-2.5 px-2 whitespace-nowrap">
                      {data.sensorActive ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#0A84FF]/25 text-[#64D2FF] border border-[#0A84FF]/40 leading-none">
                          DETECTED
                        </span>
                      ) : (
                        <span className="text-zinc-500 text-[11px] font-medium">
                          CLEAR
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-2 text-right text-white font-semibold whitespace-nowrap">
                      <span>{data.queueCount}</span>{' '}
                      <span className="text-zinc-400 text-[10px] font-normal">
                        ({data.leftTurnWaiting}L)
                      </span>
                    </td>
                    <td className="py-2.5 px-2 text-right text-zinc-300 whitespace-nowrap">
                      {data.avgWaitSec.toFixed(1)}s
                    </td>
                    <td className="py-2.5 pl-2 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onSpawnVehicle(dir)}
                        className="h-7 px-3 inline-flex items-center justify-center gap-1 text-[11px] font-sans font-semibold text-white bg-white/[0.08] hover:bg-white hover:text-black border border-white/20 rounded-full transition-all active:scale-[0.97] cursor-pointer shadow-2xs whitespace-nowrap leading-none"
                        title={`Inject car on ${data.label} approach`}
                      >
                        <Plus className="w-3 h-3 shrink-0" />
                        <span>Car</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Approach Capacity Utilization Bars - Responsive 2 to 4 Columns */}
        <div className="pt-2 border-t border-white/[0.08] space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-300 font-medium">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">Directional Queue Saturation</span>
            <span className="font-mono text-white tabular-nums font-semibold">
              Total Stopped: {totalQueued} veh
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(['N', 'S', 'E', 'W'] as Direction[]).map((dir) => {
              const d = approaches[dir];
              const pct = Math.min(100, Math.round((d.queueCount / 8) * 100));
              return (
                <div
                  key={`bar-${dir}`}
                  className="p-2.5 sm:p-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl space-y-1.5 min-w-0"
                >
                  <div className="flex items-center justify-between gap-1 text-[11px] sm:text-xs font-mono">
                    <span className="text-white font-semibold truncate">
                      {d.label}
                    </span>
                    <span className="text-zinc-300 tabular-nums shrink-0">
                      {d.queueCount} q
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className={`h-full rounded-full transition-all duration-300 ${
                        pct > 70
                          ? 'bg-[#FF453A]'
                          : pct > 35
                          ? 'bg-[#FFD60A]'
                          : 'bg-white'
                      }`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );

  const renderTruthTablePanel = (flexGrow = true) => (
    <section
      className={`bg-slate-900/40 backdrop-blur-3xl text-[#f5f5f7] border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.25)] rounded-2xl sm:rounded-[26px] overflow-hidden grid grid-rows-[auto_1fr] h-full ${
        flexGrow ? 'flex-1' : ''
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-4 bg-white/[0.04] border-b border-white/[0.1]">
        <div className="flex items-center gap-3 min-w-[200px] flex-1">
          {/* macOS Tahoe Squircle: Logic Truth Table */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#BF5AF2] to-[#8944AB] shadow-[0_4px_14px_rgba(191,90,242,0.4)] flex items-center justify-center text-white shrink-0">
            <Cpu className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h2
              className="text-sm sm:text-base font-bold tracking-tight text-white leading-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              PLC Output Truth Table &amp; Controller Log
            </h2>
            <p className="text-[11px] text-zinc-400 font-normal leading-tight mt-0.5">Register states [Q2 Q1 Q0] &amp; transition audit stream</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          <span className="text-xs font-mono text-zinc-400">
            Register [N_RYG : E_RYG]
          </span>
          <button
            type="button"
            onClick={() => {
              const guideEl = document.getElementById('guide');
              if (guideEl) {
                guideEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
            }}
            className="h-9 sm:h-8 px-3.5 inline-flex items-center justify-center text-[11px] font-semibold text-white bg-white/[0.08] hover:bg-white hover:text-black border border-white/20 rounded-full transition-all active:scale-[0.97] cursor-pointer shadow-2xs whitespace-nowrap leading-none"
          >
            Explain This Panel ↓
          </button>
        </div>
      </div>

      <div className="p-3.5 sm:p-5 space-y-4 flex-1 flex flex-col overflow-y-auto">
        {/* Mobile Compact Truth List (< sm) */}
        <div className="sm:hidden p-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl divide-y divide-white/[0.06] font-mono tabular-nums text-[11px]">
          {PHASE_ORDER.map((phaseId) => {
            const meta = PHASE_DEFINITIONS[phaseId];
            const isActive =
              currentPhase === phaseId &&
              controlMode !== 'NIGHT_FLASH' &&
              !mmuFaultLockout;
            return (
              <button
                key={`mob-tt-${phaseId}`}
                type="button"
                onClick={() =>
                  onSelectPhase(phaseId, `Truth Table Row Click (${meta.code})`)
                }
                className={`w-full py-2.5 px-2 flex items-center justify-between gap-2 text-left transition-colors rounded-lg ${
                  isActive
                    ? 'bg-white/15 text-white font-semibold'
                    : 'hover:bg-white/[0.04] text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      isActive ? 'bg-white shadow-[0_0_8px_white]' : 'bg-zinc-600'
                    }`}
                  />
                  <span className="font-bold text-white">{meta.code}</span>
                  <span className="text-zinc-400">{meta.qBits}</span>
                  <span className="text-zinc-300 truncate">{meta.binaryOutput}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 text-[10px]">
                  <span
                    className={
                      meta.nsColor === 'GREEN' || meta.nsColor === 'LEFT_GREEN'
                        ? 'text-[#30D158] font-bold'
                        : meta.nsColor === 'YELLOW'
                        ? 'text-[#FFD60A] font-bold'
                        : 'text-[#FF453A] font-bold'
                    }
                  >
                    NS:{meta.nsColor === 'LEFT_GREEN' ? '←GRN' : meta.nsColor}
                  </span>
                  <span
                    className={
                      meta.ewColor === 'GREEN' || meta.ewColor === 'LEFT_GREEN'
                        ? 'text-[#30D158] font-bold'
                        : meta.ewColor === 'YELLOW'
                        ? 'text-[#FFD60A] font-bold'
                        : 'text-[#FF453A] font-bold'
                    }
                  >
                    EW:{meta.ewColor === 'LEFT_GREEN' ? '←GRN' : meta.ewColor}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Truth Table (sm+) */}
        <div className="hidden sm:block p-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono tabular-nums">
            <thead>
              <tr className="border-b border-white/[0.08] text-zinc-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-2.5 pr-2">State</th>
                <th className="py-2.5 px-2">Q2 Q1 Q0</th>
                <th className="py-2.5 px-2">Output Bits</th>
                <th className="py-2.5 px-2">N–S Aspect</th>
                <th className="py-2.5 pl-2">E–W Aspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06]">
              {PHASE_ORDER.map((phaseId) => {
                const meta = PHASE_DEFINITIONS[phaseId];
                const isActive =
                  currentPhase === phaseId &&
                  controlMode !== 'NIGHT_FLASH' &&
                  !mmuFaultLockout;
                return (
                  <tr
                    key={phaseId}
                    onClick={() =>
                      onSelectPhase(
                        phaseId,
                        `Truth Table Row Click (${meta.code})`
                      )
                    }
                    className={`cursor-pointer transition-colors align-middle ${
                      isActive
                        ? 'bg-white/15 text-white font-semibold'
                        : 'hover:bg-white/[0.04] text-zinc-300'
                    }`}
                  >
                    <td className="py-2.5 pr-2 font-bold flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isActive
                            ? 'bg-white shadow-[0_0_8px_white]'
                            : 'bg-zinc-600'
                        }`}
                      />
                      <span>{meta.code}</span>
                    </td>
                    <td className="py-2.5 px-2 font-semibold">{meta.qBits}</td>
                    <td className="py-2.5 px-2 text-zinc-300">
                      {meta.binaryOutput}
                    </td>
                    <td className="py-2.5 px-2">
                      <span
                        className={
                          meta.nsColor === 'GREEN' || meta.nsColor === 'LEFT_GREEN'
                            ? 'text-[#30D158] font-bold'
                            : meta.nsColor === 'YELLOW'
                            ? 'text-[#FFD60A] font-bold'
                            : 'text-[#FF453A] font-bold'
                        }
                      >
                        {meta.nsColor}
                      </span>
                    </td>
                    <td className="py-2.5 pl-2">
                      <span
                        className={
                          meta.ewColor === 'GREEN' || meta.ewColor === 'LEFT_GREEN'
                            ? 'text-[#30D158] font-bold'
                            : meta.ewColor === 'YELLOW'
                            ? 'text-[#FFD60A] font-bold'
                            : 'text-[#FF453A] font-bold'
                        }
                      >
                        {meta.ewColor}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Live Controller Transition Stream (Audit Log) */}
        <div className="pt-2 border-t border-white/[0.08] space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-300 font-medium">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">Recent Controller Transitions</span>
            <span className="font-mono text-zinc-400 tabular-nums text-[11px]">
              {phaseLogs.length} events · Scroll
            </span>
          </div>
          <div className="h-44 overflow-y-auto overscroll-contain font-mono text-[11px] p-2 bg-black/40 backdrop-blur-md border border-white/10 rounded-xl divide-y divide-white/[0.06] pr-2 focus:outline-none">
            {phaseLogs.length === 0 ? (
              <div className="py-6 text-center text-zinc-500 font-sans text-xs">
                No state machine transitions recorded yet.
              </div>
            ) : (
              phaseLogs.map((log, idx) => (
                <div
                  key={`${log.id || log.timestamp}-${idx}`}
                  className="py-1.5 px-2 flex items-center justify-between gap-2 text-zinc-300 hover:bg-white/[0.04] rounded-lg transition-colors min-w-0"
                >
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <span className="text-zinc-400 font-mono text-[10px] bg-white/[0.06] px-1.5 py-0.5 rounded leading-none">
                      {log.timestamp}
                    </span>
                    <span className="text-white font-semibold flex items-center gap-1">
                      <span className="text-zinc-300">
                        {log.fromPhase ? PHASE_DEFINITIONS[log.fromPhase]?.code : 'INIT'}
                      </span>
                      <span className="text-[#64D2FF]">→</span>
                      <span className="text-emerald-400 font-bold">
                        {PHASE_DEFINITIONS[log.toPhase]?.code}
                      </span>
                    </span>
                  </div>
                  <span className="text-zinc-300 text-[10px] truncate min-w-0 flex-1 text-right" title={log.reason}>
                    {log.reason}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );

  if (mode === 'BOTTOM_PAIR') {
    return (
      <div className="space-y-5">
        {/* Approach Queue & Sensor Telemetry - Permanently Expanded 100% Full Width */}
        <div className="w-full">
          {renderSensorsPanel(false)}
        </div>

        {/* Lower Engineering Pair: Timing Parameters & PLC Truth Table side by side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-5 items-stretch">
          <div className="h-full flex flex-col">{renderTimingPanel(true)}</div>
          <div className="h-full flex flex-col">{renderTruthTablePanel(true)}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-rows-[auto_1fr] gap-4 lg:gap-5 h-full flex-1 min-h-0">
      {/* Sculptural macOS Tahoe Segmented Deck Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 p-2.5 bg-slate-900/40 backdrop-blur-3xl border border-white/20 shadow-[0_14px_30px_rgba(0,0,0,0.3)] rounded-[22px]">
        <div className="flex items-center gap-2 px-2.5 text-xs font-semibold text-white/95">
          <Layers className="w-3.5 h-3.5 text-white shrink-0" />
          <span>Sidebar Deck:</span>
        </div>
        <div className="flex flex-wrap items-center gap-1 bg-black/50 backdrop-blur-md p-1 rounded-full border border-white/[0.1]">
          {deckTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setDeckTab(t.id)}
              className={`h-8 px-3.5 inline-flex items-center justify-center text-xs font-semibold rounded-full transition-all whitespace-nowrap shrink-0 cursor-pointer leading-none ${
                deckTab === t.id
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Matched-Height Sidebar Panel */}
      <div className="h-full min-h-0 flex flex-col">
        {deckTab === 'SENSORS' && renderSensorsPanel(true)}
        {deckTab === 'TRUTH_TABLE' && renderTruthTablePanel(true)}
        {deckTab === 'TIMING' && renderTimingPanel(true)}
      </div>
    </div>
  );
}
