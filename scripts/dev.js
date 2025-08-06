#!/usr/bin/env node

const { spawn } = require('child_process');
const os = require('os');

console.log('🚀 Starting HourMaster development server...');
console.log('📱 PWA will be available at: http://localhost:3000');
console.log('🌐 For mobile testing, use your local IP:', getLocalIP());
console.log('');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      if (interface.family === 'IPv4' && !interface.internal) {
        return interface.address;
      }
    }
  }
  return 'localhost';
}

const dev = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

dev.on('error', (error) => {
  console.error('❌ Failed to start development server:', error);
  process.exit(1);
});

dev.on('close', (code) => {
  console.log(`\n👋 Development server stopped with code ${code}`);
  process.exit(code);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down development server...');
  dev.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down development server...');
  dev.kill('SIGTERM');
}); 