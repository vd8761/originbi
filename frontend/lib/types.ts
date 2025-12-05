import type { SectorCode } from "@/lib/sectors";

export interface RoadmapItem {
  title: string;
  description: string;
}

export type MoodTag = "Feeling Happy" | "Need Motivation" | "Morning Boost";

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

// This looks fine – if you ever need "Other" gender here, add it.
export interface RegistrationUser {
  id: string;
  name: string;
  avatar: string;        // if sometimes missing, make this avatar?: string;
  gender: "Male" | "Female";
  email: string;
  mobile: string;
  status: boolean;
}

// Dropdown Data Types
export interface Program {
  id: string;
  name: string; // e.g., "School Students", "College Students", "Employee"
  code: string;
}

export interface Department {
  id: string;
  name: string; // e.g., "Computer Science", "Mechanical"
}

export interface CountryCode {
  code: string;
  dial_code: string;
  flag: string;
}

// --- Program Module Types ---
export interface ProgramData {
  id: string;
  programCode: string;
  programName: string;
  status: boolean;
  description: string;
  assessmentTitle: string;
  reportTitle: string;
  isDemo: boolean;
}

export interface CorporateRegistrationUser {
  id: string;
  name: string;
  gender: "Male" | "Female" | "Other";
  avatar: string;        // if sometimes missing, make this avatar?: string;
  email: string;
  countryCode: string;
  mobile: string;
  companyName: string;
  jobTitle?: string;
  employeeCode?: string;
  linkedinUrl?: string;
  sector: SectorCode;
  credits?: number;
  status: boolean;
  notes?: string;         // used as "Business Locations" in UI
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCorporateRegistrationDto {
  name: string;
  gender: "Male" | "Female" | "Other";
  avatar: string;        // if sometimes missing, make this avatar?: string;
  email: string;
  countryCode: string;
  mobile: string;
  companyName: string;
  jobTitle?: string;
  employeeCode?: string;
  linkedinUrl?: string;
  sector: SectorCode;
  password: string;
  credits?: number;
  status: boolean;
  notes?: string;         // label: Business Locations
  sendEmail?: boolean;    // optional, not shown in UI, we will send false
}