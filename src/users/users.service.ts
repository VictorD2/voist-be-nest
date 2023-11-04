import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { GetUserDto } from './dto/get-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(getUserDto: GetUserDto) {
    const { filter, limit, page } = getUserDto;
    const quantity = await this.prisma.user.count({
      where: {
        OR: [
          {
            name: {
              contains: `%${filter}%`,
            },
          },
          {
            lastname: {
              contains: `%${filter}%`,
            },
          },
          {
            email: {
              contains: `%${filter}%`,
            },
          },
        ],
        AND: [
          {
            roleId: 1,
          },
        ],
      },
    });
    const users = await this.prisma.user.findMany({
      where: {
        OR: [
          {
            name: {
              contains: `%${filter}%`,
            },
          },
          {
            lastname: {
              contains: `%${filter}%`,
            },
          },
          {
            email: {
              contains: `%${filter}%`,
            },
          },
        ],
        AND: [
          {
            roleId: 1,
          },
        ],
      },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
    });
    return { users, quantity };
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
        roleId: 1,
      },
    });
    return user;
  }

  async findTimeByUserId(id: number) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const loggedTimesLast7Days = await this.prisma.loggedTime.findMany({
      where: {
        createdAt: {
          gte: sevenDaysAgo,
        },
        userId: id, // Filtrar por el ID del usuario específico
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
    return loggedTimesLast7Days;
  }

  async getCount() {
    return await this.prisma.user.count({
      where: {
        roleId: 1,
      },
    });
  }

  async getCountBetween(startDate: Date, endDate: Date) {
    return await this.prisma.user.count({
      where: {
        roleId: 1,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
  }
}
