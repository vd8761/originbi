import { PartialType } from '@nestjs/mapped-types';
import { CreateCorporateRegistrationDto } from './create-corporate-registration.dto';

export class UpdateCorporateRegistrationDto extends PartialType(
  CreateCorporateRegistrationDto,
) {}
