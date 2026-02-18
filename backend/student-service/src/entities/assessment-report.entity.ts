import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('assessment_reports')
export class AssessmentReport {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'assessment_session_id', unique: true })
  assessmentSessionId: number;

  @Column({ name: 'report_number', length: 150, unique: true })
  reportNumber: string;

  @Column({ name: 'report_password', length: 150, nullable: true })
  reportPassword: string;

  @Column({ name: 'report_url', type: 'text', nullable: true })
  reportUrl: string;

  @CreateDateColumn({ name: 'generated_at' })
  generatedAt: Date;

  @Column({ name: 'email_sent', default: false })
  emailSent: boolean;

  @Column({ name: 'email_sent_at', type: 'timestamp', nullable: true })
  emailSentAt: Date;

  @Column({ name: 'email_sent_to', length: 255, nullable: true })
  emailSentTo: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
