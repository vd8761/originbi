// lib/types.ts

// --- Enums & Unions from DB Constraints ---
export type SectorCode =
  | "IT_SOFTWARE"
  | "MANUFACTURING"
  | "HEALTHCARE_HOSPITALS"
  | "BANKING_FINANCIAL"
  | "EDUCATION_TRAINING"
  | "RETAIL_ECOM"
  | "AUTOMOTIVE"
  | "CONSTRUCTION_INFRA"
  | "TELECOM"
  | "HOSPITALITY_TOURISM"
  | "LOGISTICS_SUPPLY_CHAIN"
  | "AGRI_AGRIBUSINESS"
  | "PHARMA_BIOTECH"
  | "MEDIA_ENTERTAINMENT"
  | "GOVT_PUBLIC"
  | "ENERGY_UTILITIES"
  | "AEROSPACE_DEFENCE"
  | "INSURANCE"
  | "CONSULTING_PROF_SERVICES"
  | "REAL_ESTATE"
  | "FMCG"
  | "CHEMICALS_PETROCHEM"
  | "NONPROFIT_NGO"
  | "LEGAL"
  | "SPORTS_RECREATION"
  | "MINING_METALS"
  | "MARITIME_SHIPPING"
  | "ELECTRONICS_SEMI"
  | "ENVIRONMENTAL"
  | "ANIMATION_VFX_GAMING"
  | "TEXTILES_APPAREL"
  | "FOOD_PROCESSING"
  | "LUXURY_PREMIUM"
  | "PRINTING_PACKAGING"
  | "EVENT_MANAGEMENT"
  | "BEAUTY_WELLNESS"
  | "SECURITY_SERVICES"
  | "RESEARCH_DEVELOPMENT"
  | "TRANSPORTATION"
  | "FISHERIES_AQUA"
  | "OTHER";
export type Gender = "MALE" | "FEMALE" | "OTHER";
export type RegistrationSource = "SELF" | "ADMIN" | "CORPORATE" | "RESELLER";
export type SchoolLevel = "SSLC" | "HSC";
export type SchoolStream = "SCIENCE" | "COMMERCE" | "HUMANITIES";
export type PaymentStatus = "NOT_REQUIRED" | "PENDING" | "PAID" | "FAILED" | "REFUNDED";
export type RegistrationStatus = "INCOMPLETE" | "COMPLETED" | "CANCELLED";
export type ProgramCode = "SCHOOL_STUDENT" | "COLLEGE_STUDENT" | "EMPLOYEE" | "CXO_GENERAL" | "CXO_ADVANCED" | "DEMO";

// --- Database Table Interfaces (Snake Case to match DB) ---

export interface User {
  id: string; // bigint in DB, string in JS
  cognito_sub: string;
  email: string;
  email_verified: boolean;
  role: "ADMIN" | "CORPORATE" | "STUDENT" | "RESELLER";
  full_name?: string;
  corporate_id?: string;
  avatar_url?: string;
  is_active: boolean;
  is_blocked: boolean;
  created_at: string;
  updated_at: string;
}

export interface Program {
  id: string;
  code: string;
  name: string;
  description?: string;
  assessment_title?: string;
  report_title?: string;
  is_demo: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  short_name?: string;
  category?: string;
  is_active: boolean;
}

// "registrations" table - essentially the Student Profile linked to a User
export interface Registration {
  id: string;
  user_id: string;
  registration_source: RegistrationSource;
  full_name?: string;
  gender?: Gender;
  email?: string;
  mobile_number: string;
  country_code: string;

  // School/College Specifics
  school_level?: SchoolLevel;
  school_stream?: SchoolStream;
  department_degree_id?: string; // Links to department_degrees

  // Org links
  corporate_account_id?: string;
  reseller_account_id?: string;
  group_id?: string;
  groupName?: string; // For display purposes

  // Payment
  payment_required: boolean;
  payment_status: PaymentStatus;
  payment_amount?: number;

  status: RegistrationStatus;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

export interface CorporateAccount {
  id: string;
  user_id: string;
  company_name: string;
  sector_code: string; // e.g. IT_SOFTWARE
  business_locations: string; // Text field in DB
  job_title?: string;
  employee_ref_id?: string;
  linkedin_url?: string;
  country_code: string;
  mobile_number: string;
  gender?: Gender; // Contact person gender
  total_credits: number;
  available_credits: number;
  is_active: boolean;
  is_blocked: boolean;
  created_at: string;
  updated_at: string;
}

export interface CorporateCreditLedger {
  id: string;
  corporate_account_id: string;
  credit_delta: number;
  ledger_type?: 'CREDIT' | 'DEBIT';
  reason?: string;
  created_by_user_id?: string;
  created_at: string;
}

export interface ResellerAccount {
  id: string;
  user_id: string;
  reseller_name: string;
  mobile_number: string;
  total_credits: number;
  available_credits: number;
  is_active: boolean;
}

// --- Frontend Helpers / DTOs ---

export interface CreateRegistrationDto {
  api_key?: string; // If needed
  full_name: string;
  email: string;
  mobile_number: string;
  country_code: string;
  gender: Gender;
  program_code: ProgramCode; // To look up Program ID
  // Dynamic fields
  school_level?: SchoolLevel;
  school_stream?: SchoolStream;
  department_id?: string; // To find department_degree
  degree_id?: string;
  password?: string;
}

export interface CreateCorporateRegistrationDto {
  name: string; // Goes to Users table or Corporate Account Contact Name? Schema implies User.email + CorporateAccount.company_name
  email: string;
  mobile: string;
  countryCode: string;
  companyName: string;
  sector: SectorCode;
  businessLocations: string;
  credits?: number; // Optional on frontend form, backend might default it
  password?: string;
  gender?: Gender;
  jobTitle?: string;
  employeeCode?: string;
  linkedinUrl?: string;
  status: boolean;
  sendEmail?: boolean;
}

// Common Shared Types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

export interface CountryCode {
  code: string;
  dial_code: string;
  flag: string;
}

// Mood/Roadmap items (Frontend UI only)
export interface RoadmapItem {
  title: string;
  description: string;
}

export type MoodTag = "Feeling Happy" | "Need Motivation" | "Morning Boost" | string;

export interface MoodItem {
  title: string;
  description: string;
  tag: MoodTag;
  duration: string;
  imageUrl: string;
}

export interface SessionItem {
  title: string;
  duration: string;
  date: string;
  time: string;
}

export interface TestimonialData {
  quote: string;
  name: string;
  title: string;
  image: string;
}

export interface AssessmentQuestionOption {
  id: string;
  question_id: string;
  option_text_en: string;
  option_text_ta?: string;
  score_value?: number;
  is_correct?: boolean; // Usually hidden from frontend during exam, but might be present in admin view
}

export interface AssessmentQuestion {
  id: string;
  assessment_level_id: string;
  set_number: number;
  question_text_en: string;
  question_text_ta?: string;
  context_text_en?: string;
  context_text_ta?: string;
  options?: AssessmentQuestionOption[]; // Joined response
}
