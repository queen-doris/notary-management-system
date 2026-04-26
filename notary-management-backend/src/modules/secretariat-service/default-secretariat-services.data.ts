import { SecretariatServiceName } from '../../shared/enums/secretariat-service-name.enum';

interface DefaultSecretariatService {
  service_name: SecretariatServiceName;
  base_price: number;
}

export const DEFAULT_SECRETARIAT_SERVICES: DefaultSecretariatService[] = [
  { service_name: SecretariatServiceName.MUTATION, base_price: 500 },
  { service_name: SecretariatServiceName.INYANDIKO, base_price: 1500 },
  { service_name: SecretariatServiceName.IMISORO, base_price: 500 },
  { service_name: SecretariatServiceName.ATTESTATIONS, base_price: 200 },
  { service_name: SecretariatServiceName.SCANS, base_price: 4000 },
  { service_name: SecretariatServiceName.ETITLES, base_price: 2000 },
  { service_name: SecretariatServiceName.PHOTOCOPIES, base_price: 100 },
  { service_name: SecretariatServiceName.PRINTS_FORMS, base_price: 1000 },
  { service_name: SecretariatServiceName.FILES, base_price: 500 },
  { service_name: SecretariatServiceName.EXTRA_PEOPLE, base_price: 1000 },
];
