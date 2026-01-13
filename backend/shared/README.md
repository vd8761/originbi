# @originbi/shared-entities

Shared TypeORM entity definitions for all OriginBI microservices.

## Purpose

This package provides a **single source of truth** for database entity definitions, ensuring:

1. ✅ All services use identical entity definitions
2. ✅ `synchronize: true` is SAFE (no schema conflicts)
3. ✅ Changes propagate to all services automatically
4. ✅ Type safety across the entire codebase

## Installation

### For services in this monorepo:

```bash
# In the backend directory
npm install

# This will link the shared package via npm workspaces
```

### Manual linking (if not using workspaces):

```bash
cd backend/shared
npm link

cd ../admin-service
npm link @originbi/shared-entities
```

## Usage

### Importing entities:

```typescript
import { 
  User, 
  AssessmentQuestion, 
  AssessmentQuestionOption,
  Registration 
} from '@originbi/shared-entities';
```

### In app.module.ts:

```typescript
import { TypeOrmModule } from '@nestjs/typeorm';
import { 
  User, 
  AssessmentQuestion,
  AssessmentQuestionOption,
  // ... other entities
} from '@originbi/shared-entities';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      // ... config
      entities: [User, AssessmentQuestion, AssessmentQuestionOption],
      synchronize: true, // NOW SAFE!
    }),
  ],
})
export class AppModule {}
```

## Entities Included

| Entity | Table | Description |
|--------|-------|-------------|
| `User` | `users` | User accounts |
| `AssessmentLevel` | `assessment_levels` | Assessment level definitions |
| `Program` | `programs` | Assessment programs |
| `Groups` | `groups` | User groups/batches |
| `CorporateAccount` | `corporate_accounts` | Corporate user profiles |
| `CorporateCreditLedger` | `corporate_credit_ledger` | Credit transactions |
| `GroupAssessment` | `group_assessments` | Group-program assignments |
| `Registration` | `registrations` | User registrations |
| `AssessmentQuestion` | `assessment_questions` | Main questions |
| `AssessmentQuestionOption` | `assessment_question_options` | Question options |
| `OpenQuestion` | `open_questions` | Open-ended questions |
| `OpenQuestionOption` | `open_question_options` | Open question options |
| `AssessmentSession` | `assessment_sessions` | Assessment sessions |
| `AssessmentAttempt` | `assessment_attempts` | Individual attempts |
| `AssessmentAnswer` | `assessment_answers` | Student answers |
| `UserActionLog` | `user_action_logs` | Action audit log |

## Development

```bash
# Build the package
npm run build

# Watch mode for development
npm run watch
```

## Adding New Entities

1. Create the entity file in `entities/`
2. Export it from `entities/index.ts`
3. Run `npm run build`
4. Import in your service

## Troubleshooting

### Entity not found?
Make sure you've built the shared package: `cd shared && npm run build`

### Schema mismatch?
Ensure all services are using the SAME version of this package and restart all services.
