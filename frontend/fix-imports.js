import fs from 'fs';
import path from 'path';

const dir = './src/pages/app';
const files = ['DashboardPage.tsx', 'NotesPage.tsx', 'PapersPage.tsx', 'PracticePage.tsx', 'UploadPage.tsx'];

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  
  if (!content.includes("../../components/HeaderProfile")) {
    content = content.replace(/import \{ useAuth \} from '\.\.\/\.\.\/lib\/auth'/, "import { useAuth } from '../../lib/auth'\nimport { HeaderProfile } from '../../components/HeaderProfile'");
    fs.writeFileSync(filePath, content);
    console.log(`Added import to ${file}`);
  }
}
