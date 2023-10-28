import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Request,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ContactsService } from './contacts.service';
import { CreateContactDto } from './dto/create-contact.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { GetContactByIdDto, GetContactDto } from './dto/get-contact.dto';

@Controller('api/v0/contacts')
@UseGuards(AuthGuard)
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Post()
  create(@Body() createContactDto: CreateContactDto, @Request() req) {
    return this.contactsService.create(createContactDto, +req.user.id);
  }

  @Get()
  findMyContacts(@Request() req) {
    const { id } = req.user;
    return this.contactsService.findAll(+id);
  }

  @Get('/all')
  async findAllContacts(@Query() query: GetContactDto, @Request() req) {
    const contacts = await this.contactsService.findAllContacts(query.filter);
    return contacts.filter((item) => item.id !== +req.user.id);
  }

  @Delete(':id')
  remove(@Param() contact: GetContactByIdDto, @Request() req) {
    const { id } = req.user;

    this.contactsService.remove(+contact.id, +id);
    return +contact.id;
  }
}
