# Database Table Structures - Analysis & Comparison

**Date:** 2026-01-12

This document compares the **PROPER (Restored)** table structures from the backup files with the **OLD (Problematic)** structures defined in the entity files and exam-engine.

---

## 🔴 ROOT CAUSE ANALYSIS

### Problem Identified: **Column Name Mismatch Between Database and GORM Models**

The exam-engine's GORM models in `db_models.go` are mapping to **wrong column names** that don't match the actual database schema. This causes:

1. **Failed to fetch** errors when querying
2. **Data insertion failures** due to wrong column mappings  
3. **Null value errors** when DB sync tries to reconcile

### Key Issues Found:

#### 1. `assessment_question_options` - **MAJOR MISMATCHES**

| Field | GORM Model (WRONG) | Actual DB Column (CORRECT) |
|-------|-------------------|---------------------------|
| `ID` | `qus_option_ID` | `id` |
| `DiscFactor` | `trait_text_en` | `disc_factor` |
| `ScoreValue` | `trait_type` | `score_value` |
| `IsCorrect` | `status` | `is_correct` |
| `IsActive` | `status` (DUPLICATE!) | `is_active` |
| `IsDeleted` | `deleted` | `is_deleted` |

**Critical Bug:** Both `IsCorrect` and `IsActive` map to `status` column - this is a bug!

#### 2. `open_question_options` - **MAJOR MISMATCHES**

