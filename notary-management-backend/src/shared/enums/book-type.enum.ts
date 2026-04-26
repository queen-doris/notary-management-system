export enum BookType {
  LEGALISATION = 'legalisation',
  NOTIFICATION = 'notification',
  ACTES = 'actes',
  LAND = 'land',
  IMIRAGE = 'imirage',
}

export const BookTypeLabels: Record<BookType, string> = {
  [BookType.LEGALISATION]: 'Legalisation Book',
  [BookType.NOTIFICATION]: 'Notification Book',
  [BookType.ACTES]: 'Actes Book',
  [BookType.LAND]: 'Land (UBUTAKA) Book',
  [BookType.IMIRAGE]: 'Imirage Book',
};

export const BookTypeFormats: Record<BookType, string> = {
  [BookType.LEGALISATION]: 'Sequential number only (e.g., 10248)',
  [BookType.NOTIFICATION]: 'Sequential number only (e.g., 9463)',
  [BookType.ACTES]: 'Number/Volume (e.g., 1489/XXX)',
  [BookType.LAND]:
    'Number/Volume with 50 records per volume (e.g., 10956/CCXIX)',
  [BookType.IMIRAGE]: 'Number/Volume (e.g., 2023/IMIRAGE/001)',
};
