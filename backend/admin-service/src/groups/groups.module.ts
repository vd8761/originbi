import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Groups } from './groups.entity';
import { GroupsService } from './groups.service';

@Module({
    imports: [TypeOrmModule.forFeature([Groups])],
    providers: [GroupsService],
    exports: [GroupsService, TypeOrmModule], // Export TypeOrmModule too if needed by others
})
export class GroupsModule { }
