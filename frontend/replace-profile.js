import fs from 'fs';
import path from 'path';

const dir = './src/pages/app';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

const profilePattern = /<div className="flex items-center gap-3 pl-2">[\s\S]*?<div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-\[1px\]">[\s\S]*?<div className="flex h-full w-full items-center justify-center rounded-\[11px\] bg-\[#0a0d1d\] overflow-hidden">[\s\S]*?\{user\?\.avatarUrl \? \([\s\S]*?<img src=\{user\.avatarUrl\} alt="Avatar" className="size-full object-cover" \/>[\s\S]*?\) : \([\s\S]*?<span className="text-xs font-bold text-white uppercase">[\s\S]*?\{user\?\.name\?\.slice\(0, 2\) \|\| 'IQ'\}[\s\S]*?<\/span>[\s\S]*?\)[\s\S]*?\}[\s\S]*?<\/div>[\s\S]*?<\/div>\s*<\/div>/g;

const uploadProfilePattern = /<div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-\[1px\]">[\s\S]*?<div className="flex h-full w-full items-center justify-center rounded-\[11px\] bg-\[#0a0d1d\] overflow-hidden">[\s\S]*?\{user\?\.avatarUrl \? \([\s\S]*?<img src=\{user\.avatarUrl\} alt="Avatar" className="size-full object-cover" \/>[\s\S]*?\) : \([\s\S]*?<span className="text-xs font-bold text-white uppercase">[\s\S]*?\{user\?\.name\?\.slice\(0, 2\) \|\| 'IQ'\}[\s\S]*?<\/span>[\s\S]*?\)[\s\S]*?\}[\s\S]*?<\/div>\s*<\/div>/g;

const settingsProfilePattern = /<span className=\{`text-2xl font-black \$\{textTitle\}`\}>\{user\?\.name\?\.slice\(0, 2\)\.toUpperCase\(\) \|\| 'IQ'\}<\/span>/g;

let updated = 0;

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;

  if (file === 'SettingsPage.tsx') continue; // Don't replace inside Settings page settings UI

  if (content.match(profilePattern)) {
    content = content.replace(profilePattern, '<HeaderProfile />');
    changed = true;
  } else if (content.match(uploadProfilePattern)) {
    content = content.replace(uploadProfilePattern, '<HeaderProfile />');
    changed = true;
  }

  if (changed) {
    if (!content.includes('HeaderProfile')) {
      content = content.replace(/import \{ useAuth \} from '\.\.\/\.\.\/lib\/auth'/, "import { useAuth } from '../../lib/auth'\nimport { HeaderProfile } from '../../components/HeaderProfile'");
    }
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
    updated++;
  }
}

console.log(`Total files updated: ${updated}`);
