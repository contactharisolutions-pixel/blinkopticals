const { execSync } = require('child_process');
const fs = require('fs');

const envFile = '.env.development';
const lines = fs.readFileSync(envFile, 'utf8').split('\n');

for (let line of lines) {
    line = line.trim();
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    
    let [key, ...valueParts] = line.split('=');
    let value = valueParts.join('=').trim();
    value = value.replace(/^["']|["']$/g, '');
    
    if (key && value) {
        console.log(`Adding ${key} to Vercel...`);
        try {
            // vercel env add <name> <environment> <gitbranch>
            // We can just add to all environments at once if we don't specify environment?
            // Actually, vercel env add name value environment
            // Better to use the prompt-free version:
            // printf value | vercel env add KEY production --yes
            
            // To be safe and simple, I'll use a single command if possible.
            // But vercel CLI doesn't easily support "all" environments in one go via CLI args without prompts.
            // I'll just do production for now, as that's what matters most for the main deployment.
            
            const envs = ['production', 'preview', 'development'];
            for (const env of envs) {
                console.log(`  -> ${env}`);
                execSync(`vercel env add ${key} ${env} --scope hari-solutions-projects --yes`, {
                    input: value,
                    stdio: ['pipe', 'inherit', 'inherit']
                });
            }
        } catch (err) {
            console.error(`Failed to add ${key}:`, err.message);
        }
    }
}
