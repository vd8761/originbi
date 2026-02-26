import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  User as AdminUser,
  GroupAssessment,
  CorporateAccount,
  AssessmentSession,
} from '@originbi/shared-entities';
import { AffiliatesService } from '../affiliates/affiliates.service';

describe('AdminService', () => {
  let service: AdminService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: getRepositoryToken(AdminUser),
          useValue: { count: jest.fn() },
        },
        {
          provide: getRepositoryToken(GroupAssessment),
          useValue: { count: jest.fn() },
        },
        {
          provide: getRepositoryToken(CorporateAccount),
          useValue: { count: jest.fn() },
        },
        {
          provide: getRepositoryToken(AssessmentSession),
          useValue: { count: jest.fn() },
        },
        {
          provide: AffiliatesService,
          useValue: { getAdminDashboardStats: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
