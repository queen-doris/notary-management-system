/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import * as XLSX from 'xlsx-js-style';
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
  ImageRun,
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
  /** Optional handwritten-signature image, placed above the closing name. */
  signatureImage?: Buffer | null;
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
  /**
   * Notary identity lines printed at the top of EVERY records page
   * (Minijust + notary-records), exactly like the official document.
   */
  pageHeaderLines?: string[];
  /**
   * 'plain' = official-document look (white cells, thin borders, bold
   * header, no shading/zebra). 'styled' = accented look for internal
   * financial/daily reports. Default 'styled'.
   */
  tableStyle?: 'plain' | 'styled';
}

export interface ReportExportResult {
  buffer: Buffer;
  filename: string;
  contentType: string;
}

const T = {
  summary: { rw: 'Incamake', en: 'Summary', fr: 'Résumé' },
  total: { rw: 'BYOSE HAMWE', en: 'TOTAL', fr: 'TOTAL' },
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
  unit_price: { rw: 'IKIGUZI', en: 'UNIT PRICE', fr: 'PRIX UNIT.' },
  subtotal: { rw: 'IGITERANYO', en: 'SUBTOTAL', fr: 'SOUS-TOTAL' },
  vat: { rw: 'TVA', en: 'VAT', fr: 'TVA' },
  grand_total: { rw: 'BYOSE HAMWE', en: 'TOTAL', fr: 'TOTAL' },
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
  bill_number: { rw: 'NIMERO YA FAGITIRE', en: 'BILL No', fr: 'No FACTURE' },
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
  total: { rw: 'BYOSE HAMWE', en: 'TOTAL', fr: 'TOTAL' },
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
  total_bills: {
    rw: 'UMUBARE WA FAGITIRE',
    en: 'Total bills',
    fr: 'Factures',
  },
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
    rw: 'Impuzandengo ya fagitire',
    en: 'Average bill value',
    fr: 'Valeur moyenne',
  },
  // notary-records export extras
  client_phone: { rw: 'TELEFONE', en: 'PHONE', fr: 'TÉLÉPHONE' },
  upi: { rw: 'UPI', en: 'UPI', fr: 'UPI' },
  amount: { rw: 'AGACIRO', en: 'AMOUNT', fr: 'MONTANT' },
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

function imgType(buf: Buffer): 'png' | 'jpg' | null {
  if (!buf || buf.length < 4) return null;
  if (buf[0] === 0x89 && buf[1] === 0x50) return 'png';
  if (buf[0] === 0xff && buf[1] === 0xd8) return 'jpg';
  return 'png';
}

const ACCENT_HEX = '1A3C6E';

// ---------------------------------------------------------------------------
// XLSX
// ---------------------------------------------------------------------------
const XLSX_HEADER_STYLE = {
  font: { bold: true, sz: 11, color: { rgb: '1A3C6E' } },
  fill: { fgColor: { rgb: 'E6E6E6' } },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
};
const XLSX_TOTAL_STYLE = {
  font: { bold: true, sz: 11 },
  fill: { fgColor: { rgb: 'DCDCDC' } },
};

