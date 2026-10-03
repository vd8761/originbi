import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  Query,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
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
    @Res() res: Response,
  ) {
    if (!email || !appId)
      throw new BadRequestException('Email and appId are required');
    const url = this.integrationsService.generateGoogleOAuthUrl(email, appId);
    return res.redirect(url);
  }

  // ─── OAuth: Google Callback ───
  @Get('oauth/google/callback')
  async handleGoogleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    try {
      const result = await this.integrationsService.handleGoogleCallback(
        code,
        state,
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
