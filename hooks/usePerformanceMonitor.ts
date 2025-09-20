import { useEffect, useRef, useCallback } from 'react';

interface PerformanceMetrics {
  renderTime: number;
  searchTime: number;
  commandCount: number;
  timestamp: number;
}

interface PerformanceConfig {
  enabled: boolean;
  threshold: number; // ms - warn if render takes longer than this
  sampleRate: number; // 0-1 - what percentage of renders to monitor
}

const DEFAULT_CONFIG: PerformanceConfig = {
  enabled: process.env.NODE_ENV === 'development',
  threshold: 100, // 100ms
  sampleRate: 0.1, // 10% sampling
};

export function usePerformanceMonitor(component: string, config: Partial<PerformanceConfig> = {}) {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const metricsRef = useRef<PerformanceMetrics[]>([]);
  const renderStartTime = useRef<number>(0);
  const searchStartTime = useRef<number>(0);

  // Start measuring render time
  const startRender = useCallback(() => {
    if (!finalConfig.enabled || Math.random() > finalConfig.sampleRate) return;
    renderStartTime.current = performance.now();
  }, [finalConfig.enabled, finalConfig.sampleRate]);

  // End measuring render time
  const endRender = useCallback((commandCount: number = 0) => {
    if (!finalConfig.enabled || renderStartTime.current === 0) return;

    const renderTime = performance.now() - renderStartTime.current;
    renderStartTime.current = 0;

    const metrics: PerformanceMetrics = {
      renderTime,
      searchTime: 0,
      commandCount,
      timestamp: Date.now(),
    };

    metricsRef.current.push(metrics);

    // Log warning if render is slow
    if (renderTime > finalConfig.threshold) {
      console.warn(
        `${component} slow render detected:`,
        `${renderTime.toFixed(2)}ms for ${commandCount} commands`
      );
    }

    // Report to analytics if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'performance_timing', {
        event_category: 'command_palette',
        event_label: component,
        value: Math.round(renderTime),
        custom_map: {
          command_count: commandCount,
        },
      });
    }

    // Keep only last 100 measurements
    if (metricsRef.current.length > 100) {
      metricsRef.current = metricsRef.current.slice(-100);
    }
  }, [finalConfig.enabled, finalConfig.threshold, component]);

  // Start measuring search time
  const startSearch = useCallback(() => {
    if (!finalConfig.enabled) return;
    searchStartTime.current = performance.now();
  }, [finalConfig.enabled]);

  // End measuring search time
  const endSearch = useCallback((resultCount: number = 0) => {
    if (!finalConfig.enabled || searchStartTime.current === 0) return;

    const searchTime = performance.now() - searchStartTime.current;
    searchStartTime.current = 0;

    // Update last metrics entry with search time
    const lastMetrics = metricsRef.current[metricsRef.current.length - 1];
    if (lastMetrics) {
      lastMetrics.searchTime = searchTime;
    }

    // Log warning if search is slow
    if (searchTime > finalConfig.threshold / 2) { // Lower threshold for search
      console.warn(
        `${component} slow search detected:`,
        `${searchTime.toFixed(2)}ms for ${resultCount} results`
      );
    }
  }, [finalConfig.enabled, finalConfig.threshold, component]);

  // Get performance statistics
  const getStats = useCallback(() => {
    const metrics = metricsRef.current;
    if (metrics.length === 0) return null;

    const renderTimes = metrics.map(m => m.renderTime);
    const searchTimes = metrics.map(m => m.searchTime).filter(t => t > 0);

    return {
      sampleCount: metrics.length,
      avgRenderTime: renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length,
      maxRenderTime: Math.max(...renderTimes),
      minRenderTime: Math.min(...renderTimes),
      avgSearchTime: searchTimes.length > 0
        ? searchTimes.reduce((a, b) => a + b, 0) / searchTimes.length
        : 0,
      slowRenders: renderTimes.filter(t => t > finalConfig.threshold).length,
    };
  }, [finalConfig.threshold]);

  // Performance debugging helper
  const logStats = useCallback(() => {
    const stats = getStats();
    if (stats) {
      console.table({
        [`${component} Performance`]: {
          'Avg Render (ms)': stats.avgRenderTime.toFixed(2),
          'Max Render (ms)': stats.maxRenderTime.toFixed(2),
          'Avg Search (ms)': stats.avgSearchTime.toFixed(2),
          'Slow Renders': stats.slowRenders,
          'Total Samples': stats.sampleCount,
        }
      });
    }
  }, [component, getStats]);

  // Expose to window for debugging in development
  useEffect(() => {
    if (finalConfig.enabled && typeof window !== 'undefined') {
      (window as any)[`${component.toLowerCase()}PerformanceStats`] = {
        getStats,
        logStats,
        metrics: metricsRef.current,
      };
    }
  }, [component, finalConfig.enabled, getStats, logStats]);

  return {
    startRender,
    endRender,
    startSearch,
    endSearch,
    getStats,
    logStats,
  };
}