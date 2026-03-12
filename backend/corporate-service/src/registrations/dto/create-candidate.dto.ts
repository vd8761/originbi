import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateCandidateDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  mobile: string;

  @IsString()
  @IsOptional()
  countryCode?: string;

  @IsString()
  @IsOptional()
  gender?: 'MALE' | 'FEMALE' | 'OTHER';

  @IsString()
  @IsNotEmpty()
  programType: string;

  @IsString()
  @IsOptional()
  groupName?: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  examStart?: string;

  @IsString()
  @IsOptional()
  examEnd?: string;

  @IsOptional()
  groupAssessmentId?: number;

  @IsOptional()
  sendEmail?: boolean;

  // College / School Fields
  @IsString()
  @IsOptional()
  schoolLevel?: string;

  @IsString()
  @IsOptional()
  schoolStream?: string;

  @IsString()
  @IsOptional()
  departmentId?: string;

  @IsString()
  @IsOptional()
  currentYear?: string;

  @IsString()
  @IsOptional()
  studentBoard?: string;
}
