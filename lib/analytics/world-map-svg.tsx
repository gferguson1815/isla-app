'use client';

import { memo } from 'react';

interface WorldMapProps {
  getCountryColor: (countryCode: string) => string;
  onCountryHover?: (countryCode: string, event: React.MouseEvent) => void;
  onCountryLeave?: () => void;
}

export const WorldMap = memo(function WorldMap({
  getCountryColor,
  onCountryHover,
  onCountryLeave
}: WorldMapProps) {
  return (
    <svg
      viewBox="0 0 1000 500"
      className="w-full h-full"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Simplified world map - major countries only for MVP */}
      {/* United States */}
      <path
        d="M 150 200 L 250 200 L 250 250 L 150 250 Z"
        fill={getCountryColor('US')}
        stroke="hsl(var(--border))"
        strokeWidth="0.5"
        onMouseEnter={(e) => onCountryHover?.('US', e)}
        onMouseLeave={onCountryLeave}
        className="cursor-pointer transition-opacity hover:opacity-80"
      />

      {/* Canada */}
      <path
        d="M 150 150 L 250 150 L 250 200 L 150 200 Z"
        fill={getCountryColor('CA')}
        stroke="hsl(var(--border))"
        strokeWidth="0.5"
        onMouseEnter={(e) => onCountryHover?.('CA', e)}
        onMouseLeave={onCountryLeave}
        className="cursor-pointer transition-opacity hover:opacity-80"
      />

      {/* United Kingdom */}
      <path
        d="M 480 180 L 500 180 L 500 200 L 480 200 Z"
        fill={getCountryColor('GB')}
        stroke="hsl(var(--border))"
        strokeWidth="0.5"
        onMouseEnter={(e) => onCountryHover?.('GB', e)}
        onMouseLeave={onCountryLeave}
        className="cursor-pointer transition-opacity hover:opacity-80"
      />

      {/* Germany */}
      <path
        d="M 510 180 L 530 180 L 530 200 L 510 200 Z"
        fill={getCountryColor('DE')}
        stroke="hsl(var(--border))"
        strokeWidth="0.5"
        onMouseEnter={(e) => onCountryHover?.('DE', e)}
        onMouseLeave={onCountryLeave}
        className="cursor-pointer transition-opacity hover:opacity-80"
      />

      {/* France */}
      <path
        d="M 490 200 L 510 200 L 510 220 L 490 220 Z"
        fill={getCountryColor('FR')}
        stroke="hsl(var(--border))"
        strokeWidth="0.5"
        onMouseEnter={(e) => onCountryHover?.('FR', e)}
        onMouseLeave={onCountryLeave}
        className="cursor-pointer transition-opacity hover:opacity-80"
      />

      {/* Spain */}
      <path
        d="M 480 220 L 500 220 L 500 240 L 480 240 Z"
        fill={getCountryColor('ES')}
        stroke="hsl(var(--border))"
        strokeWidth="0.5"
        onMouseEnter={(e) => onCountryHover?.('ES', e)}
        onMouseLeave={onCountryLeave}
        className="cursor-pointer transition-opacity hover:opacity-80"
      />

      {/* Italy */}
      <path
        d="M 520 210 L 540 210 L 540 240 L 520 240 Z"
        fill={getCountryColor('IT')}
        stroke="hsl(var(--border))"
        strokeWidth="0.5"
        onMouseEnter={(e) => onCountryHover?.('IT', e)}
        onMouseLeave={onCountryLeave}
        className="cursor-pointer transition-opacity hover:opacity-80"
      />

      {/* Brazil */}
      <path
        d="M 300 320 L 380 320 L 380 400 L 300 400 Z"
        fill={getCountryColor('BR')}
        stroke="hsl(var(--border))"
        strokeWidth="0.5"
        onMouseEnter={(e) => onCountryHover?.('BR', e)}
        onMouseLeave={onCountryLeave}
        className="cursor-pointer transition-opacity hover:opacity-80"
      />

      {/* India */}
      <path
        d="M 700 250 L 750 250 L 750 300 L 700 300 Z"
        fill={getCountryColor('IN')}
        stroke="hsl(var(--border))"
        strokeWidth="0.5"
        onMouseEnter={(e) => onCountryHover?.('IN', e)}
        onMouseLeave={onCountryLeave}
        className="cursor-pointer transition-opacity hover:opacity-80"
      />

      {/* China */}
      <path
        d="M 750 200 L 850 200 L 850 260 L 750 260 Z"
        fill={getCountryColor('CN')}
        stroke="hsl(var(--border))"
        strokeWidth="0.5"
        onMouseEnter={(e) => onCountryHover?.('CN', e)}
        onMouseLeave={onCountryLeave}
        className="cursor-pointer transition-opacity hover:opacity-80"
      />

      {/* Japan */}
      <path
        d="M 870 220 L 900 220 L 900 250 L 870 250 Z"
        fill={getCountryColor('JP')}
        stroke="hsl(var(--border))"
        strokeWidth="0.5"
        onMouseEnter={(e) => onCountryHover?.('JP', e)}
        onMouseLeave={onCountryLeave}
        className="cursor-pointer transition-opacity hover:opacity-80"
      />

      {/* Australia */}
      <path
        d="M 800 380 L 880 380 L 880 430 L 800 430 Z"
        fill={getCountryColor('AU')}
        stroke="hsl(var(--border))"
        strokeWidth="0.5"
        onMouseEnter={(e) => onCountryHover?.('AU', e)}
        onMouseLeave={onCountryLeave}
        className="cursor-pointer transition-opacity hover:opacity-80"
      />

      {/* Russia */}
      <path
        d="M 550 120 L 850 120 L 850 180 L 550 180 Z"
        fill={getCountryColor('RU')}
        stroke="hsl(var(--border))"
        strokeWidth="0.5"
        onMouseEnter={(e) => onCountryHover?.('RU', e)}
        onMouseLeave={onCountryLeave}
        className="cursor-pointer transition-opacity hover:opacity-80"
      />

      {/* South Africa */}
      <path
        d="M 540 400 L 580 400 L 580 450 L 540 450 Z"
        fill={getCountryColor('ZA')}
        stroke="hsl(var(--border))"
        strokeWidth="0.5"
        onMouseEnter={(e) => onCountryHover?.('ZA', e)}
        onMouseLeave={onCountryLeave}
        className="cursor-pointer transition-opacity hover:opacity-80"
      />

      {/* Mexico */}
      <path
        d="M 150 250 L 220 250 L 220 280 L 150 280 Z"
        fill={getCountryColor('MX')}
        stroke="hsl(var(--border))"
        strokeWidth="0.5"
        onMouseEnter={(e) => onCountryHover?.('MX', e)}
        onMouseLeave={onCountryLeave}
        className="cursor-pointer transition-opacity hover:opacity-80"
      />

      {/* South Korea */}
      <path
        d="M 850 240 L 870 240 L 870 260 L 850 260 Z"
        fill={getCountryColor('KR')}
        stroke="hsl(var(--border))"
        strokeWidth="0.5"
        onMouseEnter={(e) => onCountryHover?.('KR', e)}
        onMouseLeave={onCountryLeave}
        className="cursor-pointer transition-opacity hover:opacity-80"
      />
    </svg>
  );
});