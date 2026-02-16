const https = require('https');
const path = require('path');
const fs = require('fs');

// Simple env parser
function loadEnv(filePath) {
    if (!fs.existsSync(filePath)) return {};
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    const env = {};
    lines.forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
            const key = match[1];
            let value = match[2] || '';
            if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
            if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
            env[key] = value.trim();
        }
    });
    return env;
}

async function testOneDrive() {
    const env = loadEnv(path.join(__dirname, 'backend', 'admin-service', '.env.local'));

    const tenantId = env.ONEDRIVE_TENANT_ID;
    const clientId = env.ONEDRIVE_CLIENT_ID;
    const clientSecret = env.ONEDRIVE_CLIENT_SECRET;
    const driveId = env.ONEDRIVE_DRIVE_ID;
    const rootId = env.ONEDRIVE_ROOT_FOLDER_ID;

    console.log('--- Config ---');
    console.log('Tenant:', tenantId);
    console.log('Client ID:', clientId);
    console.log('Secret:', clientSecret ? '******' : 'MISSING');

    // 1. Get Token
    console.log('\n--- Fetching Token ---');
    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    const postData = `grant_type=client_credentials&client_id=${clientId}&client_secret=${encodeURIComponent(clientSecret)}&scope=https://graph.microsoft.com/.default`;

    const tokenRes = await new Promise((resolve, reject) => {
        const req = https.request(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': postData.length
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, data: JSON.parse(data) }));
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
    });

    if (tokenRes.status !== 200) {
        console.error('FAILED to get token:', tokenRes.status);
        console.error(JSON.stringify(tokenRes.data, null, 2));
        return;
    }
    console.log('SUCCESS: Token obtained!');
    const token = tokenRes.data.access_token;

    // 2. Fetch Folder
    console.log('\n--- Fetching Folder Info ---');
    const driveUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${rootId}`;
    const folderRes = await new Promise((resolve, reject) => {
        const req = https.get(driveUrl, {
            headers: { 'Authorization': `Bearer ${token}` }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, data: JSON.parse(data) }); }
                catch (e) { resolve({ status: res.statusCode, data }); }
            });
        });
        req.on('error', reject);
    });

    if (folderRes.status !== 200) {
        console.error('FAILED to fetch folder:', folderRes.status);
        console.error(JSON.stringify(folderRes.data, null, 2));
    } else {
        console.log('SUCCESS: Found folder:', folderRes.data.name);
        console.log('Web URL:', folderRes.data.webUrl);
    }
}

testOneDrive().catch(console.error);
