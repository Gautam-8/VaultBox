import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Notification, NotificationType } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  async create(userId: string, type: NotificationType, message: string) {
    const notification = this.notificationRepository.create({
      userId,
      type,
      message,
    });
    return this.notificationRepository.save(notification);
  }

  async findAllForUser(userId: string) {
    return this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(notificationId: string, userId: string) {
    await this.notificationRepository.update(
      { id: notificationId, userId },
      { isRead: true },
    );
  }

  async createAccessRequestNotification(userId: string, contactEmail: string) {
    const notification = this.notificationRepository.create({
      userId,
      type: NotificationType.ACCESS_REQUEST,
      title: 'Emergency Access Request',
      message: `Your trusted contact (${contactEmail}) has requested emergency access to your vault.`,
      data: { contactEmail },
      isRead: false,
    });

    return this.notificationRepository.save(notification);
  }

  async createAccessGrantedNotification(userId: string, vaultOwnerEmail: string) {
    const notification = this.notificationRepository.create({
      userId,
      type: NotificationType.ACCESS_GRANTED,
      title: 'Emergency Access Granted',
      message: `You have been granted emergency access to ${vaultOwnerEmail}'s vault.`,
      data: { vaultOwnerEmail },
      isRead: false,
    });

    return this.notificationRepository.save(notification);
  }

  async createTrustedContactAddedNotification(userId: string, vaultOwnerEmail: string) {
    const notification = this.notificationRepository.create({
      userId,
      type: NotificationType.TRUSTED_CONTACT_ADDED,
      title: 'Added as Trusted Contact',
      message: `${vaultOwnerEmail} has added you as their trusted contact for emergency vault access.`,
      data: { vaultOwnerEmail },
      isRead: false,
    });

    return this.notificationRepository.save(notification);
  }

  async createEntryExpiringNotification(userId: string, entryTitle: string) {
    return this.create(
      userId,
      NotificationType.ENTRY_EXPIRING,
      `Your vault entry "${entryTitle}" is about to expire.`,
    );
  }

  async createInactivityWarningNotification(userId: string) {
    const notification = this.notificationRepository.create({
      userId,
      type: NotificationType.INACTIVITY_WARNING,
      title: 'Inactivity Warning',
      message: 'Your vault has been inactive. Your trusted contact may gain access soon.',
      isRead: false,
    });

    return this.notificationRepository.save(notification);
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleExpiredEntries() {
    // This will be implemented when we add the scheduled tasks
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handleInactiveUsers() {
    // This will be implemented when we add the scheduled tasks
  }

  async getUserNotifications(userId: string) {
    return this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async markAllAsRead(userId: string) {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true },
    );
  }
} 