import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
  Query,
  Request,
} from '@nestjs/common';
import { FoldersService } from './folders.service';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { RolesGuard } from 'src/roles/roles.guard';
import { GetFolderByIdDto, GetFolderDto } from './dto/get-folder.dto';

@Controller('api/v0/folders')
@UseGuards(AuthGuard)
export class FoldersController {
  constructor(private readonly foldersService: FoldersService) {}

  @UseGuards(RolesGuard)
  @HttpCode(HttpStatus.CREATED)
  @Post()
  create(@Body() createFolderDto: CreateFolderDto, @Request() req) {
    const { id } = req.user;
    return this.foldersService.create(createFolderDto, id);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: GetFolderDto, @Request() req) {
    const { id } = req.user;
    const folders = await this.foldersService.findAll(query, id);
    const routes = await this.foldersService.getFolderRoute(id, query.folder);
    return { folders, routes };
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  findOne(@Param() folder: GetFolderByIdDto, @Request() req) {
    const { id } = req.user;
    const { id: folderId } = folder;
    return this.foldersService.findOne(folderId, id);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(
    @Param() folder: GetFolderByIdDto,
    @Body() updateFolderDto: UpdateFolderDto,
    @Request() req,
  ) {
    const { id: userId } = req.user;
    return this.foldersService.update(folder.id, updateFolderDto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param() folder: GetFolderByIdDto, @Request() req) {
    const { id: userId } = req.user;
    return this.foldersService.remove(folder.id, userId);
  }
}
