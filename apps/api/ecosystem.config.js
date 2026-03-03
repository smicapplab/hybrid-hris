module.exports = {
  apps: [
    {
      name: 'be-hris-api',
      script: 'dist/main.js',
      cwd: '/home/ec2-user/Projects/hybrid-hris/apps/api',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '1800M',
      min_uptime: '30s',
      autorestart: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      env: {
        NODE_ENV: 'production',
        PORT: '4000',
        NODE_OPTIONS:
          '--max-old-space-size=1536 --enable-source-maps --heapsnapshot-signal=SIGUSR2',
      },
    },
  ],
};