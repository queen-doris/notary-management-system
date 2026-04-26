import { Test, TestingModule } from '@nestjs/testing';
import { NotaryServiceService } from './notary-service.service';

describe('NotaryServiceService', () => {
  let service: NotaryServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotaryServiceService],
    }).compile();

    service = module.get<NotaryServiceService>(NotaryServiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
