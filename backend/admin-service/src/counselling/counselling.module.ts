import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdministratorCounsellingController } from './counselling.controller';
import { AdministratorCounsellingService } from './counselling.service';
import { CounsellingReportService } from './counselling-report.service';
import { 
    CounsellingType, 
    CounsellingQuestion, 
    CounsellingQuestionOption,
    CounsellingSession,
    PersonalityTrait 
} from '@originbi/shared-entities';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            CounsellingType,
            CounsellingQuestion,
            CounsellingQuestionOption,
            CounsellingSession,
            PersonalityTrait
        ])
    ],
    controllers: [AdministratorCounsellingController],
    providers: [AdministratorCounsellingService, CounsellingReportService],
    exports: [AdministratorCounsellingService, CounsellingReportService]
})
export class AdministratorCounsellingModule { }
