/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import PDFDocument from 'pdfkit';

export function generateBillPDF(bill: any) {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });

  // ================= HEADER =================
  doc.fontSize(18).text('YOUR BUSINESS NAME', { align: 'center' });
  doc.fontSize(10).text('Address | Phone | Email', { align: 'center' });

  doc.moveDown();

  doc.fontSize(12).text(`Bill No: ${bill.bill_number}`);
  doc.text(`Date: ${new Date(bill.createdAt).toLocaleDateString()}`);
  doc.text(`Client: ${bill.client.full_name}`);

  doc.moveDown();

  // ================= NOTARY =================
  if (bill.notary_items?.length) {
    doc.fontSize(14).text('NOTARY SERVICES', { underline: true });

    bill.notary_items.forEach((item) => {
      doc
        .fontSize(10)
        .text(
          `${item.service_name} - ${item.sub_service_name} | Qty: ${item.quantity} | Total: ${item.total}`,
        );
    });

    doc.moveDown();
    doc.text(`Subtotal: ${bill.notary_subtotal}`);
    doc.text(`VAT: ${bill.notary_vat}`);
    doc.text(`Total: ${bill.notary_total}`);

    if (bill.amount_refunded > 0) {
      doc.text(`Refunded: YES`);
      doc.text(`Refund Amount: ${bill.amount_refunded}`);
      doc.text(`After Refund: ${bill.notary_total - bill.amount_refunded}`);
    }

    doc.moveDown();
  }

  // ================= SECRETARIAT =================
  if (bill.secretariat_items?.length) {
    doc.fontSize(14).text('SECRETARIAT SERVICES', { underline: true });

    bill.secretariat_items.forEach((item) => {
      doc
        .fontSize(10)
        .text(
          `${item.service_name} | Qty: ${item.quantity} | Total: ${item.total}`,
        );
    });

    doc.moveDown();
    doc.text(`Total: ${bill.secretariat_total}`);

    doc.moveDown();
  }

  // ================= FOOTER =================
  doc.moveDown();
  doc.text(`Grand Total: ${bill.grand_total}`, { align: 'right' });

  doc.moveDown();
  doc.text('Signature: __________________');

  return doc;
}
