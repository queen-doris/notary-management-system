/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import * as XLSX from 'xlsx';
import PDFDocument from 'pdfkit';
import {
  Document as DocxDocument,
  Packer,
  Paragraph as DocxParagraph,
  TextRun,
  Table as DocxTable,
  TableRow as DocxTableRow,
  TableCell as DocxTableCell,
  HeadingLevel,
  WidthType,
  BorderStyle,
  AlignmentType,
} from 'docx';

export type ReportLanguage = 'rw' | 'en' | 'fr';

export interface ReportColumn {
  key: string;
  /** Per-language header label. */
  label: Record<ReportLanguage, string>;
  /** Render hint for value formatting. */
  type?: 'date' | 'money' | 'bool' | 'text';
}

export interface ReportLetter {
  /** Header block lines (notary identity), shown top-left. */
  headerLines: string[];
  /** Date/place line, e.g. "Runda, kuwa 05/01/2026". */
  placeDateLine: string;
  /** Recipient line(s). */
  recipientLines: string[];
  /** Subject line ("Impamvu: ..."). */
  subject: string;
  /** Body paragraphs. */
  bodyParagraphs: string[];
  /** Closing block lines (signature name/title). */
  closingLines: string[];
}

export interface ReportExportPayload {
  title: string;
  language: ReportLanguage;
  columns: ReportColumn[];
  rows: Record<string, unknown>[];
  /** Optional key→value summary block (already display-ready or raw). */
  summary?: Record<string, unknown> | null;
  /** Optional totals row appended under the table. */
  totalsRow?: Record<string, unknown> | null;
  /** Optional cover letter (Minijust). */
  letter?: ReportLetter | null;
  baseName: string;
  /** Sub-title lines under the title (period, business name, etc.). */
  subtitleLines?: string[];
}

export interface ReportExportResult {
  buffer: Buffer;
  filename: string;
  contentType: string;
}

const T = {
  summary: { rw: 'Incamake', en: 'Summary', fr: 'Résumé' },
  total: { rw: 'IGITERANYO', en: 'TOTAL', fr: 'TOTAL' },
  noRecords: {
    rw: 'Nta nyandiko zibonetse.',
    en: 'No records.',
    fr: 'Aucun enregistrement.',
  },
  records: { rw: 'Inyandiko', en: 'Records', fr: 'Enregistrements' },
  letter: { rw: 'Urwandiko', en: 'Letter', fr: 'Lettre' },
} as const;

