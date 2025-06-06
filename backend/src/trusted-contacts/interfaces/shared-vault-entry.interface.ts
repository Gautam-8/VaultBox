import { VaultEntryVisibility } from '../../vault/entities/vault-entry.entity';

export interface SharedVaultEntry {
  id: string;
  title: string;
  category: string;
  encryptedContent: string;
  visibility: VaultEntryVisibility;
  createdAt: Date;
  updatedAt: Date;
  vaultOwner: {
    email: string;
  };
} 