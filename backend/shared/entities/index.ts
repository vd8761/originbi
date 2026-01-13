// ============================================
// @originbi/shared-entities
// Single source of truth for all TypeORM entities
// ============================================

// Core entities (no dependencies)
export { User } from './user.entity';
export { AssessmentLevel } from './assessment-level.entity';
export { Program } from './program.entity';
export { Groups } from './groups.entity';

// Corporate entities
export { CorporateAccount } from './corporate-account.entity';
export { CorporateCreditLedger } from './corporate-credit-ledger.entity';

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

// ============================================
// Usage in services:
// 
// import { User, AssessmentQuestion, AssessmentQuestionOption } from '@originbi/shared-entities';
//
// In app.module.ts TypeOrmModule:
// entities: [User, AssessmentQuestion, ...] // from shared package
// ============================================
