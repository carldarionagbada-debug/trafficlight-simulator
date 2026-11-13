'use client';

import React, { useState } from 'react';
import {
  ControlMode,
  Direction,
  PhaseId,
} from '@/types/simulation';
import {
  BookOpen,
  Cpu,
  Sliders,
  GitCommitHorizontal,
  Activity,
  Siren,
  Car,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Play,
  Layers,
  Table2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
} from 'lucide-react';

export type GuideTabId =
  | 'OVERVIEW'
  | 'PLC_TRUTH_LOG'
  | 'BUTTONS'
  | 'DIAGRAMS'
  | 'TELEMETRY';

interface SystemDocumentationPanelProps {
  onSelectPhase: (phase: PhaseId, reason: string) => void;
  onChangeMode: (mode: ControlMode) => void;
  onSpawnEmergency: (dir: Direction) => void;
  onSpawnWave: () => void;
  onRequestPedestrianPhase: (axis: 'NS' | 'EW', immediate: boolean) => void;
  onToggleMmuFault: () => void;
}

export default function SystemDocumentationPanel({
  onSelectPhase,
  onChangeMode,
  onSpawnEmergency,
  onSpawnWave,
  onRequestPedestrianPhase,
  onToggleMmuFault,
}: SystemDocumentationPanelProps) {
  const [activeTab, setActiveTab] = useState<GuideTabId>('PLC_TRUTH_LOG');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [selectedGuideCard, setSelectedGuideCard] = useState<string | null>(
    'arch-fsm'
  );

  const tabs: { id: GuideTabId; label: string; subtitle: string }[] = [
    {
      id: 'OVERVIEW',
      label: '1. System Overview & How It Works',
      subtitle: 'Architecture, physics & 8-phase cycle',
    },
    {
      id: 'PLC_TRUTH_LOG',
      label: '2. PLC Truth Table & Controller Log',
      subtitle: 'Complete guide to S0–S7, Q2 Q1 Q0 & transitions',
    },
    {
      id: 'BUTTONS',
      label: '3. All Buttons & Controls Guide',
      subtitle: 'Every toolbar, spawner & mode button explained',
    },
    {
      id: 'DIAGRAMS',
      label: '4. Diagrams & Digital Logic Guide',
      subtitle: 'FSM graph, logic gates, MMU & waveforms',
    },
    {
      id: 'TELEMETRY',
      label: '5. Approach Queue & Sensor Guide',
      subtitle: 'Inductive loops, approach queues & directional saturation',
    },
  ];

  return (
    <section
      id="guide"
      className="scroll-mt-20 sm:scroll-mt-24 bg-slate-900/40 backdrop-blur-3xl text-[#f5f5f7] border border-white/20 shadow-[0_28px_60px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.25)] rounded-2xl sm:rounded-[28px] overflow-hidden"
    >
      {/* Top Apple Header Banner — Expand/Collapse Controller */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 px-4 sm:px-6 py-4 bg-white/[0.04] border-b border-white/[0.1]">
        <div
          onClick={() => setIsExpanded((prev) => !prev)}
          className="flex items-start sm:items-center gap-3 cursor-pointer select-none min-w-0 w-full sm:w-auto sm:flex-1"
          role="button"
          aria-expanded={isExpanded}
        >
          {/* macOS Tahoe Squircle: User Manual & Architecture */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FF9F0A] to-[#D97706] shadow-[0_4px_14px_rgba(255,159,10,0.4)] flex items-center justify-center text-white shrink-0">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2
                className="text-base sm:text-lg font-bold text-white tracking-tight leading-tight"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Complete System Architecture & Interactive User Manual
              </h2>
              <span className="h-5 px-2.5 inline-flex items-center rounded-full bg-white/[0.06] border border-white/[0.14] text-[10px] font-mono text-zinc-300 leading-none shrink-0">
                Interactive Reference
              </span>
            </div>
            <p className="text-xs text-zinc-400 mt-1 leading-normal">
              Select any topic tab below to inspect how the entire traffic
              signal system, PLC Output Truth Table &amp; Controller Log,
              controls, and digital logic operate.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="h-9 sm:h-8 w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 text-xs font-semibold text-white bg-white/[0.06] hover:bg-white hover:text-black border border-white/20 rounded-full transition-all active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer leading-none"
        >
          <span>{isExpanded ? 'Collapse Manual' : 'Open System Manual'}</span>
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 shrink-0" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 shrink-0" />
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="p-3.5 sm:p-6 space-y-5 sm:space-y-6">
          {/* 5-Tab Topic Navigation Grid (Apple Monochrome Segmented Controller) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2 p-1.5 bg-black/60 border border-white/[0.08] rounded-2xl">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex flex-col items-start justify-center text-left px-3.5 py-3 rounded-xl border transition-all active:scale-[0.99] cursor-pointer ${
                    isActive
                      ? 'bg-white text-black border-white shadow-[0_4px_16px_rgba(255,255,255,0.18)]'
                      : 'bg-transparent border-transparent text-zinc-400 hover:bg-white/[0.05] hover:text-white'
                  }`}
                >
                  <span
                    className={`text-xs font-bold leading-snug ${
                      isActive ? 'text-black' : 'text-white'
                    }`}
                  >
                    {tab.label}
                  </span>
                  <span
                    className={`text-[11px] mt-1 leading-snug ${
                      isActive ? 'text-zinc-600' : 'text-zinc-400'
                    }`}
                  >
                    {tab.subtitle}
                  </span>
                </button>
              );
            })}
          </div>

          {/* TAB 1: SYSTEM OVERVIEW & HOW IT WORKS */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-5">
              <div className="p-4 sm:p-5 bg-white/[0.03] border border-white/[0.08] rounded-2xl space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3
                    className="text-sm font-bold text-white tracking-tight"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    What Is SignalFlow & How Does the System Work?
                  </h3>
                  <span className="text-xs text-zinc-300 font-mono px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/10">
                    Project by Carl Agbada, Angelo Icaro &amp; Ryza Suarez
                  </span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  <strong className="text-white font-semibold">SignalFlow</strong> is a real-time 4-Way Arterial
                  Traffic Intersection & Digital Logic Controller Simulator. It
                  models both the <strong className="text-white font-semibold">physical roadway environment</strong>{' '}
                  (autonomous cars, buses, taxis, emergency response units, pedestrian
                  crosswalks, and inductive loop road sensors) and the{' '}
                  <strong className="text-white font-semibold">electronic traffic controller</strong> (an 8-State
                  Programmable Logic Controller Finite State Machine,
                  combinational boolean logic gates, and a Malfunction
                  Management Unit safety monitor) running synchronously at 60 frames per
                  second.
                </p>
              </div>

              {/* Clickable Core Subsystem Cards */}
              <div>
                <div className="text-xs font-semibold text-zinc-300 mb-2.5 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Click any core subsystem below to inspect how it works in detail:</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    {
                      id: 'arch-fsm',
                      title: '1. The 8-Phase Dual-Ring Cycle (S0–S7)',
                      summary:
                        'How the controller sequences Protected Left Arrows, Through Greens, Yellow Clearance, and All-Red safety buffers.',
                      details:
                        'Every full cycle steps through 8 deterministic states: S0 (N–S Protected Left Green Arrow ←), S1 (N–S Through Green + N–S Pedestrian WALK), S2 (N–S Yellow Clearance warning approaching cars to brake), S3 (All-Red Intergreen Buffer so cars inside the conflict box clear safely), S4 (E–W Protected Left Arrow ←), S5 (E–W Through Green + E–W Pedestrian WALK), S6 (E–W Yellow Clearance), and S7 (All-Red Buffer before returning to S0).',
                    },
                    {
                      id: 'arch-physics',
                      title: '2. Autonomous Vehicle & Turning Physics',
                      summary:
                        'How cars accelerate, maintain safe following gaps, obey signal heads, and execute 90° left/right turns.',
                      details:
                        'Each vehicle runs a continuous car-following physics model. It measures the distance to the vehicle ahead in its lane and the distance to the white stop line (232px). Inner-lane (Lane 1) vehicles can go Straight or execute a 90° Bezier Left Turn (obeying the Left Green Arrow ←). Outer-lane (Lane 2) vehicles can go Straight or make a 90° Right Turn (including permissive Right-on-Red after coming to a complete stop for 1.8 seconds).',
                    },
                    {
                      id: 'arch-sensors',
                      title: '3. Inductive Loops & Preemption Logic',
                      summary:
                        'How pavement sensors detect queues and how Emergency & Pedestrian overrides reshape the signal cycle.',
                      details:
                        'Dashed white/cyan rectangles embedded in the pavement ahead of each stop line act as inductive electromagnetic loop detectors. When a vehicle enters the loop zone, the sensor flips to DETECTED. In Smart Sensor mode, if the active green direction has an empty loop while the cross-street loop detects waiting cars, the controller dynamically truncates the green timer to eliminate wasted wait time.',
                    },
                  ].map((card) => {
                    const isSelected = selectedGuideCard === card.id;
                    return (
                      <div
                        key={card.id}
                        onClick={() => setSelectedGuideCard(card.id)}
                        className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-white/[0.07] border-white/30 shadow-[0_8px_24px_rgba(0,0,0,0.3)]'
                            : 'bg-white/[0.03] border-white/[0.08] hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <h4 className="text-xs font-bold text-white tracking-tight">
                            {card.title}
                          </h4>
                          <span
                            className={`h-5 px-2 inline-flex items-center justify-center leading-none text-[10px] font-mono font-semibold rounded-full border shrink-0 ${
                              isSelected
                                ? 'bg-white text-black border-white'
                                : 'bg-white/[0.06] text-zinc-400 border-white/10'
                            }`}
                          >
                            {isSelected ? 'ACTIVE' : 'SELECT'}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-300 leading-relaxed">
                          {card.summary}
                        </p>
                        {isSelected && (
                          <div className="mt-3.5 pt-3.5 border-t border-white/[0.08] text-xs text-zinc-200 leading-relaxed bg-black/40 p-3.5 rounded-xl">
                            {card.details}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Complete 8-State Cycle Breakdown Table */}
              <div className="p-4 sm:p-5 bg-white/[0.03] border border-white/[0.08] rounded-2xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                    Step-by-Step Breakdown of All 8 Traffic Controller States (Click any state to trigger it live)
                  </h4>
                  <span className="text-[11px] text-zinc-400 font-mono shrink-0">8 Active States (S0–S7)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                  {(
                    [
                      {
                        phase: 'NS_LEFT',
                        code: 'S0 · N–S Left Arrow',
                        desc: 'Green left arrow (←) for N & S inner lanes. Opposing straight traffic and crosswalks are held at red.',
                        tag: 'ARROW ←',
                        tagColor: 'text-[#30D158] border-[#30D158]/30 bg-[#30D158]/10',
                      },
                      {
                        phase: 'NS_GREEN',
                        code: 'S1 · N–S Green',
                        desc: 'Main green light for Northbound & Southbound straight/right traffic. West & East crosswalks open for WALK.',
                        tag: 'THROUGH GREEN',
                        tagColor: 'text-[#30D158] border-[#30D158]/30 bg-[#30D158]/10',
                      },
                      {
                        phase: 'NS_YELLOW',
                        code: 'S2 · N–S Yellow',
                        desc: 'Yellow caution transition. Approaching N–S vehicles brake to stop before the white stop line.',
                        tag: 'CLEARANCE',
                        tagColor: 'text-[#FFD60A] border-[#FFD60A]/30 bg-[#FFD60A]/10',
                      },
                      {
                        phase: 'ALL_RED_1',
                        code: 'S3 · All-Red (N→E)',
                        desc: 'All 4 directions show solid Red for 1.5s so any car still inside the intersection clears safely.',
                        tag: 'ALL-RED BUFFER',
                        tagColor: 'text-[#FF453A] border-[#FF453A]/30 bg-[#FF453A]/10',
                      },
                      {
                        phase: 'EW_LEFT',
                        code: 'S4 · E–W Left Arrow',
                        desc: 'Green left arrow (←) for E & W inner lanes to turn across the intersection without conflict.',
                        tag: 'ARROW ←',
                        tagColor: 'text-[#30D158] border-[#30D158]/30 bg-[#30D158]/10',
                      },
                      {
                        phase: 'EW_GREEN',
                        code: 'S5 · E–W Green',
                        desc: 'Main green light for Eastbound & Westbound straight/right traffic. North & South crosswalks open for WALK.',
                        tag: 'THROUGH GREEN',
                        tagColor: 'text-[#30D158] border-[#30D158]/30 bg-[#30D158]/10',
                      },
                      {
                        phase: 'EW_YELLOW',
                        code: 'S6 · E–W Yellow',
                        desc: 'Yellow caution interval warning E–W traffic that right-of-way is ending.',
                        tag: 'CLEARANCE',
                        tagColor: 'text-[#FFD60A] border-[#FFD60A]/30 bg-[#FFD60A]/10',
                      },
                      {
                        phase: 'ALL_RED_2',
                        code: 'S7 · All-Red (E→N)',
                        desc: 'Safety clearance buffer before returning right-of-way back to North–South.',
                        tag: 'ALL-RED BUFFER',
                        tagColor: 'text-[#FF453A] border-[#FF453A]/30 bg-[#FF453A]/10',
                      },
                    ] as { phase: PhaseId; code: string; desc: string; tag: string; tagColor: string }[]
                  ).map((item) => (
                    <button
                      key={item.phase}
                      type="button"
                      onClick={() =>
                        onSelectPhase(
                          item.phase,
                          `System Guide Interactive Trigger (${item.code})`
                        )
                      }
                      className="flex flex-col text-left p-3.5 bg-black/40 hover:bg-white hover:text-black border border-white/[0.08] hover:border-white rounded-xl transition-all active:scale-[0.98] cursor-pointer group"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
                        <span className="font-mono font-bold text-white group-hover:text-black min-w-0">
                          {item.code}
                        </span>
                        <span
                          className={`h-5 px-2 inline-flex items-center justify-center leading-none text-[9px] font-mono font-semibold rounded-full border shrink-0 ${item.tagColor} group-hover:bg-black/10 group-hover:border-black/20 group-hover:text-black`}
                        >
                          {item.tag}
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-400 group-hover:text-zinc-800 leading-relaxed">
                        {item.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COMPLETE PLC OUTPUT TRUTH TABLE & CONTROLLER LOG EXPLANATION */}
          {activeTab === 'PLC_TRUTH_LOG' && (
            <div className="space-y-6 text-xs">
              {/* Intro Overview Banner */}
              <div className="p-4 sm:p-5 bg-white/[0.03] border border-white/[0.08] rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Table2 className="w-4 h-4 text-zinc-300 shrink-0" />
                  <h3 style={{ fontFamily: 'var(--font-display)' }}>
                    PLC Output Truth Table &amp; Controller Log — Complete Explanation
                  </h3>
                </div>
                <p className="text-zinc-300 leading-relaxed text-xs sm:text-sm">
                  This section of your Traffic Signal Simulator is the{' '}
                  <strong className="text-white font-semibold">
                    PLC Output Truth Table &amp; Controller Log
                  </strong>
                  . It shows how the traffic light controller decides which
                  lights should turn <strong className="text-white font-semibold">ON</strong> or <strong className="text-white font-semibold">OFF</strong>{' '}
                  based on its current state. In simple terms, this is the part
                  that explains the digital logic behind your traffic light system.
                </p>
              </div>

              {/* Grid Row 1: Section 1 (Columns Breakdown) & Section 3 (What are Q2, Q1, Q0?) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
                {/* 1. PLC Output Truth Table */}
                <div className="p-4 sm:p-5 bg-white/[0.03] border border-white/[0.08] rounded-2xl space-y-3">
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">
                      Main Function: Traffic Light Control
                    </span>
                    <h4 className="text-sm font-bold text-white mt-0.5">
                      1. PLC Output Truth Table Columns
                    </h4>
                  </div>
                  <p className="text-zinc-300 leading-relaxed">
                    The table shows <strong className="text-white">8 deterministic states (S0–S7)</strong>.
                    Each state represents a specific stage in the
                    traffic light sequence. Column breakdown:
                  </p>

                  <div className="overflow-x-auto border border-white/[0.08] rounded-xl bg-black/40">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white/[0.04] border-b border-white/[0.08] text-zinc-300">
                          <th className="py-2.5 px-3.5 font-semibold">Column</th>
                          <th className="py-2.5 px-3.5 font-semibold">Meaning</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.06] text-zinc-300">
                        <tr>
                          <td className="py-2.5 px-3.5 font-mono font-bold text-white whitespace-nowrap">
                            State
                          </td>
                          <td className="py-2.5 px-3.5">
                            Current state of the traffic controller (S0 through S7).
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3.5 font-mono font-bold text-white whitespace-nowrap">
                            Q2 Q1 Q0
                          </td>
                          <td className="py-2.5 px-3.5">
                            Three binary flip-flop bits representing the current state address.
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3.5 font-mono font-bold text-white whitespace-nowrap">
                            Output Bits
                          </td>
                          <td className="py-2.5 px-3.5">
                            Binary lamp output signals sent to the signal heads [N_RYG : E_RYG].
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3.5 font-mono font-bold text-[#30D158] whitespace-nowrap">
                            N-S Aspect
                          </td>
                          <td className="py-2.5 px-3.5">
                            Active signal lamp condition for North–South approaches.
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2.5 px-3.5 font-mono font-bold text-[#30D158] whitespace-nowrap">
                            E-W Aspect
                          </td>
                          <td className="py-2.5 px-3.5">
                            Active signal lamp condition for East–West approaches.
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 3. What are Q2, Q1, and Q0? */}
                <div className="p-4 sm:p-5 bg-white/[0.03] border border-white/[0.08] rounded-2xl space-y-3">
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">
                      3-Bit Binary State Addressing
                    </span>
                    <h4 className="text-sm font-bold text-white mt-0.5">
                      3. What are Q2, Q1, and Q0?
                    </h4>
                  </div>
                  <p className="text-zinc-300 leading-relaxed">
                    These are the three binary register bits used to address the
                    controller&apos;s active state. Three bits yield{' '}
                    <strong className="text-white">eight unique combinations (2³ = 8)</strong>,
                    indexing every state from S0 to S7:
                  </p>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono">
                    {[
                      { state: 'S0', bin: '000', desc: '1st state' },
                      { state: 'S1', bin: '001', desc: '2nd state' },
                      { state: 'S2', bin: '010', desc: '3rd state' },
                      { state: 'S3', bin: '011', desc: '4th state' },
                      { state: 'S4', bin: '100', desc: '5th state' },
                      { state: 'S5', bin: '101', desc: '6th state' },
                      { state: 'S6', bin: '110', desc: '7th state' },
                      { state: 'S7', bin: '111', desc: '8th state' },
                    ].map((row) => (
                      <div
                        key={row.state}
                        className="p-2.5 bg-black/40 border border-white/[0.08] rounded-xl flex items-center justify-between"
                      >
                        <span className="font-bold text-white">{row.state}</span>
                        <span className="px-2 py-0.5 bg-white/[0.08] border border-white/10 rounded-md text-zinc-100 font-bold text-xs">
                          {row.bin}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="p-3.5 bg-black/40 border border-white/[0.08] rounded-xl space-y-1 text-zinc-300">
                    <div className="font-semibold text-white">Examples in the simulation:</div>
                    <ul className="list-disc pl-4 space-y-1 text-xs">
                      <li>
                        <code className="text-zinc-200 font-mono bg-white/[0.06] px-1.5 py-0.5 rounded">S0 = 000</code>{' '}
                        means the controller is in its <strong>first state (N–S Left Arrow)</strong>.
                      </li>
                      <li>
                        <code className="text-zinc-200 font-mono bg-white/[0.06] px-1.5 py-0.5 rounded">S3 = 011</code>{' '}
                        means it is in its <strong>fourth state (N→E All-Red Buffer)</strong>.
                      </li>
                      <li>
                        <code className="text-zinc-200 font-mono bg-white/[0.06] px-1.5 py-0.5 rounded">S6 = 110</code>{' '}
                        means it is in its <strong>seventh state (E–W Yellow Caution)</strong>.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Section 2: Understanding the Traffic Light States */}
              <div className="p-4 sm:p-5 bg-white/[0.03] border border-white/[0.08] rounded-2xl space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">
                      North–South &amp; East–West Sequences
                    </span>
                    <h4 className="text-sm font-bold text-white mt-0.5">
                      2. Understanding the Traffic Light States (Click any state to test it live)
                    </h4>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* North-South Direction */}
                  <div className="p-4 sm:p-5 bg-black/40 border border-white/[0.08] rounded-xl space-y-2.5">
                    <div className="text-xs font-bold text-[#30D158] uppercase tracking-wider font-mono flex items-center justify-between">
                      <span>North–South Direction (S0 – S3)</span>
                      <span className="text-[10px] text-zinc-400 font-sans font-normal">Arterial Axis</span>
                    </div>
                    <div className="space-y-2">
                      {[
                        {
                          phase: 'NS_LEFT' as PhaseId,
                          title: 'S0 – LEFT GREEN',
                          desc: 'North-South left-turn signal arrow is green.',
                          badge: 'text-[#30D158] border-[#30D158]/30 bg-[#30D158]/10',
                        },
                        {
                          phase: 'NS_GREEN' as PhaseId,
                          title: 'S1 – GREEN',
                          desc: 'North-South through traffic proceeds.',
                          badge: 'text-[#30D158] border-[#30D158]/30 bg-[#30D158]/10',
                        },
                        {
                          phase: 'NS_YELLOW' as PhaseId,
                          title: 'S2 – YELLOW',
                          desc: 'North-South traffic prepares to brake and stop.',
                          badge: 'text-[#FFD60A] border-[#FFD60A]/30 bg-[#FFD60A]/10',
                        },
                        {
                          phase: 'ALL_RED_1' as PhaseId,
                          title: 'S3 – RED',
                          desc: 'North-South clearance; all 4 approaches held red.',
                          badge: 'text-[#FF453A] border-[#FF453A]/30 bg-[#FF453A]/10',
                        },
                      ].map((s) => (
                        <button
                          key={s.phase}
                          type="button"
                          onClick={() =>
                            onSelectPhase(s.phase, `System Guide Click (${s.title})`)
                          }
                          className="w-full flex items-center justify-between gap-3 p-3 bg-white/[0.03] hover:bg-white hover:text-black border border-white/[0.08] hover:border-white rounded-xl text-left transition-all active:scale-[0.99] cursor-pointer group"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-mono font-bold text-white group-hover:text-black">
                              {s.title}
                            </div>
                            <div className="text-zinc-400 group-hover:text-zinc-800 text-[11px] mt-0.5">
                              {s.desc}
                            </div>
                          </div>
                          <span
                            className={`h-5 px-2.5 inline-flex items-center justify-center leading-none text-[10px] font-mono font-bold rounded-full border shrink-0 ${s.badge} group-hover:bg-black/10 group-hover:border-black/20 group-hover:text-black`}
                          >
                            Test State
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* East-West Direction */}
                  <div className="p-4 sm:p-5 bg-black/40 border border-white/[0.08] rounded-xl space-y-2.5">
                    <div className="text-xs font-bold text-zinc-200 uppercase tracking-wider font-mono flex items-center justify-between">
                      <span>East–West Direction (S4 – S7)</span>
                      <span className="text-[10px] text-zinc-400 font-sans font-normal">Cross-Street Axis</span>
                    </div>
                    <div className="space-y-2">
                      {[
                        {
                          phase: 'EW_LEFT' as PhaseId,
                          title: 'S4 – LEFT GREEN',
                          desc: 'East-West left-turn signal arrow is green.',
                          badge: 'text-[#30D158] border-[#30D158]/30 bg-[#30D158]/10',
                        },
                        {
                          phase: 'EW_GREEN' as PhaseId,
                          title: 'S5 – GREEN',
                          desc: 'East-West through traffic proceeds.',
                          badge: 'text-[#30D158] border-[#30D158]/30 bg-[#30D158]/10',
                        },
                        {
                          phase: 'EW_YELLOW' as PhaseId,
                          title: 'S6 – YELLOW',
                          desc: 'East-West traffic prepares to brake and stop.',
                          badge: 'text-[#FFD60A] border-[#FFD60A]/30 bg-[#FFD60A]/10',
                        },
                        {
                          phase: 'ALL_RED_2' as PhaseId,
                          title: 'S7 – RED',
                          desc: 'East-West clearance; all 4 approaches held red.',
                          badge: 'text-[#FF453A] border-[#FF453A]/30 bg-[#FF453A]/10',
                        },
                      ].map((s) => (
                        <button
                          key={s.phase}
                          type="button"
                          onClick={() =>
                            onSelectPhase(s.phase, `System Guide Click (${s.title})`)
                          }
                          className="w-full flex items-center justify-between gap-3 p-3 bg-white/[0.03] hover:bg-white hover:text-black border border-white/[0.08] hover:border-white rounded-xl text-left transition-all active:scale-[0.99] cursor-pointer group"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-mono font-bold text-white group-hover:text-black">
                              {s.title}
                            </div>
                            <div className="text-zinc-400 group-hover:text-zinc-800 text-[11px] mt-0.5">
                              {s.desc}
                            </div>
                          </div>
                          <span
                            className={`h-5 px-2.5 inline-flex items-center justify-center leading-none text-[10px] font-mono font-bold rounded-full border shrink-0 ${s.badge} group-hover:bg-black/10 group-hover:border-black/20 group-hover:text-black`}
                          >
                            Test State
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Important Interlock Callout */}
                <div className="flex items-start gap-3 p-4 bg-[#FFD60A]/[0.06] border border-[#FFD60A]/20 rounded-xl text-zinc-300">
                  <AlertTriangle className="w-4 h-4 text-[#FFD60A] shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    <strong className="text-white">Safety Interlock:</strong> When North–South is{' '}
                    <strong className="text-[#30D158]">GREEN</strong>,
                    East–West is locked at <strong className="text-[#FF453A]">RED</strong>,
                    and vice versa. This hardware interlock logic prevents conflicting
                    traffic movements and catastrophic collisions inside the intersection conflict box.
                  </p>
                </div>
              </div>

              {/* Grid Row 3: Section 4 (Recent Controller Transitions) & Section 5 (Purpose) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
                {/* 4. Recent Controller Transitions */}
                <div className="p-4 sm:p-5 bg-white/[0.03] border border-white/[0.08] rounded-2xl space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-zinc-300" />
                    <div>
                      <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-medium">
                        Live Activity Monitoring
                      </span>
                      <h4 className="text-sm font-bold text-white">
                        4. Recent Controller Transitions
                      </h4>
                    </div>
                  </div>

                  <p className="text-zinc-300 leading-relaxed">
                    This section records the movement of the controller from one
                    state to another in real time:
                  </p>

                  <div className="overflow-x-auto border border-white/[0.08] rounded-xl bg-black/40">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white/[0.04] border-b border-white/[0.08] text-zinc-300">
                          <th className="py-2.5 px-3.5 font-semibold">Time</th>
                          <th className="py-2.5 px-3.5 font-semibold">Transition</th>
                          <th className="py-2.5 px-3.5 font-semibold">Explanation</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/[0.06] text-zinc-300 font-mono">
                        <tr>
                          <td className="py-2 px-3.5 text-zinc-400">04:02.8</td>
                          <td className="py-2 px-3.5 text-white font-bold whitespace-nowrap">
                            S5 → S6
                          </td>
                          <td className="py-2 px-3.5 font-sans text-xs">
                            East-West Green changes to Yellow clearance.
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3.5 text-zinc-400">03:54.5</td>
                          <td className="py-2 px-3.5 text-white font-bold whitespace-nowrap">
                            S3 → S5
                          </td>
                          <td className="py-2 px-3.5 font-sans text-xs">
                            Controller clears North-South and opens East-West Green.
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3.5 text-zinc-400">03:51.5</td>
                          <td className="py-2 px-3.5 text-white font-bold whitespace-nowrap">
                            S2 → S3
                          </td>
                          <td className="py-2 px-3.5 font-sans text-xs">
                            North-South Yellow ends; entering All-Red buffer.
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3.5 text-zinc-400">03:45.5</td>
                          <td className="py-2 px-3.5 text-white font-bold whitespace-nowrap">
                            S1 → S2
                          </td>
                          <td className="py-2 px-3.5 font-sans text-xs">
                            North-South Green changes to Yellow clearance.
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 px-3.5 text-zinc-400">03:42.7</td>
                          <td className="py-2 px-3.5 text-white font-bold whitespace-nowrap">
                            S7 → S1
                          </td>
                          <td className="py-2 px-3.5 font-sans text-xs">
                            All-Red buffer completes; North-South receives Green.
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="p-3.5 bg-black/40 border border-white/[0.08] rounded-xl text-zinc-300 leading-relaxed text-xs">
                    <code className="text-white font-mono font-bold bg-white/[0.06] px-1.5 py-0.5 rounded mr-1 break-all sm:break-normal">
                      ScheduledTimerTransition
                    </code>{' '}
                    means the controller automatically steps its state when
                    the countdown timer expires. In actuated sensor mode, detections
                    can truncate or extend this timer dynamically.
                  </div>
                </div>

                {/* 5. What is the purpose of this entire section? */}
                <div className="space-y-4">
                  <div className="p-4 sm:p-5 bg-white/[0.03] border border-white/[0.08] rounded-2xl space-y-3">
                    <h4 className="text-sm font-bold text-white">
                      5. Purpose of the Controller Truth Table &amp; Log
                    </h4>
                    <p className="text-zinc-300">
                      The PLC Output Truth Table and Controller Log enable you to:
                    </p>
                    <ol className="space-y-2 text-zinc-300 list-decimal pl-4 text-xs">
                      <li>
                        <strong className="text-white">
                          Monitor active signal aspects
                        </strong>{' '}
                        – Verify which approach currently holds GREEN, YELLOW, or RED.
                      </li>
                      <li>
                        <strong className="text-white">
                          Inspect 3-bit binary PLC logic
                        </strong>{' '}
                        – Understand how Q2, Q1, and Q0 drive the combinational logic matrix.
                      </li>
                      <li>
                        <strong className="text-white">
                          Audit state transitions
                        </strong>{' '}
                        – Track automatic timer steps, emergency overrides, and manual jumps.
                      </li>
                      <li>
                        <strong className="text-white">Verify safety interlocks</strong>{' '}
                        – Guarantee that conflicting greens never illuminate at the same time.
                      </li>
                      <li>
                        <strong className="text-white">
                          Demonstrate industrial PLC operation
                        </strong>{' '}
                        – Observe deterministic finite-state behavior matching real NEMA TS2 controllers.
                      </li>
                    </ol>
                  </div>

                  {/* 6. Step-by-Step Transition Example */}
                  <div className="p-4 sm:p-5 bg-white/[0.03] border border-white/[0.08] rounded-2xl space-y-3">
                    <h4 className="text-sm font-bold text-white">
                      6. Example Sequence: North–South to East–West
                    </h4>
                    <div className="space-y-2">
                      {[
                        {
                          step: '1. S1 – North-South GREEN',
                          detail:
                            'North-South vehicles proceed freely; East-West vehicles wait at stop line.',
                        },
                        {
                          step: '2. S2 – North-South YELLOW',
                          detail:
                            'Yellow caution warns approaching N–S drivers to stop before the line.',
                        },
                        {
                          step: '3. S3 – ALL-RED Buffer',
                          detail:
                            'Intersection clearance buffer allowing any remaining vehicles to exit before cross street opens.',
                        },
                        {
                          step: '4. S5 – East-West GREEN',
                          detail: 'East-West vehicles receive right-of-way and move through.',
                        },
                        {
                          step: '5. S6 – East-West YELLOW',
                          detail: 'East-West caution interval before returning to all-red.',
                        },
                      ].map((item) => (
                        <div
                          key={item.step}
                          className="p-2.5 bg-black/40 border border-white/[0.08] rounded-xl"
                        >
                          <div className="font-mono font-bold text-white text-xs">
                            {item.step}
                          </div>
                          <div className="text-zinc-400 mt-0.5 text-[11px]">
                            {item.detail}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Summary & Output Bits Mapping Detail */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="p-4 sm:p-5 bg-white/[0.03] border border-white/[0.08] rounded-2xl flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-white shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="font-bold text-white text-sm">Industrial Standard Architecture</div>
                    <p className="text-zinc-300 leading-relaxed text-xs">
                      This panel reflects the technical telemetry of an industrial PLC
                      traffic controller. It demonstrates deterministic state sequencing,
                      binary addressing, combinational gate outputs, and safe interlocked operations.
                    </p>
                  </div>
                </div>

                <div className="p-4 sm:p-5 bg-black/40 border border-white/[0.08] rounded-2xl space-y-1.5">
                  <div className="font-bold text-white font-mono text-xs">
                    Output Bits Word Mapping [N_RYG : E_RYG]
                  </div>
                  <p className="text-zinc-300 leading-relaxed text-xs">
                    In the simulation telemetry, the{' '}
                    <code className="text-white font-mono bg-white/[0.06] px-1 rounded">Output Bits</code>{' '}
                    word is structured as{' '}
                    <code className="text-zinc-200 font-mono bg-white/[0.06] px-1 rounded break-words inline-block max-w-full">
                      [N_Red N_Yellow N_Green : E_Red E_Yellow E_Green]
                    </code>
                    :
                  </p>
                  <ul className="text-zinc-400 space-y-0.5 font-mono text-[11px] pt-1">
                    <li>
                      • <strong className="text-zinc-200">001L 100 (S0):</strong>{' '}
                      N-S Left Arrow ON (001L), E-W Red ON (100)
                    </li>
                    <li>
                      • <strong className="text-zinc-200">001 100 (S1):</strong>{' '}
                      N-S Green ON (001), E-W Red ON (100)
                    </li>
                    <li>
                      • <strong className="text-zinc-200">010 100 (S2):</strong>{' '}
                      N-S Yellow ON (010), E-W Red ON (100)
                    </li>
                    <li>
                      • <strong className="text-zinc-200">100 100 (S3 &amp; S7):</strong>{' '}
                      Both N-S Red (100) and E-W Red (100) ON (All-Red)
                    </li>
                    <li>
                      • <strong className="text-zinc-200">100 001L (S4):</strong>{' '}
                      N-S Red ON (100), E-W Left Arrow ON (001L)
                    </li>
                    <li>
                      • <strong className="text-zinc-200">100 001 (S5):</strong>{' '}
                      N-S Red ON (100), E-W Green ON (001)
                    </li>
                    <li>
                      • <strong className="text-zinc-200">100 010 (S6):</strong>{' '}
                      N-S Red ON (100), E-W Yellow ON (010)
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ALL BUTTONS & CONTROLS EXPLAINED */}
          {activeTab === 'BUTTONS' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Group 1: Playback & Operating Mode Buttons */}
              <div className="p-4 sm:p-5 bg-white/[0.03] border border-white/[0.08] rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-white font-bold">
                  <Play className="w-4 h-4 text-zinc-300" />
                  <h4>Top Simulation Toolbar & Controller Modes</h4>
                </div>
                <ul className="space-y-2 text-zinc-300">
                  <li>
                    <strong className="text-white">Play / Pause:</strong>{' '}
                    Starts or freezes the 60Hz vehicle physics and signal timers
                    so you can inspect cars and logic states at any moment.
                  </li>
                  <li>
                    <strong className="text-white">Next Phase:</strong>{' '}
                    Immediately advances the controller to the next state in the
                    sequence (`S0 → S1 → S2...`) without waiting for the timer.
                  </li>
                  <li>
                    <strong className="text-white">0.5x / 1x / 2x / 4x:</strong>{' '}
                    Multiplies the simulation clock speed for slow-motion
                    inspection or fast-forward stress testing.
                  </li>
                  <li>
                    <strong className="text-white">Fixed Cycle:</strong>{' '}
                    Standard pre-timed signal loop using the exact durations set
                    on the sliders.
                  </li>
                  <li>
                    <strong className="text-white">Smart Sensor:</strong>{' '}
                    Actuated controller mode—monitors the inductive loop sensors
                    and automatically skips/shortens green phases when no cars
                    are waiting.
                  </li>
                  <li>
                    <strong className="text-white">Manual Hold:</strong>{' '}
                    Freezes automatic phase cycling so the light stays on
                    whichever state you select until you step it manually.
                  </li>
                  <li>
                    <strong className="text-white">Night Flash:</strong>{' '}
                    Places N–S on flashing yellow caution and E–W on flashing
                    red 4-way stop behavior for late-night low-volume operation.
                  </li>
                </ul>
                <div className="pt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onChangeMode('ACTUATED_SMART')}
                    className="h-9 sm:h-8 px-3.5 inline-flex items-center justify-center gap-1.5 text-xs font-semibold leading-none text-white bg-white/[0.08] hover:bg-white hover:text-black border border-white/20 rounded-full transition-all active:scale-[0.98] cursor-pointer"
                  >
                    Try Smart Sensor Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => onChangeMode('NIGHT_FLASH')}
                    className="h-9 sm:h-8 px-3.5 inline-flex items-center justify-center gap-1.5 text-xs font-semibold leading-none text-[#FFD60A] bg-[#FFD60A]/10 hover:bg-[#FFD60A] hover:text-black border border-[#FFD60A]/30 rounded-full transition-all active:scale-[0.98] cursor-pointer"
                  >
                    Try Night Flash Mode
                  </button>
                </div>
              </div>

              {/* Group 2: Vehicle Spawn & Wave Generator Panel */}
              <div className="p-4 sm:p-5 bg-white/[0.03] border border-white/[0.08] rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-white font-bold">
                  <Car className="w-4 h-4 text-zinc-300" />
                  <h4>Vehicle Spawn & Wave Generator Panel</h4>
                </div>
                <ul className="space-y-2 text-zinc-300">
                  <li>
                    <strong className="text-white">
                      1. Vehicle Class (Sedan, SUV, Taxi, Bus):
                    </strong>{' '}
                    Selects the physical chassis dimensions and cruise speed of
                    the next vehicle you inject.
                  </li>
                  <li>
                    <strong className="text-white">
                      2. Turning Maneuver (Auto, Straight, Left ↰, Right ↱):
                    </strong>{' '}
                    Forces the spawned vehicle to either drive straight through,
                    signal and turn 90° Left from the inner lane, or turn 90°
                    Right from the outer lane.
                  </li>
                  <li>
                    <strong className="text-white">
                      3. + Northbound / Southbound / Eastbound / Westbound:
                    </strong>{' '}
                    Immediately spawns a vehicle on that approach (queuing
                    smoothly behind any existing cars).
                  </li>
                  <li>
                    <strong className="text-white">
                      Rush Wave (+8) & Left Wave (+4):
                    </strong>{' '}
                    Injects a simultaneous platoon of vehicles across all four
                    approaches to test queue build-up or protected left-turn
                    capacity.
                  </li>
                </ul>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onSpawnWave}
                    className="h-9 sm:h-8 px-3.5 inline-flex items-center justify-center gap-1.5 text-xs font-semibold leading-none text-black bg-white hover:bg-zinc-200 rounded-full transition-all active:scale-[0.98] cursor-pointer"
                  >
                    Test Rush Wave (+8 Cars) Now
                  </button>
                </div>
              </div>

              {/* Group 3: Emergency Priority & Pedestrian Pushbuttons */}
              <div className="p-4 sm:p-5 bg-white/[0.03] border border-white/[0.08] rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-white font-bold">
                  <Siren className="w-4 h-4 text-[#FF453A]" />
                  <h4>Emergency Priority & Pedestrian Crosswalk Panels</h4>
                </div>
                <ul className="space-y-2 text-zinc-300">
                  <li>
                    <strong className="text-white">
                      Dispatch North / South / East / West:
                    </strong>{' '}
                    Spawns a high-speed Emergency Response Unit with flashing
                    red/blue lightbars and triggers <strong>Opticom Signal Preemption</strong>,
                    immediately switching the intersection to Green for that
                    approach.
                  </li>
                  <li>
                    <strong className="text-white">
                      N–S Convoy (+2) & E–W Convoy (+2):
                    </strong>{' '}
                    Dispatches simultaneous opposing emergency units along an
                    arterial corridor.
                  </li>
                  <li>
                    <strong className="text-white">
                      Walk Signal Mode (Walk Now vs. Queue Call):
                    </strong>{' '}
                    In <em>Walk Now</em> mode, clicking a crosswalk button
                    immediately switches the signal to grant pedestrians a green
                    WALK phase. In <em>Queue Call</em> mode, pedestrians wait on
                    the curb until the next scheduled green phase.
                  </li>
                  <li>
                    <strong className="text-white">
                      + West / East / North / South Crosswalk:
                    </strong>{' '}
                    Spawns pedestrian agents on that specific zebra crosswalk.
                  </li>
                </ul>
                <div className="pt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => onSpawnEmergency('N')}
                    className="h-9 sm:h-8 px-3.5 inline-flex items-center justify-center gap-1.5 text-xs font-semibold leading-none text-[#FF453A] bg-[#FF453A]/10 hover:bg-[#FF453A] hover:text-white border border-[#FF453A]/30 rounded-full transition-all active:scale-[0.98] cursor-pointer"
                  >
                    Test Emergency Dispatch (N)
                  </button>
                  <button
                    type="button"
                    onClick={() => onRequestPedestrianPhase('NS', true)}
                    className="h-9 sm:h-8 px-3.5 inline-flex items-center justify-center gap-1.5 text-xs font-semibold leading-none text-[#30D158] bg-[#30D158]/10 hover:bg-[#30D158] hover:text-black border border-[#30D158]/30 rounded-full transition-all active:scale-[0.98] cursor-pointer"
                  >
                    Test Pedestrian Walk (N–S)
                  </button>
                </div>
              </div>

              {/* Group 4: Hardware Safety Interlock, Left Arrows & Work Zone Controls */}
              <div className="p-4 sm:p-5 bg-white/[0.03] border border-white/[0.08] rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-white font-bold">
                  <ShieldAlert className="w-4 h-4 text-zinc-300" />
                  <h4>Hardware Safety Interlock, Left Arrows &amp; Work Zone Toggles</h4>
                </div>
                <ul className="space-y-2 text-zinc-300">
                  <li>
                    <strong className="text-white">
                      Left Arrows (ON / OFF):
                    </strong>{' '}
                    Toggles between an 8-phase cycle (with Protected Left Arrows
                    `S0` &amp; `S4`) and a classic 6-phase cycle.
                  </li>
                  <li>
                    <strong className="text-white">
                      Work Zone (ACTIVE / CLEAR):
                    </strong>{' '}
                    Places orange construction cones closing the outer
                    Westbound lane, forcing all traffic into a single-lane
                    bottleneck.
                  </li>
                  <li>
                    <strong className="text-white">
                      Inject / Clear MMU Fault:
                    </strong>{' '}
                    Simulates a hardware conflict fault that trips the
                    Malfunction Management Unit into emergency all-way flashing
                    red lockout.
                  </li>
                </ul>
                <div className="pt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={onToggleMmuFault}
                    className="h-9 sm:h-8 px-3.5 inline-flex items-center justify-center gap-1.5 text-xs font-semibold leading-none text-[#FF453A] bg-[#FF453A]/15 hover:bg-[#FF453A] hover:text-white border border-[#FF453A]/40 rounded-full transition-all active:scale-[0.98] cursor-pointer"
                  >
                    Toggle MMU Conflict Fault
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: DIAGRAMS & DIGITAL LOGIC EXPLAINED */}
          {activeTab === 'DIAGRAMS' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 sm:p-5 bg-white/[0.03] border border-white/[0.08] rounded-2xl space-y-2.5">
                <div className="flex items-center gap-2 text-white font-bold">
                  <GitCommitHorizontal className="w-4 h-4 text-zinc-300" />
                  <h4>1. 8-State Finite State Machine (FSM) Diagram</h4>
                </div>
                <p className="text-zinc-300 leading-relaxed">
                  The <strong className="text-white">FSM Diagram</strong> visualizes the traffic
                  controller as a sequential state graph with 8 nodes (
                  <code className="text-zinc-200 font-mono bg-white/[0.06] px-1 rounded">S0</code> through{' '}
                  <code className="text-zinc-200 font-mono bg-white/[0.06] px-1 rounded">S7</code>):
                </p>
                <ul className="space-y-1.5 text-zinc-300 list-disc pl-4 text-xs">
                  <li>
                    <strong className="text-white">State Nodes:</strong> Each box shows its state code
                    (e.g., <code className="font-mono text-zinc-200">S1</code>), 3-bit flip-flop address (
                    <code className="font-mono text-zinc-200">001₂</code>), remaining countdown timer, and live signal heads.
                  </li>
                  <li>
                    <strong className="text-white">Directed Transition Arrows:</strong> Show the exact
                    cyclic sequence order and duration conditions required to advance to the next state.
                  </li>
                  <li>
                    <strong className="text-white">Central PLC Register Core:</strong> Displays the
                    active state name and 6-bit binary lamp output word{' '}
                    <code className="font-mono text-zinc-200 bg-white/[0.06] px-1 rounded">[N_RYG : E_RYG]</code>.
                  </li>
                  <li>
                    <strong className="text-white">Interactive Jump:</strong> Clicking any state node in the
                    diagram immediately jumps the intersection to that phase.
                  </li>
                </ul>
              </div>

              <div className="p-4 sm:p-5 bg-white/[0.03] border border-white/[0.08] rounded-2xl space-y-2.5">
                <div className="flex items-center gap-2 text-white font-bold">
                  <Cpu className="w-4 h-4 text-zinc-300 shrink-0" />
                  <h4>2. Digital Logic Gate & MMU Conflict Schematic</h4>
                </div>
                <p className="text-zinc-300 leading-relaxed">
                  Switching the diagram toggle to{' '}
                  <strong className="text-white">Digital Logic Gate Circuit</strong> reveals the
                  internal hardware schematic of the signal cabinet:
                </p>
                <ul className="space-y-1.5 text-zinc-300 list-disc pl-4 text-xs">
                  <li>
                    <strong className="text-white">3-Bit D-Flip-Flop Register (Q2, Q1, Q0):</strong>{' '}
                    Stores the current state number in binary from{' '}
                    <code className="font-mono text-zinc-200">000₂</code> (S0) to{' '}
                    <code className="font-mono text-zinc-200">111₂</code> (S7). Logic wires illuminate when energized.
                  </li>
                  <li>
                    <strong className="text-white">Combinational PLA Decoder:</strong> Evaluates
                    boolean minterms (such as <code className="font-mono text-zinc-200">G_NS = Q2′ · Q1′</code>) to
                    energize the appropriate Red, Yellow, or Green load switches.
                  </li>
                  <li>
                    <strong className="text-white">MMU Conflict Monitor (AND Gate):</strong> Hardware
                    safety circuit that continuously checks{' '}
                    <code className="font-mono text-zinc-200">FAULT = G_NS ∧ G_EW</code>. If both N–S and E–W greens
                    are ever active simultaneously, it trips the relay into all-red flashing lockout.
                  </li>
                </ul>
              </div>

              <div className="p-4 sm:p-5 bg-white/[0.03] border border-white/[0.08] rounded-2xl space-y-2.5">
                <div className="flex items-center gap-2 text-white font-bold">
                  <Layers className="w-4 h-4 text-zinc-300" />
                  <h4>3. Synchronized Signal Timing Waveform</h4>
                </div>
                <p className="text-zinc-300 leading-relaxed">
                  Below the state diagram is the{' '}
                  <strong className="text-white">Multi-Channel Timing Waveform</strong> (Gantt
                  chart):
                </p>
                <ul className="space-y-1.5 text-zinc-300 list-disc pl-4 text-xs">
                  <li>
                    <strong className="text-white">Horizontal Time Axis:</strong> Represents the complete
                    signal cycle period in seconds, divided proportionally by each state’s duration.
                  </li>
                  <li>
                    <strong className="text-white">3 Synchronized Channels:</strong> Shows{' '}
                    <code className="font-mono text-zinc-200">N–S Signal</code>, <code className="font-mono text-zinc-200">E–W Signal</code>, and{' '}
                    <code className="font-mono text-zinc-200">Pedestrians</code> stacked vertically so you can
                    verify clearance intervals.
                  </li>
                  <li>
                    <strong className="text-white">Sweeping Playhead:</strong> Moves continuously
                    from left to right in real time with the simulation clock,
                    and clicking any phase column jumps the playhead to that state.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 5: APPROACH QUEUE & SENSOR TELEMETRY EXPLAINED */}
          {activeTab === 'TELEMETRY' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 sm:p-5 bg-white/[0.03] border border-white/[0.08] rounded-2xl space-y-2.5">
                <div className="flex items-center gap-2 text-white font-bold">
                  <Activity className="w-4 h-4 text-zinc-300 shrink-0" />
                  <h4>Directional Queue Saturation & Approach Capacity</h4>
                </div>
                <p className="text-zinc-300 leading-relaxed">
                  Each of the four cardinal approaches (<strong className="text-white">Northbound</strong>,{' '}
                  <strong className="text-white">Southbound</strong>, <strong className="text-white">Eastbound</strong>, and{' '}
                  <strong className="text-white">Westbound</strong>) includes real-time telemetry
                  tracking active traveling vehicles and stopped queues:
                </p>
                <ul className="space-y-2 text-zinc-300 pt-1 text-xs">
                  <li>
                    <strong className="text-white">
                      Active vs. Queued Vehicles:
                    </strong>{' '}
                    Distinguishes vehicles currently cruising on that approach from those stopped
                    waiting behind the white stop line.
                  </li>
                  <li>
                    <strong className="text-white">
                      Saturation Progress Bar:
                    </strong>{' '}
                    Fills proportionally as the approach queue builds toward capacity,
                    providing immediate visual feedback on arterial congestion.
                  </li>
                  <li>
                    <strong className="text-white">
                      One-Click Approach Vehicle Injection (+ Car):
                    </strong>{' '}
                    Each row in the Approach Queue table includes a quick{' '}
                    <code className="font-mono text-zinc-200 bg-white/[0.06] px-1 rounded">+ Car</code> button to immediately test sensor
                    detection and queue buildup on that approach.
                  </li>
                </ul>
              </div>

              <div className="p-4 sm:p-5 bg-white/[0.03] border border-white/[0.08] rounded-2xl space-y-2.5">
                <div className="flex items-center gap-2 text-white font-bold">
                  <Sliders className="w-4 h-4 text-zinc-300" />
                  <h4>Approach Queue & Inductive Loop Sensor Telemetry</h4>
                </div>
                <ul className="space-y-2 text-zinc-300 text-xs">
                  <li>
                    <strong className="text-white">
                      Loop Sensor (DETECTED vs. CLEAR):
                    </strong>{' '}
                    Indicates whether a vehicle is currently occupying the
                    inductive road loop embedded ahead of the stop line on North, South,
                    East, or West.
                  </li>
                  <li>
                    <strong className="text-white">
                      Queue (Left) Counter:
                    </strong>{' '}
                    Displays both the total number of stopped vehicles on that
                    approach and how many of them are waiting to make a Left
                    turn (e.g., <code className="font-mono text-zinc-200">4 (2L)</code>).
                  </li>
                  <li>
                    <strong className="text-white">
                      Wait Time per Approach:
                    </strong>{' '}
                    Tracks the average stopped delay in seconds for vehicles on
                    that specific directional approach.
                  </li>
                  <li>
                    <strong className="text-white">
                      PLC Truth Table &amp; Controller Log:
                    </strong>{' '}
                    Switch to Tab 2 (
                    <button
                      type="button"
                      onClick={() => setActiveTab('PLC_TRUTH_LOG')}
                      className="text-white underline hover:text-zinc-300 font-semibold cursor-pointer ml-1"
                    >
                      2. PLC Truth Table &amp; Controller Log
                    </button>
                    ) for the complete 6-part breakdown of states S0–S7, Q2 Q1
                    Q0 binary codes, and transition logs.
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
