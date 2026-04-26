import { Test, TestingModule } from '@nestjs/testing';
import { SecretariatServiceService } from './secretariat-service.service';

describe('SecretariatServiceService', () => {
  let service: SecretariatServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SecretariatServiceService],
    }).compile();

    service = module.get<SecretariatServiceService>(SecretariatServiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
