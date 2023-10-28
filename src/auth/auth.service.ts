/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { LoginDto } from './dto/login.dto';
import { BcriptService } from 'src/bcript/bcript.service';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private bcript: BcriptService,
    private jwtService: JwtService,
  ) {}

  /**
   *
   * @param {LoginDto} dtoLogin
   * @returns
   */
  async signin(dtoLogin: LoginDto) {
    const { email } = dtoLogin;

    // Query
    const user = await this.prisma.user.findFirst({
      where: {
        email,
      },
      select: {
        id: true,
        email: true,
        name: true,
        roleId: true,
        state: true,
        password: true,
        lastname: true,
        role: {
          select: {
            id: true,
            name: true,
            RolePermission: {
              select: {
                permission: {
                  select: {
                    code: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // If not exits
    if (!user) throw new UnauthorizedException();

    // If is banned
    if (!user.state) throw new UnauthorizedException('Deshabilitado');

    // If password match
    const isEqual = await this.bcript.compare(dtoLogin.password, user.password);
    if (!isEqual)
      throw new UnauthorizedException('Contraseña o Email incorrectos');

    // Destructuring
    const {
      password,
      role: { RolePermission, ...roleRest },
      ...rest
    } = user;

    // Creating an array of permissions <string>
    const permissions = user.role.RolePermission.map(
      ({ permission: { code } }) => code,
    );

    // Creating a new object
    const newUser = {
      ...rest,
      role: {
        ...roleRest,
        permissions,
      },
    };

    // Generating and return a token and user
    return {
      token: await this.jwtService.signAsync(newUser, {
        secret: process.env.JWT_SECRET,
      }),
      user: newUser,
    };
  }

  /**
   * @param {RegisterDto} dtoRegister
   * @returns
   */
  async signup(dtoRegister: RegisterDto) {
    // Query
    const encryptPassword = await this.bcript.encrypt(dtoRegister.password);
    try {
      const user = await this.prisma.user.create({
        data: { ...dtoRegister, password: encryptPassword, roleId: 1 },
        select: {
          id: true,
          email: true,
          name: true,
          roleId: true,
          state: true,
          password: true,
          lastname: true,
          role: {
            select: {
              id: true,
              name: true,
              RolePermission: {
                select: {
                  permission: {
                    select: {
                      code: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
      const {
        password,
        role: { RolePermission, ...roleRest },
        ...rest
      } = user;

      // Creating an array of permissions <string>
      const permissions = user.role.RolePermission.map(
        ({ permission: { code } }) => code,
      );

      // Creating a new object
      const newUser = {
        ...rest,
        role: {
          ...roleRest,
          permissions,
        },
      };

      // Generating and return a token and user
      return {
        token: await this.jwtService.signAsync(newUser, {
          secret: process.env.JWT_SECRET,
        }),
        user: newUser,
      };
    } catch (error) {
      if (error.code === 'P2002')
        throw new BadRequestException('Ese correo ya está registrado');

      throw new InternalServerErrorException('Ocurrió un error inesperado');
    }
  }
}
