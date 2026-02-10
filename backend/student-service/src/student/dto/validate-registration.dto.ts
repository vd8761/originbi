import { IsString, IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

export class ValidateRegistrationDto {
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsOptional()
    mobile_number?: string;
}
