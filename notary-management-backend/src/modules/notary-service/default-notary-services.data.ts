import { NotaryServiceName } from '../../shared/enums/notary-service-name.enum';
import { BookType } from '../../shared/enums/book-type.enum';

interface DefaultNotarySubService {
  sub_service: string;
  base_price: number | null;
  book_type: BookType;
}

interface DefaultNotaryService {
  service_name: NotaryServiceName;
  sub_services: DefaultNotarySubService[];
}

export const DEFAULT_NOTARY_SERVICES: DefaultNotaryService[] = [
  {
    service_name: NotaryServiceName.LEGALISATION,
    sub_services: [
      {
        sub_service: 'Amasezerano',
        base_price: 2600,
        book_type: BookType.LEGALISATION,
      },
      {
        sub_service: 'Procuration',
        base_price: 2600,
        book_type: BookType.LEGALISATION,
      },
      {
        sub_service: 'Indahiro',
        base_price: 2600,
        book_type: BookType.LEGALISATION,
      },
      {
        sub_service: 'Statuts',
        base_price: 6500,
        book_type: BookType.LEGALISATION,
      },
      {
        sub_service: 'Inyandiko mvugo',
        base_price: 2600,
        book_type: BookType.LEGALISATION,
      },
    ],
  },
  {
    service_name: NotaryServiceName.NOTIFICATION,
    sub_services: [
      {
        sub_service: 'Diplome',
        base_price: 1950,
        book_type: BookType.NOTIFICATION,
      },
      {
        sub_service: 'Result',
        base_price: 1950,
        book_type: BookType.NOTIFICATION,
      },
      {
        sub_service: 'Transcript',
        base_price: 1950,
        book_type: BookType.NOTIFICATION,
      },
      {
        sub_service: 'Report',
        base_price: 1950,
        book_type: BookType.NOTIFICATION,
      },
      {
        sub_service: 'Certificate',
        base_price: 1950,
        book_type: BookType.NOTIFICATION,
      },
      {
        sub_service: 'Driving Licence',
        base_price: 1950,
        book_type: BookType.NOTIFICATION,
      },
      {
        sub_service: 'Passport',
        base_price: 1950,
        book_type: BookType.NOTIFICATION,
      },
      {
        sub_service: 'Identity Card',
        base_price: 1950,
        book_type: BookType.NOTIFICATION,
      },
      {
        sub_service: 'E-titles',
        base_price: 2000,
        book_type: BookType.NOTIFICATION,
      },
      {
        sub_service: 'To Whom It May Concern',
        base_price: 1950,
        book_type: BookType.NOTIFICATION,
      },
    ],
  },
  {
    service_name: NotaryServiceName.ACTES,
    sub_services: [
      { sub_service: 'Inguzanyo', base_price: 6500, book_type: BookType.ACTES },
      {
        sub_service: 'Inyandiko ikomatanyiye',
        base_price: 6500,
        book_type: BookType.ACTES,
      },
    ],
  },
  {
    service_name: NotaryServiceName.UBUTAKA,
    sub_services: [
      { sub_service: 'Ubugure', base_price: 6500, book_type: BookType.LAND },
      { sub_service: 'Impano', base_price: 6500, book_type: BookType.LAND },
      { sub_service: 'Igarana', base_price: 6500, book_type: BookType.LAND },
      {
        sub_service: 'Gutiza ingwate',
        base_price: 9100,
        book_type: BookType.LAND,
      },
    ],
  },
  {
    service_name: NotaryServiceName.IMIRAGE,
    sub_services: [
      { sub_service: 'Umurage', base_price: null, book_type: BookType.IMIRAGE },
    ],
  },
];
