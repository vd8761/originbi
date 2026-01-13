import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function check() {
    const client = new Client({
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432'),
        user: process.env.DB_USER,
        password: process.env.DB_PASS,
        database: process.env.DB_NAME,
    });

    try {
        await client.connect();
        console.log('Connected to:', process.env.DB_HOST, process.env.DB_NAME);

        // Check RAG tables
        const tables = await client.query(`SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'rag%'`);
        console.log('RAG Tables:', tables.rows);

        // Check pgvector extension
        const ext = await client.query(`SELECT extname FROM pg_extension WHERE extname = 'vector'`);
        console.log('Vector Extension:', ext.rows);

        // Check document count
        if (tables.rows.length > 0) {
            const docs = await client.query(`SELECT COUNT(*) as count FROM rag_documents`);
            console.log('Document Count:', docs.rows[0].count);
        }

        // Test vector type
        try {
            await client.query(`SELECT '[1,2,3]'::vector(3)`);
            console.log('pgvector type test: PASSED');
        } catch (e) {
            console.log('pgvector type test: FAILED -', e.message);
        }
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await client.end();
    }
}

check();
