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
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMemoryService } from './chat-memory.service';
import { CognitoUniversalGuard } from '../auth/cognito-universal.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserContext } from '../common/interfaces/user-context.interface';
import { CorporateAccount } from '@originbi/shared-entities';

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

  private async ensureCorporateRagChatEnabled(user: UserContext): Promise<void> {
    const role = (user?.role || '').toUpperCase();
    if (role !== 'CORPORATE') {
      return;
    }

    if (!user?.corporateId) {
      throw new HttpException(
        'Corporate account context missing',
        HttpStatus.FORBIDDEN,
      );
    }

    const corporate = await this.corporateRepo.findOne({
      where: { id: user.corporateId },
    });

    if (!corporate || !corporate.askBiEnabled) {
      throw new HttpException(
        'Ask BI is disabled for this corporate account',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private async ensurePersistentChatUser(user: UserContext): Promise<void> {
    if (!user?.id || user.id <= 0) {
      throw new HttpException('Authentication required for chat history', HttpStatus.UNAUTHORIZED);
    }
    await this.ensureCorporateRagChatEnabled(user);
  }

  constructor(
    private readonly chatMemory: ChatMemoryService,
    @InjectRepository(CorporateAccount)
    private readonly corporateRepo: Repository<CorporateAccount>,
  ) {}

  /* ── List conversations ── */
  @Get('conversations')
  async listConversations(@CurrentUser() user: UserContext) {
    await this.ensurePersistentChatUser(user);
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
    await this.ensurePersistentChatUser(user);
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
    await this.ensurePersistentChatUser(user);
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
    await this.ensurePersistentChatUser(user);
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
    await this.ensurePersistentChatUser(user);
    const ok = await this.chatMemory.deleteConversation(id, user.id);
    if (!ok) throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    return { success: true };
  }
}
