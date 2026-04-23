/**
 * Phone number formatting utilities for Rwanda
 */
export class PhoneUtils {
  /**
   * Format phone number to international format (+250...)
   */
  static formatToInternational(phone: string): string {
    // Remove spaces, hyphens, and other non-numeric characters except +
    let formatted = phone.replace(/[^\d+]/g, '');

    // If starts with 0, replace with +250
    if (formatted.startsWith('0')) {
      formatted = '+250' + formatted.substring(1);
    }

    // If starts with 250 (without +), add +
    if (formatted.startsWith('250') && !formatted.startsWith('+')) {
      formatted = '+' + formatted;
    }

    // If doesn't start with +, assume it's a local number and add +250
    if (!formatted.startsWith('+')) {
      formatted = '+250' + formatted;
    }

    return formatted;
  }

  /**
   * Normalize phone for database lookup
   * Returns the phone in +250... format
   */
  static normalize(phone: string): string {
    return this.formatToInternational(phone);
  }
}
