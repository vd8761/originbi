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

export interface Department {
  id: string;
  name: string; // e.g., "Computer Science", "Mechanical"
}

export interface CountryCode {
  code: string;
  dial_code: string;
  flag: string;
}

// Dropdown Data Types
export interface Program {
  id: string;
  programCode: string;      // e.g. "SCHOOL_STUDENT"
  programName: string;      // e.g. "School Students"
  status: boolean;
  description: string;
  assessmentTitle: string;
  reportTitle: string;
  isDemo: boolean;
}

// --- Program Module Types ---
// This keeps old code using ProgramData working
export type ProgramData = Program;
