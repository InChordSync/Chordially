import 'reflect-metadata';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { env } from '../../../shared/config/env.js';
import { reconciliationService, type ReconciliationSummary } from './reconciliation.service.js';
import { ReconciliationSchedulerService } from './reconciliation-scheduler.service.js';

const summary: ReconciliationSummary = {
  scanned: 1,
  confirmed: 0,
  deadLettered: 0,
  stillPending: 1,
};

describe('ReconciliationSchedulerService', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('does not start a second run while one is in flight', async () => {
    let resolveRun!: (value: ReconciliationSummary) => void;
    const pending = new Promise<ReconciliationSummary>((resolve) => {
      resolveRun = resolve;
    });
    const run = vi.spyOn(reconciliationService, 'run').mockReturnValue(pending);
    const scheduler = new ReconciliationSchedulerService();

    const first = scheduler.run();
    const second = scheduler.run();

    expect(run).toHaveBeenCalledTimes(1);

    resolveRun(summary);
    await expect(first).resolves.toEqual(summary);
    await expect(second).resolves.toBeUndefined();
  });

  it('starts on bootstrap, ticks repeatedly, and stops on shutdown', () => {
    vi.useFakeTimers();
    const scheduler = new ReconciliationSchedulerService();
    const run = vi.spyOn(scheduler, 'run').mockResolvedValue(undefined);

    scheduler.onApplicationBootstrap();
    vi.advanceTimersByTime(env.RECONCILIATION_INTERVAL_MS * 2);
    expect(run).toHaveBeenCalledTimes(2);

    scheduler.onApplicationShutdown();
    vi.advanceTimersByTime(env.RECONCILIATION_INTERVAL_MS * 2);
    expect(run).toHaveBeenCalledTimes(2);
  });

  it('does not schedule when reconciliation is disabled', () => {
    vi.useFakeTimers();
    const originalEnabled = env.RECONCILIATION_ENABLED;
    env.RECONCILIATION_ENABLED = false;
    const scheduler = new ReconciliationSchedulerService();
    const run = vi.spyOn(scheduler, 'run').mockResolvedValue(undefined);

    try {
      scheduler.onApplicationBootstrap();
      vi.advanceTimersByTime(env.RECONCILIATION_INTERVAL_MS * 2);
      expect(run).not.toHaveBeenCalled();
    } finally {
      env.RECONCILIATION_ENABLED = originalEnabled;
    }
  });
});
