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
        PORT: process.env.PORT ? Number(process.env.PORT) : 3000,
        BASEPATH: process.env.BASEPATH || "/admin",
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || "https://102.220.12.78.sslip.io/admin"
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
      wait_ready: false
    }
  ]
}
