import { db } from './db';

/**
 * Delivery / pickup time options set by the admin. Times are the store's local
 * time (Europe/Stockholm). A slot is offered when it starts at least
 * `cutoffMinutes` from now, on a selected weekday that isn't a closed date.
 */
export type Schedule = { days: number[]; slots: string[]; cutoffMinutes: number; daysAhead: number; closedDates: string[]; allowAsap: boolean };

export const DEFAULT_SCHEDULE: Schedule = {
  days: [0, 1, 2, 3, 4, 5, 6],
  slots: ['10:00–12:00', '12:00–14:00', '16:00–18:00', '18:00–20:00'],
  cutoffMinutes: 120,
  daysAhead: 3,
  closedDates: [],
  allowAsap: true,
};

export async function getSchedule(): Promise<Schedule> {
  const row = await db.deliverySchedule.findUnique({ where: { id: 'main' } });
  return row ? { days: row.days, slots: row.slots, cutoffMinutes: row.cutoffMinutes, daysAhead: row.daysAhead, closedDates: row.closedDates, allowAsap: row.allowAsap } : DEFAULT_SCHEDULE;
}

const TZ = 'Europe/Stockholm';
const DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_SV = ['sön', 'mån', 'tis', 'ons', 'tor', 'fre', 'lör'];
const MONTH_SV = ['jan', 'feb', 'mar', 'apr', 'maj', 'jun', 'jul', 'aug', 'sep', 'okt', 'nov', 'dec'];

/** "10:00–12:00" → minutes after midnight of its start, or null if unreadable. */
export function slotStart(slot: string) {
  const m = slot.match(/^\s*(\d{1,2})[:.](\d{2})/);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

/** Store-local date and minutes-since-midnight for an instant. */
function local(now: Date) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(now).map((x) => [x.type, x.value]));
  return { y: +p.year, m: +p.month, d: +p.day, minutes: +p.hour * 60 + +p.minute };
}

export type SlotOption = { value: string; label: string };

/**
 * Times a customer can choose right now. `value` is what gets saved on the order
 * (an unambiguous date, e.g. "Thu 23 Oct 16:00–18:00"); `label` is for the dropdown.
 */
export function availableSlots(s: Schedule, now = new Date(), lang: 'en' | 'sv' = 'en'): SlotOption[] {
  const today = local(now);
  const out: SlotOption[] = [];
  for (let offset = 0; offset < Math.max(1, s.daysAhead); offset++) {
    const date = new Date(Date.UTC(today.y, today.m - 1, today.d + offset));
    const iso = date.toISOString().slice(0, 10);
    const wd = date.getUTCDay();
    if (!s.days.includes(wd) || s.closedDates.includes(iso)) continue;
    for (const slot of s.slots) {
      const start = slotStart(slot);
      if (start == null || offset * 1440 + start - today.minutes < s.cutoffMinutes) continue;
      const value = `${DAY[wd]} ${date.getUTCDate()} ${MONTH[date.getUTCMonth()]} ${slot}`;
      const when = lang === 'sv'
        ? offset === 0 ? 'Idag' : offset === 1 ? 'Imorgon' : `${DAY_SV[wd]} ${date.getUTCDate()} ${MONTH_SV[date.getUTCMonth()]}`
        : offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : `${DAY[wd]} ${date.getUTCDate()} ${MONTH[date.getUTCMonth()]}`;
      out.push({ value, label: `${when} ${slot}` });
    }
  }
  return out;
}
