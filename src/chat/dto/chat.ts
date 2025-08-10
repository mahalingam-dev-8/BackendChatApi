import { IsNotEmpty, IsString } from 'class-validator';

export class ChatDto {
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @IsNotEmpty()
  @IsString()
  message: string;
}
