import { IsEmail, IsNumber, Min } from 'class-validator';

export class CreateTrustedContactDto {
  @IsEmail()
  contactEmail: string;

  @IsNumber()
  @Min(1)
  unlockAfterDays: number;
}

export class UpdateTrustedContactDto {
  @IsEmail()
  contactEmail: string;

  @IsNumber()
  @Min(1)
  unlockAfterDays: number;
}

export class RequestAccessDto {
  @IsEmail()
  contactEmail: string;
} 