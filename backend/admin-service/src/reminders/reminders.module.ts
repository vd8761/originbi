import { Module } from '@nestjs/common';
import { ExpiryReminderService } from './expiry-reminder.service';
import { SettingsModule } from '../settings/settings.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';
import { SmsModule } from '../sms/sms.module';

@Module({
  imports: [SettingsModule, WhatsappModule, SmsModule],
  providers: [ExpiryReminderService],
})
export class RemindersModule {}
