'use client';

import React from 'react';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { format } from 'date-fns';
import type { TimeSeriesDataPoint } from '@/lib/analytics/aggregations';

interface ClicksTimeSeriesChartProps {
  data: TimeSeriesDataPoint[];
  height?: number;
  showUnique?: boolean;
}

export const ClicksTimeSeriesChart = React.memo(function ClicksTimeSeriesChart({
  data,
  height = 300,
  showUnique = true,
}: ClicksTimeSeriesChartProps) {
  if (!data || data.length === 0) {
    return (
      <div
        className="flex items-center justify-center text-muted-foreground"
        style={{ height: `${height}px` }}
      >
        No data available for the selected time period
      </div>
    );
  }

  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem);
    // If the timestamp includes time (hourly data), show date and hour
    if (tickItem.includes(':')) {
      return format(date, 'MMM d, HH:mm');
    }
    // Otherwise just show the date
    return format(date, 'MMM d');
  };

  interface TooltipProps {
    active?: boolean;
    payload?: Array<{
      value: number;
      name: string;
      color: string;
    }>;
    label?: string;
  }

  const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
    if (active && payload && payload.length && label) {
      const date = new Date(label);
      const formattedDate = label.includes(':')
        ? format(date, 'MMM d, yyyy HH:mm')
        : format(date, 'MMM d, yyyy');

      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="text-sm font-medium mb-2">{formattedDate}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm">
                {entry.name}: <span className="font-medium">{entry.value}</span>
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart
        data={data}
        margin={{
          top: 5,
          right: isMobile ? 10 : 30,
          left: isMobile ? 0 : 20,
          bottom: 5,
        }}
      >
        <defs>
          <linearGradient id="colorClicks" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorUnique" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="timestamp"
          tickFormatter={formatXAxis}
          className="text-xs"
          angle={isMobile ? -45 : 0}
          textAnchor={isMobile ? "end" : "middle"}
          height={isMobile ? 60 : 30}
        />
        <YAxis
          className="text-xs"
          width={isMobile ? 30 : 40}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{
            paddingTop: '20px',
          }}
          iconType="circle"
        />
        <Area
          type="monotone"
          dataKey="clicks"
          stroke="#8884d8"
          fillOpacity={1}
          fill="url(#colorClicks)"
          name="Total Clicks"
          strokeWidth={2}
        />
        {showUnique && (
          <Area
            type="monotone"
            dataKey="uniqueClicks"
            stroke="#82ca9d"
            fillOpacity={1}
            fill="url(#colorUnique)"
            name="Unique Clicks"
            strokeWidth={2}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
});