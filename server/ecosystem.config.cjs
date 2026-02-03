// PM2 Ecosystem Configuration for Regionify
// This file should be placed on the server at: $APP_DIR/shared/ecosystem.config.cjs
//
// IMPORTANT: This is a template. Copy this file to your server and update the paths.
// The APP_DIR should match your GitHub secret.
//
// Example setup on server:
// 1. Copy this file to /home/username/apps/regionify/shared/ecosystem.config.cjs
// 2. Update APP_DIR below to match your actual path
// 3. First deploy will use this config

const APP_DIR = '/home/username/apps/regionify'; // UPDATE THIS PATH

module.exports = {
  apps: [
    {
      name: 'regionify',
      script: 'dist/index.js',
      cwd: `${APP_DIR}/server/current`,
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
      // Logging
      error_file: `${APP_DIR}/logs/error.log`,
      out_file: `${APP_DIR}/logs/out.log`,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Restart policy
      exp_backoff_restart_delay: 100,
      max_restarts: 10,
      min_uptime: '10s',
    },
  ],
};
