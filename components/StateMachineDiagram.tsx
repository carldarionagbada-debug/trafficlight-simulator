'use client';

import React, { useState } from 'react';
import {
  ControlMode,
  PhaseId,
  PhaseTimingConfig,
} from '@/types/simulation';
import {
  PHASE_DEFINITIONS,
  PHASE_ORDER,
  getActivePhaseOrder,
  getPhaseDuration,
  getTotalCycleDuration,
} from '@/lib/simulation-data';
import {
  GitCommitHorizontal,
  Clock,
  Cpu,
  Columns2,
  Maximize2,
  Minimize2,
  Zap,
  Play,
} from 'lucide-react';

interface StateMachineDiagramProps {
  currentPhase: PhaseId;
  controlMode: ControlMode;
  protectedLeftEnabled: boolean;
  mmuFaultLockout: boolean;
  phaseTimeRemaining: number;
  timings: PhaseTimingConfig;
  cycleCount: number;
  onSelectPhase: (phase: PhaseId, reason: string) => void;
  onToggleMmuFault: () => void;
}

// High-Resolution 8-Node Rectangular Loop Layout (1200 x 620 Canvas)
const FSM_NODES: Record<PhaseId, { x: number; y: number }> = {
  NS_LEFT: { x: 165, y: 112 },
  NS_GREEN: { x: 455, y: 112 },
  NS_YELLOW: { x: 745, y: 112 },
  ALL_RED_1: { x: 1035, y: 112 },
  EW_LEFT: { x: 1035, y: 508 },
  EW_GREEN: { x: 745, y: 508 },
  EW_YELLOW: { x: 455, y: 508 },
  ALL_RED_2: { x: 165, y: 508 },
};

const FSM_EDGES: {
  from: PhaseId;
  to: PhaseId;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  badgeX: number;
  badgeY: number;
  arrowPoints: string;
}[] = [
  {
    from: 'NS_LEFT',
    to: 'NS_GREEN',
    x1: 272,
    y1: 112,
    x2: 342,
    y2: 112,
    badgeX: 307,
    badgeY: 78,
    arrowPoints: '333,105.5 347,112 333,118.5',
  },
  {
    from: 'NS_GREEN',
    to: 'NS_YELLOW',
    x1: 562,
    y1: 112,
    x2: 632,
    y2: 112,
    badgeX: 597,
    badgeY: 78,
    arrowPoints: '623,105.5 637,112 623,118.5',
  },
  {
    from: 'NS_YELLOW',
    to: 'ALL_RED_1',
    x1: 852,
    y1: 112,
    x2: 922,
    y2: 112,
    badgeX: 887,
    badgeY: 78,
    arrowPoints: '913,105.5 927,112 913,118.5',
  },
  {
    from: 'ALL_RED_1',
    to: 'EW_LEFT',
    x1: 1035,
    y1: 174,
    x2: 1035,
    y2: 440,
    badgeX: 1102,
    badgeY: 310,
    arrowPoints: '1028.5,431 1035,445 1041.5,431',
  },
  {
    from: 'EW_LEFT',
    to: 'EW_GREEN',
    x1: 928,
    y1: 508,
    x2: 858,
    y2: 508,
    badgeX: 893,
    badgeY: 542,
    arrowPoints: '867,501.5 853,508 867,514.5',
  },
  {
    from: 'EW_GREEN',
    to: 'EW_YELLOW',
    x1: 638,
    y1: 508,
    x2: 568,
    y2: 508,
    badgeX: 603,
    badgeY: 542,
    arrowPoints: '577,501.5 563,508 577,514.5',
  },
  {
    from: 'EW_YELLOW',
    to: 'ALL_RED_2',
    x1: 348,
    y1: 508,
    x2: 278,
    y2: 508,
    badgeX: 313,
    badgeY: 542,
    arrowPoints: '287,501.5 273,508 287,514.5',
  },
  {
    from: 'ALL_RED_2',
    to: 'NS_LEFT',
    x1: 165,
    y1: 446,
    x2: 165,
    y2: 180,
    badgeX: 98,
    badgeY: 310,
    arrowPoints: '158.5,189 165,175 171.5,189',
  },
];

