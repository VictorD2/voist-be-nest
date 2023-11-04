import {
  Controller,
  Get,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  Query,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from 'src/auth/auth.guard';
import { GetUserByIdDto, GetUserDto } from './dto/get-user.dto';
import { format } from 'date-fns';

@Controller('api/v0/users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  findAll(@Query() query: GetUserDto) {
    return this.usersService.findAll(query);
  }

  @Get('/count')
  @HttpCode(HttpStatus.OK)
  async getCount() {
    const count = await this.usersService.getCount();
    return Number(count);
  }

  @Get('/count/news')
  @HttpCode(HttpStatus.OK)
  async getCountNews() {
    const hoy = new Date();

    const primerDiaSemana = new Date(hoy);

    const ultimoDiaSemana = new Date(hoy);

    const diaSemana = hoy.getDay();

    primerDiaSemana.setDate(hoy.getDate() - diaSemana);
    ultimoDiaSemana.setDate(hoy.getDate() + (6 - diaSemana));
    const count = await this.usersService.getCountBetween(
      new Date(format(primerDiaSemana, 'MM/dd/yyyy')),
      new Date(format(ultimoDiaSemana, 'MM/dd/yyyy')),
    );
    return count;
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param() params: GetUserByIdDto) {
    const user = await this.usersService.findOne(+params.id);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    return user;
  }

  @Get(':id/time')
  @HttpCode(HttpStatus.OK)
  async findTimeByUserId(@Param() params: GetUserByIdDto) {
    const user = await this.usersService.findOne(+params.id);
    if (!user) throw new NotFoundException('Usuario no encontrado');
    const loggedTime = await this.usersService.findTimeByUserId(+params.id);
    return loggedTime.map((item) => {
      return { day: item.createdAt, minutes: Number(item.minutes) };
    });
  }
}
