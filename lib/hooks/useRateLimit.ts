import { useRef, useCallback } from 'react';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  onRateLimitExceeded?: () => void;
}

interface RateLimitState {
  requests: number[];
  lastReset: number;
}

/**
 * Hook for client-side rate limiting
 * @param config - Rate limit configuration
 * @returns Object with checkRateLimit function and isRateLimited boolean
 */
export function useRateLimit(config: RateLimitConfig) {
  const { maxRequests, windowMs, onRateLimitExceeded } = config;
  const stateRef = useRef<RateLimitState>({
    requests: [],
    lastReset: Date.now(),
  });

  const cleanupOldRequests = useCallback(() => {
    const now = Date.now();
    const windowStart = now - windowMs;

    stateRef.current.requests = stateRef.current.requests.filter(
      timestamp => timestamp > windowStart
    );
  }, [windowMs]);

  const checkRateLimit = useCallback((): boolean => {
    cleanupOldRequests();

    const now = Date.now();
    const state = stateRef.current;

    if (state.requests.length >= maxRequests) {
      if (onRateLimitExceeded) {
        onRateLimitExceeded();
      }
      return false;
    }

    state.requests.push(now);
    return true;
  }, [maxRequests, cleanupOldRequests, onRateLimitExceeded]);

  const getRemainingRequests = useCallback((): number => {
    cleanupOldRequests();
    return Math.max(0, maxRequests - stateRef.current.requests.length);
  }, [maxRequests, cleanupOldRequests]);

  const getResetTime = useCallback((): number | null => {
    if (stateRef.current.requests.length === 0) {
      return null;
    }

    const oldestRequest = Math.min(...stateRef.current.requests);
    return oldestRequest + windowMs;
  }, [windowMs]);

  const reset = useCallback(() => {
    stateRef.current = {
      requests: [],
      lastReset: Date.now(),
    };
  }, []);

  return {
    checkRateLimit,
    getRemainingRequests,
    getResetTime,
    reset,
    isRateLimited: stateRef.current.requests.length >= maxRequests,
  };
}