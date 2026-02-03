import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdministratorCounsellingController } from './counselling.controller';
import { AdministratorCounsellingService } from './counselling.service';
import { CounsellingType, CounsellingQuestion, CounsellingQuestionOption } from '@originbi/shared-entities';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            CounsellingType,
            CounsellingQuestion,
            CounsellingQuestionOption
        ])
    ],
    controllers: [AdministratorCounsellingController],
    providers: [AdministratorCounsellingService],
    exports: [AdministratorCounsellingService]
})
export class AdministratorCounsellingModule { }
