import { Module } from '@nestjs/common';
import { JDMatchingController } from './jd-matching.controller';
import { CorporateJDMatchingService } from './jd-matching.service';

@Module({
  controllers: [JDMatchingController],
  providers: [CorporateJDMatchingService],
  exports: [CorporateJDMatchingService],
})
export class JDMatchingModule {}
