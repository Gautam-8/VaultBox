import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VaultEntry, VaultEntryVisibility, ContentType } from './entities/vault-entry.entity';
import { CreateVaultEntryDto, UpdateVaultEntryDto } from './dto/vault-entry.dto';

@Injectable()
export class VaultService {
  constructor(
    @InjectRepository(VaultEntry)
    private vaultEntryRepository: Repository<VaultEntry>,
  ) {}

  async create(userId: string, dto: CreateVaultEntryDto) {
    const entry = this.vaultEntryRepository.create({
      userId,
      title: dto.title,
      category: dto.category,
      encryptedContent: dto.content,
      contentType: dto.contentType || ContentType.TEXT,
      visibility: dto.visibility,
      autoDeleteDate: dto.autoDeleteDate,
      ...(dto.file && {
        file: {
          name: dto.file.originalname,
          size: dto.file.size,
          mimeType: dto.file.mimetype,
        }
      }),
    });

    return this.vaultEntryRepository.save(entry);
  }

  async findOne(userId: string, entryId: string) {
    const entry = await this.vaultEntryRepository.findOne({
      where: { id: entryId, userId },
    });

    if (!entry) {
      throw new NotFoundException('Vault entry not found');
    }

    return entry;
  }

  async findAll(userId: string) {
    return this.vaultEntryRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async update(userId: string, entryId: string, dto: UpdateVaultEntryDto) {
    const entry = await this.findOne(userId, entryId);

    // Update content if provided
    if (dto.content) {
      entry.encryptedContent = dto.content;
    }

    // Update file if present
    if (dto.file) {
      entry.contentType = ContentType.FILE;
      entry.file = {
        name: dto.file.originalname,
        size: dto.file.size,
        mimeType: dto.file.mimetype,
      };
    }

    // Update other fields
    Object.assign(entry, {
      title: dto.title ?? entry.title,
      category: dto.category ?? entry.category,
      visibility: dto.visibility ?? entry.visibility,
      autoDeleteDate: dto.autoDeleteDate ?? entry.autoDeleteDate,
    });

    return this.vaultEntryRepository.save(entry);
  }

  async delete(userId: string, entryId: string) {
    const entry = await this.findOne(userId, entryId);
    await this.vaultEntryRepository.remove(entry);
  }
} 