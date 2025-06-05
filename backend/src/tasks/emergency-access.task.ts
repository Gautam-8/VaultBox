import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrustedContact } from '../trusted-contacts/entities/trusted-contact.entity';
import { EmailService } from '../email/email.service';
import { User } from '../users/entities/user.entity';
import { Not, IsNull } from 'typeorm';

@Injectable()
export class EmergencyAccessTask {
  constructor(
    @InjectRepository(TrustedContact)
    private trustedContactRepository: Repository<TrustedContact>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private emailService: EmailService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async checkEmergencyAccessRequests() {
    const pendingRequests = await this.trustedContactRepository.find({
      where: { 
        isUnlockActive: false,
        lastRequestedAt: Not(IsNull()),
      },
      relations: ['user'],
    });

    for (const request of pendingRequests) {
      const inactiveDays = Math.floor(
        (Date.now() - request.user.lastActive.getTime()) / (1000 * 60 * 60 * 24)
      );

      const daysRemaining = request.unlockAfterDays - inactiveDays;

      // Send status update email if more than 1 day remaining
      if (daysRemaining > 1) {
        await this.emailService.sendAccessStatusUpdateEmail(
          request.contactEmail,
          request.user.email,
          daysRemaining
        );
      }

      // Grant access if inactivity period has passed
      if (inactiveDays >= request.unlockAfterDays) {
        request.isUnlockActive = true;
        await this.trustedContactRepository.save(request);
        
        await this.emailService.sendAccessGrantedEmail(
          request.contactEmail,
          request.user.email
        );
      }
    }
  }
} 