/**
 * Timer Utility
 * Performance measurement helper
 */

export interface TimerResult {
  totalMs: number;
  apiMs: number;
  processingMs: number;
}

export class Timer {
  private startTime: number;
  private apiStartTime?: number;
  private apiEndTime?: number;

  constructor() {
    this.startTime = Date.now();
  }

  startApiCall(): void {
    this.apiStartTime = Date.now();
  }

  endApiCall(): void {
    this.apiEndTime = Date.now();
  }

  getResult(): TimerResult {
    const endTime = Date.now();
    const totalMs = endTime - this.startTime;
    const apiMs = this.apiEndTime && this.apiStartTime
      ? this.apiEndTime - this.apiStartTime
      : 0;
    const processingMs = totalMs - apiMs;

    return { totalMs, apiMs, processingMs };
  }

  static format(ms: number): string {
    return `${ms}ms`;
  }
}
