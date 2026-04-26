import { Test, TestingModule } from '@nestjs/testing';
import { NotaryController } from './notary.controller';

describe('NotaryController', () => {
  let controller: NotaryController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotaryController],
    }).compile();

    controller = module.get<NotaryController>(NotaryController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
