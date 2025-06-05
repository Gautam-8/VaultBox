import api from "@/lib/api";

export interface TrustedContact {
  id: string;
  contactEmail: string;
  unlockAfterDays: number;
  lastRequestedAt: Date | null;
  isUnlockActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SharedVaultEntry {
  id: string;
  title: string;
  category: string;
  content: string;
  file?: {
    name: string;
    url: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AddTrustedContactDto {
  contactEmail: string;
  unlockAfterDays: number;
}

export interface UpdateTrustedContactDto {
  contactEmail: string;
  unlockAfterDays: number;
}

export interface AccessRequestResponse {
  status: 'granted' | 'pending';
  message: string;
  unlockAfterDays?: number;
  inactiveDays?: number;
}

export const trustedContactService = {
  async getTrustedContact(): Promise<TrustedContact | null> {
    const { data } = await api.get<TrustedContact>("/trusted-contacts");
    return data;
  },

  async addTrustedContact(dto: AddTrustedContactDto): Promise<TrustedContact> {
    const { data } = await api.post<TrustedContact>("/trusted-contacts", dto);
    return data;
  },

  async updateTrustedContact(dto: UpdateTrustedContactDto): Promise<TrustedContact> {
    const { data } = await api.put<TrustedContact>("/trusted-contacts", dto);
    return data;
  },

  async removeTrustedContact(): Promise<void> {
    await api.delete("/trusted-contacts");
  },

  async requestAccess(email: string): Promise<AccessRequestResponse> {
    const { data } = await api.post<AccessRequestResponse>("/trusted-contacts/request-access", { contactEmail: email });
    return data;
  },

  async getSharedEntries(): Promise<SharedVaultEntry[]> {
    const { data } = await api.get<SharedVaultEntry[]>("/trusted-contacts/shared-entries");
    return data;
  },

  async grantAccess(contactEmail: string): Promise<AccessRequestResponse> {
    const { data } = await api.post<AccessRequestResponse>("/trusted-contacts/grant-access", { contactEmail });
    return data;
  },
}; 