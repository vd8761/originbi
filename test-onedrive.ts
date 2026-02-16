import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

// Load env from the admin-service
dotenv.config({ path: path.join(__dirname, 'backend', 'admin-service', '.env.local') });

async function testOneDrive() {
    const tenantId = process.env.ONEDRIVE_TENANT_ID;
    const clientId = process.env.ONEDRIVE_CLIENT_ID;
    const clientSecret = process.env.ONEDRIVE_CLIENT_SECRET;

    console.log('--- Config ---');
    console.log('Tenant:', tenantId);
    console.log('Client ID:', clientId);
    console.log('Secret:', clientSecret ? '******' : 'MISSING');

    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', clientId!);
    params.append('client_secret', clientSecret!);
    params.append('scope', 'https://graph.microsoft.com/.default');

    try {
        console.log('\n--- Fetching Token ---');
        const res = await axios.post(tokenUrl, params.toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        console.log('SUCCESS: Token obtained!');

        const token = res.data.access_token;
        const driveId = process.env.ONEDRIVE_DRIVE_ID;
        const rootId = process.env.ONEDRIVE_ROOT_FOLDER_ID;

        console.log('\n--- Fetching Root Folder ---');
        const driveUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${rootId}`;
        const driveRes = await axios.get(driveUrl, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('SUCCESS: Found folder:', driveRes.data.name);

    } catch (err: any) {
        console.error('\n--- ERROR ---');
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', JSON.stringify(err.response.data, null, 2));
        } else {
            console.error(err.message);
        }
    }
}

testOneDrive();
