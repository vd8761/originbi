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

        // Check document count by category
        const categories = await client.query(`
            SELECT category, COUNT(*) as count 
            FROM rag_documents 
            GROUP BY category
        `);
        console.log('Documents by category:', categories.rows);

        // Check sample of each category
        const sample = await client.query(`
            SELECT category, LEFT(content, 100) as sample 
            FROM rag_documents 
            GROUP BY category, content 
            LIMIT 5
        `);
        console.log('\nSample documents:');
        sample.rows.forEach(r => console.log(`- [${r.category}] ${r.sample}...`));

        // Check career roles
        const roles = await client.query(`SELECT COUNT(*) FROM career_roles WHERE is_deleted = false`);
        console.log('\nCareer roles in DB:', roles.rows[0].count);

        // Check courses
        const courses = await client.query(`SELECT COUNT(*) FROM trait_based_course_details WHERE is_deleted = false`);
        console.log('Courses in DB:', courses.rows[0].count);

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await client.end();
    }
}

check();
