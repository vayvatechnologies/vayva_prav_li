const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();

const { handleError } = require('./PravBackendServer/middlewares/errorHandler');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'PravFrontEndUI')));

 
 
// Initial Version 1 for Expense Tracker User Version

const apiVersion = "/api/v1"; 

app.use(`${apiVersion}/auth`, require('./PravBackendServer/routes/authRoutes'));
app.use(`${apiVersion}/applicationSettings`, require('./PravBackendServer/routes/applicationSettingsRoutes'));
app.use(`${apiVersion}/userDetail`, require('./PravBackendServer/routes/userDetailsRoutes'));
 
// Version 1 End



// Global error handler
app.use(handleError);
const PORT = process.env.PORT || 3001;
app.listen(PORT);

// npm install luxon
// npm install multer
