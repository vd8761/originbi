import { Global, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { SmsService } from './sms.service';
import { SettingsModule } from '../settings/settings.module';

@Global()
@Module({
  imports: [HttpModule, SettingsModule],
  providers: [SmsService],
  exports: [SmsService],
})
export class SmsModule {}
