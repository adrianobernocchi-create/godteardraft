import React from 'react';
import { ChampionRole } from '../types';
import { ROLE_INFO } from '../data/champions';

interface ChampionEmblemProps {
  name: string;
  role: ChampionRole;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const ChampionEmblem: React.FC<ChampionEmblemProps> = ({
  name,
  role,
  size = 'md',
  className = ''
}) => {
  const roleInfo = ROLE_INFO[role];

  // Extract up to 2 initials
  const initials = name
    .split(/[\s'-]+/)
    .map(p => p.charAt(0))
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const dimensions = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-lg',
    xl: 'w-24 h-24 text-2xl'
  }[size];

  const glowStyles: Record<ChampionRole, string> = {
    Guardian: 'border-blue-500/50 bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900/40 text-blue-300 shadow-blue-950/50',
    Maelstrom: 'border-amber-500/50 bg-gradient-to-br from-amber-950 via-slate-900 to-amber-900/40 text-amber-300 shadow-amber-950/50',
    Shaper: 'border-emerald-500/50 bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-900/40 text-emerald-300 shadow-emerald-950/50',
    Slayer: 'border-rose-500/50 bg-gradient-to-br from-rose-950 via-slate-900 to-rose-900/40 text-rose-300 shadow-rose-950/50'
  };

  return (
    <div
      className={`relative inline-flex items-center justify-center font-cinzel font-bold rounded-lg border-2 shadow-md shrink-0 select-none ${glowStyles[role]} ${dimensions} ${className}`}
      title={`${name} (${roleInfo.nome})`}
    >
      {/* Corner decorative accents */}
      <span className="absolute top-0.5 left-0.5 w-1 h-1 rounded-full bg-amber-400/60" />
      <span className="absolute top-0.5 right-0.5 w-1 h-1 rounded-full bg-amber-400/60" />
      <span className="absolute bottom-0.5 left-0.5 w-1 h-1 rounded-full bg-amber-400/60" />
      <span className="absolute bottom-0.5 right-0.5 w-1 h-1 rounded-full bg-amber-400/60" />

      {/* Initials */}
      <span className="tracking-wider drop-shadow">{initials}</span>
    </div>
  );
};
