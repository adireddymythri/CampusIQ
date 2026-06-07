const fs = require('fs');
const path = require('path');
const glob = require('glob');
const { execSync } = require('child_process');

const files = glob.sync('src/**/*.{ts,tsx}');

for (const file of files) {
  const isTsx = file.endsWith('.tsx');
  const ext = isTsx ? '.jsx' : '.js';
  const newFile = file.replace(/\.tsx?$/, ext);
  
  console.log(`Converting ${file} to ${newFile}...`);
  try {
    // Run detype CLI to convert
    execSync(`npx detype ${file} ${newFile}`);
    // Remove old file
    fs.unlinkSync(file);
  } catch (e) {
    console.error(`Failed to convert ${file}:`, e.message);
  }
}
console.log('Done!');
