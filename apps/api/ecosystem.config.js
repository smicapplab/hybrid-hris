const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from the root .env file (two levels up)
dotenv.config({ path: path.join(__dirname, '../../.env') });

module.exports = {
  apps: [
    {
      name: 'be-hris-api',
      script: 'dist/main.js',
      cwd: './',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1800M',
      min_uptime: '30s',
      autorestart: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT: '4000',
        NODE_OPTIONS:
          '--max-old-space-size=1536 --enable-source-maps --heapsnapshot-signal=SIGUSR2',
      },
    },
  ],
};