/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { EWorkingDays } from 'src/shared/enums/working-days.enum';

export class WorkingDaysUtil {
  static getAllDays(): EWorkingDays[] {
    return Object.values(EWorkingDays);
  }

  static getWeekdays(): EWorkingDays[] {
    return [
      EWorkingDays.MONDAY,
      EWorkingDays.TUESDAY,
      EWorkingDays.WEDNESDAY,
      EWorkingDays.THURSDAY,
      EWorkingDays.FRIDAY,
    ];
  }

  static getWeekendDays(): EWorkingDays[] {
    return [EWorkingDays.SATURDAY, EWorkingDays.SUNDAY];
  }

  static isDayIncluded(days: EWorkingDays[], day: EWorkingDays): boolean {
    return days.includes(day);
  }

  static formatDaysForDisplay(days: EWorkingDays[]): string {
    if (days.length === 7) return 'Every day';
    if (days.length === 5 && this.isWeekdaysOnly(days)) return 'Weekdays';
    if (days.length === 2 && this.isWeekendOnly(days)) return 'Weekends';

    return days.join(', ');
  }

  private static isWeekdaysOnly(days: EWorkingDays[]): boolean {
    const weekdays = this.getWeekdays();
    return (
      days.every((day) => weekdays.includes(day)) &&
      days.length === weekdays.length
    );
  }

  private static isWeekendOnly(days: EWorkingDays[]): boolean {
    const weekendDays = this.getWeekendDays();
    return (
      days.every((day) => weekendDays.includes(day)) &&
      days.length === weekendDays.length
    );
  }
}
