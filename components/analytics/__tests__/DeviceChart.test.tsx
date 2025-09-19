import { render, screen } from '@testing-library/react';
import { DeviceChart } from '../DeviceChart';
import { describe, it, expect, vi } from 'vitest';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  PieChart: ({ children }: any) => <div data-testid="pie-chart">{children}</div>,
  Pie: ({ children }: any) => <div data-testid="pie">{children}</div>,
  Cell: () => <div data-testid="cell" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

describe('DeviceChart', () => {
  it('renders pie chart with device data', () => {
    const data = {
      mobile: 500,
      desktop: 300,
      tablet: 200,
    };

    render(<DeviceChart data={data} />);

    expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    expect(screen.getByTestId('pie')).toBeInTheDocument();
    expect(screen.getAllByTestId('cell')).toHaveLength(3);
  });

  it('shows message when no data available', () => {
    const data = {
      mobile: 0,
      desktop: 0,
      tablet: 0,
    };

    render(<DeviceChart data={data} />);

    expect(screen.getByText('No device data available')).toBeInTheDocument();
  });

  it('filters out devices with zero clicks', () => {
    const data = {
      mobile: 100,
      desktop: 0,
      tablet: 50,
    };

    render(<DeviceChart data={data} />);

    const cells = screen.getAllByTestId('cell');
    expect(cells).toHaveLength(2);
  });
});