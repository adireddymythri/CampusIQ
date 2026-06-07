import fs from 'fs';
import path from 'path';

// SettingsPage
let p = './src/pages/app/SettingsPage.tsx';
let content = fs.readFileSync(p, 'utf-8');
content = content.replace('LogOut,', '');
content = content.replace('Bell,', '');
content = content.replace('Lock,', '');
fs.writeFileSync(p, content);

// UploadPage
p = './src/pages/app/UploadPage.tsx';
content = fs.readFileSync(p, 'utf-8');
content = content.replace('const { user } = useAuth()', 'const { } = useAuth()');
fs.writeFileSync(p, content);

// ResetPasswordPage
p = './src/pages/auth/ResetPasswordPage.tsx';
content = fs.readFileSync(p, 'utf-8');
content = content.replace('const [email, setEmail] = useState', 'const [email] = useState');
fs.writeFileSync(p, content);
