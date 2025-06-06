export enum VaultEntryCategory {
  FINANCE = "FINANCE",
  HEALTH = "HEALTH",
  PERSONAL = "PERSONAL",
  NOTES = "NOTES",
}

export enum VaultEntryVisibility {
  PRIVATE = "Private",
  SHARED = "Shared",
  UNLOCK_AFTER = "UnlockAfter",
}

export enum ContentType {
  TEXT = "text",
  FILE = "file",
}

export interface VaultEntry {
  id: string;
  title: string;
  category: VaultEntryCategory;
  contentType: ContentType;
  encryptedContent: string;
  file?: {
    name: string;
    size: number;
    mimeType: string;
  };
  autoDeleteDate?: string;
  visibility: VaultEntryVisibility;
  createdAt: string;
  updatedAt: string;
  maskedPreview?: string;
}

export interface CreateVaultEntryDto {
  title: string;
  category: VaultEntryCategory;
  content: string;
  contentType?: ContentType;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  autoDeleteDate?: string;
  visibility?: VaultEntryVisibility;
}

export interface UpdateVaultEntryDto extends Partial<CreateVaultEntryDto> {} 