import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Logger,
  HttpException,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { IsString, IsOptional, IsNotEmpty, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ChatMemoryService } from './chat-memory.service';
import { CognitoUniversalGuard } from '../auth/cognito-universal.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserContext } from '../common/interfaces/user-context.interface';

/* ────────── DTOs ────────── */
export class CreateConversationDto {
  @IsOptional()
  @IsString()
  title?: string;
}

export class RenameConversationDto {
  @IsString()
  @IsNotEmpty()
  title: string;
}

/* ════════════════════════════════════════════════════════════════
   /rag/chat  — Persistent chat history (ChatGPT-style)
   ════════════════════════════════════════════════════════════════ */
@Controller('rag/chat')
@UseGuards(CognitoUniversalGuard)
export class ChatController {
  private readonly logger = new Logger('ChatController');

  constructor(private readonly chatMemory: ChatMemoryService) {}

  /* ── List conversations ── */
  @Get('conversations')
  async listConversations(@CurrentUser() user: UserContext) {
    this.logger.log(`📋 List conversations | user=${user.id} role=${user.role}`);
    const conversations = await this.chatMemory.listConversations(user.id);
    return { conversations };
  }

  /* ── Create conversation ── */
  @Post('conversations')
  async createConversation(
    @CurrentUser() user: UserContext,
    @Body() dto: CreateConversationDto,
  ) {
    this.logger.log(`➕ Create conversation | user=${user.id}`);
    const conversation = await this.chatMemory.createConversation(
      user.id,
      user.role,
      dto.title || 'New Chat',
    );
    return { conversation };
  }

  /* ── Get messages for a conversation ── */
  @Get('conversations/:id/messages')
  async getMessages(
    @CurrentUser() user: UserContext,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const messages = await this.chatMemory.getMessages(id, user.id);
    return { messages };
  }

  /* ── Rename a conversation ── */
  @Patch('conversations/:id')
  async renameConversation(
    @CurrentUser() user: UserContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RenameConversationDto,
  ) {
    const ok = await this.chatMemory.renameConversation(id, user.id, dto.title);
    if (!ok) throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    return { success: true };
  }

  /* ── Delete a conversation ── */
  @Delete('conversations/:id')
  async deleteConversation(
    @CurrentUser() user: UserContext,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const ok = await this.chatMemory.deleteConversation(id, user.id);
    if (!ok) throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    return { success: true };
  }
}
