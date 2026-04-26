import { Test, TestingModule } from '@nestjs/testing';
import { NotaryService } from './notary.service';

describe('NotaryService', () => {
  let service: NotaryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotaryService],
    }).compile();

    service = module.get<NotaryService>(NotaryService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
