import { VaultEntryVisibility, ContentType } from '../../vault/entities/vault-entry.entity';

export interface SharedVaultEntry {
  id: string;
  title: string;
  category: string;
  encryptedContent: string;
  contentType: ContentType;
  visibility: VaultEntryVisibility;
  createdAt: Date;
  updatedAt: Date;
  file?: {
    name: string;
    size: number;
    mimeType: string;
  } | null;
  vaultOwner: {
    email: string;
  };
} 