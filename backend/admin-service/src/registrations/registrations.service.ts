// backend/admin-service/src/registrations/registrations.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

import { User } from '../users/user.entity';
import { Registration } from './registration.entity';
import { CreateRegistrationDto } from './dto/create-registration.dto';

@Injectable()
export class RegistrationsService {
  private authServiceBaseUrl =
    process.env.AUTH_SERVICE_URL || 'http://localhost:4002';

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Registration)
    private readonly regRepo: Repository<Registration>,
    private readonly dataSource: DataSource,
    private readonly http: HttpService,
  ) {}

  private async createCognitoUser(email: string) {
    const password = 'Origin@1234'; // temp; later generate

    const res$ = this.http.post(
      `${this.authServiceBaseUrl}/internal/cognito/users`,
      { email, password },
    );
    const res = await firstValueFrom(res$);
    return res.data as { sub?: string };
  }
    async create(dto: CreateRegistrationDto, createdByUserId?: number | null) {
  //async create(dto: CreateRegistrationDto, createdByUserId?: number) {
    const { sub } = await this.createCognitoUser(dto.email);

    return this.dataSource.transaction(async (manager) => {
      const user = manager.create(User, {
        email: dto.email,
        fullName: dto.name,
        mobileCountryCode: dto.countryCode,
        role: 'STUDENT',
        emailVerified: true,
        cognitoSub: sub,
        isActive: true,
        isBlocked: false,
      });
      await manager.save(user);
      

      const registration = manager.create(Registration, {
        userId: user.id,
        registrationSource: 'ADMIN_PANEL',
        createdByUserId: createdByUserId ?? null,
        status: 'PENDING',
        examStart: dto.examStart ? new Date(dto.examStart) : null,
        examEnd: dto.examEnd ? new Date(dto.examEnd) : null,
        metadata: {
          gender: dto.gender,
          programType: dto.programType,
          groupName: dto.groupName,
          sendEmail: dto.sendEmail,
          schoolLevel: dto.schoolLevel,
          schoolStream: dto.schoolStream,
          currentYear: dto.currentYear,
          departmentId: dto.departmentId,
          mobile: dto.mobile,
        },
      });
      await manager.save(registration);

      return {
        registrationId: registration.id,
        userId: user.id,
        email: user.email,
      };
    });
  }
}
