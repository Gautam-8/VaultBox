import api from "@/lib/api";

export enum VaultEntryCategory {
  FINANCE = "Finance",
  HEALTH = "Health",
  PERSONAL = "Personal",
  NOTES = "Notes",
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
  autoDeleteDate?: Date;
  unlockAfter?: Date;
  visibility: VaultEntryVisibility;
  createdAt: Date;
  updatedAt: Date;
  maskedPreview?: string;
}

export interface CreateVaultEntryDto {
  title: string;
  category: VaultEntryCategory;
  content: string;
  visibility: VaultEntryVisibility;
  file?: File;
  contentType?: ContentType;
  autoDeleteDate?: Date;
  unlockAfter?: Date;
}

export interface UpdateVaultEntryDto extends CreateVaultEntryDto {}

export const vaultService = {
  async createEntry(data: CreateVaultEntryDto | FormData): Promise<VaultEntry> {
    if (data instanceof FormData) {
      return this.uploadFile(data);
    }

    const response = await api.post<VaultEntry>("/vault", {
      ...data,
      contentType: ContentType.TEXT,
    });
    return response.data;
  },

  async uploadFile(formData: FormData): Promise<VaultEntry> {
    formData.append("contentType", ContentType.FILE);
    
    const response = await api.post<VaultEntry>("/vault/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  async getAllEntries(): Promise<VaultEntry[]> {
    const { data } = await api.get<VaultEntry[]>("/vault");
    return data;
  },

  async getEntry(id: string): Promise<VaultEntry> {
    const { data } = await api.get<VaultEntry>(`/vault/${id}`);
    return data;
  },

  async updateEntry(id: string, data: UpdateVaultEntryDto): Promise<VaultEntry> {
    const { data: response } = await api.put<VaultEntry>(`/vault/${id}`, data);
    return response;
  },

  async deleteEntry(id: string): Promise<void> {
    await api.delete(`/vault/${id}`);
  },
}; 