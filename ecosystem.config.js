module.exports = {
  apps: [
    {
    name: "naturaloptions-admin",
    cwd: "/var/www/naturaloptions",
    script: "node_modules/.bin/next",
    args: "start",
      instances: 1, // Change to 'max' for cluster mode
      exec_mode: 'fork', // Change to 'cluster' for multiple instances
      watch: false,
      max_memory_restart: '1G',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        BASEPATH: "/admin",
        NEXTAUTH_URL: "http://102.212.246.251/admin"
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      listen_timeout: 10000,
      kill_timeout: 5000,
      wait_ready: true
    }
  ]
}
