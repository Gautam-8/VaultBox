import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum VaultEntryCategory {
  FINANCE = 'Finance',
  HEALTH = 'Health',
  PERSONAL = 'Personal',
  NOTES = 'Notes',
}

export enum VaultEntryVisibility {
  PRIVATE = 'Private',
  SHARED = 'Shared',
  UNLOCK_AFTER = 'UnlockAfter',
}

export enum ContentType {
  TEXT = 'text',
  FILE = 'file',
}

@Entity('vault_entries')
export class VaultEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: string;

  @Column()
  title: string;

  @Column({
    type: 'enum',
    enum: VaultEntryCategory,
  })
  category: VaultEntryCategory;

  @Column('text')
  encryptedContent: string;

  @Column({
    type: 'enum',
    enum: ContentType,
    default: ContentType.TEXT,
  })
  contentType: ContentType;

  @Column({ type: 'json', nullable: true })
  file?: {
    name: string;
    size: number;
    mimeType: string;
  };

  @Column({
    type: 'enum',
    enum: VaultEntryVisibility,
    default: VaultEntryVisibility.PRIVATE,
  })
  visibility: VaultEntryVisibility;

  @Column({ nullable: true })
  autoDeleteDate?: Date;

  @Column({ nullable: true })
  unlockAfter?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  getPreview(): string {
    if (this.contentType === ContentType.FILE) {
      return `[File: ${this.file?.name}]`;
    }

    // For text content, show a preview of first few characters
    const decryptedLength = Math.ceil(this.encryptedContent.length / 2);
    return this.encryptedContent.substring(0, decryptedLength) + '...';
  }
} 