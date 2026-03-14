/**
 * Telemetry Hooks
 * Simple telemetry tracking for Groq operations
 */

type TelemetryEvent = {
  name: string;
  timestamp: number;
  data?: Record<string, unknown>;
};

class Telemetry {
  private events: TelemetryEvent[] = [];
  private enabled = __DEV__;

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

    if (__DEV__) {
      console.log(`[Groq Telemetry] ${name}`, data);
    }
  }

  /**
   * Get all events
   */
  getEvents(): TelemetryEvent[] {
    return [...this.events];
  }

  /**
   * Clear all events
   */
  clear(): void {
    this.events = [];
  }

  /**
   * Enable/disable telemetry
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if telemetry is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

/**
 * Singleton instance
 */
export const telemetry = new Telemetry();

/**
 * Hook to use telemetry in components
 */
export function useTelemetry() {
  return {
    log: telemetry.log.bind(telemetry),
    getEvents: telemetry.getEvents.bind(telemetry),
    clear: telemetry.clear.bind(telemetry),
    isEnabled: telemetry.isEnabled.bind(telemetry),
  };
}
