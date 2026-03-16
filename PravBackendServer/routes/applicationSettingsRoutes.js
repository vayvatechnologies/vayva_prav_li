const express = require('express');
const router = express.Router();
const { getApplicationSettting } = require('../controllers/ApplicationSettings/applicationSettingsController');
const { validateAppSettingRequest  } = require('../middlewares/ApplicationSettings/applicationSettingsValidate');

// Route: /api/v1/data/login
router.post('/getApplicationDetails', validateAppSettingRequest , getApplicationSettting);

  
module.exports = router;