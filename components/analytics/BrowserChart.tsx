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
import { Chrome, Globe } from 'lucide-react';

interface BrowserChartProps {
  data: Record<string, number>;
}

const BROWSER_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(var(--muted-foreground))'
];

const getBrowserIcon = (browser: string) => {
  const browserLower = browser.toLowerCase();
  if (browserLower.includes('chrome')) return '🌐';
  if (browserLower.includes('safari')) return '🧭';
  if (browserLower.includes('firefox')) return '🦊';
  if (browserLower.includes('edge')) return '🌊';
  if (browserLower.includes('opera')) return '🎭';
  return '🌍';
};

const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-background border border-border rounded-md p-3 shadow-md">
        <div className="flex items-center gap-2">
          <span>{getBrowserIcon(data.name as string)}</span>
          <p className="text-sm font-medium">{data.name}</p>
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

export const BrowserChart = memo(function BrowserChart({ data }: BrowserChartProps) {
  const sortedEntries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const topBrowsers = sortedEntries.slice(0, 5);
  const otherCount = sortedEntries.slice(5).reduce((sum, [_, count]) => sum + count, 0);

  const total = sortedEntries.reduce((sum, [_, count]) => sum + count, 0);

  const chartData = [
    ...topBrowsers.map(([browser, count]) => ({
      name: browser,
      value: count,
      percentage: total > 0 ? ((count / total) * 100).toFixed(1) : '0'
    })),
    ...(otherCount > 0
      ? [
          {
            name: 'Other',
            value: otherCount,
            percentage: total > 0 ? ((otherCount / total) * 100).toFixed(1) : '0'
          }
        ]
      : [])
  ];

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm text-muted-foreground">No browser data available</p>
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
              fill={BROWSER_COLORS[index % BROWSER_COLORS.length]}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{
            paddingTop: '20px'
          }}
          formatter={(value) => (
            <span className="text-sm">
              {getBrowserIcon(value)} {value}
            </span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
});