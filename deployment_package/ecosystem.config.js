module.exports = {
  apps: [
    {
      name: "naturaloptions-admin",
      cwd: "/var/www/naturaloptions",
      script: "node_modules/.bin/next",
      args: "start",
      instances: process.env.PM2_INSTANCES || 2, // Use 2 instances or configured value
      exec_mode: 'cluster', // Enable cluster mode for load balancing
      watch: false,
      max_memory_restart: '800M', // Reduced from 1G to restart earlier
      env_production: {
        NODE_ENV: 'production',
        PORT: process.env.PORT ? Number(process.env.PORT) : 3000,
        BASEPATH: process.env.BASEPATH || "/admin",
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || "https://102.212.246.251.sslip.io/admin",
        // Optimize Node.js memory
        NODE_OPTIONS: '--max-old-space-size=768 --optimize-for-size'
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
      wait_ready: true,
      // Performance tuning
      instance_var: 'INSTANCE_ID',
      combine_logs: true,
      time: true
    }
  ]
}
