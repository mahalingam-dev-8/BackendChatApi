import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { PrismaService } from 'src/prisma/prisma.service';

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
    await this.prisma.message.create({
      data: { sessionId, content: message, role: 'user' },
    });

    const recentMessages = await this.prisma.message.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const contextMessages = recentMessages
      .reverse()
      .map((msg) => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
      }));

   
    const completion = await this.openai.chat.completions.create({
      model: 'llama3-70b-8192', 
      messages: contextMessages,
    });

    const aiReply = completion.choices[0].message.content || '';

    await this.prisma.message.create({
      data: { sessionId, content: aiReply, role: 'assistant' },
    });

    return aiReply;
  }
}
