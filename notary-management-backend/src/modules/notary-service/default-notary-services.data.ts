import { VolumeFormat } from '../../shared/enums/volume-format.enum';

export interface DefaultBook {
  name: string;
  slug: string;
  has_volume: boolean;
  volume_format: VolumeFormat;
  records_per_volume: number;
  volume_separator: string;
  requires_upi: boolean;
  increments_volume_on_serve: boolean;
}

export interface DefaultNotarySubService {
  sub_service: string;
  base_price: number | null;
  book_slug: string;
}

export interface DefaultNotaryServiceCategory {
  name: string;
  slug: string;
  sub_services: DefaultNotarySubService[];
}

export const DEFAULT_BOOKS: DefaultBook[] = [
  {
    name: 'Legalisation Book',
    slug: 'legalisation',
    has_volume: false,
    volume_format: VolumeFormat.NONE,
    records_per_volume: 0,
    volume_separator: '',
    requires_upi: false,
    increments_volume_on_serve: false,
  },
  {
    name: 'Notification Book',
    slug: 'notification',
    has_volume: false,
    volume_format: VolumeFormat.NONE,
    records_per_volume: 0,
    volume_separator: '',
    requires_upi: false,
    increments_volume_on_serve: false,
  },
  {
    name: 'Actes Book',
    slug: 'actes',
    has_volume: true,
    volume_format: VolumeFormat.ROMAN,
    records_per_volume: 50,
    volume_separator: '/',
    requires_upi: false,
    increments_volume_on_serve: false,
  },
  {
    name: 'Land (Ubutaka) Book',
    slug: 'land',
    has_volume: true,
    volume_format: VolumeFormat.ROMAN,
    records_per_volume: 50,
    volume_separator: '/',
    requires_upi: true,
    increments_volume_on_serve: true,
  },
  {
    name: 'Imirage Book',
    slug: 'imirage',
    has_volume: true,
    volume_format: VolumeFormat.ROMAN,
    records_per_volume: 50,
    volume_separator: '/',
    requires_upi: false,
    increments_volume_on_serve: false,
  },
];

export const DEFAULT_NOTARY_SERVICES: DefaultNotaryServiceCategory[] = [
  {
    name: 'Legalisation',
    slug: 'legalisation',
    sub_services: [
      { sub_service: 'Amasezerano', base_price: 2600, book_slug: 'legalisation' },
      { sub_service: 'Procuration', base_price: 2600, book_slug: 'legalisation' },
      { sub_service: 'Indahiro', base_price: 2600, book_slug: 'legalisation' },
      { sub_service: 'Statuts', base_price: 6500, book_slug: 'legalisation' },
      {
        sub_service: 'Inyandiko mvugo',
        base_price: 2600,
        book_slug: 'legalisation',
      },
    ],
  },
  {
    name: 'Notification',
    slug: 'notification',
    sub_services: [
      { sub_service: 'Diplome', base_price: 1950, book_slug: 'notification' },
      { sub_service: 'Result', base_price: 1950, book_slug: 'notification' },
      { sub_service: 'Transcript', base_price: 1950, book_slug: 'notification' },
      { sub_service: 'Report', base_price: 1950, book_slug: 'notification' },
      { sub_service: 'Certificate', base_price: 1950, book_slug: 'notification' },
      {
        sub_service: 'Driving Licence',
        base_price: 1950,
        book_slug: 'notification',
      },
      { sub_service: 'Passport', base_price: 1950, book_slug: 'notification' },
      {
        sub_service: 'Identity Card',
        base_price: 1950,
        book_slug: 'notification',
      },
      { sub_service: 'E-titles', base_price: 2000, book_slug: 'notification' },
      {
        sub_service: 'To Whom It May Concern',
        base_price: 1950,
        book_slug: 'notification',
      },
    ],
  },
  {
    name: 'Actes',
    slug: 'actes',
    sub_services: [
      { sub_service: 'Inguzanyo', base_price: 6500, book_slug: 'actes' },
      {
        sub_service: 'Inyandiko ikomatanyiye',
        base_price: 6500,
        book_slug: 'actes',
      },
    ],
  },
  {
    name: 'Ubutaka',
    slug: 'ubutaka',
    sub_services: [
      { sub_service: 'Ubugure', base_price: 6500, book_slug: 'land' },
      { sub_service: 'Impano', base_price: 6500, book_slug: 'land' },
      { sub_service: 'Igarana', base_price: 6500, book_slug: 'land' },
      { sub_service: 'Gutiza ingwate', base_price: 9100, book_slug: 'land' },
    ],
  },
  {
    name: 'Imirage',
    slug: 'imirage',
    sub_services: [
      { sub_service: 'Umurage', base_price: null, book_slug: 'imirage' },
    ],
  },
];
