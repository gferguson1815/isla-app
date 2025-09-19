'use client';

import { memo, useMemo, useState } from 'react';
import { WorldMap } from '@/lib/analytics/world-map-svg';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface GeoData {
  country: string;
  countryCode: string;
  clicks: number;
  percentage: number;
}

interface GeoMapProps {
  data: GeoData[];
}

const COUNTRIES_PER_PAGE = 50; // Display top 50 countries at a time for performance

export const GeoMap = memo(function GeoMap({ data }: GeoMapProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = Math.ceil(data.length / COUNTRIES_PER_PAGE);

  const paginatedData = useMemo(() => {
    const start = currentPage * COUNTRIES_PER_PAGE;
    const end = start + COUNTRIES_PER_PAGE;
    return data.slice(start, end);
  }, [data, currentPage]);

  const maxClicks = useMemo(() => {
    return Math.max(...paginatedData.map(d => d.clicks), 1);
  }, [paginatedData]);

  const countryDataMap = useMemo(() => {
    const map = new Map<string, GeoData>();
    paginatedData.forEach(item => {
      map.set(item.countryCode.toUpperCase(), item);
    });
    return map;
  }, [paginatedData]);

  const getCountryColor = (countryCode: string): string => {
    const countryData = countryDataMap.get(countryCode);
    if (!countryData) {
      return 'hsl(var(--muted))';
    }

    const intensity = countryData.clicks / maxClicks;
    const hue = 215;
    const saturation = 90;
    const lightness = 85 - (intensity * 50);

    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
  };

  const handleCountryHover = (countryCode: string, event: React.MouseEvent) => {
    const countryData = countryDataMap.get(countryCode);
    if (!countryData) return;

    const tooltip = document.getElementById('geo-tooltip');
    if (tooltip) {
      tooltip.innerHTML = `
        <div class="bg-background border border-border rounded-md p-2 shadow-md">
          <p class="font-medium">${countryData.country}</p>
          <p class="text-sm">Clicks: ${countryData.clicks.toLocaleString()}</p>
          <p class="text-sm">${countryData.percentage.toFixed(1)}% of total</p>
        </div>
      `;
      tooltip.style.display = 'block';
      tooltip.style.left = `${event.clientX + 10}px`;
      tooltip.style.top = `${event.clientY + 10}px`;
    }
  };

  const handleCountryLeave = () => {
    const tooltip = document.getElementById('geo-tooltip');
    if (tooltip) {
      tooltip.style.display = 'none';
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col">
      <div
        id="geo-tooltip"
        className="fixed z-50 pointer-events-none"
        style={{ display: 'none' }}
      />

      {/* Pagination controls for large datasets */}
      {data.length > COUNTRIES_PER_PAGE && (
        <div className="flex items-center justify-between mb-2 px-2">
          <p className="text-sm text-muted-foreground">
            Showing {paginatedData.length} of {data.length} countries
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <span className="text-sm">
              Page {currentPage + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage === totalPages - 1}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <div className="relative flex-1">
        <div className="w-full h-full flex items-center justify-center">
          <WorldMap
            getCountryColor={getCountryColor}
            onCountryHover={handleCountryHover}
            onCountryLeave={handleCountryLeave}
          />
        </div>
        <div className="absolute bottom-4 right-4 bg-background/80 backdrop-blur-sm border border-border rounded-md p-2">
          <p className="text-xs font-medium mb-1">Click Intensity</p>
          <div className="flex items-center gap-1">
            <span className="text-xs">Low</span>
            <div className="w-20 h-2 bg-gradient-to-r from-blue-100 to-blue-700 rounded-sm" />
            <span className="text-xs">High</span>
          </div>
        </div>

        {/* Country list for current page */}
        {data.length > 10 && (
          <div className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm border border-border rounded-md p-2 max-h-40 overflow-y-auto">
            <p className="text-xs font-medium mb-1">Top Countries</p>
            <div className="space-y-1">
              {paginatedData.slice(0, 5).map((country) => (
                <div key={country.countryCode} className="flex justify-between items-center gap-4 text-xs">
                  <span>{country.country}</span>
                  <span className="font-medium">{country.clicks.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});