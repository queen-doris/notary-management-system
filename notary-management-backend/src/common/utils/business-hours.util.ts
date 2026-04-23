import { EWorkingDays } from 'src/shared/enums/working-days.enum';
import { Business } from 'src/shared/entities/business.entity';

type HoursStatus = {
  isOpen: boolean;
  nextOpenAt: string | null;
  effectiveDay: EWorkingDays;
  nowLocal: Date;
};

const ALL_DAYS = Object.values(EWorkingDays);

const toMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map((v) => parseInt(v, 10));
  return hours * 60 + minutes;
};

const getZonedDate = (date: Date, timeZone?: string): Date => {
  // Fallback: if no timezone provided, use server local time.
  if (!timeZone) return date;
  // Converting by formatting to the desired zone then rehydrating.
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
    .formatToParts(date)
    .reduce<Record<string, string>>((acc, part) => {
      if (part.type !== 'literal') acc[part.type] = part.value;
      return acc;
    }, {});

  return new Date(
    `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}Z`,
  );
};

const getDayByIndex = (index: number): EWorkingDays => {
  return ALL_DAYS[index] ?? EWorkingDays.MONDAY;
};

export const BusinessHoursUtil = {
  /**
   * Determines if a business is open right now, supporting overnight windows.
   */
  evaluateStatus(business: Business, now = new Date()): HoursStatus {
    if (business.is24Hours) {
      const nowLocal = getZonedDate(now, business.timezone);
      return {
        isOpen: true,
        nextOpenAt: null,
        effectiveDay: getDayByIndex(nowLocal.getDay()),
        nowLocal,
      };
    }

    const nowLocal = getZonedDate(now, business.timezone);
    const minutes = nowLocal.getHours() * 60 + nowLocal.getMinutes();
    const openingMinutes = toMinutes(business.openingTime || '00:00');
    const closingMinutes = toMinutes(business.closingTime || '23:59');
    const isOvernight = closingMinutes <= openingMinutes;

    const weekday = getDayByIndex(nowLocal.getDay());
    const previousWeekday = getDayByIndex((nowLocal.getDay() + 6) % 7);

    // Overnight: early morning belongs to previous day window
    const effectiveDay =
      isOvernight && minutes < closingMinutes ? previousWeekday : weekday;

    const workingDays = business.workingDays?.length
      ? business.workingDays
      : ALL_DAYS;
    const isWorkingDay = workingDays.includes(effectiveDay);

    let isOpen = false;
    if (isWorkingDay) {
      if (isOvernight) {
        isOpen = minutes >= openingMinutes || minutes < closingMinutes;
      } else {
        isOpen =
          minutes >= openingMinutes && minutes < Math.max(closingMinutes, 1);
      }
    }

    const nextOpenAt = isOpen
      ? null
      : BusinessHoursUtil.getNextOpenAt({
          workingDays,
          openingMinutes,
          closingMinutes,
          isOvernight,
          nowLocal,
        });

    return { isOpen, nextOpenAt, effectiveDay, nowLocal };
  },

  /**
   * Finds the next opening datetime in ISO string in the business timezone.
   */
  getNextOpenAt(params: {
    workingDays: EWorkingDays[];
    openingMinutes: number;
    closingMinutes: number;
    isOvernight: boolean;
    nowLocal: Date;
  }): string {
    const { workingDays, openingMinutes, isOvernight, nowLocal } = params;
    const currentMinutes = nowLocal.getHours() * 60 + nowLocal.getMinutes();
    const currentDayIndex = nowLocal.getDay();

    // Helper to build ISO string at specific day offset and minutes
    const buildIso = (dayOffset: number, minutes: number) => {
      const target = new Date(nowLocal);
      target.setDate(target.getDate() + dayOffset);
      target.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
      return target.toISOString();
    };

    // If today is a working day and we haven't reached opening time yet
    const todayWorking = workingDays.includes(getDayByIndex(currentDayIndex));
    if (todayWorking && currentMinutes < openingMinutes) {
      return buildIso(0, openingMinutes);
    }

    // Otherwise find the next working day
    for (let offset = 1; offset <= 7; offset++) {
      const dayIndex = (currentDayIndex + offset) % 7;
      if (workingDays.includes(getDayByIndex(dayIndex))) {
        return buildIso(offset, openingMinutes);
      }
    }

    // Fallback: open tomorrow
    return buildIso(1, openingMinutes);
  },

  /**
   * Returns start/end Date objects for a given calendar day in the business timezone,
   * respecting overnight hours. For same-day hours: start=open on that date, end=close on that date.
   * For overnight (close <= open): end is on the next calendar day at closing time.
   */
  getBusinessDayBounds(params: {
    date: Date; // calendar day reference (local to caller)
    business: Business;
  }): { start: Date; end: Date } {
    const { date, business } = params;
    const tz = business.timezone;
    const open = business.openingTime || '00:00';
    const close = business.closingTime || '23:59';
    const openingMinutes = toMinutes(open);
    const closingMinutes = toMinutes(close);
    const isOvernight = closingMinutes <= openingMinutes;

    // Build start in TZ
    const localStart = getZonedDate(date, tz);
    localStart.setHours(
      Math.floor(openingMinutes / 60),
      openingMinutes % 60,
      0,
      0,
    );

    const localEnd = new Date(localStart);
    if (isOvernight) {
      // advance to next day
      localEnd.setDate(localEnd.getDate() + 1);
    }
    localEnd.setHours(
      Math.floor(closingMinutes / 60),
      closingMinutes % 60,
      59,
      999,
    );

    // Convert back to Date (these are already Date objects with absolute time)
    return { start: localStart, end: localEnd };
  },
};
