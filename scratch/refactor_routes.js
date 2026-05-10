const fs = require('fs');
const path = require('path');

const routesDir = path.join(process.cwd(), 'routes');
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));

files.forEach(file => {
    const filePath = path.join(routesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace the manual client creation with a require to the central client
    // Case 1: with process.env.SUPABASE_ANON_KEY
    const pattern1 = /const\s+supabase\s+=\s+createClient\(process\.env\.SUPABASE_URL,\s+process\.env\.SUPABASE_ANON_KEY\);/g;
    content = content.replace(pattern1, "const supabase = require('../supabase_client');");

    // Case 2: without const (if already declared)
    const pattern2 = /supabase\s+=\s+createClient\(process\.env\.SUPABASE_URL,\s+process\.env\.SUPABASE_ANON_KEY\);/g;
    content = content.replace(pattern2, "supabase = require('../supabase_client');");

    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
});
