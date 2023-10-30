import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ClassesModule } from './classes/classes.module';
import { FoldersModule } from './folders/folders.module';
import { ConversationsModule } from './conversations/conversations.module';
import { UsersModule } from './users/users.module';
import { ContactsModule } from './contacts/contacts.module';
import { WebsocketModule } from './websocket/websocket.module';

@Module({
  imports: [
    AuthModule,
    ClassesModule,
    FoldersModule,
    ConversationsModule,
    UsersModule,
    ContactsModule,
    WebsocketModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
