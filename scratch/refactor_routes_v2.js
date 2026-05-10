const fs = require('fs');
const path = require('path');

const routesDir = path.join(process.cwd(), 'routes');
const files = fs.readdirSync(routesDir).filter(f => f.endsWith('.js'));

files.forEach(file => {
    const filePath = path.join(routesDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 1. Remove the require of createClient if it's there
    content = content.replace(/const\s+\{\s*createClient\s*\}\s*=\s*require\(['"]@supabase\/supabase-js['"]\);?\n?/g, '');
    
    // 2. Remove any getSupabase helper function
    content = content.replace(/function\s+getSupabase\(\)\s*\{[\s\S]*?return\s+createClient\(process\.env\.SUPABASE_URL,\s+process\.env\.SUPABASE_ANON_KEY\);?\s*\}\n?/g, '');

    // 3. Replace all createClient calls with require('../supabase_client')
    // We want a single 'const supabase = require('../supabase_client');' at the top or where it was first used.
    
    let hasSupabase = false;
    
    // Replace 'const supabase = getSupabase();' or 'const supabase = createClient(...);'
    const supabasePattern = /(?:const|let|var)?\s*supabase\s*=\s*(?:getSupabase\(\)|createClient\(process\.env\.SUPABASE_URL,\s+process\.env\.SUPABASE_ANON_KEY\));?/g;
    
    if (supabasePattern.test(content)) {
        content = content.replace(supabasePattern, "const supabase = require('../supabase_client');");
        hasSupabase = true;
    }

    // Check if 'supabase' is used but not initialized in the file (fallback)
    if (content.includes('supabase.') && !content.includes("require('../supabase_client')")) {
        // Add it after the last require if missing
        const lastRequireIndex = content.lastIndexOf('require(');
        if (lastRequireIndex !== -1) {
            const endOfLine = content.indexOf('\n', lastRequireIndex) + 1;
            content = content.slice(0, endOfLine) + "const supabase = require('../supabase_client');\n" + content.slice(endOfLine);
        }
    }

    fs.writeFileSync(filePath, content);
    console.log(`Deep Updated ${file}`);
});
