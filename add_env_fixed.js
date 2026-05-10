const fs = require('fs');
const { execSync } = require('child_process');

const envFile = fs.readFileSync('.env.production', 'utf-8');
const lines = envFile.split('\n');

for (const line of lines) {
  if (line.trim() && !line.startsWith('#')) {
    const [key, ...rest] = line.split('=');
    let value = rest.join('=');
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    value = value.trim();
    if (key && value && key !== 'SUPABASE_URL' && key !== 'SUPABASE_ANON_KEY') {
      console.log(`Adding ${key}...`);
      try {
        execSync(`npx vercel env add ${key} production --value "${value}" --yes`);
        console.log(`Success: ${key}`);
      } catch (err) {
        console.error(`Failed to add ${key}: ${err.message}`);
      }
    }
  }
}
console.log('Finished adding variables!');
