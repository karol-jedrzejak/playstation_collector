const { spawn, execFileSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');
const backendPath = path.join(root, 'backend');
const frontendPath = path.join(root, 'frontend');

let backendProcess = null;
let frontendProcess = null;
let shuttingDown = false;

function stopAllContainers() {
  console.log('🧹 Clearing occupied ports (stopping active Docker containers)...\n');
  try {
    // Stops ALL active containers to prevent port conflicts
    execSync('docker stop $(docker ps -q)', { stdio: 'ignore' });
    console.log('✅ Ports cleared. Other containers have been stopped.\n');
  } catch (error) {
    // Ignored if no containers were running
    console.log('ℹ️ No active containers to stop.\n');
  }
}

function run(command, args, cwd) {
  return spawn(command, args, {
    cwd,
    shell: true,
    stdio: 'inherit',
  });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function dockerCompose(args) {
  return execFileSync('docker', ['compose', ...args], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

async function waitForMySQL() {
  const maxAttempts = 30;
  const interval = 2000;

  console.log('\nWaiting for MySQL to become healthy...\n');

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const output = dockerCompose([
        'ps',
        '--format',
        'json',
      ]);

      const containers = output
        .trim()
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line));

      const mysql = containers.find(
        (container) => container.Service === 'mysql'
      );

      if (mysql && mysql.Health === 'healthy') {
        console.log('MySQL is ready!\n');
        return;
      }

      console.log(
        `MySQL is not ready yet... (${attempt}/${maxAttempts})`
      );
    } catch (error) {
      console.log(
        `Waiting for Docker/MySQL... (${attempt}/${maxAttempts})`
      );
    }

    await sleep(interval);
  }

  throw new Error('MySQL did not become healthy in time.');
}

function startBackend() {
  console.log('Starting NestJS backend...\n');

  backendProcess = run(
    'npm',
    ['run', 'start:dev'],
    backendPath
  );
}

function startFrontend() {
  console.log('Starting Next.js frontend...\n');

  frontendProcess = run(
    'npm',
    ['run', 'dev'],
    frontendPath
  );
}

function shutdown() {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  console.log('\nStopping development servers...\n');

  if (backendProcess) {
    backendProcess.kill();
  }

  if (frontendProcess) {
    frontendProcess.kill();
  }

  console.log('Development servers stopped.');
  console.log('Docker containers are still running.');
  console.log('Use "npm run docker:down" to stop Docker.\n');

  process.exit(0);
}

async function main() {
  try {
    console.log('========================================');
    console.log(' PlayStation Collector - Development');
    console.log('========================================\n');

    stopAllContainers();

    console.log('Starting Docker containers...\n');

    dockerCompose(['up', '-d']);

    console.log('\nDocker containers started.');

    await waitForMySQL();

    startBackend();
    startFrontend();

    console.log('\n========================================');
    console.log(' PlayStation Collector is running!');
    console.log('========================================\n');

    console.log('Frontend:   http://localhost:3000');
    console.log('Backend:    http://localhost:3001');
    console.log('phpMyAdmin: http://localhost:8080');
    console.log('MySQL:      localhost:3306\n');

    console.log('Press Ctrl+C to stop backend and frontend.\n');
  } catch (error) {
    console.error('\nFailed to start development environment.');
    console.error(error.message);

    shutdown();
  }
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

main();