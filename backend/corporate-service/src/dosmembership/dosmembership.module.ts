import { Module } from '@nestjs/common';
import { DosmembershipController } from './dosmembership.controller';
import { DosmembershipService } from './dosmembership.service';

@Module({
  controllers: [DosmembershipController],
  providers: [DosmembershipService],
})
export class DosmembershipModule {}
