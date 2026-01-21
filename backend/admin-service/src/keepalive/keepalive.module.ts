import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { KeepAliveService } from './keepalive.service';

@Module({
    imports: [HttpModule],
    providers: [KeepAliveService],
})
export class KeepAliveModule { }
