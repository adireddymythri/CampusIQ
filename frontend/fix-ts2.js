import fs from 'fs';
import path from 'path';

let p = './src/pages/app/NotesPage.tsx';
let content = fs.readFileSync(p, 'utf-8');
content = content.replace('ChevronRight,', '');
content = content.replace('Filter,', '');
content = content.replace('SlidersHorizontal,', '');
fs.writeFileSync(p, content);

p = './src/pages/app/PapersPage.tsx';
content = fs.readFileSync(p, 'utf-8');
content = content.replace('ChevronRight,', '');
content = content.replace('Filter,', '');
content = content.replace('SlidersHorizontal,', '');
fs.writeFileSync(p, content);

p = './src/pages/app/PracticePage.tsx';
content = fs.readFileSync(p, 'utf-8');
content = content.replace('Bookmark,', '');
content = content.replace('ChevronRight,', '');
content = content.replace('const [submitting, setSubmitting] = useState(false)', 'const [, setSubmitting] = useState(false)');
fs.writeFileSync(p, content);