/** English/Kinyarwanda/French labels for every report field key. */
const LABELS: Record<string, Record<ReportLanguage, string>> = {
  date: { rw: 'ITARIKI', en: 'DATE', fr: 'DATE' },
  book_type: { rw: 'IGITABO', en: 'BOOK', fr: 'LIVRE' },
  number: { rw: 'NUMERO', en: 'NUMBER', fr: 'NUMÉRO' },
  volume: { rw: 'VOLUME', en: 'VOLUME', fr: 'VOLUME' },
  client_full_name: { rw: 'AMAZINA', en: 'NAMES', fr: 'NOMS' },
  client_name: { rw: 'AMAZINA', en: 'CLIENT NAME', fr: 'NOM DU CLIENT' },
  client_id_number: { rw: 'ID', en: 'ID', fr: 'ID' },
  sub_service_name: { rw: 'INYANDIKO', en: 'DOCUMENT', fr: 'DOCUMENT' },
  service_name: { rw: 'SERVICE', en: 'SERVICE', fr: 'SERVICE' },
  quantity: { rw: 'UMUBARE', en: 'QTY', fr: 'QTÉ' },
  unit_price: { rw: 'IGICIRO', en: 'UNIT PRICE', fr: 'PRIX UNIT.' },
  subtotal: { rw: 'IGITERANYO GICE', en: 'SUBTOTAL', fr: 'SOUS-TOTAL' },
  vat: { rw: 'TVA', en: 'VAT', fr: 'TVA' },
  grand_total: { rw: 'IGITERANYO', en: 'TOTAL', fr: 'TOTAL' },
  is_refunded: { rw: 'YASUBIJWE', en: 'REFUNDED', fr: 'REMBOURSÉ' },
  amount_refunded: {
    rw: 'YASUBIJWE (FRW)',
    en: 'REFUNDED',
    fr: 'REMBOURSÉ',
  },
  amount_after_refund: {
    rw: 'NYUMA YO GUSUBIZA',
    en: 'NET AFTER REFUND',
    fr: 'NET APRÈS REMB.',
  },
  bill_number: { rw: 'NIMERO YA FAKTURE', en: 'BILL No', fr: 'No FACTURE' },
  bill_status: { rw: 'IMITERERE', en: 'STATUS', fr: 'STATUT' },
  status: { rw: 'IMITERERE', en: 'STATUS', fr: 'STATUT' },
  id: { rw: 'ID', en: 'ID', fr: 'ID' },
  notary_amount: {
    rw: "AMAFARANGA Y'UBUNOTERI",
    en: 'NOTARY AMOUNT',
    fr: 'MONTANT NOTAIRE',
  },
  secretariat_amount: {
    rw: 'AMAFARANGA YA SECRETARIAT',
    en: 'SECRETARIAT AMOUNT',
    fr: 'MONTANT SECRÉTARIAT',
  },
  total: { rw: 'IGITERANYO', en: 'TOTAL', fr: 'TOTAL' },
  notary_refund: {
    rw: "IYISUBIZWA RY'UBUNOTERI",
    en: 'NOTARY REFUND',
    fr: 'REMB. NOTAIRE',
  },
  secretariat_refund: {
    rw: 'IYISUBIZWA RYA SECRETARIAT',
    en: 'SECRETARIAT REFUND',
    fr: 'REMB. SECRÉTARIAT',
  },
  total_refund: {
    rw: 'IGITERANYO CYASUBIJWE',
    en: 'TOTAL REFUND',
    fr: 'REMB. TOTAL',
  },
  net_total: { rw: 'AMAFARANGA NYAKURI', en: 'NET TOTAL', fr: 'NET' },
  // summary keys
  total_bills: { rw: 'UMUBARE WA FAKTURE', en: 'Total bills', fr: 'Factures' },
  total_notary_revenue: {
    rw: "Amafaranga y'ubunoteri",
    en: 'Notary revenue',
    fr: 'Revenu notaire',
  },
  total_secretariat_revenue: {
    rw: 'Amafaranga ya secretariat',
    en: 'Secretariat revenue',
    fr: 'Revenu secrétariat',
  },
  total_vat_collected: {
    rw: 'TVA yakusanyijwe',
    en: 'VAT collected',
    fr: 'TVA collectée',
  },
  gross_revenue: {
    rw: 'Amafaranga yose (mbere yo gusubiza)',
    en: 'Gross revenue',
    fr: 'Revenu brut',
  },
  total_refunds: {
    rw: 'Amafaranga yasubijwe',
    en: 'Total refunds',
    fr: 'Remboursements',
  },
  net_revenue: {
    rw: 'Amafaranga nyakuri (net)',
    en: 'Net revenue',
    fr: 'Revenu net',
  },
  average_bill_value: {
    rw: 'Impuzandengo ya faktire',
    en: 'Average bill value',
    fr: 'Valeur moyenne',
  },
  // notary-records export extras
  client_phone: { rw: 'TELEFONE', en: 'PHONE', fr: 'TÉLÉPHONE' },
  upi: { rw: 'UPI', en: 'UPI', fr: 'UPI' },
  amount: { rw: 'IGICIRO', en: 'AMOUNT', fr: 'MONTANT' },
  has_documents: {
    rw: 'INYANDIKO ZOMETSE',
    en: 'HAS DOCS',
    fr: 'PIÈCES',
  },
};

const MONEY_KEYS = new Set([
  'unit_price',
  'subtotal',
  'vat',
  'grand_total',
  'amount_refunded',
  'amount_after_refund',
  'notary_amount',
  'secretariat_amount',
  'total',
  'notary_refund',
  'secretariat_refund',
  'total_refund',
  'net_total',
  'total_notary_revenue',
  'total_secretariat_revenue',
  'total_vat_collected',
  'gross_revenue',
  'total_refunds',
  'net_revenue',
  'average_bill_value',
  'amount',
]);

