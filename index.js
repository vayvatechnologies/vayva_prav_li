// index.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

const { handleError } = require('./PravBackendServer/middlewares/errorHandler');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'PravFrontEndUI')));

// API Versioning
const apiVersion = "/api/v1"; 

app.use(`${apiVersion}/auth`, require('./PravBackendServer/routes/authRoutes'));
app.use(`${apiVersion}/applicationSettings`, require('./PravBackendServer/routes/applicationSettingsRoutes'));
app.use(`${apiVersion}/userDetail`, require('./PravBackendServer/routes/userDetailsRoutes'));

// Global error handler
app.use(handleError);

// Use the port Render provides, or fallback for local dev
const PORT = process.env.PORT || 3001;

// Start server and log
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// npm install luxon
// npm install multer
