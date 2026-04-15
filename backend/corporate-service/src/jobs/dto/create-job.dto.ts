import { IsArray, IsDateString, IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateJobDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  department?: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  location?: string;

  @IsString()
  @IsIn(['ONSITE', 'REMOTE', 'HYBRID'])
  workMode: 'ONSITE' | 'REMOTE' | 'HYBRID';

  @IsString()
  @IsIn(['FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'CONTRACT'])
  employmentType: 'FULL_TIME' | 'PART_TIME' | 'INTERNSHIP' | 'CONTRACT';

  @IsOptional()
  @IsString()
  @IsIn(['DAY', 'NIGHT', 'ROTATIONAL', 'FLEXIBLE'])
  shift?: 'DAY' | 'NIGHT' | 'ROTATIONAL' | 'FLEXIBLE';

  @IsOptional()
  @IsString()
  @IsIn(['FRESHER', 'JUNIOR', 'MID', 'SENIOR', 'LEAD'])
  experienceLevel?: 'FRESHER' | 'JUNIOR' | 'MID' | 'SENIOR' | 'LEAD';

  @IsOptional()
  minCtc?: number | string;

  @IsOptional()
  maxCtc?: number | string;

  @IsOptional()
  @IsString()
  currencyCode?: string;

  @IsOptional()
  openings?: number | string;

  @IsOptional()
  @IsString()
  @IsIn(['DRAFT', 'ACTIVE', 'HOLD', 'CLOSED', 'ARCHIVED'])
  status?: 'DRAFT' | 'ACTIVE' | 'HOLD' | 'CLOSED' | 'ARCHIVED';

  @IsOptional()
  @IsDateString()
  postingStartAt?: string;

  @IsOptional()
  @IsDateString()
  postingEndAt?: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsString()
  responsibilities?: string;

  @IsOptional()
  @IsString()
  eligibility?: string;

  @IsOptional()
  @IsString()
  niceToHave?: string;

  @IsOptional()
  @IsString()
  whatYouWillLearn?: string;

  @IsOptional()
  @IsString()
  companyDetails?: string;

  @IsOptional()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsArray()
  requiredSkills?: string[];

  @IsOptional()
  @IsArray()
  preferredSkills?: string[];
}
