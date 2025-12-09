import { IsString, IsEmail, IsOptional, IsBoolean } from 'class-validator';

export class CreateRegistrationDto {
  @IsString()
  name: string;

  @IsString()
  gender: string;

  @IsEmail()
  email: string;

  @IsString()
  countryCode: string;

  @IsString()
  mobile: string;

  @IsString()
  programType: string;

  @IsOptional()
  @IsString()
  groupName?: string;

  @IsBoolean()
  sendEmail: boolean;

  @IsString()
  examStart: string;

  @IsOptional()
  @IsString()
  examEnd?: string;

  @IsOptional()
  @IsString()
  schoolLevel?: string;

  @IsOptional()
  @IsString()
  schoolStream?: string;

  @IsOptional()
  @IsString()
  currentYear?: string;

  @IsOptional()
  @IsString()
  departmentId?: string;
}
