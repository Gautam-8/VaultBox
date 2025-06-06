import api from '@/lib/api';

export interface TrustedContact {
  id: string;
  contactEmail: string;
  unlockAfterDays: number;
  lastRequestedAt: Date | null;
  isUnlockActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AddTrustedContactDto {
  contactEmail: string;
  unlockAfterDays: number;
}

export interface AccessStatus {
  status: 'pending' | 'granted';
  unlockAfterDays: number;
  inactiveDays: number;
}

export interface SharedVaultEntry {
  id: string;
  title: string;
  category: string;
  encryptedContent: string;
  visibility: string;
  createdAt: Date;
  updatedAt: Date;
  vaultOwner: {
    email: string;
  };
}

export interface TrustedContactAccess {
  isTrustedContact: boolean;
  vaultOwners: Array<{
    email: string;
    isUnlockActive: boolean;
    unlockAfterDays: number;
    lastRequestedAt: Date | null;
  }>;
}

export const trustedContactService = {
  getTrustedContact: async () => {
    const response = await api.get<TrustedContact>('/trusted-contacts');
    return response.data;
  },

  addTrustedContact: async (dto: AddTrustedContactDto) => {
    const response = await api.post<TrustedContact>('/trusted-contacts', dto);
    return response.data;
  },

  updateTrustedContact: async (dto: AddTrustedContactDto) => {
    const response = await api.put<TrustedContact>('/trusted-contacts', dto);
    return response.data;
  },

  removeTrustedContact: async () => {
    const response = await api.delete('/trusted-contacts');
    return response.data;
  },

  requestAccess: async (vaultOwnerEmail: string) => {
    const response = await api.post<AccessStatus>('/trusted-contacts/request-access', {
      vaultOwnerEmail,
    });
    return response.data;
  },

  getSharedEntries: async () => {
    const response = await api.get<SharedVaultEntry[]>('/trusted-contacts/shared-entries');
    return response.data;
  },

  grantAccess: async (contactEmail: string) => {
    const response = await api.post('/trusted-contacts/grant-access', {
      contactEmail,
    });
    return response.data;
  },

  checkAccess: async () => {
    const response = await api.get<TrustedContactAccess>('/trusted-contacts/check-access');
    return response.data;
  },
}; 