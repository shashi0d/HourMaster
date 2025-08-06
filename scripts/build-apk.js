#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Building Offline APK for HourMaster...\n');

// Check if we're in the right directory
if (!fs.existsSync('package.json')) {
  console.error('❌ Please run this script from the project root directory');
  process.exit(1);
}

try {
  // Step 1: Install Capacitor if not already installed
  console.log('📦 Checking Capacitor installation...');
  if (!fs.existsSync('node_modules/@capacitor/core')) {
    console.log('Installing Capacitor...');
    execSync('npm install @capacitor/core @capacitor/cli @capacitor/android', { stdio: 'inherit' });
  }

  // Step 2: Initialize Capacitor if not already done
  if (!fs.existsSync('capacitor.config.ts')) {
    console.log('🔧 Initializing Capacitor...');
    execSync('npx cap init HourMaster com.hourmaster.app --web-dir=dist', { stdio: 'inherit' });
  }

  // Step 3: Build the web app
  console.log('🏗️  Building web app...');
  execSync('npm run build', { stdio: 'inherit' });

  // Step 4: Add Android platform if not exists
  if (!fs.existsSync('android')) {
    console.log('📱 Adding Android platform...');
    execSync('npx cap add android', { stdio: 'inherit' });
  }

  // Step 5: Sync the build
  console.log('🔄 Syncing with Android project...');
  execSync('npx cap sync', { stdio: 'inherit' });

  // Step 6: Build APK directly
  console.log('🔨 Building APK...');
  console.log('📋 This may take a few minutes...');
  
  // Check if gradlew exists and is executable
  const gradlewPath = path.join('android', 'gradlew');
  if (fs.existsSync(gradlewPath)) {
    // Make gradlew executable on Unix systems
    try {
      fs.chmodSync(gradlewPath, '755');
    } catch (e) {
      // Ignore on Windows
    }
  }

  // Build APK
  execSync('cd android && ./gradlew assembleDebug', { stdio: 'inherit' });

  // Check if APK was created
  const apkPath = path.join('android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
  
  if (fs.existsSync(apkPath)) {
    const stats = fs.statSync(apkPath);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log('\n✅ APK built successfully!');
    console.log(`📱 APK Location: ${apkPath}`);
    console.log(`📊 File Size: ${fileSizeInMB} MB`);
    console.log('\n📋 Next steps:');
    console.log('   1. Transfer the APK to your Android device');
    console.log('   2. Enable "Install from unknown sources" in Android settings');
    console.log('   3. Install the APK');
    console.log('   4. Test offline functionality');
    console.log('\n🎉 Your app is now ready for offline use!');
  } else {
    console.error('❌ APK not found. Build may have failed.');
    console.log('🔧 Try running manually: cd android && ./gradlew assembleDebug');
  }

} catch (error) {
  console.error('❌ Error building APK:', error.message);
  console.log('\n🔧 Troubleshooting:');
  console.log('   1. Make sure Java JDK 11+ is installed');
  console.log('   2. Make sure Android SDK is installed and ANDROID_HOME is set');
  console.log('   3. Try running: npm install');
  console.log('   4. Check the error message above');
  console.log('\n💡 Alternative: Use PWA Builder (no setup required)');
  console.log('   1. Deploy to GitHub Pages: npm run build && git add dist && git commit -m "Build" && git push');
  console.log('   2. Go to: https://www.pwabuilder.com/');
  console.log('   3. Enter your GitHub Pages URL');
  console.log('   4. Download APK');
  process.exit(1);
} 