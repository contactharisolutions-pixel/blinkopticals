const fs = require('fs');
const cp = require('child_process');

try {
    const devEnv = fs.readFileSync('.env.development', 'utf8');
    
    // Parse the env manually
    const lines = devEnv.split('\n');
    const envs = {};
    for (const line of lines) {
        if (!line || line.startsWith('#')) continue;
        const eqIdx = line.indexOf('=');
        if (eqIdx > -1) {
            const key = line.substring(0, eqIdx).trim();
            let value = line.substring(eqIdx + 1).trim();
            if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
            }
            envs[key] = value;
        }
    }

    const keysToAdd = ['JWT_SECRET', 'GEMINI_API_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];

    for (const key of keysToAdd) {
        if (envs[key]) {
            console.log(`Adding ${key}...`);
            try {
                cp.execSync(`npx vercel env rm ${key} production -y`, { stdio: 'ignore' });
            } catch(e) {}
            cp.execSync(`npx vercel env add ${key} production`, { input: envs[key], stdio: ['pipe', 'inherit', 'inherit'] });
            console.log(`Added ${key} successfully.`);
        } else {
            console.log(`Key ${key} not found in .env.development`);
        }
    }
} catch(err) {
    console.error(err);
}
