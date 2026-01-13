/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssessmentSession } from './assessment_session.entity';
import { Program } from '../programs/entities/program.entity';
import { AssessmentLevel } from './assessment_level.entity';
import { AssessmentAttempt } from './assessment_attempt.entity';
import { AssessmentAnswer } from './assessment_answer.entity';
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
        @InjectRepository(AssessmentAnswer)
        private readonly answerRepo: Repository<AssessmentAnswer>,
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
                .leftJoinAndSelect('as.user', 'u')
                .leftJoinAndSelect('as.registration', 'reg');

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
                const rawLevels = await this.answerRepo.createQueryBuilder('ans')
                    .select('ans.assessmentSessionId', 'sid')
                    .addSelect('COUNT(DISTINCT ans.assessmentLevelId)', 'lvlCount')
                    .where('ans.assessmentSessionId IN (:...ids)', { ids: sessionIds })
                    .groupBy('ans.assessmentSessionId')
                    .getRawMany();

                currentLevelsMap = rawLevels.reduce((acc, curr) => {
                    acc[curr.sid] = Number(curr.lvlCount) || 1;
                    return acc;
                }, {});
            }

            const augmentedRows = rows.map(r => ({
                ...r,
                totalLevels,
                currentLevel: r.status === 'NOT_STARTED' || r.status === 'ASSIGNED'
                    ? 0
                    : (currentLevelsMap[r.id] || 0) // If started but no attempts found, it might mean level 0 completed or just started level 1? Usually 0 completed.
                // Wait, if status is IN_PROGRESS, they might have completed 0 levels (working on 1st).
                // If map has value, use it. If not, stick to 0 or check if they finished level 1?
                // The map calculates MAX level attempted. If they attempted level 1, max is 1. Completed count?
                // If they attempted level 1, and finished it, maybe we count it?
                // For now, let's assume map returns completed levels count if possible, or we interpret it.
                // Map query: MAX(al.levelNumber). If max is 1, they are ON level 1 or finished level 1?
                // Usually 'attempt' means they took it. If they finished, maybe status is captured.
                // Let's stick to: if NOT_STARTED -> 0. Else use map value. If map empty -> 0.
            }));

            return { data: augmentedRows, total, page, limit };

        } catch (error) {
            console.error('AssessmentService.findAllSessions Error:', error);
            throw error;
        }
    }

    async findGroupSessionDetails(id: number) {
        try {
            const groupAssessment = await this.groupAssessmentRepo.findOne({
                where: { id },
                relations: ['group', 'program']
            });

            if (!groupAssessment) {
                return null;
            }

            const sessions = await this.sessionRepo.find({
                where: { groupAssessmentId: id },
                relations: ['user', 'registration'],
                order: { createdAt: 'DESC' }
            });

            return {
                ...groupAssessment,
                sessions: sessions.map(s => ({
                    ...s,
                    userFullName: s.registration?.fullName || 'N/A',
                    userEmail: s.user?.email || 'N/A',
                }))
            };
        } catch (error) {
            console.error('Error fetching group session details:', error);
            throw error;
        }
    }

    async getSessionDetails(id: number) {
        try {
            const session = await this.sessionRepo.findOne({
                where: { id },
                relations: ['user', 'registration', 'program', 'groupAssessment', 'groupAssessment.group', 'groupAssessment.program']
            });

            if (!session) {
                console.warn(`Session with ID ${id} not found in getSessionDetails`);
            } else {
                console.log(`Session ${id} fetched. relations:`, {
                    hasUser: !!session.user,
                    hasRegistration: !!session.registration,
                    hasGroupAssessment: !!session.groupAssessment
                });
            }

            return session;
        } catch (error) {
            console.error('Error fetching session details:', error);
            throw error;
        }
    }

    async getLevels() {
        try {
            return await this.levelRepo.createQueryBuilder('al')
                .where('al.is_mandatory = :isMandatory', { isMandatory: true })
                .orderBy('al.sort_order', 'ASC')
                .getMany();
        } catch (error) {
            console.error('Error fetching levels:', error);
            return [];
        }
    }
}
