import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateContactDto } from './dto/create-contact.dto';
import { UpdateContactDto } from './dto/update-contact.dto';
import { PrismaService } from 'src/prisma.service';

@Injectable()
export class ContactsService {
  constructor(private prisma: PrismaService) {}

  async create(createContactDto: CreateContactDto, userId: number) {
    if (await this.isAlreadyAdded(+userId, +createContactDto.userId)) {
      throw new BadRequestException('Ya está agregado');
    }
    const contact = await this.prisma.contact.create({
      data: { contactId: +createContactDto.userId, userId: +userId },
    });

    return this.findOne(contact.contactId);
  }

  async findAllContacts(filter: string) {
    const contacts = await this.prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: filter } },
          { lastname: { contains: filter } },
          { email: { contains: filter } },
        ],
      },
      select: {
        id: true,
        email: true,
        lastname: true,
        name: true,
      },
    });
    return contacts;
  }

  async findAll(userId: number) {
    const contactIds = await this.prisma.contact.findMany({
      where: { userId: +userId },
      select: {
        contactId: true,
      },
    });

    return await this.prisma.user.findMany({
      where: {
        id: {
          in: contactIds.map((item) => item.contactId),
        },
      },
      select: {
        name: true,
        lastname: true,
        email: true,
        id: true,
      },
    });
  }

  async isAlreadyAdded(userId: number, contactId: number) {
    const contact = await this.prisma.contact.findFirst({
      where: {
        contactId: +contactId,
        userId: +userId,
      },
    });
    if (contact) return true;
    return false;
  }

  async findOne(id: number) {
    const contact = await this.prisma.user.findUnique({
      where: { id: +id },
      select: {
        email: true,
        name: true,
        lastname: true,
        id: true,
      },
    });
    if (!contact) return null;
    return contact;
  }

  async remove(id: number, userId: number) {
    await this.prisma.contact.deleteMany({
      where: {
        contactId: +id,
        userId: +userId,
      },
    });
  }
}
