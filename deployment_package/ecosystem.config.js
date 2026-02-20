module.exports = {
  apps: [
    {
      name: "naturaloptions-admin",
      cwd: "/var/www/naturaloptions",
      script: "node_modules/.bin/next",
      args: "start --hostname 0.0.0.0",
      instances: process.env.PM2_INSTANCES || 2,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '512M',
      env_production: {
        NODE_ENV: 'production',
        PORT: process.env.PORT ? Number(process.env.PORT) : 3000,
        HOST: '0.0.0.0',
        BASEPATH: process.env.BASEPATH || "",
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || "http://194.146.39.176:3000",
        NODE_OPTIONS: '--max-old-space-size=768 --optimize-for-size'
      },
      error_file: '/var/www/naturaloptions/logs/pm2-error.log',
      out_file: '/var/www/naturaloptions/logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      listen_timeout: 10000,
      kill_timeout: 5000,
      wait_ready: true,
      instance_var: 'INSTANCE_ID',
      combine_logs: true,
      time: true
    }
  ]
}
