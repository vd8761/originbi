import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AdminUser } from '../../../database/entities/AdminUser';
import { AdminModule } from './admin/admin.module';   // 👈 ADD THIS
import { ProgramsModule } from './programs/programs.module';


@Module({
  imports: [
     ConfigModule.forRoot({
      isGlobal: true,                // so you can use process.env everywhere
      envFilePath: '.env',          // looks in backend/admin-service/.env
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 5432,  // number is fine
      username: process.env.DB_USER,
      password: process.env.DB_PASS || '',       // 👈 keep as string
      database: process.env.DB_NAME,
      //entities: [
      //  AdminUser,
      //],
      entities: [__dirname + '/../**/*.entity.{ts,js}'],
      synchronize: false,
      autoLoadEntities: true,
    }),
        AdminModule,
        ProgramsModule,      // 👈 AND ADD THIS SO ROUTES LOAD
  ],
})

export class AppModule {}