function labelFor(key: string, language: ReportLanguage): string {
  const entry = LABELS[key];
  if (entry) return entry[language] || entry.en;
  // Fallback: prettify the raw key.
  return key.replace(/_/g, ' ').toUpperCase();
}

/** Ordered column sets per report kind. Order is authoritative. */
export function getReportColumns(
  kind: string,
  language: ReportLanguage,
): ReportColumn[] {
  const col = (key: string, type?: ReportColumn['type']): ReportColumn => ({
    key,
    label: { rw: '', en: '', fr: '' },
    type,
  });
  let keys: ReportColumn[];
  if (kind === 'minijust') {
    keys = [
      col('date', 'date'),
      col('book_type'),
      col('number'),
      col('volume'),
      col('client_full_name'),
      col('client_id_number'),
      col('sub_service_name'),
      col('service_name'),
    ];
  } else if (kind === 'financial-notary') {
    keys = [
      col('date', 'date'),
      col('bill_number'),
      col('client_name'),
      col('client_id_number'),
      col('service_name'),
      col('sub_service_name'),
      col('quantity'),
      col('unit_price', 'money'),
      col('subtotal', 'money'),
      col('vat', 'money'),
      col('grand_total', 'money'),
      col('amount_refunded', 'money'),
      col('amount_after_refund', 'money'),
      col('bill_status'),
    ];
  } else if (kind === 'financial-secretariat') {
    keys = [
      col('date', 'date'),
      col('bill_number'),
      col('client_name'),
      col('client_id_number'),
      col('service_name'),
      col('quantity'),
      col('unit_price', 'money'),
      col('subtotal', 'money'),
      col('grand_total', 'money'),
      col('bill_status'),
    ];
  } else if (kind === 'daily-sales') {
    keys = [
      col('date', 'date'),
      col('bill_number'),
      col('client_name'),
      col('status'),
      col('notary_amount', 'money'),
      col('secretariat_amount', 'money'),
      col('vat', 'money'),
      col('total', 'money'),
      col('total_refund', 'money'),
      col('net_total', 'money'),
    ];
  } else if (kind === 'notary-records') {
    keys = [
      col('date', 'date'),
      col('book_type'),
      col('volume'),
      col('number'),
      col('client_full_name'),
      col('client_id_number'),
      col('client_phone'),
      col('sub_service_name'),
      col('service_name'),
      col('upi'),
      col('quantity'),
      col('unit_price', 'money'),
      col('amount', 'money'),
      col('vat', 'money'),
      col('grand_total', 'money'),
      col('has_documents', 'bool'),
      col('bill_status'),
    ];
  } else {
    keys = [];
  }
  return keys.map((c) => ({
    ...c,
    label: {
      rw: labelFor(c.key, 'rw'),
      en: labelFor(c.key, 'en'),
      fr: labelFor(c.key, 'fr'),
    },
    type: c.type || (MONEY_KEYS.has(c.key) ? 'money' : 'text'),
  }));
}

function fmtMoney(v: unknown): string {
  const n = typeof v === 'number' ? v : Number(v);
  if (!isFinite(n)) return String(v ?? '');
  return Math.round(n).toLocaleString('en-US');
}

