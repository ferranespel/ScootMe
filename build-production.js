#!/usr/bin/env node
/**
 * Custom build script to handle production deployment
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔄 Building for production...');

try {
  // First clean the dist directory
  console.log('🧹 Cleaning dist directory...');
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }
  
  // Create required directories
  fs.mkdirSync(path.join('dist', 'public'), { recursive: true });
  
  // Build the client
  console.log('📦 Building client...');
  fs.mkdirSync(path.join('client', 'dist'), { recursive: true });
  execSync('NODE_ENV=production vite build --outDir client/dist', { stdio: 'inherit' });
  
  // Create a dummy index.html in the dist/public folder 
  // (will be replaced later, but needed for production startup)
  const tempIndexContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ScootMe</title>
</head>
<body>
  <p>Loading application...</p>
</body>
</html>`;
  
  fs.writeFileSync(path.join('dist', 'public', 'index.html'), tempIndexContent);
  
  // Build the server
  console.log('📦 Building server...');
  execSync('NODE_ENV=production esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist', 
    { stdio: 'inherit' });
  
  // Now copy the actual client build to the correct location
  console.log('📋 Copying client build...');
  const clientDistDir = path.join('client', 'dist');
  const serverPublicDir = path.join('dist', 'public');
  
  if (fs.existsSync(clientDistDir)) {
    // Copy all files from client/dist to dist/public
    const files = fs.readdirSync(clientDistDir);
    files.forEach(file => {
      const srcPath = path.join(clientDistDir, file);
      const destPath = path.join(serverPublicDir, file);
      
      if (fs.statSync(srcPath).isDirectory()) {
        fs.cpSync(srcPath, destPath, { recursive: true });
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    });
    
    console.log('✅ Client files copied successfully');
  } else {
    console.warn('⚠️ Client build directory not found, server may not serve static files correctly');
  }
  
  // Create .env file for production
  console.log('🔧 Creating production environment file...');
  const envContent = `NODE_ENV=production
PORT=5000`;
  fs.writeFileSync(path.join('dist', '.env'), envContent);
  
  console.log('✅ Production build completed successfully');
  console.log('📝 Run with: cd dist && node index.js');
} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}