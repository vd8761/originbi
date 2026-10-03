import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { MasterApp } from './master-app.entity';
import { CorporateAccount } from './corporate-account.entity'; // Assuming this exists based on previous files

@Entity('tenant_app_configs')
export class TenantAppConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'bigint' })
  tenant_id: number;

  @ManyToOne(() => CorporateAccount)
  @JoinColumn({ name: 'tenant_id' })
  tenant: CorporateAccount;

  @Column({ type: 'uuid' })
  app_id: string;

  @ManyToOne(() => MasterApp)
  @JoinColumn({ name: 'app_id' })
  app: MasterApp;

  @Column({ type: 'text', nullable: true })
  client_id: string; // Encrypted

  @Column({ type: 'text', nullable: true })
  client_secret: string; // Encrypted

  @Column({ type: 'text', nullable: true })
  api_key: string; // Encrypted

  @Column({ type: 'varchar', length: 20, default: 'disconnected' })
  status: string;

  @Column({ type: 'jsonb', nullable: true })
  configured_features: any;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
