import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProgramsModule } from './programs/programs.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: '127.0.0.1',        // or 'localhost'
      port: 5432,               // change if your Postgres port is different
      username: 'postgres',     // 🔴 put your actual DB username here
      password: 'root',// 🔴 put your actual DB password here as PLAIN TEXT
      database: 'originbi',     // 🔴 your DB name
      autoLoadEntities: true,
      synchronize: false,
    }),
    ProgramsModule,
  ],
})
export class AppModule {}
