import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany, // Add this
} from 'typeorm';
import { User } from '../../users/user.entity';
import { CorporateCreditLedger } from './corporate-credit-ledger.entity'; // Import the ledger entity

@Entity('corporate_accounts')
export class CorporateAccount {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ name: 'user_id', type: 'bigint' })
  userId: number;

  @OneToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'full_name', length: 250, nullable: true })
  fullName?: string;

  @Column({ name: 'company_name', length: 250 })
  companyName: string;

  @Column({ name: 'sector_code', length: 50 })
  sectorCode: string;

  @Column({ name: 'business_locations', type: 'text' })
  businessLocations: string;

  @Column({ name: 'job_title', length: 100, nullable: true })
  jobTitle?: string;

  @Column({ name: 'employee_ref_id', length: 100, nullable: true })
  employeeRefId?: string;

  @Column({ name: 'linkedin_url', length: 250, nullable: true })
  linkedinUrl?: string;

  @Column({ name: 'country_code', length: 10, default: '+91' })
  countryCode: string;

  @Column({ name: 'mobile_number', length: 20 })
  mobileNumber: string;

  @Column({ length: 10, nullable: true })
  gender?: string;

  @Column({ name: 'total_credits', default: 0 })
  totalCredits: number;

  @Column({ name: 'available_credits', default: 0 })
  availableCredits: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'is_blocked', default: false })
  isBlocked: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Add the OneToMany relationship
  @OneToMany(() => CorporateCreditLedger, (ledger) => ledger.corporateAccount)
  creditLedgers: CorporateCreditLedger[];
}
