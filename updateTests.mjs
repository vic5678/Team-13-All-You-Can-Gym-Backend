import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const testFilesConfig = [
  { file: 'user.test.js', imports: '{ startServerAndClient, loginUser }' },
  { file: 'sessions.test.js', imports: '{ startServerAndClient, loginUser }' },
  { file: 'gymAdmin.test.js', imports: '{ startServerAndClient, loginGymAdmin }' },
  { file: 'subscription.test.js', imports: '{ startServerAndClient, loginUser }' },
  { file: 'payment.test.js', imports: '{ startServerAndClient, registerAndLogin }' },
  { file: 'gym.test.js', imports: '{ startServerAndClient, registerAndLoginGymAdmin }' }
];

testFilesConfig.forEach(({ file, imports }) => {
  const filePath = path.join(__dirname, 'src', 'tests', file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Remove http and got imports
  content = content.replace(/import http from 'http';\n/g, '');
  content = content.replace(/import got from 'got';\n/g, '');

  // Remove the entire // START: helpers ... // END helpers block (greedy match including newlines)
  content = content.replace(/\/\/ START: helpers used by multiple tests[\s\S]*?\/\/ END helpers\n\n/g, '');

  // Remove helper sections that start with "// Helper:"  or "// ----------------------\n// Helpers"
  content = content.replace(/\/\/ ----------------------\n\/\/ Helpers\n\/\/ ----------------------\n\n[\s\S]*?\/\/ ----------------------\n\/\/ Hooks\n/g, '\/\/ ----------------------\n\/\/ Hooks\n');

  // Generic pattern for helper function blocks starting with comment
  content = content.replace(/\/\/ Helper:[\s\S]*?\n};[\s\S]*?\n(?=test\.before|const test|\/\/)/g, '');

  // Clean up any remaining helper function definitions
  const lines = content.split('\n');
  let filtered = [];
  let skipUntilTest = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    
    if ((trimmed.startsWith('// Helper:') || trimmed.startsWith('const startServerAndClient') || trimmed.startsWith('const loginUser') || trimmed.startsWith('const loginGymAdmin') || trimmed.startsWith('const registerAndLogin') || trimmed.startsWith('const registerAndLoginGymAdmin')) && !trimmed.includes('from')) {
      skipUntilTest = true;
    }
    
    if (skipUntilTest && (trimmed.startsWith('test.') || trimmed.startsWith('//'))) {
      skipUntilTest = false;
    }
    
    if (!skipUntilTest) {
      filtered.push(line);
    }
  }
  content = filtered.join('\n');

  // Find connectDB import and add testHelpers import after it
  content = content.replace(
    /import connectDB from '\.\.\/config\/database\.js';/g,
    "import connectDB from '../config/database.js';\nimport " + imports + " from './testHelpers.js';"
  );

  // Clean up multiple consecutive newlines
  content = content.replace(/\n\n\n+/g, '\n\n');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`Updated: ${file}`);
});

console.log('All test files updated successfully!');
