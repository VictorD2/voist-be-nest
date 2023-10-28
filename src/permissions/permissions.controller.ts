import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { GetPermissionIdDto } from './dto/get-permission.dto';

@Controller('api/v0/permission')
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionsService.create(createPermissionDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll() {
    return this.permissionsService.findAll();
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param() param: GetPermissionIdDto) {
    const { id } = param;
    return this.permissionsService.findOne(+id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(
    @Param() param: GetPermissionIdDto,
    @Body() updatePermissionDto: UpdatePermissionDto,
  ) {
    const { id } = param;
    return this.permissionsService.update(+id, updatePermissionDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param() param: GetPermissionIdDto) {
    const { id } = param;
    return this.permissionsService.remove(+id);
  }
}
