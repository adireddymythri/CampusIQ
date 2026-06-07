const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/nagam/OneDrive/Desktop/campusIQ/frontend/src/pages/app';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filepath = path.join(dir, file);
  const content = fs.readFileSync(filepath, 'utf8');
  if (content.includes('slice(0, 2)')) {
    console.log(file);
  }
}
