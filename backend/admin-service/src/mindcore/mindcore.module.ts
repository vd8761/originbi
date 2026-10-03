import { Module } from '@nestjs/common';
import { MindcoreController } from './mindcore.controller';
import { MindcoreService } from './mindcore.service';

@Module({
  controllers: [MindcoreController],
  providers: [MindcoreService],
  exports: [MindcoreService],
})
export class MindcoreModule {}
