#!/usr/bin/env ts-node
/**
 * Token Usage CLI Monitor
 * 
 * Usage:
 *   ts-node token-monitor-cli.ts --report    # Print current usage report
 *   ts-node token-monitor-cli.ts --status    # Check health status
 *   ts-node token-monitor-cli.ts --watch     # Watch real-time usage (every 30s)
 */

import { TokenUsageMonitor } from './token-usage-monitor';

const args = process.argv.slice(2);
const command = args[0] || '--report';

const monitor = new TokenUsageMonitor();
(monitor as any).onModuleInit?.();

function printReport() {
  (monitor as any).printUsageReport();
}

function checkStatus() {
  const health = (monitor as any).checkHealthStatus();
  console.log('\n✅ Health Status:');
  console.log(`   - Groq: ${health.groqStatus.toUpperCase()}`);
  console.log(`   - Gemini: ${health.geminiStatus.toUpperCase()}`);
  console.log('\n📋 Recommendations:');
  health.recommendations.forEach((rec: string) => console.log(`   ${rec}`));
}

function watchUsage() {
  console.log('🔍 Watching token usage (refreshing every 30s)...\n');
  printReport();

  setInterval(() => {
    console.clear();
    console.log('🔍 Watching token usage (refreshing every 30s)...\n');
    printReport();
    checkStatus();
  }, 30000);
}

// Execute command
switch (command) {
  case '--report':
    printReport();
    break;
  case '--status':
    checkStatus();
    break;
  case '--watch':
    watchUsage();
    break;
  default:
    console.log(`
Usage:
  ts-node token-monitor-cli.ts [command]

Commands:
  --report    Print current usage report (default)
  --status    Check health status and recommendations
  --watch     Watch real-time usage (refreshes every 30s)
    `);
}
