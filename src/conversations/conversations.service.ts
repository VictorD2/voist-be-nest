import { Injectable } from '@nestjs/common';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { PrismaService } from 'src/prisma.service';
import { HttpService } from '@nestjs/axios/dist';
import { catchError, firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';

@Injectable()
export class ConversationsService {
  constructor(
    private prisma: PrismaService,
    private readonly httpService: HttpService,
  ) {}

  async create(createConversationDto: CreateConversationDto, userId: number) {
    const { classId } = createConversationDto;
    // const conversation = await this.prisma.conversation.create({
    //   data:{}
    // })
    const classe = await this.prisma.class.findUnique({
      where: {
        id: +classId,
      },
    });

    const conversation = await this.prisma.conversation.create({
      data: { ...createConversationDto, userId: +userId, classId: +classId },
    });

    return conversation;
  }

  async findAll(classId: number, userId: number) {
    const conversations = await this.prisma.conversation.findMany({
      where: {
        userId: +userId,
        classId: +classId,
      },
    });
    return conversations;
  }
}
