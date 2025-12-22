import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';

@Controller('assets')
export class MailAssetsController {
    @Get(':filename')
    serveAsset(@Param('filename') filename: string, @Res() res: Response) {
        // Path relative to the service root execution
        const filePath = path.join(process.cwd(), 'src/mail/assets', filename);

        if (fs.existsSync(filePath)) {
            const ext = path.extname(filename).toLowerCase();
            let contentType = 'image/png';
            if (ext === '.svg') contentType = 'image/svg+xml';
            else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';

            res.setHeader('Content-Type', contentType);
            // Cache for performance (e.g., 1 day)
            res.setHeader('Cache-Control', 'public, max-age=86400');
            fs.createReadStream(filePath).pipe(res);
        } else {
            res.status(404).send('File not found');
        }
    }
}
