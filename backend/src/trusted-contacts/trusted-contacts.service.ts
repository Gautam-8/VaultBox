import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrustedContact } from './entities/trusted-contact.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';
import { User } from '../users/entities/user.entity';
import { VaultEntry, VaultEntryVisibility } from '../vault/entities/vault-entry.entity';
import { SharedVaultEntry } from './interfaces/shared-vault-entry.interface';
import { In } from 'typeorm';

@Injectable()
export class TrustedContactsService {
  constructor(
    @InjectRepository(TrustedContact)
    private trustedContactRepository: Repository<TrustedContact>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(VaultEntry)
    private vaultEntryRepository: Repository<VaultEntry>,
    private notificationsService: NotificationsService,
    private emailService: EmailService,
  ) {}

  async create(userId: string, contactEmail: string, unlockAfterDays: number) {
    // Check if target user exists and is registered
    const targetUser = await this.userRepository.findOne({
      where: { email: contactEmail },
    });

    if (!targetUser) {
      throw new NotFoundException('User must be registered to be a trusted contact');
    }

    // Check if user already has a trusted contact
    const existingAsOwner = await this.trustedContactRepository.findOne({
      where: { userId },
    });

    if (existingAsOwner) {
      throw new ConflictException('You already have a trusted contact');
    }

    // Check if target user is already someone's trusted contact
    const existingAsContact = await this.trustedContactRepository.findOne({
      where: { contactEmail },
    });

    if (existingAsContact) {
      throw new ConflictException('This user is already a trusted contact for another vault');
    }

    // Get current user's email
    const currentUser = await this.userRepository.findOne({ where: { id: userId } });
    if (!currentUser) {
      throw new NotFoundException('Current user not found');
    }

    const trustedContact = this.trustedContactRepository.create({
      userId,
      contactEmail,
      unlockAfterDays,
    });

    const savedContact = await this.trustedContactRepository.save({
      ...trustedContact,
      userId,
    });

    // Notify the trusted contact
    await this.emailService.sendTrustedContactAddedEmail(contactEmail);
    
    return savedContact;
  }

  async update(userId: string, contactEmail: string, unlockAfterDays: number) {
    const currentContact = await this.trustedContactRepository.findOne({
      where: { userId },
    });

    if (!currentContact) {
      throw new NotFoundException('Trusted contact not found');
    }

    // If email is being changed, perform the same checks as create
    if (currentContact.contactEmail !== contactEmail) {
      const targetUser = await this.userRepository.findOne({
        where: { email: contactEmail },
      });

      if (!targetUser) {
        throw new NotFoundException('User must be registered to be a trusted contact');
      }

      // Check if target user is already someone's trusted contact
      const existingAsContact = await this.trustedContactRepository.findOne({
        where: { contactEmail },
      });

      if (existingAsContact) {
        throw new ConflictException('This user is already a trusted contact for another vault');
      }

      // Get current user's email
      const currentUser = await this.userRepository.findOne({ where: { id: userId } });
      if (!currentUser) {
        throw new NotFoundException('Current user not found');
      }

      // Notify the new trusted contact
      await this.emailService.sendTrustedContactAddedEmail(contactEmail);
    }

    currentContact.contactEmail = contactEmail;
    currentContact.unlockAfterDays = unlockAfterDays;

    return this.trustedContactRepository.save(currentContact);
  }

  async findByUser(userId: string) {
    return this.trustedContactRepository.findOne({
      where: { userId },
    });
  }

  async checkTrustedContactAccess(userEmail: string) {
    const trustedContacts = await this.trustedContactRepository.find({
      where: { contactEmail: userEmail },
      relations: ['user'],
    });

    if (!trustedContacts.length) {
      return {
        isTrustedContact: false,
        vaultOwners: []
      };
    }

    return {
      isTrustedContact: true,
      vaultOwners: trustedContacts.map(contact => ({
        email: contact.user.email,
        isUnlockActive: contact.isUnlockActive,
        unlockAfterDays: contact.unlockAfterDays,
        lastRequestedAt: contact.lastRequestedAt
      }))
    };
  }

  async findVaultsAsContact(userEmail: string) {
    return this.trustedContactRepository.find({
      where: { contactEmail: userEmail },
      relations: ['user'],
    });
  }

