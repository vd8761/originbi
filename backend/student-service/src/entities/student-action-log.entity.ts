import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Student } from './student.entity';

export enum ActionType {
    RESET_PASSWORD = 'RESET_PASSWORD',
    EMAIL_SENT = 'EMAIL_SENT',
}

@Entity('student_action_logs')
@Unique(['student', 'actionType', 'actionDate'])
export class StudentActionLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => Student, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'student_id' })
    student: Student;

    @Column({ name: 'student_id', type: 'integer' }) // Student ID is integer
    studentId: number;

    @Column({
        name: 'action_type',
        type: 'enum',
        enum: ActionType,
    })
    actionType: ActionType;

    @Column({ name: 'attempt_count', default: 0 })
    attemptCount: number;

    @Column({ name: 'action_date', type: 'date' })
    actionDate: string;

    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;
}
