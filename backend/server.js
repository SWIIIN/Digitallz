// Simple server.js for Render deployment
const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Digitallz Backend on Render...');

// Check if we're in production
if (process.env.NODE_ENV === 'production') {
  // In production, run the compiled TypeScript
  const server = spawn('node', ['dist/app.js'], {
    stdio: 'inherit',
    cwd: __dirname
  });

  server.on('error', (err) => {
    console.error('❌ Server error:', err);
    process.exit(1);
  });

  server.on('exit', (code) => {
    console.log(`Server exited with code ${code}`);
    process.exit(code);
  });
} else {
  // In development, run with ts-node
  const server = spawn('npx', ['ts-node', 'src/app.ts'], {
    stdio: 'inherit',
    cwd: __dirname
  });

  server.on('error', (err) => {
    console.error('❌ Server error:', err);
    process.exit(1);
  });

  server.on('exit', (code) => {
    console.log(`Server exited with code ${code}`);
    process.exit(code);
  });
}
