import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { DataSource } from 'typeorm';
import { EmbeddingsService } from './embeddings.service';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('RAG-Verification');
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    // Get Services
    const dataSource = app.get(DataSource);
    const embeddingsService = app.get(EmbeddingsService);

    console.log('\n\n');
    logger.log('🕵️  STARTING RAG PRODUCION VERIFICATION 🕵️');
    console.log('════════════════════════════════════════════════════');

    // 1. CHECK DATABASE CONNECTION & PGVECTOR
    logger.log('Step 1: Checking Database & Vector Extension...');
    const startDb = performance.now();
    try {
      const ExtensionResult = await dataSource.query(
        `SELECT * FROM pg_extension WHERE extname = 'vector'`,
      );
      const dbDuration = (performance.now() - startDb).toFixed(2);
      if (ExtensionResult.length > 0) {
        logger.log(`✅ pgvector extension is INSTALLED and ACTIVE. (${dbDuration}ms)`);
      } else {
        logger.error('❌ pgvector extension is MISSING!');
      }
    } catch (e) {
      logger.error(`❌ Database Check Failed: ${e.message}`);
      process.exitCode = 1;
    }

    // ... (Count Vectors skipped for brevity in replacement, but keep it) ...

    // 3. TEST SEMANTIC SEARCH (Pure Vector Search)
    console.log('────────────────────────────────────────────────────');
    logger.log('Step 3: Testing Semantic Search (Pure Vector Path)...');
    try {
      const testQuery = 'python developer skills';
      logger.log(`🔍 Searching for: "${testQuery}"`);

      // Generate embedding for query
      const startEmbed = performance.now();
      const queryEmbedding = await embeddingsService.generateEmbedding(testQuery);
      const embedDuration = (performance.now() - startEmbed).toFixed(2);

      if (!queryEmbedding) {
        logger.error(
          '❌ Failed to generate embedding. Check Google Gemini API key or network.',
        );
        process.exitCode = 1;
      } else {
        logger.log(`✅ Embedding generated successfully. (${embedDuration}ms)`);

        // Perform Vector Search
        const startSearch = performance.now();
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
        const searchDuration = (performance.now() - startSearch).toFixed(2);

        if (results.length > 0) {
          logger.log(`✅ Search Succeeded! Found ${results.length} matches. (${searchDuration}ms)`);
          results.forEach((r, i) => {
            console.log(
              `\n   Match #${i + 1} (Similarity: ${(r.similarity * 100).toFixed(1)}%)`,
            );
            console.log(`   "${r.content.substring(0, 100)}..."`);
          });
        } else {
          logger.warn('⚠️  Search returned NO matches. (Is the data relevant?)');
          process.exitCode = 1;
        }
      }
    } catch (e) {
      logger.error(`❌ Semantic Search Failed: ${e.message}`);
      process.exitCode = 1;
    }

    console.log('────────────────────────────────────────────────────');
    logger.log('🏁 VERIFICATION COMPLETE');
    console.log('\n\n');
  } catch (err) {
    logger.error(`❌ Verification bootstrap failed: ${(err as any)?.message || err}`);
    process.exitCode = 1;
  } finally {
    await app.close();
    // Force deterministic exit so scheduled services don't run after verification.
    process.exit(process.exitCode ?? 0);
  }
}

bootstrap();
