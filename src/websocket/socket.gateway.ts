import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { PrismaService } from 'src/prisma.service';
import { format } from 'date-fns';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class SocketGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  clients: any[];

  constructor(private prisma: PrismaService) {
    this.clients = [];
  }

  handleConnection(client: Socket) {
    // Este método se llama cuando un cliente se conecta al WebSocket.
    const user = this.clients.find(
      (item) => item.id === client.handshake.auth.user.id,
    );
    if (user) return;
    this.clients.push({
      id: client.handshake.auth.user.id,
      startTime: new Date(),
    });
    console.log(`Cliente conectado: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    // Este método se llama cuando un cliente se desconecta del WebSocket.
    try {
      const user = this.clients.find(
        (item) => item.id === client.handshake.auth.user.id,
      );

      const desconnectedDate = new Date();
      const connectedDate: Date = user.startTime;

      const millisecondsStart = connectedDate.getTime();
      const millisecondsEnd = desconnectedDate.getTime();

      const differenceInMilliseconds = millisecondsEnd - millisecondsStart;

      const differenceInMinutes = differenceInMilliseconds / (1000 * 60);

      const loggedTime = await this.prisma.loggedTime.findFirst({
        where: {
          userId: user.id,
          createdAt: new Date(format(new Date(), 'yyyy-MM-dd')),
        },
      });

      if (loggedTime) {
        await this.prisma.loggedTime.update({
          where: {
            id: loggedTime.id,
          },
          data: {
            minutes: loggedTime.minutes.toNumber() + differenceInMinutes,
          },
        });
      } else {
        await this.prisma.loggedTime.create({
          data: {
            minutes: differenceInMinutes,
            createdAt: new Date(format(new Date(), 'yyyy-MM-dd')),
            userId: user.id,
          },
        });
      }

      this.clients = this.clients.filter(
        (item) => item.id !== client.handshake.auth.user.id,
      );
      console.log(`Cliente desconectado: ${client.id}`);
    } catch (error: any) {
      console.log(error);
    }
  }
}
