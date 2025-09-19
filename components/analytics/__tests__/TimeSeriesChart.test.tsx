import { render, screen } from '@testing-library/react';
import { TimeSeriesChart } from '../TimeSeriesChart';
import { describe, it, expect, vi } from 'vitest';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  LineChart: ({ children }: any) => <div data-testid="line-chart">{children}</div>,
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

describe('TimeSeriesChart', () => {
  const mockData = [
    {
      periodStart: '2024-01-01T00:00:00Z',
      totalClicks: 100,
      uniqueVisitors: 50,
    },
    {
      periodStart: '2024-01-02T00:00:00Z',
      totalClicks: 150,
      uniqueVisitors: 75,
    },
    {
      periodStart: '2024-01-03T00:00:00Z',
      totalClicks: 200,
      uniqueVisitors: 100,
    },
  ];

  it('renders the chart with data', () => {
    render(<TimeSeriesChart data={mockData} dateRange="7d" />);

    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    expect(screen.getByTestId('x-axis')).toBeInTheDocument();
    expect(screen.getByTestId('y-axis')).toBeInTheDocument();
    expect(screen.getByTestId('legend')).toBeInTheDocument();
  });

  it('renders empty chart when data is empty', () => {
    render(<TimeSeriesChart data={[]} dateRange="24h" />);

    expect(screen.getByTestId('line-chart')).toBeInTheDocument();
  });

  it('renders multiple lines for clicks and visitors', () => {
    render(<TimeSeriesChart data={mockData} dateRange="30d" />);

    const lines = screen.getAllByTestId('line');
    expect(lines).toHaveLength(2);
  });
});