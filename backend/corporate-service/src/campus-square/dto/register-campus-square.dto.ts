import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class RegisterCampusSquareCandidateDto {
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
  gender?: 'MALE' | 'FEMALE' | 'OTHER';

  /**
   * School educational board: CBSE, STATE_BOARD, IGCSE, etc.
   * Default: CBSE
   */
  @IsString()
  @IsOptional()
  studentBoard?: string;

  /**
   * Student school level (e.g. 10th, 11th, 12th)
   */
  @IsString()
  @IsOptional()
  schoolLevel?: string;

  /**
   * Student school stream (e.g. Science, Commerce, Arts, Bio-Maths, Computer Science)
   */
  @IsString()
  @IsOptional()
  schoolStream?: string;

  /**
   * Associated event slug from Campus Square (e.g. university-fair-2026-theni)
   */
  @IsString()
  @IsOptional()
  eventSlug?: string;

  @IsString()
  @IsOptional()
  eventName?: string;

  /**
   * Custom group or batch name
   */
  @IsString()
  @IsOptional()
  groupName?: string;

  /**
   * Whether to send welcome email with assessment link
   * Default: true
   */
  @IsOptional()
  sendEmail?: boolean;

  @IsString()
  @IsOptional()
  examStart?: string;

  @IsString()
  @IsOptional()
  examEnd?: string;

  @IsString()
  @IsOptional()
  password?: string;
}
