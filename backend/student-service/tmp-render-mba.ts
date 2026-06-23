/* Temporary offline render harness for the MBA Consolidated Placement Report.
 * Run from backend/student-service:  node -r ts-node/register tmp-render-mba.ts
 * Produces tmp-mba-report.pdf using rich dummy data (no DB needed). */
import { MBAPlacementReport } from './src/report/reports/placement/mbaPlacementReport';
import {
  MBAPlacementData,
  MBAStudentRow,
} from './src/report/types/placementTypes';

let n = 0;
function mk(
  full_name: string,
  trait_code: string,
  r: [number, number, number, number, number], // Commitment, Focus, Openness, Respect, Courage (0-25)
  opts: { duplicate?: boolean; mobile?: string } = {},
): MBAStudentRow {
  n += 1;
  const [Commitment, Focus, Openness, Respect, Courage] = r;
  return {
    registration_ID: n,
    full_name,
    college_year: '2',
    student_exam_ref_no: `CS-2026-${String(n).padStart(3, '0')}`,
    duplicate_name: !!opts.duplicate,
    mobile_number: opts.mobile || '',
    agile_score: {
      Commitment,
      Focus,
      Openness,
      Respect,
      Courage,
      total: Commitment + Focus + Openness + Respect + Courage,
    } as MBAStudentRow['agile_score'],
    trait_code,
    dept_code: 'MBA',
  };
}

const students: MBAStudentRow[] = [
  mk('Ishaan Gupta', 'CD', [21, 23, 20, 15, 18]),
  mk('Ananya Rao', 'CD', [24, 22, 21, 18, 16]),
  mk('Kabir Nair', 'CD', [13, 14, 12, 11, 10]),
  mk('Venkataraman Subramaniam Iyer Krishnamoorthy', 'CD', [22, 24, 19, 17, 20]),
  mk('Rajesh Kumar', 'CD', [18, 20, 16, 14, 12], { duplicate: true, mobile: '9000000001' }),
  mk('Rajesh Kumar', 'CD', [9, 8, 7, 6, 5], { duplicate: true, mobile: '9000000002' }),
  mk('Aarav Sharma', 'DI', [22, 21, 18, 17, 23]),
  mk('Diya Patel', 'DI', [18, 16, 15, 19, 20]),
  mk('Rohan Verma', 'DC', [23, 24, 14, 16, 21]),
  mk('Aditi Desai', 'DS', [20, 19, 13, 17, 15]),
  mk('Aditya Bose', 'ID', [17, 13, 20, 16, 22]),
  mk('Meera Iyer', 'IS', [19, 14, 18, 23, 17]),
  mk('Vivaan Reddy', 'IS', [16, 12, 15, 21, 14]),
  mk('Sara Thomas', 'IC', [15, 18, 17, 14, 16]),
  mk('Manish Pillai', 'SD', [21, 19, 12, 18, 14]),
  mk('Pooja Hegde', 'SI', [17, 13, 16, 22, 13]),
  mk('Saanvi Joshi', 'SC', [22, 20, 13, 19, 12]),
  mk('Arjun Menon', 'CI', [20, 22, 19, 14, 13]),
  mk('Farhan Qureshi', 'CS', [23, 21, 12, 17, 11]),
  mk('Priya Singh', 'S', [21, 16, 12, 22, 11]),
  mk('Neha Kulkarni', 'C', [23, 24, 18, 17, 14]),
  mk('Karthik Pillai', 'C', [12, 15, 11, 13, 9]),
  mk('Devansh Agarwal', 'D', [24, 22, 16, 14, 23]),
  mk('Riya Malhotra', 'I', [16, 12, 19, 18, 21]),
  mk('Mohammed Ali', 'IS', [0, 0, 0, 0, 0]),
];

const data: MBAPlacementData = {
  department_name: 'MBA (Master of Business Administration)',
  degree_type: 'MBA',
  exam_start_date: new Date('2026-04-15').toISOString(),
  total_students: students.length,
  group_name: 'Batch 2024-26',
  report_title: 'MBA Placement Handbook 2026',
  exam_ref_no: 'CS-MBA-2026-DEMO',
  department_id: 1,
  degree_type_id: 1,
  department_deg_id: 1,
  students,
};

(async () => {
  await new MBAPlacementReport(data).generate('tmp-mba-report.pdf');
  // eslint-disable-next-line no-console
  console.log('OK: tmp-mba-report.pdf written (' + students.length + ' students)');
})().catch((e) => {
  // eslint-disable-next-line no-console
  console.error('RENDER FAILED:', e);
  process.exit(1);
});
