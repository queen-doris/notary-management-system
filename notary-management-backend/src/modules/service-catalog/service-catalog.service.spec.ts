import { Test, TestingModule } from '@nestjs/testing';
import { ServiceCatalogService } from './service-catalog.service';

describe('ServiceCatalogService', () => {
  let service: ServiceCatalogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ServiceCatalogService],
    }).compile();

    service = module.get<ServiceCatalogService>(ServiceCatalogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
