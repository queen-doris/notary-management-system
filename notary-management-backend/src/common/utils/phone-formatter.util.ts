export class PhoneFormatter {
  static formatForXentriPay(phoneNumber: string): {
    cnumber: string;
    msisdn: string;
  } {
    if (!phoneNumber) {
      throw new Error('Phone number is required');
    }

    // Remove all non-digit characters
    // eslint-disable-next-line prefer-const
    let cleaned = phoneNumber.replace(/\D/g, '');

    // Handle various formats
    if (cleaned.startsWith('250')) {
      // Format: 2507xxxxxxx (already in international format without +)
      if (cleaned.length === 12) {
        // 2507xxxxxxxx (12 digits)
        const cnumber = cleaned.substring(3); // Remove 250
        const msisdn = cleaned; // Keep as 2507xxxxxxxx
        return { cnumber, msisdn };
      }
    } else if (cleaned.startsWith('+250')) {
      // Format: +2507xxxxxxx
      if (cleaned.length === 13) {
        // +2507xxxxxxxx (13 digits including +)
        const withoutPlus = cleaned.substring(1); // Remove +
        const cnumber = withoutPlus.substring(3); // Remove 250
        const msisdn = withoutPlus; // Keep as 2507xxxxxxxx
        return { cnumber, msisdn };
      }
    } else if (cleaned.startsWith('07') || cleaned.startsWith('07')) {
      // Format: 07xxxxxxx (local format)
      if (cleaned.length === 10) {
        // 07xxxxxxxx (10 digits)
        const cnumber = cleaned;
        const msisdn = `250${cleaned.substring(1)}`; // Convert to 2507xxxxxxxx
        return { cnumber, msisdn };
      }
    } else if (cleaned.startsWith('7')) {
      // Format: 7xxxxxxx (without leading 0)
      if (cleaned.length === 9) {
        // 7xxxxxxxx (9 digits)
        const cnumber = `0${cleaned}`; // Add leading 0
        const msisdn = `250${cleaned}`; // Convert to 2507xxxxxxxx
        return { cnumber, msisdn };
      }
    }

    // If we get here, the format is invalid
    throw new Error(
      `Invalid phone number format: ${phoneNumber}. Expected formats: +2507xxxxxxx, 2507xxxxxxx, 07xxxxxxx, or 7xxxxxxx`,
    );
  }

  static validateRwandaPhoneNumber(phoneNumber: string): boolean {
    try {
      const { msisdn } = this.formatForXentriPay(phoneNumber);
      // Validate the final MSISDN format
      return /^250(7[2389]|78)\d{7}$/.test(msisdn);
    } catch {
      return false;
    }
  }
}
