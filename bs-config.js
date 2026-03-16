// bs-config.js
module.exports = {
  proxy: "http://localhost:3000",   // Your Node.js server
  files: ["public/**/*.*"],         // Watch frontend files
  port: 3001,                       // Browsersync UI port
  reloadDelay: 100,                // Delay to allow Node.js restart
};
