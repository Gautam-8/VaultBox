import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrustedContact } from './entities/trusted-contact.entity';
import { TrustedContactsController } from './trusted-contacts.controller';
import { TrustedContactsService } from './trusted-contacts.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { EmailModule } from '../email/email.module';
import { User } from '../users/entities/user.entity';
import { VaultEntry } from '../vault/entities/vault-entry.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([TrustedContact, User, VaultEntry]),
    NotificationsModule,
    EmailModule,
  ],
  providers: [TrustedContactsService],
  controllers: [TrustedContactsController],
  exports: [TrustedContactsService],
})
export class TrustedContactsModule {} 