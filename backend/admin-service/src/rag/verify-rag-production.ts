import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { EmbeddingsService } from './embeddings.service';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('RAG-Verification');
  const app = await NestFactory.createApplicationContext(AppModule);

  // Get Services
  const dataSource = app.get(DataSource);
  const embeddingsService = app.get(EmbeddingsService);

  console.log('\n\n');
  logger.log('🕵️  STARTING RAG PRODUCION VERIFICATION 🕵️');
  console.log('════════════════════════════════════════════════════');

  // 1. CHECK DATABASE CONNECTION & PGVECTOR
  logger.log('Step 1: Checking Database & Vector Extension...');
  try {
    const ExtensionResult = await dataSource.query(
      `SELECT * FROM pg_extension WHERE extname = 'vector'`,
    );
    if (ExtensionResult.length > 0) {
      logger.log('✅ pgvector extension is INSTALLED and ACTIVE.');
    } else {
      logger.error('❌ pgvector extension is MISSING!');
    }
  } catch (e) {
    logger.error(`❌ Database Check Failed: ${e.message}`);
  }

  // 2. COUNT VECTORS
  console.log('────────────────────────────────────────────────────');
  logger.log('Step 2: Counting Active Vectors...');
  try {
    const countResult = await dataSource.query(
      `SELECT COUNT(*) as count FROM rag_embeddings`,
    );
    const docCountResult = await dataSource.query(
      `SELECT COUNT(*) as count FROM rag_documents`,
    );
    const vectorCount = countResult[0].count;
    const docCount = docCountResult[0].count;

    if (parseInt(vectorCount) > 0) {
      logger.log(`✅ Vector Store is POPULATED.`);
      logger.log(`   - Documents: ${docCount}`);
      logger.log(`   - Vectors:   ${vectorCount}`);
    } else {
      logger.warn(
        '⚠️  Vector Store is EMPTY. SyncService might need time to run.',
      );
    }
  } catch (e) {
    logger.error(
      `❌ Vector Count Failed: ${e.message} (Did you run the migration?)`,
    );
  }

  // 3. TEST SEMANTIC SEARCH (Pure Vector Search)
  console.log('────────────────────────────────────────────────────');
  logger.log('Step 3: Testing Semantic Search (Pure Vector Path)...');
  try {
    const testQuery = 'python developer skills';
    logger.log(`🔍 Searching for: "${testQuery}"`);

    // Generate embedding for query
    const queryEmbedding = await embeddingsService.generateEmbedding(testQuery);
    if (!queryEmbedding) {
      logger.error(
        '❌ Failed to generate embedding for query (Check Jina AI Key)',
      );
    } else {
      logger.log('✅ Embedding generated successfully.');

      // Perform Vector Search
      const vectorSql = `
                SELECT d.content, 1 - (e.embedding <=> $1) as similarity
                FROM rag_documents d
                JOIN rag_embeddings e ON d.id = e.document_id
                ORDER BY similarity DESC
                LIMIT 3
            `;
      const results = await dataSource.query(vectorSql, [
        `[${queryEmbedding.join(',')}]`,
      ]);

      if (results.length > 0) {
        logger.log(`✅ Search Succeeded! Found ${results.length} matches.`);
        results.forEach((r, i) => {
          console.log(
            `\n   Match #${i + 1} (Similarity: ${(r.similarity * 100).toFixed(1)}%)`,
          );
          console.log(`   "${r.content.substring(0, 100)}..."`);
        });
      } else {
        logger.warn('⚠️  Search returned NO matches. (Is the data relevant?)');
      }
    }
  } catch (e) {
    logger.error(`❌ Semantic Search Failed: ${e.message}`);
  }

  console.log('────────────────────────────────────────────────────');
  logger.log('🏁 VERIFICATION COMPLETE');
  console.log('\n\n');

  await app.close();
}

bootstrap();
