import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';

const rootDir = resolve('.');
const frontendDir = resolve(rootDir, 'frontend');
const distDir = resolve(frontendDir, 'dist');
const publicDir = resolve(rootDir, 'public');

execSync('npm run build', {
  cwd: frontendDir,
  stdio: 'inherit',
});

if (!existsSync(distDir)) {
  throw new Error(`Frontend build output not found at ${distDir}`);
}

rmSync(publicDir, { recursive: true, force: true });
mkdirSync(publicDir, { recursive: true });
cpSync(distDir, publicDir, { recursive: true });

