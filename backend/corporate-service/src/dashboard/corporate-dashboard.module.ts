import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CorporateDashboardController } from './corporate-dashboard.controller';
import { CorporateDashboardService } from './corporate-dashboard.service';
import { CorporateAccount } from '../entities/corporate-account.entity';
import { User } from '../entities/user.entity';
import { CorporateCreditLedger } from '../entities/corporate-credit-ledger.entity';

@Module({
    imports: [TypeOrmModule.forFeature([CorporateAccount, User, CorporateCreditLedger])],
    controllers: [CorporateDashboardController],
    providers: [CorporateDashboardService],
})
export class CorporateDashboardModule { }
