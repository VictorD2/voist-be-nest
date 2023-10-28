import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { ConversationsService } from './conversations.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { GetConversationsByClassIdDto } from './dto/get-conversation.dto';

@Controller('api/v0/conversations')
@UseGuards(AuthGuard)
export class ConversationsController {
  constructor(private readonly conversationsService: ConversationsService) {}

  @Post()
  create(@Body() createConversationDto: CreateConversationDto, @Request() req) {
    const { id } = req.user;

    return this.conversationsService.create(createConversationDto, +id);
  }

  @Get()
  findAll(@Query() query: GetConversationsByClassIdDto, @Request() req) {
    const { classId } = query;
    const { id } = req.user;

    return this.conversationsService.findAll(+classId, +id);
  }
}