function fmtDate(v: unknown): string {
  if (!v) return '';
  const d = v instanceof Date ? v : new Date(String(v));
  if (isNaN(d.getTime())) return String(v);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatCell(
  col: ReportColumn,
  value: unknown,
  language: ReportLanguage,
): string {
  if (value === null || value === undefined || value === '') return '';
  if (col.type === 'date') return fmtDate(value);
  if (col.type === 'money') return fmtMoney(value);
  if (col.type === 'bool') {
    const yes = { rw: 'Yego', en: 'Yes', fr: 'Oui' }[language];
    const no = { rw: 'Oya', en: 'No', fr: 'Non' }[language];
    return value ? yes : no;
  }
  return String(value);
}

/** Sum money columns into a totals row (labelled in the first column). */
export function computeTotalsRow(
  columns: ReportColumn[],
  rows: Record<string, unknown>[],
  language: ReportLanguage,
): Record<string, unknown> | null {
  const moneyCols = columns.filter((c) => c.type === 'money');
  if (!moneyCols.length || !rows.length) return null;
  const totals: Record<string, unknown> = {};
  for (const c of moneyCols) {
    totals[c.key] = rows.reduce(
      (s, r) => s + (Number(r[c.key]) || 0),
      0,
    );
  }
  const firstKey = columns[0]?.key;
  if (firstKey && !(firstKey in totals)) {
    totals[firstKey] = T.total[language];
  }
  return totals;
}

// ---------------------------------------------------------------------------
// XLSX
// ---------------------------------------------------------------------------
function buildXlsx(p: ReportExportPayload): Buffer {
  const wb = XLSX.utils.book_new();

  if (p.letter) {
    const lines: string[][] = [
      ...p.letter.headerLines.map((l) => [l]),
      [''],
      [p.letter.placeDateLine],
      [''],
      ...p.letter.recipientLines.map((l) => [l]),
      [''],
      [p.letter.subject],
      [''],
      ...p.letter.bodyParagraphs.map((l) => [l]),
      [''],
      ...p.letter.closingLines.map((l) => [l]),
    ];
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet(lines),
      T.letter[p.language],
    );
  }

  if (p.summary) {
    const summaryRows = Object.entries(p.summary).map(([k, v]) => ({
      [T.summary[p.language]]: labelFor(k, p.language),
      '': MONEY_KEYS.has(k) ? fmtMoney(v) : String(v ?? ''),
    }));
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(summaryRows),
      T.summary[p.language],
    );
  }

  const header = p.columns.map((c) => c.label[p.language]);
  const aoa: (string | number)[][] = [header];
  for (const r of p.rows) {
    aoa.push(p.columns.map((c) => formatCell(c, r[c.key], p.language)));
  }
  if (p.totalsRow) {
    aoa.push(
      p.columns.map((c) =>
        c.key in p.totalsRow! ? formatCell(c, p.totalsRow![c.key], p.language) : '',
      ),
    );
  }
  if (aoa.length === 1) aoa.push([T.noRecords[p.language]]);
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.aoa_to_sheet(aoa),
    T.records[p.language],
  );

  return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
}

