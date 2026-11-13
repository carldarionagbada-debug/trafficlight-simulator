'use client';

import React from 'react';

export type NavSection =
  | 'intersection'
  | 'diagram'
  | 'timing'
  | 'telemetry'
  | 'guide';

interface NavbarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
}

export default function Navbar({
  activeSection,
  onSelectSection,
}: NavbarProps) {
  const navItems: { id: NavSection; label: string; shortLabel: string }[] = [
    { id: 'intersection', label: 'Intersection', shortLabel: 'Traffic' },
    { id: 'diagram', label: 'State Diagram', shortLabel: 'Diagram' },
    { id: 'timing', label: 'Phase Timing', shortLabel: 'Timing' },
    { id: 'telemetry', label: 'Logic & Sensors', shortLabel: 'Logic' },
    { id: 'guide', label: 'System Guide', shortLabel: 'Guide' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full h-14 sm:h-[68px] px-2 sm:px-8 bg-black/65 backdrop-blur-3xl border-b border-white/[0.15] select-none flex items-center justify-center shadow-[0_6px_28px_rgba(0,0,0,0.45)]">
      <nav
        aria-label="Main Navigation"
        className="w-full sm:w-auto grid grid-cols-5 sm:flex items-center justify-center gap-0.5 sm:gap-1 p-1 rounded-2xl bg-white/[0.05] border border-white/[0.12] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]"
      >
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectSection(item.id)}
              className={`h-10 sm:h-9 px-1 sm:px-4 inline-flex items-center justify-center rounded-xl text-[11px] sm:text-[13px] font-semibold tracking-tight transition-all cursor-pointer leading-none whitespace-nowrap text-center min-w-0 ${
                isActive
                  ? 'bg-[#0A84FF]/28 text-white border border-[#64D2FF]/50 shadow-[0_2px_12px_rgba(10,132,255,0.28),inset_0_1px_0_rgba(255,255,255,0.25)]'
                  : 'text-zinc-300 border border-transparent hover:bg-white/[0.08] hover:text-white'
              }`}
            >
              <span className="sm:hidden truncate">{item.shortLabel}</span>
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </header>
  );
}
