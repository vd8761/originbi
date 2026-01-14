import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
dotenv.config({ path: '.env.local' });

async function analyzeFullSchema() {
    const client = new Client({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
    });

    try {
        await client.connect();
        console.log('Connected to database:', process.env.DB_NAME);

        // Get all tables with row counts
        const tables = await client.query(`
            SELECT 
                t.table_name,
                (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_name = t.table_name AND c.table_schema = 'public') as column_count
            FROM information_schema.tables t
            WHERE t.table_schema = 'public' 
            AND t.table_type = 'BASE TABLE'
            ORDER BY t.table_name
        `);

        console.log('\n=== ALL TABLES ===');

        let schemaOutput = '# DATABASE SCHEMA ANALYSIS\n\n';
        schemaOutput += '## Tables Found\n\n';

        for (const table of tables.rows) {
            // Get row count
            let rowCount = 0;
            try {
                const countResult = await client.query(`SELECT COUNT(*) as cnt FROM "${table.table_name}"`);
                rowCount = parseInt(countResult.rows[0].cnt);
            } catch (e) {
                rowCount = -1;
            }

            // Get columns
            const columns = await client.query(`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = $1 AND table_schema = 'public'
                ORDER BY ordinal_position
            `, [table.table_name]);

            console.log(`\n📦 ${table.table_name} (${rowCount} rows)`);
            schemaOutput += `### ${table.table_name} (${rowCount} rows)\n`;
            schemaOutput += '| Column | Type | Nullable |\n|--------|------|----------|\n';

            for (const col of columns.rows) {
                console.log(`   - ${col.column_name} (${col.data_type})`);
                schemaOutput += `| ${col.column_name} | ${col.data_type} | ${col.is_nullable} |\n`;
            }
            schemaOutput += '\n';
        }

        // Save to file
        fs.writeFileSync('SCHEMA_ANALYSIS.md', schemaOutput);
        console.log('\n\n✅ Schema saved to SCHEMA_ANALYSIS.md');

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await client.end();
    }
}

analyzeFullSchema();
