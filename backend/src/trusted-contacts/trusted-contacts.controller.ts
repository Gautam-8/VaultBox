import { Controller, Get, Post, Put, Delete, Body, UseGuards, Param, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TrustedContactsService } from './trusted-contacts.service';
import {
  CreateTrustedContactDto,
  UpdateTrustedContactDto,
  RequestAccessDto,
} from './dto/trusted-contact.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { SharedVaultEntry } from './interfaces/shared-vault-entry.interface';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Controller('trusted-contacts')
@UseGuards(JwtAuthGuard)
export class TrustedContactsController {
  constructor(
    private readonly trustedContactsService: TrustedContactsService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  @Get()
  async getTrustedContact(@CurrentUser() userId: string) {
    return this.trustedContactsService.findByUser(userId);
  }

  @Get('check-access')
  async checkAccess(@CurrentUser() userId: string) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.trustedContactsService.checkTrustedContactAccess(user.email);
  }

  @Post()
  async create(
    @CurrentUser() userId: string,
    @Body() createDto: CreateTrustedContactDto,
  ) {
    return this.trustedContactsService.create(
      userId,
      createDto.contactEmail,
      createDto.unlockAfterDays,
    );
  }

  @Put()
  async update(
    @CurrentUser() userId: string,
    @Body() updateDto: UpdateTrustedContactDto,
  ) {
    return this.trustedContactsService.update(
      userId,
      updateDto.contactEmail,
      updateDto.unlockAfterDays,
    );
  }

  @Delete()
  async remove(@CurrentUser() userId: string) {
    return this.trustedContactsService.remove(userId);
  }

  @Post('request-access')
  async requestAccess(
    @CurrentUser() userId: string,
    @Body('vaultOwnerEmail') vaultOwnerEmail: string,
  ) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.trustedContactsService.requestAccess(user.email, vaultOwnerEmail);
  }

  @Get('shared-entries')
  async getSharedEntries(@CurrentUser() userId: string): Promise<SharedVaultEntry[]> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.trustedContactsService.getSharedEntries(user.email);
  }

  @Post('grant-access')
  async grantAccess(
    @CurrentUser() userId: string,
    @Body('contactEmail') contactEmail: string,
  ) {
    return this.trustedContactsService.grantAccess(userId, contactEmail);
  }
} 