function styleSheet(
  ws: Record<string, unknown>,
  nCols: number,
  nRows: number,
  hasTotals: boolean,
): void {
  for (let c = 0; c < nCols; c++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c });
    const cell = ws[addr] as { s?: unknown } | undefined;
    if (cell) cell.s = XLSX_HEADER_STYLE;
  }
  if (hasTotals && nRows > 1) {
    for (let c = 0; c < nCols; c++) {
      const addr = XLSX.utils.encode_cell({ r: nRows - 1, c });
      const cell = ws[addr] as { s?: unknown } | undefined;
      if (cell) cell.s = XLSX_TOTAL_STYLE;
    }
  }
}

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
    const ls = XLSX.utils.aoa_to_sheet(lines);
    ls['!cols'] = [{ wch: 110 }];
    XLSX.utils.book_append_sheet(wb, ls, T.letter[p.language]);
  }

  if (p.summary) {
    const aoa: string[][] = [
      [T.summary[p.language], ''],
      ...Object.entries(p.summary).map(([k, v]) => [
        labelFor(k, p.language),
        MONEY_KEYS.has(k) ? fmtMoney(v) : String(v ?? ''),
      ]),
    ];
    const ss = XLSX.utils.aoa_to_sheet(aoa);
    ss['!cols'] = [{ wch: 38 }, { wch: 22 }];
    const title = ss['A1'] as { s?: unknown } | undefined;
    if (title)
      title.s = { font: { bold: true, sz: 13, color: { rgb: '1A3C6E' } } };
    for (let r = 1; r < aoa.length; r++) {
      const lc = ss[XLSX.utils.encode_cell({ r, c: 0 })] as
        | { s?: unknown }
        | undefined;
      const vc = ss[XLSX.utils.encode_cell({ r, c: 1 })] as
        | { s?: unknown }
        | undefined;
      if (lc) lc.s = { font: { color: { rgb: '555555' } } };
      if (vc)
        vc.s = {
          font: { bold: true },
          alignment: { horizontal: 'right' },
        };
    }
    XLSX.utils.book_append_sheet(wb, ss, T.summary[p.language]);
  }

  const header = p.columns.map((c) => c.label[p.language]);
  const aoa: (string | number)[][] = [header];
  for (const r of p.rows) {
    aoa.push(p.columns.map((c) => formatCell(c, r[c.key], p.language)));
  }
  if (p.totalsRow) {
    aoa.push(
      p.columns.map((c) =>
        c.key in p.totalsRow!
          ? formatCell(c, p.totalsRow![c.key], p.language)
          : '',
      ),
    );
  }
  if (aoa.length === 1) aoa.push([T.noRecords[p.language]]);
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  // Column widths from max content length.
  ws['!cols'] = p.columns.map((c, i) => {
    let w = c.label[p.language].length;
    for (const row of aoa.slice(1)) {
      const len = String(row[i] ?? '').length;
      if (len > w) w = len;
    }
    return { wch: Math.min(Math.max(w + 2, 8), 45) };
  });
  ws['!freeze'] = { xSplit: 0, ySplit: 1 };
  styleSheet(ws, p.columns.length, aoa.length, !!p.totalsRow);
  XLSX.utils.book_append_sheet(wb, ws, T.records[p.language]);

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

  const ACCENT = '#1A3C6E';
  const lineWidthPt = (txt: string, font: string, size: number): number => {
    doc.font(font).fontSize(size);
    return doc.widthOfString(txt || '');
  };

  // ---- Cover letter (first page) ----
  if (p.letter) {
    const L = p.letter;
    doc.fillColor('#000');
    doc.font('Helvetica-Bold').fontSize(11).text(L.headerLines[0] || '', left);
    doc.font('Helvetica').fontSize(10.5);
    for (const l of L.headerLines.slice(1)) {
      doc.text(l, left, undefined, { lineGap: 2 });
    }
    doc.moveDown(1.4);
    doc.text(L.placeDateLine, left);
    doc.moveDown(1.4);
    for (const l of L.recipientLines) doc.text(l, left, undefined, {
      lineGap: 2,
    });
    doc.moveDown(1.2);
    doc.font('Helvetica-Bold').fontSize(11).text(L.subject, left);
    doc.font('Helvetica').fontSize(10.5).moveDown(1.2);
    for (const para of L.bodyParagraphs) {
      doc.text(para, left, undefined, {
        align: 'justify',
        width: usable,
        lineGap: 3,
      });
      doc.moveDown(0.9);
    }
    doc.moveDown(1.5);
    const closing = L.closingLines.filter((l) => l !== '');
    if (closing[0]) doc.text(closing[0], left); // "Bikorewe ... kuwa ..."
    doc.moveDown(0.4);
    if (L.signatureImage) {
      try {
        doc.image(L.signatureImage, left, doc.y, {
          fit: [150, 60],
        });
        doc.moveDown(0.3);
        doc.y += 46;
      } catch {
        /* ignore unreadable signature */
      }
    } else {
      doc.moveDown(2.4);
    }
    for (const l of closing.slice(1)) {
      doc.font('Helvetica-Bold').fontSize(10.5).text(l, left);
    }
    doc.font('Helvetica');
    doc.addPage();
  }

  const plain = p.tableStyle === 'plain' || !!p.pageHeaderLines;

  // Official-document header (notary identity) repeated on every records
  // page, then a centered title + rule — exactly like the Minijust doc.
  const drawProfileHeader = (): number => {
    let yy = doc.page.margins.top;
    doc.fillColor('#000');
    (p.pageHeaderLines || []).forEach((l, i) => {
      doc
        .font(i === 0 ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(i === 0 ? 11 : 10)
        .text(l, left, yy);
      yy = doc.y;
    });
    yy += 14;
    doc
      .font('Helvetica-Bold')
      .fontSize(13)
      .fillColor('#000')
      .text(p.title, left, yy, { width: usable, align: 'center' });
    yy = doc.y + 4;
    doc
      .lineWidth(0.75)
      .strokeColor('#000')
      .moveTo(left, yy)
      .lineTo(right, yy)
      .stroke();
    return yy + 8;
  };

  // Accented header + summary card for internal financial/daily reports.
  const drawReportHeaderOnce = (): number => {
    const bannerH = 34 + (p.subtitleLines?.length || 0) * 13;
    doc.save().roundedRect(left, doc.y, usable, bannerH, 5).fill(ACCENT);
    doc.restore();
    let yy = doc.page.margins.top + 9;
    doc
      .fillColor('#FFFFFF')
      .font('Helvetica-Bold')
      .fontSize(17)
      .text(p.title, left, yy, { width: usable, align: 'center' });
    yy = doc.y + 1;
    doc.font('Helvetica').fontSize(9.5).fillColor('#DCE6F5');
    for (const s of p.subtitleLines || []) {
      doc.text(s, left, yy, { width: usable, align: 'center' });
      yy = doc.y;
    }
    let cursor = doc.page.margins.top + bannerH + 14;

    if (p.summary && Object.keys(p.summary).length) {
      const entries = Object.entries(p.summary);
      const padB = 12;
      const lineH = 18;
      const titleH = 22;
      const boxH = titleH + entries.length * lineH + padB;
      doc
        .save()
        .roundedRect(left, cursor, usable, boxH, 4)
        .fillAndStroke('#F4F7FB', ACCENT)
        .restore();
      // accent left bar
      doc.save().rect(left, cursor, 4, boxH).fill(ACCENT).restore();
      doc
        .fillColor(ACCENT)
        .font('Helvetica-Bold')
        .fontSize(12)
        .text(T.summary[p.language], left + 14, cursor + 8);
      let ry = cursor + titleH + 4;
      for (const [k, v] of entries) {
        const val = MONEY_KEYS.has(k) ? fmtMoney(v) : String(v ?? '');
        doc
          .font('Helvetica')
          .fontSize(10)
          .fillColor('#555')
          .text(`${labelFor(k, p.language)}`, left + 14, ry, {
            width: usable * 0.6,
          });
        doc
          .font('Helvetica-Bold')
          .fontSize(10.5)
          .fillColor('#000')
          .text(val, left + usable * 0.6, ry, {
            width: usable * 0.4 - 14,
            align: 'right',
          });
        ry += lineH;
      }
      cursor += boxH + 16;
    }
    doc.fillColor('#000');
    return cursor;
  };

  // ---- Table ----
  const cols = p.columns;
  if (!cols.length || !p.rows.length) {
    const startY = p.pageHeaderLines
      ? drawProfileHeader()
      : drawReportHeaderOnce();
    doc
      .fillColor('#000')
      .font('Helvetica')
      .fontSize(10)
      .text(T.noRecords[p.language], left, startY);
    doc.end();
    return done;
  }

  const padX = 4;
  const padY = 4;
  const headerFontSize = 7.5;
  const bodyFontSize = 7.5;

  // Column widths: proportional to content, then bumped so no header/cell
  // word is ever broken mid-word (min width >= widest single word).
  const sample = p.rows.slice(0, 60);
  const longestWordPt = (c: ReportColumn): number => {
    const texts = [
      c.label[p.language],
      ...sample.map((r) => formatCell(c, r[c.key], p.language)),
    ];
    let maxW = 0;
    for (const t of texts) {
      for (const word of String(t).split(/\s+/)) {
        const w = lineWidthPt(word, 'Helvetica-Bold', headerFontSize);
        if (w > maxW) maxW = w;
      }
    }
    return maxW + padX * 2 + 2;
  };
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
  const colWidths = weights.map((w) =>
    Math.floor((w / weightSum) * usable),
  );
  // Enforce per-column minimum (widest word) then rebalance.
  const minW = cols.map((c) => longestWordPt(c));
  for (let i = 0; i < colWidths.length; i++) {
    if (colWidths[i] < minW[i]) colWidths[i] = minW[i];
  }
  let total = colWidths.reduce((a, b) => a + b, 0);
  if (total > usable) {
    // Shrink columns that still have slack above their minimum.
    let slack = colWidths.reduce(
      (s, w, i) => s + Math.max(0, w - minW[i]),
      0,
    );
    const over = total - usable;
    if (slack > 0) {
      for (let i = 0; i < colWidths.length; i++) {
        const s = Math.max(0, colWidths[i] - minW[i]);
        colWidths[i] -= Math.floor((s / slack) * over);
      }
    } else {
      // Everything is at min: scale uniformly (last resort).
      const f = usable / total;
      for (let i = 0; i < colWidths.length; i++)
        colWidths[i] = Math.floor(colWidths[i] * f);
    }
  } else if (total < usable) {
    colWidths[colWidths.length - 1] += usable - total;
  }
  total = colWidths.reduce((a, b) => a + b, 0);

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
  const headerFill = plain ? undefined : '#E6E6E6';
  const drawColumnHeader = (yy: number): number =>
    drawRow(yy, headerCells, {
      bold: true,
      fill: headerFill,
      fontSize: headerFontSize,
    });

  const startTablePage = (first: boolean): number => {
    if (!first) doc.addPage();
    if (p.pageHeaderLines && p.pageHeaderLines.length) {
      return drawColumnHeader(drawProfileHeader());
    }
    if (first) {
      return drawColumnHeader(drawReportHeaderOnce());
    }
    return drawColumnHeader(doc.page.margins.top);
  };

  let y = startTablePage(true);

  let zebra = false;
  for (const r of p.rows) {
    const cells = cols.map((c) => formatCell(c, r[c.key], p.language));
    const projected = measureRow(cells, bodyFontSize, false);
    if (y + projected > bottom) {
      y = startTablePage(false);
    }
    y = drawRow(y, cells, {
      fontSize: bodyFontSize,
      fill: !plain && zebra ? '#F5F5F5' : undefined,
    });
    zebra = !zebra;
  }

  if (p.totalsRow) {
    const cells = cols.map((c) =>
      c.key in p.totalsRow!
        ? formatCell(c, p.totalsRow![c.key], p.language)
        : '',
    );
    const projected = measureRow(cells, headerFontSize, true);
    if (y + projected > bottom) {
      y = startTablePage(false);
    }
    drawRow(y, cells, {
      bold: true,
      fill: plain ? '#EAEAEA' : '#DCDCDC',
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
    const L = p.letter;
    const sp = (after = 120) => ({ spacing: { after } });
    L.headerLines.forEach((l, i) =>
      children.push(
        new DocxParagraph({
          ...sp(40),
          children: [new TextRun({ text: l, bold: i === 0, size: 22 })],
        }),
      ),
    );
    children.push(new DocxParagraph({ ...sp(220), children: [] }));
    children.push(
      new DocxParagraph({
        ...sp(220),
        children: [new TextRun({ text: L.placeDateLine, size: 22 })],
      }),
    );
    L.recipientLines.forEach((l) =>
      children.push(
        new DocxParagraph({
          ...sp(60),
          children: [new TextRun({ text: l, size: 22 })],
        }),
      ),
    );
    children.push(new DocxParagraph({ ...sp(180), children: [] }));
    children.push(
      new DocxParagraph({
        ...sp(220),
        children: [new TextRun({ text: L.subject, bold: true, size: 24 })],
      }),
    );
    for (const para of L.bodyParagraphs) {
      children.push(
        new DocxParagraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 180, line: 300 },
          children: [new TextRun({ text: para, size: 22 })],
        }),
      );
    }
    const closing = L.closingLines.filter((l) => l !== '');
    children.push(new DocxParagraph({ ...sp(120), children: [] }));
    if (closing[0]) {
      children.push(
        new DocxParagraph({
          ...sp(80),
          children: [new TextRun({ text: closing[0], size: 22 })],
        }),
      );
    }
    if (L.signatureImage) {
      const t = imgType(L.signatureImage);
      if (t) {
        children.push(
          new DocxParagraph({
            ...sp(40),
            children: [
              new ImageRun({
                type: t,
                data: L.signatureImage,
                transformation: { width: 150, height: 60 },
              } as never),
            ],
          }),
        );
      }
    } else {
      children.push(new DocxParagraph({ ...sp(360), children: [] }));
    }
    for (const l of closing.slice(1)) {
      children.push(
        new DocxParagraph({
          ...sp(20),
          children: [new TextRun({ text: l, bold: true, size: 22 })],
        }),
      );
    }
    children.push(
      new DocxParagraph({ children: [], pageBreakBefore: true }),
    );
  }

  children.push(
    new DocxParagraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({ text: p.title, bold: true, color: ACCENT_HEX, size: 32 }),
      ],
    }),
  );
  for (const s of p.subtitleLines || []) {
    children.push(
      new DocxParagraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
        children: [new TextRun({ text: s, size: 19, color: '444444' })],
      }),
    );
  }
  children.push(new DocxParagraph({ spacing: { after: 160 }, children: [] }));

  if (p.summary && Object.keys(p.summary).length) {
    children.push(
      new DocxParagraph({
        spacing: { after: 100 },
        children: [
          new TextRun({
            text: T.summary[p.language],
            bold: true,
            size: 26,
            color: ACCENT_HEX,
          }),
        ],
      }),
    );
    for (const [k, v] of Object.entries(p.summary)) {
      const val = MONEY_KEYS.has(k) ? fmtMoney(v) : String(v ?? '');
      children.push(
        new DocxParagraph({
          spacing: { after: 40 },
          children: [
            new TextRun({
              text: `${labelFor(k, p.language)}:  `,
              color: '555555',
              size: 21,
            }),
            new TextRun({ text: val, bold: true, size: 21 }),
          ],
        }),
      );
    }
    children.push(new DocxParagraph({ spacing: { after: 160 }, children: [] }));
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
