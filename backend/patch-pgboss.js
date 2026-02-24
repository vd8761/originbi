const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'node_modules', '@wavezync', 'nestjs-pgboss', 'dist', 'handler-scanner.service.js');

if (!fs.existsSync(filePath)) {
  console.log('Patch skipped: @wavezync/nestjs-pgboss not installed yet.');
  process.exit(0);
}

let content = fs.readFileSync(filePath, 'utf8');

const targetStr = `const methodNames = Object.getOwnPropertyNames(prototype).filter((method) => method !== "constructor" && typeof instance[method] === "function");`;
const replacementStr = `const methodNames = Object.getOwnPropertyNames(prototype).filter((method) => {
            try {
                return method !== "constructor" && typeof instance[method] === "function";
            } catch (e) {
                return false;
            }
        });`;

if (content.includes(targetStr)) {
  content = content.replace(targetStr, replacementStr);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully patched @wavezync/nestjs-pgboss for TypeORM compatibility.');
} else if (content.includes(`try {\n                return method !== "constructor"`) || content.includes(`try {`)) {
  console.log('Patch skipped: @wavezync/nestjs-pgboss already patched.');
} else {
  console.warn('Patch warning: Could not find target string in handler-scanner.service.js.');
}

// Patch 2: Remove "jest" from types in tsconfig.json to fix
// "Cannot find type definition file for 'jest'" IDE error
const tsconfigPath = path.join(__dirname, 'node_modules', '@wavezync', 'nestjs-pgboss', 'tsconfig.json');
if (fs.existsSync(tsconfigPath)) {
  try {
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
    if (tsconfig.compilerOptions && Array.isArray(tsconfig.compilerOptions.types)) {
      const jestIndex = tsconfig.compilerOptions.types.indexOf('jest');
      if (jestIndex !== -1) {
        tsconfig.compilerOptions.types.splice(jestIndex, 1);
        fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2), 'utf8');
        console.log('Successfully patched @wavezync/nestjs-pgboss tsconfig.json: removed jest from types.');
      } else {
        console.log('Patch skipped: jest already removed from tsconfig.json types.');
      }
    }
  } catch (e) {
    console.warn('Patch warning: Could not patch tsconfig.json:', e.message);
  }
} else {
  console.log('Patch skipped: @wavezync/nestjs-pgboss tsconfig.json not found.');
}
