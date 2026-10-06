import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { CorporateAccount } from '@originbi/shared-entities';

@Entity('corporate_integrations')
export class CorporateIntegration {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'corporate_account_id', type: 'bigint' })
  corporate_account_id: number;

  @Column({ type: 'varchar', length: 100 })
  provider: string; // e.g., 'google_drive', 'slack', 'jira'

  @Column({ type: 'text', nullable: true })
  access_token: string;

  @Column({ type: 'text', nullable: true })
  refresh_token: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any; // Store provider-specific data (e.g. folder IDs, channel IDs)

  @Column({ type: 'varchar', length: 50, default: 'active' })
  status: string; // 'active', 'expired', 'error', 'disconnected'

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @ManyToOne(() => CorporateAccount)
  @JoinColumn({ name: 'corporate_account_id' })
  corporateAccount: CorporateAccount;
}
