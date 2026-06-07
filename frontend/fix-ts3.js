import fs from 'fs';
import path from 'path';

let p = './src/pages/app/AIPage.tsx';
let content = fs.readFileSync(p, 'utf-8');
content = content.replace("import React, { useEffect,", "import { useEffect,");
content = content.replace("const { user } = useAuth()", "const {} = useAuth()");
content = content.replace("const navigate = useNavigate()", "");
content = content.replace("const [error, setError] = useState<string | null>(null)", "const [, setError] = useState<string | null>(null)");
fs.writeFileSync(p, content);
