import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { AssessmentAttempt } from './assessment_attempt.entity';

@Entity('assessment_answers')
export class AssessmentAnswer {
    @PrimaryGeneratedColumn({ type: 'bigint' })
    id: number;

    @Column({ name: 'assessment_attempt_id', type: 'bigint' })
    assessmentAttemptId: number;

    @ManyToOne(() => AssessmentAttempt)
    @JoinColumn({ name: 'assessment_attempt_id' })
    assessmentAttempt: AssessmentAttempt;

    @Column({ name: 'status', type: 'varchar', length: 20, default: 'NOT_ANSWERED' })
    status: string;
}
