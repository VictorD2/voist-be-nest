import { Injectable } from '@nestjs/common';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { PrismaService } from 'src/prisma.service';
import { GetFolderDto } from './dto/get-folder.dto';

@Injectable()
export class FoldersService {
  constructor(private prisma: PrismaService) {}

  async create(createFolderDto: CreateFolderDto, userId: number) {
    const { contacts, ...rest } = createFolderDto;
    const folder = await this.prisma.folder.create({
      data: {
        ...rest,
        folderId:
          createFolderDto.folderId === 0 ? null : createFolderDto.folderId,
        userId,
      },
    });

    for (let i = 0; i < contacts.length; i++) {
      const element = contacts[i];
      await this.prisma.userFolder.create({
        data: { folderId: folder.id, userId: element },
      });
    }

    const folder_found = await this.findOne(folder.id, userId);

    return folder_found;
  }

  async findAll(query: GetFolderDto, userId: number) {
    const { folder } = query;
    const folders = await this.prisma.folder.findMany({
      where: {
        userId,
        folderId: Number(folder) === 0 ? null : Number(folder),
      },
      include: {
        contacts: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                lastname: true,
                email: true,
              },
            },
          },
        },
      },
    });
    return folders.map((item) => {
      return {
        ...item,
        folderId: item.folderId === null ? 0 : item.folderId,
        contacts: item.contacts.map((item2) => item2.user),
      };
    });
  }

  async getFolderRoute(userId, folderId) {
    const routes = [];
    if (Number(folderId) === 0) return routes;
    let folder = await this.prisma.folder.findUnique({
      where: {
        id: Number(folderId),
        userId,
      },
    });
    routes.push({ link: Number(folder.id), name: folder.name });

    while (folder.folderId !== null) {
      folder = await this.prisma.folder.findUnique({
        where: {
          id: Number(folder.folderId),
          userId,
        },
      });
      routes.push({ link: Number(folder.id), name: folder.name });
    }
    return routes.reverse();
  }

  async findOne(id: number, userId: number) {
    const folder = await this.prisma.folder.findUnique({
      where: { id: Number(id), userId: Number(userId) },
      include: {
        contacts: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                lastname: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!folder) return null;
    folder.folderId = folder.folderId === null ? 0 : folder.folderId;
    return { ...folder, contacts: folder.contacts.map((item) => item.user) };
  }

  async update(id: number, updateFolderDto: UpdateFolderDto, userId: number) {
    const { contacts, folderId, ...rest } = updateFolderDto;
    await this.prisma.folder.update({
      data: rest,
      where: { id: Number(id), userId: Number(userId) },
    });

    await this.prisma.userFolder.deleteMany({
      where: { folderId: Number(id) },
    });

    for (let i = 0; i < contacts.length; i++) {
      const element = contacts[i];
      await this.prisma.userFolder.create({
        data: { folderId: Number(id), userId: element },
      });
    }

    return await this.findOne(id, userId);
  }

  async remove(id: number, userId: number) {
    await this.prisma.folder.delete({
      where: { id: Number(id), userId: Number(userId) },
    });
    return id;
  }
}