export default function StateMachineDiagram({
  currentPhase,
  controlMode,
  protectedLeftEnabled,
  mmuFaultLockout,
  phaseTimeRemaining,
  timings,
  cycleCount,
  onSelectPhase,
  onToggleMmuFault,
}: StateMachineDiagramProps) {
  const [diagramMode, setDiagramMode] = useState<'FSM' | 'SCHEMATIC' | 'BOTH'>('FSM');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  const activeOrder = getActivePhaseOrder(protectedLeftEnabled);
  const totalCycle = getTotalCycleDuration(timings, protectedLeftEnabled);
  const currentDuration = getPhaseDuration(currentPhase, timings);
  const clampedRemaining = Math.max(0, Math.min(currentDuration, phaseTimeRemaining));
  const elapsedInPhase = Math.max(0, currentDuration - clampedRemaining);
  const phaseProgress =
    currentDuration > 0 ? Math.min(1, Math.max(0, elapsedInPhase / currentDuration)) : 0;
  // Minimum non-zero visual progress prevents zero-length SVG <line> cap dropout at phase start
  const visualProgress = Math.max(0.03, phaseProgress);

  let elapsedBeforePhase = 0;
  let foundInActiveOrder = false;
  for (const p of activeOrder) {
    if (p === currentPhase) {
      foundInActiveOrder = true;
      break;
    }
    elapsedBeforePhase += getPhaseDuration(p, timings);
  }
  const cycleElapsed = foundInActiveOrder
    ? Math.min(totalCycle, elapsedBeforePhase + elapsedInPhase)
    : Math.min(totalCycle, elapsedInPhase);
  const cyclePlayheadPct =
    totalCycle > 0 ? Math.min(100, Math.max(0, (cycleElapsed / totalCycle) * 100)) : 0;

  const activeOrderIndex = activeOrder.indexOf(currentPhase);

  const activeMeta = PHASE_DEFINITIONS[currentPhase];
  const q2 = activeMeta.qBits[0] === '1';
  const q1 = activeMeta.qBits[1] === '1';
  const q0 = activeMeta.qBits[2] === '1';

  const nsGreenActive =
    !mmuFaultLockout &&
    (activeMeta.nsColor === 'GREEN' || activeMeta.nsColor === 'LEFT_GREEN');
  const ewGreenActive =
    !mmuFaultLockout &&
    (activeMeta.ewColor === 'GREEN' || activeMeta.ewColor === 'LEFT_GREEN');

  // Exact sub-pixel widths for SVG progress bars (no <clipPath> url(#...) re-evaluation needed)
  const centerCoreProgressWidth = Number((450 * visualProgress).toFixed(2));
  const nodeProgressWidth = Number((184 * visualProgress).toFixed(2));
  const phaseScaleX = Number(visualProgress.toFixed(4));

  // Fixed-width tabular strings so text nodes never shift horizontally during countdown
  const formattedRemaining = clampedRemaining.toFixed(1).padStart(4, '0');
  const formattedDuration = currentDuration.toFixed(1).padStart(4, '0');
  const formattedCycleElapsed = cycleElapsed.toFixed(1).padStart(4, '0');
  const formattedTotalCycle = totalCycle.toFixed(1).padStart(4, '0');
  const formattedPlayheadPct = Math.round(cyclePlayheadPct)
    .toString()
    .padStart(3, '\u00A0');

  const renderFsmSvg = () => (
    <svg
      viewBox="0 0 1200 620"
      className={`w-full h-auto select-none ${
        isExpanded ? 'lg:min-h-[620px]' : 'lg:min-h-[560px]'
      }`}
      aria-label="Traffic Light Controller 8-State Finite State Machine Diagram"
    >
      <defs>
        <pattern
          id="fsmGrid"
          width="30"
          height="30"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 30 0 L 0 0 0 30"
            fill="none"
            stroke="#1e293b"
            strokeWidth="0.6"
            strokeOpacity="0.55"
          />
        </pattern>
      </defs>

      {/* Blueprint Engineering Background */}
      <rect
        x="10"
        y="10"
        width="1180"
        height="600"
        rx="16"
        fill="#060a12"
        stroke="#1e293b"
        strokeWidth="1.5"
      />
      <rect
        x="10"
        y="10"
        width="1180"
        height="600"
        rx="16"
        fill="url(#fsmGrid)"
      />

      {/* Top & Bottom Ring Group Sub-Headers */}
      <g transform="translate(600, 34)">
        <rect
          x="-230"
          y="-14"
          width="460"
          height="24"
          rx="6"
          fill="#0f172a"
          stroke="#1e293b"
        />
        <text
          x="0"
          y="2"
          textAnchor="middle"
          fill="#94a3b8"
          fontSize="11"
          className="font-mono"
          fontWeight="700"
          letterSpacing="0.08em"
        >
          RING A · NORTH–SOUTH RIGHT-OF-WAY SEQUENCE (S0 → S1 → S2 → S3)
        </text>
      </g>

      <g transform="translate(600, 588)">
        <rect
          x="-230"
          y="-14"
          width="460"
          height="24"
          rx="6"
          fill="#0f172a"
          stroke="#1e293b"
        />
        <text
          x="0"
          y="2"
          textAnchor="middle"
          fill="#94a3b8"
          fontSize="11"
          className="font-mono"
          fontWeight="700"
          letterSpacing="0.08em"
        >
          RING B · EAST–WEST RIGHT-OF-WAY SEQUENCE (S4 → S5 → S6 → S7)
        </text>
      </g>

      {/* Center PLC Controller Telemetry Core */}
      <g transform="translate(600, 310)">
        <rect
          x="-275"
          y="-108"
          width="550"
          height="216"
          rx="16"
          fill="#0b1120"
          stroke={mmuFaultLockout ? '#ef4444' : '#38bdf8'}
          strokeOpacity={mmuFaultLockout ? 0.9 : 0.45}
          strokeWidth="2"
        />
        <rect
          x="-267"
          y="-100"
          width="534"
          height="200"
          rx="12"
          fill="#0f172a"
          stroke="#1e293b"
          strokeWidth="1.5"
        />

        {/* Top Status Ribbon inside Center Core */}
        <rect
          x="-245"
          y="-84"
          width="490"
          height="28"
          rx="6"
          fill={mmuFaultLockout ? '#450a0a' : '#020617'}
          stroke={mmuFaultLockout ? '#ef4444' : '#1e293b'}
        />
        <circle
          cx="-226"
          cy="-70"
          r="5"
          fill={mmuFaultLockout ? '#ef4444' : '#38bdf8'}
        />
        <text
          x="0"
          y="-66"
          textAnchor="middle"
          fill={mmuFaultLockout ? '#fca5a5' : '#7dd3fc'}
          fontSize="12"
          className="font-mono tabular-nums"
          fontWeight="700"
          letterSpacing="0.06em"
        >
          {mmuFaultLockout
            ? 'MMU CONFLICT LOCKOUT · ALL-RED FLASH INTERLOCK'
            : `PLC STATE REGISTER · STATE ${activeMeta.code} (${activeMeta.qBits}₂)`}
        </text>

        {/* Active Phase Main Display Title */}
        <text
          x="0"
          y="-32"
          textAnchor="middle"
          fill="#f8fafc"
          fontSize="20"
          fontWeight="700"
        >
          {mmuFaultLockout
            ? 'Hardware Safety Interlock Active'
            : controlMode === 'NIGHT_FLASH'
            ? 'NIGHT HAZARD FLASH OVERRIDE'
            : activeMeta.title}
        </text>

        {/* 3-Bit Register Live LED Readout Row + Load Switch Word */}
        <g transform="translate(0, 6)">
          <g transform="translate(-225, -16)">
            <rect
              x="0"
              y="0"
              width="86"
              height="34"
              rx="6"
              fill={q2 ? '#082f49' : '#020617'}
              stroke={q2 ? '#38bdf8' : '#334155'}
              strokeWidth="1.5"
            />
            <text
              x="12"
              y="21"
              fill="#94a3b8"
              fontSize="11.5"
              className="font-mono"
              fontWeight="600"
            >
              Q2:
            </text>
            <text
              x="72"
              y="22"
              textAnchor="end"
              fill={q2 ? '#38bdf8' : '#64748b'}
              fontSize="14"
              className="font-mono tabular-nums"
              fontWeight="700"
            >
              {q2 ? '1' : '0'}
            </text>
          </g>

          <g transform="translate(-131, -16)">
            <rect
              x="0"
              y="0"
              width="86"
              height="34"
              rx="6"
              fill={q1 ? '#082f49' : '#020617'}
              stroke={q1 ? '#38bdf8' : '#334155'}
              strokeWidth="1.5"
            />
            <text
              x="12"
              y="21"
              fill="#94a3b8"
              fontSize="11.5"
              className="font-mono"
              fontWeight="600"
            >
              Q1:
            </text>
            <text
              x="72"
              y="22"
              textAnchor="end"
              fill={q1 ? '#38bdf8' : '#64748b'}
              fontSize="14"
              className="font-mono tabular-nums"
              fontWeight="700"
            >
              {q1 ? '1' : '0'}
            </text>
          </g>

          <g transform="translate(-37, -16)">
            <rect
              x="0"
              y="0"
              width="86"
              height="34"
              rx="6"
              fill={q0 ? '#082f49' : '#020617'}
              stroke={q0 ? '#38bdf8' : '#334155'}
              strokeWidth="1.5"
            />
            <text
              x="12"
              y="21"
              fill="#94a3b8"
              fontSize="11.5"
              className="font-mono"
              fontWeight="600"
            >
              Q0:
            </text>
            <text
              x="72"
              y="22"
              textAnchor="end"
              fill={q0 ? '#38bdf8' : '#64748b'}
              fontSize="14"
              className="font-mono tabular-nums"
              fontWeight="700"
            >
              {q0 ? '1' : '0'}
            </text>
          </g>

          <g transform="translate(59, -16)">
            <rect
              x="0"
              y="0"
              width="166"
              height="34"
              rx="6"
              fill="#020617"
              stroke="#334155"
              strokeWidth="1.5"
            />
            <text
              x="83"
              y="21"
              textAnchor="middle"
              fill="#38bdf8"
              fontSize="12"
              className="font-mono tabular-nums"
              fontWeight="700"
            >
              OUT: {mmuFaultLockout ? '100F 100F' : activeMeta.binaryOutput}
            </text>
          </g>
        </g>

        {/* Flicker-Free Direct Rect Progress Bar inside Center Core (No url(#clipPath) re-evaluation) */}
        <g transform="translate(-225, 34)">
          <rect
            x="0"
            y="0"
            width="450"
            height="10"
            rx="5"
            fill="#020617"
            stroke="#1e293b"
          />
          <rect
            x="0"
            y="0"
            width={centerCoreProgressWidth}
            height="10"
            rx="5"
            fill={mmuFaultLockout ? '#ef4444' : '#38bdf8'}
          />
        </g>

        {/* 3 Fixed-Position Tabular Readout Boxes (Eliminates centered string shifting at 60fps) */}
        <g transform="translate(0, 66)">
          <rect
            x="-225"
            y="-14"
            width="154"
            height="22"
            rx="5"
            fill="#020617"
            stroke="#1e293b"
          />
          <text
            x="-148"
            y="1"
            textAnchor="middle"
            fill="#cbd5e1"
            fontSize="11"
            className="font-mono tabular-nums"
            fontWeight="600"
          >
            BOOL: {activeMeta.booleanExpr}
          </text>

          <rect
            x="-65"
            y="-14"
            width="150"
            height="22"
            rx="5"
            fill="#020617"
            stroke="#1e293b"
          />
          <text
            x="10"
            y="1"
            textAnchor="middle"
            fill="#7dd3fc"
            fontSize="11"
            className="font-mono tabular-nums"
            fontWeight="700"
          >
            TIMER: {formattedRemaining}s / {formattedDuration}s
          </text>

          <rect
            x="91"
            y="-14"
            width="134"
            height="22"
            rx="5"
            fill="#020617"
            stroke="#1e293b"
          />
          <text
            x="158"
            y="1"
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="11"
            className="font-mono tabular-nums"
            fontWeight="600"
          >
            CYCLE #{cycleCount} · {formattedTotalCycle}s
          </text>
        </g>

        <text
          x="0"
          y="91"
          textAnchor="middle"
          fill="#64748b"
          fontSize="11"
          className="font-mono"
        >
          Interactive PLC Control: Click any state node (S0–S7) to jump immediately
        </text>
      </g>

      {/* Directed State Transition Conduits & Smooth Progressive Line Fill (Zero Marker/Clip Flicker) */}
      {FSM_EDGES.map((edge) => {
        const isDirectActive = edge.from === currentPhase && !mmuFaultLockout;
        const isBypassContinuation =
          !mmuFaultLockout &&
          !protectedLeftEnabled &&
          ((currentPhase === 'ALL_RED_1' && edge.from === 'EW_LEFT') ||
            (currentPhase === 'ALL_RED_2' && edge.from === 'NS_LEFT'));
        const isActiveEdge = isDirectActive || isBypassContinuation;

        const duration = getPhaseDuration(edge.from, timings);
        const loadX = Number(
          (edge.x1 + (edge.x2 - edge.x1) * visualProgress).toFixed(2)
        );
        const loadY = Number(
          (edge.y1 + (edge.y2 - edge.y1) * visualProgress).toFixed(2)
        );

        return (
          <g key={`${edge.from}-${edge.to}`}>
            {/* Outer Conduit Track */}
            <line
              x1={edge.x1}
              y1={edge.y1}
              x2={edge.x2}
              y2={edge.y2}
              stroke={isActiveEdge ? '#0ea5e9' : '#1e293b'}
              strokeOpacity={isActiveEdge ? 0.25 : 0.9}
              strokeWidth={isActiveEdge ? '10' : '8'}
              strokeLinecap="round"
            />
            {/* Solid Base Wire + Inline Polygon Arrowhead (Zero url(#marker) Repaint Flicker) */}
            <line
              x1={edge.x1}
              y1={edge.y1}
              x2={edge.x2}
              y2={edge.y2}
              stroke={isActiveEdge ? '#0369a1' : '#475569'}
              strokeWidth="2.5"
            />
            <polygon
              points={edge.arrowPoints}
              fill={isActiveEdge ? '#38bdf8' : '#475569'}
            />
            {/* Smooth Progressive Loading Line Along Active Conduit */}
            {isActiveEdge && (
              <>
                <line
                  x1={edge.x1}
                  y1={edge.y1}
                  x2={loadX}
                  y2={loadY}
                  stroke="#38bdf8"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <circle
                  cx={loadX}
                  cy={loadY}
                  r="6"
                  fill="#38bdf8"
                  fillOpacity="0.3"
                />
                <circle cx={loadX} cy={loadY} r="3.2" fill="#f0f9ff" />
              </>
            )}
            {/* Pill Badge for Transition Timer */}
            <g transform={`translate(${edge.badgeX}, ${edge.badgeY})`}>
              <rect
                x="-32"
                y="-13"
                width="64"
                height="24"
                rx="6"
                fill={isActiveEdge ? '#082f49' : '#0f172a'}
                stroke={isActiveEdge ? '#38bdf8' : '#334155'}
                strokeWidth="1.5"
              />
              <text
                x="0"
                y="3"
                textAnchor="middle"
                fill={isActiveEdge ? '#7dd3fc' : '#94a3b8'}
                fontSize="12"
                className="font-mono tabular-nums"
                fontWeight="700"
              >
                {duration}s
              </text>
            </g>
          </g>
        );
      })}

      {/* 8 Large High-Detail Interactive State Nodes */}
      {PHASE_ORDER.map((phaseId) => {
        const meta = PHASE_DEFINITIONS[phaseId];
        const pos = FSM_NODES[phaseId];
        const isBypassed =
          !protectedLeftEnabled &&
          (phaseId === 'NS_LEFT' || phaseId === 'EW_LEFT');
        const isCurrent =
          currentPhase === phaseId &&
          controlMode !== 'NIGHT_FLASH' &&
          !mmuFaultLockout;
        const duration = getPhaseDuration(phaseId, timings);

        const nsColor = meta.nsColor;
        const ewColor = meta.ewColor;

        const nsLampR = nsColor === 'RED';
        const nsLampY = nsColor === 'YELLOW';
        const nsLampG = nsColor === 'GREEN' || nsColor === 'LEFT_GREEN';

        const ewLampR = ewColor === 'RED';
        const ewLampY = ewColor === 'YELLOW';
        const ewLampG = ewColor === 'GREEN' || ewColor === 'LEFT_GREEN';

        return (
          <g
            key={phaseId}
            transform={`translate(${pos.x}, ${pos.y})`}
            onClick={() =>
              onSelectPhase(
                phaseId,
                `FSM Diagram State Jump (${meta.code})`
              )
            }
            opacity={isBypassed ? 0.45 : 1}
            className="cursor-pointer group"
            role="button"
            aria-label={`Jump to State ${meta.code}: ${meta.shortTitle}`}
          >
            {/* Flicker-Free Static Vector Halo Rings */}
            {isCurrent && (
              <>
                <rect
                  x="-116"
                  y="-67"
                  width="232"
                  height="134"
                  rx="18"
                  fill="none"
                  stroke="#0ea5e9"
                  strokeOpacity="0.28"
                  strokeWidth="6"
                />
                <rect
                  x="-111"
                  y="-62"
                  width="222"
                  height="124"
                  rx="15"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2.5"
                />
              </>
            )}

            {/* Node Card Chassis (212 x 114) */}
            <rect
              x="-106"
              y="-57"
              width="212"
              height="114"
              rx="12"
              fill={isCurrent ? '#0f172a' : '#0b1120'}
              stroke={isCurrent ? '#38bdf8' : '#334155'}
              strokeWidth={isCurrent ? '2.5' : '1.75'}
              className="group-hover:stroke-sky-400"
            />

            {/* Top Header Strip inside State Node */}
            <rect
              x="-104"
              y="-55"
              width="208"
              height="28"
              rx="10"
              fill={isCurrent ? '#082f49' : '#111827'}
            />

            {/* State Code & 3-Bit Binary */}
            <text
              x="-92"
              y="-36"
              fill={isCurrent ? '#38bdf8' : '#94a3b8'}
              fontSize="13"
              className="font-mono tabular-nums"
              fontWeight="700"
            >
              {meta.code} ({meta.qBits}₂)
            </text>

            {/* Countdown or Phase Duration (Fixed-Width Padded Tabular Numerals) */}
            <text
              x="92"
              y="-36"
              textAnchor="end"
              fill={isCurrent ? '#f8fafc' : '#94a3b8'}
              fontSize="13"
              className="font-mono tabular-nums"
              fontWeight="700"
            >
              {isCurrent ? `${formattedRemaining}s` : `${duration.toFixed(1)}s`}
            </text>

            {/* Phase Name */}
            <text
              x="0"
              y="-6"
              textAnchor="middle"
              fill={isCurrent ? '#ffffff' : '#e2e8f0'}
              fontSize="15.5"
              fontWeight="700"
            >
              {meta.shortTitle}
            </text>

            {/* Mini Dual Signal Head Status Modules (NS & EW) */}
            <g transform="translate(0, 22)">
              <g transform="translate(-88, -12)">
                <rect
                  x="0"
                  y="0"
                  width="82"
                  height="24"
                  rx="6"
                  fill="#020617"
                  stroke="#1e293b"
                />
                <text
                  x="8"
                  y="16"
                  fill="#cbd5e1"
                  fontSize="11"
                  className="font-mono"
                  fontWeight="700"
                >
                  NS
                </text>
                <circle
                  cx="38"
                  cy="12"
                  r="5"
                  fill={nsLampR ? '#ef4444' : '#2a1215'}
                />
                <circle
                  cx="53"
                  cy="12"
                  r="5"
                  fill={nsLampY ? '#f59e0b' : '#292112'}
                />
                <circle
                  cx="68"
                  cy="12"
                  r="5"
                  fill={
                    nsColor === 'LEFT_GREEN'
                      ? '#14b8a6'
                      : nsLampG
                      ? '#10b981'
                      : '#0d261f'
                  }
                />
              </g>

              <g transform="translate(6, -12)">
                <rect
                  x="0"
                  y="0"
                  width="82"
                  height="24"
                  rx="6"
                  fill="#020617"
                  stroke="#1e293b"
                />
                <text
                  x="8"
                  y="16"
                  fill="#cbd5e1"
                  fontSize="11"
                  className="font-mono"
                  fontWeight="700"
                >
                  EW
                </text>
                <circle
                  cx="38"
                  cy="12"
                  r="5"
                  fill={ewLampR ? '#ef4444' : '#2a1215'}
                />
                <circle
                  cx="53"
                  cy="12"
                  r="5"
                  fill={ewLampY ? '#f59e0b' : '#292112'}
                />
                <circle
                  cx="68"
                  cy="12"
                  r="5"
                  fill={
                    ewColor === 'LEFT_GREEN'
                      ? '#14b8a6'
                      : ewLampG
                      ? '#10b981'
                      : '#0d261f'
                  }
                />
              </g>
            </g>

            {/* Flicker-Free Direct Progress Track inside Node (No shared url(#nodeProgressClip)) */}
            <rect
              x="-92"
              y="44"
              width="184"
              height="5"
              rx="2.5"
              fill="#020617"
            />
            {isCurrent && (
              <rect
                x="-92"
                y="44"
                width={nodeProgressWidth}
                height="5"
                rx="2.5"
                fill="#38bdf8"
              />
            )}
          </g>
        );
      })}
    </svg>
  );

  const renderSchematicSvg = () => (
    <svg
      viewBox="0 0 1200 540"
      className={`w-full h-auto select-none ${
        isExpanded ? 'lg:min-h-[540px]' : 'lg:min-h-[500px]'
      }`}
      aria-label="Digital Logic Gate & MMU Conflict Monitor Schematic"
    >
      <defs>
        <pattern
          id="schematicGrid"
          width="30"
          height="30"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 30 0 L 0 0 0 30"
            fill="none"
            stroke="#1e293b"
            strokeWidth="0.6"
            strokeOpacity="0.55"
          />
        </pattern>
      </defs>
      <rect
        x="10"
        y="10"
        width="1180"
        height="520"
        rx="16"
        fill="#060a12"
        stroke="#1e293b"
        strokeWidth="1.5"
      />
      <rect
        x="10"
        y="10"
        width="1180"
        height="520"
        rx="16"
        fill="url(#schematicGrid)"
      />

      {/* Column 1: 3-Bit D-Flip-Flop State Register (Q2, Q1, Q0) */}
      <g transform="translate(45, 45)">
        <rect
          x="0"
          y="0"
          width="240"
          height="450"
          rx="12"
          fill="#0f172a"
          stroke="#334155"
          strokeWidth="2"
        />
        <rect
          x="0"
          y="0"
          width="240"
          height="42"
          rx="12"
          fill="#111827"
        />
        <text
          x="120"
          y="26"
          textAnchor="middle"
          fill="#38bdf8"
          fontSize="13.5"
          className="font-mono"
          fontWeight="700"
        >
          3-BIT D-FLIP-FLOP REGISTER
        </text>

        {[
          { label: 'Q2 (MSB · RING)', val: q2, y: 95 },
          { label: 'Q1 (BIT 1 ·SEQ)', val: q1, y: 220 },
          { label: 'Q0 (LSB · STEP)', val: q0, y: 345 },
        ].map((bit) => (
          <g key={bit.label} transform={`translate(22, ${bit.y})`}>
            <rect
              x="0"
              y="-30"
              width="196"
              height="82"
              rx="10"
              fill={bit.val ? '#082f49' : '#020617'}
              stroke={bit.val ? '#38bdf8' : '#1e293b'}
              strokeWidth="2"
            />
            <text
              x="16"
              y="-4"
              fill="#94a3b8"
              fontSize="11.5"
              className="font-mono"
              fontWeight="600"
            >
              {bit.label}
            </text>
            <text
              x="16"
              y="26"
              fill={bit.val ? '#f8fafc' : '#64748b'}
              fontSize="15"
              className="font-mono tabular-nums"
              fontWeight="700"
            >
              {bit.val ? 'HIGH (5.0V)' : 'LOW (0.0V)'}
            </text>
            <circle
              cx="166"
              cy="12"
              r="14"
              fill={bit.val ? '#0284c7' : '#0f172a'}
              stroke={bit.val ? '#38bdf8' : '#334155'}
              strokeWidth="2"
            />
            <text
              x="166"
              y="17"
              textAnchor="middle"
              fill={bit.val ? '#ffffff' : '#64748b'}
              fontSize="15"
              className="font-mono tabular-nums"
              fontWeight="700"
            >
              {bit.val ? '1' : '0'}
            </text>
          </g>
        ))}
      </g>

      {/* Energized Bus Wires from Register to Combinational Decoder (Solid + Smooth Progress Orb) */}
      {[
        { y: 152, val: q2, label: 'BUS Q2' },
        { y: 277, val: q1, label: 'BUS Q1' },
        { y: 402, val: q0, label: 'BUS Q0' },
      ].map((bus) => {
        const busLoadX = Number((285 + (430 - 285) * visualProgress).toFixed(2));
        return (
          <g key={bus.label}>
            <line
              x1="285"
              y1={bus.y}
              x2="430"
              y2={bus.y}
              stroke={bus.val ? '#0369a1' : '#334155'}
              strokeWidth={bus.val ? '4' : '2.5'}
            />
            {bus.val && (
              <>
                <line
                  x1="285"
                  y1={bus.y}
                  x2={busLoadX}
                  y2={bus.y}
                  stroke="#38bdf8"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <circle cx={busLoadX} cy={bus.y} r="4" fill="#e0f2fe" />
              </>
            )}
            <rect
              x="322"
              y={bus.y - 12}
              width="70"
              height="22"
              rx="5"
              fill="#0f172a"
              stroke={bus.val ? '#38bdf8' : '#334155'}
            />
            <text
              x="357"
              y={bus.y + 3}
              textAnchor="middle"
              fill={bus.val ? '#7dd3fc' : '#64748b'}
              fontSize="11"
              className="font-mono tabular-nums"
              fontWeight="700"
            >
              {bus.label}={bus.val ? '1' : '0'}
            </text>
          </g>
        );
      })}

      {/* Column 2: Combinational PLA Decoder Gates */}
      <g transform="translate(430, 45)">
        <rect
          x="0"
          y="0"
          width="350"
          height="285"
          rx="12"
          fill="#0f172a"
          stroke="#38bdf8"
          strokeWidth="2"
        />
        <rect
          x="0"
          y="0"
          width="350"
          height="42"
          rx="12"
          fill="#082f49"
        />
        <text
          x="175"
          y="26"
          textAnchor="middle"
          fill="#7dd3fc"
          fontSize="13.5"
          className="font-mono"
          fontWeight="700"
        >
          COMBINATIONAL DECODER PLA MATRIX
        </text>

        <rect
          x="22"
          y="56"
          width="306"
          height="44"
          rx="8"
          fill="#020617"
          stroke="#38bdf8"
          strokeWidth="1.5"
        />
        <text
          x="175"
          y="83"
          textAnchor="middle"
          fill="#f8fafc"
          fontSize="15"
          className="font-mono tabular-nums"
          fontWeight="700"
        >
          Active Min-Term: {activeMeta.booleanExpr}
        </text>

        {[
          {
            eq: 'G_NS = Q2′ · Q1′',
            active: nsGreenActive,
            y: 126,
          },
          {
            eq: 'Y_NS = Q2′ · Q1 · Q0′',
            active: !mmuFaultLockout && activeMeta.nsColor === 'YELLOW',
            y: 166,
          },
          {
            eq: 'G_EW = Q2 · Q1′',
            active: ewGreenActive,
            y: 206,
          },
          {
            eq: 'Y_EW = Q2 · Q1 · Q0′',
            active: !mmuFaultLockout && activeMeta.ewColor === 'YELLOW',
            y: 246,
          },
        ].map((row) => (
          <g key={row.eq} transform={`translate(22, ${row.y})`}>
            <rect
              x="0"
              y="-16"
              width="306"
              height="32"
              rx="6"
              fill={row.active ? '#064e3b' : '#020617'}
              stroke={row.active ? '#10b981' : '#1e293b'}
            />
            <text
              x="12"
              y="4"
              fill={row.active ? '#6ee7b7' : '#cbd5e1'}
              fontSize="12.5"
              className="font-mono"
              fontWeight="700"
            >
              {row.eq}
            </text>
            <text
              x="294"
              y="4"
              textAnchor="end"
              fill={row.active ? '#a7f3d0' : '#64748b'}
              fontSize="11"
              className="font-mono tabular-nums"
            >
              {row.active ? 'ACTIVE (1)' : 'IDLE (0)'}
            </text>
          </g>
        ))}
      </g>

      {/* Column 2 Bottom: MMU Conflict Monitor Hardware Interlock */}
      <g
        transform="translate(430, 350)"
        onClick={onToggleMmuFault}
        className="cursor-pointer"
        role="button"
        aria-label="Toggle Malfunction Management Unit Conflict Fault"
      >
        <rect
          x="0"
          y="0"
          width="350"
          height="145"
          rx="12"
          fill={mmuFaultLockout ? '#450a0a' : '#0f172a'}
          stroke={mmuFaultLockout ? '#ef4444' : '#475569'}
          strokeWidth="2"
        />
        <text
          x="175"
          y="30"
          textAnchor="middle"
          fill={mmuFaultLockout ? '#fca5a5' : '#94a3b8'}
          fontSize="13"
          className="font-mono"
          fontWeight="700"
        >
          MMU CONFLICT MONITOR (NEMA TS2)
        </text>
        <text
          x="175"
          y="64"
          textAnchor="middle"
          fill={mmuFaultLockout ? '#fecaca' : '#f8fafc'}
          fontSize="16"
          className="font-mono tabular-nums"
          fontWeight="700"
        >
          FAULT = (G_NS ∧ G_EW) = {mmuFaultLockout ? '1 (TRIPPED!)' : '0 (NOMINAL)'}
        </text>
        <rect
          x="45"
          y="86"
          width="260"
          height="38"
          rx="8"
          fill={mmuFaultLockout ? '#7f1d1d' : '#082f49'}
          stroke={mmuFaultLockout ? '#f87171' : '#38bdf8'}
        />
        <text
          x="175"
          y="110"
          textAnchor="middle"
          fill={mmuFaultLockout ? '#fef2f2' : '#7dd3fc'}
          fontSize="12.5"
          className="font-mono"
          fontWeight="700"
        >
          {mmuFaultLockout
            ? 'Click to Reset MMU Lockout Relay'
            : 'Click to Inject Conflicting Green Fault'}
        </text>
      </g>

      {/* Output Wires to Solid-State Load Switches */}
      <line
        x1="780"
        y1="155"
        x2="895"
        y2="155"
        stroke={nsGreenActive ? '#059669' : '#ef4444'}
        strokeWidth="4"
      />
      {nsGreenActive && (
        <line
          x1="780"
          y1="155"
          x2={Number((780 + (895 - 780) * visualProgress).toFixed(2))}
          y2="155"
          stroke="#34d399"
          strokeWidth="4"
          strokeLinecap="round"
        />
      )}
      <line
        x1="780"
        y1="265"
        x2="895"
        y2="265"
        stroke={ewGreenActive ? '#059669' : '#ef4444'}
        strokeWidth="4"
      />
      {ewGreenActive && (
        <line
          x1="780"
          y1="265"
          x2={Number((780 + (895 - 780) * visualProgress).toFixed(2))}
          y2="265"
          stroke="#34d399"
          strokeWidth="4"
          strokeLinecap="round"
        />
      )}
      <line
        x1="780"
        y1="422"
        x2="895"
        y2="422"
        stroke={mmuFaultLockout ? '#ef4444' : '#475569'}
        strokeWidth="3"
      />

      {/* Column 3: Field Signal Load Switch Drivers */}
      <g transform="translate(895, 45)">
        <rect
          x="0"
          y="0"
          width="260"
          height="450"
          rx="12"
          fill="#0f172a"
          stroke="#334155"
          strokeWidth="2"
        />
        <rect
          x="0"
          y="0"
          width="260"
          height="42"
          rx="12"
          fill="#111827"
        />
        <text
          x="130"
          y="26"
          textAnchor="middle"
          fill="#38bdf8"
          fontSize="13.5"
          className="font-mono"
          fontWeight="700"
        >
          SOLID-STATE LOAD SWITCHES
        </text>

        <g transform="translate(20, 68)">
          <rect
            x="0"
            y="0"
            width="220"
            height="165"
            rx="10"
            fill="#020617"
            stroke="#1e293b"
            strokeWidth="1.5"
          />
          <text
            x="110"
            y="28"
            textAnchor="middle"
            fill="#e2e8f0"
            fontSize="13.5"
            className="font-mono tabular-nums"
            fontWeight="700"
          >
            N–S SIGNAL: {mmuFaultLockout ? 'FLASH RED' : activeMeta.nsColor}
          </text>
          <circle
            cx="50"
            cy="95"
            r="22"
            fill={
              mmuFaultLockout || activeMeta.nsColor === 'RED'
                ? '#ef4444'
                : '#2a1215'
            }
            stroke="#475569"
            strokeWidth="2"
          />
          <circle
            cx="110"
            cy="95"
            r="22"
            fill={
              !mmuFaultLockout && activeMeta.nsColor === 'YELLOW'
                ? '#f59e0b'
                : '#292112'
            }
            stroke="#475569"
            strokeWidth="2"
          />
          <circle
            cx="170"
            cy="95"
            r="22"
            fill={nsGreenActive ? '#10b981' : '#0d261f'}
            stroke="#475569"
            strokeWidth="2"
          />
          <text
            x="50"
            y="142"
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="11"
            className="font-mono"
          >
            RED
          </text>
          <text
            x="110"
            y="142"
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="11"
            className="font-mono"
          >
            YEL
          </text>
          <text
            x="170"
            y="142"
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="11"
            className="font-mono"
          >
            GRN
          </text>
        </g>

        <g transform="translate(20, 258)">
          <rect
            x="0"
            y="0"
            width="220"
            height="165"
            rx="10"
            fill="#020617"
            stroke="#1e293b"
            strokeWidth="1.5"
          />
          <text
            x="110"
            y="28"
            textAnchor="middle"
            fill="#e2e8f0"
            fontSize="13.5"
            className="font-mono tabular-nums"
            fontWeight="700"
          >
            E–W SIGNAL: {mmuFaultLockout ? 'FLASH RED' : activeMeta.ewColor}
          </text>
          <circle
            cx="50"
            cy="95"
            r="22"
            fill={
              mmuFaultLockout || activeMeta.ewColor === 'RED'
                ? '#ef4444'
                : '#2a1215'
            }
            stroke="#475569"
            strokeWidth="2"
          />
          <circle
            cx="110"
            cy="95"
            r="22"
            fill={
              !mmuFaultLockout && activeMeta.ewColor === 'YELLOW'
                ? '#f59e0b'
                : '#292112'
            }
            stroke="#475569"
            strokeWidth="2"
          />
          <circle
            cx="170"
            cy="95"
            r="22"
            fill={ewGreenActive ? '#10b981' : '#0d261f'}
            stroke="#475569"
            strokeWidth="2"
          />
          <text
            x="50"
            y="142"
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="11"
            className="font-mono"
          >
            RED
          </text>
          <text
            x="110"
            y="142"
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="11"
            className="font-mono"
          >
            YEL
          </text>
          <text
            x="170"
            y="142"
            textAnchor="middle"
            fill="#94a3b8"
            fontSize="11"
            className="font-mono"
          >
            GRN
          </text>
        </g>
      </g>
    </svg>
  );

  const getCompactPhaseTitle = (phaseId: PhaseId) => {
    switch (phaseId) {
      case 'NS_LEFT':
        return 'N–S Left';
      case 'NS_GREEN':
        return 'N–S Green';
      case 'NS_YELLOW':
        return 'N–S Yellow';
      case 'ALL_RED_1':
        return 'All-Red N→E';
      case 'EW_LEFT':
        return 'E–W Left';
      case 'EW_GREEN':
        return 'E–W Green';
      case 'EW_YELLOW':
        return 'E–W Yellow';
      case 'ALL_RED_2':
        return 'All-Red E→N';
    }
  };

  const renderMobileFsm = () => {
    const ringA: PhaseId[] = ['NS_LEFT', 'NS_GREEN', 'NS_YELLOW', 'ALL_RED_1'];
    const ringB: PhaseId[] = ['EW_LEFT', 'EW_GREEN', 'EW_YELLOW', 'ALL_RED_2'];

    const renderMobileNodeGrid = (title: string, phases: PhaseId[]) => (
      <div className="space-y-2">
        <div className="px-3 py-1.5 rounded-lg bg-[#0f172a] border border-white/[0.08] text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 text-center">
          {title}
        </div>
        <div className="grid grid-cols-2 gap-2">
          {phases.map((phaseId) => {
            const meta = PHASE_DEFINITIONS[phaseId];
            const isBypassed =
              !protectedLeftEnabled &&
              (phaseId === 'NS_LEFT' || phaseId === 'EW_LEFT');
            const isCurrent =
              currentPhase === phaseId &&
              controlMode !== 'NIGHT_FLASH' &&
              !mmuFaultLockout;
            const duration = getPhaseDuration(phaseId, timings);
            const nsR = meta.nsColor === 'RED';
            const nsY = meta.nsColor === 'YELLOW';
            const nsG = meta.nsColor === 'GREEN' || meta.nsColor === 'LEFT_GREEN';
            const ewR = meta.ewColor === 'RED';
            const ewY = meta.ewColor === 'YELLOW';
            const ewG = meta.ewColor === 'GREEN' || meta.ewColor === 'LEFT_GREEN';

            return (
              <button
                key={`mob-fsm-${phaseId}`}
                type="button"
                onClick={() =>
                  onSelectPhase(phaseId, `FSM Diagram State Jump (${meta.code})`)
                }
                className={`relative p-2.5 rounded-xl border text-left transition-all active:scale-[0.98] cursor-pointer flex flex-col justify-between gap-2 overflow-hidden ${
                  isCurrent
                    ? 'bg-[#0f172a] border-[#38bdf8] shadow-[0_0_16px_rgba(56,189,248,0.22)]'
                    : isBypassed
                    ? 'bg-[#0b1120]/50 border-white/[0.05] opacity-45'
                    : 'bg-[#0b1120] border-slate-700/80 hover:border-sky-400/60'
                }`}
              >
                <div className="flex items-center justify-between gap-1 font-mono text-[11px] font-bold">
                  <span className={isCurrent ? 'text-[#38bdf8]' : 'text-zinc-400'}>
                    {meta.code} ({meta.qBits}₂)
                  </span>
                  <span className={isCurrent ? 'text-white tabular-nums' : 'text-zinc-400 tabular-nums'}>
                    {isCurrent ? `${formattedRemaining}s` : `${duration.toFixed(1)}s`}
                  </span>
                </div>

                <div className="text-xs font-bold text-white leading-tight">
                  {getCompactPhaseTitle(phaseId)}
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[10px] font-mono">
                  <div className="flex items-center justify-between px-1.5 py-1 rounded bg-[#020617] border border-slate-800">
                    <span className="text-zinc-300 font-bold">NS</span>
                    <span className="flex items-center gap-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${nsR ? 'bg-[#ef4444]' : 'bg-[#2a1215]'}`} />
                      <span className={`w-1.5 h-1.5 rounded-full ${nsY ? 'bg-[#f59e0b]' : 'bg-[#292112]'}`} />
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          meta.nsColor === 'LEFT_GREEN'
                            ? 'bg-[#14b8a6]'
                            : nsG
                            ? 'bg-[#10b981]'
                            : 'bg-[#0d261f]'
                        }`}
                      />
                    </span>
                  </div>
                  <div className="flex items-center justify-between px-1.5 py-1 rounded bg-[#020617] border border-slate-800">
                    <span className="text-zinc-300 font-bold">EW</span>
                    <span className="flex items-center gap-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${ewR ? 'bg-[#ef4444]' : 'bg-[#2a1215]'}`} />
                      <span className={`w-1.5 h-1.5 rounded-full ${ewY ? 'bg-[#f59e0b]' : 'bg-[#292112]'}`} />
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          meta.ewColor === 'LEFT_GREEN'
                            ? 'bg-[#14b8a6]'
                            : ewG
                            ? 'bg-[#10b981]'
                            : 'bg-[#0d261f]'
                        }`}
                      />
                    </span>
                  </div>
                </div>

                <div className="w-full h-1 rounded-full bg-[#020617] overflow-hidden">
                  {isCurrent && (
                    <div
                      className="h-full bg-[#38bdf8] rounded-full"
                      style={{ width: `${Math.round(visualProgress * 100)}%` }}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );

    return (
      <div className="space-y-3.5">
        {renderMobileNodeGrid('Ring A · North–South Sequence (S0 → S3)', ringA)}

        {/* Center PLC Controller Core Card */}
        <div
          className={`p-3.5 rounded-2xl bg-[#0b1120] border-2 space-y-3 ${
            mmuFaultLockout ? 'border-[#ef4444]' : 'border-[#38bdf8]/45'
          }`}
        >
          <div
            className={`px-3 py-1.5 rounded-lg border flex items-center justify-center gap-2 text-[11px] font-mono font-bold text-center ${
              mmuFaultLockout
                ? 'bg-[#450a0a] border-[#ef4444] text-[#fca5a5]'
                : 'bg-[#020617] border-slate-800 text-[#7dd3fc]'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                mmuFaultLockout ? 'bg-[#ef4444]' : 'bg-[#38bdf8]'
              }`}
            />
            <span className="truncate">
              {mmuFaultLockout
                ? 'MMU CONFLICT LOCKOUT · ALL-RED'
                : `PLC REGISTER · ${activeMeta.code} (${activeMeta.qBits}₂)`}
            </span>
          </div>

          <div className="text-center text-sm font-bold text-white leading-tight">
            {mmuFaultLockout
              ? 'Hardware Safety Interlock Active'
              : controlMode === 'NIGHT_FLASH'
              ? 'NIGHT HAZARD FLASH OVERRIDE'
              : activeMeta.title}
          </div>

          <div className="grid grid-cols-3 gap-1.5 font-mono text-xs">
            {[
              { label: 'Q2', val: q2 },
              { label: 'Q1', val: q1 },
              { label: 'Q0', val: q0 },
            ].map((bit) => (
              <div
                key={`mob-reg-${bit.label}`}
                className={`px-2.5 py-2 rounded-lg border flex items-center justify-between ${
                  bit.val
                    ? 'bg-[#082f49] border-[#38bdf8] text-[#38bdf8]'
                    : 'bg-[#020617] border-slate-700 text-slate-500'
                }`}
              >
                <span className="text-slate-400 font-semibold">{bit.label}:</span>
                <span className="font-bold tabular-nums">{bit.val ? '1' : '0'}</span>
              </div>
            ))}
          </div>

          <div className="px-3 py-2 rounded-lg bg-[#020617] border border-slate-700 text-center font-mono text-xs font-bold text-[#38bdf8] tabular-nums">
            OUT: {mmuFaultLockout ? '100F 100F' : activeMeta.binaryOutput}
          </div>

          <div className="w-full h-2 rounded-full bg-[#020617] border border-slate-800 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                mmuFaultLockout ? 'bg-[#ef4444]' : 'bg-[#38bdf8]'
              }`}
              style={{ width: `${Math.round(visualProgress * 100)}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-1.5 font-mono text-[10.5px] tabular-nums">
            <div className="px-2 py-1 rounded bg-[#020617] border border-slate-800 text-slate-300 text-center truncate">
              BOOL: {activeMeta.booleanExpr}
            </div>
            <div className="px-2 py-1 rounded bg-[#020617] border border-slate-800 text-[#7dd3fc] font-bold text-center truncate">
              {formattedRemaining}s / {formattedDuration}s
            </div>
          </div>
        </div>

        {renderMobileNodeGrid('Ring B · East–West Sequence (S4 → S7)', ringB)}
      </div>
    );
  };

  const renderMobileSchematic = () => (
    <div className="space-y-3.5">
      {/* 1. 3-Bit D-Flip-Flop Register */}
      <div className="p-3 rounded-2xl bg-[#0f172a] border border-slate-700 space-y-2.5">
        <div className="text-[11px] font-mono font-bold text-[#38bdf8] uppercase tracking-wider text-center">
          1. 3-Bit D-Flip-Flop Register
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Q2 MSB', val: q2 },
            { label: 'Q1 SEQ', val: q1 },
            { label: 'Q0 LSB', val: q0 },
          ].map((bit) => (
            <div
              key={`mob-dff-${bit.label}`}
              className={`p-2.5 rounded-xl border text-center space-y-1.5 ${
                bit.val
                  ? 'bg-[#082f49] border-[#38bdf8]'
                  : 'bg-[#020617] border-slate-800'
              }`}
            >
              <div className="text-[10px] font-mono text-slate-400 font-semibold">
                {bit.label}
              </div>
              <div
                className={`w-8 h-8 mx-auto rounded-full border-2 flex items-center justify-center font-mono text-sm font-bold ${
                  bit.val
                    ? 'bg-[#0284c7] border-[#38bdf8] text-white'
                    : 'bg-[#0f172a] border-slate-700 text-slate-500'
                }`}
              >
                {bit.val ? '1' : '0'}
              </div>
              <div
                className={`text-[10px] font-mono font-bold ${
                  bit.val ? 'text-white' : 'text-slate-500'
                }`}
              >
                {bit.val ? '5.0V' : '0.0V'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Combinational PLA Decoder Matrix */}
      <div className="p-3 rounded-2xl bg-[#0f172a] border border-[#38bdf8]/60 space-y-2.5">
        <div className="text-[11px] font-mono font-bold text-[#7dd3fc] uppercase tracking-wider text-center">
          2. Combinational Decoder PLA Matrix
        </div>
        <div className="p-2.5 rounded-lg bg-[#020617] border border-[#38bdf8]/50 text-center font-mono text-xs font-bold text-white">
          Active Min-Term: {activeMeta.booleanExpr}
        </div>
        <div className="space-y-1.5 font-mono text-[11px]">
          {[
            { eq: 'G_NS = Q2′ · Q1′', active: nsGreenActive },
            {
              eq: 'Y_NS = Q2′ · Q1 · Q0′',
              active: !mmuFaultLockout && activeMeta.nsColor === 'YELLOW',
            },
            { eq: 'G_EW = Q2 · Q1′', active: ewGreenActive },
            {
              eq: 'Y_EW = Q2 · Q1 · Q0′',
              active: !mmuFaultLockout && activeMeta.ewColor === 'YELLOW',
            },
          ].map((row) => (
            <div
              key={`mob-pla-${row.eq}`}
              className={`px-3 py-2 rounded-lg border flex items-center justify-between gap-2 ${
                row.active
                  ? 'bg-[#064e3b] border-[#10b981] text-[#6ee7b7]'
                  : 'bg-[#020617] border-slate-800 text-slate-300'
              }`}
            >
              <span className="font-bold">{row.eq}</span>
              <span className={row.active ? 'text-[#a7f3d0] font-bold' : 'text-slate-500'}>
                {row.active ? 'ACTIVE (1)' : 'IDLE (0)'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. MMU Conflict Monitor */}
      <button
        type="button"
        onClick={onToggleMmuFault}
        className={`w-full p-3.5 rounded-2xl border-2 text-center space-y-2 cursor-pointer transition-all active:scale-[0.99] ${
          mmuFaultLockout
            ? 'bg-[#450a0a] border-[#ef4444]'
            : 'bg-[#0f172a] border-slate-600'
        }`}
      >
        <div
          className={`text-[11px] font-mono font-bold ${
            mmuFaultLockout ? 'text-[#fca5a5]' : 'text-slate-400'
          }`}
        >
          3. MMU CONFLICT MONITOR (NEMA TS2)
        </div>
        <div
          className={`text-xs font-mono font-bold ${
            mmuFaultLockout ? 'text-[#fecaca]' : 'text-white'
          }`}
        >
          FAULT = (G_NS ∧ G_EW) = {mmuFaultLockout ? '1 (TRIPPED!)' : '0 (NOMINAL)'}
        </div>
        <div
          className={`py-2 px-3 rounded-lg border text-xs font-mono font-bold ${
            mmuFaultLockout
              ? 'bg-[#7f1d1d] border-[#f87171] text-[#fef2f2]'
              : 'bg-[#082f49] border-[#38bdf8] text-[#7dd3fc]'
          }`}
        >
          {mmuFaultLockout
            ? 'Tap to Reset MMU Lockout Relay'
            : 'Tap to Inject Conflicting Green Fault'}
        </div>
      </button>

      {/* 4. Solid-State Load Switches */}
      <div className="p-3 rounded-2xl bg-[#0f172a] border border-slate-700 space-y-2.5">
        <div className="text-[11px] font-mono font-bold text-[#38bdf8] uppercase tracking-wider text-center">
          4. Solid-State Load Switches
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            {
              title: 'N–S SIGNAL',
              aspect: mmuFaultLockout ? 'FLASH RED' : activeMeta.nsColor,
              red: mmuFaultLockout || activeMeta.nsColor === 'RED',
              yel: !mmuFaultLockout && activeMeta.nsColor === 'YELLOW',
              grn: nsGreenActive,
            },
            {
              title: 'E–W SIGNAL',
              aspect: mmuFaultLockout ? 'FLASH RED' : activeMeta.ewColor,
              red: mmuFaultLockout || activeMeta.ewColor === 'RED',
              yel: !mmuFaultLockout && activeMeta.ewColor === 'YELLOW',
              grn: ewGreenActive,
            },
          ].map((sw) => (
            <div
              key={sw.title}
              className="p-2.5 rounded-xl bg-[#020617] border border-slate-800 space-y-2 text-center"
            >
              <div className="font-mono text-[11px] font-bold text-slate-200 truncate">
                {sw.title}: {sw.aspect}
              </div>
              <div className="flex items-center justify-center gap-2">
                <div className="flex flex-col items-center gap-1">
                  <span
                    className={`w-6 h-6 rounded-full border border-slate-600 ${
                      sw.red ? 'bg-[#ef4444]' : 'bg-[#2a1215]'
                    }`}
                  />
                  <span className="text-[9px] font-mono text-slate-400">RED</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span
                    className={`w-6 h-6 rounded-full border border-slate-600 ${
                      sw.yel ? 'bg-[#f59e0b]' : 'bg-[#292112]'
                    }`}
                  />
                  <span className="text-[9px] font-mono text-slate-400">YEL</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <span
                    className={`w-6 h-6 rounded-full border border-slate-600 ${
                      sw.grn ? 'bg-[#10b981]' : 'bg-[#0d261f]'
                    }`}
                  />
                  <span className="text-[9px] font-mono text-slate-400">GRN</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col bg-slate-900/40 backdrop-blur-3xl border border-white/20 shadow-[0_24px_60px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.25)] rounded-2xl sm:rounded-[26px] overflow-hidden">
      {/* Diagram Panel Header with View Switcher & Size Expander */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 px-4 sm:px-6 py-4 bg-white/[0.04] border-b border-white/[0.1]">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          {/* macOS Tahoe Squircle: State Machine & Logic Gates */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#BF5AF2] to-[#8944AB] shadow-[0_4px_14px_rgba(191,90,242,0.4)] flex items-center justify-center text-white shrink-0">
            {diagramMode === 'SCHEMATIC' ? (
              <Cpu className="w-4 h-4" />
            ) : (
              <GitCommitHorizontal className="w-4 h-4" />
            )}
          </div>
          <div className="min-w-0">
            <h2
              className="text-base sm:text-lg font-bold text-[#f5f5f7] tracking-tight leading-tight"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              8-State Finite State Machine, PLC Logic & Timing Diagram
            </h2>
            <p className="text-xs text-zinc-400 font-normal mt-0.5 leading-normal">
              Interactive Dual-Ring Traffic Controller Architecture · Click any state node (S0–S7) or waveform bar to force an immediate phase jump
            </p>
          </div>
        </div>

        {/* Diagram Mode Apple Segmented Toggle + Size Expander */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <div className="grid grid-cols-1 sm:inline-flex items-center gap-1 p-1 bg-black/45 border border-white/[0.06] shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] rounded-xl w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setDiagramMode('FSM')}
              className={`h-9 sm:h-8 inline-flex items-center justify-center sm:justify-start gap-1.5 px-3 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer leading-none ${
                diagramMode === 'FSM'
                  ? 'bg-white/[0.18] text-white shadow-[0_1px_3px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.12)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <GitCommitHorizontal className="w-3.5 h-3.5 text-[#64D2FF] shrink-0" />
              <span>State Machine (FSM)</span>
            </button>
            <button
              type="button"
              onClick={() => setDiagramMode('SCHEMATIC')}
              className={`h-9 sm:h-8 inline-flex items-center justify-center sm:justify-start gap-1.5 px-3 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer leading-none ${
                diagramMode === 'SCHEMATIC'
                  ? 'bg-white/[0.18] text-white shadow-[0_1px_3px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.12)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-[#64D2FF] shrink-0" />
              <span>Digital Logic Circuit</span>
            </button>
            <button
              type="button"
              onClick={() => setDiagramMode('BOTH')}
              className={`h-9 sm:h-8 inline-flex items-center justify-center sm:justify-start gap-1.5 px-3 text-xs font-semibold rounded-lg transition-all whitespace-nowrap shrink-0 cursor-pointer leading-none ${
                diagramMode === 'BOTH'
                  ? 'bg-white/[0.18] text-white shadow-[0_1px_3px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.12)]'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Columns2 className="w-3.5 h-3.5 text-[#64D2FF] shrink-0" />
              <span>Show Both Diagrams</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className={`hidden lg:inline-flex h-8 items-center gap-1.5 px-3.5 text-xs font-semibold rounded-xl border transition-all active:scale-[0.98] cursor-pointer leading-none ${
              isExpanded
                ? 'bg-[#0A84FF] text-white border-[#0A84FF] shadow-[0_2px_10px_rgba(10,132,255,0.4)]'
                : 'bg-white/[0.06] text-[#f5f5f7] border-white/[0.09] hover:bg-white/[0.12]'
            }`}
          >
            {isExpanded ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 shrink-0" />
                <span>Standard Height</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 shrink-0" />
                <span>Extra-Large Height</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Quick State Jump Bar for One-Click Classroom Testing */}
      <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center justify-between gap-2.5 px-4 sm:px-6 py-3 bg-black/30 border-b border-white/[0.07] text-xs">
        <div className="flex items-center gap-2 text-zinc-300 font-semibold text-xs leading-none">
          <Zap className="w-3.5 h-3.5 text-[#64D2FF] shrink-0" />
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">Direct PLC State Jump:</span>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {PHASE_ORDER.map((phaseId) => {
            const meta = PHASE_DEFINITIONS[phaseId];
            const isCurrent = currentPhase === phaseId && !mmuFaultLockout;
            const isBypassed =
              !protectedLeftEnabled &&
              (phaseId === 'NS_LEFT' || phaseId === 'EW_LEFT');
            return (
              <button
                key={phaseId}
                type="button"
                onClick={() =>
                  onSelectPhase(
                    phaseId,
                    `Quick Bar State Jump (${meta.code})`
                  )
                }
                className={`min-h-[38px] sm:min-h-0 sm:h-7 inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:py-0 rounded-lg font-mono text-[11px] font-semibold transition-all active:scale-[0.97] cursor-pointer leading-tight min-w-0 text-left ${
                  isCurrent
                    ? 'bg-[#0A84FF]/25 text-[#64D2FF] border border-[#0A84FF]/50 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]'
                    : isBypassed
                    ? 'bg-black/25 text-[#52525b] border border-white/[0.04]'
                    : 'bg-white/[0.05] hover:bg-white/[0.11] text-[#f5f5f7] border border-white/[0.08]'
                }`}
              >
                <Play className="w-2.5 h-2.5 shrink-0" />
                <span className="sm:hidden">
                  {meta.code} · {getCompactPhaseTitle(phaseId)}
                </span>
                <span className="hidden sm:inline">
                  {meta.code}: {meta.shortTitle}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Large Interactive SVG Viewport (Desktop) + Zero-Cutoff Native Cards (Mobile) */}
      <div className="p-3.5 sm:p-6 bg-[#0b0d14] border-b border-white/[0.07]">
        {/* Mobile Native Interactive Diagrams (< md) */}
        <div className="md:hidden">
          {diagramMode === 'FSM' && renderMobileFsm()}
          {diagramMode === 'SCHEMATIC' && renderMobileSchematic()}
          {diagramMode === 'BOTH' && (
            <div className="space-y-6">
              <div>
                <div className="text-xs font-mono uppercase tracking-wider text-[#64D2FF] mb-2 font-semibold">
                  1. 8-State Finite State Machine
                </div>
                {renderMobileFsm()}
              </div>
              <div>
                <div className="text-xs font-mono uppercase tracking-wider text-[#64D2FF] mb-2 font-semibold">
                  2. Combinational PLA & MMU Interlock
                </div>
                {renderMobileSchematic()}
              </div>
            </div>
          )}
        </div>

        {/* Desktop & Tablet Landscape Full SVG Diagrams (md+) */}
        <div className="hidden md:block">
          {diagramMode === 'FSM' && renderFsmSvg()}
          {diagramMode === 'SCHEMATIC' && renderSchematicSvg()}
          {diagramMode === 'BOTH' && (
            <div className="grid grid-cols-1 gap-6">
              <div>
                <div className="text-xs font-mono uppercase tracking-wider text-[#64D2FF] mb-2 font-semibold">
                  1. 8-State Finite State Machine (Dual-Ring Sequence)
                </div>
                {renderFsmSvg()}
              </div>
              <div>
                <div className="text-xs font-mono uppercase tracking-wider text-[#64D2FF] mb-2 font-semibold">
                  2. Combinational PLA Decoder & MMU Hardware Interlock Schematic
                </div>
                {renderSchematicSvg()}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Synchronized Multi-Channel Signal Timing Waveform Chart */}
      <div className="p-3.5 sm:p-6 bg-white/[0.015]">
        <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 mb-3.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <Clock className="w-4 h-4 text-[#0A84FF] shrink-0" />
            <h3 className="text-sm font-bold text-[#f5f5f7] tracking-tight leading-tight">
              Synchronized Multi-Channel Signal Timing Waveform ({activeOrder.length} Active Phases)
            </h3>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm font-mono tabular-nums text-zinc-300 w-full xl:w-auto">
            <span className="h-7 inline-flex items-center justify-center sm:min-w-[172px] px-3 rounded-full bg-[#0A84FF]/15 border border-[#0A84FF]/35 text-[#64D2FF] font-semibold leading-none">
              Active: {activeMeta.code} ({formattedRemaining}s left)
            </span>
            <span className="inline-block sm:min-w-[235px] sm:text-right font-medium">
              Cycle Playhead:{' '}
              <strong className="text-[#64D2FF] font-bold">{formattedCycleElapsed}s</strong> /{' '}
              {formattedTotalCycle}s ({formattedPlayheadPct}%)
            </span>
          </div>
        </div>

        {/* Mobile Zero-Cutoff Timing Waveform & Phase Schedule (< md) */}
        <div className="md:hidden bg-black/45 border border-white/[0.07] rounded-2xl p-3 space-y-3 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]">
          {/* Proportional Full-Width Cycle Playhead Strip */}
          <div className="space-y-1.5">
            <div className="relative h-6 rounded-lg overflow-hidden flex bg-black/50 border border-white/[0.08]">
              {activeOrder.map((phaseId) => {
                const dur = getPhaseDuration(phaseId, timings);
                const widthPct = totalCycle > 0 ? (dur / totalCycle) * 100 : 12.5;
                const color = PHASE_DEFINITIONS[phaseId].nsColor;
                const bgClass =
                  color === 'LEFT_GREEN'
                    ? 'bg-[#64D2FF]/80'
                    : color === 'GREEN'
                    ? 'bg-[#30D158]/80'
                    : color === 'YELLOW'
                    ? 'bg-[#FFD60A]/85'
                    : 'bg-[#FF453A]/75';
                return (
                  <button
                    key={`mob-bar-${phaseId}`}
                    type="button"
                    onClick={() =>
                      onSelectPhase(
                        phaseId,
                        `Waveform Timeline Selection (${PHASE_DEFINITIONS[phaseId].code})`
                      )
                    }
                    style={{ width: `${widthPct}%` }}
                    aria-label={`Jump to ${PHASE_DEFINITIONS[phaseId].code}`}
                    className={`h-full border-r border-black/40 last:border-r-0 ${bgClass} ${
                      currentPhase === phaseId ? 'ring-1 ring-inset ring-white/80' : 'opacity-80'
                    }`}
                  />
                );
              })}
              <div
                style={{ left: `${cyclePlayheadPct.toFixed(2)}%` }}
                className="absolute top-0 bottom-0 -ml-px w-[2px] bg-white pointer-events-none shadow-[0_0_8px_white]"
              />
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono tabular-nums text-[#86868b]">
              <span>0.0s (Start)</span>
              <span>{(totalCycle * 0.5).toFixed(1)}s (Mid)</span>
              <span>{totalCycle.toFixed(1)}s (End)</span>
            </div>
          </div>

          {/* All Active Phases Explicit Non-Clipped Aspect Rows */}
          <div className="space-y-1.5">
            {activeOrder.map((phaseId) => {
              const meta = PHASE_DEFINITIONS[phaseId];
              const dur = getPhaseDuration(phaseId, timings);
              const isCurrent = currentPhase === phaseId;
              const pedLabel =
                meta.pedNS === 'WALK'
                  ? 'WALK N–S'
                  : meta.pedEW === 'WALK'
                  ? 'WALK E–W'
                  : 'HOLD';

              const aspectBadge = (label: string, color: string) => (
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold leading-none ${
                    color === 'LEFT_GREEN'
                      ? 'bg-[#64D2FF]/20 text-[#64D2FF] border border-[#64D2FF]/35'
                      : color === 'GREEN'
                      ? 'bg-[#30D158]/20 text-[#30D158] border border-[#30D158]/35'
                      : color === 'YELLOW'
                      ? 'bg-[#FFD60A]/20 text-[#FFD60A] border border-[#FFD60A]/35'
                      : 'bg-[#FF453A]/20 text-[#FF6961] border border-[#FF453A]/35'
                  }`}
                >
                  {label}: {color === 'LEFT_GREEN' ? '←LEFT' : color === 'GREEN' ? 'GRN' : color === 'YELLOW' ? 'YEL' : 'RED'}
                </span>
              );

              return (
                <button
                  key={`mob-wf-${phaseId}`}
                  type="button"
                  onClick={() =>
                    onSelectPhase(phaseId, `Waveform Bar Click (${meta.code})`)
                  }
                  className={`relative w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer overflow-hidden space-y-1.5 ${
                    isCurrent
                      ? 'bg-[#0A84FF]/15 border-[#0A84FF]/60'
                      : 'bg-white/[0.03] border-white/[0.07] hover:bg-white/[0.06]'
                  }`}
                >
                  {isCurrent && (
                    <div
                      style={{ width: `${Math.round(phaseProgress * 100)}%` }}
                      className="absolute inset-y-0 left-0 bg-[#0A84FF]/15 pointer-events-none"
                    />
                  )}
                  <div className="relative z-10 flex items-center justify-between gap-2 text-xs font-mono">
                    <span className="font-bold text-white">
                      {meta.code} · {getCompactPhaseTitle(phaseId)}
                    </span>
                    <span className="text-[#64D2FF] font-semibold tabular-nums shrink-0">
                      {isCurrent ? `${formattedRemaining}s / ` : ''}
                      {dur.toFixed(1)}s
                    </span>
                  </div>
                  <div className="relative z-10 flex flex-wrap items-center gap-1.5">
                    {aspectBadge('N–S', meta.nsColor)}
                    {aspectBadge('E–W', meta.ewColor)}
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold leading-none ${
                        pedLabel === 'HOLD'
                          ? 'bg-black/40 text-zinc-400 border border-white/[0.08]'
                          : 'bg-[#0A84FF]/25 text-[#64D2FF] border border-[#0A84FF]/40 font-bold'
                      }`}
                    >
                      PED: {pedLabel}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Desktop & Tablet Landscape Multi-Channel Gantt Waveform (md+) */}
        <div className="hidden md:block bg-black/45 border border-white/[0.07] rounded-2xl p-4 shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)]">
          <div>
            <div>
              {/* Phase Header Selector Strip */}
              <div className="flex w-full mb-3 text-xs font-mono text-[#86868b] pl-28">
                {activeOrder.map((phaseId) => {
                  const dur = getPhaseDuration(phaseId, timings);
                  const widthPct = totalCycle > 0 ? (dur / totalCycle) * 100 : 12.5;
                  const isCurrent = currentPhase === phaseId;
                  return (
                    <button
                      key={phaseId}
                      type="button"
                      onClick={() =>
                        onSelectPhase(
                          phaseId,
                          `Waveform Timeline Selection (${PHASE_DEFINITIONS[phaseId].code})`
                        )
                      }
                      style={{ width: `${widthPct}%` }}
                      className={`relative min-w-0 text-left px-2 py-1.5 truncate border-l border-white/[0.07] font-semibold cursor-pointer overflow-hidden ${
                        isCurrent
                          ? 'text-white bg-[#0A84FF]/15 border-b-2 border-b-[#0A84FF]'
                          : 'text-[#86868b] hover:text-white hover:bg-white/[0.04]'
                      }`}
                    >
                      {isCurrent && (
                        <span
                          style={{
                            transform: `scaleX(${phaseScaleX})`,
                            transformOrigin: 'left center',
                          }}
                          className="absolute inset-0 bg-[#0A84FF]/25 will-change-transform pointer-events-none"
                        />
                      )}
                      <span className="relative z-10 inline-block transform-gpu">
                        {PHASE_DEFINITIONS[phaseId].code} · {PHASE_DEFINITIONS[phaseId].shortTitle} ({dur}s)
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* 3-Channel Waveform Stack with Unified Playhead Overlay */}
              <div className="relative">
                {/* Channel 1: North-South Signal */}
                <div className="flex items-center mb-2.5">
                  <div className="w-28 shrink-0 text-xs font-mono font-semibold text-[#f5f5f7] pr-3 leading-none">
                    N–S Signal
                  </div>
                  <div className="relative flex-1 flex h-8 rounded-xl overflow-hidden bg-black/50 border border-white/[0.07]">
                {activeOrder.map((phaseId, idx) => {
                  const dur = getPhaseDuration(phaseId, timings);
                  const widthPct = totalCycle > 0 ? (dur / totalCycle) * 100 : 12.5;
                  const isCurrent = currentPhase === phaseId;
                  const isPast = activeOrderIndex > -1 && idx < activeOrderIndex;
                  const color = PHASE_DEFINITIONS[phaseId].nsColor;
                  const bgClass =
                    color === 'LEFT_GREEN'
                      ? 'bg-[#64D2FF]/85 text-slate-950'
                      : color === 'GREEN'
                      ? 'bg-[#30D158]/85 text-slate-950'
                      : color === 'YELLOW'
                      ? 'bg-[#FFD60A]/90 text-slate-950'
                      : 'bg-[#FF453A]/80 text-white';
                  const label =
                    color === 'LEFT_GREEN'
                      ? '← LEFT'
                      : color === 'GREEN'
                      ? 'GREEN'
                      : color === 'YELLOW'
                      ? 'YEL'
                      : 'RED';
                  return (
                    <div
                      key={phaseId}
                      onClick={() =>
                        onSelectPhase(
                          phaseId,
                          `Waveform Bar Click (${PHASE_DEFINITIONS[phaseId].code})`
                        )
                      }
                      style={{ width: `${widthPct}%` }}
                      className={`relative min-w-0 h-full flex items-center justify-center text-[11px] font-mono font-bold border-r border-black/50 truncate cursor-pointer overflow-hidden ${bgClass} ${
                        isPast ? 'opacity-80' : 'opacity-95'
                      }`}
                    >
                      {isCurrent && (
                        <div
                          style={{
                            transform: `scaleX(${phaseScaleX})`,
                            transformOrigin: 'left center',
                          }}
                          className="absolute inset-0 bg-white/25 will-change-transform pointer-events-none"
                        />
                      )}
                      {widthPct > 5 && (
                        <span className="relative z-10 inline-flex items-center justify-center leading-none transform-gpu px-1.5 py-0.5 rounded bg-black/15">
                          {label}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Channel 2: East-West Signal */}
            <div className="flex items-center mb-2.5">
              <div className="w-28 shrink-0 text-xs font-mono font-semibold text-[#f5f5f7] pr-3 leading-none">
                E–W Signal
              </div>
              <div className="relative flex-1 flex h-8 rounded-xl overflow-hidden bg-black/50 border border-white/[0.07]">
                {activeOrder.map((phaseId, idx) => {
                  const dur = getPhaseDuration(phaseId, timings);
                  const widthPct = totalCycle > 0 ? (dur / totalCycle) * 100 : 12.5;
                  const isCurrent = currentPhase === phaseId;
                  const isPast = activeOrderIndex > -1 && idx < activeOrderIndex;
                  const color = PHASE_DEFINITIONS[phaseId].ewColor;
                  const bgClass =
                    color === 'LEFT_GREEN'
                      ? 'bg-[#64D2FF]/85 text-slate-950'
                      : color === 'GREEN'
                      ? 'bg-[#30D158]/85 text-slate-950'
                      : color === 'YELLOW'
                      ? 'bg-[#FFD60A]/90 text-slate-950'
                      : 'bg-[#FF453A]/80 text-white';
                  const label =
                    color === 'LEFT_GREEN'
                      ? '← LEFT'
                      : color === 'GREEN'
                      ? 'GREEN'
                      : color === 'YELLOW'
                      ? 'YEL'
                      : 'RED';
                  return (
                    <div
                      key={phaseId}
                      onClick={() =>
                        onSelectPhase(
                          phaseId,
                          `Waveform Bar Click (${PHASE_DEFINITIONS[phaseId].code})`
                        )
                      }
                      style={{ width: `${widthPct}%` }}
                      className={`relative min-w-0 h-full flex items-center justify-center text-[11px] font-mono font-bold border-r border-black/50 truncate cursor-pointer overflow-hidden ${bgClass} ${
                        isPast ? 'opacity-80' : 'opacity-95'
                      }`}
                    >
                      {isCurrent && (
                        <div
                          style={{
                            transform: `scaleX(${phaseScaleX})`,
                            transformOrigin: 'left center',
                          }}
                          className="absolute inset-0 bg-white/25 will-change-transform pointer-events-none"
                        />
                      )}
                      {widthPct > 5 && (
                        <span className="relative z-10 inline-flex items-center justify-center leading-none transform-gpu px-1.5 py-0.5 rounded bg-black/15">
                          {label}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Channel 3: Pedestrians */}
            <div className="flex items-center">
              <div className="w-28 shrink-0 text-xs font-mono font-semibold text-[#a1a1a6] pr-3 leading-none">
                Pedestrians
              </div>
              <div className="relative flex-1 flex h-8 rounded-xl overflow-hidden bg-black/50 border border-white/[0.07]">
                {activeOrder.map((phaseId, idx) => {
                  const dur = getPhaseDuration(phaseId, timings);
                  const widthPct = totalCycle > 0 ? (dur / totalCycle) * 100 : 12.5;
                  const isCurrent = currentPhase === phaseId;
                  const isPast = activeOrderIndex > -1 && idx < activeOrderIndex;
                  const pedNS = PHASE_DEFINITIONS[phaseId].pedNS === 'WALK';
                  const pedEW = PHASE_DEFINITIONS[phaseId].pedEW === 'WALK';
                  const label = pedNS
                    ? 'WALK N-S'
                    : pedEW
                    ? 'WALK E-W'
                    : 'DON’T WALK (HOLD)';
                  const bgClass =
                    pedNS || pedEW
                      ? 'bg-[#0A84FF]/35 text-[#64D2FF] font-bold'
                      : 'bg-black/40 text-[#636366]';
                  return (
                    <div
                      key={phaseId}
                      onClick={() =>
                        onSelectPhase(
                          phaseId,
                          `Waveform Bar Click (${PHASE_DEFINITIONS[phaseId].code})`
                        )
                      }
                      style={{ width: `${widthPct}%` }}
                      className={`relative min-w-0 h-full flex items-center justify-center text-[11px] font-mono border-r border-white/[0.06] truncate cursor-pointer overflow-hidden ${bgClass} ${
                        isPast ? 'opacity-80' : 'opacity-95'
                      }`}
                    >
                      {isCurrent && (
                        <div
                          style={{
                            transform: `scaleX(${phaseScaleX})`,
                            transformOrigin: 'left center',
                          }}
                          className="absolute inset-0 bg-[#0A84FF]/25 will-change-transform pointer-events-none"
                        />
                      )}
                      {widthPct > 8 && (
                        <span className="relative z-10 inline-flex items-center justify-center leading-none transform-gpu px-1.5 py-0.5 rounded bg-black/20">
                          {label}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

                {/* Unified Playhead Cursor Line Spanning All 3 Channels */}
                <div className="absolute inset-y-0 left-28 right-0 pointer-events-none z-20">
                  <div
                    style={{
                      left: `${cyclePlayheadPct.toFixed(2)}%`,
                    }}
                    className="absolute top-0 bottom-0 -ml-px w-[2px] bg-white transform-gpu will-change-[left]"
                  >
                    <div className="w-3 h-3 -ml-[5px] -mt-1 rounded-full bg-[#0A84FF] border-2 border-white" />
                    <div className="absolute bottom-0 w-2.5 h-2.5 -ml-[4px] -mb-1 rounded-full bg-[#0A84FF] border-2 border-white" />
                  </div>
                </div>
              </div>

              {/* Synchronized Cycle Time Ruler Below Waveform Channels */}
              <div className="flex items-center justify-between pl-28 pt-2.5 mt-2 border-t border-white/[0.06] text-[11px] font-mono tabular-nums text-[#86868b]">
                <span>0.0s (Cycle Start)</span>
                <span>{(totalCycle * 0.25).toFixed(1)}s</span>
                <span>{(totalCycle * 0.5).toFixed(1)}s (Mid-Cycle)</span>
                <span>{(totalCycle * 0.75).toFixed(1)}s</span>
                <span>{totalCycle.toFixed(1)}s (Cycle End)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
