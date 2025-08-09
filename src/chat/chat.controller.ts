import { Body, Controller, Post } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatDto } from './dto/chat';

@Controller('chat')
export class ChatController {

     constructor(private chatService: ChatService) {}

  @Post()
  async chat(@Body() body: ChatDto ) {
    const response = await this.chatService.handleMessage(body.sessionId, body.message);
    return { sessionId: body.sessionId, response };
  }
}
