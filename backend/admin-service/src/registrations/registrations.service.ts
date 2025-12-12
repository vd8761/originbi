// backend/admin-service/src/registrations/registrations.service.ts

import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

import { User } from '../users/user.entity';
import { Registration } from './registration.entity';
import { CreateRegistrationDto } from './dto/create-registration.dto';

@Injectable()
export class RegistrationsService {
  /**
   * Base URL of auth-service.
   * Example: AUTH_SERVICE_URL=http://localhost:4002
   */
  private authServiceBaseUrl =
    process.env.AUTH_SERVICE_URL || 'http://localhost:4002';

  // ✅ For now, ADMIN is always user_id = 1
  private readonly ADMIN_USER_ID = 1;

  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(Registration)
    private readonly regRepo: Repository<Registration>,

    private readonly dataSource: DataSource,
    private readonly http: HttpService,
  ) {}

  // ---------------------------------------------------------
  // 🔹 Helper: Call auth-service to create a Cognito user
  // ---------------------------------------------------------
  private async createCognitoUser(email: string, password: string) {
    if (!email) {
      throw new BadRequestException('Email is required for Cognito user');
    }
    if (!password) {
      throw new BadRequestException('Password is required for Cognito user');
    }

    try {
      const res$ = this.http.post(
        `${this.authServiceBaseUrl}/internal/cognito/users`,
        { email, password },
      );

      const res = await firstValueFrom(res$);
      return res.data as { sub?: string };
    } catch (err: any) {
      const authErr = err?.response?.data || err?.message || err;

      console.error(
        '[RegistrationsService] Error calling auth-service /internal/cognito/users:',
        authErr,
      );

      throw new InternalServerErrorException(
        authErr?.message || 'Failed to create Cognito user via auth-service',
      );
    }
  }

  // ---------------------------------------------------------
  // 🔹 Normalizers (to satisfy DB CHECK constraints)
  // ---------------------------------------------------------
  private normalizeGender(g?: string | null): 'MALE' | 'FEMALE' | 'OTHER' | null {
    if (!g) return null;
    const v = g.trim().toUpperCase();
    if (v === 'MALE' || v === 'FEMALE' || v === 'OTHER') return v;
    // frontend sends Male/Female/Other -> this converts to MALE/FEMALE/OTHER
    return null;
  }

  private normalizeSchoolLevel(level?: string | null): 'SSLC' | 'HSC' | null {
    if (!level) return null;
    const v = level.trim().toUpperCase();
    if (v === 'SSLC' || v === 'HSC') return v;
    return null;
  }

  private normalizeSchoolStream(
    stream?: string | null,
  ): 'SCIENCE' | 'COMMERCE' | 'HUMANITIES' | null {
    if (!stream) return null;
    const v = stream.trim().toUpperCase();
    if (v === 'SCIENCE' || v === 'COMMERCE' || v === 'HUMANITIES') return v;
    return null;
  }

  private toBigIntOrNull(v?: string | null): number | null {
    if (!v) return null;
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0) return null;
    return n;
  }

  // ---------------------------------------------------------
  // 🔹 CREATE REGISTRATION (called by frontend)
  // ---------------------------------------------------------
  async create(dto: CreateRegistrationDto) {
    console.log('[RegistrationsService] create dto =', {
      ...dto,
      password: dto.password ? '***hidden***' : undefined,
    });

    // ✅ Force ADMIN source + createdByUserId = 1
    const registrationSource: 'ADMIN' = 'ADMIN';
    const createdByUserId = this.ADMIN_USER_ID;

    // ✅ Ensure admin user exists (FK safety)
    const adminUser = await this.userRepo.findOne({
      where: { id: createdByUserId as any },
    });

    if (!adminUser) {
      throw new InternalServerErrorException(
        `Admin user with id=${createdByUserId} not found. Create it first or change ADMIN_USER_ID.`,
      );
    }

    // 1) Create Cognito user via auth-service
    const { sub } = await this.createCognitoUser(dto.email, dto.password);

    if (!sub) {
      throw new InternalServerErrorException(
        'Cognito sub not returned from auth-service',
      );
    }

    // Normalize values to match DB CHECK constraints
    const gender = this.normalizeGender(dto.gender);
    const schoolLevel = this.normalizeSchoolLevel(dto.schoolLevel);
    const schoolStream = this.normalizeSchoolStream(dto.schoolStream);

    // Your registrations column is department_degree_id
    const departmentDegreeId = this.toBigIntOrNull(dto.departmentId);

    // group_id not created yet -> keep NULL and store groupName only in metadata
    const groupId: number | null = null;

    // 2) Wrap DB operations in a transaction
    return this.dataSource.transaction(async (manager) => {
      // -------------------------
      // Create User row
      // (✅ remove fullName insertion here as you requested)
      // -------------------------
      const user = manager.create(User, {
        email: dto.email,
        role: 'STUDENT',
        emailVerified: true,
        cognitoSub: sub,
        isActive: true,
        isBlocked: false,

        // ✅ Store name/mobile/countryCode/gender in users.metadata
        metadata: {
          fullName: dto.name, // stored as metadata since users.full_name removed
          countryCode: dto.countryCode ?? '+91',
          mobile: dto.mobile,
          gender: gender,
        },
      });

      await manager.save(user);

      // -------------------------
      // Create Registration row
      // -------------------------
      const status: 'INCOMPLETE' | 'COMPLETED' | 'CANCELLED' = 'INCOMPLETE';

      const registration = manager.create(Registration, {
        userId: user.id,
        registrationSource,
        createdByUserId, // ✅ must be NOT NULL for ADMIN
        status,

        // ✅ store in NEW registration columns
        fullName: dto.name,
        countryCode: dto.countryCode ?? '+91',
        mobileNumber: dto.mobile,
        gender: gender,

        // ✅ store in respective columns
        schoolLevel,
        schoolStream,
        departmentDegreeId,
        groupId, // null for now

        // ✅ keep remaining in metadata
        metadata: {
          programType: dto.programType,
          groupName: dto.groupName ?? null, // ✅ only metadata for now
          sendEmail: dto.sendEmail,
          currentYear: dto.currentYear ?? null,
          examStart: dto.examStart ?? null,
          examEnd: dto.examEnd ?? null,
          // optional: keep raw departmentId also if you want debug
          departmentId: dto.departmentId ?? null,
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

  // ---------------------------------------------------------
  // 🔹 LIST REGISTRATIONS FOR FRONTEND TABLE
  // ---------------------------------------------------------
  async findAll(page: number, limit: number, tab?: string, search?: string) {
    const qb = this.regRepo
      .createQueryBuilder('r')
      .leftJoinAndSelect('r.user', 'u')
      .where('r.isDeleted = false');

    if (search) {
      const s = `%${search.toLowerCase()}%`;
      qb.andWhere(
        '(LOWER(r.fullName) LIKE :s OR LOWER(u.email) LIKE :s)',
        { s },
      );
    }

    const total = await qb.getCount();

    const rows = await qb
      .orderBy('r.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    const data = rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      name: r.fullName ?? null,
      email: r.user?.email ?? null,
      countryCode: r.countryCode ?? null,
      mobile: r.mobileNumber ?? null,
      gender: r.gender ?? null,
      programType: r.metadata?.programType ?? null,
      groupName: r.metadata?.groupName ?? null,
      status: r.status,
      examStart: r.metadata?.examStart ?? null,
      examEnd: r.metadata?.examEnd ?? null,
      createdAt: r.createdAt,
    }));

    return {
      data,
      total,
      page,
      limit,
    };
  }
}
