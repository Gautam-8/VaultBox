import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrustedContact } from './entities/trusted-contact.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { EmailService } from '../email/email.service';
import { User } from '../users/entities/user.entity';
import { VaultEntry, VaultEntryVisibility } from '../vault/entities/vault-entry.entity';

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
    // Check if user already has a trusted contact
    const existingContact = await this.trustedContactRepository.findOne({
      where: { userId },
    });

    if (existingContact) {
      throw new ConflictException('User already has a trusted contact');
    }

    const trustedContact = this.trustedContactRepository.create({
      userId,
      contactEmail,
      unlockAfterDays,
    });

    return this.trustedContactRepository.save(trustedContact);
  }

  async findByUser(userId: string) {
    return this.trustedContactRepository.findOne({
      where: { userId },
    });
  }

  async update(userId: string, contactEmail: string, unlockAfterDays: number) {
    const trustedContact = await this.trustedContactRepository.findOne({
      where: { userId },
    });

    if (!trustedContact) {
      throw new NotFoundException('Trusted contact not found');
    }

    trustedContact.contactEmail = contactEmail;
    trustedContact.unlockAfterDays = unlockAfterDays;

    return this.trustedContactRepository.save(trustedContact);
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

  async requestAccess(contactEmail: string) {
    const trustedContact = await this.trustedContactRepository.findOne({
      where: { contactEmail },
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
      contactEmail,
    );

    // Send email to trusted contact
    await this.emailService.sendAccessRequestEmail(
      contactEmail,
      trustedContact.user.email,
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
        contactEmail,
        trustedContact.user.email,
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

  async getSharedEntries(userId: string) {
    const trustedContact = await this.trustedContactRepository.findOne({
      where: { contactEmail: userId },
      relations: ['user'],
    });

    if (!trustedContact || !trustedContact.isUnlockActive) {
      return [];
    }

    return this.vaultEntryRepository.find({
      where: {
        userId: trustedContact.userId,
        visibility: VaultEntryVisibility.SHARED,
      },
    });
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