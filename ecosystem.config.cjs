module.exports = {
  apps: [
    {
      name: "microservicio-seguridad",
      script: "dist/app.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
      },
      error_file: "logs/error.log",
      out_file: "logs/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
    },
  ],
};
