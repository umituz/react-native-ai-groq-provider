/**
 * Telemetry Hooks
 * Simple telemetry tracking for Groq operations
 * Optimized with O(1) circular buffer
 */

import { useMemo } from "react";

type TelemetryEvent = {
  name: string;
  timestamp: number;
  data?: Record<string, unknown>;
};

class Telemetry {
  private events: TelemetryEvent[] = [];
  private enabled: boolean;
  private readonly MAX_EVENTS = 1000;
  private head = 0; // Write position
  private count = 0; // Actual number of events

  constructor() {
    this.enabled = typeof __DEV__ !== "undefined" && __DEV__;
  }

  /**
   * Log a telemetry event - O(1) operation
   */
  log(name: string, data?: Record<string, unknown>): void {
    if (!this.enabled) return;

    const event: TelemetryEvent = {
      name,
      timestamp: Date.now(),
      data,
    };

    // Circular buffer: O(1) write
    this.events[this.head] = event;
    this.head = (this.head + 1) % this.MAX_EVENTS;

    if (this.count < this.MAX_EVENTS) {
      this.count++;
    }
  }

  /**
   * Get all events in chronological order
   * Returns frozen array to prevent external mutations
   */
  getEvents(): ReadonlyArray<TelemetryEvent> {
    if (this.count === 0) {
      return Object.freeze([]);
    }

    // O(n) but only when called, not on every log
    if (this.count < this.MAX_EVENTS) {
      // Not wrapped yet, just return slice
      return Object.freeze(this.events.slice(0, this.count));
    }

    // Wrapped around - need to reorder
    const result: TelemetryEvent[] = new Array(this.count);
    for (let i = 0; i < this.count; i++) {
      result[i] = this.events[(this.head + i) % this.MAX_EVENTS];
    }
    return Object.freeze(result);
  }

  /**
   * Clear all events - O(1)
   */
  clear(): void {
    this.head = 0;
    this.count = 0;
  }

  /**
   * Enable/disable telemetry
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (!enabled) {
      this.clear();
    }
  }

  /**
   * Check if telemetry is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Get event count - O(1)
   */
  getEventCount(): number {
    return this.count;
  }
}

/**
 * Singleton instance
 */
export const telemetry = new Telemetry();

/**
 * Hook to use telemetry in components
 * Memoized to prevent unnecessary re-renders
 */
export function useTelemetry() {
  return useMemo(
    () => ({
      log: telemetry.log.bind(telemetry),
      getEvents: telemetry.getEvents.bind(telemetry),
      clear: telemetry.clear.bind(telemetry),
      isEnabled: telemetry.isEnabled.bind(telemetry),
      getEventCount: telemetry.getEventCount.bind(telemetry),
    }),
    []
  );
}