| Field | GORM Model (WRONG) | Actual DB Column (CORRECT) |
|-------|-------------------|---------------------------|
| `ID` | `open_question_option_ID` | `id` |
| `OpenQuestionID` | `open_question_ID` | `open_question_id` |
| `OptionType` | `int` | `varchar(20)` with CHECK constraint |
| `TraitType` → `IsValid` | Different semantics | `is_valid` (boolean) |
| `CreatedBy` | `createdby` | N/A (column doesn't exist) |
| `Status` | `status` | N/A (use `is_active`) |
| `Deleted` | `deleted` | N/A (use `is_deleted`) |

---

## ✅ PROPER Database Structure (From Restored Backups)

### 1. `open_question_options` (CORRECT)

```sql
                      Table "public.open_question_options"
      Column       |           Type           |  Nullable  |       Default
-------------------+--------------------------+------------+-------------------
 id                | bigint                   | not null   | nextval(...)
 open_question_id  | bigint                   | not null   | 
 option_type       | varchar(20)              | not null   | CHECK: TEXT|IMAGE
 option_text_en    | text                     |            | 
 option_text_ta    | text                     |            | 
 option_image_file | varchar(255)             |            | 
 is_valid          | boolean                  | not null   | false
 display_order     | smallint                 | not null   | 1
 is_active         | boolean                  | not null   | true
 is_deleted        | boolean                  | not null   | false
 created_at        | timestamp with time zone | not null   | now()
 updated_at        | timestamp with time zone | not null   | now()

Indexes:
    "open_question_options_pkey" PRIMARY KEY (id)
Foreign-key constraints:
    REFERENCES open_questions(id) ON DELETE CASCADE
Triggers:
    trg_open_question_options_updated_at
```

### 2. `assessment_question_options` (CORRECT)

```sql
                    Table "public.assessment_question_options"
     Column     |           Type           | Nullable |        Default
----------------+--------------------------+----------+---------------------
 id             | bigint                   | not null | nextval(...)
 question_id    | bigint                   | not null | 
 display_order  | smallint                 | not null | 1
 option_text_en | text                     |          | 
 option_text_ta | text                     |          | 
 disc_factor    | varchar(10)              |          | 
 score_value    | numeric(5,2)             | not null | 0.00
 is_correct     | boolean                  |          | false
 metadata       | jsonb                    | not null | '{}'
 is_active      | boolean                  | not null | true
 is_deleted     | boolean                  | not null | false
 created_at     | timestamp with time zone | not null | CURRENT_TIMESTAMP
 updated_at     | timestamp with time zone | not null | CURRENT_TIMESTAMP

Indexes:
    "assessment_question_options_pkey" PRIMARY KEY (id)
    "idx_assessment_question_options_question" btree (question_id)
Foreign-key constraints:
    REFERENCES assessment_questions(id) ON DELETE CASCADE
Triggers:
    trg_assessment_options_updated_at
```

---

## ❌ OLD/WRONG Structures (From Exam Engine db_models.go)

### `OpenQuestionOption` (WRONG - Lines 280-302)

```go
type OpenQuestionOption struct {
    ID              int64     `gorm:"primaryKey;autoIncrement;column:open_question_option_ID"` // WRONG: should be "id"
    OpenQuestionID  int64     `gorm:"not null;column:open_question_ID"` // WRONG: should be "open_question_id"
    OptionType      int       `gorm:"not null;column:option_type"` // WRONG TYPE: should be varchar, not int
    TraitType       int       `gorm:"column:trait_type"` // WRONG: should be "is_valid" boolean
    CreatedBy       int       `gorm:"column:createdby"` // WRONG: column doesn't exist
    Status          int       `gorm:"column:status"` // WRONG: should be "is_active"
    Deleted         int       `gorm:"column:deleted"` // WRONG: should be "is_deleted"
    // Missing: is_valid, display_order, is_active, is_deleted (actual columns)
}
```

### `AssessmentQuestionOption` (WRONG - Lines 113-130)

```go
type AssessmentQuestionOption struct {
    ID           int64   `gorm:"primaryKey;autoIncrement;column:qus_option_ID"` // WRONG: should be "id"
    DiscFactor   *string `gorm:"column:trait_text_en"` // WRONG: should be "disc_factor"
    ScoreValue   float64 `gorm:"column:trait_type"` // WRONG: should be "score_value"
    IsCorrect    bool    `gorm:"column:status"` // WRONG: should be "is_correct"
    IsActive     bool    `gorm:"column:status"` // WRONG & DUPLICATE: should be "is_active"
    IsDeleted    bool    `gorm:"column:deleted"` // WRONG: should be "is_deleted"
}
```

---

## 🛠️ REQUIRED FIXES

### Fix 1: Update `backend/exam-engine/internal/models/db_models.go`

#### `OpenQuestionOption` (Replace lines 279-302)
```go
// Table: open_question_options
type OpenQuestionOption struct {
    ID              int64     `gorm:"primaryKey;autoIncrement;column:id" json:"id"`
    OpenQuestionID  int64     `gorm:"not null;column:open_question_id" json:"open_question_id"`
    OptionType      string    `gorm:"type:varchar(20);not null;column:option_type" json:"option_type"`
    OptionTextEn    string    `gorm:"column:option_text_en;type:text" json:"option_text_en"`
    OptionTextTa    *string   `gorm:"column:option_text_ta;type:text" json:"option_text_ta"`
    OptionImageFile string    `gorm:"column:option_image_file;type:varchar(255)" json:"option_image_file"`
    IsValid         bool      `gorm:"column:is_valid;default:false" json:"is_valid"`
    DisplayOrder    int       `gorm:"column:display_order;type:smallint;default:1" json:"display_order"`
    IsActive        bool      `gorm:"column:is_active;default:true" json:"is_active"`
    IsDeleted       bool      `gorm:"column:is_deleted;default:false" json:"is_deleted"`
    CreatedAt       time.Time `gorm:"column:created_at;default:now()" json:"created_at"`
    UpdatedAt       time.Time `gorm:"column:updated_at;default:now()" json:"updated_at"`

    // Compat
    OptionText string `gorm:"-" json:"option_text"`
}
```

#### `AssessmentQuestionOption` (Replace lines 112-130)
```go
// Table: assessment_question_options
type AssessmentQuestionOption struct {
    ID           int64     `gorm:"primaryKey;autoIncrement;column:id" json:"id"`
    QuestionID   int64     `gorm:"not null;column:question_id" json:"question_id"`
    DisplayOrder int       `gorm:"type:smallint;default:1;not null;column:display_order" json:"display_order"`
    OptionTextEn string    `gorm:"column:option_text_en;type:text" json:"option_text_en"`
    OptionTextTa *string   `gorm:"column:option_text_ta;type:text" json:"option_text_ta"`
    DiscFactor   *string   `gorm:"column:disc_factor;type:varchar(10)" json:"disc_factor"`
    ScoreValue   float64   `gorm:"column:score_value;type:numeric(5,2);default:0" json:"score_value"`
    IsCorrect    bool      `gorm:"column:is_correct;default:false" json:"is_correct"`
    Metadata     string    `gorm:"column:metadata;type:jsonb;default:'{}'" json:"metadata"`
    IsActive     bool      `gorm:"column:is_active;default:true" json:"is_active"`
    IsDeleted    bool      `gorm:"column:is_deleted;default:false" json:"is_deleted"`
    CreatedAt    time.Time `gorm:"column:created_at;default:current_timestamp" json:"created_at"`
    UpdatedAt    time.Time `gorm:"column:updated_at;default:current_timestamp" json:"updated_at"`

    // Fallback Compat for Frontend if needed
    OptionText string `gorm:"-" json:"option_text"`
}
```

### Fix 2: Update TypeORM Entities in `admin-service`

Entities are already correct in `admin-service`. No changes needed there.

### Fix 3: Ensure DB_SYNC=false

**Confirm that `DB_SYNC=false` in all `.env` files** to prevent TypeORM from overwriting the correct schema.

---

## 📋 Summary

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| Failed to fetch | GORM column mappings wrong | Update `db_models.go` |
| Null value errors | DB sync tried to add wrong columns | Keep `DB_SYNC=false` |
| Data mismatch | `OptionType` was `int` vs `varchar` | Fix type in GORM model |
| Duplicate mapping bug | `IsCorrect` and `IsActive` both mapped to `status` | Map to correct columns |

---

## Appendix: TypeORM Entity Definitions (admin-service - CORRECT)

These are correct and match the restored database:

- `backend/admin-service/src/assessment/open_question_option.entity.ts`
- `backend/admin-service/src/assessment/assessment_question_option.entity.ts`
