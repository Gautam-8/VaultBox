import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrustedContact } from '../trusted-contacts/entities/trusted-contact.entity';
import { User } from '../users/entities/user.entity';
import { EmailModule } from '../email/email.module';
import { EmergencyAccessTask } from './emergency-access.task';

@Module({
  imports: [
    TypeOrmModule.forFeature([TrustedContact, User]),
    EmailModule,
  ],
  providers: [EmergencyAccessTask],
})
export class TasksModule {} 