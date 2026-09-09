import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

// ANSI color styling
const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
  bold: '\x1b[1m'
};

const backendPrefix = `${colors.cyan}${colors.bold}[backend]${colors.reset}`;
const frontendPrefix = `${colors.green}${colors.bold}[frontend]${colors.reset}`;
const systemPrefix = `${colors.yellow}${colors.bold}[system]${colors.reset}`;

function prefixStream(stream, prefix, isError = false) {
  if (!stream) return;
  let buffer = '';
  const target = isError ? process.stderr : process.stdout;

  stream.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop(); // keep unterminated line segment
    for (const line of lines) {
      if (line.trim().length > 0) {
        target.write(`${prefix} ${line}\n`);
      }
    }
  });

  stream.on('end', () => {
    if (buffer.trim().length > 0) {
      target.write(`${prefix} ${buffer}\n`);
      buffer = '';
    }
  });
}

console.log(`${systemPrefix} Starting Hostel Management Backend & Frontend...`);
console.log(`${systemPrefix} Press ${colors.bold}Ctrl+C${colors.reset} to stop both processes.\n`);

const sharedEnv = {
  ...process.env,
  FORCE_COLOR: '1'
};

// 1. Start backend server (nodemon server.js)
const backend = spawn(npmCmd, ['run', 'dev'], {
  cwd: path.join(__dirname, 'server'),
  env: sharedEnv,
  shell: isWindows,
  stdio: ['pipe', 'pipe', 'pipe']
});

prefixStream(backend.stdout, backendPrefix);
prefixStream(backend.stderr, backendPrefix, true);

// 2. Start frontend (vite)
const frontend = spawn(npmCmd, ['run', 'dev:client'], {
  cwd: __dirname,
  env: sharedEnv,
  shell: isWindows,
  stdio: ['pipe', 'pipe', 'pipe']
});

prefixStream(frontend.stdout, frontendPrefix);
prefixStream(frontend.stderr, frontendPrefix, true);

// Forward terminal inputs (e.g., 'rs' for nodemon, vite shortcuts)
if (process.stdin.isTTY) {
  process.stdin.setRawMode?.(false);
  process.stdin.on('data', (data) => {
    const input = data.toString();
    if (input.trim() === 'rs') {
      backend.stdin?.write(data);
    } else {
      frontend.stdin?.write(data);
    }
  });
}

// Graceful shutdown handling
let isTerminating = false;

function terminate(signal = 'SIGINT') {
  if (isTerminating) return;
  isTerminating = true;

  console.log(`\n${systemPrefix} Stopping all processes (${signal})...`);

  const killProcess = (child) => {
    if (child && !child.killed) {
      try {
        child.kill(signal);
      } catch (err) {
        // process may have already exited
      }
    }
  };

  killProcess(backend);
  killProcess(frontend);

  // Force exit if processes do not terminate quickly
  setTimeout(() => {
    process.exit(0);
  }, 1000);
}

process.on('SIGINT', () => terminate('SIGINT'));
process.on('SIGTERM', () => terminate('SIGTERM'));

backend.on('exit', (code, signal) => {
  if (!isTerminating && code !== 0 && code !== null) {
    console.error(`${backendPrefix} ${colors.red}Backend exited with code ${code || signal}${colors.reset}`);
    terminate('SIGTERM');
  }
});

frontend.on('exit', (code, signal) => {
  if (!isTerminating && code !== 0 && code !== null) {
    console.error(`${frontendPrefix} ${colors.red}Frontend exited with code ${code || signal}${colors.reset}`);
    terminate('SIGTERM');
  }
});
