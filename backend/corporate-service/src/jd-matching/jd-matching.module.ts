import { Module } from '@nestjs/common';
import { JDMatchingController } from './jd-matching.controller';
import { CorporateJDMatchingService } from './jd-matching.service';
import { IntegrationsModule } from '../integrations/integrations.module';

@Module({
  imports: [IntegrationsModule],
  controllers: [JDMatchingController],
  providers: [CorporateJDMatchingService],
  exports: [CorporateJDMatchingService],
})
export class JDMatchingModule {}
