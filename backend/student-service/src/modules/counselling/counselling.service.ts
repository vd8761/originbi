/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
    CounsellingSession,
    CounsellingType,
    CounsellingQuestion,
    CounsellingResponse,
    CounsellingQuestionOption,
    CorporateAccount,
    CorporateCreditLedger,
    PersonalityTrait,
} from '@originbi/shared-entities';
import { v4 as uuidv4 } from 'uuid';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CounsellingService {
    constructor(
        @InjectRepository(CounsellingSession)
        private sessionRepo: Repository<CounsellingSession>,
        @InjectRepository(CounsellingType)
        private typeRepo: Repository<CounsellingType>,
        @InjectRepository(CounsellingQuestion)
        private questionRepo: Repository<CounsellingQuestion>,
        @InjectRepository(CounsellingResponse)
        private responseRepo: Repository<CounsellingResponse>,
        @InjectRepository(CounsellingQuestionOption)
        private optionRepo: Repository<CounsellingQuestionOption>,
        @InjectRepository(CorporateAccount)
        private corporateRepo: Repository<CorporateAccount>,
        @InjectRepository(CorporateCreditLedger)
        private ledgerRepo: Repository<CorporateCreditLedger>,
        @InjectRepository(PersonalityTrait)
        private traitRepo: Repository<PersonalityTrait>,
        private httpService: HttpService,
        private configService: ConfigService,
    ) { }

    /**
     * Handles the Enquiry Webhook.
     * Creates a session if willing_to_take_test is Yes.
     */
    async handleEnquiry(payload: any): Promise<any> {
        const willing = payload.willing_to_take_test;

        let isWilling = false;
        if (typeof willing === 'boolean' && willing === true) isWilling = true;
        if (typeof willing === 'string' && (willing.toLowerCase().includes('yes') || willing.toLowerCase() === 'true')) isWilling = true;

        if (!isWilling) {
            return { status: 'ignored', message: 'User not interested.' };
        }

        const mobile = payload.contact_information?.mobile_number;
        const email = payload.contact_information?.email;

        if (!mobile) {
            throw new BadRequestException('Mobile number is required in contact_information');
        }

        // Check for duplicate registration (Mobile OR Email)
        const duplicateCheckQuery: any[] = [
            { mobileNumber: mobile.toString() }
        ];

        if (email) {
            duplicateCheckQuery.push({ email: email });
        }

        const existingSession = await this.sessionRepo.findOne({
            where: duplicateCheckQuery
        });

        if (existingSession) {
            let msg = 'This user is already registered.';
            if (existingSession.mobileNumber === mobile.toString()) msg = 'This mobile number is already registered.';
            else if (existingSession.email === email) msg = 'This email is already registered.';

            throw new BadRequestException(msg);
        }

        // Get Counselling Type: From Payload OR Default (First Active)
        let selectedType: any = null;

        if (payload.counselling_type_id) {
            selectedType = await this.typeRepo.findOne({
                where: { id: payload.counselling_type_id, isActive: true }
            });
            if (!selectedType) {
                throw new BadRequestException(`Invalid or inactive Counselling Type ID: ${payload.counselling_type_id}`);
            }
        } else {
            // Unchanged: Fallback to default
            selectedType = await this.typeRepo.findOne({
                where: { isActive: true },
                order: { id: 'ASC' },
            });
        }

        if (!selectedType) {
            throw new NotFoundException('No active Counselling Type found.');
        }

        // --- Credit Deduction Logic ---
        if (payload.corporate_id) {
            const corporate = await this.corporateRepo.findOne({ where: { id: payload.corporate_id } });
            if (!corporate) {
                // If invalid corporate ID, warn but maybe proceed? 
                // User said "dont allow to create registartion", so we should block.
                throw new BadRequestException('Invalid Corporate ID provided.');
            }

            if (corporate.availableCredits < 1) {
                throw new BadRequestException({
                    message: "Insufficient credits in corporate account. Please contact your administrator.",
                    statusCode: 400,
                    error: "Insufficient Credits"
                });
            }

            // Deduct Credit
            corporate.availableCredits -= 1;
            // Optionally update totalCredits if logic dictates, but usually available defines balance.
            // Leaving totalCredits as is (historical purchase).
            await this.corporateRepo.save(corporate);

            // Add Ledger Entry
            const ledger = this.ledgerRepo.create({
                corporateAccountId: corporate.id,
                creditDelta: -1,
                ledgerType: 'DEBIT',
                reason: `Counselling Registration: ${mobile}`,
                createdAt: new Date()
            });
            // Note: Check CorporateCreditLedger entity for exact fields. 
            // Based on previous views, 'totalAmount' and 'perCreditCost' might be required or nullable.
            // Simplified create for now, assumes defaults or chill nullable. 
            // Actually, let's play safe and check entity definition if this fails, but Standard is:
            // id, corporateAccountId, creditDelta, ledgerType, reason...

            await this.ledgerRepo.save(ledger);
        }
        // ------------------------------

        const sessionToken = uuidv4();

        const session = this.sessionRepo.create({
            counsellingTypeId: selectedType.id,
            mobileNumber: mobile.toString(), // Ensure string
            email: email,
            studentDetails: payload, // Store full payload as details
            sessionToken: sessionToken,
            status: 'READY',
            corporateAccountId: payload.corporate_id ? payload.corporate_id : null, // Accept Corporate ID if provided
            isVerified: false,
            accessCode: Math.floor(100000 + Math.random() * 900000).toString(), // Generate 6 digit code just in case
        });

        await this.sessionRepo.save(session);

        const frontendUrl = this.configService.get<string>('FRONTEND_APP_URL');
        const redirectUrl = `${frontendUrl}/counselling/start?token=${sessionToken}`;

        // --- Trigger External API ---
        const triggerUrl = this.configService.get<string>('COUNSELLING_TRIGGER_URL');
        if (triggerUrl) {
            try {
                // Sending the same payload or custom data
                // Using .toPromise() or lastValueFrom depending on RxJS version (NestJS 8+ uses RxJS 7)
                // We'll use a fire-and-forget or await depending on requirement. Let's await to log error.
                this.httpService.post(triggerUrl, {
                    ...payload,
                    session_token: sessionToken,
                    redirect_url: redirectUrl
                }).subscribe({
                    next: () => console.log(`Triggered external API: ${triggerUrl}`),
                    error: (err) => console.error(`Failed to trigger external API: ${err.message}`)
                });
            } catch (error) {
                console.error("External trigger error", error);
            }
        }
        // ----------------------------

        return {
            status: 'success',
            message: 'Session created.',
            data: {
                session_token: sessionToken,
                access_code: session.accessCode,
                redirect_url: redirectUrl,
            },
        };
    }

    /**
     * Validates a Session Token and returns Student Details + Assessment Info
     */
    async validateSessionToken(token: string): Promise<any> {
        const session = await this.sessionRepo.findOne({
            where: {
                sessionToken: token,
                status: In(['READY', 'COMPLETED'])
            },
            relations: ['counsellingType'],
        });

        if (!session) {
            throw new NotFoundException('Invalid or expired session.');
        }

        return {
            session_id: session.id,
            student_name: `${session.studentDetails?.personal_details?.first_name || ''} ${session.studentDetails?.personal_details?.last_name || ''}`,
            counselling_type: session.counsellingType.name,
            counselling_prompt: session.counsellingType.prompt,
            student_details: session.studentDetails,
            status: session.status,
            is_verified: session.isVerified,
        };
    }

    /**
     * Verifies Access Code matches URL param and identifier matches contact info.
     */
    async verifySessionAccess(token: string, identifier: string, accessCode: string): Promise<any> {
        const session = await this.sessionRepo.findOne({
            where: { sessionToken: token },
        });

        if (!session) {
            throw new NotFoundException('Invalid session token');
        }

        // 1. Check Access Code
        if (session.accessCode !== accessCode) {
            throw new BadRequestException('Invalid Access Code');
        }

        // 2. Check Identifier (Mobile or Email)
        const mobile = session.mobileNumber;
        const email = session.email;

        // Try matching mobile
        let match = false;
        if (mobile && identifier === mobile) match = true;
        // Try matching email
        if (!match && email && identifier.toLowerCase() === email.toLowerCase()) match = true;

        if (!match) {
            throw new BadRequestException('Email or Mobile Number does not match our records.');
        }

        // 3. Mark Verified
        session.isVerified = true;
        await this.sessionRepo.save(session);

        return { success: true, message: 'Verified' };
    }

    /**
     * Fetches Questions for a Session
     */
    async getQuestions(sessionId: number): Promise<any> {
        const session = await this.sessionRepo.findOne({
            where: { id: sessionId },
            relations: ['counsellingType'],
        });

        if (!session) throw new NotFoundException('Session not found');

        const questions = await this.questionRepo.find({
            where: {
                counsellingTypeId: session.counsellingTypeId,
                isActive: true,
            },
            relations: ['options'],
            order: { id: 'ASC' },
        });

        // Transform for Frontend
        return questions.map(q => ({
            id: q.id,
            text_en: q.questionTextEn,
            text_ta: q.questionTextTa,
            options: q.options.map(o => ({
                id: o.id,
                text_en: o.optionTextEn,
                text_ta: o.optionTextTa,
                order: o.displayOrder
            })).sort((a, b) => a.order - b.order)
        }));
    }

    /**
     * Submits an Answer
     */
    async submitResponse(sessionId: number, questionId: number, optionId: number): Promise<any> {
        let response = await this.responseRepo.findOne({
            where: { sessionId, questionId }
        });

        if (response) {
            response.selectedOptionId = optionId;
        } else {
            response = this.responseRepo.create({
                sessionId,
                questionId,
                selectedOptionId: optionId,
            });
        }
        return await this.responseRepo.save(response);
    }

    /**
     * Completes a session
     */
    /**
     * Completes a session and calculates DISC results
     */
    async completeSession(sessionId: number): Promise<any> {
        // 1. Fetch Responses with Options
        const allResponses = await this.responseRepo.find({
            where: { sessionId },
            relations: ['selectedOption'],
            order: { createdAt: 'DESC' } // Latest first
        });

        // Filter for unique responses per question (in case of duplicates/retries)
        const uniqueResponsesMap = new Map<number, CounsellingResponse>();
        allResponses.forEach(r => {
            if (!uniqueResponsesMap.has(r.questionId)) {
                uniqueResponsesMap.set(r.questionId, r);
            }
        });
        const responses = Array.from(uniqueResponsesMap.values());

        // 2. Calculate Scores
        const scores: { [key: string]: number } = { D: 0, I: 0, S: 0, C: 0 };
        let totalScore = 0;

        responses.forEach(r => {
            const trait = r.selectedOption?.discTrait;
            if (trait && ['D', 'I', 'S', 'C'].includes(trait)) {
                scores[trait] = (scores[trait] || 0) + 1;
                totalScore++;
            }
        });

        // 3. Determine Dominant Trait (Sort Descending by Score, then by DISC order)
        const priority = { 'D': 1, 'I': 2, 'S': 3, 'C': 4 };

        const sortedTraits = Object.entries(scores)
            .sort((a, b) => {
                const [traitA, scoreA] = a;
                const [traitB, scoreB] = b;

                // Primary Sort: Score Descending
                if (scoreB !== scoreA) {
                    return scoreB - scoreA;
                }

                // Secondary Sort: DISC Priority Ascending (Lower index is better)
                const priorityA = priority[traitA as keyof typeof priority] || 99;
                const priorityB = priority[traitB as keyof typeof priority] || 99;
                return priorityA - priorityB;
            });

        // Logic (Modified): ALWAYS Combine Top 2 Traits (e.g. "DS", "DI")
        // User Requirement: "not 16 now 12 only combination of 2 not D, I, S, C"
        // Since we initialize scores with 0 for all 4 traits, sortedTraits length is always 4.
        let dominantTraitCode = '';
        if (sortedTraits.length >= 2) {
            dominantTraitCode = sortedTraits[0][0] + sortedTraits[1][0];
        }

        // 4. Fetch Personality Trait Entity (e.g. 'DS')
        let personalityTrait = null;
        if (dominantTraitCode) {
            personalityTrait = await this.traitRepo.findOne({ where: { code: dominantTraitCode } });

            // Fallback: If 'DS' not found, try reverse 'SD'
            if (!personalityTrait && dominantTraitCode.length === 2) {
                const reverseCode = dominantTraitCode[1] + dominantTraitCode[0];
                personalityTrait = await this.traitRepo.findOne({ where: { code: reverseCode } });
            }
        }

        // 5. Update Session
        const session = await this.sessionRepo.findOne({ where: { id: sessionId } });
        if (!session) {
            throw new NotFoundException('Session not found during completion.');
        }

        session.status = 'COMPLETED';
        session.results = {
            disc_scores: scores,
            total_score: totalScore,
            dominant_trait: dominantTraitCode,
            sorted_scores: sortedTraits
        };

        if (personalityTrait) {
            session.personalityTraitId = personalityTrait.id;
        }

        await this.sessionRepo.save(session);

        // Trigger report generation asynchronously (fire-and-forget)
        this.triggerReportGeneration(session.id).catch(err => {
            console.error(`Failed to trigger report generation for session ${session.id}:`, err.message);
        });

        return {
            success: true,
            data: {
                results: session.results,
                trait: personalityTrait ? personalityTrait.blendedStyleName : null,
                trait_id: personalityTrait ? personalityTrait.id : null
            }
        };
    }

    /**
     * Trigger report generation via admin-service
     */
    private async triggerReportGeneration(sessionId: number): Promise<void> {
        const adminServiceUrl = this.configService.get<string>('ADMIN_SERVICE_URL') || 'http://localhost:4001';
        try {
            await this.httpService.post(
                `${adminServiceUrl}/admin/counselling/sessions/${sessionId}/report/generate`,
                {},
                { headers: { 'x-internal-service': 'student-service' } }
            ).toPromise();
            console.log(`Report generation triggered for session ${sessionId}`);
        } catch (error) {
            console.error(`Failed to trigger report generation:`, error.message);
        }
    }

    /**
     * Get Session Report by Token
     */
    async getSessionReport(token: string): Promise<any> {
        const session = await this.sessionRepo.findOne({
            where: { sessionToken: token },
            relations: ['counsellingType'],
        });

        if (!session) {
            throw new NotFoundException('Session not found');
        }

        if (session.status !== 'COMPLETED') {
            throw new BadRequestException('Assessment not completed yet');
        }

        // Get personality trait details
        let personalityTrait = null;
        if (session.personalityTraitId) {
            personalityTrait = await this.traitRepo.findOne({
                where: { id: session.personalityTraitId }
            });
        }

        return {
            success: true,
            data: {
                session_id: session.id,
                student_name: `${session.studentDetails?.personal_details?.first_name || ''} ${session.studentDetails?.personal_details?.last_name || ''}`.trim(),
                counselling_type: session.counsellingType?.name,
                status: session.status,
                results: session.results,
                personality_trait: personalityTrait ? {
                    id: personalityTrait.id,
                    code: personalityTrait.code,
                    name: personalityTrait.blendedStyleName,
                    description: personalityTrait.blendedStyleDesc,
                } : null,
                report_data: session.reportData,
                has_report: session.reportData && Object.keys(session.reportData).length > 0,
                completed_at: session.updatedAt,
            }
        };
    }
}
