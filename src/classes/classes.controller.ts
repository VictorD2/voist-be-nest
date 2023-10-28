/* eslint-disable @typescript-eslint/ban-ts-comment */
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Request,
  NotFoundException,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { ClassesService } from './classes.service';
import { CreateClassDto, CreateResumenDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from 'src/auth/auth.guard';
import { GetClassByIdDto, GetClassDto } from './dto/get-class.dto';

@Controller('api/v0/classes')
@UseGuards(AuthGuard)
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}
  @HttpCode(HttpStatus.CREATED)
  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async create(
    @Body() createClassDto: CreateClassDto,
    @Request() req,
    @UploadedFile() file,
  ) {
    const audioBuffer = file.buffer;
    const { id } = req.user;
    const file_obj = await this.classesService.create(createClassDto, +id);
    await this.classesService.saveAudio(audioBuffer, file_obj.id);
    const file_found = await this.classesService.findOne(file_obj.id, +id);
    return file_found;
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('/resume')
  async createResumen(
    @Body() createResumenDto: CreateResumenDto,
    @Request() req,
  ) {
    const urlPdf = await this.classesService.createAndUploadPdfResumen(
      createResumenDto.content,
      +createResumenDto.classId,
    );
    await this.classesService.createResumen(urlPdf, createResumenDto.classId);
    return urlPdf;
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(@Query() query: GetClassDto, @Request() req) {
    const { id } = req.user;
    const classes = await this.classesService.findAll(query, id);
    return classes;
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param() param: GetClassByIdDto, @Request() req) {
    const { id } = req.user;

    const classe = await this.classesService.findOne(param.id, +id);
    if (classe === null) throw new NotFoundException('Clase no encontrada');
    return classe;
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  update(
    @Param() param: GetClassByIdDto,
    @Body() updateClassDto: UpdateClassDto,
    @Request() req,
  ) {
    const { id } = req.user;

    return this.classesService.update(param.id, updateClassDto, +id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param() param: GetClassByIdDto, @Request() req) {
    const { id } = req.user;
    return this.classesService.remove(param.id, +id);
  }
}