// ---------------------------------------------------------------------------
// PDF (real bordered tables)
// ---------------------------------------------------------------------------
function buildPdf(p: ReportExportPayload): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 28, size: 'A4', layout: 'landscape' });
  const chunks: Buffer[] = [];
  doc.on('data', (c: Buffer) => chunks.push(c));
  const done = new Promise<Buffer>((resolve) =>
    doc.on('end', () => resolve(Buffer.concat(chunks))),
  );

  const left = doc.page.margins.left;
  const right = doc.page.width - doc.page.margins.right;
  const bottom = doc.page.height - doc.page.margins.bottom;
  const usable = right - left;

  // ---- Cover letter (first page) ----
  if (p.letter) {
    doc.font('Helvetica').fontSize(11);
    for (const l of p.letter.headerLines) doc.text(l, left);
    doc.moveDown(1);
    doc.text(p.letter.placeDateLine, left);
    doc.moveDown(1);
    for (const l of p.letter.recipientLines) doc.text(l, left);
    doc.moveDown(1);
    doc.font('Helvetica-Bold').text(p.letter.subject, left);
    doc.font('Helvetica').moveDown(1);
    for (const para of p.letter.bodyParagraphs) {
      doc.text(para, left, undefined, { align: 'justify', width: usable });
      doc.moveDown(0.8);
    }
    doc.moveDown(2);
    for (const l of p.letter.closingLines) doc.text(l, left);
    doc.addPage();
  }

  // ---- Title block ----
  doc.font('Helvetica-Bold').fontSize(15).text(p.title, left, undefined, {
    width: usable,
    align: 'center',
  });
  doc.font('Helvetica').fontSize(9);
  for (const s of p.subtitleLines || []) {
    doc.text(s, left, undefined, { width: usable, align: 'center' });
  }
  doc.moveDown(0.6);

  // ---- Summary block ----
  if (p.summary) {
    doc.font('Helvetica-Bold').fontSize(10).text(T.summary[p.language], left);
    doc.font('Helvetica').fontSize(9);
    for (const [k, v] of Object.entries(p.summary)) {
      const val = MONEY_KEYS.has(k) ? fmtMoney(v) : String(v ?? '');
      doc.text(`${labelFor(k, p.language)}: ${val}`, left);
    }
    doc.moveDown(0.6);
  }

  // ---- Table ----
  const cols = p.columns;
  if (!cols.length || !p.rows.length) {
    doc.fontSize(10).text(T.noRecords[p.language], left);
    doc.end();
    return done;
  }

  // Column widths: weighted by header + sampled content length.
  const sample = p.rows.slice(0, 40);
  const weights = cols.map((c) => {
    const headerLen = c.label[p.language].length;
    let maxLen = headerLen;
    for (const r of sample) {
      const len = formatCell(c, r[c.key], p.language).length;
      if (len > maxLen) maxLen = len;
    }
    return Math.min(Math.max(maxLen, 4), 40);
  });
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const colWidths = weights.map((w) => Math.floor((w / weightSum) * usable));

  const padX = 3;
  const padY = 3;
  const headerFontSize = 8;
  const bodyFontSize = 7.5;

  const measureRow = (
    cells: string[],
    fontSize: number,
    bold: boolean,
  ): number => {
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(fontSize);
    let h = 0;
    cells.forEach((txt, i) => {
      const ch = doc.heightOfString(txt || '', {
        width: colWidths[i] - padX * 2,
      });
      if (ch > h) h = ch;
    });
    return Math.ceil(h) + padY * 2;
  };

  const drawRow = (
    y: number,
    cells: string[],
    opts: { bold?: boolean; fill?: string; fontSize: number },
  ): number => {
    const rowH = measureRow(cells, opts.fontSize, !!opts.bold);
    let x = left;
    doc.font(opts.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(
      opts.fontSize,
    );
    cells.forEach((txt, i) => {
      const w = colWidths[i];
      if (opts.fill) {
        doc.save().rect(x, y, w, rowH).fill(opts.fill).restore();
      }
      doc.lineWidth(0.5).strokeColor('#888').rect(x, y, w, rowH).stroke();
      doc
        .fillColor('#000')
        .text(txt || '', x + padX, y + padY, {
          width: w - padX * 2,
          height: rowH - padY * 2,
        });
      x += w;
    });
    return y + rowH;
  };

  const headerCells = cols.map((c) => c.label[p.language]);
  let y = doc.y;
  y = drawRow(y, headerCells, {
    bold: true,
    fill: '#e6e6e6',
    fontSize: headerFontSize,
  });

  let zebra = false;
  for (const r of p.rows) {
    const cells = cols.map((c) => formatCell(c, r[c.key], p.language));
    const projected = measureRow(cells, bodyFontSize, false);
    if (y + projected > bottom) {
      doc.addPage();
      y = doc.page.margins.top;
      y = drawRow(y, headerCells, {
        bold: true,
        fill: '#e6e6e6',
        fontSize: headerFontSize,
      });
    }
    y = drawRow(y, cells, {
      fontSize: bodyFontSize,
      fill: zebra ? '#f5f5f5' : undefined,
    });
    zebra = !zebra;
  }

  if (p.totalsRow) {
    const cells = cols.map((c) =>
      c.key in p.totalsRow! ? formatCell(c, p.totalsRow![c.key], p.language) : '',
    );
    const projected = measureRow(cells, headerFontSize, true);
    if (y + projected > bottom) {
      doc.addPage();
      y = doc.page.margins.top;
    }
    drawRow(y, cells, {
      bold: true,
      fill: '#dcdcdc',
      fontSize: headerFontSize,
    });
  }

  doc.end();
  return done;
}

// ---------------------------------------------------------------------------
// DOCX (bordered table)
// ---------------------------------------------------------------------------
const DOCX_BORDER = {
  top: { style: BorderStyle.SINGLE, size: 4, color: '888888' },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: '888888' },
  left: { style: BorderStyle.SINGLE, size: 4, color: '888888' },
  right: { style: BorderStyle.SINGLE, size: 4, color: '888888' },
};

