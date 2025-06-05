import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { TrustedContactsService } from '../trusted-contacts/trusted-contacts.service';

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly trustedContactsService: TrustedContactsService,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleInactivityCheck() {
    this.logger.debug('Running inactivity check...');
    try {
      const updatedContacts = await this.trustedContactsService.checkInactiveUsers();
      if (updatedContacts.length > 0) {
        this.logger.log(
          `Found ${updatedContacts.length} inactive users. Emergency access granted to their trusted contacts.`
        );
      }
    } catch (error) {
      this.logger.error('Error during inactivity check:', error);
    }
  }
} 