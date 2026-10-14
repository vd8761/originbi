import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  BadRequestException,
  Res,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { IntegrationsService } from './integrations.service';

@Controller('corporate/integrations')
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get()
  async getMyIntegrations(@Query('email') email: string) {
    if (!email) throw new BadRequestException('Email is required');
    return this.integrationsService.getMyIntegrations(email);
  }

  // ─── OAuth: Start Google Authorization ───
  @Get('oauth/google/start')
  startGoogleOAuth(
    @Query('email') email: string,
    @Query('appId') appId: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    if (!email || !appId)
      throw new BadRequestException('Email and appId are required');
    const state = Buffer.from(JSON.stringify({ email, appId })).toString(
      'base64url',
    );
    // We import passport directly to use its authenticate method for dynamic state
    const passport = require('passport');
    const authMiddleware = passport.authenticate('google', {
      state,
      accessType: 'offline',
      prompt: 'consent',
    });
    authMiddleware(req, res, (err: any) => {
      if (err) throw err;
    });
  }

  // ─── OAuth: Google Callback ───
  @Get('oauth/google/callback')
  @UseGuards(AuthGuard('google'))
  async handleGoogleCallback(@Req() req: any, @Res() res: Response) {
    try {
      // req.user contains the profile and tokens extracted by GoogleStrategy
      // req.oauthState contains the state we passed (tenant email and appId)

      const result =
        await this.integrationsService.handleGoogleCallbackPassport(
          req.user,
          req.oauthState, // or req.query.state
        );
      // Close the popup and notify the parent window
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>Connecting...</title></head>
        <body>
        <script>
          if (window.opener) {
            window.opener.postMessage(
              { type: 'OAUTH_SUCCESS', provider: 'google', connectedAccount: '${result.connectedAccount}' },
              '${process.env.FRONTEND_URL || 'http://localhost:3000'}'
            );
          }
          window.close();
        </script>
        <p>Authorization successful! You can close this window.</p>
        </body>
        </html>
      `);
    } catch (err: any) {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <body>
        <script>
          if (window.opener) {
            window.opener.postMessage(
              { type: 'OAUTH_ERROR', error: '${err.message}' },
              '${process.env.FRONTEND_URL || 'http://localhost:3000'}'
            );
          }
          window.close();
        </script>
        <p>Authorization failed: ${err.message}</p>
        </body>
        </html>
      `);
    }
  }

  @Get('google/files')
  async listGoogleDriveFiles(
    @Query('email') email: string,
    @Query('search') search?: string,
  ) {
    if (!email) throw new BadRequestException('Email is required');
    return this.integrationsService.listGoogleDriveFiles(email, search);
  }

  @Post('google/sync-folder')
  async saveSyncFolder(
    @Query('email') email: string,
    @Body() body: { folderId: string; folderName: string },
  ) {
    if (!email) throw new BadRequestException('Email is required');
    if (!body.folderId) throw new BadRequestException('Folder ID is required');
    return this.integrationsService.saveSyncFolder(
      email,
      body.folderId,
      body.folderName,
    );
  }

  @Get('google/folder-context')
  async getFolderContext(@Query('email') email: string) {
    if (!email) throw new BadRequestException('Email is required');
    return this.integrationsService.getFolderContext(email);
  }

  @Get('google/file-content')
  async getGoogleDriveFileContent(
    @Query('email') email: string,
    @Query('fileId') fileId: string,
  ) {
    if (!email) throw new BadRequestException('Email is required');
    if (!fileId) throw new BadRequestException('File ID is required');
    return this.integrationsService.getGoogleDriveFileContent(email, fileId);
  }

  // ─── OAuth: Start ClickUp Authorization ───
  @Get('oauth/clickup/start')
  startClickUpOAuth(
    @Query('email') email: string,
    @Query('appId') appId: string,
    @Res() res: Response,
  ) {
    if (!email || !appId)
      throw new BadRequestException('Email and appId are required');
    const url = this.integrationsService.generateClickUpOAuthUrl(email, appId);
    return res.redirect(url);
  }

  // ─── OAuth: ClickUp Callback ───
  @Get('oauth/clickup/callback')
  async handleClickUpCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    try {
      const result = await this.integrationsService.handleClickUpCallback(
        code,
        state,
      );
      return res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>ClickUp Connected</title></head>
        <body>
        <script>
          if (window.opener) {
            window.opener.postMessage(
              { type: 'OAUTH_SUCCESS', provider: 'clickup', connectedAccount: '${result.connectedAccount}' },
              '${process.env.FRONTEND_URL || 'http://localhost:3000'}'
            );
          }
          window.close();
        </script>
        <p>ClickUp authorization successful! You can close this window.</p>
        </body>
        </html>
      `);
    } catch (err: any) {
      return res.send(`
        <!DOCTYPE html>
        <html>
        <body>
        <script>
          if (window.opener) {
            window.opener.postMessage(
              { type: 'OAUTH_ERROR', error: '${err.message}' },
              '${process.env.FRONTEND_URL || 'http://localhost:3000'}'
            );
          }
          window.close();
        </script>
        <p>ClickUp authorization failed: ${err.message}</p>
        </body>
        </html>
      `);
    }
  }

  // ─── ClickUp API routes ───
  @Get('clickup/workspaces')
  async getClickUpWorkspaces(@Query('email') email: string) {
    if (!email) throw new BadRequestException('Email is required');
    return this.integrationsService.getClickUpWorkspaces(email);
  }

  @Get('clickup/spaces')
  async getClickUpSpaces(
    @Query('email') email: string,
    @Query('teamId') teamId: string,
  ) {
    if (!email) throw new BadRequestException('Email is required');
    if (
      !teamId ||
      typeof teamId !== 'string' ||
      !/^[a-zA-Z0-9_-]+$/.test(teamId.trim())
    ) {
      throw new BadRequestException(
        'Valid teamId is required (must be alphanumeric)',
      );
    }
    return this.integrationsService.getClickUpSpaces(email, teamId.trim());
  }

  @Get('clickup/lists')
  async getClickUpLists(
    @Query('email') email: string,
    @Query('spaceId') spaceId: string,
  ) {
    if (!email) throw new BadRequestException('Email is required');
    if (
      !spaceId ||
      typeof spaceId !== 'string' ||
      !/^[a-zA-Z0-9_-]+$/.test(spaceId.trim())
    ) {
      throw new BadRequestException(
        'Valid spaceId is required (must be alphanumeric)',
      );
    }
    return this.integrationsService.getClickUpLists(email, spaceId.trim());
  }

  @Post('clickup/sync-list')
  async saveClickUpSyncList(
    @Query('email') email: string,
    @Body() body: { listId: string; listName: string; spaceName?: string },
  ) {
    if (!email) throw new BadRequestException('Email is required');
    if (
      !body?.listId ||
      typeof body.listId !== 'string' ||
      !/^[a-zA-Z0-9_-]+$/.test(body.listId.trim())
    ) {
      throw new BadRequestException(
        'Valid listId is required (must be alphanumeric)',
      );
    }
    return this.integrationsService.saveClickUpSyncList(
      email,
      body.listId.trim(),
      body.listName,
      body.spaceName,
    );
  }

  @Post('clickup/test-task')
  async createClickUpTestTask(
    @Query('email') email: string,
    @Body() body?: { listId?: string },
  ) {
    if (!email) throw new BadRequestException('Email is required');
    if (
      body?.listId &&
      (typeof body.listId !== 'string' ||
        !/^[a-zA-Z0-9_-]+$/.test(body.listId.trim()))
    ) {
      throw new BadRequestException(
        'Valid listId is required (must be alphanumeric)',
      );
    }
    return this.integrationsService.createClickUpTask(email, {
      name: `OriginBI Test Task - Connected Successfully (${new Date().toLocaleTimeString()})`,
      description:
        'This test task was created by OriginBI to verify that your ClickUp integration is working smoothly.\n\nStatus: Connected\nIntegration: OriginBI Candidate Sync',
      listId: body?.listId ? body.listId.trim() : undefined,
    });
  }

  @Post('clickup/sync')
  async syncClickUp(@Query('email') email: string) {
    if (!email) throw new BadRequestException('Email is required');
    return this.integrationsService.syncClickUpData(email);
  }

  @Post('zenro/sync')
  async syncZenro(@Query('email') email: string) {
    if (!email) throw new BadRequestException('Email is required');
    return this.integrationsService.syncZenroData(email);
  }

  @Get('clickup/context')
  async getClickUpContext(@Query('email') email: string) {
    if (!email) throw new BadRequestException('Email is required');
    return this.integrationsService.getClickUpContext(email);
  }

  @Post('clickup/tasks')
  async createClickUpTask(
    @Query('email') email: string,
    @Body()
    body: {
      name: string;
      description?: string;
      listId?: string;
      priority?: number;
      dueDate?: number;
    },
  ) {
    if (!email) throw new BadRequestException('Email is required');
    if (!body.name) throw new BadRequestException('Task name is required');
    if (
      body.listId &&
      (typeof body.listId !== 'string' ||
        !/^[a-zA-Z0-9_-]+$/.test(body.listId.trim()))
    ) {
      throw new BadRequestException(
        'Valid listId is required (must be alphanumeric)',
      );
    }
    return this.integrationsService.createClickUpTask(email, {
      ...body,
      listId: body.listId ? body.listId.trim() : undefined,
    });
  }

  @Put(':appId')
  async updateIntegration(
    @Query('email') email: string,
    @Param('appId') appId: string,
    @Body() payload: any,
  ) {
    if (!email) throw new BadRequestException('Email is required');
    return this.integrationsService.updateIntegration(email, appId, payload);
  }

  @Delete(':appId')
  async disconnectIntegration(
    @Query('email') email: string,
    @Param('appId') appId: string,
  ) {
    if (!email) throw new BadRequestException('Email is required');
    return this.integrationsService.disconnectIntegration(email, appId);
  }
}
