const fs = require('fs');
const { execSync } = require('child_process');

// Simple parsing of .env
const envFile = fs.readFileSync('.env.production', 'utf-8');
const lines = envFile.split('\n');

for (const line of lines) {
  if (line.trim() && !line.startsWith('#')) {
    const [key, ...rest] = line.split('=');
    let value = rest.join('=');
    // Remove quotes
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    value = value.trim();
    if (key && value) {
      console.log(`Adding ${key}...`);
      try {
        execSync(`vercel env add ${key} production --value "${value}" --yes`, { stdio: 'inherit' });
        execSync(`vercel env add ${key} preview --value "${value}" --yes`, { stdio: 'inherit' });
        execSync(`vercel env add ${key} development --value "${value}" --yes`, { stdio: 'inherit' });
      } catch (err) {
        console.error(`Failed to add ${key}`);
      }
    }
  }
}
