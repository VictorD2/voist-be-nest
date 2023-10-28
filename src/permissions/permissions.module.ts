import { Module } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { PermissionsController } from './permissions.controller';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma.service';

@Module({
  controllers: [PermissionsController],
  providers: [PermissionsService, JwtService, PrismaService],
})
export class PermissionsModule {}
