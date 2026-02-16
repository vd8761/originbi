// ============================================
// @originbi/shared-entities
// Single source of truth for all TypeORM entities
// ============================================

// Core entities (no dependencies)
export { User } from './user.entity';
export { AssessmentLevel } from './assessment-level.entity';
export { Program } from './program.entity';
export { Groups } from './groups.entity';
export { PersonalityTrait } from './personality-trait.entity';

// Corporate entities
export { CorporateAccount } from './corporate-account.entity';
export { CorporateCreditLedger } from './corporate-credit-ledger.entity';

// Affiliate entities
export { AffiliateAccount } from './affiliate-account.entity';
export { AffiliateReferralTransaction, TransactionType, TransactionStatus } from './affiliate-referral-transaction.entity';

// Group & Registration
export { GroupAssessment } from './group-assessment.entity';
export { Registration, RegistrationSource, RegistrationStatus, PaymentStatus, Gender } from './registration.entity';

// Question entities (CRITICAL - these were causing schema conflicts)
export { AssessmentQuestionOption } from './assessment-question-option.entity';
export { AssessmentQuestion } from './assessment-question.entity';
export { OpenQuestionOption } from './open-question-option.entity';
export { OpenQuestion } from './open-question.entity';

// Assessment flow entities
export { AssessmentSession } from './assessment-session.entity';
export { AssessmentAttempt } from './assessment-attempt.entity';
export { AssessmentAnswer } from './assessment-answer.entity';

// Utility entities
export { UserActionLog, UserRole, ActionType } from './user-action-log.entity';

// ACI Entities
export { AciScoreBand } from './aci-score-band.entity';
export { AciTrait } from './aci-trait.entity';
export { AciValue } from './aci-value.entity';
export { AciTraitValueNote } from './aci-trait-value-note.entity';

// Counselling Entities (New Module)
export { CounsellingType } from './counselling-type.entity';
export { CounsellingQuestion } from './counselling-question.entity';
export { CounsellingQuestionOption } from './counselling-question-option.entity';
export { CounsellingSession } from './counselling-session.entity';
export { CounsellingResponse } from './counselling-response.entity';
export { CorporateCounsellingAccess } from './corporate-counselling-access.entity';

// ============================================
// Usage in services:
//
// import { User, AssessmentQuestion, AssessmentQuestionOption } from '@originbi/shared-entities';
//
// In app.module.ts TypeOrmModule:
// entities: [User, AssessmentQuestion, ...] // from shared package
// ============================================