function docxCell(text: string, bold = false, shade?: string): DocxTableCell {
  return new DocxTableCell({
    borders: DOCX_BORDER,
    shading: shade ? { fill: shade } : undefined,
    children: [
      new DocxParagraph({
        children: [new TextRun({ text: text || '', bold, size: 16 })],
      }),
    ],
  });
}

async function buildDocx(p: ReportExportPayload): Promise<Buffer> {
  const children: (DocxParagraph | DocxTable)[] = [];

  if (p.letter) {
    for (const l of p.letter.headerLines) {
      children.push(new DocxParagraph({ children: [new TextRun(l)] }));
    }
    children.push(new DocxParagraph(''));
    children.push(new DocxParagraph(p.letter.placeDateLine));
    children.push(new DocxParagraph(''));
    for (const l of p.letter.recipientLines) {
      children.push(new DocxParagraph(l));
    }
    children.push(new DocxParagraph(''));
    children.push(
      new DocxParagraph({
        children: [new TextRun({ text: p.letter.subject, bold: true })],
      }),
    );
    children.push(new DocxParagraph(''));
    for (const para of p.letter.bodyParagraphs) {
      children.push(
        new DocxParagraph({
          alignment: AlignmentType.JUSTIFIED,
          children: [new TextRun(para)],
        }),
      );
    }
    children.push(new DocxParagraph(''));
    children.push(new DocxParagraph(''));
    for (const l of p.letter.closingLines) {
      children.push(new DocxParagraph(l));
    }
    children.push(
      new DocxParagraph({ children: [], pageBreakBefore: true }),
    );
  }

  children.push(
    new DocxParagraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: p.title, bold: true })],
    }),
  );
  for (const s of p.subtitleLines || []) {
    children.push(
      new DocxParagraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: s, size: 18 })],
      }),
    );
  }
  children.push(new DocxParagraph(''));

  if (p.summary) {
    children.push(
      new DocxParagraph({
        children: [new TextRun({ text: T.summary[p.language], bold: true })],
      }),
    );
    for (const [k, v] of Object.entries(p.summary)) {
      const val = MONEY_KEYS.has(k) ? fmtMoney(v) : String(v ?? '');
      children.push(new DocxParagraph(`${labelFor(k, p.language)}: ${val}`));
    }
    children.push(new DocxParagraph(''));
  }

  if (p.columns.length && p.rows.length) {
    const headerRow = new DocxTableRow({
      tableHeader: true,
      children: p.columns.map((c) =>
        docxCell(c.label[p.language], true, 'E6E6E6'),
      ),
    });
    const dataRows = p.rows.map(
      (r) =>
        new DocxTableRow({
          children: p.columns.map((c) =>
            docxCell(formatCell(c, r[c.key], p.language)),
          ),
        }),
    );
    const allRows = [headerRow, ...dataRows];
    if (p.totalsRow) {
      allRows.push(
        new DocxTableRow({
          children: p.columns.map((c) =>
            docxCell(
              c.key in p.totalsRow!
                ? formatCell(c, p.totalsRow![c.key], p.language)
                : '',
              true,
              'DCDCDC',
            ),
          ),
        }),
      );
    }
    children.push(
      new DocxTable({
        rows: allRows,
        width: { size: 100, type: WidthType.PERCENTAGE },
      }),
    );
  } else {
    children.push(new DocxParagraph(T.noRecords[p.language]));
  }

  const document = new DocxDocument({ sections: [{ children }] });
  return Buffer.from(await Packer.toBuffer(document));
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------
export async function renderReport(
  format: string,
  payload: ReportExportPayload,
): Promise<ReportExportResult> {
  const fmt = (format || 'xlsx').toLowerCase();
  if (fmt === 'xlsx') {
    return {
      buffer: buildXlsx(payload),
      filename: `${payload.baseName}.xlsx`,
      contentType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
  }
  if (fmt === 'pdf') {
    return {
      buffer: await buildPdf(payload),
      filename: `${payload.baseName}.pdf`,
      contentType: 'application/pdf',
    };
  }
  if (fmt === 'docx') {
    return {
      buffer: await buildDocx(payload),
      filename: `${payload.baseName}.docx`,
      contentType:
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    };
  }
  throw new Error('Unknown format. Use: xlsx | pdf | docx');
}
