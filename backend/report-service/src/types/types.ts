export interface AnswerTypeCount {
    ANSWER_TYPE: "D" | "I" | "S" | "C";
    COUNT: number;
}

export interface AgileScore {
    focus: number;
    courage: number;
    respect: number;
    openness: number;
    commitment: number;
}

export interface CollegeData {
    full_name: string;
    email_id: string;
    exam_start: string;
    exam_end: string;
    bi_registration_ID: string;
    assigned_exam_id: string;
    exam_ref_no: string;
    report_title: string;
    score_D: number;
    score_I: number;
    score_S: number;
    score_C: number;
    department_deg_id?: number;
    dept_code?: string;
    group_name?: string;
    most_answered_answer_type: AnswerTypeCount[];
    top_answered_types: any[];
    program_type: number;
    agile_scores: AgileScore[];
}

export interface SchoolData {
    full_name: string;
    email_id: string;
    exam_start: string;
    exam_end: string;
    bi_registration_ID: string;
    assigned_exam_id: string;
    exam_ref_no: string;
    report_title: string;
    score_D: number;
    score_I: number;
    score_S: number;
    score_C: number;
    school_level_id?: number;
    school_stream_id?: number;
    most_answered_answer_type: AnswerTypeCount[];
    top_answered_types: any[];
    program_type: number;
    agile_scores: AgileScore[];
}

// interface UniversityData extends BaseData {
//     department_deg_id: number;
//     school_stream_id?: never;
// }

// interface SchoolData extends BaseData {
//     school_stream_id: number;
//     department_deg_id?: never;
// }

// // Final exported type
// export type InputData = UniversityData | SchoolData;

type RGB = [number, number, number];
export const COLORS: Record<string, RGB> = {
    D: [255, 49, 49], // Red
    I: [232, 178, 54], // Yellow
    S: [0, 173, 76], // Green
    C: [74, 198, 234], // Blue
    BRAND_BLUE: [21, 0, 137],
    TEXT_BLACK: [0, 0, 0],
    TEXT_GREY: [169, 169, 169],
};
