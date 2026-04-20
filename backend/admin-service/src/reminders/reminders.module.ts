import { Module } from '@nestjs/common';
import { ExpiryReminderService } from './expiry-reminder.service';
import { SettingsModule } from '../settings/settings.module';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Module({
  imports: [SettingsModule, WhatsappModule],
  providers: [ExpiryReminderService],
})
export class RemindersModule {}
