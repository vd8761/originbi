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
}
