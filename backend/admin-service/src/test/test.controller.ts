import { Controller, Get, Post, Body, Res, Param } from '@nestjs/common';
import { Response } from 'express';
import { getStudentWelcomeEmailTemplate } from '../mail/templates/student-welcome.template';
import { getCorporateWelcomeEmailTemplate } from '../mail/templates/corporate-welcome.template';
import * as fs from 'fs';
import * as path from 'path';
import * as nodemailer from 'nodemailer';
import { SES } from 'aws-sdk';

@Controller('test')
export class TestController {
    @Get('preview-email')
    previewEmail(@Res() res: Response) {
        // ... (existing preview logic) ...
        const readAsset = (filename: string) => {
            try {
                const filePath = path.join(process.cwd(), 'src/mail/assets', filename);
                if (fs.existsSync(filePath)) {
                    const content = fs.readFileSync(filePath).toString('base64');
                    return `data:image/svg+xml;base64,${content}`;
                }
            } catch {
                console.warn(`Failed to load email asset: ${filename}`);
            }
            return '';
        };

        const assets = {
            popper: readAsset('Popper.svg'),
            pattern: readAsset('Pattern_mask.svg'),
            footer: readAsset('Email_Vector.svg'),
            logo: readAsset('logo.png'),
        };

        const html = getStudentWelcomeEmailTemplate(
            'Ariyappan',
            'test@example.com',
            'password123',
            'http://localhost:3000',
            assets,
            new Date(),
            'Role Match Explorer',
        );
        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    }

    @Get('preview-corporate-email')
    previewCorporateEmail(@Res() res: Response) {
        const baseUrl = process.env.BACKEND_URL || 'http://localhost:4000';

        // Mock assets for preview - assuming they work via relative path or need full URL
        // Currently test controller uses base64 for previewEmail but URLs for sendTestEmail
        // Let's use URLs here to test the prod-like rendering
        const assets = {
            popper: `${baseUrl}/assets/Popper.png`,
            pattern: `${baseUrl}/assets/Pattern_mask.png`,
            footer: `${baseUrl}/assets/Email_Vector.png`,
            logo: `${baseUrl}/assets/logo.png`,
        };

        const html = getCorporateWelcomeEmailTemplate(
            'Bharathiraja Thangappalam',
            'name@gmail.com', // email
            'asd5f465', // password
            'Touchmark Descience Pvt.Ltd', // companyName
            '999999999', // mobile
            '+91', // countryCode
            'http://localhost:3000/corporate',
            assets,
        );

        res.setHeader('Content-Type', 'text/html');
        res.send(html);
    }

    @Get('assets/:filename')
    serveAsset(@Param('filename') filename: string, @Res() res: Response) {
        const filePath = path.join(process.cwd(), 'src/mail/assets', filename);
        if (fs.existsSync(filePath)) {
            const ext = path.extname(filename).toLowerCase();
            let contentType = 'image/png';
            if (ext === '.svg') contentType = 'image/svg+xml';
            else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';

            res.setHeader('Content-Type', contentType);
            fs.createReadStream(filePath).pipe(res);
        } else {
            res.status(404).send('File not found');
        }
    }

    @Post('send-email')
    async sendTestEmail(@Body() body: { email: string }) {
        const email = body.email || 'test@example.com';

        // Construct public URLs for the assets
        // NOTE: In production, 'localhost:4001' must be replaced with the actual public domain/IP
        // For this test context, we assume the user can access localhost or we use the configured headers
        const baseUrl = process.env.BACKEND_URL || 'http://localhost:4000';

        const assets = {
            popper: `${baseUrl}/assets/Popper.png`,
            pattern: `${baseUrl}/assets/Pattern_mask.png`,
            footer: `${baseUrl}/assets/Email_Vector.png`,
            logo: `${baseUrl}/assets/logo.png`,
        };

        const html = getStudentWelcomeEmailTemplate(
            'Ariyappan',
            email,
            'password123',
            process.env.FRONTEND_URL || 'http://localhost:3000',
            assets,
            new Date(),
            'Role Match Explorer',
        );

        const ses = new SES({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_REGION,
        });

        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const transporter = nodemailer.createTransport({ SES: ses } as any);

        const fromName = process.env.EMAIL_SEND_FROM_NAME || 'Origin BI';
        const fromEmail = process.env.EMAIL_FROM || 'no-reply@originbi.com';
        const fromAddress = `"${fromName}" <${fromEmail}>`;

        await transporter.sendMail({
            from: fromAddress,
            to: email,
            cc: process.env.EMAIL_CC,
            subject: 'Test Welcome Email - Mobile Responsive Check',
            html: html,
        });

        return {
            success: true,
            message: `Email sent to ${email} using hosted images`,
        };
    }

    @Post('send-corporate-email')
    async sendCorporateTestEmail(@Body() body: { email: string }) {
        const email = body.email || 'test@example.com';
        const baseUrl = process.env.BACKEND_URL || 'http://localhost:4001';

        const assets = {
            popper: `${baseUrl}/assets/Popper.png`,
            pattern: `${baseUrl}/assets/Pattern_mask.png`,
            footer: `${baseUrl}/assets/Email_Vector.png`,
            logo: `${baseUrl}/assets/logo.png`,
        };

        const html = getCorporateWelcomeEmailTemplate(
            'Bharathiraja Thangappalam',
            email,
            'asd5f465',
            'Touchmark Descience Pvt.Ltd',
            '999999999',
            '+91',
            `${process.env.FRONTEND_URL || 'http://localhost:3000'}/corporate`,
            assets,
        );

        const ses = new SES({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_REGION,
        });

        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const transporter = nodemailer.createTransport({ SES: ses } as any);

        const fromName =
            process.env.EMAIL_SEND_FROM_NAME || 'Origin BI (Corporate)';
        const fromEmail = process.env.EMAIL_FROM || 'no-reply@originbi.com';
        const fromAddress = `"${fromName}" <${fromEmail}>`;

        await transporter.sendMail({
            from: fromAddress,
            to: email,
            cc: process.env.EMAIL_CC,
            subject: 'Test Corporate Welcome Email',
            html: html,
        });

        return {
            success: true,
            message: `Corporate email sent to ${email} (CC: ${process.env.EMAIL_CC || 'None'})`,
        };
    }
}
