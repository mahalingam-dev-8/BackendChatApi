import { Injectable, InternalServerErrorException } from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaService } from 'src/prisma/prisma.service';


export enum Role {
  User = 'user',
  Assistant = 'assistant',
  System = 'system',
}


@Injectable()
export class ChatService {
   private openai: OpenAI;

  constructor(private prisma: PrismaService) {
    this.openai = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1',
    });
  }

  async handleMessage(sessionId: string, message: string): Promise<string> {
    try {
      // Save user message
      await this.prisma.message.create({
        data: { sessionId, content: message, role: Role.User },
      });

      // Get the last 5 messages (already in correct order)
      const recentMessages = await this.prisma.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      });

      const contextMessages = recentMessages.reverse().map((msg) => ({
      role: msg.role as 'user' | 'assistant' | 'system',
      content: msg.content,
      }));

      const completion = await this.openai.chat.completions.create({
        model: process.env.GROQ_MODEL || 'llama3-70b-8192',
        messages: contextMessages,
      });

      const aiReply = completion.choices[0]?.message?.content ?? '';

      
      await this.prisma.message.create({
        data: { sessionId, content: aiReply, role: Role.Assistant },
      });

      return aiReply;
    }
    catch (error) {
      console.error('Error in handleMessage:', error);
      throw new InternalServerErrorException('Failed to process message');
    }
  }
}
