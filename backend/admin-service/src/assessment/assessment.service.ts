import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssessmentSession } from './assessment_session.entity';
import { Program } from '../programs/entities/program.entity';
import { AssessmentLevel } from './assessment_level.entity';
import { AssessmentAttempt } from './assessment_attempt.entity';
import { GroupAssessment } from './group_assessment.entity';
import { Groups } from '../groups/groups.entity';

@Injectable()
export class AssessmentService {
    constructor(
        @InjectRepository(AssessmentSession)
        private readonly sessionRepo: Repository<AssessmentSession>,
        @InjectRepository(AssessmentLevel)
        private readonly levelRepo: Repository<AssessmentLevel>,
        @InjectRepository(AssessmentAttempt)
        private readonly attemptRepo: Repository<AssessmentAttempt>,
        @InjectRepository(GroupAssessment)
        private readonly groupAssessmentRepo: Repository<GroupAssessment>,
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
        userId?: string,
        type?: string,
    ) {
        try {
            // NEW LOGIC FOR GROUP ASSESSMENTS
            if (type === 'group') {
                const qb = this.groupAssessmentRepo.createQueryBuilder('ga')
                    .leftJoinAndMapOne('ga.program', Program, 'p', 'p.id = ga.programId')
                    .leftJoinAndMapOne('ga.group', Groups, 'g', 'g.id = ga.groupId'); // Join Group

                if (search) {
                    const s = `%${search.toLowerCase()}%`;
                    qb.andWhere('(LOWER(p.name) LIKE :s OR LOWER(p.assessment_title) LIKE :s OR LOWER(g.name) LIKE :s)', { s });
                }

                if (startDate) qb.andWhere('ga.validFrom >= :startDate', { startDate: `${startDate} 00:00:00` });
                if (endDate) qb.andWhere('ga.validFrom <= :endDate', { endDate: `${endDate} 23:59:59` });
                if (status) qb.andWhere('ga.status = :status', { status });

                // Sort
                if (sortBy) {
                    let sortCol = '';
                    switch (sortBy) {
                        case 'exam_title': sortCol = 'p.assessment_title'; break;
                        case 'program_name': sortCol = 'p.name'; break;
                        case 'group_name': sortCol = 'g.name'; break; // Support sort by group
                        case 'exam_status': sortCol = 'ga.status'; break;
                        case 'exam_starts_on': sortCol = 'ga.validFrom'; break;
                        case 'exam_ends_on': sortCol = 'ga.validTo'; break;
                        default: sortCol = 'ga.validFrom';
                    }
                    qb.orderBy(sortCol, sortOrder);
                } else {
                    qb.orderBy('ga.id', 'DESC');
                }

                const total = await qb.getCount();
                const rows = await qb
                    .skip((page - 1) * limit)
                    .take(limit)
                    .getMany();

                const data = rows.map(r => ({
                    id: r.id,
                    programId: r.programId,
                    program: r.program,
                    status: r.status,
                    validFrom: r.validFrom,
                    validTo: r.validTo,
                    createdAt: r.validFrom,
                    // Map Group Info
                    groupId: r.groupId,
                    groupName: (r as any).group?.name || 'N/A', // TypeORM mapOne attaches to property

                    userId: 0,
                    registrationId: 0,
                    currentLevel: 0,
                    totalLevels: 0,
                    totalCandidates: r.totalCandidates
                }));

                return { data, total, page, limit };
            }

            // EXISTING LOGIC FOR INDIVIDUAL SESSIONS
            const qb = this.sessionRepo.createQueryBuilder('as')
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

            if (userId) {
                qb.andWhere('as.userId = :userId', { userId });
            }

            // Since we handled 'group' type above, we assume default or 'individual' here.
            // But we must preserve 'individual' filter strictness.
            // If type was NOT 'group' (undefined or 'individual'), we apply this logic.
            // Actually original logic had `if (type === 'individual') ... else if (type === 'group')`.
            // Now `type === 'group'` is handled separately.

            if (type === 'individual') {
                qb.andWhere('(as.groupId IS NULL OR as.groupId = 0)');
            }
            // If type is empty/undefined, it might return all sessions (mixed). 
            // We should keep the original logic for that if needed, or strictly separate.
            // Original code:
            // if (type === 'individual') qb.andWhere(...) 
            // else if (type === 'group') qb.andWhere(...) 

            // If we moved 'group' logic out, we just need to handle 'individual' or 'all'.
            // However, the user request specifically targets Group Assessments list.

            if (sortBy) {
                let sortCol = '';
                switch (sortBy) {
                    case 'exam_title': sortCol = 'p.assessment_title'; break;
                    case 'program_name': sortCol = 'p.name'; break;
                    case 'exam_status': sortCol = 'as.status'; break;
                    case 'exam_starts_on': sortCol = 'as.validFrom'; break;
                    case 'exam_ends_on': sortCol = 'as.validTo'; break;
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

            // Calculate Metrics
            const totalLevels = await this.levelRepo.count({ where: { isMandatory: true } });

            let currentLevelsMap = {};
            if (rows.length > 0) {
                const sessionIds = rows.map(r => r.id);
                // Get Max Level attempted for each session
                const rawLevels = await this.attemptRepo.createQueryBuilder('aa')
                    .select('aa.assessmentSessionId', 'sid')
                    .addSelect('MAX(al.levelNumber)', 'maxLvl')
                    .leftJoin('aa.assessmentLevel', 'al')
                    .where('aa.assessmentSessionId IN (:...ids)', { ids: sessionIds })
                    .groupBy('aa.assessmentSessionId')
                    .getRawMany();

                currentLevelsMap = rawLevels.reduce((acc, curr) => {
                    acc[curr.sid] = Number(curr.maxLvl) || 1;
                    return acc;
                }, {});
            }

            const augmentedRows = rows.map(r => ({
                ...r,
                totalLevels,
                currentLevel: currentLevelsMap[r.id] || (r.status === 'NOT_STARTED' ? 0 : 1),
            }));

            return { data: augmentedRows, total, page, limit };

        } catch (error) {
            console.error('AssessmentService.findAllSessions Error:', error);
            throw error;
        }
    }
}
