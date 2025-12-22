import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssessmentSession } from './assessment_session.entity';
import { Program } from '../programs/entities/program.entity';

@Injectable()
export class AssessmentService {
    constructor(
        @InjectRepository(AssessmentSession)
        private readonly sessionRepo: Repository<AssessmentSession>,
    ) { }

    async findAllSessions(
        page: number,
        limit: number,
        search?: string,
        sortBy?: string,
        sortOrder: 'ASC' | 'DESC' = 'DESC',
        startDate?: string,
        endDate?: string,
        status?: string,
    ) {
        try {
            // We need to join Program to get titles
            // Note: assessment_sessions has program_id, but no explicit TypeORM ManyToOne relation defined in the entity file I saw earlier (lines 34-35 were @Column).
            // I need to check if I can join without explicit relation defined in entity, or if I should add it.
            // The entity had: @Column({ name: 'program_id', ... }) programId: number;
            // It did NOT have @ManyToOne(() => Program).
            // So I can't use leftJoinAndSelect('session.program') unless I modify the entity or use query builder with manual join condition.
            // Modifying entity is cleaner. I will verify the entity content again to be 100% sure.

            const qb = this.sessionRepo.createQueryBuilder('as')
                // Manual join since relation might be missing or I'll fix entity
                .leftJoinAndMapOne('as.program', Program, 'p', 'p.id = as.programId')
                .leftJoinAndSelect('as.user', 'u');

            if (search) {
                const s = `%${search.toLowerCase()}%`;
                qb.andWhere(
                    '(LOWER(p.name) LIKE :s OR LOWER(p.assessment_title) LIKE :s OR LOWER(u.email) LIKE :s)',
                    { s },
                );
            }

            if (startDate) {
                qb.andWhere('as.validFrom >= :startDate', { startDate: `${startDate} 00:00:00` });
            }
            if (endDate) {
                qb.andWhere('as.validFrom <= :endDate', { endDate: `${endDate} 23:59:59` });
            }

            if (status) {
                qb.andWhere('as.status = :status', { status });
            }

            // Check Sort
            if (sortBy) {
                let sortCol = '';
                switch (sortBy) {
                    case 'exam_title': sortCol = 'p.assessment_title'; break;
                    case 'program_name': sortCol = 'p.name'; break;
                    case 'exam_status': sortCol = 'as.status'; break;
                    case 'exam_starts_on': sortCol = 'as.validFrom'; break;
                    case 'exam_ends_on': sortCol = 'as.validTo'; break; // Assuming Ends = Expired or similar
                    case 'exam_published_on': sortCol = 'as.createdAt'; break;
                    default: sortCol = 'as.createdAt';
                }
                qb.orderBy(sortCol, sortOrder);
            } else {
                qb.orderBy('as.createdAt', 'DESC');
            }

            const total = await qb.getCount();
            const rows = await qb
                .skip((page - 1) * limit)
                .take(limit)
                .getMany();

            // Mapped response matching UI
            // UI: Exam Title, Exam Status, Exam Type (WebApp), Program Name, Starts On, Ends On, Published On, Expired On
            // We'll return the entities populated with program.
            return { data: rows, total, page, limit };

        } catch (error) {
            console.error('AssessmentService.findAllSessions Error:', error);
            throw error;
        }
    }
}
