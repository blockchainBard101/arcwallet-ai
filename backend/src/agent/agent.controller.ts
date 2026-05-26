import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { AgentService } from './agent.service';
import { AuthGuard } from '../auth/auth.guard';

@Controller('agents')
@UseGuards(AuthGuard)
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Post()
  async create(
    @Req() req: any,
    @Body('name') name: string,
    @Body('configuration') configuration?: any,
  ) {
    const userId = req.user.id;
    return this.agentService.createAgent(userId, name, configuration);
  }

  @Get()
  async findAll(@Req() req: any) {
    const userId = req.user.id;
    return this.agentService.listAgents(userId);
  }

  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    const userId = req.user.id;
    return this.agentService.getAgent(userId, id);
  }
}
