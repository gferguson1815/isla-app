'use client';

import { memo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps
} from 'recharts';
import { format, parseISO } from 'date-fns';

interface TimeSeriesData {
  periodStart: string;
  totalClicks: number;
  uniqueVisitors: number;
}

interface TimeSeriesChartProps {
  data: TimeSeriesData[];
  dateRange: '24h' | '7d' | '30d' | 'custom';
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const date = parseISO(label as string);
    return (
      <div className="bg-background border border-border rounded-md p-3 shadow-md">
        <p className="text-sm font-medium mb-1">
          {format(date, 'MMM d, yyyy HH:mm')}
        </p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value?.toLocaleString()}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const TimeSeriesChart = memo(function TimeSeriesChart({
  data,
  dateRange
}: TimeSeriesChartProps) {
  const formatXAxis = (tickItem: string) => {
    const date = parseISO(tickItem);
    if (dateRange === '24h') {
      return format(date, 'HH:mm');
    } else if (dateRange === '7d') {
      return format(date, 'EEE');
    } else {
      return format(date, 'MMM d');
    }
  };

  const chartData = data.map(item => ({
    ...item,
    periodStart: item.periodStart
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={chartData}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="periodStart"
          tickFormatter={formatXAxis}
          className="text-xs"
          stroke="currentColor"
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
        />
        <YAxis
          className="text-xs"
          stroke="currentColor"
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{
            paddingTop: '20px',
          }}
        />
        <Line
          type="monotone"
          dataKey="totalClicks"
          name="Total Clicks"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 8 }}
        />
        <Line
          type="monotone"
          dataKey="uniqueVisitors"
          name="Unique Visitors"
          stroke="hsl(var(--chart-2))"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 8 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
});