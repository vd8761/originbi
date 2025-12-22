import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ unique: true, nullable: true })
  email: string;

  // @Column({ name: 'full_name', nullable: true })
  // fullName: string;

  @Column({ default: 'STUDENT', nullable: true })
  role: string;

  @Column({ name: 'corporate_id', nullable: true })
  corporateId: string;

  @Column({ name: 'metadata', type: 'jsonb', default: () => `'{}'`, nullable: true })
  metadata: any;

  @Column({
    name: 'created_at',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;
}
