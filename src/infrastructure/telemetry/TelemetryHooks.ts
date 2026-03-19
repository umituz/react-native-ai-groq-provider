/**
 * Telemetry Hooks
 * Simple telemetry tracking for Groq operations
 */

import { useMemo, useRef } from "react";

type TelemetryEvent = {
  name: string;
  timestamp: number;
  data?: Record<string, unknown>;
};

class Telemetry {
  private events: TelemetryEvent[] = [];
  private enabled: boolean;
  private readonly MAX_EVENTS = 1000;
  private nextIndex = 0; // For circular buffer
  private isCircular = false; // Track when we've wrapped around

  constructor() {
    this.enabled = typeof __DEV__ !== "undefined" && __DEV__;
  }

  /**
   * Log a telemetry event
   */
  log(name: string, data?: Record<string, unknown>): void {
    if (!this.enabled) return;

    const event: TelemetryEvent = {
      name,
      timestamp: Date.now(),
      data,
    };

    // Use circular buffer pattern for O(1) insertion
    if (this.events.length < this.MAX_EVENTS) {
      this.events.push(event);
    } else {
      // Circular buffer: overwrite oldest event
      this.events[this.nextIndex] = event;
      this.nextIndex = (this.nextIndex + 1) % this.MAX_EVENTS;
      this.isCircular = true;
    }

    if (__DEV__) {
      console.log(`[Groq Telemetry] ${name}`, data);
    }
  }

  /**
   * Get all events
   */
  getEvents(): ReadonlyArray<TelemetryEvent> {
    if (this.isCircular) {
      // Return events in circular order (oldest first)
      const result = [
        ...this.events.slice(this.nextIndex),
        ...this.events.slice(0, this.nextIndex),
      ];
      return Object.freeze(result);
    }
    return Object.freeze(this.events);
  }

  /**
   * Clear all events
   */
  clear(): void {
    this.events.length = 0;
    this.nextIndex = 0;
    this.isCircular = false;
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
   * Get event count (lightweight check)
   */
  getEventCount(): number {
    return this.isCircular ? this.MAX_EVENTS : this.events.length;
  }
}

/**
 * Singleton instance
 */
export const telemetry = new Telemetry();

/**
 * Hook to use telemetry in components
 * Optimized with useMemo to prevent unnecessary re-renders
 */
export function useTelemetry() {
  const methodsRef = useRef({
    log: telemetry.log.bind(telemetry),
    getEvents: telemetry.getEvents.bind(telemetry),
    clear: telemetry.clear.bind(telemetry),
    isEnabled: telemetry.isEnabled.bind(telemetry),
    getEventCount: telemetry.getEventCount.bind(telemetry),
  });

  return useMemo(() => methodsRef.current, []);
}
