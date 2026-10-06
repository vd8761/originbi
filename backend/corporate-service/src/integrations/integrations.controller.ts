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
    // Dynamic AuthGuard to pass state
    const guard = AuthGuard('google');
    // @ts-ignore - access options
    const authFn = new guard().getAuthenticateOptions ? new guard().getAuthenticateOptions(req) : {};
    
    // We import passport directly to use its authenticate method for dynamic state
    const passport = require('passport');
    return passport.authenticate('google', {
      state,
      accessType: 'offline',
      prompt: 'consent',
    })(req, res, (err: any) => {
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
      
      const result = await this.integrationsService.handleGoogleCallbackPassport(
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

  @Get('google/file-content')
  async getGoogleDriveFileContent(
    @Query('email') email: string,
    @Query('fileId') fileId: string,
  ) {
    if (!email) throw new BadRequestException('Email is required');
    if (!fileId) throw new BadRequestException('File ID is required');
    return this.integrationsService.getGoogleDriveFileContent(email, fileId);
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
