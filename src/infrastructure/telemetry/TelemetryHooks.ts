/**
 * Telemetry Hooks
 * Simple telemetry tracking for Groq operations
 */

import { useMemo } from "react";

type TelemetryEvent = {
  name: string;
  timestamp: number;
  data?: Record<string, unknown>;
};

class Telemetry {
  private events: TelemetryEvent[] = [];
  private enabled = __DEV__;
  private readonly MAX_EVENTS = 1000; // Prevent unlimited memory growth

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

    this.events.push(event);

    // Auto-cleanup old events to prevent memory leak
    if (this.events.length > this.MAX_EVENTS) {
      this.events.splice(0, this.events.length - this.MAX_EVENTS);
    }

    if (__DEV__) {
      console.log(`[Groq Telemetry] ${name}`, data);
    }
  }

  /**
   * Get all events (returns readonly reference for performance)
   */
  getEvents(): ReadonlyArray<TelemetryEvent> {
    return this.events;
  }

  /**
   * Clear all events
   */
  clear(): void {
    this.events.length = 0; // More efficient than reassignment
  }

  /**
   * Enable/disable telemetry
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    // Disable cleanup when disabled
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
    return this.events.length;
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
