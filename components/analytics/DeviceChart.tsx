'use client';

import { memo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
  TooltipProps
} from 'recharts';
import { Monitor, Smartphone, Tablet } from 'lucide-react';

interface DeviceData {
  mobile: number;
  desktop: number;
  tablet: number;
}

interface DeviceChartProps {
  data: DeviceData;
}

const COLORS = {
  desktop: 'hsl(var(--primary))',
  mobile: 'hsl(var(--chart-2))',
  tablet: 'hsl(var(--chart-3))'
};

const DEVICE_ICONS = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet
};

const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    const Icon = DEVICE_ICONS[data.name as keyof typeof DEVICE_ICONS];
    return (
      <div className="bg-background border border-border rounded-md p-3 shadow-md">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" style={{ color: data.color }} />
          <p className="text-sm font-medium capitalize">{data.name}</p>
        </div>
        <p className="text-sm mt-1">
          Clicks: <span className="font-medium">{data.value?.toLocaleString()}</span>
        </p>
        <p className="text-sm">
          Percentage: <span className="font-medium">{data.payload?.percentage}%</span>
        </p>
      </div>
    );
  }
  return null;
};

const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
  const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);

  if (percent < 0.05) return null;

  return (
    <text
      x={x}
      y={y}
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      dominantBaseline="central"
      className="text-xs font-medium"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const renderCustomizedLegend = (props: any) => {
  const { payload } = props;
  return (
    <ul className="flex justify-center gap-4 mt-4">
      {payload.map((entry: any, index: number) => {
        const Icon = DEVICE_ICONS[entry.value as keyof typeof DEVICE_ICONS];
        return (
          <li key={`item-${index}`} className="flex items-center gap-2">
            <Icon className="h-4 w-4" style={{ color: entry.color }} />
            <span className="text-sm capitalize">{entry.value}</span>
          </li>
        );
      })}
    </ul>
  );
};

export const DeviceChart = memo(function DeviceChart({ data }: DeviceChartProps) {
  const total = data.mobile + data.desktop + data.tablet;

  const chartData = [
    {
      name: 'desktop',
      value: data.desktop,
      percentage: total > 0 ? ((data.desktop / total) * 100).toFixed(1) : '0'
    },
    {
      name: 'mobile',
      value: data.mobile,
      percentage: total > 0 ? ((data.mobile / total) * 100).toFixed(1) : '0'
    },
    {
      name: 'tablet',
      value: data.tablet,
      percentage: total > 0 ? ((data.tablet / total) * 100).toFixed(1) : '0'
    }
  ].filter(item => item.value > 0);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">No device data available</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={CustomLabel}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={COLORS[entry.name as keyof typeof COLORS]}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend content={renderCustomizedLegend} />
      </PieChart>
    </ResponsiveContainer>
  );
});