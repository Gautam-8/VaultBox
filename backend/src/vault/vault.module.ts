import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VaultEntry } from './entities/vault-entry.entity';
import { VaultController } from './vault.controller';
import { VaultService } from './vault.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([VaultEntry]),
  ],
  controllers: [VaultController],
  providers: [VaultService],
  exports: [VaultService],
})
export class VaultModule {} 