  async getSharedEntries(userEmail: string): Promise<SharedVaultEntry[]> {
    // Find all vaults where user is trusted contact
    const trustedContacts = await this.trustedContactRepository.find({
      where: { 
        contactEmail: userEmail,
        isUnlockActive: true 
      },
      relations: ['user'],
    });

    if (!trustedContacts.length) {
      return [];
    }

    // Get entries from all vaults where user is trusted contact
    const allEntries: SharedVaultEntry[] = [];
    for (const contact of trustedContacts) {
      const vaultEntries = await this.vaultEntryRepository.find({
        where: {
          userId: contact.userId,
          visibility: In([VaultEntryVisibility.SHARED, VaultEntryVisibility.UNLOCK_AFTER]),
        },
        relations: ['user'], // Include vault owner details
      });
      
      // Add vault owner info to each entry
      const enrichedEntries: SharedVaultEntry[] = vaultEntries.map(entry => ({
        id: entry.id,
        title: entry.title,
        category: entry.category,
        encryptedContent: entry.encryptedContent,
        contentType: entry.contentType,
        visibility: entry.visibility,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
        file: entry.file,
        vaultOwner: {
          email: contact.user.email,
        }
      }));
      
      allEntries.push(...enrichedEntries);
    }

    return allEntries;
  }

  async remove(userId: string) {
    const trustedContact = await this.trustedContactRepository.findOne({
      where: { userId },
    });

    if (!trustedContact) {
      throw new NotFoundException('Trusted contact not found');
    }

    await this.trustedContactRepository.remove(trustedContact);
    return { success: true };
  }

  async requestAccess(requestingUserEmail: string, vaultOwnerEmail: string) {
    const trustedContact = await this.trustedContactRepository.findOne({
      where: { 
        contactEmail: requestingUserEmail,
        user: { email: vaultOwnerEmail }
      },
      relations: ['user'],
    });

    if (!trustedContact) {
      throw new NotFoundException('Trusted contact not found');
    }

    // Update last requested time
    trustedContact.lastRequestedAt = new Date();
    await this.trustedContactRepository.save(trustedContact);

    // Create notification for vault owner
    await this.notificationsService.createAccessRequestNotification(
      trustedContact.userId,
      requestingUserEmail,
    );

    // Send email to trusted contact
    await this.emailService.sendAccessRequestEmail(
      requestingUserEmail,
      vaultOwnerEmail,
    );

    // Check if user has been inactive long enough
    const user = trustedContact.user;
    const inactiveDays = Math.floor(
      (Date.now() - user.lastActive.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (inactiveDays >= trustedContact.unlockAfterDays) {
      trustedContact.isUnlockActive = true;
      await this.trustedContactRepository.save(trustedContact);
      
      // Send access granted email
      await this.emailService.sendAccessGrantedEmail(
        requestingUserEmail,
        vaultOwnerEmail,
      );

      return {
        status: 'granted',
        message: 'Access granted due to user inactivity',
      };
    }

    return {
      status: 'pending',
      message: 'Access request sent to vault owner',
      unlockAfterDays: trustedContact.unlockAfterDays,
      inactiveDays,
    };
  }

  async checkInactiveUsers() {
    const trustedContacts = await this.trustedContactRepository
      .createQueryBuilder('tc')
      .innerJoinAndSelect('tc.user', 'user')
      .where('user.lastActive < :threshold', {
        threshold: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours
      })
      .getMany();

    for (const contact of trustedContacts) {
      const inactiveDays = Math.floor(
        (Date.now() - contact.user.lastActive.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (inactiveDays >= contact.unlockAfterDays && !contact.isUnlockActive) {
        contact.isUnlockActive = true;
        await this.trustedContactRepository.save(contact);
        
        // Create notifications and send emails
        await this.notificationsService.createInactivityWarningNotification(
          contact.userId,
        );
        await this.emailService.sendInactivityWarningEmail(
          contact.user.email,
          contact.contactEmail,
        );
        await this.emailService.sendAccessGrantedEmail(
          contact.contactEmail,
          contact.user.email,
        );
      }
    }

    return trustedContacts;
  }

  async grantAccess(userId: string, contactEmail: string) {
    const trustedContact = await this.trustedContactRepository.findOne({
      where: { userId, contactEmail },
      relations: ['user'],
    });

    if (!trustedContact) {
      throw new NotFoundException('Trusted contact not found');
    }

    trustedContact.isUnlockActive = true;
    await this.trustedContactRepository.save(trustedContact);

    // Send access granted email
    await this.emailService.sendAccessGrantedEmail(
      contactEmail,
      trustedContact.user.email,
    );

    return {
      status: 'granted',
      message: 'Access granted manually by vault owner',
    };
  }
} 