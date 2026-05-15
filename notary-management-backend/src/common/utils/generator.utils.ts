export class Generators {
  static generateStaffCode(prefix: string = 'BT'): string {
    const randomDigits = Math.floor(1000 + Math.random() * 9000).toString();
    return `${prefix}${randomDigits}`;
  }

  static generateOtpCode(): string {
    const randomDigits = Math.floor(100000 + Math.random() * 900000).toString();
    return randomDigits;
  }

  static generateOrderNumber(orderCount: number): string {
    const paddedOrderCount = orderCount.toString().padStart(4, '0');
    return `ORD-${paddedOrderCount}`;
  }

  static generateSaleNumber(saleCount: number): string {
    const paddedOrderCount = saleCount.toString().padStart(4, '0');
    return `SALE-${paddedOrderCount}`;
  }

  static generateBillNumber(count: number): string {
    const paddedCount = count.toString().padStart(5, '0');
    return `BILL-${paddedCount}`;
  }

  static generateCreditNoteNumber(count: number): string {
    const paddedCount = count.toString().padStart(5, '0');
    return `CN-${paddedCount}`;
  }

  static generateDebitNoteNumber(count: number): string {
    const paddedCount = count.toString().padStart(5, '0');
    return `DN-${paddedCount}`;
  }

  static generatePaymentNumber(count: number): string {
    const paddedCount = count.toString().padStart(5, '0');
    return `PAY-${paddedCount}`;
  }

  static generateSupplierCode(count: number): string {
    const paddedCount = count.toString().padStart(4, '0');
    return `SUP-${paddedCount}`;
  }

  static generateTaxRecordNumber(count: number): string {
    const paddedCount = count.toString().padStart(6, '0');
    return `TAX-${paddedCount}`;
  }

  static slugify(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
