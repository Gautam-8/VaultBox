import { IsString, IsEnum, IsOptional, IsDate, IsNumber, MinLength } from 'class-validator';
import { VaultEntryCategory, VaultEntryVisibility, ContentType } from '../entities/vault-entry.entity';
import { Type } from 'class-transformer';

export class CreateVaultEntryDto {
  @IsString()
  title: string;

  @IsEnum(VaultEntryCategory)
  category: VaultEntryCategory;

  @IsString()
  content: string;

  @IsEnum(ContentType)
  contentType: ContentType = ContentType.TEXT;

  @IsOptional()
  file?: {
    originalname: string;
    size: number;
    mimetype: string;
  };

  @IsOptional()
  @IsNumber()
  unlockAfterDays?: number;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  autoDeleteDate?: Date;

  @IsEnum(VaultEntryVisibility)
  visibility: VaultEntryVisibility;
}

export class UpdateVaultEntryDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsEnum(VaultEntryCategory)
  category?: VaultEntryCategory;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsEnum(ContentType)
  contentType?: ContentType;

  @IsOptional()
  file?: {
    originalname: string;
    size: number;
    mimetype: string;
  };

  @IsOptional()
  @IsEnum(VaultEntryVisibility)
  visibility?: VaultEntryVisibility;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  autoDeleteDate?: Date;
}

export class DecryptVaultEntryDto {
  @IsString()
  @MinLength(8)
  passphrase: string;
} 