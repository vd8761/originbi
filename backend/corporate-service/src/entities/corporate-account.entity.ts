import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { User } from './user.entity';
import { CorporateCreditLedger } from './corporate-credit-ledger.entity';

@Entity('corporate_accounts')
export class CorporateAccount {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'user_id', type: 'bigint' })
  userId: number;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'company_name', length: 250 })
  companyName: string;

  @Column({ name: 'available_credits', default: 0 })
  availableCredits: number;

  @Column({ name: 'total_credits', default: 0 })
  totalCredits: number;

  // Simplification: We might need other fields if we use them, but for now this is enough for linking
  @Column({ name: 'employee_ref_id', length: 100, nullable: true })
  employeeRefId?: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_blocked', default: false })
  isBlocked: boolean;

  @OneToMany(() => CorporateCreditLedger, (ledger) => ledger.corporateAccount)
  creditLedgers: CorporateCreditLedger[];

  @Column({ name: 'full_name', length: 200, nullable: true })
  fullName?: string;

  @Column({ name: 'sector_code', length: 50, nullable: true })
  sectorCode?: string;

  @Column({ name: 'job_title', length: 100, nullable: true })
  jobTitle?: string;

  @Column({ name: 'gender', length: 20, nullable: true })
  gender?: string;

  @Column({ name: 'country_code', length: 10, nullable: true })
  countryCode?: string;

  @Column({ name: 'mobile_number', length: 20, nullable: true })
  mobileNumber?: string;

  @Column({ name: 'linkedin_url', nullable: true })
  linkedinUrl?: string;

  @Column({ name: 'business_locations', nullable: true })
  businessLocations?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
