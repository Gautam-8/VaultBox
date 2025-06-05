import { VaultEntryCategory, VaultEntryVisibility } from '../entities/vault-entry.entity';

export class CreateVaultEntryDto {
  title: string;
  category: VaultEntryCategory;
  content: string;
  visibility: VaultEntryVisibility;
  file?: Express.Multer.File;
  autoDeleteDate?: Date;
  unlockAfterDays?: number;
} 