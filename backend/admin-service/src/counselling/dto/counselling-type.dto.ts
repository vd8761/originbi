import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsJSON } from 'class-validator';

export class CreateCounsellingTypeDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    prompt: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @IsOptional()
    courseDetails?: any;
}

export class UpdateCounsellingTypeDto {
    @IsString()
    @IsOptional()
    name?: string;

    @IsString()
    @IsOptional()
    prompt?: string;

    @IsBoolean()
    @IsOptional()
    isActive?: boolean;

    @IsOptional()
    courseDetails?: any;
}
