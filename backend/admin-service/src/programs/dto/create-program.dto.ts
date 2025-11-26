// create-program.dto.ts
export class CreateProgramDto {
  program_name: string;
  program_level: number;        // 0 or 1
  assessment_title?: string;
  report_title?: string;
  status?: number;              // 0 or 1
}
