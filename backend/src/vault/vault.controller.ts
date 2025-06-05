import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  UseGuards, 
  Request,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { VaultService } from './vault.service';
import { CreateVaultEntryDto, UpdateVaultEntryDto } from './dto/vault-entry.dto';
import { ContentType } from './entities/vault-entry.entity';

type CreateVaultEntryWithFile = CreateVaultEntryDto & {
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
};

@Controller('vault')
@UseGuards(JwtAuthGuard)
export class VaultController {
  constructor(private readonly vaultService: VaultService) {}

  @Post()
  create(@Request() req, @Body() createVaultEntryDto: CreateVaultEntryDto) {
    const dto: CreateVaultEntryDto = {
      ...createVaultEntryDto,
      contentType: ContentType.TEXT,
    };
    return this.vaultService.create(req.user.userId, dto);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Request() req,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
        ],
      }),
    )
    file: Express.Multer.File,
    @Body() createVaultEntryDto: CreateVaultEntryDto,
  ) {
    const dto: CreateVaultEntryDto = {
      ...createVaultEntryDto,
      content: file.buffer.toString('base64'),
      contentType: ContentType.FILE,
      file: {
        originalname: file.originalname,
        size: file.size,
        mimetype: file.mimetype
      }
    };
    return this.vaultService.create(req.user.userId, dto);
  }

  @Get()
  findAll(@Request() req) {
    return this.vaultService.findAll(req.user.userId);
  }

  @Get(':id')
  findOne(@Request() req, @Param('id') id: string) {
    return this.vaultService.findOne(id, req.user.userId);
  }

  @Put(':id')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateVaultEntryDto: UpdateVaultEntryDto,
  ) {
    return this.vaultService.update(id, req.user.userId, updateVaultEntryDto);
  }

  @Delete(':id')
  delete(@Request() req, @Param('id') id: string) {
    return this.vaultService.delete(req.user.userId, id);
  }
} 