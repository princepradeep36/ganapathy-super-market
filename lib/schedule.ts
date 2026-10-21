import { db } from './db';
import { DEFAULT_SCHEDULE, sortSlots, type Schedule } from './slots';

export * from './slots';

/** The admin's delivery / pickup settings, or the defaults until they save some. */
export async function getSchedule(): Promise<Schedule> {
  const row = await db.deliverySchedule.findUnique({ where: { id: 'main' } });
  return row ? { days: row.days, slots: sortSlots(row.slots), cutoffMinutes: row.cutoffMinutes, daysAhead: row.daysAhead, closedDates: row.closedDates, allowAsap: row.allowAsap } : DEFAULT_SCHEDULE;
}

