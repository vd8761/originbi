import { Global, Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WhatsappTemplatesService } from './whatsapp-templates.service';

@Global()
@Module({
  imports: [HttpModule],
  providers: [WhatsappTemplatesService],
  exports: [WhatsappTemplatesService],
})
export class WhatsappModule {}
