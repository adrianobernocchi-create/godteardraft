import React from 'react';
import { Shield, Flame, Wand2, Swords } from 'lucide-react';
import { ChampionRole } from '../types';
import { ROLE_INFO } from '../data/champions';

interface RoleBadgeProps {
  ruolo: ChampionRole;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const RoleBadge: React.FC<RoleBadgeProps> = ({
  ruolo,
  showIcon = true,
  size = 'md',
  className = ''
}) => {
  const info = ROLE_INFO[ruolo];

  const getIcon = () => {
    switch (ruolo) {
      case 'Guardian':
        return <Shield className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />;
      case 'Maelstrom':
        return <Flame className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />;
      case 'Shaper':
        return <Wand2 className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />;
      case 'Slayer':
        return <Swords className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />;
    }
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2 font-semibold'
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-md border ${info.bgBadge} ${info.borderBadge} ${info.textBadge} ${sizeClasses} ${className}`}
      title={info.descrizione}
    >
      {showIcon && getIcon()}
      <span>{info.nome}</span>
    </span>
  );
};
