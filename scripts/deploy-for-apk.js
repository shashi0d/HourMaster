#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';

console.log('🚀 Preparing app for APK generation...\n');

try {
  // Step 1: Build the app
  console.log('🏗️  Building app...');
  execSync('npm run build', { stdio: 'inherit' });

  // Step 2: Check if dist folder exists
  if (!fs.existsSync('dist')) {
    console.error('❌ Build failed - dist folder not found');
    process.exit(1);
  }

  console.log('\n✅ Build completed successfully!');
  console.log('\n📋 Next steps for APK:');
  console.log('\n🎯 Option 1: GitHub Pages (Recommended)');
  console.log('   1. Create a GitHub repository');
  console.log('   2. Push your code: git add . && git commit -m "Initial commit" && git push');
  console.log('   3. Enable GitHub Pages in repo settings');
  console.log('   4. Deploy: git add dist && git commit -m "Build for APK" && git push');
  console.log('   5. Go to: https://www.pwabuilder.com/');
  console.log('   6. Enter your GitHub Pages URL');
  console.log('   7. Download APK');
  
  console.log('\n🎯 Option 2: Netlify (Easiest)');
  console.log('   1. Go to: https://netlify.com/');
  console.log('   2. Drag and drop the "dist" folder');
  console.log('   3. Get your URL (e.g., https://your-app.netlify.app)');
  console.log('   4. Go to: https://www.pwabuilder.com/');
  console.log('   5. Enter your Netlify URL');
  console.log('   6. Download APK');
  
  console.log('\n🎯 Option 3: Any Web Hosting');
  console.log('   1. Upload the "dist" folder to any web hosting');
  console.log('   2. Get your URL');
  console.log('   3. Use PWA Builder with that URL');
  
  console.log('\n📱 Your APK will be fully offline and work without internet!');
  console.log('🔒 All data will be stored locally on the device.');

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
} 