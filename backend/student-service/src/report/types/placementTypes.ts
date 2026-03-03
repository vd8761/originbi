// types/placementTypes.ts

export interface Student {
    registration_ID: number;
    full_name: string;
    college_year: string;
    student_exam_ref_no: string;
    duplicate_name?: boolean;
    mobile_number?: string;
    agile_score: AgileScore;
}

export interface AgileScore {
    Focus: number;
    total: number;
    Courage: number;
    Respect: number;
    Openness: number;
    Commitment: number;
    scoreDuplicateFix?: boolean;
}

export interface CareerRoleTool {
    name: string;
    above: boolean; // For the alternating up/down layout
}

export interface TraitGroup {
    trait_ID: number;
    trait_code: string; // e.g., "DI", "SC"
    blended_style_name: string; // e.g., "Charismatic Leader"
    blended_style_desc: string;
    student_count: number;
    students_data: Student[];
    color_rgb: [number, number, number]; // Added this to carry color info
}

export interface PlacementData {
    department_name: string;
    degree_type: string;
    exam_start_date: string;
    total_students: number;
    group_name: string;
    trait_distribution: TraitGroup[];
    report_title: string;
    exam_ref_no: string;
    // ID references for logic if needed
    department_id: number;
    degree_type_id: number;
    department_deg_id: number;
}
