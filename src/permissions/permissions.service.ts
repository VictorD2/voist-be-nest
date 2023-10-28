import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { PrismaService } from 'src/prisma.service';
import { Permission } from '@prisma/client';

type PermissionType = Permission & { sons?: Permission[] };
const INITIAL_CODE_LENGTH = 3;

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  async create(createPermissionDto: CreatePermissionDto) {
    try {
      return await this.prisma.permission.create({
        data: createPermissionDto,
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Ya existe un permiso con ese código');
      }
      throw new InternalServerErrorException('Error interno del servidor');
    }
  }

  async findAll() {
    const permissions = await this.prisma.permission.findMany();
    const tree = this.buildTree(permissions, INITIAL_CODE_LENGTH);
    return tree;
  }

  async findOne(id: number) {
    return await this.prisma.permission.findUnique({
      where: { id },
    });
  }

  async update(id: number, updatePermissionDto: UpdatePermissionDto) {
    try {
      return await this.prisma.permission.update({
        where: { id },
        data: updatePermissionDto,
      });
    } catch (error) {
      if (error.code === 'P2002')
        throw new ConflictException('Ya existe un permiso con ese código');
      throw new InternalServerErrorException('Error interno del servidor');
    }
  }

  async remove(id: number) {
    try {
      return await this.prisma.permission.delete({ where: { id } });
    } catch (error) {
      if (error.code === 'P2003') {
        throw new ConflictException(
          'Hay llaves foraneas relacionadas a este recurso',
        );
      }
      throw new InternalServerErrorException('Error interno del servidor');
    }
  }

  private buildTree(
    permissions: PermissionType[],
    codeLength: number,
  ): PermissionType[] {
    const newPermissions = permissions
      .map((item) => {
        return {
          ...item,
          sons: permissions.filter(
            (item2) =>
              item2.code.startsWith(item.code) && item2.code !== item.code,
          ),
        };
      })
      .filter((item) => item.code.length === codeLength)
      .map((item) => {
        return { ...item, sons: this.buildTree(item.sons, codeLength + 3) };
      });

    return newPermissions;
  }
}
