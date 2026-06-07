const fs = require('fs');
const path = require('path');

const dir = 'c:/Users/nagam/OneDrive/Desktop/campusIQ/frontend/src/pages/app';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filepath = path.join(dir, file);
  let content = fs.readFileSync(filepath, 'utf8');

  // Match the specific pattern
  const searchRegex = /<div className=\`?\"?flex h-full w-full items-center justify-center rounded-\[11px\] bg-\[#0a0d1d\]\"?\`?>\s*<span className=\"text-xs font-bold text-white uppercase\">\s*\{user\?\.name\?\.slice\(0,\s*2\)\s*\|\|\s*'IQ'\}\s*<\/span>\s*<\/div>/g;
  
  if (searchRegex.test(content)) {
    const replaceStr = `<div className="flex h-full w-full items-center justify-center rounded-[11px] bg-[#0a0d1d] overflow-hidden">
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt="Avatar" className="size-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-white uppercase">
                        {user?.name?.slice(0, 2) || 'IQ'}
                      </span>
                    )}
                  </div>`;
    content = content.replace(searchRegex, replaceStr);
    fs.writeFileSync(filepath, content);
    console.log('Updated ' + file);
  }
}
