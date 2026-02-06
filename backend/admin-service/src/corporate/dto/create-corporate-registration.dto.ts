import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsIn,
} from 'class-validator';

export class CreateCorporateRegistrationDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsIn(['MALE', 'FEMALE', 'OTHER'])
  gender: 'MALE' | 'FEMALE' | 'OTHER';

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  countryCode: string;

  @IsNotEmpty()
  @IsString()
  mobile: string;

  @IsNotEmpty()
  @IsString()
  companyName: string;

  @IsOptional()
  @IsString()
  jobTitle?: string;

  @IsOptional()
  @IsString()
  employeeCode?: string;

  @IsOptional()
  @IsString()
  linkedinUrl?: string;

  @IsNotEmpty()
  @IsString()
  sector: string; // sector_code

  @IsNotEmpty()
  @IsString()
  password: string; // Plain text password for Cognito

  @IsOptional()
  @IsNumber()
  credits?: number; // Optional initial credits

  @IsOptional()
  @IsBoolean()
  status?: boolean; // isActive

  @IsNotEmpty()
  @IsString()
  businessLocations: string;

  @IsOptional()
  @IsBoolean()
  sendEmail?: boolean;

  @IsOptional()
  counsellingAccess?: number[];

  // Snake_case aliases for Update compatibility
  @IsOptional()
  @IsString()
  full_name?: string;

  @IsOptional()
  @IsString()
  company_name?: string;

  @IsOptional()
  @IsString()
  job_title?: string;

  @IsOptional()
  @IsString()
  employee_ref_id?: string;

  @IsOptional()
  @IsString()
  linkedin_url?: string;

  @IsOptional()
  @IsString()
  sector_code?: string;

  @IsOptional()
  @IsString()
  mobile_number?: string;

  @IsOptional()
  @IsString()
  country_code?: string;

  @IsOptional()
  @IsString()
  business_locations?: string;
}
