import { Controller, Get, Post, Put, Delete, Body, UseGuards, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TrustedContactsService } from './trusted-contacts.service';
import {
  CreateTrustedContactDto,
  UpdateTrustedContactDto,
  RequestAccessDto,
} from './dto/trusted-contact.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('trusted-contacts')
@UseGuards(JwtAuthGuard)
export class TrustedContactsController {
  constructor(private readonly trustedContactsService: TrustedContactsService) {}

  @Get()
  async getTrustedContact(@CurrentUser() userId: string) {
    return this.trustedContactsService.findByUser(userId);
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
  async requestAccess(@Body('contactEmail') contactEmail: string) {
    return this.trustedContactsService.requestAccess(contactEmail);
  }

  @Get('shared-entries')
  async getSharedEntries(@CurrentUser() userId: string) {
    return this.trustedContactsService.getSharedEntries(userId);
  }

  @Post('grant-access')
  async grantAccess(
    @CurrentUser() userId: string,
    @Body('contactEmail') contactEmail: string,
  ) {
    return this.trustedContactsService.grantAccess(userId, contactEmail);
  }
} 