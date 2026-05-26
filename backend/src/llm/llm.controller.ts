import { Controller, Post, Get, Body, Param, UseGuards, Req, HttpCode } from '@nestjs/common';
import { LlmService } from './llm.service';
import { AuthGuard } from '../auth/auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@Controller('chat')
@UseGuards(AuthGuard)
export class LlmController {
  constructor(
    private readonly llmService: LlmService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * POST /chat
   * Main chat endpoint. Accepts a user message and optional session/agent context.
   * Returns a structured AI response with tool usage metadata.
   */
  @Post()
  @HttpCode(200)
  async chat(
    @Req() req: any,
    @Body('message') message: string,
    @Body('sessionId') sessionId?: string,
    @Body('agentId') agentId?: string,
  ) {
    const userId = req.user.id;
    return this.llmService.chat(userId, message, sessionId, agentId);
  }

  /**
   * GET /chat/sessions
   * Lists all chat sessions for the authenticated user.
   */
  @Get('sessions')
  async listSessions(@Req() req: any) {
    const userId = req.user.id;
    return this.prisma.chatSession.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { messages: true } } },
    });
  }

  /**
   * GET /chat/sessions/:sessionId/messages
   * Returns the full message history for a specific session.
   */
  @Get('sessions/:sessionId/messages')
  async getMessages(@Req() req: any, @Param('sessionId') sessionId: string) {
    const userId = req.user.id;
    return this.prisma.chatMessage.findMany({
      where: { session: { id: sessionId, userId } },
      orderBy: { createdAt: 'asc' },
    });
  }
}
